# Debug Prompt: Fix STT/TTS for Gujarati, Malayalam, Punjabi, Odia

## Problem Statement
Currently, 4 Indian languages are non-functional:
- **Gujarati (gu-IN)** — speaker button silent, mic not recording
- **Malayalam (ml-IN)** — speaker button silent, mic not recording  
- **Punjabi (pa-IN)** — speaker button silent, mic not recording
- **Odia (or-IN)** — speaker button silent, mic not recording

**Secondary issue:** Mic permission is continuously requested on macOS even when not actively recording—potential security concern.

---

## What to Debug

### 1. Sarvam API Language Code Mapping
**File:** `core/sarvam_stt.py`

The Sarvam STT API documentation may not list support for `gu-IN`, `ml-IN`, `pa-IN`, `or-IN`. Check:
- [ ] Sarvam API docs for actual supported language codes
- [ ] If these languages map differently (e.g., `gu` instead of `gu-IN`)
- [ ] Whether Sarvam supports these languages at all (fallback needed?)

**Current code:**
```python
data = {
    "model": "saarika:v2.5",
    "language_code": lang_code,  # <- Is lang_code correct for these 4 languages?
}
```

**Action:** Verify the correct `language_code` parameter values for each language against Sarvam API docs or test with sample audio.

---

### 2. Sarvam Text-to-Speech (TTS) Language Code Mapping
**File:** Not yet in codebase (needs creation or check in UI)

The speaker button likely uses Web Speech API OR a Sarvam TTS endpoint. Check:
- [ ] Is TTS using Sarvam API or Web Speech API?
- [ ] If Sarvam TTS: does it support `gu-IN`, `ml-IN`, `pa-IN`, `or-IN`?
- [ ] If Web Speech API: check browser console for voice selection errors

**Hypothesis:** Sarvam TTS may only support `hi-IN` and `en-IN`. The other 4 languages may need fallback to Web Speech API or alternate TTS service.

---

### 3. Web Speech API Fallback for Missing Languages
**File:** `frontend/js/app.js`

If Sarvam doesn't support these languages, fallback to Web Speech API:
- [ ] Check if browser has native voice for `gu`, `ml`, `pa`, `or`
- [ ] Web Speech API may not have these voices on all devices
- [ ] On macOS/iOS, check System Preferences → Accessibility → Speech for available voices

**Debug code snippet needed:**
```javascript
// In app.js, add debugging:
const voices = window.speechSynthesis.getVoices();
const gujaratiVoice = voices.filter(v => v.lang.startsWith('gu'));
const malayalamVoice = voices.filter(v => v.lang.startsWith('ml'));
const punjabiVoice = voices.filter(v => v.lang.startsWith('pa'));
const odiaVoice = voices.filter(v => v.lang.startsWith('or'));

console.log("Available voices:", {gujaratiVoice, malayalamVoice, punjabiVoice, odiaVoice});
```

---

### 4. Microphone Permission Leak (macOS Security Issue)
**File:** `frontend/js/app.js`

The mic is being accessed continuously even when not recording. This is a security/UX problem.

**Current behavior:**
- Mic permission is requested every page load?
- Mic is held open even after recording stops?

**Action:**
- [ ] Only request mic permission when user clicks the mic button
- [ ] Release mic immediately after recording ends
- [ ] Add explicit `mediaStream.getTracks().forEach(track => track.stop())` after recording

**Debug code:**
```javascript
// Check if mic is being held open:
navigator.mediaDevices.getUserMedia({audio: true})
  .then(stream => {
    console.log("Mic tracks:", stream.getTracks());
    // MUST stop tracks after recording:
    stream.getTracks().forEach(track => {
      console.log("Stopping track:", track);
      track.stop();
    });
  });
```

---

## Steps to Fix (For Claude)

1. **Test Sarvam API Language Support**
   - Call Sarvam STT API with test audio in each language
   - Log the actual error or success response
   - Verify correct `language_code` parameter

2. **Add Language Support Matrix**
   - Create a config file mapping languages to TTS/STT providers:
     ```python
     LANGUAGE_SUPPORT = {
         "hi": {"stt": "sarvam", "tts": "sarvam", "code": "hi-IN"},
         "gu": {"stt": "unsupported", "tts": "web_speech", "code": "gu"},
         "ml": {"stt": "unsupported", "tts": "web_speech", "code": "ml"},
         "pa": {"stt": "unsupported", "tts": "web_speech", "code": "pa"},
         "or": {"stt": "unsupported", "tts": "web_speech", "code": "or"},
     }
     ```

3. **Implement Web Speech API Fallback**
   - If Sarvam TTS fails or language not supported, use Web Speech API
   - Check available system voices before attempting TTS
   - Graceful degradation: if no voice, show text instead of speaking

4. **Fix Microphone Permission Handling**
   - Only request `getUserMedia()` on mic button click
   - Stop all tracks immediately after recording ends
   - Add optional permission caching (request once per session)

5. **Test on Real Device**
   - Test on actual Jio 4G with Samsung Galaxy A03 (Sunita's device) if possible
   - Verify offline behavior
   - Check mic permission prompts on macOS

---

## Expected Outcome

After these fixes:
✅ Speaker button reads text in Gujarati, Malayalam, Punjabi, Odia (or gracefully falls back to text display)
✅ Mic button captures audio without continuous permission requests
✅ No continuous mic access drain on macOS
✅ App runs completely offline for all 4 languages (text input mode)

---

## Reference: Sarvam API Docs

**Current endpoint:** `https://api.sarvam.ai/speech-to-text`
**Model:** `saarika:v2.5`

Check official Sarvam documentation for:
- Supported language codes
- TTS endpoint (if available)
- Rate limits
- Error codes specific to unsupported languages

