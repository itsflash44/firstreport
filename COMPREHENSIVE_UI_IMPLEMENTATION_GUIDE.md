# FirstReport: Complete UI Transformation + Feature Implementation Guide
**Version:** 2.0  
**Target:** Claude Sonnet (capable of full-stack implementation)  
**Scope:** One comprehensive file containing complete UI redesign, architecture, research, encryption, sharing, 20+ features, and Sonnet capability assessment

---

## PART 1: PROJECT ANALYSIS & CURRENT STATE

### What FirstReport Currently Does (Based on Architecture)

```
USER JOURNEY:
1. Select Language (11 languages: Hindi, English, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia)
   ↓
2. Record/Type Incident Narrative (via Sarvam STT API)
   ↓
3. Gemma 4 Clarification Loop (AI asks follow-up questions to fill gaps)
   ↓
4. Gemma 4 Classification (Match against BNSS Schedule 1 Database)
   ↓
5. Extract Entities (Officer name, station, victim details)
   ↓
6. Generate 4 PDF Documents:
   - SP Complaint (§166 BNSS)
   - DM Petition (§175(3) BNSS)
   - HC Writ (Article 226, Constitution)
   - Officer Accountability (§166 BNSS specific)
   ↓
7. Cache PDFs Offline (SQLite)
   ↓
8. Send via Telegram (when WiFi available)
```

### Current Tech Stack
- **Frontend:** Vanilla HTML/CSS/JS (zero build step)
- **Backend:** FastAPI (Python)
- **AI Model:** Gemma 4 4B-Instruct via Kaggle Models Hub
- **STT:** Sarvam AI API (Hindi + regional languages)
- **PDF Generation:** ReportLab (multi-language fonts)
- **Database:** SQLite (offline cache)
- **Delivery:** Telegram Bot (offline queue)

---

## PART 2: COMPLETE UI REDESIGN REQUIREMENTS

### Current Issues
❌ Language grid takes entire screen (70% waste of space)  
❌ UI doesn't reflect green + brown theme  
❌ No speaker/TTS on every element  
❌ PDF download only → Telegram (limited)  
❌ No encryption for sensitive data  
❌ No multiple sharing options  
❌ Limited case categorization visibility  
❌ No offline/online status clear  
❌ No progress tracking  
❌ No document preview before sending

### New UI Structure (Green + Brown Theme)

```
┌──────────────────────────────────────────────────────┐
│ HEADER (Fixed, Green)                               │
│ 🏛️ FirstReport | 🟢 Online/Offline | 📞 15100      │
├──────────────────────────────────────────────────────┤
│ SIDEBAR (Brown)     │ MAIN CONTENT (White)          │
│ ◆ भाषा: हिंदी ▼     │ STEP 1: Case Selection        │
│ ◆ प्रगति: 20%      │ ┌──────────────────────────┐  │
│ ◆ इतिहास          │ │ केस चुनें (Select Case)   │  │
│ ◆ सेटिंग्स          │ │ [Dropdown - Green]        │  │
│                    │ │ 🔊 (Speaker icon)         │  │
│                    │ │                           │  │
│                    │ │ STEP 2: Case Details      │  │
│                    │ │ [Show case description]   │  │
│                    │ │ 🔊 Read aloud            │  │
│                    │ │                           │  │
│                    │ │ [Next →] Green button     │  │
│                    │ └──────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## PART 3: 20+ ADDITIONAL FEATURES (Gemma-Processable)

### Features 1-10: Core Functionality
1. **Case History Tracker** — Show past cases with status (SP pending, DM approved, etc.)
2. **Document Preview** — Preview PDF before sending (with TTS)
3. **Multi-Channel Sharing** — Send to Email, WhatsApp, Google Drive, Dropbox, not just Telegram
4. **Encryption Toggle** — User can choose to encrypt sensitive data (AES-256)
5. **Offline Sync Queue** — Show which documents are queued for sending, with retry logic
6. **Authority Contact Updates** — Gemma fetches latest police/magistrate contacts for user's district
7. **Follow-Up Reminders** — App reminds user when 7-day SP deadline is approaching
8. **Multiple Victim Support** — Can record incidents for different family members
9. **Evidence Photo Upload** — Attach photos of police station notice board, injuries, documents
10. **Timeline Visualization** — Show escalation deadlines (Day 0→7→30→Open) with countdown

### Features 11-20: User Experience
11. **Voice Note Playback** — Listen to your own recorded statement before submission
12. **Gemma Confidence Score** — Show "92% confident this is §343" with explanation
13. **Legal Reading Guide** — Gemma generates simple explanation of applicable BNSS sections (no lawyer-speak)
14. **Offline Speech Recognition** — Local STT fallback if Sarvam API fails (using Web Speech API)
15. **Dark Mode Toggle** — Preserve battery on Jio 4G devices
16. **Accessibility Mode** — Larger fonts, higher contrast, slower speech rate
17. **Multi-Language Keyboard Support** — Type in Odia/Gujarati without switching apps
18. **Print-Friendly PDFs** — Generate printable versions without digital signatures
19. **Officer ID Extraction** — Camera captures notice board, Gemma extracts officer details
20. **Incident Category Icons** — Visual symbols for STANDARD, POCSO (CHILD), WOMEN/DV, SENIOR CITIZEN

### Features 21-30: Legal Intelligence
21. **Similar Cases Database** — Show past BNSS §343 cases and their outcomes
22. **Jurisdiction Checker** — Warn if incident happened outside user's state (may need different courts)
23. **Cost Calculator** — Estimate legal filing fees for SP/DM/HC petitions
24. **Document Format Validator** — Check if submitted document meets court standards
25. **Appeal Tracker** — After HC writ, track appeal to Supreme Court automatically
26. **Bail Information Generator** — Gemma explains bail types relevant to offense
27. **Witness Statement Recorder** — Allow separate voice recordings for witnesses
28. **Injury Documentation Guide** — Step-by-step photos + Gemma annotation for medical evidence
29. **Case Law Suggester** — Gemma references landmark BNSS judgments relevant to user's case
30. **Penalty Estimator** — Show potential jail time + fine based on offense severity

---

## PART 4: DATA ENCRYPTION & SECURITY ARCHITECTURE

### Encryption Strategy

#### 4.1 Data at Rest (Local SQLite Cache)
```python
# Encryption: SQLite with SQLCipher
# User sets a PIN on first app load
# Every cached PDF, transcript, case data is encrypted with PIN-derived key

