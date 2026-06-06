'use client';

import { useState, useRef, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useNavigationWithQuery } from '@/lib/useNavigationWithQuery';
import ChatBubble from '@/components/chat/ChatBubble';
import MicButton from '@/components/chat/MicButton';
import SpeakerButton from '@/components/chat/SpeakerButton';
import AgentAvatar from '@/components/chat/AgentAvatar';
import FirstReportLogo from '@/components/FirstReportLogo';
import SeverityBadge from '@/components/SeverityBadge';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  type LangCode,
  type PersonaId,
  t,
  LANG_BY_CODE,
  openingFor,
} from '@/lib/i18n';
import {
  PERSONA_BY_ID,
  classifySeverity,
  type SeverityVerdict,
} from '@/lib/personas';
import {
  getLegalCase,
  updateCase,
  addConversationToCase,
  type LegalCase,
  type ChatTurn,
  type EvidenceType,
} from '@/lib/legalJourney';
import { intelligenceEngine } from '@/core/intelligence-engine';
import { memoryEngine } from '@/core/case-memory-engine';
import type { IntelligenceOutput } from '@/types';
import { TrustScore } from '@/components/truthtrail/TrustScore';
import { TimelineStep } from '@/components/truthtrail/TimelineStep';
import { TrailNarrative } from '@/components/truthtrail/TrailNarrative';

/* ── i18n ────────────────────────────────────────────────────────── */
const RESUME_MSG: Record<string, string> = {
  'hi-IN': 'आपका केस फिर से खुला है। पिछली बातचीत ऊपर दिखाई दे रही है। बताइए, आगे क्या करना है?',
  'en-IN': 'Your case has been reopened. Previous conversation is shown above. How would you like to proceed?',
  'bn-IN': 'আপনার কেস আবার খোলা হয়েছে। আগের কথোপকথন উপরে দেখানো হয়েছে। কীভাবে এগিয়ে যেতে চান?',
  'ta-IN': 'உங்கள் வழக்கு மீண்டும் திறக்கப்பட்டது. முந்தைய உரையாடல் மேலே காட்டப்பட்டுள்ளது.',
  'te-IN': 'మీ కేసు మళ్ళీ తెరవబడింది. మునుపటి సంభాషణ పైన చూపబడింది.',
  'mr-IN': 'तुमचे प्रकरण पुन्हा उघडले आहे. मागील संभाषण वर दिसत आहे.',
  'gu-IN': 'તમારો કેસ ફરી ખોલવામાં આવ્યો છે. અગાઉની વાતચીત ઉપર બતાવવામાં આવી છે.',
  'kn-IN': 'ನಿಮ್ಮ ಕೇಸ್ ಮತ್ತೆ ತೆರೆಯಲಾಗಿದೆ. ಹಿಂದಿನ ಸಂಭಾಷಣೆ ಮೇಲೆ ತೋರಿಸಲಾಗಿದೆ.',
  'ml-IN': 'നിങ്ങളുടെ കേസ് വീണ്ടും തുറന്നിട്ടുണ്ട്. മുമ്പത്തെ സംഭാഷണം മുകളിൽ കാണിച്ചിട്ടുണ്ട്.',
  'pa-IN': 'ਤੁਹਾਡਾ ਕੇਸ ਦੁਬਾਰਾ ਖੋਲ੍ਹਿਆ ਗਿਆ ਹੈ। ਪਿਛਲੀ ਗੱਲਬਾਤ ਉੱਪਰ ਦਿਖਾਈ ਗਈ ਹੈ।',
  'od-IN': 'ଆପଣଙ୍କ ମାମଲା ପୁନଃ ଖୋଲାଯାଇଛି। ପୂର୍ବ ଆଲୋଚନା ଉପରେ ଦେଖାଯାଇଛି।',
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  active:    { 'hi-IN': 'सक्रिय',   'en-IN': 'Active' },
  pending:   { 'hi-IN': 'लंबित',    'en-IN': 'Pending' },
  escalated: { 'hi-IN': 'बढ़ाया गया', 'en-IN': 'Escalated' },
  resolved:  { 'hi-IN': 'हल किया',   'en-IN': 'Resolved' },
  archived:  { 'hi-IN': 'संग्रहीत',  'en-IN': 'Archived' },
};

const STATUS_CLS: Record<string, string> = {
  active: 'badge-teal', pending: 'badge-warning', escalated: 'badge-error',
  resolved: 'badge-success', archived: 'badge-navy',
};

import VerificationPanel from '@/components/VerificationPanel';
import ReadinessStatus from '@/components/ReadinessStatus';
import OCRPanel from '@/components/ocr/OCRPanel';
import OfflineIndicator from '@/components/OfflineIndicator';
import { startAutoSync } from '@/lib/sync/syncEngine';

function networkErrorFor(lang: LangCode): string {
  return lang === 'hi-IN' ? 'नेटवर्क में समस्या है। दोबारा कोशिश करें।' : 'Network issue. Please try again.';
}

