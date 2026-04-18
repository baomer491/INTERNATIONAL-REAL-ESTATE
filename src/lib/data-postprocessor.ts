/**
 * Data Post-Processor for extracted document data.
 * Cleans, normalizes, and validates data extracted from Gemini.
 * Combines Regex cleanup + Zod validation + confidence scoring.
 */

import { z } from 'zod';

/* ===== Regex Post-Processing ===== */

/**
 * Normalize Arabic text: remove diacritics, unify alef/ya/ta
 */
export function normalizeArabicText(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel/diacritics
    .replace(/[إأآ]/g, 'ا')              // unify alef
    .replace(/ة/g, 'ه')                   // ta marbuta → ha
    .replace(/ى/g, 'ي')                   // alef maqsura → ya
    .trim();
}

/**
 * Clean numeric values: remove Arabic-Indic digits, commas, spaces
 */
export function cleanNumber(value: string): string {
  if (!value) return '';
  return value
    // Convert Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) to Western (0-9)
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    // Remove commas used as thousands separators
    .replace(/,/g, '')
    // Remove spaces within numbers
    .replace(/(\d)\s+(\d)/g, '$1$2')
    // Remove non-numeric chars except decimal point and minus
    .replace(/[^\d.\-]/g, '')
    .trim();
}

/**
 * Standardize date format to ISO YYYY-MM-DD
 */
export function cleanDate(value: string): string {
  if (!value) return '';

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try YYYY-MM-DD (already correct)
  const isoMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  // Try Arabic date like "١٥ يناير ٢٠٢٥"
  const arabicMonths: Record<string, string> = {
    يناير: '01', فبراير: '02', مارس: '03', ابريل: '04', أبريل: '04',
    مايو: '05', يونيو: '06', يوليو: '07', أغسطس: '08', سبتمبر: '09',
    اكتوبر: '10', أكتوبر: '10', نوفمبر: '11', ديسمبر: '12',
  };
  const arabicMatch = value.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
  if (arabicMatch) {
    const day = cleanNumber(arabicMatch[1]).padStart(2, '0');
    const month = arabicMonths[normalizeArabicText(arabicMatch[2])];
    const year = cleanNumber(arabicMatch[3]);
    if (month && year) return `${year}-${month}-${day}`;
  }

  return value.trim();
}

/**
 * Clean ID numbers: Arabic-Indic digits, remove spaces/dashes
 */
export function cleanIdNumber(value: string): string {
  if (!value) return '';
  return cleanNumber(value).replace(/[\s\-\/]/g, '');
}

/**
 * Clean general text field
 */
