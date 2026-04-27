/**
 * Market Prices Data Utilities
 * Handles normalization, parsing, and persistence of market price data
 */

export const PROPERTY_TYPES = {
  residential: { label: 'سكني', labelEn: 'Residential', color: '#4a90d9' },
  residential_commercial: { label: 'سكني تجاري', labelEn: 'Residential Commercial', color: '#22c55e' },
  industrial: { label: 'صناعي', labelEn: 'Industrial', color: '#f59e0b' },
  agricultural: { label: 'زراعي', labelEn: 'Agricultural', color: '#84cc16' },
  tourist: { label: 'سياحي', labelEn: 'Tourist', color: '#a855f7' },
} as const;

export type PropertyTypeKey = keyof typeof PROPERTY_TYPES;

export interface AreaPrice {
  high: number | null;
  low: number | null;
}

export interface Area {
  id: number;
  name: string;
  tourist: AreaPrice;
  agricultural: AreaPrice;
  industrial: AreaPrice;
  residential_commercial: AreaPrice;
  residential: AreaPrice;
}

export interface Region {
  name_ar: string;
  name_en: string;
  areas: Area[];
}

export interface Governorate {
  name_ar: string;
  name_en: string;
  regions?: { [key: string]: Region };
  areas?: Area[];
}

export interface MarketData {
  governorates: { [key: string]: Governorate };
  price_summary: {
    highest_prices: { [key: string]: { value: number; location: string; unit: string } };
    lowest_prices: { [key: string]: { value: number; location: string; unit: string } };
  };
  statistics: {
    total_governorates: number;
    total_regions: number;
    total_areas: number;
    price_categories: string[];
  };
}

export const STORAGE_KEY = 'ireo_market_prices';

export const EMPTY_MARKET_DATA: MarketData = {
  governorates: {},
  price_summary: {
    highest_prices: {
      tourist: { value: 0, location: '', unit: 'OMR/m²' },
      agricultural: { value: 0, location: '', unit: 'OMR/m²' },
      industrial: { value: 0, location: '', unit: 'OMR/m²' },
      residential_commercial: { value: 0, location: '', unit: 'OMR/m²' },
      residential: { value: 0, location: '', unit: 'OMR/m²' },
    },
    lowest_prices: {
      tourist: { value: 0, location: '', unit: 'OMR/m²' },
      agricultural: { value: 0, location: '', unit: 'OMR/m²' },
      industrial: { value: 0, location: '', unit: 'OMR/m²' },
      residential_commercial: { value: 0, location: '', unit: 'OMR/m²' },
      residential: { value: 0, location: '', unit: 'OMR/m²' },
    },
  },
  statistics: {
    total_governorates: 0,
    total_regions: 0,
    total_areas: 0,
    price_categories: ['tourist', 'agricultural', 'industrial', 'residential_commercial', 'residential'],
  },
};

export function createEmptyArea(id: number, name: string): Area {
  return {
    id,
    name,
    tourist: { high: null, low: null },
    agricultural: { high: null, low: null },
    industrial: { high: null, low: null },
    residential_commercial: { high: null, low: null },
    residential: { high: null, low: null },
  };
}

function parseRangeString(rangeStr: string | null | undefined): AreaPrice {
  if (!rangeStr || typeof rangeStr !== 'string') return { high: null, low: null };
  const cleaned = rangeStr.trim().replace(/^[-]/, '');
  if (!cleaned) return { high: null, low: null };
  const parts = cleaned.split('-').map((s: string) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { low: Math.min(parts[0], parts[1]), high: Math.max(parts[0], parts[1]) };
  }
  if (parts.length === 1 && !isNaN(parts[0])) {
    return { low: parts[0], high: parts[0] };
  }
  return { high: null, low: null };
}

function flatToPrice(min: any, max: any): AreaPrice {
  const low = (min != null && typeof min === 'number') ? min : null;
  const high = (max != null && typeof max === 'number') ? max : null;
  return { low, high };
}

