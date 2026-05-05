"""
FirstReport — Supabase Python Client Singleton
================================================
Uses the service role key (bypasses RLS).
Import this module anywhere in the Python backend.
"""

import os
import logging
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env.local")
load_dotenv(Path(__file__).parent.parent / ".env")

logger = logging.getLogger(__name__)

_supabase = None


def get_supabase():
    """Return the Supabase client singleton, or None if not configured."""
    global _supabase
    if _supabase is not None:
        return _supabase

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        logger.warning("Supabase not configured — running without cloud sync")
        return None

    try:
        from supabase import create_client
        _supabase = create_client(url, key)
        logger.info("Supabase client initialised ✓")
        return _supabase
    except ImportError:
        logger.warning("supabase-py not installed — run: pip install supabase")
        return None
    except Exception as e:
        logger.error(f"Supabase init failed: {e}")
        return None
