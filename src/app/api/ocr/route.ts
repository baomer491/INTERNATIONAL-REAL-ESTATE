import { NextRequest, NextResponse } from 'next/server';
import { callGemini, parseJSONResponse } from '@/lib/gemini-client';
import { preprocessImages } from '@/lib/image-preprocessor';
import { cleanNumber, cleanTextField } from '@/lib/data-postprocessor';

const EXTRACTION_PROMPT = `أنت خبير في استخراج بيانات العقارات من مستندات العقارات العمانية.

يمكنك استلام صورة واحدة أو صورتين:
- الصورة الأولى: هي صك الملكية (المستند القانوني)
- الصورة الثانية: هي الكروكي / الرسم الهندسي

مهم جداً:
1. إذا أُرفقت صورتان، استخرج البيانات من كلاهما معاً
2. صك الملكية يحتوي على: اسم المالك، رقم القطعة، المساحة، الولاية، المحافظة، نوع الاستخدام
3. الكروكي قد يحتوي على: رقم الرسم، المساحة، الأبعاد، عدد الأدوار
4. اجمع البيانات من كلا الصورتين للحصول على أقصى قدر من المعلومات

أعد النتيجة فقط كـ JSON بدون أي نص إضافي أو markdown:

{
  "owner": "اسم المالك الكامل",
  "plotNumber": "رقم القطعة",
  "drawingNumber": "رقم المسح أو الرسم",
  "area": "المساحة كرقم فقط",
  "areaUnit": "وحدة المساحة",
  "governorate": "المحافظة",
  "wilayat": "الولاية",
  "village": "القرية أو المنطقة",
  "blockNumber": "رقم المربع أو القطاع",
  "street": "الشارع",
  "frontage": "طول الواجهة كرقم",
  "floors": "عدد الأدوار كرقم",
  "buildingAge": "عمر البناء بالسنوات كرقم",
  "usageType": "سكني أو تجاري أو صناعي أو زراعي أو استثماري",
  "confidence": 0.85
}

قواعد:
- إذا لم تجد قيمة لحقل، ضع "" (نص فارغ) وليس null
- الأرقام يجب أن تكون نص عادي بدون فواصل أو مسافات
- usageType يجب أن يكون أحد: سكني, تجاري, صناعي, زراعي, استثماري
- confidence هو مستوى ثقتك في النتيجة من 0 إلى 1
- أجب بالعربية فقط
- إذا أُرفقت صورتان، استخرج البيانات من كلاهما معاً (صك الملكية للمعلومات القانونية والكروكي للمساحة والتفاصيل الهندسية)
- إذا كانت هناك قيم مختلفة بين الصورتين، فضّل القيمة الأكثر وضوحاً واكتمالاً`;

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
    const { images, skipPreprocess = false } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      );
    }

    // Step 1: Preprocess images with Sharp for better OCR accuracy
    let processedImages: string[];
    if (skipPreprocess) {
      processedImages = images;
    } else {
      console.log('[ocr] Preprocessing', images.length, 'images with Sharp...');
      processedImages = await preprocessImages(images, {
        enhanceContrast: true,
        sharpen: true,
        grayscale: true,
        maxDimension: 2048,
        quality: 90,
      });
    }

    // Step 2: Call Gemini
    const data = await callGemini({
      images: processedImages,
      prompt: EXTRACTION_PROMPT,
      model: 'gemini-2.5-flash',
      maxOutputTokens: 2048,
    });

    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      const blockReason = data?.candidates?.[0]?.finishReason;
      return NextResponse.json({
        success: false,
        error: blockReason ? `Blocked: ${blockReason}` : 'No response from Gemini',
      });
    }

    const raw = parseJSONResponse(content);

    // Step 3: Post-process extracted data with Regex cleanup
    let structured = raw;
    if (raw && typeof raw === 'object') {
      structured = {
        ...raw,
        // Clean numeric fields
        plotNumber: cleanNumber(raw.plotNumber || ''),
        area: cleanNumber(raw.area || ''),
        blockNumber: cleanNumber(raw.blockNumber || ''),
        frontage: cleanNumber(raw.frontage || ''),
        floors: cleanNumber(raw.floors || ''),
        buildingAge: cleanNumber(raw.buildingAge || ''),
        // Clean text fields
        owner: cleanTextField(raw.owner || ''),
        governorate: cleanTextField(raw.governorate || ''),
        wilayat: cleanTextField(raw.wilayat || ''),
        village: cleanTextField(raw.village || ''),
        street: cleanTextField(raw.street || ''),
        drawingNumber: cleanTextField(raw.drawingNumber || ''),
        usageType: cleanTextField(raw.usageType || ''),
        areaUnit: cleanTextField(raw.areaUnit || 'متر مربع'),
      };
    }

    return NextResponse.json({
      success: true,
      text: content,
      structured,
      usage: data?.usageMetadata || null,
    });
  } catch (error) {
    console.error('OCR API route error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process image. Please try again.' },
      { status: 500 }
    );
  }
}
