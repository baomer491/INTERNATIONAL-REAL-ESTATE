import { NextRequest, NextResponse } from 'next/server';

// Prompts for different extraction modes
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
    const {
      ownershipPages = [],   // Array of base64 images for ownership pages
      sketchPages = [],      // Array of base64 images for sketch pages
      mixedPages = [],       // Array of base64 images for mixed content pages
      mode = 'combined'
    } = body;

    // Check if at least one array has images
    const hasOwnership = ownershipPages.length > 0;
    const hasSketch = sketchPages.length > 0;
    const hasMixed = mixedPages.length > 0;

    if (!hasOwnership && !hasSketch && !hasMixed) {
      return NextResponse.json(
        { success: false, error: 'No images provided. Please provide ownershipPages, sketchPages, or mixedPages array.' },
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

    const result: any = {
      success: true,
      mode,
      timestamp: new Date().toISOString(),
      ownershipImages: ownershipPages.length,
      sketchImages: sketchPages.length,
      mixedImages: mixedPages.length,
    };

    // Process ownership pages if available
    if (hasOwnership && (mode === 'combined' || mode === 'ownership')) {
      try {
        const response = await callGemini(ownershipPages, OWNERSHIP_EXTRACTION_PROMPT);
        const content = response?.candidates?.[0]?.content?.parts?.[0]?.text;
        result.ownership = parseJSONResponse(content || '');
        result.ownershipUsage = response?.usageMetadata || null;

        if (!result.ownership) {
          result.ownershipError = 'Failed to parse ownership data';
        }
      } catch (error: any) {
        result.ownershipError = error.message;
      }
    }

    // Process sketch pages if available
    if (hasSketch && (mode === 'combined' || mode === 'sketch')) {
      try {
        const response = await callGemini(sketchPages, SKETCH_EXTRACTION_PROMPT);
        const content = response?.candidates?.[0]?.content?.parts?.[0]?.text;
        result.sketch = parseJSONResponse(content || '');
        result.sketchUsage = response?.usageMetadata || null;

        if (!result.sketch) {
          result.sketchError = 'Failed to parse sketch data';
        }
      } catch (error: any) {
        result.sketchError = error.message;
      }
    }

    // Process mixed pages - use both prompts
    if (hasMixed) {
      try {
        // For mixed pages, we'll use both prompts but mark them as mixed
        const [ownershipResponse, sketchResponse] = await Promise.all([
          callGemini(mixedPages, OWNERSHIP_EXTRACTION_PROMPT),
          callGemini(mixedPages, SKETCH_EXTRACTION_PROMPT)
        ]);

        const ownershipContent = ownershipResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
        const sketchContent = sketchResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

        const parsedOwnership = parseJSONResponse(ownershipContent || '');
        const parsedSketch = parseJSONResponse(sketchContent || '');

        // Deep merge with priority for non-empty values
        const deepMerge = (target: any, source: any): any => {
          if (!source) return target;
          if (!target) return source;

          const result: any = { ...target };

          for (const key of Object.keys(source)) {
            const sourceVal = source[key];
            const targetVal = target[key];

            // If both are objects, recursively merge
            if (sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal) &&
              targetVal && typeof targetVal === 'object' && !Array.isArray(targetVal)) {
              result[key] = deepMerge(targetVal, sourceVal);
            }
            // If source has value and target doesn't, use source
            else if (sourceVal !== null && sourceVal !== undefined && sourceVal !== '' &&
              (targetVal === null || targetVal === undefined || targetVal === '')) {
              result[key] = sourceVal;
            }
            // Otherwise keep target value
            else if (targetVal !== null && targetVal !== undefined && targetVal !== '') {
              result[key] = targetVal;
            } else {
              result[key] = sourceVal;
            }
          }

          return result;
        };

        // Merge with existing results (preserve existing values when new values are empty)
        if (parsedOwnership) {
          result.ownership = deepMerge(result.ownership, parsedOwnership);
        }
        if (parsedSketch) {
          result.sketch = deepMerge(result.sketch, parsedSketch);
        }
      } catch (error: any) {
        result.mixedError = error.message;
      }
    }

    // Calculate overall confidence
    const ownershipConf = result.ownership?.confidence || 0;
    const sketchConf = result.sketch?.confidence || 0;
    result.overallConfidence = Math.max(ownershipConf, sketchConf);

    // Cross validation
    if (result.ownership && result.sketch) {
      // Extract area values with fallback support
      const ownershipAreaRaw = result.ownership?.property?.area;
      const sketchAreaRaw = result.sketch?.property?.area;

      const ownershipArea = typeof ownershipAreaRaw === 'object'
        ? ownershipAreaRaw?.value || ownershipAreaRaw?.totalArea || ''
        : ownershipAreaRaw || '';

      const sketchArea = typeof sketchAreaRaw === 'object'
        ? sketchAreaRaw?.totalArea || sketchAreaRaw?.value || ''
        : sketchAreaRaw || '';

      // Extract location values with normalization
      const normalizeLocation = (loc: any) => {
        if (!loc) return '';
        return [
          loc.governorate || '',
          loc.wilayat || '',
          loc.blockNumber || '',
          loc.plotNumber || ''
        ].map(s => String(s).trim().replace(/\s+/g, '')).join('|');
      };

      const ownershipLocation = normalizeLocation(result.ownership?.property?.location);
      const sketchLocation = normalizeLocation(result.sketch?.property?.location);

      // Parse area values for comparison (remove commas and convert to number)
      const parseArea = (val: any) => {
        if (!val) return null;
        const num = parseFloat(String(val).replace(/,/g, ''));
        return isNaN(num) ? null : num;
      };

      const parsedOwnershipArea = parseArea(ownershipArea);
      const parsedSketchArea = parseArea(sketchArea);

      const areaMatch = (!parsedOwnershipArea && !parsedSketchArea) ||
        (parsedOwnershipArea && parsedSketchArea && parsedOwnershipArea === parsedSketchArea);

      const locationMatch = !ownershipLocation && !sketchLocation ||
        (ownershipLocation === sketchLocation && ownershipLocation.length > 0);

      result.crossValidation = {
        areaMatch,
        locationMatch,
        ownershipArea,
        sketchArea,
        ownershipLocation,
        sketchLocation,
        notes: parsedOwnershipArea && parsedSketchArea && parsedOwnershipArea !== parsedSketchArea
          ? `تختلف المساحة: الصك=${ownershipArea}, الكروكي=${sketchArea}`
          : ''
      };
    }

    // Validation summary
    result.validation = {
      hasOwnershipData: result.ownership && Object.keys(result.ownership).length > 0,
      hasSketchData: result.sketch && Object.keys(result.sketch).length > 0,
      hasErrors: !result.ownership && !result.sketch,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('PDF Extract API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process images',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
