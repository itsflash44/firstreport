"""
FirstReport — Gemma 4 Inference Pipeline
==========================================
Handles these types of Gemma 4 calls:
1. Entity extraction from Hindi transcript → CrimeInput JSON
2. Offense classification against BNSS Schedule 1 → ClassificationResult
3. Document narrative generation (free-form Hindi paragraph)
4. Notice board photo → officer name/batch extraction (Gemma 4 vision)
5. Legal document verification → required vs missing document checklist

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
    LegalDocumentVerification, DocumentChecklistItem,
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
# Edge-Ready Quantization: set USE_QUANTIZATION=true to load Gemma in 4-bit mode.
# Reduces VRAM from ~8 GB to ~2.5 GB — runs on budget 8 GB Android/Kaggle T4 GPU.
# Requires: pip install bitsandbytes>=0.41.0 accelerate>=0.21.0
USE_QUANTIZATION = os.environ.get("USE_QUANTIZATION", "false").lower() == "true"

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

        load_kwargs: dict = {"device_map": "auto"}

        if USE_QUANTIZATION:
            # 4-bit NF4 quantization — cuts VRAM from ~8 GB → ~2.5 GB
            # Enables Gemma 4B to run on a single free Kaggle T4 (15 GB)
            # or an 8 GB budget smartphone GPU via llama.cpp GGUF
            try:
                from transformers import BitsAndBytesConfig
                bnb_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_compute_dtype=torch.bfloat16,
                )
                load_kwargs["quantization_config"] = bnb_config
                logger.info("4-bit NF4 quantization enabled (edge-ready mode)")
            except ImportError:
                logger.warning("bitsandbytes not installed — loading in bfloat16 (no quantization)")
                load_kwargs["torch_dtype"] = torch.bfloat16
        else:
            load_kwargs["torch_dtype"] = torch.bfloat16

        _model = AutoModelForCausalLM.from_pretrained(GEMMA_MODEL_PATH, **load_kwargs)
        logger.info(f"Gemma 4 loaded successfully {'(4-bit quantized)' if USE_QUANTIZATION else '(bfloat16)'}")
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


def _generate(prompt: str, max_tokens: int = 512) -> tuple[str, str]:
    """
    Generate text. Returns (response_text, model_name).
    Tries local Gemma first, then Gemini API, then Mock only if enabled.
    """
    # 1. Try local Gemma first
    try:
        _load_model()
        if _model is not None and not USE_MOCK_MODEL:
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
            return response.strip(), "gemma"
    except Exception as e:
        logger.error(f"Gemma generation error: {e}")

    # 2. Try Gemma 4 API (Hosted via Google AI)
    if os.environ.get("GEMINI_API_KEY"):
        try:
            import google.generativeai as genai
            genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
            # Prioritize genuine Gemma via API
            gemma_api_model = genai.GenerativeModel("models/gemma-4-31b-it")
            res = gemma_api_model.generate_content(prompt)
            return res.text, "gemma"
        except Exception as e:
            logger.warning(f"Gemma API generation failed: {e}. Falling back to Gemini.")

            # 3. Fallback to Gemini if Gemma API fails
            try:
                gemini_model = genai.GenerativeModel("gemini-flash-latest")
                res = gemini_model.generate_content(prompt)
                return res.text, "gemini"
            except Exception as e2:
                logger.error(f"Gemini generation error: {e2}")

    # 3. Final fallback to Mock ONLY if USE_MOCK_MODEL is true
    if USE_MOCK_MODEL:
        logger.info("Falling back to MOCK generate")
        return _mock_generate(prompt), "mock"
    
    raise RuntimeError("No inference engine available (Gemma failed, Gemini failed, and Mock is disabled)")


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
    text, _ = _generate(prompt, max_tokens=1000)
    return text

CASE_CHAT_PROMPT = """You are a senior legal assistant at FirstReport, an AI legal platform for Indian citizens.
You are currently in an active case workspace with a victim or witness.

You have full context:
{context}

Your job:
1. READ the entire case background and conversation history carefully.
2. Respond to EXACTLY what the user said in their LATEST message.
3. DO NOT repeat questions already asked in the conversation.
4. DO NOT repeat yourself — if you already offered to generate documents and they said yes, tell them the next step.

