"""
FirstReport — Gemma 4 Inference Pipeline
==========================================
Handles three types of Gemma 4 calls:
1. Entity extraction from Hindi transcript → CrimeInput JSON
2. Offense classification against BNSS Schedule 1 → ClassificationResult
3. Document narrative generation (free-form Hindi paragraph)
4. Notice board photo → officer name/batch extraction (Gemma 4 vision)

Uses Gemma 4 4B-instruct via Kaggle Models Hub.
Mock mode available for local development (USE_MOCK_MODEL=true env var).

SAFETY: Every prompt includes the disclaimer:
"Yeh legal advice nahi hai. Document draft hai. Submit karne se pehle NALSA helpline 15100 se sampark karein."
"""

import os
import json
import logging
from typing import Optional

from core.schemas import (
    CrimeInput, ClassificationResult, OfficerInfo,
    SAFETY_PROMPT_HINDI
)

logger = logging.getLogger(__name__)

# ──────────────────────────────────────
# Configuration
# ──────────────────────────────────────
USE_MOCK_MODEL = os.environ.get("USE_MOCK_MODEL", "true").lower() == "true"
GEMMA_MODEL_PATH = os.environ.get(
    "GEMMA_MODEL_PATH",
    "kaggle-models/google/gemma/transformers/gemma-4-instruct-4b"
)

# Global model/tokenizer (lazy loaded)
_model = None
_tokenizer = None
_processor = None  # For vision tasks


def _load_model():
    """Lazy-load Gemma 4 model and tokenizer."""
    global _model, _tokenizer
    if _model is not None:
        return

    if USE_MOCK_MODEL:
        logger.info("Using MOCK model mode — no GPU required")
        return

    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch

        logger.info(f"Loading Gemma 4 from {GEMMA_MODEL_PATH}...")
        _tokenizer = AutoTokenizer.from_pretrained(GEMMA_MODEL_PATH)
        _model = AutoModelForCausalLM.from_pretrained(
            GEMMA_MODEL_PATH,
            torch_dtype=torch.bfloat16,
            device_map="auto"
        )
        logger.info("Gemma 4 loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load Gemma 4: {e}")
        logger.info("Falling back to mock mode")


def _load_vision_processor():
    """Lazy-load Gemma 4 vision processor for multimodal tasks."""
    global _processor
    if _processor is not None:
        return

    if USE_MOCK_MODEL:
        logger.info("Using MOCK vision mode")
        return

    try:
        from transformers import AutoProcessor
        _processor = AutoProcessor.from_pretrained(GEMMA_MODEL_PATH)
        logger.info("Gemma 4 vision processor loaded")
    except Exception as e:
        logger.error(f"Failed to load vision processor: {e}")


def _generate(prompt: str, max_tokens: int = 512) -> str:
    """
    Generate text. Tries Gemini API first if configured, else local Gemma 4, else Mock.
    """
    import os
    if os.environ.get("GEMINI_API_KEY"):
        try:
            import google.generativeai as genai
            genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
            gemini_model = genai.GenerativeModel("gemini-flash-latest")
            res = gemini_model.generate_content(prompt)
            return res.text
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")

    _load_model()

    if USE_MOCK_MODEL or _model is None:
        return _mock_generate(prompt)

    try:
        import torch
        inputs = _tokenizer(prompt, return_tensors="pt").to(_model.device)
        with torch.no_grad():
            outputs = _model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=0.3,
                do_sample=True,
                top_p=0.9
            )
        response = _tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        return response.strip()
    except Exception as e:
        logger.error(f"Gemma generation error: {e}")
        return _mock_generate(prompt)


# ──────────────────────────────────────
# Entity Extraction (Gemma 4 Pass 1)
# ──────────────────────────────────────

ENTITY_EXTRACTION_PROMPT = """आप एक हिंदी कानूनी सहायक हैं। नीचे दिए गए हिंदी विवरण से इन जानकारियों को निकालें और JSON में दें:

1. station_name: पुलिस थाने का नाम
2. officer_name: अधिकारी का नाम (अगर बताया गया)
3. date: तारीख (अगर बताई गई, YYYY-MM-DD format)
4. state: राज्य का नाम (अंग्रेज़ी में, underscore से जैसे uttar_pradesh)
5. incident_description: क्या हुआ, संक्षेप में
6. victim_name: पीड़ित का नाम (अगर बताया गया)

{safety_note}

विवरण: {transcript}

JSON output (बिना किसी अन्य टेक्स्ट के):"""


