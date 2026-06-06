# FirstReport

<p align="center">
  <strong>AI-powered legal assistance for citizen stories, evidence, timelines, and court-ready documentation.</strong>
</p>

<p align="center">
  <a href="https://nextjs.org/">
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App%20Router-black?style=for-the-badge&logo=nextdotjs" />
  </a>
  <a href="https://react.dev/">
    <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  </a>
  <a href="https://supabase.com/">
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  </a>
  <img alt="Offline first" src="https://img.shields.io/badge/Offline--First-Architecture-7C3AED?style=for-the-badge" />
  <img alt="Hackathon" src="https://img.shields.io/badge/Google%20%2F%20Gemma-Hackathon-4285F4?style=for-the-badge&logo=google&logoColor=white" />
</p>

---

## Overview

FirstReport is an AI-powered legal assistance platform built for the Google/Gemma Hackathon. It helps ordinary citizens convert a single spoken or written account into structured legal facts, evidence trails, timelines, contradiction checks, readiness signals, and court-ready outputs.

The platform is designed for situations where people lose legal protection not because their case lacks merit, but because they lack legal knowledge, documentation discipline, procedural awareness, or evidence organization.

> A citizen tells their story once. FirstReport turns that story into a structured legal pathway.

---

## Problem Statement

Legal systems are difficult to navigate for citizens without access to trained counsel. Many people face avoidable legal setbacks because they:

- Do not know which facts matter legally
- Miss important dates, names, locations, or procedural steps
- Submit incomplete or poorly organized evidence
- Fail to identify contradictions before an opponent does
- Cannot convert their story into formal legal documents
- Lose continuity when switching devices, networks, or support channels

FirstReport addresses this gap by making legal preparation structured, explainable, evidence-aware, and resilient.

---

## Solution

FirstReport acts as an AI legal preparation layer between a citizen's raw story and formal legal action.

The system:

- Extracts relevant facts from the citizen's narrative
- Detects contradictions and missing details
- Builds a chronological legal timeline
- Tracks documents, identity proofs, and evidence items
- Creates a persistent case memory
- Produces a TruthTrail for traceable reasoning
- Generates legal documents and PDF outputs
- Assesses case readiness before escalation
- Supports offline-first storage and recovery workflows

---

## Core Workflow

```text
Citizen Story
  -> AI Analysis
  -> Fact Extraction
  -> Contradiction Detection
  -> Timeline Generation
  -> Evidence Tracking
  -> TruthTrail
  -> Legal Document Generation
```

---

## Key Features

### 1. AI Legal Assistant

Guides citizens through the process of describing incidents, clarifying missing facts, and preparing structured legal outputs.

### 2. OCR Document Processing

Uses OCR to process uploaded documents and extract readable text for downstream case analysis.

### 3. Aadhaar and PAN Detection

Detects identity-document patterns to support verification workflows and document-readiness checks.

### 4. Fact Extraction

Extracts legally relevant entities such as people, dates, places, actions, documents, claims, and supporting evidence.

### 5. Contradiction Detection Engine

Compares statements, document contents, timelines, and prior case memory to identify inconsistencies before submission.

### 6. TruthTrail System

Creates a traceable chain from source story to facts, timeline events, evidence items, and generated legal outputs.

### 7. Legal Timeline Builder

Transforms unstructured stories into chronological timelines that can be reviewed, corrected, and used for formal documents.

### 8. Case Memory Engine

Maintains persistent case context so a user's story, documents, evidence, and generated outputs remain connected.

### 9. Offline-First Storage

Uses local-first persistence patterns so citizens can continue work despite unstable connectivity.

### 10. PDF Legal Document Generation

Generates structured PDF outputs suitable for review, printing, sharing, and legal escalation.

### 11. Cross-Device Recovery Architecture

Supports recovery-oriented workflows so citizens are not locked to one device or one session.

### 12. Evidence Management

Tracks evidence items, document quality, identity documents, extracted text, and readiness status.

---

## Architecture

```text
┌─────────────────────┐
│   Citizen Story     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     AI Analysis     │
│ Gemini / Gemma      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Fact Extraction    │
│ entities + claims   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Contradiction Check │
│ story + docs + mem  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Timeline Generation │
│ legal chronology    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Evidence Tracking   │
│ files + OCR + IDs   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     TruthTrail      │
│ source to output    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Legal Document PDFs │
│ court-ready output  │
└─────────────────────┘
```

### Application Layers

```text
Frontend
  Next.js App Router, React, TypeScript

AI and Intelligence
  Gemini / Gemma models, fact extraction, contradiction checks, timeline logic

OCR and Document Processing
  Tesseract.js, document parsing, identity pattern detection

Storage
  Supabase, Prisma, Dexie, offline queue, case memory

Document Generation
  Puppeteer PDF generation and structured legal templates
```

---

## Technology Stack

| Area | Technologies |
| --- | --- |
| Framework | Next.js App Router |
| UI | React, TypeScript |
| Styling | Tailwind CSS |
| Database and Auth | Supabase |
| ORM | Prisma |
| Offline Storage | Dexie, IndexedDB |
| OCR | Tesseract.js |
| AI Models | Gemini / Gemma |
| PDF Generation | Puppeteer |
| Testing | Playwright |
| Architecture | Offline-first, recovery-oriented, case-memory-driven |

---

## Folder Structure