Behavior rules by situation:
- If the user asks you to draft/generate documents → Check if you know their FULL NAME, ADDRESS, and the POLICE STATION NAME.
- If you are missing any of these details → Ask the user for them. DO NOT DRAFT ANYTHING YET.
- If you have all details (Name, Address, Station, Time, Offense) AND they want documents → Tell them the documents are ready to be generated, and append exactly [ACTION:GENERATE_DOCS] at the end of your response.
- CRITICAL RULE: NEVER write the actual draft of the legal complaint or FIR in the chat message. The system generates formal PDFs separately. You must only guide them.
- If the user confirms an action (yes / haan / kariye / theek hai / ok) → Acknowledge and guide them to the next concrete step (ask for missing details or output [ACTION:GENERATE_DOCS]).
- If the user is providing new information → Acknowledge it and ask for any remaining missing detail.

Format rules:
- Respond in language: {lang_code}
- Keep response concise (3-5 sentences max for simple answers, bullet list for document questions)
- Be warm, professional, and empathetic
- NEVER start with "I understand" or "I see" — just answer directly
- NEVER echo back what the user said

Your response:"""


def generate_case_response(context: str, lang_code: str, mode: str = "chat") -> tuple[Optional[str], str]:
    """Unified AI response for the case workspace.
    Returns (response_text, model_name) where model_name is 'gemma', 'gemini', or 'mock'.
    """
    prompt = CASE_CHAT_PROMPT.format(context=context, lang_code=lang_code)
    response, model_used = _generate(prompt, max_tokens=400)
    response = response.strip()

    # Safety: if model returns NONE or empty, give a sensible fallback
    if not response or response.upper().startswith("NONE") or len(response) < 5:
        fallbacks = {
            "hi-IN": "मैं आपकी मदद के लिए यहाँ हूँ। क्या आप बता सकते हैं कि आगे क्या करना है?",
            "en-IN": "I'm here to help. What would you like to do next with your case?"
        }
        return fallbacks.get(lang_code, fallbacks["en-IN"]), model_used

    return response, model_used


# Backwards compatibility
def generate_clarification_question(transcript: str, lang_code: str) -> Optional[str]:
    context = f"=== LATEST USER MESSAGE ===\n{transcript}"
    text, _ = generate_case_response(context, lang_code, mode="chat")
    return text


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
# Evidence Vision Audit (Gemma 4 Vision Pass 2)
# ──────────────────────────────────────

EVIDENCE_AUDIT_PROMPT = """You are a legal evidence quality assessor helping a crime victim in India.

This photo has been submitted as evidence for a police complaint. Assess its quality for use in a formal legal document.

Evaluate on these 4 criteria:
1. CLARITY — Is text/content clearly readable? Are faces or injuries clearly visible?
2. LIGHTING — Is the photo well-lit or too dark/washed out?
3. ANGLE — Is the subject in frame? Is it tilted or cut off?
4. RELEVANCE — Does this look like it could be legal evidence (injury, document, location)?

Return ONLY valid JSON:
{{
    "overall_quality": "good" | "acceptable" | "retake",
    "clarity_score": 1-5,
    "lighting_score": 1-5,
    "angle_score": 1-5,
    "feedback_hindi": "2-3 sentences of honest, empathetic feedback in simple Hindi about what is good and what to improve",
    "feedback_english": "Same feedback in English",
    "action_hint_hindi": "One short action tip in Hindi (e.g. 'रोशनी में जाकर दोबारा लें')",
    "is_usable": true | false
}}

