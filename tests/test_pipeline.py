"""
FirstReport — End-to-End Pipeline Test
=========================================
Tests the Sunita scenario through the full pipeline:
STT → entity extraction → classification → 4 documents → Telegram queue
"""

import os
import sys
import pytest
from datetime import datetime

# Ensure project root in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Force mock mode and offline
os.environ["USE_MOCK_MODEL"] = "true"

from core.schemas import CrimeInput, ClassificationResult, OfficerInfo, DocumentPackage
from core.entity_extractor import extract_crime_input, get_missing_fields
from core.gemma_pipeline import extract_officer_from_image
from legal.bnss_classifier import classify_crime, get_classification_display
from legal.escalation_chain import build_escalation_chain, get_countdown_timers
from legal.doc_generator import generate_all_documents
from legal.officer_accountability import generate_accountability_doc
from legal.data.build_db import lookup_authority, get_schedule_context
from offline.cache_manager import save_session, get_session, list_sessions
from offline.network_check import set_offline, is_offline
from offline.sync_queue import send_all_documents, get_queue_status


# ──────────────────────────────────────
# Sunita Scenario Data
# ──────────────────────────────────────

SUNITA_TRANSCRIPT = (
    "पड़ोसी ने अलमारी से पैसा चुराया। ₹40,000 थे जो पति की बचत थी। "
    "मैं गोविंदपुरम थाने गई। ड्यूटी ऑफिसर ने कहा यह पारिवारिक मामला है, "
    "FIR नहीं लिखेंगे। मुझे वापस भेज दिया।"
)


class TestEntityExtraction:
    """Test entity extraction from Sunita's transcript."""
    
    def test_extract_entities(self):
        crime_input = extract_crime_input(SUNITA_TRANSCRIPT)
        assert isinstance(crime_input, CrimeInput)
        assert crime_input.voice_transcript == SUNITA_TRANSCRIPT
        assert crime_input.state  # Should have a state
    
    def test_missing_fields(self):
        crime_input = extract_crime_input(SUNITA_TRANSCRIPT)
        missing = get_missing_fields(crime_input)
        # station_name might be found; if not, it should appear as missing
        assert isinstance(missing, list)


class TestClassification:
    """Test offense classification for Sunita's case."""
    
    def test_classify_theft(self):
        result = classify_crime(
            "पड़ोसी ने अलमारी से पैसा चुराया। FIR नहीं लिखी।"
        )
        assert isinstance(result, ClassificationResult)
        assert result.is_cognizable == True  # Theft is cognizable
        assert result.confidence in ("high", "medium", "low")
        assert result.rationale_hindi  # Must have rationale
    
    def test_classification_display(self):
        result = classify_crime("पड़ोसी ने अलमारी से पैसा चुराया")
        display = get_classification_display(result)
        assert "section_display" in display
        assert "rationale" in display
        assert "tts_text" in display
        assert display["tts_text"]  # TTS text must not be empty


class TestEscalationChain:
    """Test escalation chain building."""
    
    def test_build_chain_up(self):
        chain = build_escalation_chain("uttar_pradesh")
        assert len(chain) == 3
        assert chain[0].level == 1  # SP
        assert chain[0].unlock_day == 0  # Immediate
        assert chain[1].level == 2  # DM
        assert chain[1].unlock_day == 3
        assert chain[2].level == 3  # HC
        assert chain[2].unlock_day == 18
    
    def test_countdown_timers(self):
        timers = get_countdown_timers(datetime.now().isoformat())
        assert len(timers) == 3
        assert timers[0]["is_unlocked"] == True  # SP always unlocked
        assert timers[1]["is_unlocked"] == False  # DM locked initially
        assert timers[2]["is_unlocked"] == False  # HC locked initially


class TestDocumentGeneration:
    """Test PDF document generation."""
    
    def setup_method(self):
        self.crime_input = CrimeInput(
            voice_transcript=SUNITA_TRANSCRIPT,
            station_name="गोविंदपुरम थाना",
            state="uttar_pradesh",
            date=datetime.now().strftime("%Y-%m-%d"),
            victim_name="सुनीता देवी",
            incident_description="पड़ोसी ने अलमारी से पैसा चुराया",
        )
        self.classification = ClassificationResult(
            bnss_section="303",
            offense_name_hindi="गृह से चोरी",
            is_cognizable=True,
            confidence="high",
            rationale_hindi="धारा 303 BNSS — घर से चोरी। संज्ञेय अपराध।"
        )
        self.officer_info = OfficerInfo(name="कर्तव्य अधिकारी", source="default")
    
    def test_generate_all_documents(self):
        sp_auth = lookup_authority("uttar_pradesh", "SP")
        dm_auth = lookup_authority("uttar_pradesh", "DM")
        hc_auth = lookup_authority("uttar_pradesh", "HC")
        
        assert sp_auth is not None, "SP authority not found"
        assert dm_auth is not None, "DM authority not found"
        assert hc_auth is not None, "HC authority not found"
        
        docs = generate_all_documents(
            self.crime_input, self.classification, self.officer_info,
            sp_auth, dm_auth, hc_auth
        )
        
        assert "sp_complaint" in docs
        assert "dm_petition" in docs
        assert "hc_writ" in docs
        assert "accountability_doc" in docs
        
        # All should be non-empty PDF bytes
        for key, pdf_bytes in docs.items():
            assert len(pdf_bytes) > 100, f"{key} PDF is too small ({len(pdf_bytes)} bytes)"
            assert pdf_bytes[:4] == b"%PDF", f"{key} is not a valid PDF"
    
    def test_accountability_doc_standalone(self):
        sp_auth = lookup_authority("uttar_pradesh", "SP")
        pdf = generate_accountability_doc(
            self.crime_input, self.officer_info, sp_auth
        )
        assert len(pdf) > 100
        assert pdf[:4] == b"%PDF"


