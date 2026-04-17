import { governorates, wilayatData } from '@/data/mock';
import type { ExtractedField, OCRExtractionResult, OCRStep } from '@/types';

export type { OCRExtractionResult, OCRStep, ExtractedField };

// Image compression settings
const MAX_IMAGE_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

/**
 * Compress an image file before sending to API
 * Reduces file size to prevent API limits while maintaining quality
 */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_IMAGE_DIMENSION;
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = (width / height) * MAX_IMAGE_DIMENSION;
            height = MAX_IMAGE_DIMENSION;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 JPEG
        const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('Failed to compress image'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function createEmptyFields(): OCRExtractionResult['fields'] {
  return {
    plotNumber: { value: '', confidence: 0, source: '' },
    drawingNumber: { value: '', confidence: 0, source: '' },
    area: { value: '', confidence: 0, source: '' },
    areaUnit: { value: 'متر مربع', confidence: 0.7, source: 'default' },
    wilayat: { value: '', confidence: 0, source: '' },
    governorate: { value: '', confidence: 0, source: '' },
    usageType: { value: '', confidence: 0, source: '' },
    owner: { value: '', confidence: 0, source: '' },
    blockNumber: { value: '', confidence: 0, source: '' },
    street: { value: '', confidence: 0, source: '' },
    village: { value: '', confidence: 0, source: '' },
    frontage: { value: '', confidence: 0, source: '' },
    floors: { value: '', confidence: 0, source: '' },
    buildingAge: { value: '', confidence: 0, source: '' },
  };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function normalizeArabic(text: string): string {
  return text
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u0027\u0028\u0029\u002D\u002F]/g, '')
    .trim();
}

function matchGovernorateName(raw: string): ExtractedField {
  const normalized = normalizeArabic(raw);
  for (const gov of governorates) {
    if (normalized.includes(normalizeArabic(gov))) {
      return { value: gov, confidence: 0.95, source: 'ai' };
    }
  }
  if (raw.trim()) {
    return { value: raw.trim(), confidence: 0.6, source: 'ai' };
  }
  return { value: '', confidence: 0, source: '' };
}

function matchWilayatName(raw: string, governorate: string): ExtractedField {
  const normalized = normalizeArabic(raw);
  const govWilayats = governorate ? wilayatData[governorate] || [] : [];
  const allWilayats = Object.values(wilayatData).flat();
  const searchList = govWilayats.length > 0 ? govWilayats : allWilayats;

  for (const w of searchList) {
    if (normalized.includes(normalizeArabic(w))) {
      return { value: w, confidence: 0.9, source: 'ai' };
    }
  }
  if (raw.trim()) {
    return { value: raw.trim(), confidence: 0.5, source: 'ai' };
  }
  return { value: '', confidence: 0, source: '' };
}

function parseUsageType(raw: string): ExtractedField {
  const usageMap: Record<string, string> = {
    سكني: 'residential',
    تجاري: 'commercial',
    صناعي: 'industrial',
    زراعي: 'agricultural',
    استثماري: 'investment',
  };
  if (usageMap[raw]) {
    return { value: usageMap[raw], confidence: 0.9, source: 'ai' };
  }
  const normalized = normalizeArabic(raw);
  for (const [ar, en] of Object.entries(usageMap)) {
    if (normalized.includes(normalizeArabic(ar))) {
      return { value: en, confidence: 0.85, source: 'ai' };
    }
  }
  if (raw.trim()) {
    return { value: raw, confidence: 0.4, source: 'ai' };
  }
  return { value: '', confidence: 0, source: '' };
}

function parseStructuredResponse(structured: Record<string, any>, baseConfidence: number): OCRExtractionResult['fields'] {
  const safeStr = (v: any) => (v && typeof v === 'string' ? v.trim() : '');
  const safeNum = (v: any) => (v !== null && v !== undefined && String(v).trim() !== '' ? String(v).trim() : '');

  const govField = matchGovernorateName(safeStr(structured.governorate));
  const wilayatField = matchWilayatName(safeStr(structured.wilayat), govField.value);

  const conf = structured.confidence && typeof structured.confidence === 'number'
    ? structured.confidence
    : baseConfidence;

  const f = (val: string, c: number): ExtractedField => ({
    value: val,
    confidence: val ? c : 0,
    source: val ? 'ai' : '',
  });

  return {
    owner: f(safeStr(structured.owner), conf),
    plotNumber: f(safeNum(structured.plotNumber), conf),
    drawingNumber: f(safeStr(structured.drawingNumber), conf),
    area: f(safeNum(structured.area), conf),
    areaUnit: safeStr(structured.areaUnit)
      ? { value: safeStr(structured.areaUnit), confidence: 0.8, source: 'ai' }
      : { value: 'متر مربع', confidence: 0.7, source: 'default' },
    governorate: govField,
    wilayat: wilayatField,
    village: f(safeStr(structured.village), conf),
    blockNumber: f(safeNum(structured.blockNumber), conf),
    street: f(safeStr(structured.street), conf),
    frontage: f(safeNum(structured.frontage), conf),
    floors: f(safeNum(structured.floors), conf),
    buildingAge: f(safeNum(structured.buildingAge), conf),
    usageType: parseUsageType(safeStr(structured.usageType)),
  };
}