```text
firstReport/
├── public/
│   ├── icons/                 # PWA and app icons
│   ├── screenshots/           # README and product screenshots
│   └── sw.js                  # Service worker
│
├── prisma/
│   └── schema.prisma          # Database schema
│
├── src/
│   ├── app/                   # Next.js App Router pages and API routes
│   │   ├── (app)/             # Authenticated app routes
│   │   ├── (auth)/            # Authentication routes
│   │   ├── api/               # Server-side API endpoints
│   │   ├── case/              # Case-specific user flows
│   │   ├── dashboard/         # Case dashboard views
│   │   └── offline/           # Offline-first user flows
│   │
│   ├── components/            # Reusable UI and feature components
│   │   ├── chat/              # AI assistant interface
│   │   ├── documents/         # Document generation and review
│   │   ├── intelligence/      # Analysis and insight components
│   │   ├── landing/           # Public landing page
│   │   ├── ocr/               # OCR upload and extraction UI
│   │   ├── readiness/         # Case readiness views
│   │   ├── timeline/          # Legal timeline UI
│   │   ├── truthtrail/        # TruthTrail visualization
│   │   └── verification/      # Identity and document verification
│   │
│   ├── core/                  # Core case intelligence logic
│   ├── db/                    # Database helpers
│   ├── hooks/                 # React hooks
│   ├── lib/                   # Shared libraries and integrations
│   ├── services/              # AI, OCR, sync, speech, and storage services
│   ├── types/                 # TypeScript domain types
│   └── utils/                 # Utility functions
│
├── tests/
│   └── e2e/                   # End-to-end tests
│
├── documents/                 # Project documents
├── migrations/                # Database migration helpers
├── offline/                   # Offline sync utilities
└── reports/                   # Report templates and supporting files
```

---

## Local Setup

### Prerequisites

- Node.js 18 or newer
- npm
- Supabase project
- Database connection string
- Gemini or Google AI API key

### Installation

```bash
git clone https://github.com/your-username/firstreport.git
cd firstreport
npm install
```

### Configure Environment

Create a local environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your own local or hosted service credentials. Do not commit real secrets.

### Database Setup

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Build for Production

```bash
npm run build
npm run start
```

---

## Environment Variables

Use placeholders only. Never commit real API keys, tokens, passwords, private database URLs, service-role keys, or OAuth secrets.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

DATABASE_URL=postgresql://user:password@host:6543/database
DIRECT_URL=postgresql://user:password@host:5432/database

GEMINI_API_KEY=your_gemini_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

NEXT_PUBLIC_SHOW_DEMO_BUTTON=false
```

Optional integrations may require additional provider-specific keys depending on deployment needs.

---

## Screenshots

> Replace the placeholders below with current product screenshots.

### Landing Page

![FirstReport landing page](public/screenshots/landing-placeholder.png)

### AI Legal Assistant

![FirstReport AI legal assistant](public/screenshots/assistant-placeholder.png)

### Legal Timeline

![FirstReport legal timeline](public/screenshots/timeline-placeholder.png)

### TruthTrail

![FirstReport TruthTrail](public/screenshots/truthtrail-placeholder.png)

### Evidence Management

![FirstReport evidence management](public/screenshots/evidence-placeholder.png)

---

## Roadmap

- [ ] Expand legal document templates across more case categories
- [ ] Improve multilingual legal reasoning and explanation flows
- [ ] Add richer contradiction severity scoring
- [ ] Strengthen cross-device case recovery
- [ ] Add collaborative review for legal aid workers
- [ ] Introduce structured attorney handoff packets
- [ ] Improve offline sync conflict resolution
- [ ] Add review-ready export bundles for case handoff
- [ ] Build stronger evidence-chain visualization
- [ ] Support more regional legal workflows and language packs

---

## Future Vision

FirstReport aims to become a citizen-first legal preparation platform that helps people preserve truth before it is distorted by time, fear, confusion, or procedural complexity.

The long-term vision includes:

- Guided legal intake for underserved citizens
- AI-assisted evidence organization
- Court-ready document preparation
- Legal-aid worker dashboards
- Multilingual case preparation
- Strong privacy and offline resilience
- Structured handoff to lawyers, NGOs, and public legal services

FirstReport is not a replacement for legal counsel. It is a preparation layer that helps citizens arrive with clearer facts, stronger documents, better evidence, and a more reliable timeline.

---

## Google / Gemma Hackathon

FirstReport was built for the Google/Gemma Hackathon to demonstrate how modern AI models can support high-impact legal access workflows.

The project showcases:

- AI-guided legal intake
- Structured fact extraction
- Contradiction detection
- Timeline generation
- OCR-enhanced evidence processing
- Case memory and recovery architecture
- PDF generation for legal outputs
- Offline-first design for real-world deployment constraints

---

## Contributing

Contributions are welcome from engineers, designers, legal technologists, researchers, and open-source contributors.

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make a focused change
4. Add or update tests where appropriate
5. Open a pull request with a clear explanation

### Contribution Areas

- Legal workflow design
- Accessibility and multilingual UX
- OCR accuracy improvements
- Offline-first architecture
- Evidence management
- AI safety and evaluation
- Document generation
- UI design and frontend performance

---

## Security and Privacy

FirstReport handles sensitive legal and identity-related information. Contributors and deployers should follow strict security practices:

- Never commit real secrets
- Use environment variables for credentials
- Keep service-role keys server-side only
- Protect generated legal documents
- Minimize unnecessary data retention
- Review integrations before production deployment
- Use secure storage, transport, and access controls

---

## License

This project is currently provided for hackathon, research, and portfolio review purposes.

If you plan to reuse, deploy, or distribute FirstReport, add an explicit license file and confirm legal, privacy, and jurisdiction-specific compliance requirements before production use.

---

## Disclaimer

FirstReport is a legal technology project and does not replace a licensed lawyer, legal aid authority, court, or government process. Outputs should be reviewed by qualified professionals before filing or relying on them in legal proceedings.
