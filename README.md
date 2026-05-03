# FirstReport: AI-Powered Legal Assistant & Escalation Platform

FirstReport is an advanced, highly-accessible, AI-powered legal assistant designed specifically to tackle the massive issue of unregistered cognizable offenses in India. When police refuse to file an FIR (First Information Report), FirstReport empowers victims—especially marginalized and illiterate individuals—to exercise their rights under the newly enacted **Bharatiya Nagarik Suraksha Sanhita (BNSS)**.

## Why FirstReport?

Every year, an estimated 30–40 million cognizable offenses go unregistered in India, primarily due to police refusal to file FIRs. While the new BNSS (which replaced the CrPC on July 1, 2024) strengthened victim escalation rights, there has been no offline-capable, accessible tool to guide victims through this complex legal chain. 

FirstReport bridges this gap by acting as an **expert criminal lawyer in your pocket**. 

### Target Audience
Designed for users with low literacy, limited tech-savvy, and intermittent internet access (e.g., domestic workers, daily wage laborers) using budget smartphones.

---

## What It Does (Key Features)

### 1. Organic, Highly Accessible UI (Wabi-Sabi Theme)
The frontend is built with a premium, tactile "Organic/Natural" design system. 
- **No Typing Required:** Users can interact entirely through voice.
- **Auto-Dictation (Text-To-Speech):** To support illiterate users, a pulsing, organic floating button uses the native Web Speech API to read aloud all the information on the screen in the user's native language. 
- **Micro-Animations:** Fluid, 3D-like background CSS blobs and tactile card "lifting" effects provide a calming, premium user experience.

### 2. Interactive AI Clarification Loop
Instead of relying on a single, potentially vague voice recording, FirstReport acts like a real lawyer:
- It transcribes the audio using **Sarvam STT**.
- It analyzes the transcript. If vital legal details (like the time of the event, location, or sequence of actions) are missing, the AI generates a **single, empathetic follow-up question**.
- The app automatically dictates this question to the user.
- The user responds via microphone, and the AI merges both statements into a highly detailed narrative.

### 3. BNSS Offense Classification (Gemma 4 Pipeline)
The app uses Google's Gemma 4 (4B-Instruct) model to cross-reference the user's narrative against the **BNSS Schedule 1 Database**.
- It identifies the specific BNSS Section violated.
- It determines if the offense is **Cognizable** (mandatory FIR) or **Non-Cognizable**.
- It extracts entities (Victim Name, Police Station, Date).
- *Vision Capability:* Users can upload a photo of a Police Station Notice Board, and the AI will extract the duty officer's name and batch number.

### 4. Multi-Language PDF Document Generation
FirstReport automatically drafts **4 formal legal documents** acting as an escalation chain:
1. **SP Complaint:** Addressed to the Superintendent of Police under Section 166 BNSS.
2. **DM Petition:** Addressed to the District Magistrate under Section 175(3) BNSS.
3. **HC Writ:** A draft writ petition for the High Court under Article 226 of the Constitution.
4. **Officer Accountability Complaint:** A specific complaint targeting the police officer who refused the FIR, citing dereliction of duty.

**No More Square Blocks:** The app dynamically downloads and utilizes Google Noto Sans fonts for Bengali, Tamil, Telugu, Hindi, and English. The AI drafts the legal narrative comprehensively in the exact language chosen by the user, and the PDF renders flawlessly.

### 5. Offline-First Telegram Sync
If the user is in an area with poor connectivity, generated documents are securely cached locally via SQLite. Once the network is restored, a background queue automatically delivers the PDFs to a predefined Telegram bot.

---

## How It Works (Architecture & Tech Stack)

The architecture is explicitly designed to be **lightweight, fast, and dependency-free on the frontend**.

### Backend (Python / FastAPI)
- **FastAPI:** Handles all API requests asynchronously.
- **Transformers (Hugging Face) / Google Generative AI:** Powers the Gemma 4 pipeline for classification, extraction, and narrative drafting. (Can run entirely locally or fallback to Gemini API).
- **ReportLab:** Dynamically generates the legal PDFs, mapping specific language codes to `.ttf` font files.
- **SQLite:** Acts as a local cache for offline capabilities and BNSS Schedule 1 data.

### Frontend (Vanilla HTML / CSS / JS)
- **Zero Build Step:** No React, no Vite, no Node.js required to run the frontend. It is 100% vanilla web technology.
- **CSS:** Broken down into `design-tokens.css` (variables, typography), `components.css` (buttons, cards), and `utilities.css` (layout, background blob animations).
- **JS:** `app.js` handles state management, Web Speech API dictation, MediaRecorder audio capture, and API orchestration.

---

## How to Build & Run It Yourself

Even if you know nothing about this stack, follow these steps to get FirstReport running on your local machine.

### Prerequisites
1. **Python 3.10+** installed on your system.
2. **Git** (optional, but helpful).
3. A Hugging Face account (if running Gemma 4 locally) OR a Google Gemini API Key (recommended for fast testing).

### Step 1: Clone or Download the Project
Ensure you are in the root directory of `firstReport` (where this README is located).

### Step 2: Set Up a Python Virtual Environment
It is best practice to install Python dependencies in an isolated environment.
```bash
# Create the environment
python3 -m venv venv

# Activate it (Mac/Linux)
source venv/bin/activate

# Activate it (Windows)
venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```
*(If `requirements.txt` is missing, you will need: `fastapi`, `uvicorn`, `python-multipart`, `reportlab`, `pillow`, `transformers`, `torch`, `google-generativeai`, `python-dotenv`, `requests`)*

### Step 4: Configure Environment Variables
Create a file named `.env` in the root directory. Add the following:
```ini
# Recommended: Use Gemini API for fast, cloud-based inference
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Sarvam API for specialized Hindi STT (will fallback to browser if not set)
SARVAM_API_KEY=your_sarvam_key_here

# Optional: Telegram bot integration for offline queue sending
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Step 5: Start the Backend Server
Run the FastAPI application using Uvicorn.
```bash
uvicorn backend.main:app --reload --port 8000
```
*Note: If port 8000 is in use, you can change it to `--port 8001` or any other available port.*

### Step 6: Access the Application
Open your web browser (Chrome or Safari recommended for microphone access) and navigate to:
```
http://127.0.0.1:8000
```
*(Or whichever port you specified).*

---

## Project Structure Overview

```text
firstReport/
├── backend/
│   └── main.py              # FastAPI server, endpoints (/api/clarify, /api/classify)
├── core/
│   ├── gemma_pipeline.py    # AI prompts for Clarification, Classification, and Narratives
│   ├── schemas.py           # Pydantic data models
│   ├── sarvam_stt.py        # Speech-to-text integration
│   └── entity_extractor.py  # Utility for parsing AI JSON outputs
├── frontend/
│   ├── index.html           # Main UI shell (Language, Clarification, Classification screens)
│   ├── css/                 # Vanilla CSS architecture (tokens, components, utilities)
│   └── js/                  # app.js (state management, Web Speech API, recording logic)
├── legal/
│   ├── doc_generator.py           # ReportLab PDF generator (multi-language font logic)
│   ├── officer_accountability.py  # S.166 BNSS specific PDF generator
│   └── bnss_classifier.py         # SQLite BNSS database integration
├── offline/                 # Sync queue and Telegram sender logic
└── data/                    # Downloaded .ttf fonts for PDF generation
```

## Disclaimer
FirstReport is a technical demonstration and prototype. The documents generated by the AI are drafts and do not constitute formal legal advice. Users are always prompted within the application to contact the National Legal Services Authority (NALSA) helpline at 15100 before submitting any legal documents.
