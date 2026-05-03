/**
 * FirstReport — Main Application State & Controller
 *
 * 7 screens:
 *   1  Language selector
 *   2  Case type selection
 *   3  Incident recording (STT)
 *   4  Clarification loop
 *   5  Classification result
 *   6  Documents & sharing
 *   7  Case history
 */

/* ── Language metadata ───────────────────────────────────────────────────────── */
const LANGUAGES = [
  { code: 'hi-IN', label: 'हिन्दी',   sub: 'Hindi',     flag: '🇮🇳' },
  { code: 'en-IN', label: 'English',   sub: 'English',   flag: '🇬🇧' },
  { code: 'bn-IN', label: 'বাংলা',    sub: 'Bengali',   flag: '🪷' },
  { code: 'ta-IN', label: 'தமிழ்',   sub: 'Tamil',     flag: '🌺' },
  { code: 'te-IN', label: 'తెలుగు',   sub: 'Telugu',    flag: '🌸' },
  { code: 'mr-IN', label: 'मराठी',    sub: 'Marathi',   flag: '🌻' },
  { code: 'gu-IN', label: 'ગુજરાતી', sub: 'Gujarati',  flag: '🦋' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ',   sub: 'Kannada',   flag: '🌿' },
  { code: 'ml-IN', label: 'മലയാളം',  sub: 'Malayalam', flag: '🌴' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ',  sub: 'Punjabi',   flag: '🌾' },
  { code: 'od-IN', label: 'ଓଡ଼ିଆ',   sub: 'Odia',      flag: '🐚' },
];

/* ── Case type metadata ──────────────────────────────────────────────────────── */
const CASE_TYPES = [
  { id: 'standard',  icon: '📋', label: 'सामान्य शिकायत', sub: 'General Complaint' },
  { id: 'women_dv',  icon: '🛡️', label: 'महिला / घरेलू हिंसा', sub: 'Women / Domestic Violence' },
  { id: 'pocso',     icon: '👶', label: 'बच्चों के विरुद्ध अपराध', sub: 'POCSO / Crimes Against Children' },
  { id: 'senior',    icon: '🙏', label: 'वरिष्ठ नागरिक', sub: 'Senior Citizen' },
  { id: 'advisor',   icon: '⚖️', label: 'कानूनी सलाहकार', sub: 'Legal Advisor' },
];

/* ── Share methods ───────────────────────────────────────────────────────────── */
const SHARE_METHODS = [
  { id: 'telegram',  icon: '✈️', label: 'Telegram' },
  { id: 'email',     icon: '📧', label: 'Email' },
  { id: 'whatsapp',  icon: '💬', label: 'WhatsApp' },
  { id: 'drive',     icon: '☁️', label: 'Drive' },
  { id: 'dropbox',   icon: '📦', label: 'Dropbox' },
  { id: 'download',  icon: '⬇️', label: 'Download' },
  { id: 'print',     icon: '🖨️', label: 'Print' },
  { id: 'text',      icon: '📝', label: 'Text' },
];

/* ── App state ────────────────────────────────────────────────────────────────── */
const State = {
  currentScreen:   1,
  language:        localStorage.getItem('fr_lang') || 'hi-IN',
  caseType:        null,
  transcript:      '',
  clarifyQuestion: null,
  clarifyAnswer:   '',
  classification:  null,
  sessionId:       null,
  docPaths:        {},
  shareMethod:     'telegram',
  encryptEnabled:  false,
  userPin:         '',
  chatHistory:     [],
  darkMode:        localStorage.getItem('fr_dark') === 'true',
};

/* ── Helpers ──────────────────────────────────────────────────────────────────── */

function $(id) { return document.getElementById(id); }

function showToast(msg, type = 'default', duration = 3000) {
  const t = $('toast');
  if (!t) return;
  t.textContent    = msg;
  t.className      = `toast ${type}`;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.classList.remove('show'); }, duration);
}

function showLoading(msg = 'कृपया प्रतीक्षा करें…') {
  const el = $('loading-overlay');
  if (el) {
    el.querySelector('.loading-text').textContent = msg;
    el.classList.add('show');
  }
}

