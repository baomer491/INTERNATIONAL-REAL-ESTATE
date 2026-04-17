import { NextRequest, NextResponse } from 'next/server';

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

function extractMimeType(base64: string): string {
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('iVBOR')) return 'image/png';
    if (base64.startsWith('R0lGOD')) return 'image/gif';
    if (base64.startsWith('JVBOR')) return 'image/webp';
    return 'image/jpeg';
}

function createImagePart(base64Data: string) {
    const mimeType = extractMimeType(base64Data);
    return {
        inlineData: {
            mimeType,
            data: base64Data,
        },
    };
}

async function callGemini(images: string[], prompt: string): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Gemini API key not configured');
    }

    const imageParts = images.map(img => {
        const base64Data = img.startsWith('data:') ? img.split(',')[1] : img;
        return createImagePart(base64Data);
    });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    ...imageParts,
                    { text: prompt }
                ],
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json',
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `API error: ${response.status}`);
    }

    return await response.json();
}

function parseJSONResponse(content: string): any {
    try {
        return JSON.parse(content);
    } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                return null;
            }
        }
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { images = [] } = body;

        if (images.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No images provided. Please provide an images array.' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Gemini API key not configured. Please add GEMINI_API_KEY to environment variables.',
                    hint: 'Get your API key from https://aistudio.google.com/apikey'
                },
                { status: 500 }
            );
        }

        const response = await callGemini(images, SKETCH_EXTRACTION_PROMPT);
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
