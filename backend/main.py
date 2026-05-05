import os
import sys
import uuid
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env.local")  # load .env.local first (has real keys)
load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from core.schemas import CrimeInput, OfficerInfo, ClassificationResult
from core.sarvam_stt import transcribe_audio_bytes
from core.gemma_pipeline import (
    extract_entities, classify_offense, generate_narrative,
    extract_officer_from_image, verify_legal_documents,
    explain_law_hindi, audit_evidence_photo,
)
from core.entity_extractor import extract_crime_input
from legal.bnss_classifier import classify_crime, get_classification_display
from legal.escalation_chain import get_countdown_timers
from legal.doc_generator import generate_all_documents
from legal.data.build_db import lookup_authority, build_bnss_schedule1, build_authorities, get_schedule_context
from offline.network_check import is_offline
from offline.sync_queue import (
    send_all_documents as telegram_send_all,
    get_queue_status,
    load_pending_from_supabase,
    start_retry_worker,
)
from offline.cache_manager import save_session

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Ensure databases exist
try:
    get_schedule_context()
except Exception:
    build_bnss_schedule1()
    build_authorities()

app = FastAPI(title="FirstReport API")


@app.on_event("startup")
async def on_startup():
    """Load pending Telegram queue from Supabase so it survives server restarts."""
    try:
        load_pending_from_supabase()
        start_retry_worker()
        logger.info("Startup: Telegram queue loaded ✓")
    except Exception as e:
        logger.warning(f"Startup queue load failed: {e}")

# ── Extended routes (sharing, TTS proxy, encryption, case history) ──────────
try:
    from backend.extended_routes import router as extended_router
    app.include_router(extended_router)
    logger.info("Extended routes loaded ✓")
except Exception as _ext_err:
    logger.warning(f"Extended routes not loaded: {_ext_err}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ClassifyRequest(BaseModel):
    transcript: str
    lang_code: str = "hi-IN"

class DocRequest(BaseModel):
    transcript: str
    crime_input: dict
    classification: dict
    officer_info: Optional[dict] = None
    lang_code: str = "hi-IN"

class SendRequest(BaseModel):
    session_id: str
    victim_name: Optional[str] = "पीड़ित"
    letter_type: Optional[str] = None  # "SP" | "DM" | "HC" | "OFFICER" — if set, send only this doc

class ClarifyRequest(BaseModel):
    transcript: str
    history: Optional[list] = None
    lang_code: str = "hi-IN"

class VerifyDocsRequest(BaseModel):
    bnss_section: str
    offense_name: str
    incident: str
    existing_docs: Optional[list] = None

class ExplainLawRequest(BaseModel):
    bnss_section: str
    offense_name: str
    incident: str


@app.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...), lang_code: str = Form("hi-IN")):
    audio_bytes = await audio.read()
    result = transcribe_audio_bytes(audio_bytes, lang_code=lang_code)
    return result


@app.post("/api/clarify")
async def clarify(request: ClarifyRequest):
    from core.gemma_pipeline import generate_clarification_question
    if not request.transcript:
        return {"success": True, "question": None, "isComplete": True, "summary": ""}
    
    # Build full context from chat history if available
    full_context = request.transcript
    if request.history:
        user_turns = [t["content"] for t in request.history if t.get("role") == "user"]
        full_context = ". ".join(user_turns)
    
    # Check completeness — look for key legal elements
    has_time = any(kw in full_context.lower() for kw in ["बजे", "समय", "रात", "सुबह", "शाम", "दोपहर", "time", "morning", "evening", "night", "afternoon"])
    has_location = any(kw in full_context.lower() for kw in ["थाना", "थाने", "स्टेशन", "police station", "station", "area", "इलाक"])
    has_offense = any(kw in full_context.lower() for kw in ["मारा", "चोरी", "धमकी", "assault", "theft", "beat", "rob", "murder", "rape", "बलात्कार", "हत्या", "लूट"])
    has_accused = any(kw in full_context.lower() for kw in ["पति", "पड़ोसी", "साहब", "इंस्पेक्टर", "अधिकारी", "husband", "neighbor", "officer"])
    
    turn_count = len(request.history) if request.history else 1
    
    # If we have enough info or max turns reached, mark complete
    completeness_score = sum([has_time, has_location, has_offense, has_accused])
    is_complete = completeness_score >= 3 or turn_count >= 4
    
    if is_complete:
        return {
            "success": True,
            "question": None,
            "isComplete": True,
            "summary": full_context
        }
    
    question = generate_clarification_question(full_context, request.lang_code)
    return {
        "success": True,
        "question": question,
        "isComplete": False,
        "summary": full_context
    }


@app.post("/api/classify")
async def classify(request: ClassifyRequest):
    if not request.transcript:
        raise HTTPException(status_code=400, detail="Transcript is required")
    
    crime_input = extract_crime_input(request.transcript)
    classification = classify_crime(crime_input.incident_description or request.transcript)
    display = get_classification_display(classification)
    
    return {
        "success": True,
        "crime_input": crime_input.model_dump(),
        "classification": classification.model_dump(),
        "display": display
    }

@app.post("/api/officer")
async def process_officer(image: UploadFile = File(...)):
    from PIL import Image
    import io
    image_bytes = await image.read()
    try:
        pil_image = Image.open(io.BytesIO(image_bytes))
        officer_info = extract_officer_from_image(pil_image)
        return {"success": True, "officer_info": officer_info.model_dump()}
    except Exception as e:
        logger.error(f"Error processing officer image: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/audit-evidence")
