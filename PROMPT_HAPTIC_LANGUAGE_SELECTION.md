# Prompt: Haptic Feedback + Auto-Navigation on Language Selection

**For:** Claude to implement haptic feedback and automatic screen navigation on language selection  
**Context:** FirstReport (Kaggle hackathon) — offline legal aid app for low-literacy users  
**Framework:** Vanilla HTML/CSS/JS, Gradio on Kaggle  
**Target Device:** Samsung Galaxy A03 (Jio 4G, low processing power)  

---

## Task Overview

When a user clicks/taps on a language option (Hindi, English, Gujarati, etc.):

1. ✅ **Haptic Feedback** — Device vibrates to confirm the tap
2. ✅ **Visual Feedback** — Button scales, gets highlighted
3. ✅ **Auto-Navigation** — App automatically moves to the next screen (Voice Input) after 300ms delay
4. ✅ **Memory** — Selected language is cached (localStorage or IndexedDB) so it persists across sessions
5. ✅ **Offline-Ready** — Works even if Jio network is down (haptics + navigation are local)

---

## Technical Requirements

### 1. Haptic Feedback Implementation

**Goal:** Trigger device vibration when language is selected

#### Option A: Web Vibration API (Recommended for Samsung Galaxy A03)
```javascript
// Simple haptic feedback
function triggerHaptic(pattern = 'medium') {
  if (!navigator.vibrate) {
    console.warn("Vibration API not supported");
    return;
  }
  
  const patterns = {
    light: [10],           // 10ms vibration
    medium: [20],          // 20ms vibration (default)
    strong: [50],          // 50ms vibration
    double: [20, 10, 20],  // Two quick taps
    pulse: [10, 5, 10, 5, 10]  // Pulse pattern
  };
  
  navigator.vibrate(patterns[pattern] || patterns.medium);
}
```

**Trigger Point:** On language selection click/tap
```javascript
languageButton.addEventListener('click', function(e) {
  triggerHaptic('medium');      // ← Vibrate
  selectLanguage(this.dataset.lang);
});
```

#### Option B: Fallback for Devices Without Vibration API
If `navigator.vibrate` is not available, use **visual feedback only**:
- Button scales: `transform: scale(0.95)`
- Flash effect: Brief color change
- Sound feedback (optional): Play a short "click" sound via Web Audio API

---

### 2. Visual Feedback on Click

**When user clicks language card/button:**

```css
/* CSS for button press effect */
.language-btn.active {
  background: var(--color-primary-500);      /* Green */
  color: white;
  transform: scale(0.98);                    /* Slight scale down */
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

/* Ripple/pulse animation on selection */
.language-btn.pulse {
  animation: haptic-pulse 0.6s ease-out;
}

@keyframes haptic-pulse {
  0% {
    box-shadow: 0 0 0 0 var(--color-primary-500);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(74, 159, 66, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(74, 159, 66, 0);
  }
}
```

**JavaScript to add classes on click:**
```javascript
languageButton.addEventListener('click', function() {
  // Remove active state from all buttons
  document.querySelectorAll('.language-btn').forEach(btn => {
    btn.classList.remove('active', 'pulse');
  });
  
  // Add active + pulse to clicked button
  this.classList.add('active', 'pulse');
  
  // Trigger haptic feedback
  triggerHaptic('medium');
});
```

---

### 3. Auto-Navigation After Selection

**Goal:** After user selects language, wait 300ms then move to Voice Input screen

```javascript
const NAVIGATION_DELAY = 300; // milliseconds

function selectLanguage(langCode) {
  // 1. Save language to cache
  cacheLanguage(langCode);
  
  // 2. Trigger haptic
  triggerHaptic('medium');
  
  // 3. Add visual feedback
  const btn = document.querySelector(`[data-lang="${langCode}"]`);
  btn.classList.add('active', 'pulse');
  
  // 4. Disable further clicks to prevent multiple navigation
  disableAllLanguageButtons();
  
  // 5. Navigate after delay
  setTimeout(() => {
    navigateToVoiceInput(langCode);
  }, NAVIGATION_DELAY);
}

function navigateToVoiceInput(langCode) {
  // If using Gradio, update the state
  if (window.gradioApp) {
    window.gradioApp.callFunction('set_language', [langCode]);
  }
  
  // If using vanilla HTML, hide language screen & show voice screen
  document.getElementById('language-screen').style.display = 'none';
  document.getElementById('voice-input-screen').style.display = 'block';
  
  // OR use a router function
  router.navigateTo('voice-input', { language: langCode });
  
  // Log for debugging
  console.log(`Language selected: ${langCode}, navigating to voice input...`);
}

function disableAllLanguageButtons() {
  document.querySelectorAll('.language-btn').forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';
  });
}
```

---

### 4. Language Caching (Offline Persistence)

**Goal:** Remember user's language choice so they don't see the language screen again