function extractField(
  text: string,
  patterns: RegExp[]
): { value: string; confidence: number } {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].trim().replace(/[_\s]+$/, '');
      if (cleaned) {
        return { value: cleaned, confidence: 0.85 };
      }
    }
  }
  return { value: '', confidence: 0 };
}

function matchGovernorate(text: string): ExtractedField {
  const normalized = normalizeArabic(text);
  for (const gov of governorates) {
    if (normalized.includes(normalizeArabic(gov))) {
      return { value: gov, confidence: 0.95, source: 'ocr' };
    }
  }
  return { value: '', confidence: 0, source: '' };
}

function matchWilayat(text: string, governorate: string): ExtractedField {
  const normalized = normalizeArabic(text);
  const govWilayats = governorate ? wilayatData[governorate] || [] : [];
  const allWilayats = Object.values(wilayatData).flat();
  const searchList = govWilayats.length > 0 ? govWilayats : allWilayats;

  for (const w of searchList) {
    if (normalized.includes(normalizeArabic(w))) {
      return { value: w, confidence: 0.9, source: 'ocr' };
    }
  }
  return { value: '', confidence: 0, source: '' };
}

function matchUsageType(text: string): ExtractedField {
  const usageMap: Record<string, string> = {
    سكني: 'residential',
    تجاري: 'commercial',
    صناعي: 'industrial',
    زراعي: 'agricultural',
    استثماري: 'investment',
  };
  const normalized = normalizeArabic(text);
  for (const [ar, en] of Object.entries(usageMap)) {
    if (normalized.includes(normalizeArabic(ar))) {
      return { value: en, confidence: 0.85, source: 'ocr' };
    }
  }
  return { value: '', confidence: 0, source: '' };
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/---+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n')
    .trim();
}

function parsePropertyDataFromText(text: string): OCRExtractionResult['fields'] {
  const cleanText = stripMarkdown(text).replace(/\s+/g, ' ');

  const owner = extractField(cleanText, [
    /(?:اسم|اسماء)\s*(?:المالك|صاحب\s*الملكية)\s*[:\-–.\u066A]?\s*(.+)/i,
    /(?:المالك|مالك\s*العقار|صاحب\s*الملكية)\s*[:\-–.\u066A]?\s*(.+)/i,
    /(?:لصالح|للمالك)\s*[:\-–.\u066A]?\s*(.+)/i,
    /(?:Owner\s*Name)\s*[:\-–.\u066A]?\s*(.+)/i,
  ]);

  const plotNumber = extractField(cleanText, [
    /(?:رقم|قطعة)\s*القطعة\s*[:\-–.\u066A]?\s*(\d+)/i,
    /قطعة\s*(?:رقم|No\.?)\s*[:\-–.\u066A]?\s*(\d+)/i,
    /(?:Plot|Parcel)\s*No\.?\s*[:\-–.\u066A]?\s*(\d+)/i,
    /رقم\s*القطعة\s*[:\-–.\u066A]?\s*(\d+)/i,
  ]);

  const drawingNumber = extractField(cleanText, [
    /(?:رقم|مسح)\s*(?:المسح|الرسم|الخريطة)\s*[:\-–.\u066A]?\s*(\S+)/i,
    /(?:مسح|رسم)\s*رقم\s*[:\-–.\u066A]?\s*(\S+)/i,
    /(?:Survey|Drawing)\s*No\.?\s*[:\-–.\u066A]?\s*(\S+)/i,
  ]);

  const areaMatch = extractField(cleanText, [
    /المساحة\s*[:\-–.\u066A]?\s*([\d,]+(?:\.\d+)?)\s*(متر مربع|م²|m²|متر|m2)/i,
    /(?:المساحة|Area)\s*[:\-–.\u066A]?\s*([\d,]+(?:\.\d+)?)/i,
    /(?:مساحة|المساحة)\s*(?:القطعة|الأرض)\s*[:\-–.\u066A]?\s*([\d,]+(?:\.\d+)?)/i,
  ]);
  const area = { ...areaMatch, value: areaMatch.value.replace(/,/g, '') };

  let areaUnit: ExtractedField = { value: 'متر مربع', confidence: 0.7, source: 'default' };
  const areaUnitMatch = cleanText.match(/([\d,]+(?:\.\d+)?)\s*(متر مربع|م²|m²|متر|m2)/i);
  if (areaUnitMatch?.[2]) {
    areaUnit = { value: areaUnitMatch[2], confidence: 0.9, source: 'ocr' };
  }

  const blockNumber = extractField(cleanText, [
    /(?:رقم|البلوك|القطاع|الحي)\s*[:\-–.\u066A]?\s*(\d+)/i,
    /(?:Block|Sector)\s*No\.?\s*[:\-–.\u066A]?\s*(\d+)/i,
  ]);

  const street = extractField(cleanText, [
    /(?:الشارع|شارع)\s*[:\-–.\u066A]?\s*([^\n,]+)/i,
    /(?:Street)\s*[:\-–.\u066A]?\s*([^\n,]+)/i,
  ]);

  const village = extractField(cleanText, [
    /(?:القرية|قرية|الحارة)\s*[:\-–.\u066A]?\s*([^\n,]+)/i,
    /(?:Village)\s*[:\-–.\u066A]?\s*([^\n,]+)/i,
  ]);

  const usageType = matchUsageType(cleanText);

  const frontage = extractField(cleanText, [
    /(?:الواجهة|واجهة|واجهات|طول\s*الواجهة)\s*[:\-–.\u066A]?\s*([\d,]+(?:\.\d+)?)/i,
    /(?:Frontage)\s*[:\-–.\u066A]?\s*([\d,]+(?:\.\d+)?)/i,
  ]);

  const floors = extractField(cleanText, [
    /(?:عدد)\s*(?:الطوابق|الطابق|الأدوار)\s*[:\-–.\u066A]?\s*(\d+)/i,
    /(?:الطوابق|الطابق|الأدوار)\s*[:\-–.\u066A]?\s*(\d+)/i,
    /(?:Floors|Stories)\s*[:\-–.\u066A]?\s*(\d+)/i,
  ]);

  const buildingAge = extractField(cleanText, [
    /(?:عمر|العمر)\s*(?:المبنى|البناء|البنية|العقار)\s*[:\-–.\u066A]?\s*(\d+)\s*(?:سنة|سنوات|year)/i,
    /(?:Building\s*Age|Age)\s*[:\-–.\u066A]?\s*(\d+)/i,
  ]);

  const governorate = matchGovernorate(cleanText);
  const wilayat = matchWilayat(cleanText, governorate.value);

  const field = (v: { value: string; confidence: number }, src: 'ocr' | ''): ExtractedField => ({
    value: v.value,
    confidence: v.confidence,
    source: v.value ? src : '',
  });

  return {
    plotNumber: field(plotNumber, 'ocr'),
    drawingNumber: field(drawingNumber, 'ocr'),
    area: field(area, 'ocr'),
    areaUnit,
    wilayat,
    governorate,
    usageType,
    owner: field(owner, 'ocr'),
    blockNumber: field(blockNumber, 'ocr'),
    street: field(street, 'ocr'),
    village: field(village, 'ocr'),
    frontage: field(frontage, 'ocr'),
    floors: field(floors, 'ocr'),
    buildingAge: field(buildingAge, 'ocr'),
  };
}