export function normalizeRawData(raw: any): MarketData {
  if (!raw || !raw.governorates) return EMPTY_MARKET_DATA;

  const normalizeFlatArea = (item: any, idx: number): Area => ({
    id: item.no ?? item.id ?? idx + 1,
    name: item.area_name || item.area || item.name || item.name_ar || `منطقة ${idx + 1}`,
    residential: flatToPrice(item.residential_min, item.residential_max),
    residential_commercial: flatToPrice(item.commercial_min, item.commercial_max),
    industrial: flatToPrice(item.industrial_min, item.industrial_max),
    agricultural: flatToPrice(item.agricultural_min, item.agricultural_max),
    tourist: flatToPrice(item.tourism_min, item.tourism_max),
  });

  const normalizeLocationArea = (item: any, idx: number): Area => ({
    id: item.no ?? item.id ?? idx + 1,
    name: item.area || item.area_name || item.name || item.name_ar || `منطقة ${idx + 1}`,
    residential: parseRangeString(item.residential),
    residential_commercial: parseRangeString(item.commercial),
    industrial: parseRangeString(item.industrial),
    agricultural: parseRangeString(item.agricultural),
    tourist: parseRangeString(item.tourism),
  });

  const normalizeLegacyArea = (item: any, idx: number): Area => ({
    id: item.id ?? idx + 1,
    name: item.name || item.name_ar || item.neighborhood || item.block || `مربع ${idx + 1}`,
    tourist: item.tourist || { high: null, low: null },
    agricultural: item.agricultural || { high: null, low: null },
    industrial: item.industrial || { high: null, low: null },
    residential_commercial: item.residential_commercial || item.commercial || { high: null, low: null },
    residential: item.residential || { high: null, low: null },
  });

  const normalizeArea = (item: any, idx: number): Area => {
    if (item.residential_min !== undefined || item.commercial_min !== undefined || item.tourism_min !== undefined) {
      return normalizeFlatArea(item, idx);
    }
    if (typeof item.residential === 'string' || typeof item.commercial === 'string') {
      return normalizeLocationArea(item, idx);
    }
    return normalizeLegacyArea(item, idx);
  };

  const normalizeWilayat = (w: any, fallbackKey: string): Region => ({
    name_ar: w.wilayat_name || w.name_ar || w.name || fallbackKey,
    name_en: w.wilayat_name_en || w.name_en || '',
    areas: (Array.isArray(w.areas) ? w.areas : Array.isArray(w.locations) ? w.locations : []).map(normalizeArea),
  });

  const rawGovs: [string, any][] = Array.isArray(raw.governorates)
    ? raw.governorates.map((g: any, i: number) => [
        g.governorate_name_en
          ? g.governorate_name_en.toLowerCase().replace(/[^a-z]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
          : `gov_${i}`,
        g,
      ])
    : Object.entries(raw.governorates as Record<string, any>);

  const normalizedGovs: { [key: string]: Governorate } = {};
  let regionCount = 0;
  let areaCount = 0;

  for (const [govKey, rawGov] of rawGovs) {
    const nameAr = rawGov.governorate_name || rawGov.name_ar || rawGov.name || govKey;
    const nameEn = rawGov.governorate_name_en || rawGov.name_en || '';
    const gov: Governorate = { name_ar: nameAr, name_en: nameEn };

    if (Array.isArray(rawGov.wilayats) && rawGov.wilayats.length > 0) {
      gov.regions = {};
      rawGov.wilayats.forEach((w: any, wIdx: number) => {
        const regKey = w.wilayat_name || w.name_ar || w.name || `region_${wIdx}`;
        const region = normalizeWilayat(w, regKey);
        gov.regions![regKey] = region;
        areaCount += region.areas.length;
        regionCount++;
      });
    } else {
      const subKeys = ['regions', 'districts', 'wilayat', 'states', 'cities'];
      let foundSub = false;
      for (const k of subKeys) {
        if (rawGov[k] && typeof rawGov[k] === 'object' && !Array.isArray(rawGov[k]) && Object.keys(rawGov[k]).length > 0) {
          if (!gov.regions) gov.regions = {};
          for (const [regKey, rawReg] of Object.entries(rawGov[k])) {
            const reg = rawReg as any;
            const leafArr = Array.isArray(reg.areas) ? reg.areas : Array.isArray(reg.locations) ? reg.locations : [];
            const region: Region = {
              name_ar: reg.wilayat_name || reg.name_ar || reg.name || regKey,
              name_en: reg.wilayat_name_en || reg.name_en || '',
              areas: leafArr.map(normalizeArea),
            };
            gov.regions[regKey] = region;
            areaCount += region.areas.length;
            regionCount++;
          }
          foundSub = true;
          break;
        }
      }
      const leafKeys = ['areas', 'neighborhoods', 'blocks', 'locations'];
      for (const k of leafKeys) {
        if (Array.isArray(rawGov[k]) && rawGov[k].length > 0) {
          gov.areas = rawGov[k].map(normalizeArea);
          areaCount += gov.areas.length;
          foundSub = true;
          break;
        }
      }
      if (!foundSub) {
        gov.areas = [];
        gov.regions = {};
      }
    }
    normalizedGovs[govKey] = gov;
  }

  const newHighest: MarketData['price_summary']['highest_prices'] = {
    tourist: { value: 0, location: '', unit: 'OMR/m²' },
    agricultural: { value: 0, location: '', unit: 'OMR/m²' },
    industrial: { value: 0, location: '', unit: 'OMR/m²' },
    residential_commercial: { value: 0, location: '', unit: 'OMR/m²' },
    residential: { value: 0, location: '', unit: 'OMR/m²' },
  };
  const newLowest: MarketData['price_summary']['lowest_prices'] = {
    tourist: { value: Infinity, location: '', unit: 'OMR/m²' },
    agricultural: { value: Infinity, location: '', unit: 'OMR/m²' },
    industrial: { value: Infinity, location: '', unit: 'OMR/m²' },
    residential_commercial: { value: Infinity, location: '', unit: 'OMR/m²' },
    residential: { value: Infinity, location: '', unit: 'OMR/m²' },
  };

  const processAreas = (areas: Area[], govName: string) => {
    areas.forEach((area) => {
      (Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).forEach((type) => {
        const price = area[type];
        if (!price) return;
        const location = `${area.name} - ${govName}`;
        if (price.high != null && price.high > newHighest[type].value) {
          newHighest[type] = { value: price.high, location, unit: 'OMR/m²' };
        }
        if (price.low != null && price.low < newLowest[type].value) {
          newLowest[type] = { value: price.low, location, unit: 'OMR/m²' };
        }
      });
    });
  };

  Object.values(normalizedGovs).forEach((gov) => {
    if (gov.regions) {
      Object.values(gov.regions).forEach((reg) => {
        if (reg.areas) processAreas(reg.areas, gov.name_ar);
      });
    }
    if (gov.areas) processAreas(gov.areas, gov.name_ar);
  });

  (Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).forEach((type) => {
    if (newLowest[type].value === Infinity) newLowest[type].value = 0;
  });

  return {
    governorates: normalizedGovs,
    price_summary: { highest_prices: newHighest, lowest_prices: newLowest },
    statistics: {
      total_governorates: rawGovs.length,
      total_regions: regionCount,
      total_areas: areaCount,
      price_categories: ['tourist', 'agricultural', 'industrial', 'residential_commercial', 'residential'],
    },
  };
}

export function recalculateSummary(data: MarketData): MarketData {
  const newHighest: MarketData['price_summary']['highest_prices'] = {
    tourist: { value: 0, location: '', unit: 'OMR/m²' },
    agricultural: { value: 0, location: '', unit: 'OMR/m²' },
    industrial: { value: 0, location: '', unit: 'OMR/m²' },
    residential_commercial: { value: 0, location: '', unit: 'OMR/m²' },
    residential: { value: 0, location: '', unit: 'OMR/m²' },
  };
  const newLowest: MarketData['price_summary']['lowest_prices'] = {
    tourist: { value: Infinity, location: '', unit: 'OMR/m²' },
    agricultural: { value: Infinity, location: '', unit: 'OMR/m²' },
    industrial: { value: Infinity, location: '', unit: 'OMR/m²' },
    residential_commercial: { value: Infinity, location: '', unit: 'OMR/m²' },
    residential: { value: Infinity, location: '', unit: 'OMR/m²' },
  };

  const processAreas = (areas: Area[], govName: string) => {
    areas.forEach((area) => {
      (Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).forEach((type) => {
        const price = area[type];
        const location = `${area.name} - ${govName}`;
        if (price.high != null && price.high > newHighest[type].value) {
          newHighest[type] = { value: price.high, location, unit: 'OMR/m²' };
        }
        if (price.low != null && price.low < newLowest[type].value) {
          newLowest[type] = { value: price.low, location, unit: 'OMR/m²' };
        }
      });
    });
  };

  Object.entries(data.governorates).forEach(([_, gov]) => {
    if (gov.regions) {
      Object.values(gov.regions).forEach((reg) => processAreas(reg.areas, gov.name_ar));
    }
    if (gov.areas) processAreas(gov.areas, gov.name_ar);
  });

  (Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).forEach((type) => {
    if (newLowest[type].value === Infinity) newLowest[type].value = 0;
  });

  return {
    ...data,
    price_summary: { highest_prices: newHighest, lowest_prices: newLowest },
  };
}

export function countAreas(data: MarketData): number {
  let count = 0;
  Object.values(data.governorates).forEach((gov) => {
    if (gov.regions) Object.values(gov.regions).forEach((reg) => { count += reg.areas.length; });
    if (gov.areas) count += gov.areas.length;
  });
  return count;
}

export function countRegions(data: MarketData): number {
  let count = 0;
  Object.values(data.governorates).forEach((gov) => {
    if (gov.regions) count += Object.keys(gov.regions).length;
  });
  return count;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, '').trim();
  if (cleaned === '' || isNaN(Number(cleaned))) return null;
  return Number(cleaned);
}

export function loadMarketData(): MarketData {
  if (typeof window === 'undefined') return EMPTY_MARKET_DATA;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return normalizeRawData(parsed);
    }
  } catch (e) {
    console.error('Error loading market data:', e);
  }
  return EMPTY_MARKET_DATA;
}

export function saveMarketData(data: MarketData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving market data:', e);
  }
}