function hideLoading() {
  const el = $('loading-overlay');
  if (el) el.classList.remove('show');
}

/** Speaker SVG icon HTML */
const SPK = `<button class="speaker-btn" aria-label="सुनें" onclick="handleSpeaker(this)">
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z"/>
  </svg>
</button>`;

function handleSpeaker(btn) {
  const text = btn.closest('[data-speak]')?.dataset?.speak
            || btn.previousSibling?.textContent?.trim()
            || btn.parentElement?.textContent?.trim();
  if (text) {
    triggerHaptic('light');
    Voice.speak(text);
    btn.classList.toggle('speaking');
    setTimeout(() => btn.classList.remove('speaking'), 4000);
  }
}

/* ── Screen navigation ────────────────────────────────────────────────────────── */

function navigate(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $(`screen-${screen}`);
  if (el) {
    el.classList.add('active');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  State.currentScreen = screen;
  updateProgress(screen);
  updateHeaderLang();
  triggerHaptic('light');
}

function updateProgress(screen) {
  const bar = $('progress-bar-wrap');
  if (!bar) return;

  if (screen === 7) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'block';

  const steps  = bar.querySelectorAll('.progress-step');
  const label  = bar.querySelector('.progress-label');
  const labels = ['भाषा', 'मामला', 'रिकॉर्ड', 'स्पष्टीकरण', 'वर्गीकरण', 'दस्तावेज़'];

  steps.forEach((s, i) => {
    s.classList.remove('done', 'active');
    if (i + 1 < screen) s.classList.add('done');
    else if (i + 1 === screen) s.classList.add('active');
  });

  if (label) label.textContent = `${screen}/6 — ${labels[screen - 1] || ''}`;
}

/* ── Header language sync ─────────────────────────────────────────────────────── */

function updateHeaderLang() {
  const sel = $('header-lang-sel');
  if (sel) sel.value = State.language;
}

/* ── SCREEN 1: Language selection ─────────────────────────────────────────────── */

function initScreen1() {
  const sel = $('lang-select-full');
  if (!sel) return;

  sel.innerHTML = LANGUAGES.map(l =>
    `<option value="${l.code}" ${l.code === State.language ? 'selected' : ''}>
       ${l.flag} ${l.label} — ${l.sub}
     </option>`
  ).join('');

  sel.addEventListener('change', () => {
    State.language = sel.value;
    localStorage.setItem('fr_lang', sel.value);
    Voice.setLanguage(sel.value);
    triggerHaptic('medium');
    updateHeaderLang();
  });
}

/* ── SCREEN 2: Case type ──────────────────────────────────────────────────────── */

function initScreen2() {
  const list = $('case-list');
  if (!list) return;

  list.innerHTML = CASE_TYPES.map(ct => `
    <button class="case-card" data-case="${ct.id}" data-speak="${ct.label} — ${ct.sub}"
            onclick="selectCaseType('${ct.id}', this)">
      <div class="case-icon">${ct.icon}</div>
      <div class="case-info">
        <h3>${ct.label}</h3>
        <p>${ct.sub}</p>
      </div>
      ${SPK}
    </button>
  `).join('');
}

function selectCaseType(id, el) {
  State.caseType = id;
  document.querySelectorAll('.case-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  triggerHaptic('medium');
  setTimeout(() => navigate(3), 300);
}

/* ── SCREEN 3: Recording ──────────────────────────────────────────────────────── */

let _recBtn, _waveform, _txPreview;

function initScreen3() {
  _recBtn   = $('mic-btn');
  _waveform = $('waveform');
  _txPreview = $('transcript-preview');

  if (_recBtn) {
    _recBtn.addEventListener('pointerdown', onMicDown);
    _recBtn.addEventListener('pointerup',   onMicUp);
    _recBtn.addEventListener('pointerleave', () => { if (Voice.isRecording) onMicUp(); });
  }
}

async function onMicDown() {
  try {
    await Voice.startRecording();
    _recBtn.classList.add('recording');
    _recBtn.setAttribute('aria-label', 'रिकॉर्डिंग — छोड़ें');
    if (_waveform) _waveform.style.display = 'flex';
    triggerHaptic('medium');
  } catch (err) {
    showToast('माइक्रोफ़ोन की अनुमति नहीं मिली', 'error');
  }
}

async function onMicUp() {
  if (!Voice.isRecording) return;

  _recBtn.classList.remove('recording');
  _recBtn.setAttribute('aria-label', 'रिकॉर्ड करें');
  if (_waveform) _waveform.style.display = 'none';

  const blob = await Voice.stopRecording();
  triggerHaptic('light');

  // Show spinner inside transcript box
  if (_txPreview) _txPreview.innerHTML = '<span class="transcript-placeholder">लिख रहा हूँ…</span>';

  const text = await Voice.transcribe(blob);

  if (text) {
    State.transcript = text;
    if (_txPreview) _txPreview.textContent = text;
    $('btn-continue-3')?.removeAttribute('disabled');
  } else {
    // Fallback: show text input
    if (_txPreview) _txPreview.innerHTML =
      `<textarea id="manual-tx" rows="4" placeholder="यहाँ अपनी बात लिखें…" style="width:100%;border:none;background:transparent;resize:none;font-size:15px;outline:none;"
       oninput="State.transcript=this.value;$('btn-continue-3').removeAttribute('disabled')"></textarea>`;
    showToast('आवाज़ पहचान विफल — कृपया लिखें', 'error');
  }
}

/* ── SCREEN 4: Clarification ──────────────────────────────────────────────────── */

async function loadClarification() {
  showLoading('प्रश्न तैयार हो रहा है…');
  try {
    State.chatHistory.push({ role: 'user', content: State.transcript });

    const res  = await fetch(`${BACKEND_URL}/api/clarify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        transcript: State.transcript,
        history:    State.chatHistory,
        lang_code:  State.language,
      }),
    });
    const data = await res.json();

    if (data.isComplete || !data.question) {
      // Skip clarification — go straight to classification
      hideLoading();
      await runClassification();
      return;
    }

    State.clarifyQuestion = data.question;
    const qEl = $('clarify-question-text');
    if (qEl) {
      qEl.textContent = data.question;
      Voice.speak(data.question);
    }

    navigate(4);
  } catch (err) {
    showToast('नेटवर्क त्रुटि', 'error');
  } finally {
    hideLoading();
  }
}

/* ── SCREEN 5: Classification ─────────────────────────────────────────────────── */

async function runClassification() {
  showLoading('वर्गीकरण हो रहा है…');
  try {
    const fullText = State.clarifyAnswer
      ? `${State.transcript}. ${State.clarifyAnswer}`
      : State.transcript;

    const res  = await fetch(`${BACKEND_URL}/api/classify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ transcript: fullText, lang_code: State.language }),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.detail || 'Classification failed');

    State.classification = data;
    renderClassification(data);
    navigate(5);
  } catch (err) {
    showToast('वर्गीकरण विफल — पुनः प्रयास करें', 'error');
    console.error(err);
  } finally {
    hideLoading();
  }
}