export function cleanTextField(value: string): string {
  if (!value) return '';
  return value
    .replace(/\s+/g, ' ')
    .replace(/^["'\-–—]+|["'\-–—]+$/g, '')
    .trim();
}

/* ===== Zod Validation Schemas ===== */

export const ownershipSchema = z.object({
  documentType: z.literal('ownership').optional(),
  deedNumber: z.string().transform(cleanTextField),
  deedDate: z.string().transform(cleanDate),
  owner: z.object({
    name: z.string().transform(cleanTextField),
    idNumber: z.string().transform(cleanIdNumber),
    idType: z.string().transform(cleanTextField),
  }),
  property: z.object({
    type: z.string().transform(cleanTextField),
    usage: z.string().transform(cleanTextField),
    location: z.object({
      governorate: z.string().transform(cleanTextField),
      wilayat: z.string().transform(cleanTextField),
      village: z.string().transform(cleanTextField),
      blockNumber: z.string().transform(cleanNumber),
      plotNumber: z.string().transform(cleanNumber),
      street: z.string().transform(cleanTextField),
    }),
    area: z.object({
      value: z.string().transform(cleanNumber),
      unit: z.string().transform(cleanTextField),
    }),
    boundaries: z.object({
      north: z.string().transform(cleanTextField),
      south: z.string().transform(cleanTextField),
      east: z.string().transform(cleanTextField),
      west: z.string().transform(cleanTextField),
    }),
    frontage: z.string().transform(cleanNumber),
  }),
  restrictions: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(''),
  confidence: z.number().min(0).max(1).optional(),
});

export const sketchSchema = z.object({
  documentType: z.literal('sketch').optional(),
  drawingNumber: z.string().transform(cleanTextField),
  drawingDate: z.string().transform(cleanDate),
  property: z.object({
    location: z.object({
      governorate: z.string().transform(cleanTextField),
      wilayat: z.string().transform(cleanTextField),
      blockNumber: z.string().transform(cleanNumber),
      plotNumber: z.string().transform(cleanNumber),
    }),
    area: z.object({
      totalArea: z.string().transform(cleanNumber),
      buildingArea: z.string().transform(cleanNumber),
      openArea: z.string().transform(cleanNumber),
      unit: z.string().transform(cleanTextField),
    }),
    dimensions: z.object({
      width: z.string().transform(cleanNumber),
      depth: z.string().transform(cleanNumber),
      frontage: z.string().transform(cleanNumber),
      unit: z.string().transform(cleanTextField),
    }),
    boundaries: z.object({
      north: z.string().transform(cleanTextField),
      south: z.string().transform(cleanTextField),
      east: z.string().transform(cleanTextField),
      west: z.string().transform(cleanTextField),
    }),
    orientation: z.object({
      northArrow: z.string().transform(cleanTextField),
      rotation: z.string().transform(cleanTextField),
    }).optional().default({ northArrow: '', rotation: '' }),
    buildings: z.array(z.object({
      type: z.string(),
      floors: z.string().transform(cleanTextField),
      area: z.string().transform(cleanTextField),
      usage: z.string().transform(cleanTextField),
    })).optional().default([]),
    facilities: z.array(z.string()).optional().default([]),
    roads: z.object({
      north: z.string().transform(cleanTextField),
      south: z.string().transform(cleanTextField),
      east: z.string().transform(cleanTextField),
      west: z.string().transform(cleanTextField),
    }).optional().default({ north: '', south: '', east: '', west: '' }),
  }),
  scale: z.object({
    ratio: z.string().transform(cleanTextField),
    unit: z.string().transform(cleanTextField),
  }).optional().default({ ratio: '', unit: '' }),
  confidence: z.number().min(0).max(1).optional(),
});

export type ValidatedOwnership = z.infer<typeof ownershipSchema>;
export type ValidatedSketch = z.infer<typeof sketchSchema>;

/* ===== Validation + Confidence Check ===== */

export interface ValidationResult<T> {
  data: T | null;
  confidence: number;
  warnings: string[];
  isValid: boolean;
}

/**
 * Validate extracted ownership data with Zod.
 * Returns cleaned data + confidence score + warnings.
 */
export function validateOwnership(raw: unknown): ValidationResult<ValidatedOwnership> {
  const result = ownershipSchema.safeParse(raw);
  const warnings: string[] = [];

  if (!result.success) {
    const missingFields = result.error.issues
      .map((i) => i.path.join('.'))
      .filter(Boolean);
    warnings.push(`حقول مفقودة أو غير صالحة: ${missingFields.join(', ')}`);

    // Try partial parse — return what we can
    const partial = (typeof raw === 'object' && raw !== null) ? raw as Record<string, any> : {};
    const data = {
      documentType: 'ownership' as const,
      deedNumber: cleanTextField(partial.deedNumber || ''),
      deedDate: cleanDate(partial.deedDate || ''),
      owner: {
        name: cleanTextField(partial?.owner?.name || ''),
        idNumber: cleanIdNumber(partial?.owner?.idNumber || ''),
        idType: cleanTextField(partial?.owner?.idType || ''),
      },
      property: {
        type: cleanTextField(partial?.property?.type || ''),
        usage: cleanTextField(partial?.property?.usage || ''),
        location: {
          governorate: cleanTextField(partial?.property?.location?.governorate || ''),
          wilayat: cleanTextField(partial?.property?.location?.wilayat || ''),
          village: cleanTextField(partial?.property?.location?.village || ''),
          blockNumber: cleanNumber(partial?.property?.location?.blockNumber || ''),
          plotNumber: cleanNumber(partial?.property?.location?.plotNumber || ''),
          street: cleanTextField(partial?.property?.location?.street || ''),
        },
        area: {
          value: cleanNumber(partial?.property?.area?.value || ''),
          unit: cleanTextField(partial?.property?.area?.unit || 'متر مربع'),
        },
        boundaries: {
          north: cleanTextField(partial?.property?.boundaries?.north || ''),
          south: cleanTextField(partial?.property?.boundaries?.south || ''),
          east: cleanTextField(partial?.property?.boundaries?.east || ''),
          west: cleanTextField(partial?.property?.boundaries?.west || ''),
        },
        frontage: cleanNumber(partial?.property?.frontage || ''),
      },
      restrictions: Array.isArray(partial?.restrictions) ? partial.restrictions : [],
      notes: cleanTextField(partial?.notes || ''),
      confidence: typeof partial?.confidence === 'number' ? partial.confidence : 0.5,
    };

    const filledFields = [
      data.deedNumber, data.owner.name, data.owner.idNumber,
      data.property.location.governorate, data.property.location.wilayat,
      data.property.location.plotNumber, data.property.area.value,
    ].filter(Boolean).length;

    return {
      data,
      confidence: filledFields / 7,
      warnings,
      isValid: filledFields >= 3,
    };
  }

  const data = result.data;
  const filledFields = [
    data.deedNumber, data.owner.name, data.owner.idNumber,
    data.property.location.governorate, data.property.location.wilayat,
    data.property.location.plotNumber, data.property.area.value,
  ].filter(Boolean).length;

  if (filledFields < 5) {
    warnings.push(`فقط ${filledFields}/7 حقول أساسية تم ملؤها`);
  }

  return {
    data,
    confidence: data.confidence ?? (filledFields / 7),
    warnings,
    isValid: filledFields >= 3,
  };
}

/**
 * Validate extracted sketch data with Zod.
 */
export function validateSketch(raw: unknown): ValidationResult<ValidatedSketch> {
  const result = sketchSchema.safeParse(raw);
  const warnings: string[] = [];

  if (!result.success) {
    const missingFields = result.error.issues
      .map((i) => i.path.join('.'))
      .filter(Boolean);
    warnings.push(`حقول مفقودة أو غير صالحة: ${missingFields.join(', ')}`);

    const partial = (typeof raw === 'object' && raw !== null) ? raw as Record<string, any> : {};
    const data = {
      documentType: 'sketch' as const,
      drawingNumber: cleanTextField(partial.drawingNumber || ''),
      drawingDate: cleanDate(partial.drawingDate || ''),
      property: {
        location: {
          governorate: cleanTextField(partial?.property?.location?.governorate || ''),
          wilayat: cleanTextField(partial?.property?.location?.wilayat || ''),
          blockNumber: cleanNumber(partial?.property?.location?.blockNumber || ''),
          plotNumber: cleanNumber(partial?.property?.location?.plotNumber || ''),
        },
        area: {
          totalArea: cleanNumber(partial?.property?.area?.totalArea || ''),
          buildingArea: cleanNumber(partial?.property?.area?.buildingArea || ''),
          openArea: cleanNumber(partial?.property?.area?.openArea || ''),
          unit: cleanTextField(partial?.property?.area?.unit || 'متر مربع'),
        },
        dimensions: {
          width: cleanNumber(partial?.property?.dimensions?.width || ''),
          depth: cleanNumber(partial?.property?.dimensions?.depth || ''),
          frontage: cleanNumber(partial?.property?.dimensions?.frontage || ''),
          unit: cleanTextField(partial?.property?.dimensions?.unit || 'متر'),
        },
        boundaries: {
          north: cleanTextField(partial?.property?.boundaries?.north || ''),
          south: cleanTextField(partial?.property?.boundaries?.south || ''),
          east: cleanTextField(partial?.property?.boundaries?.east || ''),
          west: cleanTextField(partial?.property?.boundaries?.west || ''),
        },
        orientation: { northArrow: '', rotation: '' },
        buildings: [],
        facilities: [],
        roads: { north: '', south: '', east: '', west: '' },
      },
      scale: { ratio: '', unit: '' },
      confidence: typeof partial?.confidence === 'number' ? partial.confidence : 0.5,
    };

    const filledFields = [
      data.drawingNumber,
      data.property.location.governorate, data.property.location.wilayat,
      data.property.location.plotNumber, data.property.area.totalArea,
    ].filter(Boolean).length;

    return {
      data,
      confidence: filledFields / 5,
      warnings,
      isValid: filledFields >= 3,
    };
  }

  const data = result.data;
  const filledFields = [
    data.drawingNumber,
    data.property.location.governorate, data.property.location.wilayat,
    data.property.location.plotNumber, data.property.area.totalArea,
  ].filter(Boolean).length;

  if (filledFields < 4) {
    warnings.push(`فقط ${filledFields}/5 حقول أساسية تم ملؤها`);
  }

  return {
    data,
    confidence: data.confidence ?? (filledFields / 5),
    warnings,
    isValid: filledFields >= 3,
  };
}