#### LocalStorage Approach (Simple, Works Offline)
```javascript
function cacheLanguage(langCode) {
  try {
    localStorage.setItem('firstReport_language', langCode);
    localStorage.setItem('firstReport_language_timestamp', Date.now());
    console.log(`Language cached: ${langCode}`);
  } catch (e) {
    console.warn("LocalStorage not available:", e);
    // Fallback: use session variable
    window.firstReportLanguage = langCode;
  }
}

function getCachedLanguage() {
  try {
    return localStorage.getItem('firstReport_language');
  } catch (e) {
    return window.firstReportLanguage || null;
  }
}

function clearLanguageCache() {
  try {
    localStorage.removeItem('firstReport_language');
    localStorage.removeItem('firstReport_language_timestamp');
  } catch (e) {
    window.firstReportLanguage = null;
  }
}
```

#### IndexedDB Approach (Better for Large Data, More Reliable)
```javascript
function initLanguageDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FirstReportDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    };
  });
}

async function cacheLanguageIndexedDB(langCode) {
  const db = await initLanguageDB();
  const tx = db.transaction(['settings'], 'readwrite');
  const store = tx.objectStore('settings');
  store.put({ language: langCode, timestamp: Date.now() }, 'user_language');
}

async function getCachedLanguageIndexedDB() {
  const db = await initLanguageDB();
  return new Promise((resolve) => {
    const request = db.transaction(['settings']).objectStore('settings').get('user_language');
    request.onsuccess = () => resolve(request.result?.language || null);
  });
}
```

---

### 5. Integration with App Startup

**On app load, check if language is cached. If yes, skip language screen:**

```javascript
async function initializeApp() {
  // Try to get cached language
  const cachedLang = await getCachedLanguage();
  
  if (cachedLang) {
    // Language already selected, skip to voice input
    console.log(`Resuming with cached language: ${cachedLang}`);
    navigateToVoiceInput(cachedLang);
  } else {
    // First-time user, show language selection
    console.log("First-time user, showing language selection screen");
    showLanguageScreen();
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', initializeApp);
```

---

### 6. Accessibility Considerations

**For low-literacy users (like Sunita), the haptic + visual feedback must be crystal clear:**

#### ARIA Labels (Screen Readers)
```html
<button class="language-btn" data-lang="hi" 
        aria-label="हिंदी भाषा चुनें (Select Hindi language)"
        aria-pressed="false">
  हिंदी
  <span class="language-code">HINDI</span>
</button>
```

#### Color Contrast (Dark Mode)
- Unselected button: Green on white → 7.2:1 contrast ✓
- Selected button: White text on dark green → 8.1:1 contrast ✓

#### Focus Management
```javascript
// After navigation, focus the first element in the new screen
setTimeout(() => {
  const firstElement = document.querySelector('[data-autofocus]');
  if (firstElement) firstElement.focus();
}, NAVIGATION_DELAY);
```

---

### 7. Error Handling

**What if haptics fail or navigation stalls?**

```javascript
function selectLanguageWithFallback(langCode) {
  try {
    // Try haptic feedback
    if (navigator.vibrate) {
      try {
        navigator.vibrate([20]);
      } catch (vibrationError) {
        console.warn("Haptic feedback failed:", vibrationError);
        // Silently fail—user will see visual feedback instead
      }
    }
    
    // Cache the language
    try {
      cacheLanguage(langCode);
    } catch (cacheError) {
      console.error("Could not cache language:", cacheError);
      // Continue anyway—app will work, just won't remember language
    }
    
    // Navigate (always attempt)
    navigateToVoiceInput(langCode);
    
  } catch (error) {
    console.error("Language selection failed:", error);
    // Show user-facing error message in Hindi
    showErrorMessage("भाषा सेटिंग में समस्या। फिर से कोशिश करें।");
  }
}
```

---

## Full Implementation Example