class TestOfficerExtraction:
    """Test notice board officer extraction (mock mode)."""
    
    def test_mock_extraction(self):
        # In mock mode, should return sample officer info
        import numpy as np
        mock_image = np.zeros((100, 100, 3), dtype=np.uint8)
        
        result = extract_officer_from_image(mock_image)
        assert isinstance(result, OfficerInfo)
        assert result.name  # Should have a name
        assert result.source == "photo"


class TestOfflineMode:
    """Test offline mode behavior."""
    
    def test_set_offline(self):
        set_offline(True)
        assert is_offline() == True
        set_offline(False)
        assert is_offline() == False
    
    def test_telegram_queue_offline(self):
        set_offline(True)
        
        docs = {
            "sp_complaint": b"%PDF-test-sp",
            "dm_petition": b"%PDF-test-dm",
        }
        
        results = send_all_documents(docs, "test-session", "Test")
        
        # Should be queued, not sent
        for key, result in results.items():
            assert result.get("queued") == True or not result.get("success")
        
        queue = get_queue_status()
        assert queue["pending"] >= 0
        
        set_offline(False)


class TestCacheManager:
    """Test local session caching."""
    
    def test_save_and_retrieve(self):
        session_id = "test-sunita-001"
        
        success = save_session(
            session_id=session_id,
            victim_name="सुनीता देवी",
            station_name="गोविंदपुरम",
            state="uttar_pradesh",
            bnss_section="303",
            offense_name="गृह से चोरी",
            sp_complaint=b"%PDF-sp-test",
            dm_petition=b"%PDF-dm-test",
            hc_writ=b"%PDF-hc-test",
            accountability_doc=b"%PDF-acc-test",
        )
        assert success == True
        
        session = get_session(session_id)
        assert session is not None
        assert session["victim_name"] == "सुनीता देवी"
        assert session["bnss_section"] == "303"
    
    def test_list_sessions(self):
        sessions = list_sessions()
        assert isinstance(sessions, list)


class TestFullPipeline:
    """End-to-end pipeline test — Sunita scenario."""
    
    def test_sunita_e2e(self):
        """
        Full pipeline: transcript → extraction → classification → 
        4 documents → cache → Telegram queue
        """
        # Step 1: Entity extraction
        crime_input = extract_crime_input(SUNITA_TRANSCRIPT)
        assert isinstance(crime_input, CrimeInput)
        
        # Step 2: Classification
        incident = crime_input.incident_description or SUNITA_TRANSCRIPT
        classification = classify_crime(incident)
        assert isinstance(classification, ClassificationResult)
        assert classification.is_cognizable == True
        
        # Step 3: Officer info (default — no photo)
        officer_info = OfficerInfo()
        
        # Step 4: Authority lookup
        state = crime_input.state or "uttar_pradesh"
        sp_auth = lookup_authority(state, "SP")
        dm_auth = lookup_authority(state, "DM")
        hc_auth = lookup_authority(state, "HC")
        assert sp_auth is not None
        
        # Step 5: Document generation
        docs = generate_all_documents(
            crime_input, classification, officer_info,
            sp_auth, dm_auth, hc_auth
        )
        assert len(docs) == 4
        for key, pdf in docs.items():
            assert len(pdf) > 100, f"{key} empty"
            assert pdf[:4] == b"%PDF", f"{key} not PDF"
        
        # Step 6: Cache
        session_id = "e2e-sunita-test"
        saved = save_session(
            session_id=session_id,
            victim_name=crime_input.victim_name or "सुनीता देवी",
            station_name=crime_input.station_name,
            state=state,
            bnss_section=classification.bnss_section,
            offense_name=classification.offense_name_hindi,
            **docs
        )
        assert saved == True
        
        # Step 7: Telegram queue (offline)
        set_offline(True)
        results = send_all_documents(docs, session_id)
        for key, result in results.items():
            assert result.get("queued") == True or not result.get("success")
        set_offline(False)
        
        print("\n✅ Full Sunita E2E pipeline passed!")
        print(f"   Classification: S.{classification.bnss_section} BNSS — {classification.offense_name_hindi}")
        print(f"   Documents: {len(docs)} PDFs generated")
        print(f"   Total PDF bytes: {sum(len(v) for v in docs.values()):,}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
