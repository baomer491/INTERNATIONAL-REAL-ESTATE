import { NextRequest, NextResponse } from 'next/server';
import { fetchOmanRealProperties } from '@/lib/market-comps';
import type { MarketComp, MarketCompsResult } from '@/types';

const VALUATION_PROMPT = `أنت خبير تقييم عقاري معتمد في سلطنة عمان.

بناءً على بيانات العقار التالية:
- الولاية: {wilayat}
- نوع العقار: {propertyType}
- المساحة: {area} متر مربع
- الاستخدام: {usage}

والبيانات المستخرجة من السوق ({totalResults} عقار متاح):

{compsData}

مهمتك:
1. اختر أفضل 5 عقارات مشابهة (الأقرب مساحة ونوع)
2. استبعد الأسعار المتطرفة (outliers)
3. احسب السعر العدل للمتر المربع
4. قدّر القيمة السوقية للعقار

أعد النتيجة كـ JSON فقط:
{
  "comparables": [
    {
      "id": "رقم التعريف",
      "title": "عنوان الإعلان",
      "propertyType": "نوع العقار",
      "wilayat": "الولاية",
      "area": المساحة,
      "price": السعر,
      "pricePerSqm": السعر لكل متر,
      "source": "omanreal",
      "sourceUrl": "رابط الإعلان"
    }
  ],
  "analysis": {
    "avgPricePerSqm": المعدل لكل متر,
    "minPricePerSqm": أدنى سعر للمتر,
    "maxPricePerSqm": أعلى سعر للمتر,
    "estimatedValue": القيمة المقدرة للعقار,
    "confidence": مستوى الثقة من 0 إلى 1,
    "recommendation": "توصية مختصرة",
    "methodology": "وصف طريقة الحساب"
  }
}

قواعد:
- اختر 5 عقارات الأقرب للمواصفات المطلوبة
- أزل القيم المتطرفة (أعلى 10% وأدنى 10%)
- confidence يعكس عدد النتائج المتاحة (أكثر نتائج = ثقة أعلى)
- أجب بالعربية فقط في recommendation و methodology
- أعد JSON فقط بدون أي نص إضافي`;

async function callGeminiAnalysis(params: {
  wilayat: string;
  propertyType: string;
  area: number;
  usage: string;
  properties: MarketComp[];
}): Promise<{ comparables: MarketComp[]; analysis: MarketCompsResult['analysis'] } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const { wilayat, propertyType, area, usage, properties } = params;

  const compsData = properties
    .slice(0, 15)
    .map((p, i) => `${i + 1}. ${p.title} | ${p.area}م² | ${p.price.toLocaleString()} ر.ع | ${p.pricePerSqm} ر.ع/م² | ${p.sourceUrl}`)
    .join('\n');

  const prompt = VALUATION_PROMPT
    .replace('{wilayat}', wilayat)
    .replace('{propertyType}', propertyType)
    .replace('{area}', String(area))
    .replace('{usage}', usage)
    .replace('{totalResults}', String(properties.length))
    .replace('{compsData}', compsData);

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

function localAnalysis(params: {
  area: number;
  properties: MarketComp[];
}): { comparables: MarketComp[]; analysis: MarketCompsResult['analysis'] } {
  const { area, properties } = params;

  const valid = properties
    .filter(p => p.price > 0 && p.area > 0)
    .sort((a, b) => Math.abs(a.area - area) - Math.abs(b.area - area));

  const top5 = valid.slice(0, 5);
  const allPrices = valid.map(p => p.pricePerSqm).filter(p => p > 0);

  if (allPrices.length === 0) {
    return {
      comparables: [],
      analysis: {
        avgPricePerSqm: 0,
        minPricePerSqm: 0,
        maxPricePerSqm: 0,
        estimatedValue: 0,
        confidence: 0,
        recommendation: 'لا توجد بيانات كافية',
        methodology: 'لا توجد نتائج مطابقة',
      },
    };
  }

  allPrices.sort((a, b) => a - b);
  const trimmed = allPrices.length > 3
    ? allPrices.slice(Math.floor(allPrices.length * 0.1), Math.ceil(allPrices.length * 0.9))
    : allPrices;

  const avg = Math.round(trimmed.reduce((s, v) => s + v, 0) / trimmed.length);
  const min = Math.min(...trimmed);
  const max = Math.max(...trimmed);

  const confidence = Math.min(0.95, 0.4 + (valid.length / 20) * 0.55);

  return {
    comparables: top5,
    analysis: {
      avgPricePerSqm: avg,
      minPricePerSqm: min,
      maxPricePerSqm: max,
      estimatedValue: Math.round(avg * area),
      confidence: Math.round(confidence * 100) / 100,
      recommendation: `بناءً على ${valid.length} عقار متاح، المعدل ${avg} ر.ع/م²`,
      methodology: 'المعدل المرجح بعد استبعاد القيم المتطرفة',
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wilayat, propertyType, area, usage } = body;

    if (!wilayat || !propertyType) {
      return NextResponse.json(
        { success: false, error: 'يرجى تحديد الولاية ونوع العقار' },
        { status: 400 }
      );
    }

    const numArea = Number(area) || 0;

    const { properties, error: fetchError } = await fetchOmanRealProperties({
      wilayat,
      propertyType,
      area: numArea,
      usage: usage || 'residential',
      pageSize: 20,
    });

    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        query: { wilayat, propertyType, area: numArea, usage: usage || 'residential' },
        comparables: [],
        analysis: {
          avgPricePerSqm: 0,
          minPricePerSqm: 0,
          maxPricePerSqm: 0,
          estimatedValue: 0,
          confidence: 0,
          recommendation: fetchError || 'لا توجد نتائج مطابقة',
          methodology: 'لا توجد بيانات كافية',
        },
        cached: false,
        timestamp: new Date().toISOString(),
        error: fetchError,
      } satisfies MarketCompsResult);
    }

    let result: { comparables: MarketComp[]; analysis: MarketCompsResult['analysis'] };

    const aiResult = await callGeminiAnalysis({
      wilayat,
      propertyType,
      area: numArea,
      usage: usage || 'residential',
      properties,
    });

    if (aiResult && aiResult.comparables.length > 0) {
      result = aiResult;
    } else {
      result = localAnalysis({ area: numArea, properties });
    }

    return NextResponse.json({
      success: true,
      query: { wilayat, propertyType, area: numArea, usage: usage || 'residential' },
      comparables: result.comparables,
      analysis: result.analysis,
      cached: false,
      timestamp: new Date().toISOString(),
    } satisfies MarketCompsResult);

  } catch (error: any) {
    console.error('Market Comps API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'فشل في البحث عن مقارنات سوقية',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
