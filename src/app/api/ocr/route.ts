import { NextRequest, NextResponse } from 'next/server';

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

function extractMimeType(base64: string): string {
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBOR')) return 'image/png';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  if (base64.startsWith('JVBOR')) return 'image/webp';
  return 'image/jpeg';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured on server' },
        { status: 500 }
      );
    }

    const imageParts = images.map((img: string) => {
      const base64Data = img.startsWith('data:')
        ? img.split(',')[1]
        : img;

      if (!base64Data) return null;

      const mimeType = img.startsWith('data:')
        ? img.match(/data:([^;]+);/)?.[1] || extractMimeType(base64Data)
        : extractMimeType(base64Data);

      return {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };
    }).filter(Boolean);

    if (imageParts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid image data' },
        { status: 400 }
      );
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              ...imageParts,
              {
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      const errorMsg = data?.error?.message || `Gemini API error: ${apiResponse.status}`;
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 200 }
      );
    }

    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      const blockReason = data?.candidates?.[0]?.finishReason;
      return NextResponse.json({
        success: false,
        error: blockReason ? `Blocked: ${blockReason}` : 'No response from Gemini',
      });
    }

    let structured = null;
    try {
      structured = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { structured = JSON.parse(jsonMatch[0]); } catch { /* ignore */ }
      }
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
