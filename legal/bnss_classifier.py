"""
FirstReport — BNSS Classifier
================================
Orchestrates offense classification using Gemma 4 + BNSS Schedule 1 SQLite.
"""

import logging
from core.schemas import ClassificationResult
from core.gemma_pipeline import classify_offense
from legal.data.build_db import get_schedule_context, build_bnss_schedule1

logger = logging.getLogger(__name__)

# Cache schedule context
_schedule_context = None


def _ensure_schedule_context():
    """Load and cache BNSS schedule context."""
    global _schedule_context
    if _schedule_context is None:
        try:
            _schedule_context = get_schedule_context()
        except Exception:
            build_bnss_schedule1()
            _schedule_context = get_schedule_context()
    return _schedule_context


def classify_crime(incident_text: str) -> ClassificationResult:
    """
    Classify a Hindi crime description against BNSS Schedule 1.
    
    This is the critical step — misclassification can cause harm.
    The result is ALWAYS shown to the victim for confirmation.
    Low-confidence results route to NALSA referral.
    
    Args:
        incident_text: Hindi description of the incident
    
    Returns:
        ClassificationResult with section, cognizability, and rationale
    """
    schedule_ctx = _ensure_schedule_context()
    result = classify_offense(incident_text, schedule_ctx)
    
    # Safety check: if confidence is low, add NALSA referral note
    if result.confidence == "low":
        result.rationale_hindi = (
            "वर्गीकरण अनिश्चित है। कृपया NALSA हेल्पलाइन 15100 पर कॉल करें "
            "या अपने नज़दीकी विधिक सेवा केंद्र से संपर्क करें।"
        )
        logger.warning(f"Low confidence classification for: {incident_text[:100]}")
    
    logger.info(
        f"Classification: S.{result.bnss_section} BNSS — "
        f"{result.offense_name_hindi} — "
        f"Cognizable: {result.is_cognizable} — "
        f"Confidence: {result.confidence}"
    )
    
    return result


def is_nalsa_referral(result: ClassificationResult) -> bool:
    """Check if the classification result should route to NALSA referral."""
    return result.confidence == "low" or result.bnss_section == "unknown"


def get_classification_display(result: ClassificationResult) -> dict:
    """
    Format classification result for UI display.
    Returns dict with Hindi text ready for rendering.
    """
    if result.is_cognizable:
        status_text = "संज्ञेय अपराध — पुलिस को FIR दर्ज करना अनिवार्य है"
        status_color = "red"
    else:
        status_text = "असंज्ञेय अपराध — पुलिस इनकार कर सकती है"
        status_color = "orange"
    
    return {
        "section_display": f"धारा {result.bnss_section} BNSS",
        "offense_name": result.offense_name_hindi,
        "status_text": status_text,
        "status_color": status_color,
        "rationale": result.rationale_hindi,
        "confidence": result.confidence,
        "is_nalsa_referral": is_nalsa_referral(result),
        "punishment": result.punishment or "",
        "has_multiple_sections": bool(result.multiple_sections),
        "multiple_sections": result.multiple_sections or [],
        # TTS text for auto-read
        "tts_text": (
            f"धारा {result.bnss_section}. {result.offense_name_hindi}. "
            f"{result.rationale_hindi}"
        ),
    }