function renderClassification(data) {
  const c = data.classification || {};
  const setText = (id, val) => { const el = $(id); if (el) el.textContent = val || '—'; };

  setText('cls-section',    c.bnss_section    || '—');
  setText('cls-offense',    c.offense_name_hindi || c.offense_name || '—');
  setText('cls-confidence', c.confidence      ? `${Math.round(c.confidence * 100)}%` : '—');
  setText('cls-punishment', c.max_punishment  || '—');
  setText('cls-explanation', c.explanation   || 'यह अपराध BNSS 2023 के अंतर्गत आता है।');

  const fill = $('confidence-fill');
  if (fill) fill.style.width = `${Math.round((c.confidence || 0.9) * 100)}%`;

  // Speak the section announcement
  const announcement = `धारा ${c.bnss_section || ''} — ${c.offense_name_hindi || ''}`;
  Voice.speak(announcement);
}

/* ── SCREEN 6: Document generation & sharing ──────────────────────────────────── */

async function generateDocs() {
  showLoading('दस्तावेज़ बन रहे हैं…');
  try {
    const fullText = State.clarifyAnswer
      ? `${State.transcript}. ${State.clarifyAnswer}`
      : State.transcript;

    const res  = await fetch(`${BACKEND_URL}/api/generate-docs`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        transcript:     fullText,
        crime_input:    State.classification?.crime_input || {},
        classification: State.classification?.classification || {},
        lang_code:      State.language,
      }),
    });
    const data = await res.json();

    if (!data.success) throw new Error('Doc generation failed');

    State.sessionId = data.session_id;
    State.docPaths  = data.paths || {};
    renderDocuments(data);
    navigate(6);

    // Save to local history
    CaseHistory.save({
      sessionId:   data.session_id,
      caseType:    State.caseType,
      transcript:  State.transcript,
      bnssSection: State.classification?.classification?.bnss_section,
      offense:     State.classification?.classification?.offense_name_hindi,
      status:      'generated',
      language:    State.language,
    });
  } catch (err) {
    showToast('दस्तावेज़ बनाने में त्रुटि', 'error');
    console.error(err);
  } finally {
    hideLoading();
  }
}

