import { NextRequest, NextResponse } from 'next/server';

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

        const response = await callGemini(images, OWNERSHIP_EXTRACTION_PROMPT);
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