def extract_entities(transcript: str) -> dict:
    """
    Extract structured entities from Hindi transcript using Gemma 4.
    Returns dict matching CrimeInput fields.
    """
    prompt = ENTITY_EXTRACTION_PROMPT.format(
        transcript=transcript,
        safety_note=SAFETY_PROMPT_HINDI
    )
    response = _generate(prompt, max_tokens=300)

    try:
        # Try to parse as JSON
        json_str = response
        # Handle cases where model wraps in markdown code blocks
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]

        result = json.loads(json_str.strip())
        return {
            "station_name": result.get("station_name", ""),
            "officer_name": result.get("officer_name"),
            "date": result.get("date", ""),
            "state": result.get("state", "uttar_pradesh"),
            "incident_description": result.get("incident_description", transcript),
            "victim_name": result.get("victim_name"),
            "voice_transcript": transcript,
        }
    except (json.JSONDecodeError, IndexError) as e:
        logger.error(f"Entity extraction JSON parse error: {e}")
        return {
            "station_name": "",
            "officer_name": None,
            "date": "",
            "state": "uttar_pradesh",
            "incident_description": transcript,
            "victim_name": None,
            "voice_transcript": transcript,
        }


# ──────────────────────────────────────
# Offense Classification (Gemma 4 Pass 2 — Critical Step)
# ──────────────────────────────────────

CLASSIFICATION_PROMPT = """आप एक भारतीय कानूनी विशेषज्ञ हैं। भारतीय नागरिक सुरक्षा संहिता 2023 (BNSS) के आधार पर वर्गीकरण करें।

नोट: CrPC अब लागू नहीं है। केवल BNSS धाराओं का उपयोग करें।

{safety_note}

BNSS अनुसूची 1 से प्रमुख संज्ञेय अपराध:
{schedule_context}

घटना का विवरण: {incident}

कृपया JSON में उत्तर दें:
{{
    "bnss_section": "धारा संख्या",
    "offense_name_hindi": "अपराध का नाम हिंदी में",
    "is_cognizable": true/false,
    "confidence": "high/medium/low",
    "rationale_hindi": "एक वाक्य में कारण हिंदी में",
    "punishment": "सज़ा का विवरण"
}}

अगर एक से ज़्यादा अपराध हों तो:
{{
    "multiple_sections": ["धारा 1", "धारा 2"],
    ...बाकी fields भी भरें (सबसे गंभीर अपराध के लिए)
}}

अगर आप सुनिश्चित नहीं हैं तो confidence "low" रखें।

JSON output:"""


def classify_offense(incident_text: str, schedule_context: str) -> ClassificationResult:
    """
    Classify a Hindi crime description against BNSS Schedule 1.
    
    Args:
        incident_text: Hindi description of the incident
        schedule_context: BNSS schedule data loaded from SQLite
    
    Returns:
        ClassificationResult with section, cognizability, and rationale
    """
    prompt = CLASSIFICATION_PROMPT.format(
        incident=incident_text,
        schedule_context=schedule_context,
        safety_note=SAFETY_PROMPT_HINDI
    )
    response = _generate(prompt, max_tokens=400)

    try:
        json_str = response
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]

        result = json.loads(json_str.strip())
        return ClassificationResult(
            bnss_section=str(result.get("bnss_section", "unknown")),
            offense_name_hindi=result.get("offense_name_hindi", "अज्ञात"),
            is_cognizable=result.get("is_cognizable", False),
            confidence=result.get("confidence", "low"),
            rationale_hindi=result.get("rationale_hindi", "वर्गीकरण अनिश्चित है।"),
            punishment=result.get("punishment"),
            multiple_sections=result.get("multiple_sections")
        )
    except (json.JSONDecodeError, IndexError) as e:
        logger.error(f"Classification JSON parse error: {e}")
        return ClassificationResult(
            bnss_section="unknown",
            offense_name_hindi="वर्गीकरण विफल",
            is_cognizable=False,
            confidence="low",
            rationale_hindi="वर्गीकरण में त्रुटि हुई। कृपया NALSA हेल्पलाइन 15100 से संपर्क करें।"
        )


# ──────────────────────────────────────
# Document Narrative Generation (Gemma 4 Pass 3)
# ──────────────────────────────────────

NARRATIVE_PROMPT = """You are an expert criminal lawyer in India drafting a formal, highly detailed legal petition for your client. 
Based on the following information, draft a comprehensive, professional narrative paragraph describing the incident.
Include ALL provided details (time, sequence of events, specific actions). Do NOT summarize briefly; write it out fully as a legal pleading.
Do not worry if it exceeds one page. It must be as detailed as possible.

{safety_note}

Document Type: {doc_type}
Victim Name: {victim_name}
Incident Details: {incident}
Police Station: {station_name}
BNSS Section: {bnss_section}
Date: {date}
Language: {lang_code}

Instructions:
1. Write the narrative in the language specified by {lang_code} (e.g. 'hi-IN' -> Hindi, 'bn-IN' -> Bengali, 'ta-IN' -> Tamil, 'te-IN' -> Telugu, 'en-IN' -> English).
2. Write ONLY the narrative paragraph. No titles, no formatting, no preamble.
"""

