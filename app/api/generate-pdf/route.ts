import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import {
  createDocumentRecord,
  createEscalationTimers,
  updateSessionStatus,
  type DocType,
} from '@/lib/db/sessions';
import { createClient } from '@supabase/supabase-js';

const DOC_TYPE_MAP: Record<string, DocType> = {
  sp_complaint:      'SP_COMPLAINT',
  dm_petition:       'DM_PETITION',
  hc_writ:           'HC_WRIT',
  accountability_doc: 'OFFICER_ACCOUNTABILITY',
};

// SECURITY: Only use SERVICE_ROLE_KEY — never anon key for server-side writes.
// If not configured, Supabase storage is skipped (offline-only mode).
const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const _serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (_supabaseUrl && _serviceKey)
  ? createClient(_supabaseUrl, _serviceKey, { auth: { persistSession: false } })
  : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Spawn Python CLI
    const scriptPath = path.join(process.cwd(), 'legal', 'cli_generate_docs.py');
    
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn('python', [scriptPath]);
      let out = '';
      let err = '';
      
      child.stdout.on('data', (chunk) => out += chunk.toString());
      child.stderr.on('data', (chunk) => err += chunk.toString());
      
      child.on('close', (code) => {
        if (code !== 0) reject(new Error(`Python process exited with code ${code}. Stderr: ${err}`));
        else resolve(out);
      });
      
      child.stdin.write(JSON.stringify(body));
      child.stdin.end();
    });
    
    const data = JSON.parse(stdout);
    if (!data.success) {
      throw new Error(data.error);
    }

    const sessionId: string = body.sessionId || data.session_id || '';
    if (sessionId && data.b64_docs) {
      const docIds: Record<string, string> = {};
      
      for (const [key, docType] of Object.entries(DOC_TYPE_MAP)) {
        if (data.b64_docs[key]) {
          const buffer = Buffer.from(data.b64_docs[key], 'base64');
          const storagePath = `documents/${sessionId}/${key}.pdf`;
          
          // Upload to Supabase Storage (skip if not configured)
          if (supabase) {
            await supabase.storage
              .from('documents')
              .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true });
          }
          
          // Create DB record
          const docId = await createDocumentRecord(sessionId, docType, storagePath);
          if (docId) docIds[key] = docId;
        }
      }
      
      await createEscalationTimers(sessionId);
      await updateSessionStatus(sessionId, 'DOCUMENTS_READY');

      return NextResponse.json({ success: true, sessionId, docIds });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'PDF generation failed' },
      { status: 503 },
    );
  }
}
