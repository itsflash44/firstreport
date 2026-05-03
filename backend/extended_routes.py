"""
FirstReport — Extended FastAPI Routes
======================================
Adds to the existing backend/main.py:
  • POST /api/tts-proxy          — Sarvam bulbul:v3 TTS (keeps API key server-side)
  • POST /api/share-document     — 8-method document sharing
  • POST /api/encrypt-pdf        — Server-side AES-256-GCM encryption
  • GET  /api/case-history       — SQLite case history (lightweight, no SQLCipher dep)
  • POST /api/sync-queue         — Replay offline queue items

Include in main.py with:
    from backend.extended_routes import router as extended_router
    app.include_router(extended_router)

Or simply paste the route functions directly into main.py.
"""

import os
import json
import sqlite3
import logging
import smtplib
import tempfile
from datetime import datetime
from pathlib import Path
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email import encoders

import requests
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from backend.encryption_utils import encrypt_bytes, decrypt_bytes

logger = logging.getLogger(__name__)
router = APIRouter()

SARVAM_API_KEY    = os.environ.get("SARVAM_API_KEY", "")
TELEGRAM_TOKEN    = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID  = os.environ.get("TELEGRAM_CHAT_ID", "")
OUTPUT_DIR        = Path(__file__).parent.parent / "output"
DB_PATH           = Path(__file__).parent.parent / "firstReport_cases.db"

# ── Speaker map: priya works across all 11 languages ─────────────────────────
SARVAM_SPEAKER: dict[str, str] = {
    "hi-IN": "priya",
    "en-IN": "ishita",
    # For all other languages, omit speaker field → Sarvam picks best default
}


# ═══════════════════════════════════════════════════════════════════════════════
# TTS PROXY
# ═══════════════════════════════════════════════════════════════════════════════

class TTSRequest(BaseModel):
    text: str
    language: str = "hi-IN"


@router.post("/api/tts-proxy")
async def tts_proxy(req: TTSRequest):
    """
    Proxy Sarvam bulbul:v3 TTS.
    Returns audio/wav binary — keeps SARVAM_API_KEY server-side.
    Speaker 'priya' is used for hi-IN and en-IN; Sarvam default for the rest.
    """
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=503, detail="SARVAM_API_KEY not configured")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="No text provided")

    payload: dict = {
        "inputs": [req.text],
        "target_language_code": req.language,
        "model": "bulbul:v3",
    }
    speaker = SARVAM_SPEAKER.get(req.language)
    if speaker:
        payload["speaker"] = speaker

    import base64
    import io
    from fastapi.responses import StreamingResponse

    try:
        resp = requests.post(
            "https://api.sarvam.ai/text-to-speech",
            headers={
                "api-subscription-key": SARVAM_API_KEY,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        audios = data.get("audios") or []
        if not audios or not audios[0]:
            raise HTTPException(status_code=502, detail="Sarvam returned empty audio")

        audio_bytes = base64.b64decode(audios[0])
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/wav",
            headers={"Cache-Control": "public, max-age=3600"},
        )

    except requests.HTTPError as e:
        logger.error(f"Sarvam TTS error: {e.response.status_code} {e.response.text[:200]}")
        raise HTTPException(status_code=502, detail=f"Sarvam error {e.response.status_code}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS proxy exception: {e}")
        raise HTTPException(status_code=502, detail="TTS unavailable")


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENT SHARING
# ═══════════════════════════════════════════════════════════════════════════════

class ShareRequest(BaseModel):
    document_id: str
    share_method: str   # telegram | email | whatsapp | drive | dropbox | download | print | text
    share_target: str | None = None
    encrypted: bool = False
    user_pin: str | None = None


@router.post("/api/share-document")
async def share_document(req: ShareRequest):
    """
    Share a generated document set via the requested method.
    For offline queue replay: same endpoint, same payload.
    """
    # Find PDFs for this session
    prefix  = req.document_id[:8]
    pdf_map = {}
    for path in OUTPUT_DIR.glob(f"*_{prefix}.pdf"):
        key = path.name.rsplit(f"_{prefix}.pdf", 1)[0]
        pdf_map[key] = path.read_bytes()

    if not pdf_map:
        raise HTTPException(status_code=404, detail="No documents found for this session")

    # Optionally encrypt each PDF before sending
    if req.encrypted and req.user_pin:
        pdf_map = {k: encrypt_bytes(v, req.user_pin) for k, v in pdf_map.items()}

    method = req.share_method.lower()

    if method == "telegram":
        return await _share_telegram(pdf_map, req.document_id)
    elif method == "email":
        return await _share_email(pdf_map, req.share_target, req.document_id)
    elif method == "download":
        # Return first PDF for direct download
        first_key, first_bytes = next(iter(pdf_map.items()))
        tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        tmp.write(first_bytes)
        tmp.close()
        return FileResponse(tmp.name, filename=f"FirstReport_{first_key}_{prefix}.pdf",
                            media_type="application/pdf")
    elif method == "text":
        return await _extract_text(pdf_map)
    elif method in ("whatsapp", "drive", "dropbox", "print"):
        # Placeholder — real integrations require OAuth tokens
        return JSONResponse({"status": "queued", "method": method,
                             "note": f"{method} integration requires OAuth setup in .env"})
    else:
        raise HTTPException(status_code=400, detail=f"Unknown share method: {method}")


async def _share_telegram(pdf_map: dict, session_id: str) -> dict:
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        raise HTTPException(status_code=503, detail="Telegram not configured")

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendDocument"
    results = []

    for key, data in pdf_map.items():
        try:
            resp = requests.post(
                url,
                data={"chat_id": TELEGRAM_CHAT_ID, "caption": f"FirstReport — {key}"},
                files={"document": (f"{key}_{session_id[:8]}.pdf", data, "application/pdf")},
                timeout=30,
            )
            results.append({"key": key, "ok": resp.ok, "status": resp.status_code})
        except Exception as e:
            results.append({"key": key, "ok": False, "error": str(e)})

    all_ok = all(r["ok"] for r in results)
    return {"status": "sent" if all_ok else "partial", "method": "telegram", "results": results}


async def _share_email(pdf_map: dict, to_email: str | None, session_id: str) -> dict:
    smtp_server   = os.environ.get("SMTP_SERVER")
    smtp_port     = int(os.environ.get("SMTP_PORT", 587))
    email_from    = os.environ.get("EMAIL_FROM")
    email_password = os.environ.get("EMAIL_PASSWORD")

    if not all([smtp_server, email_from, email_password, to_email]):
        return {"status": "queued", "method": "email",
                "note": "Email not configured — add SMTP_SERVER, EMAIL_FROM, EMAIL_PASSWORD, and provide share_target email"}

    msg = MIMEMultipart()
    msg["From"]    = email_from
    msg["To"]      = to_email
    msg["Subject"] = f"FirstReport — कानूनी दस्तावेज़ ({session_id[:8]})"
    msg.attach(MIMEText(
        "नमस्ते,\n\nआपके FirstReport दस्तावेज़ संलग्न हैं।\n\n"
        "NALSA हेल्पलाइन: 15100\n\n"
        "⚠️ यह दस्तावेज़ AI द्वारा तैयार है। यह कानूनी सलाह नहीं है।",
        "plain", "utf-8"
    ))

    for key, data in pdf_map.items():
        part = MIMEBase("application", "octet-stream")
        part.set_payload(data)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", "attachment",
                        filename=f"FirstReport_{key}_{session_id[:8]}.pdf")
        msg.attach(part)

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(email_from, email_password)
            server.send_message(msg)
        return {"status": "sent", "method": "email", "target": to_email}
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        raise HTTPException(status_code=502, detail=f"Email failed: {e}")


