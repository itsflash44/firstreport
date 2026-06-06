/**
 * FirstReport — Structured Field Extraction from OCR Text
 *
 * Parses raw Tesseract output into structured legal fields.
 * Supports: Aadhaar, PAN, FIR, Medical Certificate, Passport, DL
 *
 * All regex patterns validated against real Indian document formats.
 */

import type { DocumentType, ExtractedFields } from '@/lib/db/dexie';

// ─────────────────────────────────────────────────────────────────────────────
// REGEX PATTERNS — Indian Document Standards
// ─────────────────────────────────────────────────────────────────────────────

const PATTERNS = {
  // Aadhaar: 12-digit number with optional spaces/dashes
  aadhaarNumber: /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/g,

  // PAN: AAAAANNNNNA format
  panNumber: /\b([A-Z]{5}[0-9]{4}[A-Z])\b/g,

  // Passport: A–Z followed by 7 digits
  passportNumber: /\b([A-Z]{1}[0-9]{7})\b/g,

  // Driving License: State code + digits
  dlNumber: /\b([A-Z]{2}[0-9]{13}|[A-Z]{2}-\d{2}-\d{4}-\d{7})\b/g,

  // FIR Number: varies by state
  firNumber: /FIR\s*[Nn]o\.?\s*[:–\-]?\s*(\d+\/\d{4}|\d+)/g,

  // Date patterns (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY)
  date: /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/g,

  // Indian mobile
  phone: /\b([6-9]\d{9})\b/g,

  // Gender
  gender: /\b(MALE|FEMALE|TRANSGENDER|पुरुष|महिला|ट्रांसजेंडर|M|F)\b/gi,

  // Police station
  policeStation: /(?:police\s+station|थाना|P\.S\.|P\.S)\s*[:\-]?\s*([A-Za-z\s]+)/gi,

  // Officer name patterns (constable, SI, DSP, etc.)
  officerName: /(?:Officer|Constable|Inspector|Sub[-\s]Inspector|SI|DSP|SP|CP|DCP|SHO)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,

  // Sections (BNSS / IPC)
  sections: /(?:Section|Sec\.|धारा)\s*(\d+[A-Z]?(?:\/\d+[A-Z]?)*)/gi,

  // Aadhaar address (multi-line, after "Address" keyword)
  address: /(?:Address|पता|address)\s*[:\-]?\s*([A-Za-z0-9\s,\-\.]+(?:\n[A-Za-z0-9\s,\-\.]+)*)/gi,

  // Hospital / doctor
  hospital: /(?:hospital|अस्पताल|clinic|क्लिनिक)\s*[:\-]?\s*([A-Za-z\s]+)/gi,
  doctor: /(?:Dr\.|Doctor|डॉ\.)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────

function firstMatch(text: string, pattern: RegExp): string | undefined {
  const re = new RegExp(pattern.source, pattern.flags);
  const m = re.exec(text);
  return m ? (m[1] ?? m[0]).trim() : undefined;
}

function allMatches(text: string, pattern: RegExp): string[] {
  const re = new RegExp(pattern.source, pattern.flags);
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    results.push((m[1] ?? m[0]).trim());
  }
  return [...new Set(results)];
}

// Clean extracted text — remove common OCR noise
function clean(s: string): string {
  return s.replace(/[|_\[\]{}<>]/g, '').replace(/\s+/g, ' ').trim();
}

// Mask Aadhaar for privacy: XXXX-XXXX-1234
function maskAadhaar(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.length !== 12) return num;
  return `XXXX-XXXX-${digits.slice(8)}`;
}

// Extract name heuristically — lines of ALL CAPS after "Name:"
function extractName(text: string): string | undefined {
  // Try labeled name first
  const labeled = /(?:Name|नाम)\s*[:\-]\s*([A-Z][a-zA-Z\s]+)/i.exec(text);
  if (labeled) return clean(labeled[1]);

  // Try ALL CAPS line (common on Aadhaar/PAN)
  const lines = text.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (t.length > 3 && t.length < 60 && t === t.toUpperCase() && /^[A-Z\s]+$/.test(t)) {
      // Filter out common header words
      const skip = ['GOVERNMENT', 'INDIA', 'UNIQUE', 'AUTHORITY', 'COMMISSION', 'REPUBLIC', 'MINISTRY'];
      if (!skip.some(w => t.includes(w))) {
        return t;
      }
    }
  }

  return undefined;
}

