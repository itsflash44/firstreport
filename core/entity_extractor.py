"""
FirstReport — Entity Extractor
================================
Takes a Hindi transcript and returns CrimeInput JSON using Gemma 4.
Wrapper around gemma_pipeline.extract_entities() with validation.
"""

import logging
from datetime import datetime
from core.schemas import CrimeInput
from core.gemma_pipeline import extract_entities as _extract

logger = logging.getLogger(__name__)


def extract_crime_input(transcript: str, fallback_state: str = "uttar_pradesh") -> CrimeInput:
    """
    Extract structured CrimeInput from a Hindi voice transcript.
    
    Args:
        transcript: Hindi text from STT
        fallback_state: Default state if not extracted
    
    Returns:
        CrimeInput pydantic model
    """
    raw = _extract(transcript)
    
    # Validate required fields
    station_name = raw.get("station_name", "")
    if not station_name:
        station_name = ""  # Will prompt user in UI
    
    state = raw.get("state", fallback_state) or fallback_state
    date = raw.get("date", "")
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    
    return CrimeInput(
        voice_transcript=transcript,
        officer_name=raw.get("officer_name"),
        station_name=station_name,
        state=state,
        date=date,
        victim_name=raw.get("victim_name"),
        incident_description=raw.get("incident_description", transcript),
    )


def get_missing_fields(crime_input: CrimeInput) -> list[dict]:
    """
    Check which required fields are missing and return prompts.
    
    Returns:
        List of dicts with 'field' and 'prompt_hindi' keys
    """
    missing = []
    
    if not crime_input.station_name:
        missing.append({
            "field": "station_name",
            "prompt_hindi": "कौन सा पुलिस थाना था?",
            "tts_text": "Kaunsa police station tha?"
        })
    
    # station_name is the only truly required field
    # Other fields are optional and can be filled later
    
    return missing
