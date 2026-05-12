import sys
import json
import base64
import uuid

# Append core path to sys.path
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.schemas import OfficerInfo, ClassificationResult, CrimeInput
from legal.doc_generator import generate_all_documents

def main():
    try:
        input_data = sys.stdin.read()
        req = json.loads(input_data)
        
        session_id = req.get("sessionId", str(uuid.uuid4()))
        lang_code = req.get("language", "hi-IN")
        
        crime_input = CrimeInput(**req.get("crime_input", req.get("crimeInput", {})))
        classification = ClassificationResult(**req.get("classification", {}))
        officer_info = OfficerInfo(name="कर्तव्य अधिकारी", source="default")
        
        sp_authority = {"title_hindi": "पुलिस अधीक्षक", "address_hindi": "जिला कार्यालय"}
        dm_authority = {"title_hindi": "ज़िला मजिस्ट्रेट", "address_hindi": "जिला कार्यालय"}
        hc_authority = {"title_hindi": "उच्च न्यायालय", "address_hindi": "राज्य उच्च न्यायालय"}

        docs = generate_all_documents(
            crime_input=crime_input,
            classification=classification,
            officer_info=officer_info,
            sp_authority=sp_authority,
            dm_authority=dm_authority,
            hc_authority=hc_authority,
            lang_code=lang_code
        )

        b64_docs = {}
        for doc_type, pdf_bytes in docs.items():
            b64_docs[doc_type] = base64.b64encode(pdf_bytes).decode('utf-8')

        result = {
            "success": True, 
            "session_id": session_id, 
            "b64_docs": b64_docs
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