from sqlcipher3 import dbapi2 as sqlite

# On app start, prompt user for PIN
pin = prompt_user_for_pin()  # 4-6 digits
encryption_key = hash_pin(pin)  # PBKDF2 with SHA-256

conn = sqlite.connect('firstReport.db')
conn.execute(f"PRAGMA key = '{encryption_key}'")

# Now all data is encrypted on disk
```

#### 4.2 Data in Transit (Server → Telegram/Email/WhatsApp)
```
USER'S DEVICE:
1. PDF generated locally (never leaves device unless user sends)
2. User chooses sharing method:
   - Telegram: Encrypted PDF sent to bot, stored on Telegram servers
   - Email: PDF encrypted with recipient's public key (RSA-2048)
   - WhatsApp: PDF encrypted with WhatsApp's E2E encryption (automatic)
   - Google Drive: PDF uploaded with user's Google Drive encryption
   - Dropbox: PDF uploaded with Dropbox's AES-256 encryption

ENCRYPTION FLOW:
PDF → [User PIN] → AES-256 encrypt → Send via chosen channel
```

#### 4.3 Sensitive Data Redaction
```
BEFORE SENDING, USER CAN CHOOSE TO:
- Redact victim name → Replace with "Victim A"
- Redact officer name → Replace with "Police Officer"
- Redact specific dates → Show as "Date of Incident"
- Remove contact details → Phone numbers masked as "XX-XXXX-9999"
```

---

## PART 5: DOCUMENT DELIVERY ARCHITECTURE

### Current (Telegram Only)
```
PDF → Cache → Telegram Bot → User
```

### New (Multi-Channel)

```
┌─────────────────────────────────────────────────────┐
│ USER SELECTS SHARING METHOD                         │
├─────────────────────────────────────────────────────┤
│ 📤 Telegram Bot                                     │
│    └─ Instant delivery if online                    │
│    └─ Queue if offline (auto-send when WiFi back)  │
│                                                     │
│ 📧 Email                                            │
│    └─ Send to NALSA, lawyer, judge email          │
│    └─ Use Python smtplib + encryption             │
│                                                     │
│ 💬 WhatsApp                                         │
│    └─ Send via WhatsApp Business API               │
│    └─ Auto-filled with template message            │
│                                                     │
│ ☁️ Google Drive                                     │
│    └─ User grants OAuth2 permission once           │
│    └─ Auto-upload with shared folder structure     │
│    └─ Enable sharing with lawyer                   │
│                                                     │
│ 💾 Dropbox                                          │
│    └─ Similar to Google Drive                      │
│                                                     │
│ 📱 Download to Device                              │
│    └─ Open-source encryption for offline sharing   │
│                                                     │
│ 🖨️ Print Locally                                   │
│    └─ Generate printable PDF (A4 format)           │
│                                                     │
│ 📋 View as Text (No PDF)                           │
│    └─ Display case summary in plaintext            │
│    └─ Copy-paste to any app                        │
└─────────────────────────────────────────────────────┘
```

### Implementation (Backend FastAPI)
```python
from fastapi import FastAPI, UploadFile, File
from cryptography.fernet import Fernet
import smtplib, telegram, dropbox, google.oauth2

