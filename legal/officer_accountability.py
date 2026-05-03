"""
FirstReport — Officer Accountability Document
================================================
Generates the S.166 BNSS accountability document — the "wow moment."
This is a SEPARATE document targeting the specific police officer by name.

Key sentence (exact Hindi from spec):
"उनपर भारतीय नागरिक सुरक्षा संहिता 2023 की धारा 166 के तहत मुल्ज़िम है 
जो कहती है कि कोई भी सरकारी अधिकारी कानून की अवहेलना नहीं कर सकता।"
"""

import io
import logging
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from core.schemas import (
    CrimeInput, OfficerInfo,
    DISCLAIMER_HINDI, ACCOUNTABILITY_TEXT_HINDI
)

logger = logging.getLogger(__name__)


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
    
    import os
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


def generate_accountability_doc(
    crime_input: CrimeInput,
    officer_info: OfficerInfo,
    authority: dict = None,
    lang_code: str = "hi-IN"
) -> bytes:
    """
    Generate the S.166 BNSS officer accountability document.
    
    This document:
    - Names the specific officer (from voice transcript or notice board photo)
    - Cites S.166 BNSS (public servant disobeying law)
    - Is addressed to the SHRC or SP
    - Is a separate, targeted accountability document
    
    Args:
        crime_input: CrimeInput with incident details
        officer_info: OfficerInfo with officer name/batch from photo or voice
        authority: SP or SHRC authority dict
        lang_code: The requested language code for fonts
    
    Returns:
        PDF bytes
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=2*cm, bottomMargin=2*cm,
                            leftMargin=2*cm, rightMargin=2*cm)
    
    font = _get_font_name(lang_code)
    
    styles = {
        "title": ParagraphStyle(
            "Title", fontName=font, fontSize=16, leading=22,
            alignment=TA_CENTER, spaceAfter=6*mm,
            textColor=HexColor("#7F77DD")
        ),
        "subtitle": ParagraphStyle(
            "Subtitle", fontName=font, fontSize=12, leading=16,
            alignment=TA_CENTER, spaceAfter=8*mm,
            textColor=HexColor("#26215C")
        ),
        "heading": ParagraphStyle(
            "Heading", fontName=font, fontSize=12, leading=16,
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
        "highlight": ParagraphStyle(
            "Highlight", fontName=font, fontSize=12, leading=18,
            alignment=TA_LEFT, spaceAfter=4*mm, spaceBefore=4*mm,
            textColor=HexColor("#7F77DD"), backColor=HexColor("#EEEDFE"),
            borderPadding=(6, 10, 6, 10)
        ),
        "accountability": ParagraphStyle(
            "Accountability", fontName=font, fontSize=13, leading=20,
            alignment=TA_LEFT, spaceAfter=4*mm, spaceBefore=4*mm,
            textColor=HexColor("#E24B4A"), backColor=HexColor("#FCEBEB"),
            borderPadding=(8, 12, 8, 12)
        ),
        "date_line": ParagraphStyle(
            "DateLine", fontName=font, fontSize=10, leading=14,
            alignment=TA_RIGHT, spaceAfter=4*mm,
            textColor=HexColor("#495057")
        ),
        "prayer": ParagraphStyle(
            "Prayer", fontName=font, fontSize=11, leading=16,
            alignment=TA_LEFT, spaceAfter=3*mm,
            textColor=HexColor("#1a1a2e"), leftIndent=10*mm
        ),
        "signature": ParagraphStyle(
            "Signature", fontName=font, fontSize=11, leading=15,
            alignment=TA_LEFT, spaceBefore=15*mm,
            textColor=HexColor("#1a1a2e")
        ),
        "disclaimer": ParagraphStyle(
            "Disclaimer", fontName=font, fontSize=9, leading=12,
            alignment=TA_CENTER, spaceAfter=2*mm, spaceBefore=6*mm,
            textColor=HexColor("#6c757d"), borderWidth=0.5,
            borderColor=HexColor("#dee2e6"), borderPadding=(6, 10, 6, 10)
        ),
        "wow_label": ParagraphStyle(
            "WowLabel", fontName=font, fontSize=10, leading=14,
            alignment=TA_CENTER, spaceAfter=4*mm,
            textColor=HexColor("#7F77DD"), backColor=HexColor("#EEEDFE"),
            borderPadding=(3, 8, 3, 8)
        ),
    }
    
    story = []
    
    victim_name = crime_input.victim_name or "पीड़ित"
    
    # Determine officer name display
    if officer_info.name and officer_info.name != "कर्तव्य अधिकारी":
        officer_display = officer_info.name
        if officer_info.batch_number:
            officer_display += f", बैच नं. {officer_info.batch_number}"
        if officer_info.posting:
            officer_display += f", {officer_info.posting}"
        officer_source = officer_info.source
    elif crime_input.officer_name:
        officer_display = crime_input.officer_name
        officer_source = "voice"
    else:
        officer_display = f"कर्तव्य अधिकारी (दिनांक {crime_input.date}, थाना {crime_input.station_name})"
        officer_source = "default"
    
    # Wow label
    story.append(Paragraph("नई फ़ाइल — अधिकारी जवाबदेही दस्तावेज़", styles["wow_label"]))
    
    # Title
    story.append(Paragraph("अधिकारी जवाबदेही शिकायत", styles["title"]))
    story.append(Paragraph(
        "भारतीय नागरिक सुरक्षा संहिता 2023 की धारा 166 के अंतर्गत",
        styles["subtitle"]
    ))
    
    # Explanation card
    story.append(Paragraph(
        "यह अधिकारी के खिलाफ अलग शिकायत है।",
        styles["highlight"]
    ))
    
    # Date
    story.append(Paragraph(f"दिनांक: {crime_input.date}", styles["date_line"]))
    
    # To address
    if authority:
        story.append(Paragraph("सेवा में,", styles["address"]))
        story.append(Paragraph(
            f"{authority.get('title_hindi', 'पुलिस अधीक्षक')},<br/>"
            f"{authority.get('address_hindi', '')}",
            styles["address"]
        ))
    
    # Subject with officer name
    story.append(Paragraph(
        f"<b>विषय:</b> {officer_display} के विरुद्ध धारा 166 BNSS के तहत शिकायत",
        styles["heading"]
    ))
    
    # Against
    story.append(Paragraph(
        f"<b>के विरुद्ध:</b> {officer_display}",
        styles["body"]
    ))
    if officer_source == "photo":
        story.append(Paragraph(
            "(नोटिस बोर्ड की फोटो से पहचाने गए)",
            styles["body"]
        ))
    
    # Body
    story.append(Paragraph("महोदय/महोदया,", styles["body"]))
    story.append(Paragraph(
        f"निवेदन है कि दिनांक {crime_input.date} को थाना {crime_input.station_name} में "
        f"उपरोक्त अधिकारी ने संज्ञेय अपराध की सूचना पर FIR दर्ज करने से इनकार किया। "
        f"यह भारतीय नागरिक सुरक्षा संहिता 2023 की धारा 173 का सीधा उल्लंघन है।",
        styles["body"]
    ))
    
    # THE KEY ACCOUNTABILITY TEXT
    story.append(Paragraph(ACCOUNTABILITY_TEXT_HINDI, styles["accountability"]))
    
    # Legal basis
    story.append(Paragraph(
        "धारा 166 BNSS स्पष्ट रूप से कहती है कि कोई भी लोक सेवक जो जानबूझकर "
        "कानून की अवहेलना करता है जिससे किसी व्यक्ति को हानि या क्षति होती है, "
        "वह एक वर्ष तक के कारावास, या जुर्माने, या दोनों से दंडनीय है।",
        styles["body"]
    ))
    
    # Prayer
    story.append(Paragraph("<b>प्रार्थना:</b>", styles["heading"]))
    story.append(Paragraph(
        f"1. {officer_display} के विरुद्ध धारा 166 BNSS के तहत कार्रवाई करें।",
        styles["prayer"]
    ))
    story.append(Paragraph(
        "2. विभागीय जांच शुरू करें।",
        styles["prayer"]
    ))
    story.append(Paragraph(
        "3. पीड़ित की शिकायत पर FIR दर्ज करने का आदेश दें।",
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
