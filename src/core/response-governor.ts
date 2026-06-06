import type { LangCode } from '../lib/i18n';
import type { CaseConversation, ChatTurn } from '../lib/legalJourney';
const MAX_RESPONSE_CHARS = 200;
const MIN_RESPONSE_CHARS = 8;

const COT_PREFIXES_EN = [
  'based on', 'let me', 'looking at', 'i think', 'i can see',
  'i notice', 'i need to', 'analyzing', 'the transcript',
  'the victim', 'from the', 'it seems', 'it appears',
  'upon review', 'after reading', 'considering', 'here\'s',
  'sure,', 'of course', 'certainly', 'okay,', 'alright,',
  'so,', 'well,', 'now,', 'first,', 'step 1',
];

const COT_PREFIXES_HI = [
  'मैं देख', 'मुझे लगता', 'इसके आधार पर', 'विश्लेषण',
  'ट्रांसक्रिप्ट', 'पीड़ित', 'यहाँ', 'ठीक है,',
  'चलिए', 'पहले,', 'देखिए,',
];

const MARKDOWN_PATTERNS = [
  /\*\*[^*]+\*\*/g,
  /```[\s\S]*?```/g,
  /^#{1,6}\s.*/gm,
  /^[-*]\s/gm,
  /^\d+\.\s/gm,
  /\[([^\]]+)\]\([^)]+\)/g,
];

const LEGAL_OVERCONFIDENCE = [
  /guaranteed/i, /definitely/i,
  /100\s*%/i, /100\s*%\s*justice/i, /certain/i, /assured(\s+outcome)?/i,
  /निश्चित रूप से मिलेगा/i, /गारंटी/i, /पक्का/i,
];

export interface GovernorResult {
  text: string;
  wasModified: boolean;
  flags: GovernorFlag[];
}

export type GovernorFlag =
  | 'cot_stripped'
  | 'truncated'
  | 'markdown_cleaned'
  | 'repetition_detected'
  | 'overconfidence_softened'
  | 'ocr_noise_cleaned'
  | 'empty_after_clean';

export function governResponse(
  raw: string,
  language: LangCode,
  previousTurns: ChatTurn[] = [],
): GovernorResult {
  const flags: GovernorFlag[] = [];
  let text = raw;

  // 1. Strip chain-of-thought
  text = stripCoT(text, language, flags);

  // 2. Clean markdown artifacts
  text = cleanMarkdown(text, flags);

  // 3. Clean OCR noise
  text = cleanOcrNoise(text, flags);

  // 4. Detect and soften legal overconfidence
  text = softenOverconfidence(text, language, flags);

  // 5. Detect repetition against previous turns
  text = preventRepetition(text, previousTurns, flags);

  // 6. Enforce length limits
  text = enforceLength(text, flags);

  // 7. Final cleanup
  text = text.replace(/\s{2,}/g, ' ').trim();

  if (text.length < MIN_RESPONSE_CHARS) {
    flags.push('empty_after_clean');
    return { text: '', wasModified: true, flags };
  }

  return {
    text,
    wasModified: text !== raw.trim(),
    flags,
  };
}

function stripCoT(text: string, language: LangCode, flags: GovernorFlag[]): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  if (lines.length > 1) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].endsWith('?') || lines[i].endsWith('？') || lines[i].endsWith('।')) {
        if (i > 0) {
          flags.push('cot_stripped');
          return lines[i];
        }
        break;
      }
    }
    flags.push('cot_stripped');
    return lines[lines.length - 1];
  }

  const lower = text.toLowerCase();
  const prefixes = language.startsWith('hi') ? [...COT_PREFIXES_EN, ...COT_PREFIXES_HI] : COT_PREFIXES_EN;

  for (const prefix of prefixes) {
    if (lower.startsWith(prefix)) {
      const colonIdx = text.indexOf(':');
      if (colonIdx > 0 && colonIdx < 80) {
        const after = text.slice(colonIdx + 1).trim();
        if (after.length > MIN_RESPONSE_CHARS) {
          flags.push('cot_stripped');
          return after;
        }
      }

      const qIdx = text.lastIndexOf('?');
      const qIdxHi = text.lastIndexOf('？');
      const lastQ = Math.max(qIdx, qIdxHi);
      if (lastQ > 0) {
        const sentences = text.slice(0, lastQ + 1).split(/[.।]/);
        if (sentences.length > 1) {
          flags.push('cot_stripped');
          const last = sentences[sentences.length - 1].trim();
          return last.endsWith('?') || last.endsWith('？') ? last : last + '?';
        }
      }
      break;
    }
  }

  return text;
}

function cleanMarkdown(text: string, flags: GovernorFlag[]): string {
  let cleaned = text;
  for (const pattern of MARKDOWN_PATTERNS) {
    const before = cleaned;
    if (pattern.source.includes('\\*\\*')) {
      cleaned = cleaned.replace(pattern, (m) => m.replace(/\*\*/g, ''));
    } else if (pattern.source.includes('\\[')) {
      cleaned = cleaned.replace(pattern, '$1');
    } else {
      cleaned = cleaned.replace(pattern, '');
    }
    if (cleaned !== before && !flags.includes('markdown_cleaned')) {
      flags.push('markdown_cleaned');
    }
  }
  return cleaned.trim();
}