@app.post("/api/share-document")
async def share_document(
    document_id: str,
    share_method: str,  # "telegram", "email", "whatsapp", "drive", "dropbox", "download", "print", "text"
    share_target: str = None,  # email address, WhatsApp number, etc.
    encrypt: bool = True,
    user_pin: str = None
):
    pdf = get_cached_pdf(document_id)
    
    if encrypt:
        pdf = encrypt_pdf(pdf, user_pin)
    
    if share_method == "telegram":
        send_via_telegram(pdf, TELEGRAM_BOT_TOKEN)
    elif share_method == "email":
        send_via_email(pdf, share_target)
    elif share_method == "whatsapp":
        send_via_whatsapp(pdf, share_target)
    elif share_method == "drive":
        send_via_google_drive(pdf, user_oauth_token)
    elif share_method == "dropbox":
        send_via_dropbox(pdf, user_oauth_token)
    elif share_method == "download":
        return FileResponse(pdf)
    elif share_method == "print":
        return generate_printable_pdf(pdf)
    elif share_method == "text":
        return extract_text_from_pdf(pdf)
    
    return {"status": "shared", "method": share_method}
```

---

## PART 6: USER RESEARCH (What Sunita & Users Need)

### Primary User: Sunita Devi (38, Domestic Worker, Ghaziabad UP)
- ✅ **Voice-only input** (no typing required)
- ✅ **Works completely offline** (Jio 4G unreliable)
- ✅ **All Hindi/Odia/Gujarati** (no English)
- ✅ **Large touch targets** (44px+ buttons, arthritis considerations)
- ✅ **Speaker on every element** (low literacy)
- ✅ **Simple language** (no legal jargon in UI)
- ✅ **Confirmation dialogs** (prevent accidental sending)
- ✅ **Document preview** (see what's being sent before sending)
- ✅ **Easy sharing** (one-tap to send to friend/lawyer)
- ✅ **Encryption** (fear of police accessing device)

### Secondary User: Lawyer/NALSA Officer
- ✅ **Multiple case view** (manage 20+ clients)
- ✅ **PDF export** (for court filing)
- ✅ **Client history** (track case progress)
- ✅ **Bulk operations** (send multiple documents)
- ✅ **Edit capability** (modify auto-generated text)
- ✅ **English mode** (for legal proceedings)

### Tertiary User: Police/Magistrate (Adversarial)
- ✅ **Encrypted documents** (prevent tampering)
- ✅ **Digital signature** (proof of authentic submission)
- ✅ **Timestamp** (court-admissible)
- ✅ **Audit trail** (show when document was created/sent)

---

## PART 7: TTS (TEXT-TO-SPEECH) ON EVERY UI ELEMENT

### Implementation Pattern

```html
<!-- Every interactive element has speaker icon -->
<div class="card">
  <h2>
    case chुनें
    <button class="speaker" data-text="case chुनें, apni case ke type select karein" aria-label="Play audio">
      🔊
    </button>
  </h2>
  <p>कृपया अपने केस का प्रकार चुनें</p>
  <button class="speaker" data-text="कृपया अपने केस का प्रकार चुनें">🔊</button>
  
  <select class="dropdown">
    <option data-text="सामान्य अपराध">सामान्य अपराध</option>
    <option data-text="बच्चों के साथ अपराध">बच्चों के साथ अपराध</option>
  </select>
  <button class="speaker" aria-label="Hear dropdown options">🔊</button>
</div>

<script>
document.querySelectorAll('.speaker').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.text;
    speakText(text, currentLanguage);
    triggerHaptic('light');
  });
});

function speakText(text, lang) {
  // Try Sarvam TTS first (for Hindi/regional languages)
  if (lang === 'hi' || isSarvamSupported(lang)) {
    useSarvamTTS(text, lang);
  } else {
    // Fallback to Web Speech API
    useWebSpeechAPI(text, lang);
  }
}
</script>
```

---

## PART 8: COMPLETE UI FLOW (STEP-BY-STEP)

### Screen 1: Language Selector (Dropdown) ✅
```
┌─────────────────────────────────────┐
│ 🏛️ FirstReport                     │
│ आपकी आवाज़, आपका हक़              │
├─────────────────────────────────────┤
│ भाषा चुनें: हिंदी ▼                  │
│ 🔊                                  │
│                                     │
│ [शुरू करें] (Green button)          │
└─────────────────────────────────────┘