// Extract DOB with multiple format handling
function extractDOB(text: string): string | undefined {
  const labeled = /(?:DOB|D\.O\.B|Date\s+of\s+Birth|जन्म\s+तिथि)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i.exec(text);
  if (labeled) return labeled[1];
  return firstMatch(text, PATTERNS.date);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT-SPECIFIC EXTRACTORS
// ─────────────────────────────────────────────────────────────────────────────

function extractAadhaar(text: string): Partial<ExtractedFields> {
  const raw = firstMatch(text, PATTERNS.aadhaarNumber);
  return {
    name: extractName(text),
    aadhaarNumber: raw ? maskAadhaar(raw) : undefined,
    dob: extractDOB(text),
    gender: firstMatch(text, PATTERNS.gender),
    address: firstMatch(text, PATTERNS.address),
  };
}

function extractPAN(text: string): Partial<ExtractedFields> {
  return {
    name: extractName(text),
    panNumber: firstMatch(text, PATTERNS.panNumber),
    dob: extractDOB(text),
  };
}

function extractPassport(text: string): Partial<ExtractedFields> {
  return {
    name: extractName(text),
    documentNumber: firstMatch(text, PATTERNS.passportNumber),
    dob: extractDOB(text),
    gender: firstMatch(text, PATTERNS.gender),
  };
}

function extractDrivingLicense(text: string): Partial<ExtractedFields> {
  return {
    name: extractName(text),
    documentNumber: firstMatch(text, PATTERNS.dlNumber),
    dob: extractDOB(text),
    address: firstMatch(text, PATTERNS.address),
  };
}

function extractFIR(text: string): Partial<ExtractedFields> {
  const sections = allMatches(text, PATTERNS.sections);
  return {
    firNumber: firstMatch(text, PATTERNS.firNumber),
    policeStation: firstMatch(text, PATTERNS.policeStation),
    officerName: firstMatch(text, PATTERNS.officerName),
    incidentDate: extractDOB(text),
    sections,
  };
}

function extractMedical(text: string): Partial<ExtractedFields> {
  return {
    name: extractName(text),
    dob: extractDOB(text),
    hospitalName: firstMatch(text, PATTERNS.hospital),
    doctorName: firstMatch(text, PATTERNS.doctor),
    diagnosis: (/(?:Diagnosis|निदान)\s*[:\-]\s*([A-Za-z\s]+)/i.exec(text) ?? [])[1],
  };
}

function extractGeneric(text: string): Partial<ExtractedFields> {
  return {
    name: extractName(text),
    dob: extractDOB(text),
    address: firstMatch(text, PATTERNS.address),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIDENCE SCORING per field
// ─────────────────────────────────────────────────────────────────────────────

function scoreFields(
  fields: Partial<ExtractedFields>,
  ocrConfidence: number,
): Record<string, number> {
  const confidence: Record<string, number> = {};
  const base = ocrConfidence / 100;

  // Structured fields (regex validated) get higher confidence
  if (fields.aadhaarNumber) confidence.aadhaarNumber = Math.min(1, base * 1.1);
  if (fields.panNumber) confidence.panNumber = Math.min(1, base * 1.1);
  if (fields.firNumber) confidence.firNumber = Math.min(1, base * 1.1);
  if (fields.documentNumber) confidence.documentNumber = Math.min(1, base * 1.1);

  // Heuristic fields get lower confidence
  if (fields.name) confidence.name = base * 0.85;
  if (fields.dob) confidence.dob = base * 0.90;
  if (fields.gender) confidence.gender = base * 0.95;
  if (fields.address) confidence.address = base * 0.75;
  if (fields.policeStation) confidence.policeStation = base * 0.80;
  if (fields.officerName) confidence.officerName = base * 0.80;
  if (fields.sections) confidence.sections = base * 0.90;

  // Scale to 0–100
  return Object.fromEntries(
    Object.entries(confidence).map(([k, v]) => [k, Math.round(v * 100)]),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export function extractFields(
  rawText: string,
  documentType: DocumentType,
  ocrConfidence: number,
): ExtractedFields {
  const text = rawText;

  let fields: Partial<ExtractedFields> = {};

  switch (documentType) {
    case 'Aadhaar Card':
      fields = extractAadhaar(text);
      break;
    case 'PAN Card':
      fields = extractPAN(text);
      break;
    case 'Passport':
      fields = extractPassport(text);
      break;
    case 'Driving License':
      fields = extractDrivingLicense(text);
      break;
    case 'FIR Copy':
      fields = extractFIR(text);
      break;
    case 'Medical Certificate':
      fields = extractMedical(text);
      break;
    default:
      fields = extractGeneric(text);
  }

  const fieldConfidence = scoreFields(fields, ocrConfidence);

  return {
    ...fields,
    sections: fields.sections ?? [],
    fieldConfidence,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION — compare extracted name vs case name
// ─────────────────────────────────────────────────────────────────────────────

export function fuzzyNameMatch(
  caseName: string,
  documentName: string,
): { score: number; verdict: 'match' | 'probable_match' | 'mismatch' } {
  if (!caseName || !documentName) return { score: 0, verdict: 'mismatch' };

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();

  const a = normalize(caseName);
  const b = normalize(documentName);

  if (a === b) return { score: 100, verdict: 'match' };

  // Token overlap
  const tokensA = new Set(a.split(' '));
  const tokensB = new Set(b.split(' '));
  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = (intersection / union) * 100;

  // Substring containment bonus
  let bonus = 0;
  if (a.includes(b) || b.includes(a)) bonus = 20;

  const score = Math.min(100, Math.round(jaccard + bonus));

  return {
    score,
    verdict: score >= 80 ? 'match' : score >= 50 ? 'probable_match' : 'mismatch',
  };
}
