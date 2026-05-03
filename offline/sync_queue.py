"""
FirstReport — Sync Queue (Telegram Delivery)
==============================================
If Telegram send fails (no network), add to queue.
When network returns, auto-retry.
Shows "Bheja jayega jab network aaye" status card to user.
"""

import os
import io
import json
import time
import threading
import logging
import requests
from datetime import datetime

from offline.network_check import is_offline, OFFLINE_MODE

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")

# In-memory send queue
_send_queue = []
_retry_thread = None
_retry_running = False


def send_document_telegram(
    pdf_bytes: bytes,
    filename: str,
    caption: str = "",
    chat_id: str = None,
) -> dict:
    """
    Send a PDF document via Telegram Bot API.
    
    Args:
        pdf_bytes: PDF file bytes
        filename: Filename for the document
        caption: Optional caption text
        chat_id: Telegram chat ID (defaults to env var)
    
    Returns:
        dict with 'success', 'error', 'queued' keys
    """
    chat_id = chat_id or TELEGRAM_CHAT_ID
    
    if not TELEGRAM_BOT_TOKEN:
        return {"success": False, "error": "Telegram bot token not set", "queued": False}
    
    if not chat_id:
        return {"success": False, "error": "Telegram chat ID not set", "queued": False}
    
    # If offline, queue for later
    if is_offline():
        _queue_send(pdf_bytes, filename, caption, chat_id)
        return {
            "success": False,
            "error": "OFFLINE",
            "queued": True,
            "message_hindi": "भेजा जाएगा जब नेटवर्क आए",
        }
    
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendDocument"
        files = {
            "document": (filename, io.BytesIO(pdf_bytes), "application/pdf")
        }
        data = {
            "chat_id": chat_id,
            "caption": caption[:1024] if caption else "",
            "parse_mode": "HTML",
        }
        
        response = requests.post(url, files=files, data=data, timeout=30)
        
        if response.status_code == 200:
            logger.info(f"Telegram send success: {filename}")
            return {"success": True, "error": None, "queued": False}
        else:
            error = f"Telegram API error {response.status_code}: {response.text}"
            logger.error(error)
            # Queue for retry
            _queue_send(pdf_bytes, filename, caption, chat_id)
            return {"success": False, "error": error, "queued": True}
    
    except requests.exceptions.ConnectionError:
        _queue_send(pdf_bytes, filename, caption, chat_id)
        return {
            "success": False,
            "error": "OFFLINE",
            "queued": True,
            "message_hindi": "भेजा जाएगा जब नेटवर्क आए",
        }
    except Exception as e:
        logger.error(f"Telegram send error: {e}")
        return {"success": False, "error": str(e), "queued": False}


def send_all_documents(
    documents: dict,
    session_id: str,
    victim_name: str = "पीड़ित",
    chat_id: str = None,
) -> dict:
    """
    Send all 4 documents via Telegram.
    
    Args:
        documents: Dict with 'sp_complaint', 'dm_petition', 'hc_writ', 'accountability_doc' bytes
        session_id: Session ID for filenames
        victim_name: Victim name for captions
        chat_id: Telegram chat ID
    
    Returns:
        dict with results for each document
    """
    results = {}
    
    doc_names = {
        "sp_complaint": ("SP_Complaint", "🚔 SP शिकायत — धारा 166 BNSS"),
        "dm_petition": ("DM_Petition", "🏛️ DM आवेदन — धारा 175(3) BNSS"),
        "hc_writ": ("HC_Writ", "⚖️ HC रिट याचिका — अनुच्छेद 226"),
        "accountability_doc": ("Officer_Accountability", "📋 अधिकारी जवाबदेही — धारा 166 BNSS"),
    }
    
    for key, (name, caption) in doc_names.items():
        if key in documents and documents[key]:
            filename = f"FirstReport_{name}_{session_id[:8]}.pdf"
            result = send_document_telegram(
                documents[key], filename, 
                f"{caption}\n{victim_name} — {session_id[:8]}",
                chat_id
            )
            results[key] = result
    
    return results


def _queue_send(pdf_bytes: bytes, filename: str, caption: str, chat_id: str):
    """Add a send to the retry queue."""
    _send_queue.append({
        "pdf_bytes": pdf_bytes,
        "filename": filename,
        "caption": caption,
        "chat_id": chat_id,
        "queued_at": datetime.now().isoformat(),
        "retries": 0,
    })
    logger.info(f"Queued for retry: {filename} (queue size: {len(_send_queue)})")


def get_queue_status() -> dict:
    """Get current queue status for UI."""
    if not _send_queue:
        return {
            "pending": 0,
            "status_hindi": "",
            "show_card": False,
        }
    return {
        "pending": len(_send_queue),
        "status_hindi": f"{len(_send_queue)} दस्तावेज़ भेजने बाकी — नेटवर्क आने पर भेजे जाएंगे",
        "show_card": True,
        "color": "orange",
        "tts_text": f"{len(_send_queue)} documents bheje jayenge jab network aaye",
    }


def _retry_worker():
    """Background thread that retries queued sends when network returns."""
    global _retry_running
    while _retry_running:
        if not is_offline() and _send_queue:
            # Try to send queued items
            items_to_retry = list(_send_queue)
            for item in items_to_retry:
                try:
                    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendDocument"
                    files = {
                        "document": (item["filename"], io.BytesIO(item["pdf_bytes"]), "application/pdf")
                    }
                    data = {
                        "chat_id": item["chat_id"],
                        "caption": item["caption"][:1024],
                    }
                    response = requests.post(url, files=files, data=data, timeout=30)
                    if response.status_code == 200:
                        _send_queue.remove(item)
                        logger.info(f"Retry success: {item['filename']}")
                    else:
                        item["retries"] += 1
                        if item["retries"] > 10:
                            _send_queue.remove(item)
                            logger.error(f"Max retries exceeded: {item['filename']}")
                except Exception as e:
                    item["retries"] += 1
                    logger.error(f"Retry failed: {e}")
        
        time.sleep(15)  # Check every 15 seconds


def start_retry_worker():
    """Start the background retry worker."""
    global _retry_thread, _retry_running
    if _retry_thread and _retry_thread.is_alive():
        return
    _retry_running = True
    _retry_thread = threading.Thread(target=_retry_worker, daemon=True)
    _retry_thread.start()
    logger.info("Telegram retry worker started")


def stop_retry_worker():
    """Stop the retry worker."""
    global _retry_running
    _retry_running = False
