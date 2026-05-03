"""
FirstReport — Sarvam AI Speech-to-Text Wrapper
================================================
POST to https://api.sarvam.ai/speech-to-text
Model: saaras:v3 (upgraded from deprecated saarika:v2.5)
Supports all 11 Indian languages: hi-IN, gu-IN, ml-IN, pa-IN, od-IN, etc.
Returns plain transcript string.

Offline fallback: if API is unreachable, returns None and UI shows text input.
"""

import os
import requests
import logging

logger = logging.getLogger(__name__)

SARVAM_STT_ENDPOINT = "https://api.sarvam.ai/speech-to-text"
SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "")


def transcribe_audio(audio_file_path: str, lang_code: str = "hi-IN") -> dict:
    """
    Transcribe audio to Hindi text using Sarvam AI.
    
    Args:
        audio_file_path: Path to audio file (WAV, MP3, etc.)
        language_code: Language code for transcription (default: hi-IN)
    
    Returns:
        dict with keys:
            - 'transcript': Hindi text string
            - 'success': bool
            - 'error': error message if failed
    """
    if not SARVAM_API_KEY:
        logger.warning("SARVAM_API_KEY not set — STT unavailable")
        return {
            "transcript": "",
            "success": False,
            "error": "API key not configured. Use text input instead."
        }

    try:
        with open(audio_file_path, "rb") as audio_file:
            files = {
                "file": ("audio.wav", audio_file, "audio/wav")
            }
            data = {
                "model": "saaras:v3",
                "language_code": lang_code,
            }
            headers = {
                "api-subscription-key": SARVAM_API_KEY
            }

            logger.info(f"Sending audio to Sarvam STT: {audio_file_path}")
            response = requests.post(
                SARVAM_STT_ENDPOINT,
                files=files,
                data=data,
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                transcript = result.get("transcript", "")
                logger.info(f"STT success: {transcript[:100]}...")
                return {
                    "transcript": transcript,
                    "success": True,
                    "error": None
                }
            else:
                error_msg = f"Sarvam API error {response.status_code}: {response.text}"
                logger.error(error_msg)
                return {
                    "transcript": "",
                    "success": False,
                    "error": error_msg
                }

    except requests.exceptions.ConnectionError:
        logger.warning("Cannot reach Sarvam API — offline mode")
        return {
            "transcript": "",
            "success": False,
            "error": "OFFLINE: Network unavailable. Hindi keyboard se type karein."
        }
    except requests.exceptions.Timeout:
        logger.warning("Sarvam API timeout")
        return {
            "transcript": "",
            "success": False,
            "error": "API slow. Dobara try karein ya type karein."
        }
    except Exception as e:
        logger.error(f"STT unexpected error: {e}")
        return {
            "transcript": "",
            "success": False,
            "error": f"Error: {str(e)}"
        }


def transcribe_audio_bytes(audio_bytes: bytes, lang_code: str = "hi-IN") -> dict:
    """
    Transcribe audio bytes directly (for Gradio microphone input).
    
    Args:
        audio_bytes: Raw audio bytes
        language_code: Language code (default: hi-IN)

    Returns:
        Same dict format as transcribe_audio()
    """
    if not SARVAM_API_KEY:
        return {
            "transcript": "",
            "success": False,
            "error": "API key not configured."
        }

    try:
        files = {
            "file": ("audio.wav", audio_bytes, "audio/wav")
        }
        data = {
            "model": "saaras:v3",
            "language_code": lang_code,
        }
        headers = {
            "api-subscription-key": SARVAM_API_KEY
        }

        response = requests.post(
            SARVAM_STT_ENDPOINT,
            files=files,
            data=data,
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            return {
                "transcript": result.get("transcript", ""),
                "success": True,
                "error": None
            }
        else:
            return {
                "transcript": "",
                "success": False,
                "error": f"API error {response.status_code}"
            }

    except requests.exceptions.ConnectionError:
        return {
            "transcript": "",
            "success": False,
            "error": "OFFLINE"
        }
    except Exception as e:
        return {
            "transcript": "",
            "success": False,
            "error": str(e)
        }