ON CLICK:
- Haptic feedback (vibrate)
- Auto-navigate to Screen 2 after 300ms
- Cache language selection
```

### Screen 2: Case Type Selection
```
┌──────────────────────────────────────────────────┐
│ 🏛️ FirstReport | 🟢 Online | 📞 15100          │
├──────────────────────────────────────────────────┤
│ STEP 1: केस चुनें                               │
│ 🔊 (Speaker)                                    │
│                                                 │
│ ┌────────────────────────────────────────────┐  │
│ │ केस का प्रकार चुनें ▼                        │  │
│ │ 🔊                                          │  │
│ │ ┌──────────────────────────────────────┐   │  │
│ │ │ ✓ सामान्य अपराध (STANDARD)         │   │  │
│ │ │   सामान्य अपराध के लिए शिकायत     │   │  │
│ │ │ 🔊                                  │   │  │
│ │ ├──────────────────────────────────────┤   │  │
│ │ │   बच्चों के साथ अपराध (POCSO)      │   │  │
│ │ │   बच्चों से संबंधित अपराध          │   │  │
│ │ │ 🔊                                  │   │  │
│ │ ├──────────────────────────────────────┤   │  │
│ │ │   महिलाओं के विरुद्ध अपराध (DV)   │   │  │
│ │ │   यौन उत्पीड़न, दहेज, आदि          │   │  │
│ │ │ 🔊                                  │   │  │
│ │ ├──────────────────────────────────────┤   │  │
│ │ │   बुजुर्गों के विरुद्ध अपराध (ELDER)│   │  │
│ │ │   बुजुर्गों का दुर्व्यवहार, संपत्ति  │   │  │
│ │ │ 🔊                                  │   │  │
│ │ └──────────────────────────────────────┘   │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ आगे बढ़ूँ → (Green button + haptic)            │
└──────────────────────────────────────────────────┘
```

### Screen 3: Incident Recording
```
┌──────────────────────────────────────────────────┐
│ 🏛️ FirstReport | 🟢 Online | 📞 15100          │
├──────────────────────────────────────────────────┤
│ PROGRESS: [████░░░░░░] 40% (2/5 steps)          │
├──────────────────────────────────────────────────┤
│ STEP 2: घटना का विवरण                          │
│ 🔊 आप अपनी आवाज़ में घटना बताएँ               │
│                                                 │
│ ┌────────────────────────────────────────────┐  │
│ │ 🎤 ◉ ◉ ◉ (Pulsing waveform animation)     │  │
│ │    [RECORDING] 00:45                      │  │
│ │ 🔊                                        │  │
│                                              │  │
│ │ [Stop] [Delete] (Red) / [Save] (Green)  │  │
│ │ 🔊       🔊          🔊   🔊              │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ आपके अंतिम रिकॉर्डिंग:                        │
│ "मुझे गिरफ़्तार किया गया..." [00:45]          │
│ ▶️ 🔊 ❌ (Playback, Speaker, Delete)         │
│                                                 │
│ आगे बढ़ूँ → (Green button)                     │
└──────────────────────────────────────────────────┘
```

### Screen 4: Clarification Loop (Gemma)
```
┌──────────────────────────────────────────────────┐
│ 🏛️ FirstReport | 🟢 Online | 📞 15100          │
├──────────────────────────────────────────────────┤
│ PROGRESS: [██████░░░░] 60% (3/5 steps)          │
├──────────────────────────────────────────────────┤
│ STEP 3: अतिरिक्त जानकारी                      │
│ 🔊 Gemma की सवाल                               │
│                                                 │
│ ┌────────────────────────────────────────────┐  │
│ │ क्या आप बता सकते हैं कि घटना कब हुई?   │  │
│ │                                            │  │
│ │ 🔊 (Speaker to hear question)             │  │
│ │                                            │  │
│ │ [🎤 जवाब दें] (Green button, haptic)      │  │
│ │ 🔊                                        │  │
│ │                                            │  │
│ │ [स्किप करें] (Grey button)                │  │
│ │ 🔊                                        │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ (If user skips, show)                          │
│ ⚠️ अतिरिक्त जानकारी से दस्तावेज़ बेहतर होंगे │
│ 🔊                                             │
│                                                 │
│ आगे बढ़ूँ → (Green button)                     │
└──────────────────────────────────────────────────┘
```

### Screen 5: Classification Result
```
┌──────────────────────────────────────────────────┐
│ 🏛️ FirstReport | 🟢 Online | 📞 15100          │
├──────────────────────────────────────────────────┤
│ PROGRESS: [████████░░] 80% (4/5 steps)          │
├──────────────────────────────────────────────────┤
│ STEP 4: अपराध वर्गीकरण                         │
│ 🔊 Gemma का विश्लेषण                           │
│                                                 │
│ ┌────────────────────────────────────────────┐  │
│ │ BNSS धारा: 343 अवैध निरोध                   │  │
│ │ 🔊                                        │  │
│ │                                            │  │
│ │ 🟢 संज्ञेय अपराध (Police को FIR देना    │  │
│ │    अनिवार्य है)                           │  │
│ │ 🔊                                        │  │
│ │                                            │  │
│ │ आत्मविश्वास: ████████░░ 92%              │  │
│ │ 🔊                                        │  │
│ │                                            │  │
│ │ व्याख्या:                                  │  │
│ │ "अवैध निरोध का अर्थ किसी को गलत तरीके से  │  │
│ │  बंद करना। यह एक गंभीर अपराध है।"         │  │
│ │ 🔊                                        │  │
│ │                                            │  │
│ │ दंड: 6 माह - 3 साल जेल या ₹500-₹1000    │  │
│ │ 🔊                                        │  │
│ │                                            │  │
│ │ अन्य संबंधित धाराएँ:                      │  │
│ │ • 340 (सामान्य अवैध निरोध) 🔊           │  │
│ │ • 342 (व्यक्तिगत बंधनखाना) 🔊            │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ आगे बढ़ूँ → (Green button)                     │
└──────────────────────────────────────────────────┘
```

### Screen 6: Document Generation & Sharing
```
┌──────────────────────────────────────────────────┐
│ 🏛️ FirstReport | 🟢 Online | 📞 15100          │
├──────────────────────────────────────────────────┤
│ PROGRESS: [██████████] 100% (5/5 steps)         │
├──────────────────────────────────────────────────┤
│ STEP 5: आपके दस्तावेज़                         │
│ 🔊 4 कानूनी दस्तावेज़ तैयार हैं                │
│                                                 │
│ [1] SP को शिकायत (तुरंत भेजें)                  │
│ 🔊 [📥 Download] [Preview 👁️] [Share 📤]      │
│    🔊      🔊      🔊                          │
│                                                 │
│ [2] DM को याचिका (7 दिन में भेजें)            │
│ 🔊 [📥 Download] [Preview 👁️] [Share 📤]      │
│    🔊      🔊      🔊                          │
│                                                 │
│ [3] HC रिट (30 दिन में भेजें) 🔒               │
│ 🔊 [Day 30 के बाद उपलब्ध]                     │
│                                                 │
│ [4] पुलिस अधिकारी के विरुद्ध (तुरंत)          │
│ 🔊 [📥 Download] [Preview 👁️] [Share 📤]      │
│    🔊      🔊      🔊                          │
│                                                 │
├──────────────────────────────────────────────────┤
│ कहाँ भेजें?                                     │
│ 🔊                                             │
│                                                 │
│ ☐ 📱 Telegram Bot (Offline queue) 🔊           │
│ ☐ 📧 Email (NALSA/Lawyer) 🔊                   │
│ ☐ 💬 WhatsApp (Share) 🔊                       │
│ ☐ ☁️ Google Drive 🔊                           │
│ ☐ 💾 Dropbox 🔊                                │
│ ☐ 📥 Download (Local) 🔊                       │
│ ☐ 🖨️ Print 🔊                                  │
│                                                 │
│ 🔐 Encrypt documents? ☐ 🔊                    │
│                                                 │
│ [Send All Documents] (Green, haptic)           │
│ 🔊                                             │
│                                                 │
│ ┌────────────────────────────────────────────┐  │
│ │ Share Success! ✓                          │  │
│ │ 🔊                                        │  │
│ │ Documents queued for sending              │  │
│ │ 🔊                                        │  │
│ │ [Back to Home]                            │  │
│ │ 🔊                                        │  │
│ └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Screen 7: Case History & Tracking
```
┌──────────────────────────────────────────────────┐
│ 🏛️ FirstReport | 🟢 Online | 📞 15100          │
├──────────────────────────────────────────────────┤
│ TAB: [🏠 मामला] [📋 इतिहास] [⚙️ सेटिंग्स]      │
│      🔊        🔊          🔊                   │
├──────────────────────────────────────────────────┤
│ इतिहास: आपके सभी मामले                        │
│ 🔊                                             │
│                                                 │
│ 📌 मामला #1: अवैध निरोध (§343)               │
│ 🔊                                             │
│ स्थिति: SP को भेजा गया ✓                      │
│ 🔊                                             │
│ 📅 तारीख: 2026-05-01                          │
│ 🔊                                             │
│ ⏳ अगला चरण: DM को 6 दिन में भेजें           │
│ 🔊                                             │
│ [👁️ विवरण देखें]                              │
│ 🔊                                             │
│                                                 │
│ 📌 मामला #2: महिला के विरुद्ध अपराध (§376)  │
│ 🔊                                             │
│ स्थिति: प्रारंभिक रिकॉर्डिंग                  │
│ 🔊                                             │
│ [👁️ विवरण देखें]                              │
│ 🔊                                             │
│                                                 │
│ [➕ नया मामला शुरू करें]                       │
│ 🔊                                             │
└──────────────────────────────────────────────────┘
```

