"""
FirstReport — Cache Manager
==============================
Dual-write: Supabase (cloud) first, SQLite (local) as fallback.
The app always works offline — Supabase writes are best-effort.
Max 50 sessions stored locally in SQLite.
"""

import os
import sqlite3
import json
import logging
from datetime import datetime

from backend.supabase_client import get_supabase

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "sessions.sqlite")


# ─────────────────────────────────────────────────────────────────────────────
# SQLite (local offline cache)
# ─────────────────────────────────────────────────────────────────────────────

def _get_db():
    """Get or create the local SQLite sessions database."""
    db_path = os.path.abspath(DB_PATH)
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            victim_name TEXT,
            station_name TEXT,
            state TEXT,
            bnss_section TEXT,
            offense_name TEXT,
            created_at TEXT,
            sp_complaint BLOB,
            dm_petition BLOB,
            hc_writ BLOB,
            accountability_doc BLOB,
            telegram_sent INTEGER DEFAULT 0,
            metadata_json TEXT
        )
    """)
    conn.commit()
    return conn


def _sqlite_save(session_id, victim_name, station_name, state, bnss_section,
                  offense_name, sp_complaint, dm_petition, hc_writ,
                  accountability_doc, metadata):
    try:
        conn = _get_db()
        count = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
        if count >= 50:
            conn.execute("""
                DELETE FROM sessions WHERE session_id IN (
                    SELECT session_id FROM sessions ORDER BY created_at ASC LIMIT ?
                )
            """, (count - 49,))
        conn.execute("""
            INSERT OR REPLACE INTO sessions
            (session_id, victim_name, station_name, state, bnss_section, offense_name,
             created_at, sp_complaint, dm_petition, hc_writ, accountability_doc, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id, victim_name, station_name, state, bnss_section, offense_name,
            datetime.now().isoformat(),
            sp_complaint, dm_petition, hc_writ, accountability_doc,
            json.dumps(metadata or {}, ensure_ascii=False),
        ))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"SQLite save failed: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Supabase (cloud sync — best-effort)
# ─────────────────────────────────────────────────────────────────────────────

def _supabase_save_session(session_id, victim_name, station_name, state,
                            bnss_section, offense_name):
    """Upsert a Session row into Supabase (no PDF bytes — those go to Storage)."""
    try:
        sb = get_supabase()
        if sb is None:
            return False
        sb.table("Session").upsert({
            "id": session_id,
            "incidentSummary": f"{victim_name} — {station_name} — {offense_name}",
            "language": "hi-IN",
            "urgencyLevel": 1,
            "personaId": "standard",
            "rawTranscriptEncrypted": "",
            "status": "DOCUMENTS_READY",
            "consentGiven": True,
        }).execute()
        return True
    except Exception as e:
        logger.warning(f"Supabase session save failed (will use SQLite): {e}")
        return False


def _supabase_upload_pdf(session_id: str, key: str, pdf_bytes: bytes) -> str | None:
    """Upload a PDF to Supabase Storage. Returns the storage path or None."""
    try:
        sb = get_supabase()
        if sb is None or not pdf_bytes:
            return None
        bucket = "firstReport-documents"
        path = f"documents/{session_id}/{key}.pdf"
        sb.storage.from_(bucket).upload(
            path, pdf_bytes,
            {"content-type": "application/pdf", "upsert": "true"}
        )
        return path
    except Exception as e:
        logger.warning(f"Supabase PDF upload failed for {key}: {e}")
        return None


