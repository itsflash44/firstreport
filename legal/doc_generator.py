"""
FirstReport — Document Generator
==================================
Generates 4 legal documents as PDFs using ReportLab with Noto Sans Devanagari:
1. SP Complaint (S.166 BNSS)
2. DM Petition (S.175(3) BNSS)
3. HC Writ (Article 226 Constitution)
4. Officer Accountability (S.166 BNSS — separate targeting officer by name)

Every document includes:
- Victim name, date, station name, officer name
- BNSS section with full section text quoted
- Authority name and address
- Legal deadline statement
- Disclaimer at bottom
"""

import os
import io
import logging
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from core.schemas import (
    CrimeInput, ClassificationResult, OfficerInfo, DocumentPackage,
    DISCLAIMER_HINDI, ACCOUNTABILITY_TEXT_HINDI
)

logger = logging.getLogger(__name__)

# ──────────────────────────────────────
# Font Setup
# ──────────────────────────────────────

def _get_font_name(lang_code="hi-IN"):
    """Get the registered font name based on language code."""
    font_map = {
        "bn-IN": ("NotoSansBengali", "NotoSansBengali-Regular.ttf"),
        "ta-IN": ("NotoSansTamil", "NotoSansTamil-Regular.ttf"),
        "te-IN": ("NotoSansTelugu", "NotoSansTelugu-Regular.ttf"),
        "hi-IN": ("NotoDevanagari", "NotoSansDevanagari-Regular.ttf"),
        "mr-IN": ("NotoDevanagari", "NotoSansDevanagari-Regular.ttf"),
        "en-IN": ("NotoSans", "NotoSans-Regular.ttf")
    }
    font_name, filename = font_map.get(lang_code, ("NotoDevanagari", "NotoSansDevanagari-Regular.ttf"))
    
    font_paths = [
        os.path.join(os.path.dirname(__file__), "data", filename),
        os.path.join(os.path.dirname(__file__), "data", "NotoSansDevanagari-Regular.ttf"),
        f"/usr/share/fonts/truetype/noto/{filename}"
    ]
    
    for path in font_paths:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont(font_name, path))
                return font_name
            except Exception:
                continue
    return "Helvetica"


# ──────────────────────────────────────
# Styles
# ──────────────────────────────────────

def _create_styles(lang_code="hi-IN"):
    """Create document styles."""
    font = _get_font_name(lang_code)
    
    styles = {
        "title": ParagraphStyle(
            "DocTitle", fontName=font, fontSize=16, leading=22,
            alignment=TA_CENTER, spaceAfter=6*mm,
            textColor=HexColor("#1a1a2e")
        ),
        "heading": ParagraphStyle(
            "DocHeading", fontName=font, fontSize=12, leading=16,
            alignment=TA_LEFT, spaceAfter=4*mm, spaceBefore=4*mm,
            textColor=HexColor("#16213e")
        ),
        "address": ParagraphStyle(
            "Address", fontName=font, fontSize=11, leading=15,
            alignment=TA_LEFT, spaceAfter=3*mm,
            textColor=HexColor("#0f3460")
        ),
        "body": ParagraphStyle(
            "Body", fontName=font, fontSize=11, leading=16,
            alignment=TA_JUSTIFY, spaceAfter=3*mm,
            textColor=HexColor("#1a1a2e")
        ),
        "section_highlight": ParagraphStyle(
            "SectionHighlight", fontName=font, fontSize=12, leading=16,
            alignment=TA_LEFT, spaceAfter=3*mm, spaceBefore=3*mm,
            textColor=HexColor("#e94560"), backColor=HexColor("#fff3cd"),
            borderPadding=(4, 8, 4, 8)
        ),
        "disclaimer": ParagraphStyle(
            "Disclaimer", fontName=font, fontSize=9, leading=12,
            alignment=TA_CENTER, spaceAfter=2*mm, spaceBefore=6*mm,
            textColor=HexColor("#6c757d"), borderWidth=0.5,
            borderColor=HexColor("#dee2e6"), borderPadding=(6, 10, 6, 10)
        ),
        "date_line": ParagraphStyle(
            "DateLine", fontName=font, fontSize=10, leading=14,
            alignment=TA_RIGHT, spaceAfter=4*mm,
            textColor=HexColor("#495057")
        ),
        "prayer": ParagraphStyle(
            "Prayer", fontName=font, fontSize=11, leading=16,
            alignment=TA_LEFT, spaceAfter=3*mm, spaceBefore=3*mm,
            textColor=HexColor("#1a1a2e"), leftIndent=10*mm
        ),
        "signature": ParagraphStyle(
            "Signature", fontName=font, fontSize=11, leading=15,
            alignment=TA_LEFT, spaceBefore=15*mm,
            textColor=HexColor("#1a1a2e")
        ),
    }
    return styles