async def audit_evidence(image: UploadFile = File(...)):
    """
    Audit an evidence photo using Gemma 4 Vision.
    Returns quality scores + Hindi feedback on whether to retake.
    """
    from PIL import Image
    import io
    image_bytes = await image.read()
    try:
        pil_image = Image.open(io.BytesIO(image_bytes))
        result = audit_evidence_photo(pil_image)
        return {"success": True, "audit": result}
    except Exception as e:
        logger.error(f"Evidence audit error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Evidence audit failed"},
        )


@app.post("/api/explain-law")
async def explain_law(req: ExplainLawRequest):
    """
    Explain a BNSS section in simple, conversational Hindi for TTS read-aloud.
    Gemma 4 avoids all legal jargon — designed for illiterate / low-literacy users.
    """
    try:
        explanation = explain_law_hindi(
            bnss_section=req.bnss_section,
            offense_name=req.offense_name,
            incident=req.incident,
        )
        return {"success": True, "explanation": explanation}
    except Exception as e:
        logger.error(f"explain-law error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Legal explanation unavailable"},
        )


@app.post("/api/verify-docs")
async def verify_docs(req: VerifyDocsRequest):
    """
    Audit required supporting documents for a BNSS offense classification.
    Returns a bilingual checklist of required vs missing documents.
    """
    try:
        result = verify_legal_documents(
            bnss_section=req.bnss_section,
            offense_name=req.offense_name,
            incident=req.incident,
            existing_docs=req.existing_docs or [],
        )
        return {
            "success": True,
            "verification": result.model_dump(),
        }
    except Exception as e:
        logger.error(f"verify-docs error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Document verification failed"},
        )


@app.post("/api/generate-docs")
async def generate_docs(req: DocRequest):
    crime_input = CrimeInput(**req.crime_input)
    classification = ClassificationResult(**req.classification)
    
    if req.officer_info:
        officer_info = OfficerInfo(**req.officer_info)
    else:
        # Default empty officer if none provided
        officer_info = OfficerInfo(name=crime_input.officer_name or "Unknown", source="voice")
        
    state = crime_input.state or "uttar_pradesh"
    sp_auth = lookup_authority(state, "SP") or {"title_hindi": "SP", "address_hindi": state}
    dm_auth = lookup_authority(state, "DM") or {"title_hindi": "DM", "address_hindi": state}
    hc_auth = lookup_authority(state, "HC") or {"title_hindi": "HC", "address_hindi": state}
    
    narrative = generate_narrative(
        "शिकायत", crime_input.victim_name or "Victim",
        crime_input.incident_description or crime_input.voice_transcript,
        crime_input.station_name, classification.bnss_section, crime_input.date,
        req.lang_code
    )
    
    docs = generate_all_documents(
        crime_input, classification, officer_info,
        sp_auth, dm_auth, hc_auth,
        narrative, narrative, narrative,
        lang_code=req.lang_code
    )
    
    session_id = str(uuid.uuid4())
    save_session(
        session_id=session_id,
        victim_name=crime_input.victim_name or "Victim",
        station_name=crime_input.station_name,
        state=state,
        bnss_section=classification.bnss_section,
        offense_name=classification.offense_name_hindi,
        sp_complaint=docs["sp_complaint"],
        dm_petition=docs["dm_petition"],
        hc_writ=docs["hc_writ"],
        accountability_doc=docs["accountability_doc"],
    )
    
    output_dir = Path(__file__).parent.parent / "output"
    output_dir.mkdir(exist_ok=True)
    
    file_paths = {}
    for key, pdf_bytes in docs.items():
        filepath = output_dir / f"{key}_{session_id[:8]}.pdf"
        filepath.write_bytes(pdf_bytes)
        file_paths[key] = str(filepath)
    
    timers = get_countdown_timers(datetime.now().isoformat())
    
    return {
        "success": True,
        "session_id": session_id,
        "timers": timers,
        "officer": officer_info.model_dump(),
        "paths": file_paths
    }


@app.post("/api/send-telegram")
async def send_telegram(req: SendRequest):
    docs = {}
    output_dir = Path(__file__).parent.parent / "output"

    # Map frontend letter_type keys → PDF filename prefixes
    LETTER_TYPE_MAP: Dict[str, str] = {
        "SP":      "sp_complaint",
        "DM":      "dm_petition",
        "HC":      "hc_writ",
        "OFFICER": "accountability_doc",
    }

    # Find files for this session id
    prefix = req.session_id[:8]
    files = list(output_dir.glob(f"*_{prefix}.pdf"))

    for path in files:
        key = path.name.rsplit("_", 1)[0]
        # If a specific letter_type is requested, only include that document
        if req.letter_type:
            expected_key = LETTER_TYPE_MAP.get(req.letter_type.upper())
            if expected_key and key != expected_key:
                continue
        try:
            docs[key] = path.read_bytes()
        except:
            pass
            
    if not docs:
        return {"success": False, "error": "No documents found"}
        
    results = telegram_send_all(docs, req.session_id, req.victim_name)
    all_sent = all(r.get("success") for r in results.values())
    any_queued = any(r.get("queued") for r in results.values())
    
    queue_info = get_queue_status()
    
    return {
        "success": True,
        "all_sent": all_sent,
        "any_queued": any_queued,
        "results": results,
        "pending_queue": queue_info.get("pending", 0)
    }


# ── Serve standalone HTML frontend at / ─────────────────────────────────────
# The frontend/index.html is a single-file offline-first app.
# Mount AFTER all API routes so /api/* is not shadowed.
_frontend_dir = Path(__file__).parent.parent / "frontend"
if _frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_dir), html=True), name="frontend")
    logger.info(f"Frontend served from {_frontend_dir}")