---

## PART 9: ENCRYPTION DETAILS

### Encryption Standard: AES-256-GCM

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import os

class DocumentEncryption:
    
    @staticmethod
    def encrypt_pdf(pdf_bytes: bytes, user_pin: str) -> bytes:
        """
        Encrypt PDF with AES-256-GCM using PIN-derived key
        """
        # Derive key from PIN
        salt = os.urandom(16)
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(user_pin.encode())
        
        # Encrypt
        nonce = os.urandom(12)
        cipher = AESGCM(key)
        ciphertext = cipher.encrypt(nonce, pdf_bytes, None)
        
        # Return salt + nonce + ciphertext (for decryption later)
        return salt + nonce + ciphertext
    
    @staticmethod
    def decrypt_pdf(encrypted_bytes: bytes, user_pin: str) -> bytes:
        """Decrypt PDF"""
        salt = encrypted_bytes[:16]
        nonce = encrypted_bytes[16:28]
        ciphertext = encrypted_bytes[28:]
        
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(user_pin.encode())
        
        cipher = AESGCM(key)
        plaintext = cipher.decrypt(nonce, ciphertext, None)
        return plaintext
```

### Storage: SQLCipher (Encrypted SQLite)
```bash
# SQLCipher encrypts entire database
pip install sqlcipher3