# ──────────────────────────────────────
# Document Generators
# ──────────────────────────────────────

def generate_sp_complaint(
    crime_input: CrimeInput,
    classification: ClassificationResult,
    authority: dict,
    narrative: str,
    officer_info: OfficerInfo = None,
    lang_code: str = "hi-IN"
) -> bytes:
    """Generate SP Complaint PDF under S.166 BNSS."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=2*cm, bottomMargin=2*cm,
                            leftMargin=2*cm, rightMargin=2*cm)
    styles = _create_styles(lang_code)
    story = []
    
    victim_name = crime_input.victim_name or "पीड़ित"
    officer_name = ""
    if officer_info and officer_info.name != "कर्तव्य अधिकारी":
        officer_name = officer_info.name
        if officer_info.batch_number:
            officer_name += f" (बैच नं. {officer_info.batch_number})"
    elif crime_input.officer_name:
        officer_name = crime_input.officer_name
    else:
        officer_name = f"कर्तव्य अधिकारी (दिनांक {crime_input.date})"
    
    # Header
    story.append(Paragraph("शिकायत पत्र", styles["title"]))
    story.append(Paragraph(
        f"भारतीय नागरिक सुरक्षा संहिता 2023 की धारा 166 के अंतर्गत",
        styles["heading"]
    ))
    
    # Date
    story.append(Paragraph(f"दिनांक: {crime_input.date}", styles["date_line"]))
    
    # To address
    story.append(Paragraph("सेवा में,", styles["address"]))
    story.append(Paragraph(
        f"{authority.get('title_hindi', 'पुलिस अधीक्षक')},<br/>"
        f"{authority.get('address_hindi', '')}",
        styles["address"]
    ))
    
    # Subject
    story.append(Paragraph(
        f"<b>विषय:</b> थाना {crime_input.station_name} द्वारा संज्ञेय अपराध में "
        f"FIR दर्ज करने से इनकार — धारा 166 BNSS के तहत शिकायत",
        styles["heading"]
    ))
    
    # Body
    story.append(Paragraph("महोदय/महोदया,", styles["body"]))
    story.append(Paragraph(
        f"निवेदन है कि मैं {victim_name}, निवासी उपरोक्त क्षेत्र, "
        f"दिनांक {crime_input.date} को थाना {crime_input.station_name} गई/गया था "
        f"जहां {officer_name} ने मेरी शिकायत पर FIR दर्ज करने से इनकार कर दिया।",
        styles["body"]
    ))
    
    # Narrative (Gemma-generated)
    if narrative:
        story.append(Paragraph(narrative, styles["body"]))
    
    # BNSS Section highlight
    story.append(Paragraph(
        f"⚖️ धारा {classification.bnss_section} BNSS — {classification.offense_name_hindi} — "
        f"{'संज्ञेय अपराध' if classification.is_cognizable else 'असंज्ञेय अपराध'}",
        styles["section_highlight"]
    ))
    
    story.append(Paragraph(
        f"भारतीय नागरिक सुरक्षा संहिता 2023 की धारा 173 के अनुसार, "
        f"किसी भी संज्ञेय अपराध की सूचना मिलने पर थाने का यह कर्तव्य है कि वह "
        f"FIR दर्ज करे। इनकार करना धारा 166 BNSS का उल्लंघन है।",
        styles["body"]
    ))
    
    # Prayer
    story.append(Paragraph("<b>प्रार्थना:</b>", styles["heading"]))
    story.append(Paragraph(
        f"1. थाना {crime_input.station_name} को FIR दर्ज करने का आदेश दें।",
        styles["prayer"]
    ))
    story.append(Paragraph(
        f"2. {officer_name} के विरुद्ध धारा 166 BNSS के तहत कार्रवाई करें।",
        styles["prayer"]
    ))
    story.append(Paragraph(
        "3. उचित जांच सुनिश्चित करें।",
        styles["prayer"]
    ))
    
    # Signature
    story.append(Paragraph(
        f"भवदीय/भवदीया,<br/>{victim_name}<br/>दिनांक: {crime_input.date}",
        styles["signature"]
    ))
    
    # Disclaimer
    story.append(Paragraph(DISCLAIMER_HINDI, styles["disclaimer"]))
    
    doc.build(story)
    return buffer.getvalue()


def generate_dm_petition(
    crime_input: CrimeInput,
    classification: ClassificationResult,
    authority: dict,
    narrative: str,
    sp_authority: dict = None,
    officer_info: OfficerInfo = None,
    lang_code: str = "hi-IN"
) -> bytes:
    """Generate DM Petition PDF under S.175(3) BNSS."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=2*cm, bottomMargin=2*cm,
                            leftMargin=2*cm, rightMargin=2*cm)
    styles = _create_styles(lang_code)
    story = []
    
    victim_name = crime_input.victim_name or "पीड़ित"
    
    story.append(Paragraph("आवेदन पत्र", styles["title"]))
    story.append(Paragraph(
        "भारतीय नागरिक सुरक्षा संहिता 2023 की धारा 175(3) के अंतर्गत",
        styles["heading"]
    ))
    
    story.append(Paragraph(f"दिनांक: {crime_input.date}", styles["date_line"]))
    
    story.append(Paragraph("सेवा में,", styles["address"]))
    story.append(Paragraph(
        f"{authority.get('title_hindi', 'ज़िला मजिस्ट्रेट')},<br/>"
        f"{authority.get('address_hindi', '')}",
        styles["address"]
    ))
    
    story.append(Paragraph(
        f"<b>विषय:</b> धारा 175(3) BNSS के तहत मजिस्ट्रेट को आवेदन — "
        f"थाना {crime_input.station_name} तथा पुलिस अधीक्षक द्वारा कार्रवाई में विफलता",
        styles["heading"]
    ))
    
    story.append(Paragraph("महोदय/महोदया,", styles["body"]))
    story.append(Paragraph(
        f"निवेदन है कि मैंने दिनांक {crime_input.date} को थाना {crime_input.station_name} "
        f"में संज्ञेय अपराध (धारा {classification.bnss_section} BNSS) की शिकायत दी थी। "
        f"थाने ने FIR दर्ज नहीं की। इसके बाद मैंने पुलिस अधीक्षक को शिकायत की। "
        f"3 दिन बीत जाने के बाद भी कोई कार्रवाई नहीं हुई।",
        styles["body"]
    ))
    
    if narrative:
        story.append(Paragraph(narrative, styles["body"]))
    
    story.append(Paragraph(
        f"⚖️ धारा {classification.bnss_section} BNSS — {classification.offense_name_hindi}",
        styles["section_highlight"]
    ))
    
    story.append(Paragraph(
        "धारा 175(3) BNSS के अनुसार, यदि पुलिस अधीक्षक शिकायत पर कार्रवाई नहीं करता है "
        "तो पीड़ित सीधे मजिस्ट्रेट के समक्ष FIR दर्ज कराने का आवेदन दे सकता है।",
        styles["body"]
    ))
    
    story.append(Paragraph("<b>प्रार्थना:</b>", styles["heading"]))
    story.append(Paragraph(
        f"1. थाना {crime_input.station_name} को FIR दर्ज करने का आदेश दें।",
        styles["prayer"]
    ))
    story.append(Paragraph(
        "2. जांच की कानूनी देखरेख सुनिश्चित करें।",
        styles["prayer"]
    ))
    
    story.append(Paragraph(
        f"भवदीय/भवदीया,<br/>{victim_name}<br/>दिनांक: {crime_input.date}",
        styles["signature"]
    ))
    
    story.append(Paragraph(DISCLAIMER_HINDI, styles["disclaimer"]))
    
    doc.build(story)
    return buffer.getvalue()