interface APIResponse {
  success: boolean;
  text?: string;
  structured?: Record<string, any>;
  error?: string;
}

async function callOCRAPI(base64Images: string[]): Promise<APIResponse> {
  try {
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: base64Images }),
    });
    return await response.json();
  } catch {
    return { success: false, error: 'Connection error. Please check your internet and try again.' };
  }
}

export async function extractPropertyFromImage(
  files: File[],
  onStep?: (step: OCRStep) => void
): Promise<OCRExtractionResult> {
  try {
    onStep?.('uploading');
    // Compress images before sending to API to prevent size limits
    const base64Images = await Promise.all(files.map(file => compressImage(file)));

    onStep?.('processing');
    const result = await callOCRAPI(base64Images);

    if (!result.success) {
      return {
        success: false,
        rawText: '',
        fields: createEmptyFields(),
        error: result.error || 'Failed to extract text from image',
      };
    }

    onStep?.('parsing');

    let fields: OCRExtractionResult['fields'];

    if (result.structured && typeof result.structured === 'object') {
      const baseConf = result.structured.confidence || 0.85;
      fields = parseStructuredResponse(result.structured, baseConf);
    } else if (result.text) {
      fields = parsePropertyDataFromText(result.text);
    } else {
      fields = createEmptyFields();
    }

    return {
      success: true,
      rawText: result.text || '',
      fields,
    };
  } catch {
    return {
      success: false,
      rawText: '',
      fields: createEmptyFields(),
      error: 'An unexpected error occurred during extraction',
    };
  }
}

export function getConfidenceLabel(confidence: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (confidence >= 0.8)
    return { label: 'عالي', color: '#15803d', bg: '#dcfce7' };
  if (confidence >= 0.5)
    return { label: 'متوسط', color: '#b45309', bg: '#fef3c7' };
  if (confidence > 0)
    return { label: 'منخفض', color: '#64748b', bg: '#f1f5f9' };
  return { label: '', color: '', bg: '' };
}

export function getStepLabel(step: OCRStep): string {
  const labels: Record<OCRStep, string> = {
    idle: '',
    uploading: 'جاري تحميل الملفات...',
    processing: 'جاري التحليل بالذكاء الاصطناعي...',
    parsing: 'جاري استخراج بيانات العقار...',
    done: 'تم الاستخراج بنجاح',
    error: 'حدث خطأ',
  };
  return labels[step];
}