# Python usage
from sqlcipher3 import dbapi2 as sqlite

conn = sqlite.connect('firstReport.db')
conn.execute("PRAGMA key = '1234'")  # PIN/password
# Now all queries are encrypted on disk
```

### Transit: End-to-End Encryption
- **Telegram:** Telegram's built-in E2E encryption
- **WhatsApp:** WhatsApp's built-in E2E encryption
- **Email:** TLS + optional S/MIME signing
- **Google Drive/Dropbox:** Their built-in AES-256 encryption

---

## PART 10: SONNET CAPABILITY ASSESSMENT

### Can Claude Sonnet Build All This? ✅ YES

#### Sonnet's Strengths for This Project
1. **Full-Stack Capability** ✅
   - HTML/CSS/JS frontend (vanilla, no build step)
   - Python backend (FastAPI)
   - Database design (SQLite/SQLCipher)
   - Cryptography (PyCryptodome)
   - API integrations (Telegram, WhatsApp, Google Drive, Dropbox)

2. **Large Context Window** ✅
   - This entire prompt fits in one call
   - Sonnet can hold full project context
   - Can write 50+ files in parallel

3. **Code Quality** ✅
   - Production-ready encryption
   - Error handling + fallbacks
   - Offline-first architecture
   - Mobile optimization

4. **Integration Capability** ✅
   - Gemma 4 pipeline integration
   - Sarvam STT/TTS integration
   - Existing FastAPI routes extension
   - SQLite cache management

#### Sonnet Limitations & Workarounds
| Limitation | Workaround |
|-----------|-----------|
| Can't deploy to Kaggle Models directly | Provide deployment script separately |
| Can't test on real device | Provide test checklist + QA steps |
| Can't create secret API keys | Document where user should add them |
| Can't handle 1TB+ datasets | Not needed—data is cached locally |

#### Recommended Workflow for Sonnet
```
SONNET'S TASK BREAKDOWN:
1. Create frontend HTML (main app shell with all screens)
2. Create CSS files (theme + component styles)
3. Create JavaScript modules (state management, TTS, encryption)
4. Extend FastAPI backend (new endpoints for sharing, encryption, history)
5. Create database migrations (for history, encryption keys)
6. Create integration modules (Telegram, Email, WhatsApp, Google Drive, Dropbox)
7. Create configuration file (.env template)
8. Create deployment guide
9. Create user guide (in Hindi)
10. Create testing checklist
```

---

## PART 11: IMPLEMENTATION CHECKLIST FOR SONNET

### Phase 1: UI Foundation (Day 1)
- [ ] Language dropdown selector (replace card grid)
- [ ] Case type selector (with icons + descriptions)
- [ ] Incident recording screen (waveform animation)
- [ ] Clarification loop screen
- [ ] Classification display (with explanation)
- [ ] Document generation screen
- [ ] Apply green + brown theme throughout

### Phase 2: Audio/TTS (Day 1)
- [ ] Add speaker icon to every element
- [ ] Implement Sarvam TTS for Hindi/supported languages
- [ ] Implement Web Speech API fallback
- [ ] Audio playback for recordings
- [ ] Haptic feedback on all buttons

### Phase 3: Document Management (Day 2)
- [ ] PDF preview screen
- [ ] Download functionality
- [ ] Encryption toggle + PIN entry
- [ ] Document history tracking
- [ ] Offline caching with encryption

### Phase 4: Multi-Channel Sharing (Day 2)
- [ ] Telegram sharing (existing, enhance)
- [ ] Email integration (SMTP)
- [ ] WhatsApp Business API integration
- [ ] Google Drive OAuth2 integration
- [ ] Dropbox OAuth2 integration
- [ ] Local download
- [ ] Print functionality

### Phase 5: Data Encryption (Day 3)
- [ ] SQLCipher integration for offline cache
- [ ] AES-256-GCM encryption for PDFs
- [ ] PIN-based key derivation (PBKDF2)
- [ ] Data redaction options
- [ ] Decryption on retrieve

### Phase 6: Additional Features (Day 3-4)
- [ ] Case history tracker
- [ ] Follow-up reminder notifications
- [ ] Evidence photo upload + Gemma analysis
- [ ] Offline sync queue with retry logic
- [ ] Dark mode toggle
- [ ] Accessibility mode (larger fonts, etc.)
- [ ] Settings/preferences screen

### Phase 7: Legal Intelligence (Day 4)
- [ ] Similar cases database (mock data initially)
- [ ] Jurisdiction checker
- [ ] Cost calculator
- [ ] Appeal tracker
- [ ] Case law suggester (Gemma integration)

### Phase 8: Testing & Deployment (Day 4-5)
- [ ] Unit tests (encryption, sharing, caching)
- [ ] Integration tests (Gemma, Sarvam, sharing APIs)
- [ ] Mobile responsiveness testing (simulate Galaxy A03)
- [ ] Offline mode testing
- [ ] Security audit (encryption, data handling)
- [ ] Performance testing (Jio 4G simulation)

---

## PART 12: DETAILED PROMPT FOR SONNET (THE ACTUAL TASK)

```
SONNET, READ THIS ENTIRE FILE AND COMPLETE THE FOLLOWING:

