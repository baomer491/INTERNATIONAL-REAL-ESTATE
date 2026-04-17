import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseJSONResponse } from '@/lib/gemini-client';

const OWNERSHIP_EXTRACTION_PROMPT = `أنت خبير في استخراج بيانات صكوك الملكية العمانية.

استخرج البيانات التالية من صك الملكية وأعدها كـ JSON فقط:

{
  "documentType": "ownership",
  "deedNumber": "رقم الصك",
  "deedDate": "تاريخ إصدار الصك",
  "owner": {
    "name": "اسم المالك الكامل",
    "idNumber": "رقم البطاقة الشخصية",
    "idType": "نوع الهوية"
  },
  "property": {
    "type": "نوع العقار (أرض/فيلا/شقة/مبنى)",
    "usage": "نوع الاستخدام (سكني/تجاري/صناعي/زراعي/استثماري)",
    "location": {
      "governorate": "المحافظة",
      "wilayat": "الولاية",
      "village": "القرية أو الحي",
      "blockNumber": "رقم القطاع/البلوك",
      "plotNumber": "رقم القطعة",
      "street": "الشارع أو الطريق"
    },
    "area": {
      "value": "المساحة كرقم",
      "unit": "وحدة المساحة (متر مربع/فدان)"
    },
    "boundaries": {
      "north": "الحد الشمالي",
      "south": "الحد الجنوبي",
      "east": "الحد الشرقي",
      "west": "الحد الغربي"
    },
    "frontage": "طول الواجهة بالمتر"
  },
  "restrictions": ["القيود على الملكية إن وجدت"],
  "notes": "ملاحظات إضافية من الصك",
  "confidence": 0.9
}

قواعد:
- إذا لم تجد قيمة، اتركها كـ "" (نص فارغ)
- الأرقام بدون فواصل أو مسافات
- confidence هو مستوى ثقتك من 0 إلى 1
- أجب بالعربية فقط`;

const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Auth check: verify session cookie
    const sessionToken = request.cookies.get('ireo_session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Payload size limit
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Payload too large. Maximum size is 10MB.' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const { images = [] } = body;

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided. Please provide an images array.' },
        { status: 400 }
      );
    }

    const response = await callGemini({
      images,
      prompt: OWNERSHIP_EXTRACTION_PROMPT,
    });
    const content = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    const ownership = parseJSONResponse(content || '');

    return NextResponse.json({
      success: !!ownership,
      documentType: 'ownership',
      data: ownership,
      usage: response?.usageMetadata || null,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Ownership Extract API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to extract ownership data',
        documentType: 'ownership',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