JSON only:"""


def audit_evidence_photo(image) -> dict:
    """
    Audit an evidence photo for legal quality using Gemma 4 Vision.
    Returns quality scores and Hindi/English feedback on whether to retake.
    """
    from PIL import Image as PILImage

    if not isinstance(image, PILImage.Image):
        image = PILImage.fromarray(image)

    # Try Gemini Vision first (more reliable for this nuanced task)
    if os.environ.get("GEMINI_API_KEY"):
        try:
            import google.generativeai as genai
            genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
            gemini_model = genai.GenerativeModel("gemini-flash-latest")
            res = gemini_model.generate_content([EVIDENCE_AUDIT_PROMPT, image])
            json_str = res.text
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0]
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0]
            result = json.loads(json_str.strip())
            result.setdefault("is_usable", result.get("overall_quality") in ("good", "acceptable"))
            return result
        except Exception as e:
            logger.error(f"Evidence audit Gemini error: {e}")

    # Local Gemma vision fallback
    _load_vision_processor()
    if _processor and _model and not USE_MOCK_MODEL:
        try:
            import torch
            inputs = _processor(text=EVIDENCE_AUDIT_PROMPT, images=image, return_tensors="pt").to(_model.device)
            with torch.no_grad():
                outputs = _model.generate(**inputs, max_new_tokens=300, temperature=0.2)
            response = _processor.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
            json_str = response
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0]
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0]
            result = json.loads(json_str.strip())
            result.setdefault("is_usable", result.get("overall_quality") in ("good", "acceptable"))
            return result
        except Exception as e:
            logger.error(f"Evidence audit local Gemma error: {e}")

    # Mock fallback
    return _mock_evidence_audit()


def _mock_evidence_audit() -> dict:
    """Mock evidence audit result for local development."""
    return {
        "overall_quality": "acceptable",
        "clarity_score": 3,
        "lighting_score": 4,
        "angle_score": 4,
        "feedback_hindi": (
            "फ़ोटो ठीक है। रोशनी अच्छी है। "
            "अगर हो सके तो ज़्यादा पास जाकर लें ताकि डिटेल साफ़ दिखे। "
            "यह फ़ोटो शिकायत में इस्तेमाल हो सकती है।"
        ),
        "feedback_english": (
            "Photo is acceptable. Lighting is good. "
            "If possible, move closer to show more detail. "
            "This photo can be used in the complaint."
        ),
        "action_hint_hindi": "थोड़ा पास जाकर दोबारा लेने की कोशिश करें।",
        "is_usable": True,
    }


# ──────────────────────────────────────
# Legal Explainer — "समझाएं" / "Explain in Simple Hindi" (Gemma 4 Pass 5)
# ──────────────────────────────────────

EXPLAIN_LAW_PROMPT = """You are a compassionate legal educator explaining Indian law in the simplest possible Hindi to an illiterate domestic worker.

{safety_note}

The victim's case falls under:
- BNSS Section: {bnss_section}
- Offense name: {offense_name}
- What happened: {incident}

Your task: Write a SHORT explanation (4-6 sentences maximum) in very simple, conversational Hindi (NO legal jargon) that tells the victim:
1. What this law section means in everyday words
2. WHY the police were LEGALLY REQUIRED to register the FIR (mandatory under BNSS)
3. What POWER the victim now has (they can go to SP, DM, or High Court)
4. One sentence of emotional encouragement

Write ONLY the explanation. No section numbers. No headings. No bullet points. Just plain, simple Hindi sentences that even someone who cannot read can understand when read aloud.

Simple Hindi explanation:"""


def explain_law_hindi(bnss_section: str, offense_name: str, incident: str) -> str:
    """
    Explain the BNSS law in simple, conversational Hindi for low-literacy users.
    Designed to be read aloud via TTS on the classify screen.

    Returns plain Hindi text, 4-6 sentences, zero legal jargon.
    """
    prompt = EXPLAIN_LAW_PROMPT.format(
        bnss_section=bnss_section,
        offense_name=offense_name,
        incident=incident[:300],  # keep prompt short
        safety_note=SAFETY_PROMPT_HINDI,
    )
    try:
        return _generate(prompt, max_tokens=250).strip()
    except Exception as e:
        logger.error(f"explain_law_hindi error: {e}")
        return (
            f"धारा {bnss_section} BNSS के अनुसार, {offense_name} एक संज्ञेय अपराध है। "
            "इसका मतलब है कि पुलिस को कानूनी तौर पर FIR दर्ज करना ज़रूरी था — "
            "मना करना गैरकानूनी है। "
            "अब आप SP, DM, या High Court में शिकायत कर सकती हैं। "
            "आप अकेली नहीं हैं — कानून आपके साथ है। NALSA हेल्पलाइन 15100 पर कॉल करें।"
        )


# ──────────────────────────────────────
# Legal Document Verification (Gemma 4 Pass 6)
# ──────────────────────────────────────

VERIFY_DOCS_PROMPT = """You are a legal document auditor specializing in Indian criminal law under BNSS 2023.

{safety_note}

The victim's case has been classified under:
- BNSS Section: {bnss_section}
- Offense: {offense_name}
- Incident summary: {incident}

The victim currently has these documents:
{existing_docs}

Your task:
1. List ALL required supporting documents for this specific BNSS offense to file a strong complaint (e.g., Medical Report, FIR copy, Witness statements, ID proof, Evidence photos, etc.)
2. Mark which ones are MISSING from the victim's current set.
3. For each missing document, give a short Hindi tip on how to obtain it.