You are building FirstReport, an offline-first legal aid application for low-literacy users in India.

CONTEXT:
- User: Sunita Devi (38, domestic worker, Ghaziabad UP, no English)
- Device: Samsung Galaxy A03 (4GB RAM, Jio 4G, unreliable internet)
- Language: Hindi + 10 regional languages (all via voice)
- Legal Framework: BNSS 2023 (not CrPC)
- AI Model: Gemma 4 (via Kaggle Models Hub)
- STT: Sarvam AI API (regional languages)
- Delivery: Telegram, Email, WhatsApp, Google Drive, Dropbox

CURRENT ARCHITECTURE:
- Frontend: Vanilla HTML/CSS/JS (zero build step)
- Backend: FastAPI (Python)
- Database: SQLite (offline cache)
- PDF: ReportLab (multi-language)

YOUR TASK (ALL IN ONE IMPLEMENTATION):

1. CREATE COMPLETE UI REDESIGN
   - Language selector: Dropdown instead of grid (green + brown theme)
   - 7 screens: Language → Case Selection → Recording → Clarification → Classification → Documents → History
   - Speaker 🔊 icon on EVERY element (TTS on-click)
   - Progress bar (X/5 steps completed)
   - Haptic feedback on selection (vibrate)
   - Dark mode toggle (battery saving)
   - Accessibility mode (large fonts, high contrast)
   - Mobile-first (44px+ touch targets)

2. IMPLEMENT ENCRYPTION
   - SQLCipher for offline cache (PIN-based)
   - AES-256-GCM for PDFs (PBKDF2 key derivation)
   - Opt-in data redaction (names, dates, contacts)
   - Encrypted file transmission

3. MULTI-CHANNEL DOCUMENT SHARING
   - Telegram (existing, enhance)
   - Email (SMTP with TLS + optional S/MIME)
   - WhatsApp Business API
   - Google Drive (OAuth2)
   - Dropbox (OAuth2)
   - Local download (encrypted)
   - Print (PDF-A format)
   - Text-only (copy-paste)

4. ADD 20+ FEATURES
   [List all 30 from PART 3]
   Include Gemma integration for:
   - Authority contact auto-fetch (by district)
   - Case law suggestions (landmark BNSS judgments)
   - Legal explanations (simple Hindi, no jargon)
   - Similar case recommendations
   - Jurisdiction checker

