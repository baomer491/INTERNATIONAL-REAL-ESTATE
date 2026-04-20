import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseJSONResponse } from '@/lib/gemini-client';
import { preprocessImages } from '@/lib/image-preprocessor';
import { validateOwnership, type ValidatedOwnership } from '@/lib/data-postprocessor';
import { validateToken } from '@/lib/csrf';

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
- رقم البطاقة الشخصية يجب أن يكون 8 أرقام فقط
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
      console.log('[extract-ownership] Preprocessing', images.length, 'images with Sharp...');
      processedImages = await preprocessImages(images, {
        enhanceContrast: true,
        sharpen: true,
        grayscale: true,
        maxDimension: 2048,
        quality: 90,
      });
    }

    // Step 2: Call Gemini with retry logic
    let ownership: ValidatedOwnership | null = null;
    let lastError: string | null = null;
    let attempt = 0;

    while (attempt <= MAX_RETRIES && !ownership) {
      attempt++;

      const response = await callGemini({
        images: processedImages,
        prompt: attempt === 1
          ? OWNERSHIP_EXTRACTION_PROMPT
          : OWNERSHIP_EXTRACTION_PROMPT + '\n\nملاحظة: حاول مرة أخرى مع التركيز أكثر على الأرقام والأسماء. تأكد من إرجاع JSON صالح فقط.',
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
      const validation = validateOwnership(raw);

      // Step 4: Confidence check
      if (validation.confidence < MIN_CONFIDENCE && attempt <= MAX_RETRIES) {
        console.log(`[extract-ownership] Attempt ${attempt}: confidence ${validation.confidence.toFixed(2)} < ${MIN_CONFIDENCE}, retrying...`);
        lastError = `مستوى الثقة منخفض (${(validation.confidence * 100).toFixed(0)}%)`;
        continue;
      }

      ownership = validation.data;
    }

    if (!ownership) {
      return NextResponse.json({
        success: false,
        error: lastError || 'لم يتم استخراج بيانات كافية من صك الملكية',
        documentType: 'ownership',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      documentType: 'ownership',
      data: ownership,
      confidence: ownership.confidence,
      attempts: attempt,
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to extract ownership data';
    console.error('[extract-ownership] Error:', message);
    return NextResponse.json(
      {
        success: false,
        error: message,
        documentType: 'ownership',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
