import { NextRequest, NextResponse } from 'next/server';
import { saveClassification } from '@/lib/db/sessions';

const SCHEDULE_CONTEXT = `1. Theft/चोरी: Section 303 (Cognizable, 3 years)
2. Snatching/छीनाझपटी: Section 304 (Cognizable, 3 years)
3. Robbery/लूट: Section 309 (Cognizable, 10 years)
4. Grievous Hurt/गंभीर चोट: Section 117 (Cognizable, 7 years)
5. Outraging Modesty/छेड़छाड़: Section 74 (Cognizable, 1-5 years)
6. Rape/बलात्कार: Section 63 (Cognizable, 10 years to Life)
7. Criminal Intimidation/धमकी: Section 351 (Non-Cognizable usually, Cognizable if death threat)
8. Cheating/धोखाधड़ी: Section 318 (Cognizable, 3-7 years)
9. Dowry Death/दहेज मृत्यु: Section 80 (Cognizable, 7 years to Life)
10. Acid Attack/तेजाब हमला: Section 124 (Cognizable, 10 years to Life)`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incident = body.summary || body.transcript || '';
    const lang = body.language || 'hi-IN';

    const prompt = `आप एक भारतीय कानूनी विशेषज्ञ हैं। भारतीय नागरिक सुरक्षा संहिता 2023 (BNSS) के आधार पर वर्गीकरण करें।

नोट: CrPC अब लागू नहीं है। केवल BNSS धाराओं का उपयोग करें।
यह कानूनी सलाह नहीं है। यह एक ड्राफ्ट दस्तावेज़ है। जमा करने से पहले NALSA हेल्पलाइन 15100 से संपर्क करें।

BNSS अनुसूची 1 से प्रमुख संज्ञेय अपराध:
${SCHEDULE_CONTEXT}

घटना का विवरण: ${incident}

कृपया JSON में उत्तर दें:
{
    "bnss_section": "धारा संख्या",
    "offense_name_hindi": "अपराध का नाम हिंदी में",
    "is_cognizable": true,
    "confidence": "high",
    "rationale_hindi": "एक वाक्य में कारण हिंदी में",
    "punishment": "सज़ा का विवरण"
}

अगर एक से ज़्यादा अपराध हों तो:
{
    "multiple_sections": ["धारा 1", "धारा 2"]
}

अगर आप सुनिश्चित नहीं हैं तो confidence "low" रखें। JSON के बाहर कुछ न लिखें।`;

    const { generateContent } = await import('@/lib/ai');
    const aiResult = await generateContent(prompt);
    let jsonStr = aiResult.text;
    
    // Clean markdown
    if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0];
    else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].split('```')[0];
    
    const classification = JSON.parse(jsonStr.trim());

    const sessionId: string = body.sessionId || '';
    if (sessionId) {
      await saveClassification(sessionId, {
        bnssSection:      classification.bnss_section ?? '',
        offenseName:      '',
        offenseNameHindi: classification.offense_name_hindi ?? '',
        isCognizable:     classification.is_cognizable ?? false,
        confidence:       mapConfidence(classification.confidence),
        rationaleHindi:   classification.rationale_hindi ?? '',
        punishment:       classification.punishment ?? null,
        multipleSections: classification.multiple_sections ?? [],
      });
    }

    return NextResponse.json({
      success: true,
      classification,
      sessionId,
      model: aiResult.model,
    });
  } catch (error) {
    console.error('Classification failed:', error);
    return NextResponse.json({ success: false, error: 'Classification failed' }, { status: 503 });
  }
}

function mapConfidence(raw: string | undefined): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (!raw) return 'MEDIUM';
  const up = raw.toUpperCase();
  if (up === 'HIGH') return 'HIGH';
  if (up === 'LOW') return 'LOW';
  return 'MEDIUM';
}