def _supabase_save_document(session_id: str, doc_type: str, storage_path: str):
    """Insert a Document row after successful PDF upload."""
    try:
        sb = get_supabase()
        if sb is None:
            return
        sb.table("Document").insert({
            "sessionId": session_id,
            "docType": doc_type,
            "storagePath": storage_path,
            "status": "READY",
        }).execute()
    except Exception as e:
        logger.warning(f"Supabase Document row insert failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

DOC_TYPE_MAP = {
    "sp_complaint": "SP_COMPLAINT",
    "dm_petition": "DM_PETITION",
    "hc_writ": "HC_WRIT",
    "accountability_doc": "OFFICER_ACCOUNTABILITY",
}


def save_session(
    session_id: str,
    victim_name: str,
    station_name: str,
    state: str,
    bnss_section: str,
    offense_name: str,
    sp_complaint: bytes,
    dm_petition: bytes,
    hc_writ: bytes,
    accountability_doc: bytes,
    metadata: dict = None,
) -> bool:
    """
    Save a completed session with all 4 documents.
    Tries Supabase first (cloud), falls back to SQLite (offline).
    """
    # 1. Always save to local SQLite (immediate, offline-safe)
    local_ok = _sqlite_save(
        session_id, victim_name, station_name, state, bnss_section, offense_name,
        sp_complaint, dm_petition, hc_writ, accountability_doc, metadata,
    )

    # 2. Best-effort Supabase sync
    try:
        _supabase_save_session(session_id, victim_name, station_name, state, bnss_section, offense_name)
        docs = {
            "sp_complaint": sp_complaint,
            "dm_petition": dm_petition,
            "hc_writ": hc_writ,
            "accountability_doc": accountability_doc,
        }
        for key, pdf_bytes in docs.items():
            if pdf_bytes:
                path = _supabase_upload_pdf(session_id, key, pdf_bytes)
                if path:
                    _supabase_save_document(session_id, DOC_TYPE_MAP[key], path)
    except Exception as e:
        logger.warning(f"Supabase sync failed (SQLite fallback used): {e}")

    logger.info(f"Session saved: {session_id} (local={local_ok})")
    return local_ok


def get_session(session_id: str) -> dict:
    """Retrieve a session — checks Supabase first, then SQLite."""
    # Try Supabase first
    try:
        sb = get_supabase()
        if sb:
            result = sb.table("Session").select("*").eq("id", session_id).single().execute()
            if result.data:
                return {
                    "session_id": result.data.get("id"),
                    "victim_name": result.data.get("incidentSummary", ""),
                    "bnss_section": "",
                    "created_at": result.data.get("createdAt", ""),
                    "source": "supabase",
                }
    except Exception:
        pass

    # Fallback to SQLite
    try:
        conn = _get_db()
        row = conn.execute(
            "SELECT * FROM sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        conn.close()
        if row:
            return {
                "session_id": row[0], "victim_name": row[1],
                "station_name": row[2], "state": row[3],
                "bnss_section": row[4], "offense_name": row[5],
                "created_at": row[6], "sp_complaint": row[7],
                "dm_petition": row[8], "hc_writ": row[9],
                "accountability_doc": row[10],
                "telegram_sent": bool(row[11]),
                "metadata": json.loads(row[12] if row[12] else "{}"),
                "source": "sqlite",
            }
        return None
    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        return None


def list_sessions() -> list[dict]:
    """List all saved sessions (without document bytes)."""
    try:
        conn = _get_db()
        rows = conn.execute("""
            SELECT session_id, victim_name, station_name, state,
                   bnss_section, offense_name, created_at, telegram_sent
            FROM sessions ORDER BY created_at DESC
        """).fetchall()
        conn.close()
        return [{
            "session_id": r[0], "victim_name": r[1],
            "station_name": r[2], "state": r[3],
            "bnss_section": r[4], "offense_name": r[5],
            "created_at": r[6], "telegram_sent": bool(r[7]),
        } for r in rows]
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        return []


def mark_telegram_sent(session_id: str):
    """Mark a session as sent via Telegram (SQLite + Supabase)."""
    try:
        conn = _get_db()
        conn.execute(
            "UPDATE sessions SET telegram_sent = 1 WHERE session_id = ?", (session_id,)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to mark telegram sent: {e}")
    # Also update Supabase status
    try:
        sb = get_supabase()
        if sb:
            sb.table("Session").update({"status": "SENT"}).eq("id", session_id).execute()
    except Exception:
        pass