```javascript
// ========== MAIN LANGUAGE SELECTION MODULE ==========

const LanguageSelector = {
  
  HAPTIC_PATTERNS: {
    light: [10],
    medium: [20],
    strong: [50],
    double: [20, 10, 20],
    pulse: [10, 5, 10, 5, 10]
  },
  
  NAVIGATION_DELAY: 300,
  
  /**
   * Initialize language selector on page load
   */
  init() {
    this.attachEventListeners();
    this.restoreLanguageFromCache();
  },
  
  /**
   * Attach click handlers to all language buttons
   */
  attachEventListeners() {
    document.querySelectorAll('.language-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const langCode = btn.dataset.lang;
        this.selectLanguage(langCode);
      });
    });
  },
  
  /**
   * Handle language selection
   */
  selectLanguage(langCode) {
    // 1. Visual feedback
    this.highlightButton(langCode);
    
    // 2. Haptic feedback
    this.vibrate('medium');
    
    // 3. Cache language
    this.cacheLanguage(langCode);
    
    // 4. Disable further clicks
    this.disableButtons();
    
    // 5. Navigate after delay
    setTimeout(() => {
      this.navigate(langCode);
    }, this.NAVIGATION_DELAY);
  },
  
  /**
   * Highlight selected language button
   */
  highlightButton(langCode) {
    document.querySelectorAll('.language-btn').forEach(btn => {
      btn.classList.remove('active', 'pulse');
    });
    
    const selectedBtn = document.querySelector(`[data-lang="${langCode}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active', 'pulse');
    }
  },
  
  /**
   * Trigger haptic feedback
   */
  vibrate(pattern = 'medium') {
    if (!navigator.vibrate) {
      console.log("Vibration API not supported, using visual feedback only");
      return;
    }
    
    try {
      navigator.vibrate(this.HAPTIC_PATTERNS[pattern] || this.HAPTIC_PATTERNS.medium);
    } catch (error) {
      console.warn("Haptic feedback failed:", error);
    }
  },
  
  /**
   * Cache language selection
   */
  cacheLanguage(langCode) {
    try {
      localStorage.setItem('firstReport_language', langCode);
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  },
  
  /**
   * Restore language from cache
   */
  restoreLanguageFromCache() {
    try {
      const cachedLang = localStorage.getItem('firstReport_language');
      if (cachedLang) {
        console.log("Cached language found:", cachedLang);
        // Auto-navigate without showing language screen
        setTimeout(() => this.navigate(cachedLang), 100);
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
  },
  
  /**
   * Disable all language buttons
   */
  disableButtons() {
    document.querySelectorAll('.language-btn').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.6';
    });
  },
  
  /**
   * Navigate to voice input screen
   */
  navigate(langCode) {
    // Hide language screen
    const languageScreen = document.getElementById('language-screen');
    if (languageScreen) {
      languageScreen.style.display = 'none';
    }
    
    // Show voice input screen
    const voiceScreen = document.getElementById('voice-input-screen');
    if (voiceScreen) {
      voiceScreen.style.display = 'block';
      // Focus on first interactive element
      const firstBtn = voiceScreen.querySelector('button');
      if (firstBtn) firstBtn.focus();
    }
    
    // Log for debugging
    console.log(`Navigated to voice input with language: ${langCode}`);
    
    // Dispatch custom event for other modules
    window.dispatchEvent(new CustomEvent('languageSelected', { detail: { language: langCode } }));
  }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  LanguageSelector.init();
});
```

---

## HTML Structure for Language Screen

```html
<div id="language-screen" class="screen">
  <h1>भाषा चुनें</h1>
  <p>अपनी भाषा चुनकर शुरू करें</p>
  
  <div class="language-grid">
    <button class="language-btn" data-lang="hi" aria-label="हिंदी">
      हिंदी<br><small>HINDI</small>
    </button>
    <button class="language-btn" data-lang="gu" aria-label="ગુજરાતી">
      ગુજરાતી<br><small>GUJARATI</small>
    </button>
    <button class="language-btn" data-lang="ml" aria-label="മലയാളം">
      മലയാളം<br><small>MALAYALAM</small>
    </button>
    <button class="language-btn" data-lang="pa" aria-label="ਪੰਜਾਬੀ">
      ਪੰਜਾਬੀ<br><small>PUNJABI</small>
    </button>
    <button class="language-btn" data-lang="or" aria-label="ଓଡିଆ">
      ଓଡିଆ<br><small>ODIA</small>
    </button>
    <!-- Add more languages as needed -->
  </div>
</div>

<div id="voice-input-screen" class="screen" style="display: none;">
  <!-- Voice input content here -->
</div>
```

---

## Testing Checklist

- ✅ Test on actual Samsung Galaxy A03 (or similar budget Android device)
- ✅ Verify haptic feedback triggers on tap (Settings → Sound & haptics)
- ✅ Test on Jio 4G (simulate offline by disabling WiFi)
- ✅ Verify language caches and persists across app restart
- ✅ Test auto-navigation completes within 300ms
- ✅ Verify visual feedback (scale + color change) works in low light
- ✅ Test with screen reader (TalkBack on Android)
- ✅ Test rapid double-tap doesn't cause navigation stalls

---

## Offline Considerations

✅ All haptic + navigation logic is **100% client-side** — no API calls needed  
✅ Language selection works **even if Jio network is down**  
✅ Cache persists across sessions (localStorage survives app restart)  
✅ Visual & haptic feedback are instantaneous (no latency)  

---

## Notes for Implementation

- **Do not use external libraries** for haptics (rely on native Web Vibration API)
- **Keep JavaScript minimal** to run on low-end devices like Galaxy A03
- **Test haptic feedback** first—some devices/ROMs disable it by default
- **Provide visual-only fallback** for devices without vibration support
- **Log all errors** to console for debugging on actual device

