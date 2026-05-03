"""
FirstReport — Core Data Schemas
================================
Pydantic models shared across all modules.
SCHEMA CONTRACT: This file is written FIRST. All other modules import from here.

All legal citations use BNSS (Bharatiya Nagarik Suraksha Sanhita 2023), NOT CrPC.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CrimeInput(BaseModel):
    """Input data extracted from victim's voice transcript or refusal slip photo."""
    voice_transcript: str = Field(..., description="Hindi transcript of victim's spoken narrative")
    officer_name: Optional[str] = Field(None, description="Name of the duty officer who refused FIR")
    officer_batch_number: Optional[str] = Field(None, description="Batch number from notice board photo")
    officer_posting: Optional[str] = Field(None, description="Current posting from notice board photo")
    station_name: str = Field(..., description="Police station name where FIR was refused")
    state: str = Field(..., description="State code, e.g., 'uttar_pradesh'")
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"),
                      description="Date of refusal in YYYY-MM-DD format")
    victim_name: Optional[str] = Field(None, description="Victim's name if provided")
    incident_description: Optional[str] = Field(None, description="Extracted incident description in Hindi")


class ClassificationResult(BaseModel):
    """Result of BNSS offense classification by Gemma 4."""
    bnss_section: str = Field(..., description="BNSS section number, e.g., '303'")
    offense_name_hindi: str = Field(..., description="Offense name in Hindi, e.g., 'गृह से चोरी'")
    is_cognizable: bool = Field(..., description="Whether the offense is cognizable under BNSS Schedule 1")
    confidence: str = Field(..., description="'high', 'medium', or 'low'")
    rationale_hindi: str = Field(..., description="One-sentence rationale in plain Hindi shown to victim")
    punishment: Optional[str] = Field(None, description="Punishment description from BNSS")
    multiple_sections: Optional[list[str]] = Field(None, description="If multiple offenses detected, list of section numbers")


class OfficerInfo(BaseModel):
    """Officer information extracted from notice board photo via Gemma 4 vision."""
    name: str = Field(default="कर्तव्य अधिकारी", description="Officer name or 'duty officer'")
    batch_number: Optional[str] = Field(None, description="Batch/badge number")
    posting: Optional[str] = Field(None, description="Current posting designation")
    source: str = Field(default="voice", description="'voice', 'photo', or 'default'")


class AuthorityContact(BaseModel):
    """Contact details for an escalation authority."""
    title: str = Field(..., description="Authority title, e.g., 'Superintendent of Police'")
    name: str = Field(..., description="Officer/authority name")
    address: str = Field(..., description="Full address")
    district: str = Field(..., description="District name")
    state: str = Field(..., description="State name")
    email: Optional[str] = Field(None)
    phone: Optional[str] = Field(None)


class EscalationStep(BaseModel):
    """One step in the escalation chain."""
    level: int = Field(..., description="1=SP, 2=DM, 3=HC")
    authority: AuthorityContact
    bnss_section: str = Field(..., description="Legal basis for this step")
    unlock_day: int = Field(..., description="Day number when this step unlocks (0=immediate)")
    deadline_description_hindi: str = Field(..., description="Hindi description of the deadline")
    document_type: str = Field(..., description="'sp_complaint', 'dm_petition', or 'hc_writ'")


class DocumentPackage(BaseModel):
    """Complete set of generated legal documents for one session."""
    session_id: str = Field(..., description="Unique session identifier")
    victim_name: str = Field(default="पीड़ित", description="Victim's name or 'victim'")
    crime_input: CrimeInput
    classification: ClassificationResult
    officer_info: OfficerInfo
    sp_complaint: bytes = Field(..., description="SP complaint PDF bytes")
    dm_petition: bytes = Field(..., description="DM petition PDF bytes")
    hc_writ: bytes = Field(..., description="HC writ petition PDF bytes")
    accountability_doc: bytes = Field(..., description="S.166 officer accountability PDF bytes")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    escalation_steps: list[EscalationStep] = Field(default_factory=list)

    class Config:
        arbitrary_types_allowed = True


# ──────────────────────────────────────
# Constants used across the project
# ──────────────────────────────────────

DISCLAIMER_HINDI = "यह कानूनी सलाह नहीं है। यह एक ड्राफ्ट दस्तावेज़ है। जमा करने से पहले NALSA हेल्पलाइन 15100 से संपर्क करें।"
DISCLAIMER_SHORT = "Yeh sirf ek draft hai — legal advice nahi. Submit karne se pehle NALSA se baat karein."
NALSA_HELPLINE = "15100"
SAFETY_PROMPT_HINDI = "Yeh legal advice nahi hai. Document draft hai. Submit karne se pehle NALSA helpline 15100 se sampark karein."

# State code to display name mapping
STATE_NAMES = {
    "uttar_pradesh": "उत्तर प्रदेश",
    "maharashtra": "महाराष्ट्र",
    "rajasthan": "राजस्थान",
    "delhi": "दिल्ली",
    "karnataka": "कर्नाटक",
}

# S.166 BNSS accountability text (exact Hindi sentence from spec)
ACCOUNTABILITY_TEXT_HINDI = (
    "उनपर भारतीय नागरिक सुरक्षा संहिता 2023 की धारा 166 के तहत मुल्ज़िम है "
    "जो कहती है कि कोई भी सरकारी अधिकारी कानून की अवहेलना नहीं कर सकता।"
)