async def _extract_text(pdf_map: dict) -> dict:
    """
    Extract plain text from PDFs using pdfplumber (if available).
    Falls back to byte-count summary.
    """
    try:
        import pdfplumber, io
        texts = {}
        for key, data in pdf_map.items():
            with pdfplumber.open(io.BytesIO(data)) as pdf:
                texts[key] = "\n".join(p.extract_text() or "" for p in pdf.pages)
        return {"status": "extracted", "texts": texts}
    except ImportError:
        return {"status": "unavailable", "note": "pip install pdfplumber for text extraction"}


# ═══════════════════════════════════════════════════════════════════════════════
# ENCRYPTION ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/api/encrypt-pdf")
async def encrypt_pdf_endpoint(file: UploadFile = File(...), user_pin: str = ""):
    if not user_pin or len(user_pin) < 4:
        raise HTTPException(status_code=400, detail="PIN must be at least 4 characters")
    data      = await file.read()
    encrypted = encrypt_bytes(data, user_pin)
    import io
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.BytesIO(encrypted),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename=encrypted_{file.filename}"},
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CASE HISTORY (SQLite — no SQLCipher dep required)
# ═══════════════════════════════════════════════════════════════════════════════

def _get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id           TEXT PRIMARY KEY,
            case_type    TEXT,
            bnss_section TEXT,
            offense      TEXT,
            language     TEXT,
            status       TEXT DEFAULT 'generated',
            share_method TEXT,
            created_at   TEXT,
            session_id   TEXT
        )
    """)
    conn.commit()
    return conn


class CaseSaveRequest(BaseModel):
    session_id: str
    case_type: str | None = None
    bnss_section: str | None = None
    offense: str | None = None
    language: str = "hi-IN"
    status: str = "generated"
    share_method: str | None = None


@router.post("/api/case-history/save")
async def save_case(req: CaseSaveRequest):
    import uuid
    conn = _get_db()
    conn.execute(
        "INSERT OR REPLACE INTO cases VALUES (?,?,?,?,?,?,?,?,?)",
        (str(uuid.uuid4()), req.case_type, req.bnss_section, req.offense,
         req.language, req.status, req.share_method,
         datetime.utcnow().isoformat(), req.session_id)
    )
    conn.commit()
    conn.close()
    return {"saved": True}


@router.get("/api/case-history")
async def get_case_history(limit: int = 50):
    conn  = _get_db()
    rows  = conn.execute(
        "SELECT * FROM cases ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return {"cases": [dict(r) for r in rows]}


# ═══════════════════════════════════════════════════════════════════════════════
# OFFLINE QUEUE SYNC
# ═══════════════════════════════════════════════════════════════════════════════

class QueueItem(BaseModel):
    documentId: str
    shareMethod: str
    target: str | None = None
    encrypted: bool = False
    userPin: str | None = None


@router.post("/api/sync-queue")
async def sync_queue(items: list[QueueItem]):
    results = []
    for item in items:
        try:
            result = await share_document(ShareRequest(
                document_id=item.documentId,
                share_method=item.shareMethod,
                share_target=item.target,
                encrypted=item.encrypted,
                user_pin=item.userPin,
            ))
            results.append({"id": item.documentId, "status": "synced", "result": result})
        except Exception as e:
            results.append({"id": item.documentId, "status": "failed", "error": str(e)})

    synced = sum(1 for r in results if r["status"] == "synced")
    return {"synced": synced, "total": len(results), "results": results}
