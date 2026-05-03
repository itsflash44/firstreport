"""
FirstReport — Network Check
==============================
Pings Sarvam AI health endpoint to detect connectivity.
Sets OFFLINE_MODE flag. Runs every 30 seconds in background.

Note: Gemma runs locally on Kaggle GPU — it is NEVER network-dependent.
Only STT and Telegram delivery require network.
"""

import os
import time
import threading
import logging
import requests

logger = logging.getLogger(__name__)

# Global offline mode flag
OFFLINE_MODE = False
_check_thread = None
_running = False

SARVAM_HEALTH_URL = "https://api.sarvam.ai/health"
CHECK_INTERVAL = 30  # seconds


def check_network() -> bool:
    """
    Ping Sarvam AI health endpoint.
    Returns True if online, False if offline.
    """
    global OFFLINE_MODE
    try:
        response = requests.get(SARVAM_HEALTH_URL, timeout=5)
        if response.status_code == 200:
            OFFLINE_MODE = False
            return True
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
        pass
    except Exception as e:
        logger.debug(f"Network check error: {e}")
    
    OFFLINE_MODE = True
    return False


def is_offline() -> bool:
    """Check if we're in offline mode."""
    return OFFLINE_MODE


def set_offline(offline: bool = True):
    """Manually set offline mode (for testing)."""
    global OFFLINE_MODE
    OFFLINE_MODE = offline
    logger.info(f"OFFLINE_MODE manually set to {offline}")


def _background_check():
    """Background thread that checks network every 30 seconds."""
    global _running
    while _running:
        online = check_network()
        if online:
            logger.debug("Network check: ONLINE")
        else:
            logger.debug("Network check: OFFLINE")
        time.sleep(CHECK_INTERVAL)


def start_monitoring():
    """Start background network monitoring."""
    global _check_thread, _running
    if _check_thread and _check_thread.is_alive():
        return
    
    _running = True
    _check_thread = threading.Thread(target=_background_check, daemon=True)
    _check_thread.start()
    logger.info("Network monitoring started (every 30s)")


def stop_monitoring():
    """Stop background network monitoring."""
    global _running
    _running = False
    logger.info("Network monitoring stopped")


def get_status_display() -> dict:
    """Get network status for UI display."""
    if OFFLINE_MODE:
        return {
            "status": "offline",
            "status_hindi": "ऑफलाइन",
            "color": "red",
            "icon": "🔴",
            "message_hindi": "इंटरनेट नहीं है। ऐप काम करता रहेगा।",
            "tts_text": "Internet nahi hai. App kaam karta rahega.",
        }
    else:
        return {
            "status": "online", 
            "status_hindi": "ऑनलाइन",
            "color": "green",
            "icon": "🟢",
            "message_hindi": "इंटरनेट उपलब्ध है।",
            "tts_text": "Internet available hai.",
        }