5. TTS ON EVERYTHING
   - Use Sarvam API for Hindi + regional languages
   - Fallback to Web Speech API if Sarvam fails
   - Speaker button on: Headings, buttons, form fields, dropdown options, descriptions, warnings
   - Show playback indicator (waveform)
   - Speed control (1x, 0.75x, 1.25x)

6. OFFLINE-FIRST
   - All content cached locally (SQLCipher)
   - Works without internet
   - Sync queue when WiFi available
   - No API calls on critical path

7. SECURITY & PRIVACY
   - Encrypt all data at rest (PIN-based SQLCipher)
   - Encrypt all data in transit (TLS + AES-256)
   - No logging of sensitive data
   - No tracking/analytics
   - GDPR-compliant (user can export/delete all data)

8. EXTEND BACKEND (FastAPI)
   - New endpoints for: /share, /encrypt, /decrypt, /history, /settings
   - SQLCipher integration
   - WhatsApp/Email/Drive/Dropbox APIs
   - Offline sync queue management
   - Authority contact management

9. CREATE CONFIGURATION
   - .env template (for all API keys)
   - Theme CSS variables (green + brown)
   - Language strings (Hindi + 10 languages)
   - Feature flags (for rollout)

10. PROVIDE DOCUMENTATION
    - Complete user guide (Hindi)
    - Deployment guide (for Kaggle)
    - API documentation
    - Security whitepaper
    - Testing checklist

DELIVERABLES:
1. index.html (complete UI with all 7 screens)
2. styles/theme.css (green + brown + all components)
3. styles/responsive.css (mobile optimization)
4. js/app.js (state management + UI logic)
5. js/voice.js (TTS + microphone handling)
6. js/encryption.js (client-side AES-256)
7. js/offline.js (offline sync queue)
8. python/extended_backend.py (new FastAPI endpoints)
9. python/encryption_utils.py (server-side encryption)
10. python/sharing_manager.py (Telegram, Email, WhatsApp, Drive, Dropbox)
11. migrations/ (SQLCipher setup + history table)
12. .env.template
13. USER_GUIDE_HI.md (Hindi user guide)
14. DEPLOYMENT_GUIDE.md
15. TESTING_CHECKLIST.md

CONSTRAINTS:
- No external build tools (Webpack, Vite, etc.)
- No React/Vue/frameworks (vanilla JS only)
- Works on Samsung Galaxy A03 (low RAM, Jio 4G)
- All text in Hindi for primary screens (English for settings)
- Encrypted by default (user can toggle)
- Graceful degradation (works without internet, without Sarvam API, without haptics)

ASSESSMENT:
Can you build this? Estimate effort, timeline, any blockers.
```

---

## PART 13: RESEARCH SUMMARY & FINAL NOTES

### Data Security Research
✅ **PBKDF2 vs Bcrypt vs Argon2:** PBKDF2 chosen for broad compatibility + speed on low-end devices  
✅ **AES-256 vs ChaCha20:** AES chosen (hardware acceleration on ARM)  
✅ **SQLCipher Security:** Battle-tested, 256-bit encryption, used by many gov't apps  

### TTS/STT Research
✅ **Sarvam AI:** Best for Hindi + 10 regional languages, low latency  
✅ **Web Speech API:** Free fallback, offline capable  
✅ **Google Cloud Speech:** More accurate but requires internet  

### Sharing Mechanism Research
✅ **Telegram:** Instant, end-to-end encrypted, most accessible  
✅ **Email:** Formal, court-acceptable, requires SMTP server  
✅ **WhatsApp:** Ubiquitous in India, end-to-end encrypted by default  
✅ **Google Drive:** Shareable, accessible via web + mobile  
✅ **Dropbox:** Same as Drive, alternative backup  

### User Research (Sunita Persona)
✅ **Pain Points:** No typing, low tech literacy, no English, fear of data theft, poor internet  
✅ **Needs:** Voice-only, offline, encrypted, one-tap sharing, confirmation dialogs  
✅ **Wants:** See progress, hear everything, control over what's sent, privacy  

---

## CONCLUSION

**This is a complete, production-ready specification for a Claude Sonnet implementation.**

Sonnet can build this in **3-4 days** with:
- Day 1: UI foundation + TTS
- Day 2: Encryption + sharing
- Day 3: Additional features + testing
- Day 4: Documentation + deployment

**Total scope: ~2500 lines of frontend code + ~1500 lines of backend code + documentation**

All files should be generated as one comprehensive implementation. Sonnet should create a workflow that:
1. Sets up all files
2. Integrates with existing Gemma + Sarvam pipelines
3. Handles encryption automatically
4. Manages offline sync
5. Provides multi-channel sharing
6. Tracks case history
7. Offers 30 features

**Ready for implementation. This prompt is complete and actionable.**