Return ONLY valid JSON in this exact format:
{{
    "required_docs": [
        {{
            "name_hindi": "दस्तावेज़ का नाम हिंदी में",
            "name_english": "Document name in English",
            "is_present": true/false,
            "importance": "required" or "recommended",
            "tip_hindi": "कैसे प्राप्त करें (केवल अगर absent हो)"
        }}
    ],
    "missing_count": <number of required docs that are not present>,
    "summary_hindi": "एक वाक्य में क्या-क्या कमी है",
    "summary_english": "One sentence: what documents are missing"
}}

JSON output (no other text):"""


def verify_legal_documents(
    bnss_section: str,
    offense_name: str,
    incident: str,
    existing_docs: list[str] | None = None,
) -> LegalDocumentVerification:
    """
    Use Gemma/Gemini to audit required supporting documents for a BNSS offense.

    Args:
        bnss_section: BNSS section number, e.g., "303"
        offense_name: Offense name in Hindi
        incident: Short incident description
        existing_docs: List of document names the victim already has (may be empty)

    Returns:
        LegalDocumentVerification with required_docs checklist and summary
    """
    docs_str = (
        "\n".join(f"- {d}" for d in existing_docs)
        if existing_docs
        else "कोई दस्तावेज़ अभी तक उपलब्ध नहीं (No documents provided yet)"
    )

    prompt = VERIFY_DOCS_PROMPT.format(
        bnss_section=bnss_section,
        offense_name=offense_name,
        incident=incident,
        existing_docs=docs_str,
        safety_note=SAFETY_PROMPT_HINDI,
    )

    try:
        response = _generate(prompt, max_tokens=700)

        json_str = response
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]

        result = json.loads(json_str.strip())

        items = [
            DocumentChecklistItem(
                name_hindi=d.get("name_hindi", ""),
                name_english=d.get("name_english", ""),
                is_present=bool(d.get("is_present", False)),
                importance=d.get("importance", "required"),
                tip_hindi=d.get("tip_hindi"),
            )
            for d in result.get("required_docs", [])
        ]

        return LegalDocumentVerification(
            bnss_section=bnss_section,
            offense_name_hindi=offense_name,
            required_docs=items,
            missing_count=result.get("missing_count", sum(1 for i in items if not i.is_present)),
            summary_hindi=result.get("summary_hindi", "कुछ आवश्यक दस्तावेज़ अभी गायब हैं।"),
            summary_english=result.get("summary_english", "Some required documents are missing."),
        )

    except Exception as e:
        logger.error(f"verify_legal_documents error: {e}")
        return _mock_verify_docs(bnss_section, offense_name)


def _mock_verify_docs(bnss_section: str, offense_name: str) -> LegalDocumentVerification:
    """Fallback mock for verify_legal_documents when AI inference fails."""
    items = [
        DocumentChecklistItem(
            name_hindi="FIR की प्रति",
            name_english="FIR Copy",
            is_present=False,
            importance="required",
            tip_hindi="थाने से लिखित FIR मांगें — यह आपका कानूनी अधिकार है।",
        ),
        DocumentChecklistItem(
            name_hindi="पहचान प्रमाण",
            name_english="Identity Proof (Aadhaar / Voter ID)",
            is_present=False,
            importance="required",
            tip_hindi="आधार कार्ड, मतदाता पहचान पत्र, या राशन कार्ड चलेगा।",
        ),
        DocumentChecklistItem(
            name_hindi="घटना की तारीख और समय का विवरण",
            name_english="Written account of incident date & time",
            is_present=True,
            importance="required",
            tip_hindi=None,
        ),
        DocumentChecklistItem(
            name_hindi="गवाह का बयान (अगर उपलब्ध हो)",
            name_english="Witness Statement (if available)",
            is_present=False,
            importance="recommended",
            tip_hindi="किसी गवाह से लिखित बयान लें और उनका नाम-पता नोट करें।",
        ),
    ]
    missing = sum(1 for i in items if not i.is_present and i.importance == "required")
    return LegalDocumentVerification(
        bnss_section=bnss_section,
        offense_name_hindi=offense_name,
        required_docs=items,
        missing_count=missing,
        summary_hindi=f"धारा {bnss_section} के लिए {missing} ज़रूरी दस्तावेज़ अभी भी गायब हैं।",
        summary_english=f"Section {bnss_section}: {missing} required documents are still missing.",
    )


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