/* ── Case Workspace ──────────────────────────────────────────────── */
function CaseWorkspace() {
  const router = useNavigationWithQuery();
  const params = useParams();
  const caseId = params.id as string;

  const [legalCase, setLegalCase] = useState<LegalCase | null>(null);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [verdict, setVerdict] = useState<SeverityVerdict | null>(null);
  const [lastAiText, setLastAiText] = useState('');
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'none' | 'docs' | 'verification' | 'readiness' | 'scan' | 'ai' | 'truthtrail'>('none');
  const [intelligence, setIntelligence] = useState<IntelligenceOutput | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshState = useCallback(async () => {
    const out = await intelligenceEngine.generateAssessment(caseId);
    setIntelligence(out);
  }, [caseId]);

  useEffect(() => {
    if (caseId) refreshState();
  }, [caseId, refreshState]);

  // ── Load case + hydrate conversation ──────────────────────────
  useEffect(() => {
    const initCase = async () => {
      let loaded = getLegalCase(caseId);
      
      // HYDRATION: If not in localStorage, fetch from Supabase
      if (!loaded) {
        try {
          const res = await fetch(`/api/legal-journey/${caseId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.case) {
              const remoteCase = data.case;
              loaded = {
                id: remoteCase.id || caseId,
                createdAt: remoteCase.createdAt || Date.now(),
                updatedAt: remoteCase.updatedAt || Date.now(),
                title: remoteCase.title || 'Recovered Case',
                status: remoteCase.status || 'active',
                personaId: remoteCase.personaId || 'standard',
                language: remoteCase.language || 'hi-IN',
                severity: remoteCase.severity || 'normal',
                incidentSummary: remoteCase.incidentSummary || '',
                victimName: remoteCase.victimName,
                policeStation: remoteCase.policeStation,
                bnssSection: remoteCase.bnssSection,
                statutesCited: remoteCase.statutesCited || [],
                documentsGenerated: data.documents || [],
                evidence: [],
                timeline: data.timeline || [],
                aiRecommendations: [],
                reminders: [],
                pendingSteps: [],
                sessionIds: [],
                conversations: data.messages && data.messages.length > 0 ? [{
                  id: 'recovered-conv',
                  ts: Date.now(),
                  personaId: remoteCase.personaId || 'standard',
                  language: remoteCase.language || 'hi-IN',
                  summary: remoteCase.incidentSummary || 'Recovered conversation',
                  turns: data.messages.map((m: any) => ({
                    role: m.role || 'user',
                    text: m.content || m.text || '',
                    ts: m.createdAt || m.ts,
                  })),
                }] : []
              };
              
              const raw = localStorage.getItem('fr_legal_journey');
              const cases = raw ? JSON.parse(raw) : [];
              localStorage.setItem('fr_legal_journey', JSON.stringify([loaded, ...cases]));
            }
          }
        } catch (e) {
          console.error("Hydration failed", e);
        }
      }

      if (!loaded) { router.replace('/history'); return; }
      setLegalCase(loaded);

      // Flatten all turns from all conversations, chronologically sorted.
      // Each conversation is a session (one page load). We merge them for continuity.
      const allTurns: ChatTurn[] = [];
      const sortedConvs = [...(loaded.conversations ?? [])].sort((a, b) => a.ts - b.ts);
      for (const conv of sortedConvs) {
        allTurns.push(...(conv.turns ?? []));
      }

      // Count user turns across all history to distinguish new vs returning case
      const userTurnCount = allTurns.filter((t) => t.role === 'user').length;

      if (userTurnCount > 0) {
        // RETURNING CASE: add a contextual resume message so Sunita knows her case is remembered
        const resumeText = RESUME_MSG[loaded.language] ?? RESUME_MSG['en-IN'];
        allTurns.push({ role: 'ai', text: resumeText, ts: Date.now() });
        setLastAiText(resumeText);
      } else {
        // BRAND NEW CASE: show the persona's opening greeting (never show "resume" for empty cases)
        const initialText = openingFor(loaded.personaId, loaded.language);
        allTurns.push({ role: 'ai', text: initialText, ts: Date.now() });
        setLastAiText(initialText);
      }

      setMessages(allTurns);
    };

    initCase();
  }, [caseId, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAITyping]);

  // ── Start background sync ──────────────────────────────────────
  useEffect(() => {
    const stopSync = startAutoSync(30_000);
    return stopSync;
  }, []);

  // ── Derived case intelligence (safe with null legalCase) ──────────
  const readinessScore = useMemo(() => {
    if (!legalCase) return 0;
    let score = 0;
    if ((legalCase.incidentSummary?.length ?? 0) > 10) score += 25;
    if ((legalCase.evidence?.length ?? 0) > 0) score += 25;
    if ((legalCase.documentsGenerated?.length ?? 0) > 0) score += 25;
    if ((legalCase.conversations?.length ?? 0) > 0) score += 25;
    return score;
  }, [legalCase]);

  const verifiedDocTypes = useMemo(() =>
    (legalCase?.evidence ?? []).filter(e => e.verifiedByAI).map(e => e.type as string),
  [legalCase]);

  if (!legalCase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <FirstReportLogo size={64} variant="icon" theme="light" />
      </div>
    );
  }

  const language = legalCase.language;
  const personaId = legalCase.personaId;
  const persona = PERSONA_BY_ID[personaId] ?? PERSONA_BY_ID.standard;
  const langCfg = LANG_BY_CODE[language] ?? LANG_BY_CODE['hi-IN'];
  const statusLabel = STATUS_LABELS[legalCase.status]?.[language] ?? STATUS_LABELS[legalCase.status]?.['en-IN'] ?? legalCase.status;
  const statusCls = STATUS_CLS[legalCase.status] ?? 'badge-teal';
  const docs = legalCase.documentsGenerated ?? [];
  const timeline = legalCase.timeline ?? [];

  const handleLanguageChange = (next: LangCode) => {
    updateCase(caseId, { language: next });
    setLegalCase((prev) => prev ? { ...prev, language: next } : prev);
  };

  const handleGenerateDocs = async () => {
    if (!legalCase) return;
    setIsAITyping(true);
    
    // Attempt to extract name/station from history or use defaults
    const victimName = messages.find(m => m.role === 'user' && m.text.length < 40)?.text || "Citizen";
    
    const payload = {
      transcript: legalCase.incidentSummary,
      lang_code: language,
      classification: {
        bnss_section: legalCase.bnssSection || "173",
        severity: legalCase.severity || "normal",
        offense_name_hindi: "शिकायत"
      },
      crime_input: {
        victim_name: victimName,
        incident_description: legalCase.incidentSummary,
        station_name: legalCase.policeStation || "Local Police Station",
        date: new Date(legalCase.createdAt).toLocaleDateString()
      }
    };

    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        // Create document entries for the sidebar
        const newDocs = Object.keys(data.paths || {}).map(type => ({
          id: crypto.randomUUID(),
          type: type as any,
          title: type.toUpperCase().replace('_', ' '),
          generatedAt: Date.now(),
          language: language,
          sessionId: data.session_id
        }));

        // Update the case in storage
        const updatedCase = {
          ...legalCase,
          sessionIds: [...(legalCase.sessionIds || []), data.session_id],
          documentsGenerated: [...(legalCase.documentsGenerated || []), ...newDocs]
        };
        
        updateCase(caseId, updatedCase);
        setLegalCase(updatedCase);
        setActivePanel('docs');

        // Add a success message to the chat
        const successMsg: ChatTurn = {
          role: 'ai',
          text: language === 'hi-IN' 
            ? 'मैंने आपके दस्तावेज़ तैयार कर लिए हैं। आप उन्हें दाईं ओर "दस्तावेज़" सेक्शन में देख सकते हैं।' 
            : 'I have generated your documents. You can find them in the "Documents" section on the right.',
          ts: Date.now(),
          model: 'gemma'
        };
        setMessages(prev => [...prev, successMsg]);
      } else {
        throw new Error('Generation failed');
      }
    } catch (err) {
      console.error('Doc generation error:', err);
      setNetworkError(language === 'hi-IN' ? 'दस्तावेज़ बनाने में विफल।' : 'Failed to generate documents.');
    } finally {
      setIsAITyping(false);
    }
  };

  // ── Send message ──────────────────────────────────────────────
  const handleUserInput = async (text: string) => {
    if (!text.trim()) return;
    const userTurn: ChatTurn = { role: 'user', text: text.trim() };
    const newMessages = [...messages, userTurn];
    setMessages(newMessages);
    setTextInput('');
    setIsAITyping(true);
    setNetworkError(null);

    const localVerdict = classifySeverity(personaId, text);
    setVerdict(localVerdict);

    try {
      // Filter out any garbage history entries (URLs, empty, etc.)
      const cleanHistory = newMessages
        .filter((m) => m.text && !m.text.startsWith('http'))
        .map((m) => ({ role: m.role, content: m.text }));

      const res = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text.trim(),
          history: cleanHistory,
          language,
          persona: personaId,
          case_summary: legalCase.incidentSummary,
          // Case memory fields — consumed by buildCaseMemory() in clarify/route.ts
          victim_name:    legalCase.victimName    ?? '',
          police_station: legalCase.policeStation ?? '',
          bnss_section:   legalCase.bnssSection   ?? '',
          verified_docs:  verifiedDocTypes,
        }),
      });

      const data = await res.json();

      // The backend always returns a 'question' field (AI answer, fallback, or error msg)
      let aiText: string = data.question || '';
      // Normalise model label — API may return 'gemini-flash', 'gemma-2-9b', etc.
      // Map to the ChatTurn union: 'gemma' | 'gemini' | 'mock' | 'none'
      const rawModel = (data.model ?? '') as string;
      const aiModel: ChatTurn['model'] =
        rawModel.startsWith('gemma')  ? 'gemma'  :
        rawModel.startsWith('gemini') ? 'gemini' :
        rawModel === 'mock'           ? 'mock'   : 'none';

      let actionType: ChatTurn['actionType'] = undefined;
      if (aiText.includes('[ACTION:GENERATE_DOCS]')) {
        actionType = 'generate_docs';
        aiText = aiText.replace('[ACTION:GENERATE_DOCS]', '').trim();
      }

      if (aiText) {
        const aiTurn: ChatTurn = { role: 'ai', text: aiText, model: aiModel, actionType, ts: Date.now() };
        setMessages((prev) => [...prev, aiTurn]);
        setLastAiText(aiText);

        // ── Persist to localStorage (primary, offline-first) ──────────────
        addConversationToCase(caseId, {
          ts:        Date.now(),
          personaId,
          language,
          summary:   text.trim().slice(0, 120),
          turns:     [userTurn, aiTurn],
          severity:  localVerdict.level,
        });
        updateCase(caseId, { severity: localVerdict.level });

        // ── Refresh React state ────────────────────────────────────────────
        const refreshed = getLegalCase(caseId);
        if (refreshed) setLegalCase(refreshed);

        // ── Update Memory Engine and refresh TruthTrail ────────────
        await memoryEngine.processTranscript(caseId, [{ role: 'user', text: userTurn.text }]);
        refreshState();

        // ── Queue conversation to Dexie sync engine (async, non-blocking) ──
        // This ensures conversations are queued for cloud sync via the Dexie
        // syncQueue, which the sync engine reads every 30 seconds.
        import('@/lib/sync/syncEngine').then(({ safeAddToSyncQueue }) => {
          safeAddToSyncQueue(
            'UPDATE_CASE',
            caseId,
            'case',
            {
              severity: localVerdict.level,
              updatedAt: Date.now(),
              lastMessage: text.trim().slice(0, 200),
            },
            2,
          );
        }).catch(() => {});
      }
      setIsAITyping(false);
    } catch (err) {
      console.error('[CaseWorkspace] fetch error:', err);
      setNetworkError(networkErrorFor(language));
      setTimeout(() => setNetworkError(null), 8000);
      setIsAITyping(false);
    }
  };


  const fmtDate = (ts: number) => {
    try { return new Date(ts).toLocaleDateString(language, { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return new Date(ts).toLocaleDateString(); }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col">

      {/* ── CASE HEADER ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-cool-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          {/* Top row: case title + status */}
          <div className="flex items-center gap-3 mb-2">
            {/* FIX: back button wrapped in touch-target div so tap area is ≥44×44px */}
            <button
              onClick={() => router.push('/history')}
              className="touch-target -ml-2 text-muted hover:text-navy-deep transition-colors shrink-0"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif font-bold text-navy-deep text-lg sm:text-xl truncate leading-tight">
                {legalCase.title || legalCase.incidentSummary?.slice(0, 60)}
              </h1>
            </div>
            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold ${statusCls}`}>
              {statusLabel}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-[11px] text-muted flex-wrap">
            <AgentAvatar persona={persona} compact speaking={isAITyping} />
            <span className="font-medium text-secondary">{persona.titleEn}</span>
            <span>·</span>
            <span>{langCfg.label}</span>
            {legalCase.bnssSection && (
              <><span>·</span><span className="font-mono text-teal font-semibold">BNSS § {legalCase.bnssSection}</span></>
            )}
            <span>·</span>
            <span>{fmtDate(legalCase.createdAt)}</span>

            <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
              {/* Docs toggle */}
              <button
                onClick={() => setActivePanel(v => v === 'docs' ? 'none' : 'docs')}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm border transition-all ${activePanel === 'docs' ? 'bg-navy-deep text-white border-navy-deep' : 'border-cool-gray text-secondary hover:border-teal'}`}
              >
                {docs.length} {language === 'hi-IN' ? 'दस्तावेज़' : 'Docs'}
              </button>
              {/* Verify Documents — direct button, always visible */}
              <button
                onClick={() => setActivePanel(v => v === 'verification' ? 'none' : 'verification')}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm border transition-all flex items-center gap-1 ${activePanel === 'verification' ? 'bg-gold text-white border-gold' : 'border-cool-gray text-secondary hover:border-gold hover:text-gold'}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {language === 'hi-IN' ? 'दस्तावेज़ जाँचें' : 'Verify Docs'}
              </button>
              <button
                onClick={() => setActivePanel(v => v === 'readiness' ? 'none' : 'readiness')}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm border transition-all ${activePanel === 'readiness' ? 'bg-teal text-white border-teal' : 'border-cool-gray text-secondary hover:border-teal'}`}
              >
                {language === 'hi-IN' ? 'स्थिति' : 'Status'}
              </button>
              <button
                onClick={() => setActivePanel(v => v === 'truthtrail' ? 'none' : 'truthtrail')}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm border transition-all flex items-center gap-1 ${activePanel === 'truthtrail' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-cool-gray text-secondary hover:border-indigo-600 hover:text-indigo-600'}`}
              >
                ⚖️ TruthTrail
              </button>
              {/* OCR Scan button */}
              <button
                onClick={() => setActivePanel(v => v === 'scan' ? 'none' : 'scan')}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm border transition-all flex items-center gap-1 ${activePanel === 'scan' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-cool-gray text-secondary hover:border-emerald-600 hover:text-emerald-600'}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H2a2 2 0 00-2 2v10a2 2 0 002 2h3m15-12h3a2 2 0 012 2v10a2 2 0 01-2 2h-3" />
                </svg>
                {language === 'hi-IN' ? 'स्कैन' : 'Scan'}
              </button>
              {/* Local AI button */}
              <button
                onClick={() => setActivePanel(v => v === 'ai' ? 'none' : 'ai')}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm border transition-all flex items-center gap-1 ${activePanel === 'ai' ? 'bg-purple-600 text-white border-purple-600' : 'border-cool-gray text-secondary hover:border-purple-600 hover:text-purple-600'}`}
              >
                🤖 AI
              </button>
              <LanguageSwitcher current={language} onChange={handleLanguageChange} compact />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Chat area */}
        <main className="flex-1 overflow-y-auto bg-ivory">

          {/* ── STICKY CASE CONTEXT PANEL ─────────────────────────── */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-cool-gray/50 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">

                {/* Complainant name */}
                {legalCase.victimName && (
                  <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                    <svg className="w-3 h-3 text-teal shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-navy-deep truncate max-w-[90px] sm:max-w-[160px]">
                      {legalCase.victimName}
                    </span>
                  </div>
                )}
                {legalCase.victimName && <span className="text-cool-gray/40 shrink-0 text-xs">·</span>}

                {/* Specialist avatar + name */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <AgentAvatar persona={persona} compact speaking={false} />
                  <span className="hidden sm:inline text-[10px] font-medium text-secondary leading-none">
                    {persona.titleEn}
                  </span>
                </div>

                {/* BNSS classification */}
                {legalCase.bnssSection && (
                  <>
                    <span className="text-cool-gray/40 shrink-0 text-xs">·</span>
                    <span className="text-[10px] font-mono font-semibold text-teal shrink-0">
                      BNSS § {legalCase.bnssSection}
                    </span>
                  </>
                )}

                {/* Status badge — hidden on small screens to save space */}
                <span className="text-cool-gray/40 shrink-0 text-xs hidden sm:inline">·</span>
                <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold shrink-0 ${statusCls}`}>
                  {statusLabel}
                </span>

                {/* Police station */}
                {legalCase.policeStation && (
                  <>
                    <span className="text-cool-gray/40 shrink-0 text-xs hidden md:inline">·</span>
                    <span className="hidden md:inline text-[10px] text-muted truncate max-w-[120px]">
                      {legalCase.policeStation}
                    </span>
                  </>
                )}

                <div className="flex-1 min-w-0" />

                {/* Readiness meter */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-12 sm:w-20 h-1 bg-cool-gray/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${readinessScore}%`,
                        background: readinessScore >= 75 ? '#4CAF50' : readinessScore >= 50 ? '#5FA8A0' : '#B8962E',
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ color: readinessScore >= 75 ? '#4CAF50' : readinessScore >= 50 ? '#5FA8A0' : '#B8962E' }}
                  >
                    {readinessScore}%
                  </span>
                  <span className="text-[8px] text-muted uppercase tracking-wider hidden sm:inline">
                    {language === 'hi-IN' ? 'तैयार' : 'Ready'}
                  </span>
                </div>

              </div>
            </div>
          </div>
          {/* ── END STICKY CONTEXT PANEL ──────────────────────────── */}

          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

            {/* Case summary card — only shown when there's actual content */}
            {legalCase.incidentSummary && legalCase.incidentSummary.trim().length > 0 && (
              <div className="fr-card border-l-4 border-l-teal p-4 mb-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal mb-1">
                  {language === 'hi-IN' ? 'केस सारांश' : 'Case Summary'}
                </div>
                <p lang={language} className="text-sm text-secondary leading-snug">
                  &ldquo;{legalCase.incidentSummary}&rdquo;
                </p>
                {legalCase.statutesCited?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {legalCase.statutesCited.map((s) => (
                      <span key={s} className="citation-chip citation-chip-gold text-[8px]">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* New case onboarding prompt — shown only when conversation is fresh */}
            {messages.filter(m => m.role === 'user').length === 0 && (
              <div className="mb-6 p-4 rounded-sm bg-navy-deep/[0.03] border border-teal/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p lang={language} className="text-xs font-semibold text-teal mb-1 uppercase tracking-wider">
                      {language === 'hi-IN' ? 'नया केस शुरू हुआ' : 'New Case Started'}
                    </p>
                    <p lang={language} className="text-sm text-secondary leading-relaxed">
                      {language === 'hi-IN'
                        ? 'माइक बटन दबाकर बोलें, या नीचे टाइप करें। जो हुआ वो अपनी भाषा में बताएं।'
                        : 'Press the mic button to speak, or type below. Describe what happened in your own words.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline events inline */}
            {timeline.length > 0 && (
              <div className="mb-4 pl-3 border-l-2 border-gold/30">
                {timeline.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2 mb-2 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1 shrink-0" />
                    <div>
                      <span className="text-secondary">{ev.description}</span>
                      <span className="text-muted ml-2">{fmtDate(ev.ts)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className="group relative">
                <ChatBubble
                  role={msg.role}
                  text={msg.text}
                  language={language}
                  personaColor={persona.color}
                  persona={personaId}
                />
                {msg.role === 'ai' && (
                  <div className={`absolute top-2 right-2 flex items-center gap-1.5 transition-opacity duration-150 ${i === messages.length - 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {/* Model source badge */}
                    {msg.model && msg.model !== 'none' && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                        msg.model === 'gemini'
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : msg.model === 'gemma'
                          ? 'bg-teal-100 text-teal-700 border border-teal-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{
                          background: msg.model === 'gemini' ? '#6366f1' : msg.model === 'gemma' ? '#0d9488' : '#9ca3af'
                        }} />
                        {msg.model === 'gemini' ? 'Gemini' : msg.model === 'gemma' ? 'Gemma' : 'Mock'}
                      </span>
                    )}
                    <SpeakerButton text={msg.text} language={language} persona={personaId} variant="mini" />
                  </div>
                )}
                {/* Action button for generating docs */}
                {msg.actionType === 'generate_docs' && (
                  <div className="mt-2 ml-[52px]">
                    <button
                      onClick={handleGenerateDocs}
                      className="px-4 py-2 bg-teal text-white rounded-md text-sm font-semibold shadow hover:bg-teal-dark transition-colors duration-300"
                    >
                      {language === 'hi-IN' ? 'दस्तावेज़ बनाएँ' : 'Generate Documents'}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isAITyping && (
              <ChatBubble role="ai" text="" language={language} isTyping personaColor={persona.color} persona={personaId} />
            )}

            {verdict && (
              <div className="my-6">
                <SeverityBadge verdict={verdict} lang={language} />
              </div>
            )}

            {/* Verification CTA — appears after user has started chatting but hasn't verified any docs */}
            {messages.filter(m => m.role === 'user').length >= 2 && docs.length === 0 && (
              <div className="my-4 p-3.5 rounded-sm border border-gold/30 bg-gold/[0.04] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p lang={language} className="text-xs font-semibold text-gold mb-0.5 uppercase tracking-wider">
                    {language === 'hi-IN' ? 'पहचान दस्तावेज़ जोड़ें' : 'Strengthen Your Case'}
                  </p>
                  <p lang={language} className="text-xs text-secondary leading-snug">
                    {language === 'hi-IN'
                      ? 'आधार, पैन, या FIR कॉपी अपलोड करें। AI तुरंत जाँच करेगा।'
                      : 'Upload Aadhaar, PAN, or FIR copy. AI verifies instantly.'}
                  </p>
                </div>
                <button
                  onClick={() => setActivePanel('verification')}
                  className="shrink-0 px-3 py-1.5 bg-gold text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-gold/90 transition-colors"
                >
                  {language === 'hi-IN' ? 'जाँचें' : 'Verify'}
                </button>
              </div>
            )}

            <div ref={chatEndRef} className="h-4" />
          </div>
        </main>

        {/* Mobile backdrop for sidebar */}
        {activePanel !== 'none' && (
          <div
            className="fixed inset-0 z-10 bg-navy-deep/40 sm:hidden"
            onClick={() => setActivePanel('none')}
          />
        )}

        {/* Sidebar panel — slides in from right on mobile with smooth animation */}
        {activePanel !== 'none' && (
          <aside
            className="fixed inset-y-0 right-0 z-20 w-[92vw] sm:relative sm:inset-auto sm:z-auto sm:w-80 lg:w-96
                       border-l border-cool-gray bg-white flex flex-col shrink-0 overflow-y-auto shadow-xl sm:shadow-none
                       animate-slide-in-right sm:animate-none"
            style={{ top: 0 }}
          >
            <div className="p-3 border-b border-cool-gray bg-off-white flex gap-2 items-center sticky top-0 z-10">
              <button onClick={() => setActivePanel('docs')} className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm transition-colors ${activePanel === 'docs' ? 'bg-navy text-white' : 'text-secondary hover:bg-cool-gray'}`}>
                {language === 'hi-IN' ? 'दस्तावेज़' : 'Docs'}
              </button>
              <button onClick={() => setActivePanel('scan')} className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm transition-colors ${activePanel === 'scan' ? 'bg-emerald-600 text-white' : 'text-secondary hover:bg-cool-gray'}`}>
                {language === 'hi-IN' ? '📷 स्कैन' : '📷 Scan'}
              </button>
              <button onClick={() => setActivePanel('verification')} className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1 ${activePanel === 'verification' ? 'bg-gold text-white' : 'text-secondary hover:bg-cool-gray'}`}>
                {language === 'hi-IN' ? 'जाँच' : 'Verify'}
              </button>
              <button onClick={() => setActivePanel('readiness')} className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm transition-colors ${activePanel === 'readiness' ? 'bg-teal text-white' : 'text-secondary hover:bg-cool-gray'}`}>
                {language === 'hi-IN' ? 'तैयारी' : 'Ready'}
              </button>
              <button onClick={() => setActivePanel('truthtrail')} className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1 ${activePanel === 'truthtrail' ? 'bg-indigo-600 text-white' : 'text-secondary hover:bg-cool-gray'}`}>
                ⚖️ TruthTrail
              </button>
              <button onClick={() => setActivePanel('ai')} className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm transition-colors ${activePanel === 'ai' ? 'bg-purple-600 text-white' : 'text-secondary hover:bg-cool-gray'}`}>
                AI
              </button>
              {/* FIX: sidebar close button — touch-target ensures ≥44px tap area */}
              <button
                onClick={() => setActivePanel('none')}
                className="ml-auto touch-target rounded text-muted hover:text-navy hover:bg-cool-gray/60 transition-colors text-lg leading-none"
                aria-label="Close panel"
              >
                &times;
              </button>
            </div>

            <div className="p-4">
              {activePanel === 'docs' && (
                <>
                  <div className="authority-strip mb-3">{language === 'hi-IN' ? 'तैयार दस्तावेज़' : 'Generated Documents'}</div>
                  {docs.length === 0 ? (
                    <p className="text-xs text-muted">No documents yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {docs.map((d) => (
                        <li key={d.id} className="p-2 border border-cool-gray/50 rounded-sm bg-ivory">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-navy truncate">{d.title}</span>
                            <button
                              onClick={() => {
                                const sid = d.sessionId || (legalCase.sessionIds && legalCase.sessionIds[legalCase.sessionIds.length - 1]);
                                if (sid) window.open(`/api/documents/${sid}/${d.type.toLowerCase()}`, '_blank');
                              }}
                              className="px-2 py-0.5 bg-cool-gray text-navy text-[10px] rounded hover:bg-teal hover:text-white transition-colors"
                            >
                              {language === 'hi-IN' ? 'देखें' : 'View PDF'}
                            </button>
                          </div>
                          {d.sentViaTelegram && <span className="inline-block mt-1 text-[9px] badge-success px-1.5 py-0.5">Sent</span>}
                        </li>
                      ))}
                    </ul>
                  )}

                  {timeline.length > 0 && (
                    <>
                      <div className="authority-strip mt-6 mb-3">{language === 'hi-IN' ? 'समयरेखा' : 'Timeline'}</div>
                      <ul className="space-y-2">
                        {timeline.map((ev) => (
                          <li key={ev.id} className="flex items-start gap-2 text-[11px]">
                            <span className="w-1 h-1 rounded-full bg-teal mt-1.5 shrink-0" />
                            <span className="text-secondary">{ev.description}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}

              {activePanel === 'verification' && (
                <VerificationPanel 
                  sessionId={caseId} 
                  language={language} 
                  currentCaseName={legalCase.victimName || "Citizen"} 
                />
              )}

              {activePanel === 'readiness' && (
                <ReadinessStatus
                  userId={legalCase.userId || 'guest'}
                  hasIncidentSummary={(legalCase.incidentSummary?.length ?? 0) > 10}
                  documentsGeneratedCount={docs.length}
                  evidenceUploadedCount={legalCase.evidence?.length ?? 0}
                  language={language}
                />
              )}

              {activePanel === 'truthtrail' && intelligence && (
                <div className="space-y-4">
                  <div className="authority-strip mb-4">TruthTrail Analysis</div>
                  
                  {/* NEXT BEST ACTION BANNER */}
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-md shadow-sm mb-4">
                    <h3 className="text-xs uppercase text-blue-800 font-bold tracking-wider mb-1">Next Best Action</h3>
                    <button className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded shadow-sm hover:bg-blue-700 transition text-sm">
                      {intelligence.nextBestAction.label}
                    </button>
                  </div>

                  <TrustScore 
                    confidence={intelligence.trustScore > 80 ? 'high' : intelligence.trustScore > 50 ? 'medium' : 'low'} 
                    section={legalCase.bnssSection || "303"} 
                  />
                  <TrailNarrative 
                    title="System Assessment" 
                    paragraphs={[
                      `Trust Score is ${intelligence.trustScore}/100.`,
                      `Confidence Score is ${intelligence.confidenceScore}/100.`,
                      intelligence.contradictions.length > 0 
                        ? `Contradictions found: ${intelligence.contradictions.map(c => c.field).join(', ')}.`
                        : 'No contradictions found in the current timeline.'
                    ]} 
                  />
                  
                  {/* MISSING EVIDENCE */}
                  {intelligence.missingEvidence.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-2">Missing Evidence</h3>
                      <ul className="space-y-2">
                        {intelligence.missingEvidence.map((ev, i) => (
                          <li key={i} className="bg-white border border-red-100 p-3 rounded-md shadow-sm">
                            <p className="text-xs font-semibold text-gray-800">{ev.type}</p>
                            <p className="text-[10px] text-red-600 mt-1">{ev.reason}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <h4 className="font-bold text-sm text-gray-800 mt-6 mb-2">Verification Timeline</h4>
                  <div className="pl-4 space-y-4">
                    <TimelineStep 
                      step={{ title: 'Report Started', description: 'Intake initiated.', timestamp: new Date(legalCase.createdAt).toISOString(), status: 'completed', icon: '📝' }} 
                      index={0} 
                      isLast={false} 
                    />
                    <TimelineStep 
                      step={{ 
                        title: intelligence.intakeComplete ? 'Intake Complete' : 'Intake Active', 
                        description: `Confidence score at ${intelligence.confidenceScore}.`, 
                        timestamp: new Date().toISOString(), 
                        status: intelligence.intakeComplete ? 'completed' : 'active', 
                        icon: '🔍' 
                      }} 
                      index={1} 
                      isLast={intelligence.contradictions.length === 0} 
                    />
                    {intelligence.contradictions.length > 0 && (
                       <TimelineStep 
                        step={{ title: 'Contradiction Detected', description: 'System requires clarification.', timestamp: new Date().toISOString(), status: 'pending', icon: '⚠️' }} 
                        index={2} 
                        isLast={true} 
                      />
                    )}
                  </div>
                </div>
              )}

              {/* ── OCR Scan Panel ───────────────────────────────── */}
              {activePanel === 'scan' && (
                <div>
                  <div className="authority-strip mb-4">
                    {language === 'hi-IN' ? '📷 दस्तावेज़ स्कैन करें' : '📷 Scan Documents'}
                  </div>
                  <p className="text-xs text-muted mb-4">
                    {language === 'hi-IN'
                      ? 'आधार, PAN, FIR या कोई भी दस्तावेज़ अपलोड करें। AI तुरंत जाँच करेगा।'
                      : 'Upload Aadhaar, PAN, FIR or any document. AI verifies instantly.'}
                  </p>
                  <OCRPanel
                    caseId={caseId}
                    caseName={legalCase.victimName || undefined}
                    onDocumentVerified={(doc) => {
                      // BRIDGE: Dexie → localStorage
                      // OCR panel saves results to IndexedDB (Dexie). The case page
                      // reads legalCase.evidence from localStorage. We must bridge
                      // the verified document back into the legalJourney store so
                      // readiness scores, verifiedDocTypes, and the UI all update.
                      const current = getLegalCase(caseId);
                      if (current) {
                        const evidenceItem = {
                          id:           doc.id,
                          type:         'document' as EvidenceType,
                          filename:     doc.fileName,
                          uploadedAt:   doc.createdAt,
                          description:  doc.type,
                          verifiedByAI: doc.verificationStatus === 'Verified' || doc.verificationStatus === 'Partial Match',
                          relevanceNote: doc.ocrData?.verificationResult?.status ?? doc.verificationStatus,
                        };
                        // Avoid duplicate entries for same document ID
                        const existingEvidence = current.evidence ?? [];
                        const alreadyExists = existingEvidence.some((e) => e.id === doc.id);
                        if (!alreadyExists) {
                          updateCase(caseId, { evidence: [...existingEvidence, evidenceItem] });
                          // Refresh React state from localStorage
                          const refreshed = getLegalCase(caseId);
                          if (refreshed) setLegalCase(refreshed);
                        }
                      }

                      // Visual feedback — briefly switch to readiness after a verified doc
                      if (doc.verificationStatus === 'Verified' || doc.verificationStatus === 'Partial Match') {
                        setActivePanel('readiness');
                        setTimeout(() => setActivePanel('scan'), 1500);
                      }
                    }}
                  />
                </div>
              )}

              {/* ── Local AI Setup Panel ─────────────────────────── */}
              {activePanel === 'ai' && (
                <div>
                  <div className="authority-strip mb-4">
                    {language === 'hi-IN' ? '🤖 AI स्थिति' : '🤖 AI Status'}
                  </div>
                  <div className="p-3 bg-navy/5 rounded-xl text-xs text-navy/60 space-y-2">
                    <p className="font-semibold text-navy">
                      {language === 'hi-IN' ? 'वर्तमान AI इंजन' : 'Current AI Engine'}
                    </p>
                    <p className="text-teal-600 font-medium">✓ Gemma 3 (Google AI Studio)</p>
                    <p>Fallback: Gemini 2.0 Flash</p>
                    <p className="text-navy/40">
                      {language === 'hi-IN'
                        ? 'NALSA हेल्पलाइन: 15100'
                        : 'NALSA Helpline: 15100'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── STICKY INPUT ─────────────────────────────────────────── */}
      {/* FIX: safe-bottom adds env(safe-area-inset-bottom) padding so the
          input isn't hidden under iPhone home indicator or Android nav bar */}
      <footer className="sticky bottom-0 z-20 bg-white border-t border-cool-gray shadow-sm safe-bottom">
        {networkError && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-sm text-sm font-medium"
                 style={{ background: 'rgba(217,83,79,0.08)', border: '1px solid rgba(217,83,79,0.25)', color: '#C0392B' }}>
              <span lang={language}>{networkError}</span>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5 grid sm:grid-cols-[auto,1fr] gap-4 sm:gap-5 items-end">
          <div className="flex justify-center sm:justify-start">
            <MicButton onTranscript={handleUserInput} language={language} disabled={isAITyping} />
          </div>

          <div className="flex items-end gap-2 sm:gap-3">
            <textarea
              ref={textareaRef}
              value={textInput}
              rows={1}
              onChange={(e) => {
                setTextInput(e.target.value);
                const ta = e.target;
                ta.style.height = 'auto';
                ta.style.height = Math.min(ta.scrollHeight, 128) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && textInput.trim()) {
                  e.preventDefault();
                  handleUserInput(textInput);
                  if (textareaRef.current) textareaRef.current.style.height = 'auto';
                }
              }}
              placeholder={t('speak', language)}
              disabled={isAITyping}
              lang={language}
              className="fr-input flex-1 min-w-0 px-4 py-3 text-base resize-none overflow-y-auto"
              style={{ lineHeight: '1.5', minHeight: '48px', maxHeight: '128px' }}
            />
            <button
              onClick={() => {
                if (textInput.trim()) {
                  handleUserInput(textInput);
                  if (textareaRef.current) textareaRef.current.style.height = 'auto';
                }
              }}
              disabled={isAITyping || !textInput.trim()}
              aria-label={t('sendMessage', language)}
              className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 bg-navy text-white rounded-md
                         hover:bg-navy/90 active:scale-95
                         disabled:opacity-40 disabled:cursor-not-allowed
                         flex items-center justify-center transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        <SpeakerButton
          key={`${personaId}-${language}-${lastAiText.slice(0, 20)}`}
          text={lastAiText}
          language={language}
          persona={personaId}
          variant="floating"
          autoPlay={false}
        />
      </footer>
    </div>
  );
}

export default function CaseWorkspacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <FirstReportLogo size={64} variant="icon" theme="light" />
      </div>
    }>
      <CaseWorkspace />
    </Suspense>
  );
}
