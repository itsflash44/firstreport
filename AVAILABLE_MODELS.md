# Google AI Studio Model Availability Audit

This document lists all the available models retrieved directly from the Google Generative AI API using the configured `GEMINI_API_KEY`, verifies specific requested models, and recommends the exact production replacements.

---

## 1. Verified Models Check

Here is the verification of the requested models from the API:

| Requested Model Name | Found in API? | API Identifier | Supported Methods | Input Token Limit | Output Token Limit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **gemma-3-4b-it** | ❌ No | N/A | N/A | N/A | N/A |
| **gemini-2.0-flash** | ✅ Yes | `models/gemini-2.0-flash` | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 8192 |
| **gemma-4-26b** | ❌ No | N/A | N/A | N/A | N/A |
| **gemma-4-31b** | ❌ No | N/A | N/A | N/A | N/A |
| **gemini-2.5-flash** | ✅ Yes | `models/gemini-2.5-flash` | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 |

---

## 2. Recommended Production Replacements for `src/lib/ai.ts`

Based on the verified list of active models:

1. **Primary Text Model:**
   - Instead of the unavailable `gemma-3-4b-it` (which returns 404), the recommended replacement is either a Gemma 4 model (like `gemma-4-31b-it` / `gemma-4-26b-a4b-it` if they exist in the API) or **`gemini-2.0-flash`** or **`gemini-2.5-flash`** (depending on existence/quota).
   - *Let's check if gemma-4 exists in the list:*
     `models/gemma-4-26b-a4b-it` (Supported methods: generateContent, countTokens)<br>`models/gemma-4-31b-it` (Supported methods: generateContent, countTokens)

2. **Fallback / Vision Model:**
   - Currently configured: `gemini-2.0-flash`
   - Check if `gemini-2.5-flash` is supported as a direct replacement to leverage the newer version:
     Yes, `gemini-2.5-flash` is available in the API.

---

## 3. All Available Models List

Total models retrieved: **54**