const DOC_META = [
  { key: 'sp_complaint',     icon: '👮', label: 'SP शिकायत',  sub: 'पुलिस अधीक्षक को' },
  { key: 'dm_petition',      icon: '🏛️', label: 'DM याचिका',  sub: 'जिलाधिकारी को' },
  { key: 'hc_writ',          icon: '⚖️', label: 'HC रिट',     sub: 'उच्च न्यायालय को' },
  { key: 'accountability_doc', icon: '📄', label: 'जवाबदेही दस्तावेज़', sub: 'अधिकारी विवरण' },
];

function renderDocuments(data) {
  const list = $('doc-list');
  if (!list) return;

  list.innerHTML = DOC_META.map(d => `
    <div class="doc-card" data-speak="${d.label}">
      <div class="doc-icon">${d.icon}</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:15px">${d.label}</div>
        <div style="font-size:12px;color:var(--color-text-secondary)">${d.sub}</div>
      </div>
      <div class="doc-actions">
        ${SPK}
        <button class="btn btn-outline" style="padding:8px 12px;font-size:13px"
                onclick="previewDoc('${d.key}')">👁️</button>
      </div>
    </div>
  `).join('');
}

function previewDoc(key) {
  const path = State.docPaths?.[key];
  if (path) {
    window.open(`${BACKEND_URL}/output/${path.split('/').pop()}`, '_blank');
  } else {
    showToast('दस्तावेज़ उपलब्ध नहीं है', 'error');
  }
}

function initShareMethods() {
  const grid = $('share-method-grid');
  if (!grid) return;

  grid.innerHTML = SHARE_METHODS.map(m => `
    <button class="share-method-btn ${m.id === State.shareMethod ? 'active' : ''}"
            data-method="${m.id}"
            onclick="selectShareMethod('${m.id}', this)">
      <span class="share-icon">${m.icon}</span>
      <span>${m.label}</span>
    </button>
  `).join('');
}

function selectShareMethod(id, el) {
  State.shareMethod = id;
  document.querySelectorAll('.share-method-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  triggerHaptic('light');
}

async function sendDocuments() {
  if (!State.sessionId) { showToast('पहले दस्तावेज़ बनाएं', 'error'); return; }

  showConfirm(
    'दस्तावेज़ भेजें?',
    `${SHARE_METHODS.find(m => m.id === State.shareMethod)?.label || ''} के माध्यम से भेजा जाएगा।`,
    async () => {
      showLoading('भेजा जा रहा है…');
      try {
        let encPin = null;
        if (State.encryptEnabled && State.userPin) {
          encPin = State.userPin;
        }

        const res  = await fetch(`${BACKEND_URL}/api/share-document`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            document_id:  State.sessionId,
            share_method: State.shareMethod,
            share_target: null,
            encrypted:    State.encryptEnabled,
            user_pin:     encPin,
          }),
        });

        if (res.ok) {
          showToast('दस्तावेज़ भेज दिया गया ✓', 'success');
          CaseHistory.save({ sessionId: State.sessionId, status: 'sent', shareMethod: State.shareMethod });
        } else {
          // Queue for later
          SyncQueue.enqueue(State.sessionId, State.shareMethod, null, State.encryptEnabled);
          showToast('ऑफ़लाइन — बाद में भेजा जाएगा', 'default');
        }
      } catch {
        SyncQueue.enqueue(State.sessionId, State.shareMethod, null, State.encryptEnabled);
        showToast('नेटवर्क नहीं — कतार में जोड़ा गया', 'default');
      } finally {
        hideLoading();
      }
    }
  );
}

