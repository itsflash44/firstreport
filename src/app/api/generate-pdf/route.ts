/**
 * POST /api/generate-pdf
 * ──────────────────────
 * Generates legal documents as PDF using Puppeteer (headless Chromium).
 *
 * Previous implementation: spawn('python', ['legal/cli_generate_docs.py'])
 * Problems:
 *   1. `python` binary does not exist on this system (only `python3`)
 *   2. `legal/cli_generate_docs.py` was never created
 *   3. Spawn error event was unhandled → Promise never resolved → HTTP 000 (infinite hang)
 *
 * This implementation:
 *   - Uses Puppeteer (already in package.json ^25.1.0) for HTML→PDF
 *   - Generates all 4 document types inline — no external process needed
 *   - Handles every failure mode with structured JSON errors
 *   - Enforces a 30-second timeout
 *   - Returns base64 PDFs + storage paths
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import {
  createDocumentRecord,
  createEscalationTimers,
  updateSessionStatus,
  type DocType,
} from '@/lib/db/sessions';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratePdfBody {
  transcript: string;
  lang_code?: string;
  sessionId?: string;
  classification?: {
    bnss_section?: string;
    severity?: string;
    offense_name_hindi?: string;
  };
  crime_input?: {
    victim_name?: string;
    incident_description?: string;
    station_name?: string;
    date?: string;
  };
}

interface DocResult {
  type: string;
  docType: DocType;
  title: string;
  titleHindi: string;
  html: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DOC_TYPE_MAP: Record<string, DocType> = {
  sp_complaint:      'SP_COMPLAINT',
  dm_petition:       'DM_PETITION',
  hc_writ:           'HC_WRIT',
  accountability_doc: 'OFFICER_ACCOUNTABILITY',
};

const TIMEOUT_MS = 30_000;

// Supabase client (service role only — never anon for server-side writes)
const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const _serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (_supabaseUrl && _serviceKey)
  ? createClient(_supabaseUrl, _serviceKey, { auth: { persistSession: false } })
  : null;

// ─────────────────────────────────────────────────────────────────────────────
// HTML Document Templates
// ─────────────────────────────────────────────────────────────────────────────

function buildDocumentHtml(
  title: string,
  titleHindi: string,
  body: string,
  meta: { victimName: string; date: string; bnssSection: string; stationName: string },
): string {
  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Times+New+Roman:wght@400;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', 'Noto Sans Devanagari', serif;
      font-size: 13pt;
      line-height: 1.8;
      color: #111;
      padding: 40px 60px;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 3px double #333;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header .emblem {
      font-size: 28pt;
      margin-bottom: 4px;
    }
    .header h1 {
      font-size: 16pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header h2 {
      font-size: 13pt;
      font-weight: 600;
      margin-top: 4px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 11pt;
    }
    .meta-table td {
      padding: 4px 8px;
      vertical-align: top;
    }
    .meta-table td:first-child {
      font-weight: 600;
      width: 160px;
      white-space: nowrap;
    }
    .section {
      margin: 20px 0;
    }
    .section-title {
      font-weight: 700;
      font-size: 12pt;
      text-decoration: underline;
      margin-bottom: 8px;
    }
    .section p {
      text-align: justify;
      margin-bottom: 8px;
    }
    .signature-block {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      text-align: center;
      width: 45%;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 40px;
      padding-top: 4px;
      font-size: 10pt;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 9pt;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 8px;
    }
    .stamp {
      display: inline-block;
      border: 2px solid #333;
      padding: 6px 16px;
      font-size: 10pt;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="emblem">⚖️</div>
    <h1>${title}</h1>
    <h2>${titleHindi}</h2>
  </div>

  <table class="meta-table">
    <tr><td>दिनांक / Date:</td><td>${meta.date}</td></tr>
    <tr><td>शिकायतकर्ता / Complainant:</td><td>${meta.victimName}</td></tr>
    <tr><td>थाना / Station:</td><td>${meta.stationName}</td></tr>
    <tr><td>BNSS धारा / Section:</td><td>${meta.bnssSection}</td></tr>
  </table>

  ${body}

  <div class="signature-block">
    <div class="signature-box">
      <div class="signature-line">शिकायतकर्ता का हस्ताक्षर<br/>Complainant's Signature</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">प्राप्तकर्ता का हस्ताक्षर<br/>Recipient's Signature & Stamp</div>
      <div class="stamp">Official Stamp / मुहर</div>
    </div>
  </div>

  <div class="footer">
    Generated by FirstReport | प्रथम रिपोर्ट | ${new Date().toISOString()}
  </div>
</body>
</html>`;
}

function generateDocuments(body: GeneratePdfBody): DocResult[] {
  const victimName    = body.crime_input?.victim_name        || 'Citizen / नागरिक';
  const incident      = body.crime_input?.incident_description || body.transcript || '';
  const stationName   = body.crime_input?.station_name       || 'Local Police Station';
  const date          = body.crime_input?.date               || new Date().toLocaleDateString('hi-IN');
  const bnssSection   = body.classification?.bnss_section    || '173';
  const offenseHindi  = body.classification?.offense_name_hindi || 'शिकायत';

  const meta = { victimName, date, bnssSection, stationName };

  const spBody = `
    <div class="section">
      <div class="section-title">विषय / Subject</div>
      <p>BNSS धारा ${bnssSection} के अंतर्गत प्रथम सूचना रिपोर्ट दर्ज करने हेतु आवेदन।<br/>
      Application for registration of First Information Report under BNSS Section ${bnssSection}.</p>
    </div>
    <div class="section">
      <div class="section-title">घटना विवरण / Incident Description</div>
      <p>${incident}</p>
    </div>
    <div class="section">
      <div class="section-title">अपराध का प्रकार / Nature of Offence</div>
      <p>${offenseHindi} — BNSS Section ${bnssSection}</p>
    </div>
    <div class="section">
      <div class="section-title">प्रार्थना / Prayer</div>
      <p>अतः श्रीमान जी से विनम्र प्रार्थना है कि उपरोक्त घटना की प्रथम सूचना रिपोर्ट दर्ज की जाए तथा उचित कार्यवाही की जाए।</p>
      <p>It is therefore humbly requested that the above incident be registered as an FIR and appropriate action be taken.</p>
    </div>`;

  const dmBody = `
    <div class="section">
      <div class="section-title">विषय / Subject</div>
      <p>पुलिस निष्क्रियता के विरुद्ध जिलाधिकारी के समक्ष याचिका।<br/>
      Petition before District Magistrate against police inaction.</p>
    </div>
    <div class="section">
      <div class="section-title">तथ्य / Facts</div>
      <p>${incident}</p>
      <p>उपरोक्त घटना के संबंध में स्थानीय पुलिस थाने में शिकायत दर्ज करने के प्रयास के बाद भी कोई कार्यवाही नहीं की गई।</p>
    </div>
    <div class="section">
      <div class="section-title">प्रार्थना / Prayer</div>
      <p>जिलाधिकारी महोदय से निवेदन है कि पुलिस को आवश्यक निर्देश देकर FIR दर्ज कराई जाए एवं न्याय सुनिश्चित किया जाए।</p>
    </div>`;

  const hcBody = `
    <div class="section">
      <div class="section-title">याचिका / Writ Petition</div>
      <p>माननीय उच्च न्यायालय के समक्ष अनुच्छेद 226 के अंतर्गत रिट याचिका।<br/>
      Writ Petition under Article 226 before the Hon'ble High Court.</p>
    </div>
    <div class="section">
      <div class="section-title">तथ्य / Facts</div>
      <p>${incident}</p>
    </div>
    <div class="section">
      <div class="section-title">आधार / Grounds</div>
      <p>1. पुलिस द्वारा FIR दर्ज न करना मौलिक अधिकारों का उल्लंघन है।<br/>
         2. BNSS धारा ${bnssSection} के तहत FIR दर्ज करना बाध्यकारी है।</p>
    </div>
    <div class="section">
      <div class="section-title">अनुतोष / Relief</div>
      <p>FIR तुरंत दर्ज करने हेतु पुलिस को परमादेश जारी किया जाए।</p>
    </div>`;

  const accBody = `
    <div class="section">
      <div class="section-title">विषय / Subject</div>
      <p>कर्तव्य विमुख पुलिस अधिकारी के विरुद्ध जवाबदेही दस्तावेज़।<br/>
      Officer Accountability Document against dereliction of duty.</p>
    </div>
    <div class="section">
      <div class="section-title">घटना / Incident</div>
      <p>${incident}</p>
    </div>
    <div class="section">
      <div class="section-title">उल्लंघन / Violations</div>
      <p>1. BNSS धारा ${bnssSection} के तहत FIR दर्ज करने से इनकार।<br/>
         2. पुलिस आचरण नियमावली का उल्लंघन।<br/>
         3. नागरिक के मौलिक अधिकारों का हनन।</p>
    </div>
    <div class="section">
      <div class="section-title">अपेक्षित कार्यवाही / Expected Action</div>
      <p>वरिष्ठ पुलिस अधिकारी / पुलिस महानिदेशक के समक्ष अनुशासनात्मक कार्यवाही हेतु प्रेषित।</p>
    </div>`;

  return [
    {
      type: 'sp_complaint',
      docType: 'SP_COMPLAINT',
      title: 'Complaint to Superintendent of Police',
      titleHindi: 'पुलिस अधीक्षक को शिकायत',
      html: buildDocumentHtml('Complaint to Superintendent of Police', 'पुलिस अधीक्षक को शिकायत', spBody, meta),
    },
    {
      type: 'dm_petition',
      docType: 'DM_PETITION',
      title: 'Petition to District Magistrate',
      titleHindi: 'जिलाधिकारी को याचिका',
      html: buildDocumentHtml('Petition to District Magistrate', 'जिलाधिकारी को याचिका', dmBody, meta),
    },
    {
      type: 'hc_writ',
      docType: 'HC_WRIT',
      title: 'High Court Writ Petition',
      titleHindi: 'उच्च न्यायालय रिट याचिका',
      html: buildDocumentHtml('High Court Writ Petition', 'उच्च न्यायालय रिट याचिका', hcBody, meta),
    },
    {
      type: 'accountability_doc',
      docType: 'OFFICER_ACCOUNTABILITY',
      title: 'Officer Accountability Document',
      titleHindi: 'अधिकारी जवाबदेही दस्तावेज़',
      html: buildDocumentHtml('Officer Accountability Document', 'अधिकारी जवाबदेही दस्तावेज़', accBody, meta),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Generation via Puppeteer
// ─────────────────────────────────────────────────────────────────────────────

async function generatePdfFromHtml(html: string): Promise<Buffer> {
  // Dynamic import so the module is only loaded server-side
  const puppeteer = await import('puppeteer');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Set content and wait for fonts/layout to settle
    // 'load' is the safe waitUntil value accepted by the current Puppeteer type declarations.
    // For document generation we don't need external resources, so 'load' is sufficient.
    await page.setContent(html, { waitUntil: 'load', timeout: 20_000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startMs = Date.now();

  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: GeneratePdfBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body', code: 'INVALID_BODY' },
      { status: 400 },
    );
  }

  if (!body.transcript && !body.crime_input?.incident_description) {
    return NextResponse.json(
      { success: false, error: 'Missing required field: transcript or crime_input.incident_description', code: 'MISSING_FIELD' },
      { status: 400 },
    );
  }

  // ── 2. Generate all documents with timeout ─────────────────────────────────
  let results: Array<{ type: string; docType: DocType; storagePath: string; b64: string; sizeBytes: number }> = [];

  try {
    const docs = generateDocuments(body);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'firstReport-pdf-'));

    await Promise.race([
      // Main work
      (async () => {
        for (const doc of docs) {
          const pdfBuffer = await generatePdfFromHtml(doc.html);
          const filePath   = path.join(tmpDir, `${doc.type}.pdf`);
          await fs.writeFile(filePath, pdfBuffer);

          results.push({
            type:        doc.type,
            docType:     doc.docType,
            storagePath: `documents/${body.sessionId || 'session'}/${doc.type}.pdf`,
            b64:         pdfBuffer.toString('base64'),
            sizeBytes:   pdfBuffer.length,
          });
        }
      })(),
      // Timeout guard
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`PDF generation timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS),
      ),
    ]);
  } catch (err: any) {
    const message: string = err?.message || 'Unknown PDF generation error';
    console.error('[generate-pdf] Generation failed:', message);

    // Classify error type for caller
    const code =
      message.includes('timed out') ? 'TIMEOUT' :
      message.includes('ENOENT')    ? 'EXECUTABLE_NOT_FOUND' :
      message.includes('spawn')     ? 'SPAWN_ERROR' :
      'GENERATION_FAILED';

    return NextResponse.json(
      { success: false, error: message, code },
      { status: 503 },
    );
  }

  const latencyMs = Date.now() - startMs;

  // ── 3. Persist to Supabase (optional — skipped if not configured) ──────────
  const sessionId: string = body.sessionId || '';
  const docIds: Record<string, string> = {};
  const paths:  Record<string, string> = {};

  if (sessionId) {
    for (const r of results) {
      paths[r.type] = r.storagePath;

      // Upload to Supabase Storage
      if (supabase) {
        const buf = Buffer.from(r.b64, 'base64');
        await supabase.storage
          .from('documents')
          .upload(r.storagePath, buf, { contentType: 'application/pdf', upsert: true });
      }

      // DB record
      const docId = await createDocumentRecord(sessionId, r.docType, r.storagePath);
      if (docId) docIds[r.type] = docId;
    }

    await createEscalationTimers(sessionId);
    await updateSessionStatus(sessionId, 'DOCUMENTS_READY');
  }

  // ── 4. Return response ─────────────────────────────────────────────────────
  return NextResponse.json({
    success:    true,
    sessionId:  sessionId || null,
    latencyMs,
    docCount:   results.length,
    docIds,
    paths,
    // base64 PDFs for direct download without storage dependency
    b64_docs:   Object.fromEntries(results.map(r => [r.type, r.b64])),
    sizes:      Object.fromEntries(results.map(r => [r.type, r.sizeBytes])),
  });
}