def generate_hc_writ(
    crime_input: CrimeInput,
    classification: ClassificationResult,
    authority: dict,
    narrative: str,
    officer_info: OfficerInfo = None,
    lang_code: str = "hi-IN"
) -> bytes:
    """Generate HC Writ Petition shell under Article 226 Constitution."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=2*cm, bottomMargin=2*cm,
                            leftMargin=2*cm, rightMargin=2*cm)
    styles = _create_styles(lang_code)
    story = []
    
    victim_name = crime_input.victim_name or "पीड़ित"
    
    story.append(Paragraph("रिट याचिका (ड्राफ्ट)", styles["title"]))
    story.append(Paragraph(
        "भारत के संविधान के अनुच्छेद 226 के अंतर्गत",
        styles["heading"]
    ))
    
    story.append(Paragraph(f"दिनांक: {crime_input.date}", styles["date_line"]))
    
    story.append(Paragraph(
        f"माननीय {authority.get('title_hindi', 'उच्च न्यायालय')} में,<br/>"
        f"{authority.get('address_hindi', '')}",
        styles["address"]
    ))
    
    story.append(Paragraph(
        f"<b>याचिकाकर्ता:</b> {victim_name}",
        styles["body"]
    ))
    story.append(Paragraph(
        f"<b>प्रतिवादी:</b> 1. राज्य सरकार  2. पुलिस अधीक्षक  3. ज़िला मजिस्ट्रेट",
        styles["body"]
    ))
    
    story.append(Paragraph(
        f"<b>विषय:</b> संज्ञेय अपराध (धारा {classification.bnss_section} BNSS) में "
        f"FIR दर्ज न करने और अनुक्रमिक प्राधिकारियों द्वारा कार्रवाई न करने के विरुद्ध",
        styles["heading"]
    ))
    
    story.append(Paragraph(
        f"याचिकाकर्ता ने दिनांक {crime_input.date} को थाना {crime_input.station_name} में "
        f"संज्ञेय अपराध की शिकायत दी। पुलिस ने FIR दर्ज नहीं की। इसके बाद पुलिस अधीक्षक "
        f"और ज़िला मजिस्ट्रेट को शिकायत की गई। 18 दिन बीत जाने के बाद भी कोई कार्रवाई नहीं हुई।",
        styles["body"]
    ))
    
    if narrative:
        story.append(Paragraph(narrative, styles["body"]))
    
    story.append(Paragraph(
        f"⚖️ धारा {classification.bnss_section} BNSS — {classification.offense_name_hindi}",
        styles["section_highlight"]
    ))
    
    story.append(Paragraph(
        "⚠️ <b>यह एक ड्राफ्ट है। उच्च न्यायालय में दाखिल करने से पहले "
        "किसी वकील से अनिवार्य रूप से समीक्षा कराएं।</b>",
        styles["section_highlight"]
    ))
    
    story.append(Paragraph("<b>प्रार्थना:</b>", styles["heading"]))
    story.append(Paragraph(
        f"1. प्रतिवादियों को FIR दर्ज करने और जांच शुरू करने का निर्देश दें।",
        styles["prayer"]
    ))
    story.append(Paragraph(
        "2. अधिकारियों की कर्तव्य विफलता पर कार्रवाई का आदेश दें।",
        styles["prayer"]
    ))
    
    story.append(Paragraph(
        f"भवदीय/भवदीया,<br/>{victim_name}<br/>दिनांक: {crime_input.date}",
        styles["signature"]
    ))
    
    story.append(Paragraph(DISCLAIMER_HINDI, styles["disclaimer"]))
    
    doc.build(story)
    return buffer.getvalue()


def generate_all_documents(
    crime_input: CrimeInput,
    classification: ClassificationResult,
    officer_info: OfficerInfo,
    sp_authority: dict,
    dm_authority: dict,
    hc_authority: dict,
    narrative_sp: str = "",
    narrative_dm: str = "",
    narrative_hc: str = "",
    lang_code: str = "hi-IN"
) -> dict:
    """
    Generate all 3 escalation documents in one call.
    
    Returns:
        Dict with 'sp_complaint', 'dm_petition', 'hc_writ' as PDF bytes
    """
    from legal.officer_accountability import generate_accountability_doc
    
    sp_pdf = generate_sp_complaint(
        crime_input, classification, sp_authority, narrative_sp, officer_info, lang_code
    )
    dm_pdf = generate_dm_petition(
        crime_input, classification, dm_authority, narrative_dm, sp_authority, officer_info, lang_code
    )
    hc_pdf = generate_hc_writ(
        crime_input, classification, hc_authority, narrative_hc, officer_info, lang_code
    )
    accountability_pdf = generate_accountability_doc(
        crime_input, officer_info, sp_authority, lang_code
    )
    
    return {
        "sp_complaint": sp_pdf,
        "dm_petition": dm_pdf,
        "hc_writ": hc_pdf,
        "accountability_doc": accountability_pdf,
    }