/* ── SCREEN 7: Case history ───────────────────────────────────────────────────── */

function renderHistory() {
  const list = $('history-list');
  if (!list) return;

  const cases = CaseHistory.getAll();
  if (!cases.length) {
    list.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">📂</div>
        <p>अभी कोई मामला नहीं है।<br>पहला मामला दर्ज करें।</p>
      </div>`;
    return;
  }

  list.innerHTML = cases.map(c => {
    const date   = new Date(c.createdAt).toLocaleDateString('hi-IN');
    const status = c.status === 'sent' ? 'status-sent' : 'status-pending';
    const label  = c.status === 'sent' ? '✓ भेजा गया' : '⏳ लंबित';
    return `
      <div class="history-card" data-speak="${c.offense || 'मामला'}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:20px">${CASE_TYPES.find(t=>t.id===c.caseType)?.icon||'📋'}</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px">${c.offense || c.bnssSection || 'मामला'}</div>
            <div style="font-size:12px;color:var(--color-text-secondary)">${date}</div>
          </div>
          <span class="case-status ${status}">${label}</span>
          ${SPK}
        </div>
        ${c.bnssSection ? `<div style="font-size:13px;color:var(--color-text-secondary)">धारा ${c.bnssSection}</div>` : ''}
      </div>`;
  }).join('');
}

/* ── Online/offline indicator ─────────────────────────────────────────────────── */

function updateNetworkBadge() {
  const el = $('network-badge');
  if (!el) return;
  el.textContent = navigator.onLine ? '🟢 ऑनलाइन' : '🔴 ऑफ़लाइन';
  el.className   = navigator.onLine ? 'online-badge' : 'offline-badge';
}

/* ── Confirmation dialog ──────────────────────────────────────────────────────── */

let _confirmCallback = null;

function showConfirm(title, msg, onConfirm) {
  _confirmCallback = onConfirm;
  const backdrop = $('confirm-dialog');
  if (!backdrop) { onConfirm(); return; }
  $('confirm-title').textContent = title;
  $('confirm-msg').textContent   = msg;
  backdrop.classList.add('show');
}

/* ── Dark mode ────────────────────────────────────────────────────────────────── */

function applyDarkMode() {
  document.body.classList.toggle('dark-mode', State.darkMode);
  const btn = $('dark-toggle');
  if (btn) btn.textContent = State.darkMode ? '☀️' : '🌙';
}

/* ── Initialisation ───────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved preferences
  applyDarkMode();
  Voice.setLanguage(State.language);

  // Build dynamic screens
  initScreen1();
  initScreen2();
  initScreen3();
  initShareMethods();

  // Populate header language selector
  const headerSel = $('header-lang-sel');
  if (headerSel) {
    headerSel.innerHTML = LANGUAGES.map(l =>
      `<option value="${l.code}" ${l.code === State.language ? 'selected' : ''}>${l.flag} ${l.sub}</option>`
    ).join('');
    headerSel.addEventListener('change', () => {
      State.language = headerSel.value;
      localStorage.setItem('fr_lang', State.language);
      Voice.setLanguage(State.language);
      const fullSel = $('lang-select-full');
      if (fullSel) fullSel.value = State.language;
    });
  }

  // Dark mode toggle
  $('dark-toggle')?.addEventListener('click', () => {
    State.darkMode = !State.darkMode;
    localStorage.setItem('fr_dark', State.darkMode);
    applyDarkMode();
    triggerHaptic('light');
  });

  // Encryption toggle
  $('encrypt-toggle')?.addEventListener('change', (e) => {
    State.encryptEnabled = e.target.checked;
    const pinSection = $('pin-section');
    if (pinSection) pinSection.classList.toggle('visible', State.encryptEnabled);
    triggerHaptic('light');
  });

  // PIN input
  $('pin-input')?.addEventListener('input', (e) => {
    State.userPin = e.target.value;
  });

  // Screen 1 → 2
  $('btn-start')?.addEventListener('click', () => {
    triggerHaptic('medium');
    navigate(2);
    Voice.speak('अपना मामला चुनें');
  });

  // Screen 3: continue after transcript
  $('btn-continue-3')?.addEventListener('click', async () => {
    if (!State.transcript) { showToast('पहले बोलें', 'error'); return; }
    triggerHaptic('medium');
    navigate(4);
    await loadClarification();
  });

  // Screen 4: submit clarification
  const clarRec = $('mic-btn-clarify');
  if (clarRec) {
    clarRec.addEventListener('pointerdown', async () => {
      await Voice.startRecording();
      clarRec.classList.add('recording');
    });
    clarRec.addEventListener('pointerup', async () => {
      clarRec.classList.remove('recording');
      const blob = await Voice.stopRecording();
      const text = await Voice.transcribe(blob);
      if (text) {
        State.clarifyAnswer = text;
        const el = $('clarify-answer-preview');
        if (el) el.textContent = text;
        $('btn-continue-4')?.removeAttribute('disabled');
      }
    });
  }

  $('btn-continue-4')?.addEventListener('click', async () => {
    State.chatHistory.push({ role: 'assistant', content: State.clarifyQuestion });
    State.chatHistory.push({ role: 'user',      content: State.clarifyAnswer });
    triggerHaptic('medium');
    await runClassification();
  });

  $('btn-skip-4')?.addEventListener('click', async () => {
    triggerHaptic('light');
    await runClassification();
  });

  // Screen 5: generate docs
  $('btn-generate-docs')?.addEventListener('click', async () => {
    triggerHaptic('medium');
    await generateDocs();
  });

  // Screen 6: send
  $('btn-send-docs')?.addEventListener('click', sendDocuments);

  // Screen 6 → 7 (history)
  $('btn-view-history')?.addEventListener('click', () => {
    renderHistory();
    navigate(7);
  });

  // Screen 7: new case
  $('btn-new-case')?.addEventListener('click', () => {
    // Reset state
    State.transcript      = '';
    State.clarifyQuestion = null;
    State.clarifyAnswer   = '';
    State.classification  = null;
    State.sessionId       = null;
    State.chatHistory     = [];
    const txEl = $('transcript-preview');
    if (txEl) txEl.innerHTML = '<span class="transcript-placeholder">आपकी बात यहाँ दिखेगी…</span>';
    navigate(1);
  });

  // Confirm dialog
  $('btn-confirm-yes')?.addEventListener('click', () => {
    $('confirm-dialog')?.classList.remove('show');
    _confirmCallback?.();
  });
  $('btn-confirm-no')?.addEventListener('click', () => {
    $('confirm-dialog')?.classList.remove('show');
  });

  // Network events
  window.addEventListener('online',  updateNetworkBadge);
  window.addEventListener('offline', updateNetworkBadge);
  updateNetworkBadge();

  // Sync queue updates
  window.addEventListener('syncQueueUpdated', (e) => {
    const badge = $('sync-badge');
    if (badge) badge.textContent = e.detail.pending > 0 ? `⏳ ${e.detail.pending} लंबित` : '';
  });

  // Start on screen 1
  navigate(1);

  // Auto-play welcome TTS
  setTimeout(() => Voice.speak('नमस्ते! FirstReport में आपका स्वागत है। अपनी भाषा चुनें।'), 600);
});
