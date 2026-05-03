PROJECT: FirstReport
USER PERSONA: Sunita Devi, 38, domestic worker, Ghaziabad UP, Samsung Galaxy A03, Jio 4G intermittent, Hindi spoken only, low literacy
CORE CONSTRAINT: The app must work fully offline. No English typing ever. Voice is the only input.
BNSS NOTE: All legal citations use Bharatiya Nagarik Suraksha Sanhita 2023 (BNSS), NOT CrPC. The BNSS replaced CrPC in July 2024.
GEMMA: Use Gemma 4 via Kaggle Models Hub (kaggle-models/google/gemma/transformers/gemma-4-instruct-4b)
STT: Sarvam AI API — endpoint https://api.sarvam.ai/speech-to-text — language code hi-IN — API key in env var SARVAM_API_KEY
TTS: Sarvam AI API — endpoint https://api.sarvam.ai/text-to-speech — auto-play on every screen load — TTS is the primary interface
DELIVERY: Telegram Bot — endpoint https://api.telegram.org/bot{TOKEN}/sendDocument — TOKEN in env var TELEGRAM_BOT_TOKEN
LEGAL DB: Static SQLite — no live government API — hardcoded BNSS Schedule 1 + 5-state authority contacts
UI: Gradio on Kaggle — single public link — mobile browser ready
SCHEMA CONTRACT: ARCHITECT writes schemas.py first. No other agent writes to core/ until schemas.py is committed.
VISION: Gemma 4 vision reads police station notice board photos to extract officer name, batch number, posting — pre-fills accountability doc.
DEMO: Hidden button on welcome screen (env var SHOW_DEMO_BUTTON=true) — pre-fills Sunita scenario + auto-plays mock audio.
SAFETY: NALSA helpline 15100 tap-to-call on every classification screen. Hindi disclaimer on every document.
