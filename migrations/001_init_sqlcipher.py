"""
FirstReport — Database Initialisation
======================================
Creates the SQLite case-history database used by extended_routes.py.

SQLCipher (encrypted) is used if the sqlcipher3 package is available;
plain sqlite3 is used as a fallback so the app always works.

Usage:
    python migrations/001_init_sqlcipher.py
    python migrations/001_init_sqlcipher.py --pin 9876   # custom PIN
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent.parent / "firstReport_cases.db"


def get_connection(pin: str | None = None):
    """Return a database connection (SQLCipher if available, sqlite3 otherwise)."""
    try:
        from sqlcipher3 import dbapi2 as sqlite
        conn = sqlite.connect(str(DB_PATH))
        if pin:
            conn.execute(f"PRAGMA key = '{pin}'")
        print(f"✓ Using SQLCipher (encrypted) at {DB_PATH}")
    except ImportError:
        import sqlite3
        conn = sqlite3.connect(str(DB_PATH))
        print(f"ℹ️  sqlcipher3 not installed — using plain SQLite at {DB_PATH}")
        print("   Install with: pip install sqlcipher3  (requires libsqlcipher-dev)")
    return conn


def create_tables(conn) -> None:
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id           TEXT PRIMARY KEY,
            case_type    TEXT,
            bnss_section TEXT,
            offense      TEXT,
            language     TEXT DEFAULT 'hi-IN',
            status       TEXT DEFAULT 'generated',
            share_method TEXT,
            created_at   TEXT NOT NULL,
            session_id   TEXT UNIQUE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sync_queue (
            id           TEXT PRIMARY KEY,
            session_id   TEXT NOT NULL,
            share_method TEXT NOT NULL,
            share_target TEXT,
            encrypted    INTEGER DEFAULT 0,
            status       TEXT DEFAULT 'pending',
            retries      INTEGER DEFAULT 0,
            last_error   TEXT,
            created_at   TEXT NOT NULL,
            updated_at   TEXT
        )
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_cases_created    ON cases(created_at DESC);
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_queue_status     ON sync_queue(status);
    """)

    conn.commit()
    print("✓ Tables created: cases, sync_queue")


def seed_demo(conn) -> None:
    """Insert one demo row for testing."""
    import uuid
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO cases VALUES (?,?,?,?,?,?,?,?,?)",
        (str(uuid.uuid4()), "women_dv", "§85", "घरेलू हिंसा",
         "hi-IN", "generated", None, datetime.utcnow().isoformat(), "demo_session"),
    )
    conn.commit()
    print("✓ Demo row inserted")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialise FirstReport SQLite database")
    parser.add_argument("--pin",  default=None, help="SQLCipher PIN (ignored for plain sqlite3)")
    parser.add_argument("--seed", action="store_true", help="Insert demo row")
    args = parser.parse_args()

    conn = get_connection(args.pin)
    create_tables(conn)
    if args.seed:
        seed_demo(conn)
    conn.close()
    print(f"\n✅ Database ready: {DB_PATH}")
