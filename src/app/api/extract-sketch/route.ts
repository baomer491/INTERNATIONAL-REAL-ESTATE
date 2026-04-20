import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseJSONResponse } from '@/lib/gemini-client';
import { preprocessImages } from '@/lib/image-preprocessor';
import { validateSketch, type ValidatedSketch } from '@/lib/data-postprocessor';
import { validateToken } from '@/lib/csrf';

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
- الأرقام يجب أن تكون بدون فواصل أو مسافات
- confidence هو مستوى ثقتك من 0 إلى 1
- أجب بالعربية فقط`;

const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_CONFIDENCE = 0.5;
const MAX_RETRIES = 1;

export async function POST(request: NextRequest) {
  try {
    // CSRF check
    const csrfError = validateToken(request);
    if (csrfError) {
      return NextResponse.json(
        { success: false, error: csrfError },
        { status: 403 }
      );
    }

    // Auth check
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
    const { images = [], skipPreprocess = false } = body;

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided. Please provide an images array.' },
        { status: 400 }
      );
    }

    // Step 1: Preprocess images with Sharp
    let processedImages: string[];
    if (skipPreprocess) {
      processedImages = images;
    } else {
      console.log('[extract-sketch] Preprocessing', images.length, 'images with Sharp...');
      processedImages = await preprocessImages(images, {
        enhanceContrast: true,
        sharpen: true,
        grayscale: true,
        maxDimension: 2048,
        quality: 90,
      });
    }

    // Step 2: Call Gemini with retry logic
    let sketch: ValidatedSketch | null = null;
    let lastError: string | null = null;
    let attempt = 0;

    while (attempt <= MAX_RETRIES && !sketch) {
      attempt++;

      const response = await callGemini({
        images: processedImages,
        prompt: attempt === 1
          ? SKETCH_EXTRACTION_PROMPT
          : SKETCH_EXTRACTION_PROMPT + '\n\nملاحظة: حاول مرة أخرى مع التركيز أكثر على القياسات والأرقام. تأكد من إرجاع JSON صالح فقط.',
        model: 'gemini-2.5-flash',
        maxOutputTokens: 4096,
        temperature: attempt === 1 ? 0.1 : 0.2,
      });

      // Check finish reason
      const finishReason = response?.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY' || finishReason === 'BLOCKED') {
        lastError = 'تم حظر المحتوى بواسطة فلتر الأمان';
        break;
      }

      const content = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      const raw = parseJSONResponse(content || '');

      if (!raw) {
        lastError = 'لم يتم استخراج بيانات صالحة من الصورة';
        continue;
      }

      // Step 3: Validate with Zod + Regex post-processing
      const validation = validateSketch(raw);

      // Step 4: Confidence check
      if (validation.confidence < MIN_CONFIDENCE && attempt <= MAX_RETRIES) {
        console.log(`[extract-sketch] Attempt ${attempt}: confidence ${validation.confidence.toFixed(2)} < ${MIN_CONFIDENCE}, retrying...`);
        lastError = `مستوى الثقة منخفض (${(validation.confidence * 100).toFixed(0)}%)`;
        continue;
      }

      sketch = validation.data;
    }

    if (!sketch) {
      return NextResponse.json({
        success: false,
        error: lastError || 'لم يتم استخراج بيانات كافية من الكروكي',
        documentType: 'sketch',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      documentType: 'sketch',
      data: sketch,
      confidence: sketch.confidence,
      attempts: attempt,
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to extract sketch data';
    console.error('[extract-sketch] Error:', message);
    return NextResponse.json(
      {
        success: false,
        error: message,
        documentType: 'sketch',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
