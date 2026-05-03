"""
FirstReport — Cache Manager
==============================
SQLite local cache for completed DocumentPackages.
Max 50 sessions stored locally.
"""

import os
import sqlite3
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "sessions.sqlite")


def _get_db():
    """Get or create the sessions database."""
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
    Enforces max 50 sessions — deletes oldest if exceeded.
    """
    try:
        conn = _get_db()
        
        # Enforce max 50 sessions
        count = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
        if count >= 50:
            conn.execute("""
                DELETE FROM sessions WHERE session_id IN (
                    SELECT session_id FROM sessions 
                    ORDER BY created_at ASC LIMIT ?
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
            json.dumps(metadata or {}, ensure_ascii=False)
        ))
        
        conn.commit()
        conn.close()
        logger.info(f"Session saved: {session_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to save session: {e}")
        return False


def get_session(session_id: str) -> dict:
    """Retrieve a saved session by ID."""
    try:
        conn = _get_db()
        row = conn.execute(
            "SELECT * FROM sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        conn.close()
        
        if row:
            return {
                "session_id": row[0],
                "victim_name": row[1],
                "station_name": row[2],
                "state": row[3],
                "bnss_section": row[4],
                "offense_name": row[5],
                "created_at": row[6],
                "sp_complaint": row[7],
                "dm_petition": row[8],
                "hc_writ": row[9],
                "accountability_doc": row[10],
                "telegram_sent": bool(row[11]),
                "metadata": json.loads(row[12] if row[12] else "{}"),
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
    """Mark a session as sent via Telegram."""
    try:
        conn = _get_db()
        conn.execute(
            "UPDATE sessions SET telegram_sent = 1 WHERE session_id = ?",
            (session_id,)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to mark telegram sent: {e}")