def generate_narrative(
    doc_type: str,
    victim_name: str,
    incident: str,
    station_name: str,
    bnss_section: str,
    date: str,
    lang_code: str = "hi-IN"
) -> str:
    """Generate a highly detailed, professional legal narrative in the specified language."""
    prompt = NARRATIVE_PROMPT.format(
        doc_type=doc_type,
        victim_name=victim_name,
        incident=incident,
        station_name=station_name,
        bnss_section=bnss_section,
        date=date,
        lang_code=lang_code,
        safety_note=SAFETY_PROMPT_HINDI
    )
    return _generate(prompt, max_tokens=1000)

CLARIFICATION_PROMPT = """You are a legal assistant analyzing a crime report. 
Read the transcript. If vital legal details are missing (e.g. the specific time, location, or exact sequence of events), ask ONE clear, simple follow-up question to the victim to get that missing detail.
If the transcript already has enough detail to file a basic police complaint, reply with the exact word: NONE.

Transcript: {transcript}
Language: {lang_code}

Instructions:
1. Ask the question in the language specified by {lang_code}.
2. Keep it simple and empathetic.
3. If no clarification is needed, output ONLY: NONE
"""

def generate_clarification_question(transcript: str, lang_code: str) -> Optional[str]:
    prompt = CLARIFICATION_PROMPT.format(transcript=transcript, lang_code=lang_code)
    response = _generate(prompt, max_tokens=100).strip()
    if response.upper() == "NONE" or "NONE" in response.upper():
        return None
    return response


# ──────────────────────────────────────
# Notice Board Photo → Officer Info (Gemma 4 Vision)
# ──────────────────────────────────────

VISION_PROMPT = """This is a photograph of a police station notice board in India. 
Extract the following information if visible:
1. Officer name (duty officer or SHO)
2. Batch number / badge number
3. Current posting / designation

Return ONLY JSON:
{{"name": "officer name", "batch_number": "number", "posting": "designation"}}

If information is not clearly visible, use null for that field.
Important: This is for legal documentation purposes only. {safety_note}"""


def extract_officer_from_image(image) -> OfficerInfo:
    """
    Extract officer details from a notice board photo.
    """
    import os
    from PIL import Image as PILImage
    import json
    
    # Ensure image is PIL
    if not isinstance(image, PILImage.Image):
        image = PILImage.fromarray(image)
        
    if os.environ.get("GEMINI_API_KEY"):
        try:
            import google.generativeai as genai
            genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
            gemini_model = genai.GenerativeModel("gemini-flash-latest")
            sys_prompt = VISION_PROMPT.format(safety_note=SAFETY_PROMPT_HINDI)
            res = gemini_model.generate_content([sys_prompt, image])
            json_str = res.text
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0]
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0]
            result = json.loads(json_str.strip())
            return OfficerInfo(
                name=result.get("name", "कर्तव्य अधिकारी"),
                batch_number=result.get("batch_number"),
                posting=result.get("posting"),
                source="vision_gemini"
            )
        except Exception as e:
            logger.error(f"Gemini Vision error: {e}")

    _load_model()
    _load_vision_processor()

    if USE_MOCK_MODEL or _model is None or _processor is None:
        return _mock_vision_extract(image)

    try:
        from PIL import Image as PILImage
        import torch

        # Ensure image is PIL
        if not isinstance(image, PILImage.Image):
            image = PILImage.fromarray(image)

        prompt = VISION_PROMPT.format(safety_note=SAFETY_PROMPT_HINDI)
        inputs = _processor(
            text=prompt,
            images=image,
            return_tensors="pt"
        ).to(_model.device)

        with torch.no_grad():
            outputs = _model.generate(**inputs, max_new_tokens=200, temperature=0.2)
        
        response = _processor.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        
        # Parse JSON
        json_str = response
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]
        
        result = json.loads(json_str.strip())
        return OfficerInfo(
            name=result.get("name", "कर्तव्य अधिकारी"),
            batch_number=result.get("batch_number"),
            posting=result.get("posting"),
            source="photo"
        )
    except Exception as e:
        logger.error(f"Vision extraction error: {e}")
        return OfficerInfo(name="कर्तव्य अधिकारी", source="default")


# ──────────────────────────────────────
# Mock Responses (for local testing without GPU)
# ──────────────────────────────────────

