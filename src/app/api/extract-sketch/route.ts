import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseJSONResponse } from '@/lib/gemini-client';

const SKETCH_EXTRACTION_PROMPT = `أنت خبير في استخراج البيانات من الكروكي والرسومات الهندسية العقارية العمانية.

استخرج البيانات التالية من الكروكي وأعدها كـ JSON فقط:

{
  "documentType": "sketch",
  "drawingNumber": "رقم المسح أو الرسم",
  "drawingDate": "تاريخ الرسم إن وُجد",
  "property": {
    "location": {
      "governorate": "المحافظة",
      "wilayat": "الولاية",
      "blockNumber": "رقم القطاع/البلوك",
      "plotNumber": "رقم القطعة"
    },
    "area": {
      "totalArea": "المساحة الإجمالية",
      "buildingArea": "مساحة البناء",
      "openArea": "المساحة المفتوحة",
      "unit": "وحدة المساحة"
    },
    "dimensions": {
      "width": "العرض",
      "depth": "العمق",
      "frontage": "طول الواجهة",
      "unit": "وحدة القياس"
    },
    "boundaries": {
      "north": "الحد الشمالي مع القياسات",
      "south": "الحد الجنوبي مع القياسات",
      "east": "الحد الشرقي مع القياسات",
      "west": "الحد الغربي مع القياسات"
    },
    "orientation": {
      "northArrow": "اتجاه الشمال على الرسم",
      "rotation": "زاوية الدوران إن وُجدت"
    },
    "buildings": [
      {
        "type": "نوع المبنى (رئيسي/مساعد)",
        "floors": "عدد الأدوار",
        "area": "المساحة",
        "usage": "الاستخدام"
      }
    ],
    "facilities": ["المرافق (موقف/حديقة/مسبح/...)"],
    "roads": {
      "north": "الطريق الشمالي بعرض",
      "south": "الطريق الجنوبي بعرض",
      "east": "الطريق الشرقي بعرض",
      "west": "الطريق الغربي بعرض"
    }
  },
  "scale": {
    "ratio": "مقياس الرسم (مثل 1:500)",
    "unit": "وحدة المقياس"
  },
  "confidence": 0.85
}

قواعد:
- استخرج كل القياسات والأبعاد المذكورة على الكروكي
- لاحظ اتجاه الشمال وعلامات المقياس
- حدد كل المباني والمرافق الموجودة
- إذا لم تجد قيمة، اتركها كـ ""
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
      prompt: SKETCH_EXTRACTION_PROMPT,
    });
    const content = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    const sketch = parseJSONResponse(content || '');

    return NextResponse.json({
      success: !!sketch,
      documentType: 'sketch',
      data: sketch,
      usage: response?.usageMetadata || null,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Sketch Extract API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to extract sketch data',
        documentType: 'sketch',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
