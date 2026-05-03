"""
FirstReport — Escalation Chain
================================
SP complaint (immediate) → DM petition (day 3) → HC writ (day 18)
Each step has a countdown timer and specific BNSS legal basis.
"""

from datetime import datetime, timedelta
from core.schemas import EscalationStep, AuthorityContact
from legal.data.build_db import lookup_authority, build_authorities


def build_escalation_chain(state: str) -> list[EscalationStep]:
    """
    Build the 3-step escalation chain for a given state.
    
    Step 1: SP Complaint — submit immediately (S.166 BNSS)
    Step 2: DM Petition — unlocks day 3 (S.175(3) BNSS)
    Step 3: HC Writ — unlocks day 18 (Article 226 Constitution)
    
    Args:
        state: State code (e.g., 'uttar_pradesh')
    
    Returns:
        List of 3 EscalationStep objects
    """
    steps = []
    
    # Step 1: SP Complaint (immediate)
    sp_auth = lookup_authority(state, "SP")
    if sp_auth:
        steps.append(EscalationStep(
            level=1,
            authority=AuthorityContact(
                title=sp_auth["title_hindi"],
                name=sp_auth["name"],
                address=sp_auth["address_hindi"],
                district=sp_auth["district_hindi"],
                state=sp_auth.get("title", state),
                email=sp_auth.get("email"),
                phone=sp_auth.get("phone"),
            ),
            bnss_section="166",
            unlock_day=0,
            deadline_description_hindi="तुरंत भेजें — कोई प्रतीक्षा अवधि नहीं",
            document_type="sp_complaint"
        ))
    
    # Step 2: DM Petition (unlocks day 3)
    dm_auth = lookup_authority(state, "DM")
    if dm_auth:
        steps.append(EscalationStep(
            level=2,
            authority=AuthorityContact(
                title=dm_auth["title_hindi"],
                name=dm_auth["name"],
                address=dm_auth["address_hindi"],
                district=dm_auth["district_hindi"],
                state=dm_auth.get("title", state),
                email=dm_auth.get("email"),
                phone=dm_auth.get("phone"),
            ),
            bnss_section="175(3)",
            unlock_day=3,
            deadline_description_hindi="SP के जवाब के लिए 3 दिन इंतज़ार करें। अगर कोई कार्रवाई नहीं हो तो यह आवेदन भेजें।",
            document_type="dm_petition"
        ))
    
    # Step 3: HC Writ (unlocks day 18)
    hc_auth = lookup_authority(state, "HC")
    if hc_auth:
        steps.append(EscalationStep(
            level=3,
            authority=AuthorityContact(
                title=hc_auth["title_hindi"],
                name=hc_auth["name"],
                address=hc_auth["address_hindi"],
                district=hc_auth["district_hindi"],
                state=hc_auth.get("title", state),
                email=hc_auth.get("email"),
                phone=hc_auth.get("phone"),
            ),
            bnss_section="Article 226 Constitution",
            unlock_day=18,
            deadline_description_hindi="DM के जवाब के लिए 15 दिन और इंतज़ार करें (कुल 18 दिन)। अगर कोई कार्रवाई नहीं हो तो उच्च न्यायालय में रिट याचिका दायर करें।",
            document_type="hc_writ"
        ))
    
    return steps


def get_countdown_timers(created_date: str) -> list[dict]:
    """
    Calculate live countdown timers for each escalation step.
    
    Args:
        created_date: ISO format date string of when the session was created
    
    Returns:
        List of dicts with step info and countdown
    """
    try:
        created = datetime.fromisoformat(created_date)
    except (ValueError, TypeError):
        created = datetime.now()
    
    now = datetime.now()
    
    timers = [
        {
            "step": 1,
            "label_hindi": "SP शिकायत",
            "status": "ready",
            "status_hindi": "तैयार — अभी भेजें",
            "countdown_text": "अभी भेजें",
            "days_remaining": 0,
            "is_unlocked": True,
        },
        {
            "step": 2,
            "label_hindi": "DM आवेदन",
            "unlock_date": (created + timedelta(days=3)).isoformat(),
            "status": "locked" if (now - created).days < 3 else "ready",
            "status_hindi": "",
            "countdown_text": "",
            "days_remaining": max(0, 3 - (now - created).days),
            "is_unlocked": (now - created).days >= 3,
        },
        {
            "step": 3,
            "label_hindi": "HC रिट याचिका",
            "unlock_date": (created + timedelta(days=18)).isoformat(),
            "status": "locked" if (now - created).days < 18 else "ready",
            "status_hindi": "",
            "countdown_text": "",
            "days_remaining": max(0, 18 - (now - created).days),
            "is_unlocked": (now - created).days >= 18,
        },
    ]
    
    # Fill dynamic text
    for t in timers:
        if t["status"] == "locked":
            t["status_hindi"] = f"{t['days_remaining']} दिन बाद खुलेगा"
            t["countdown_text"] = f"{t['days_remaining']}d"
        elif t["status"] == "ready" and t["step"] > 1:
            t["status_hindi"] = "तैयार — अभी भेजें"
            t["countdown_text"] = "अभी भेजें"
    
    return timers