| Model Name (`name`) | Display Name (`displayName`) | Supported Methods | Input Token Limit | Output Token Limit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `models/gemini-2.5-flash` | Gemini 2.5 Flash | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Stable version of Gemini 2.5 Flash, our mid-size multimodal model that supports up to 1 million tokens, released in June of 2025. |
| `models/gemini-2.5-pro` | Gemini 2.5 Pro | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Stable release (June 17th, 2025) of Gemini 2.5 Pro |
| `models/gemini-2.0-flash` | Gemini 2.0 Flash | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 8192 | Gemini 2.0 Flash |
| `models/gemini-2.0-flash-001` | Gemini 2.0 Flash 001 | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 8192 | Stable version of Gemini 2.0 Flash, our fast and versatile multimodal model for scaling across diverse tasks, released in January of 2025. |
| `models/gemini-2.0-flash-lite-001` | Gemini 2.0 Flash-Lite 001 | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 8192 | Stable version of Gemini 2.0 Flash-Lite |
| `models/gemini-2.0-flash-lite` | Gemini 2.0 Flash-Lite | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 8192 | Gemini 2.0 Flash-Lite |
| `models/gemini-2.5-flash-preview-tts` | Gemini 2.5 Flash Preview TTS | countTokens, generateContent | 8192 | 16384 | Gemini 2.5 Flash Preview TTS |
| `models/gemini-2.5-pro-preview-tts` | Gemini 2.5 Pro Preview TTS | countTokens, generateContent, batchGenerateContent | 8192 | 16384 | Gemini 2.5 Pro Preview TTS |
| `models/gemma-4-26b-a4b-it` | Gemma 4 26B A4B IT | generateContent, countTokens | 262144 | 32768 | Gemma 4 26B A4B IT |
| `models/gemma-4-31b-it` | Gemma 4 31B IT | generateContent, countTokens | 262144 | 32768 | Gemma 4 31B IT |
| `models/gemini-flash-latest` | Gemini Flash Latest | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Latest release of Gemini Flash |
| `models/gemini-flash-lite-latest` | Gemini Flash-Lite Latest | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Latest release of Gemini Flash-Lite |
| `models/gemini-pro-latest` | Gemini Pro Latest | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Latest release of Gemini Pro |
| `models/gemini-2.5-flash-lite` | Gemini 2.5 Flash-Lite | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Stable version of Gemini 2.5 Flash-Lite, released in July of 2025 |
| `models/gemini-2.5-flash-image` | Nano Banana | generateContent, countTokens, batchGenerateContent | 32768 | 32768 | Gemini 2.5 Flash Preview Image |
| `models/gemini-3-pro-preview` | Gemini 3 Pro Preview | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Gemini 3 Pro Preview |
| `models/gemini-3-flash-preview` | Gemini 3 Flash Preview | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Gemini 3 Flash Preview |
| `models/gemini-3.1-pro-preview` | Gemini 3.1 Pro Preview | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Gemini 3.1 Pro Preview |
| `models/gemini-3.1-pro-preview-customtools` | Gemini 3.1 Pro Preview Custom Tools | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Gemini 3.1 Pro Preview optimized for custom tool usage |
| `models/gemini-3.1-flash-lite-preview` | Gemini 3.1 Flash Lite Preview | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Gemini 3.1 Flash Lite Preview |
| `models/gemini-3.1-flash-lite` | Gemini 3.1 Flash Lite | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Gemini 3.1 Flash Lite |
| `models/gemini-3-pro-image-preview` | Nano Banana Pro | generateContent, countTokens, batchGenerateContent | 131072 | 32768 | Gemini 3 Pro Image Preview |
| `models/gemini-3-pro-image` | Nano Banana Pro | generateContent, countTokens, batchGenerateContent | 131072 | 32768 | Gemini 3 Pro Image |
| `models/nano-banana-pro-preview` | Nano Banana Pro | generateContent, countTokens, batchGenerateContent | 131072 | 32768 | Gemini 3 Pro Image Preview |
| `models/gemini-3.1-flash-image-preview` | Nano Banana 2 | generateContent, countTokens, batchGenerateContent | 65536 | 65536 | Gemini 3.1 Flash Image Preview. |
| `models/gemini-3.1-flash-image` | Nano Banana 2 | generateContent, countTokens, batchGenerateContent | 65536 | 65536 | Gemini 3.1 Flash Image. |
| `models/gemini-3.5-flash` | Gemini 3.5 Flash | generateContent, countTokens, createCachedContent, batchGenerateContent | 1048576 | 65536 | Gemini 3.5 Flash |
| `models/lyria-3-clip-preview` | Lyria 3 Clip Preview | generateContent, countTokens | 1048576 | 65536 | Lyria 3 30s model Preview |
| `models/lyria-3-pro-preview` | Lyria 3 Pro Preview | generateContent, countTokens | 1048576 | 65536 | Lyria 3 Pro Preview |
| `models/gemini-3.1-flash-tts-preview` | Gemini 3.1 Flash TTS Preview | generateContent, countTokens, batchGenerateContent | 8192 | 16384 | Gemini 3.1 Flash TTS Preview |
| `models/gemini-robotics-er-1.5-preview` | Gemini Robotics-ER 1.5 Preview | generateContent, countTokens | 1048576 | 65536 | Gemini Robotics-ER 1.5 Preview |
| `models/gemini-robotics-er-1.6-preview` | Gemini Robotics-ER 1.6 Preview | generateContent, countTokens, createCachedContent, batchGenerateContent | 131072 | 65536 | Gemini Robotics-ER 1.6 Preview |
| `models/gemini-2.5-computer-use-preview-10-2025` | Gemini 2.5 Computer Use Preview 10-2025 | generateContent, countTokens | 131072 | 65536 | Gemini 2.5 Computer Use Preview 10-2025 |
| `models/antigravity-preview-05-2026` | Antigravity Agent Preview | generateContent, countTokens | 131072 | 65536 | Preview release of Antigravity Agent (05-2026) |
| `models/deep-research-max-preview-04-2026` | Deep Research Max Preview (Apr-21-2026) | generateContent, countTokens | 131072 | 65536 | Preview release (April 21st, 2026) of Deep Research Max |
| `models/deep-research-preview-04-2026` | Deep Research Preview (Apr-21-2026) | generateContent, countTokens | 131072 | 65536 | Preview release (April 21th, 2026) of Deep Research |
| `models/deep-research-pro-preview-12-2025` | Deep Research Pro Preview (Dec-12-2025) | generateContent, countTokens | 131072 | 65536 | Preview release (December 12th, 2025) of Deep Research Pro |
| `models/gemini-embedding-001` | Gemini Embedding 001 | embedContent, countTextTokens, countTokens, asyncBatchEmbedContent | 2048 | 1 | Obtain a distributed representation of a text. |
| `models/gemini-embedding-2-preview` | Gemini Embedding 2 Preview | embedContent, countTextTokens, countTokens, asyncBatchEmbedContent | 8192 | 1 | Obtain a distributed representation of multimodal content. |
| `models/gemini-embedding-2` | Gemini Embedding 2 | embedContent, countTextTokens, countTokens, asyncBatchEmbedContent | 8192 | 1 | Obtain a distributed representation of multimodal content. |
| `models/aqa` | Model that performs Attributed Question Answering. | generateAnswer | 7168 | 1024 | Model trained to return answers to questions that are grounded in provided sources, along with estimating answerable probability. |
| `models/imagen-4.0-generate-001` | Imagen 4 | predict | 480 | 8192 | Vertex served Imagen 4.0 model |
| `models/imagen-4.0-ultra-generate-001` | Imagen 4 Ultra | predict | 480 | 8192 | Vertex served Imagen 4.0 ultra model |
| `models/imagen-4.0-fast-generate-001` | Imagen 4 Fast | predict | 480 | 8192 | Vertex served Imagen 4.0 Fast model |
| `models/veo-2.0-generate-001` | Veo 2 | predictLongRunning | 480 | 8192 | Vertex served Veo 2 model. Access to this model requires billing to be enabled on the associated Google Cloud Platform account. Please visit https://console.cloud.google.com/billing to enable it. |
| `models/veo-3.0-generate-001` | Veo 3 | predictLongRunning | 480 | 8192 | Veo 3 |
| `models/veo-3.0-fast-generate-001` | Veo 3 fast | predictLongRunning | 480 | 8192 | Veo 3 fast |
| `models/veo-3.1-generate-preview` | Veo 3.1 | predictLongRunning | 480 | 8192 | Veo 3.1 |
| `models/veo-3.1-fast-generate-preview` | Veo 3.1 fast | predictLongRunning | 480 | 8192 | Veo 3.1 fast |
| `models/veo-3.1-lite-generate-preview` | Veo 3.1 lite | predictLongRunning | 480 | 8192 | Veo 3.1 lite |
| `models/gemini-2.5-flash-native-audio-latest` | Gemini 2.5 Flash Native Audio Latest | countTokens, bidiGenerateContent | 131072 | 8192 | Latest release of Gemini 2.5 Flash Native Audio |
| `models/gemini-2.5-flash-native-audio-preview-09-2025` | Gemini 2.5 Flash Native Audio Preview 09-2025 | countTokens, bidiGenerateContent | 131072 | 8192 | Gemini 2.5 Flash Native Audio Preview 09-2025 |
| `models/gemini-2.5-flash-native-audio-preview-12-2025` | Gemini 2.5 Flash Native Audio Preview 12-2025 | countTokens, bidiGenerateContent | 131072 | 8192 | Gemini 2.5 Flash Native Audio Preview 12-2025 |
| `models/gemini-3.1-flash-live-preview` | Gemini 3.1 Flash Live Preview | bidiGenerateContent | 131072 | 65536 | Gemini 3.1 Flash Live Preview |