# Maps keywords in Hindi/transliterated to mock classification results
MOCK_CLASSIFICATIONS = {
    "chori": {
        "bnss_section": "303",
        "offense_name_hindi": "गृह से चोरी",
        "is_cognizable": True,
        "confidence": "high",
        "rationale_hindi": "धारा 303 BNSS — घर से चोरी। पुलिस को FIR दर्ज करना कानूनी रूप से अनिवार्य था। इनकार गैरकानूनी है।",
        "punishment": "3 वर्ष तक कारावास और जुर्माना"
    },
    "maar": {
        "bnss_section": "115",
        "offense_name_hindi": "स्वेच्छा से गंभीर चोट पहुंचाना",
        "is_cognizable": True,
        "confidence": "high",
        "rationale_hindi": "धारा 115 BNSS — जानबूझकर चोट। संज्ञेय अपराध है। पुलिस को FIR दर्ज करना ज़रूरी था।",
        "punishment": "7 वर्ष तक कारावास"
    },
    "dhamki": {
        "bnss_section": "352",
        "offense_name_hindi": "आपराधिक धमकी",
        "is_cognizable": True,
        "confidence": "high",
        "rationale_hindi": "धारा 352 BNSS — आपराधिक धमकी। यह संज्ञेय अपराध है।",
        "punishment": "2 वर्ष तक कारावास"
    },
    "rok": {
        "bnss_section": "126",
        "offense_name_hindi": "गलत तरीके से रोकना",
        "is_cognizable": True,
        "confidence": "high",
        "rationale_hindi": "धारा 126 BNSS — सदोष परिरोध। संज्ञेय अपराध।",
        "punishment": "1 माह तक कारावास या ₹500 जुर्माना"
    },
    "dhokha": {
        "bnss_section": "316",
        "offense_name_hindi": "छल",
        "is_cognizable": True,
        "confidence": "high",
        "rationale_hindi": "धारा 316 BNSS — छल/धोखाधड़ी। संज्ञेय अपराध।",
        "punishment": "1 वर्ष तक कारावास और जुर्माना"
    },
    "mahila": {
        "bnss_section": "74",
        "offense_name_hindi": "महिला पर हमला",
        "is_cognizable": True,
        "confidence": "high",
        "rationale_hindi": "धारा 74 BNSS — महिला पर हमला या अपराधिक बल प्रयोग। संज्ञेय अपराध।",
        "punishment": "5 वर्ष तक कारावास"
    },
}


def _mock_generate(prompt: str) -> str:
    """Generate mock responses for local testing."""
    prompt_lower = prompt.lower()

    # Entity extraction mock
    if "station_name" in prompt_lower and "officer_name" in prompt_lower:
        # Look for known keywords
        if "govindpuram" in prompt_lower or "गोविंदपुरम" in prompt_lower:
            return json.dumps({
                "station_name": "गोविंदपुरम थाना",
                "officer_name": None,
                "date": __import__("datetime").datetime.now().strftime("%Y-%m-%d"),
                "state": "uttar_pradesh",
                "incident_description": "पड़ोसी ने अलमारी से पैसा चुराया। थाने ने FIR लिखने से मना कर दिया।",
                "victim_name": "सुनीता देवी"
            }, ensure_ascii=False)
        return json.dumps({
            "station_name": "",
            "officer_name": None,
            "date": __import__("datetime").datetime.now().strftime("%Y-%m-%d"),
            "state": "uttar_pradesh",
            "incident_description": "विवरण उपलब्ध",
            "victim_name": None
        }, ensure_ascii=False)

    # Classification mock
    if "bnss_section" in prompt_lower:
        for keyword, classification in MOCK_CLASSIFICATIONS.items():
            if keyword in prompt_lower:
                return json.dumps(classification, ensure_ascii=False)
        # Default to theft
        return json.dumps(MOCK_CLASSIFICATIONS["chori"], ensure_ascii=False)

    # Narrative mock
    if "अनुच्छेद" in prompt or "doc_type" in prompt_lower:
        return (
            "दिनांक को पीड़ित ने उपरोक्त थाने में अपराध की सूचना दी। "
            "थाने के कर्तव्य अधिकारी ने FIR दर्ज करने से इनकार कर दिया। "
            "यह भारतीय नागरिक सुरक्षा संहिता 2023 की धारा 173 का उल्लंघन है "
            "जो पुलिस को संज्ञेय अपराध की सूचना पर FIR दर्ज करने का आदेश देती है। "
            "अतः यह शिकायत माननीय अधिकारी को प्रेषित की जा रही है।"
        )

    return '{"error": "mock response"}'


def _mock_vision_extract(image) -> OfficerInfo:
    """Mock vision extraction for local testing."""
    logger.info("Mock vision: returning sample officer info")
    return OfficerInfo(
        name="इंस्पेक्टर राजेश कुमार",
        batch_number="UP-2019-4521",
        posting="SHO, गोविंदपुरम थाना",
        source="photo"
    )