function cleanOcrNoise(text: string, flags: GovernorFlag[]): string {
  const noiseRatio = (text.match(/[^\w\sऀ-ॿঀ-৿਀-੿଀-୿ఀ-౿ഀ-ൿ઀-૿஀-௿.,?!:;'"()।?\-]/g) || []).length / Math.max(text.length, 1);

  if (noiseRatio > 0.3) {
    flags.push('ocr_noise_cleaned');
    const cleaned = text.replace(/[^\w\sऀ-ॿঀ-৿਀-੿଀-୿ఀ-౿ഀ-ൿ઀-૿஀-௿.,?!:;'"()।?\-]/g, '').trim();
    return cleaned || text;
  }

  const junkLines = text.split('\n').filter((l) => {
    const trimmed = l.trim();
    return trimmed.length > 0 && trimmed.length < 3 && !/^\d+$/.test(trimmed);
  });
  if (junkLines.length > 3) {
    flags.push('ocr_noise_cleaned');
    return text.split('\n').filter((l) => l.trim().length >= 3 || /^\d+$/.test(l.trim())).join('\n').trim();
  }

  return text;
}

function softenOverconfidence(text: string, language: LangCode, flags: GovernorFlag[]): string {
  let modified = text;

  for (const pattern of LEGAL_OVERCONFIDENCE) {
    if (pattern.test(modified)) {
      flags.push('overconfidence_softened');

      if (language.startsWith('hi')) {
        modified = modified
          .replace(/गारंटी/g, 'संभावना')
          .replace(/पक्का/g, 'संभव')
          .replace(/निश्चित रूप से मिलेगा/g, 'मिल सकता है');
      } else {
        modified = modified
          .replace(/guaranteed/gi, 'likely')
          .replace(/definitely\s+will/gi, 'may')
          .replace(/100\s*%/g, 'high confidence')
          .replace(/certain\s+to/gi, 'likely to')
          .replace(/assured/gi, 'expected');
      }
      break;
    }
  }

  return modified;
}

function preventRepetition(text: string, history: ChatTurn[], flags: GovernorFlag[]): string {
  if (history.length === 0) return text;

  const aiTurns = history.filter((t) => t.role === 'ai');
  const lastThree = aiTurns.slice(-3);
  const textNorm = normalizeForComparison(text);

  for (const prev of lastThree) {
    const content = prev.text || (prev as any).content || '';
    const prevNorm = normalizeForComparison(content);
    if (similarity(textNorm, prevNorm) > 0.7) {
      flags.push('repetition_detected');
      return '';
    }
  }

  return text;
}

function enforceLength(text: string, flags: GovernorFlag[]): string {
  if (!text || text.length <= MAX_RESPONSE_CHARS) return text;

  flags.push('truncated');

  const sentenceEnd = /[.?!।？]/g;
  let lastEnd = -1;
  let match: RegExpExecArray | null;

  while ((match = sentenceEnd.exec(text)) !== null) {
    if (match.index <= MAX_RESPONSE_CHARS) {
      lastEnd = match.index;
    } else {
      break;
    }
  }

  if (lastEnd > MIN_RESPONSE_CHARS) {
    return text.slice(0, lastEnd + 1);
  }

  const spaceIdx = text.lastIndexOf(' ', MAX_RESPONSE_CHARS);
  if (spaceIdx > MIN_RESPONSE_CHARS) {
    return text.slice(0, spaceIdx) + '…';
  }

  return text.slice(0, MAX_RESPONSE_CHARS) + '…';
}

function normalizeForComparison(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\sऀ-ॿ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const wordsA = new Set(a.split(' '));
  const wordsB = new Set(b.split(' '));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;

  return union === 0 ? 0 : intersection / union;
}

export function cleanOcrText(raw: string): string {
  if (!raw || raw.trim().length === 0) return '';

  let text = raw;

  text = text.replace(/[^\w\sऀ-ॿঀ-৿਀-੿଀-୿ఀ-౿ഀ-ൿ઀-૿஀-௿.,?!:;'"()\-।\n/]/g, '');

  text = text
    .split('\n')
    .filter((l) => l.trim().length >= 2 || /^\d+$/.test(l.trim()))
    .join('\n');

  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

export function inferLegalSeverity(response: string, history: ChatTurn[]): 'critical' | 'high' | 'medium' | 'low' {
  return 'low';
}

export function governClassificationText(
  text: string,
  confidence: 'high' | 'medium' | 'low',
  language: LangCode,
): string {
  let governed = text;

  if (confidence === 'low') {
    if (language.startsWith('hi')) {
      if (!governed.includes('संभावित') && !governed.includes('अनुमानित')) {
        governed = 'संभावित वर्गीकरण: ' + governed;
      }
    } else {
      if (!governed.includes('possible') && !governed.includes('approximate')) {
        governed = 'Possible classification: ' + governed;
      }
    }
  }

  for (const pattern of LEGAL_OVERCONFIDENCE) {
    if (pattern.test(governed)) {
      if (language.startsWith('hi')) {
        governed = governed.replace(/गारंटी/g, 'संभावना').replace(/पक्का/g, 'संभव');
      } else {
        governed = governed.replace(/guaranteed/gi, 'likely').replace(/100\s*%/g, 'high confidence');
      }
    }
  }

  return governed;
}
