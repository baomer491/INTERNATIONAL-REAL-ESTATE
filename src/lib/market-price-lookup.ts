/**
 * Market Price Lookup — reads `ireo_market_prices` from localStorage
 * and provides helpers for the preliminary valuation page.
 */

export interface PriceRange {
  low: number | null;
  high: number | null;
}

export interface AreaPriceInfo {
  areaName: string;
  price: PriceRange;
}

export interface WilayatPriceInfo {
  wilayatName: string;
  areas: AreaPriceInfo[];
  /** Aggregated price across all areas in this wilayat */
  avgPrice: PriceRange;
}

export interface GovernoratePriceInfo {
  governorateName: string;
  wilayats: WilayatPriceInfo[];
}

export interface MarketLookupResult {
  governorates: GovernoratePriceInfo[];
}

/**
 * Map PropertyType → market price key used in ireo_market_prices
 */
const PROPERTY_TYPE_TO_MARKET_KEY: Record<string, string> = {
  land: 'residential',
  villa: 'residential',
  apartment: 'residential',
  residential_building: 'residential',
  commercial_building: 'residential_commercial',
  mixed_use: 'residential_commercial',
  farm: 'agricultural',
  warehouse: 'industrial',
  shop: 'residential_commercial',
};

export function getPropertyTypeMarketKey(propertyType: string): string {
  return PROPERTY_TYPE_TO_MARKET_KEY[propertyType] || 'residential';
}

// Cached seed data to avoid repeated fetches
let _seedCache: any = null;

/** Read raw market data from localStorage, falling back to seed file */
function getRawData(): any {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ireo_market_prices');
    if (raw && raw !== '{}') return JSON.parse(raw);
    // Return cached seed if available
    if (_seedCache) return _seedCache;
    return null;
  } catch {
    return null;
  }
}

/** Load seed data from /data/market-prices.json (call once at app startup) */
export async function loadSeedMarketData(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('ireo_market_prices');
    if (saved && saved !== '{}') return; // Already has data
    const res = await fetch('/data/market-prices.json');
    const data = await res.json();
    if (data?.governorates) {
      _seedCache = data;
      localStorage.setItem('ireo_market_prices', JSON.stringify(data));
    }
  } catch {}
}

/** Get list of governorate names from market data */
export function getGovernorates(): GovernoratePriceInfo[] {
  const raw = getRawData();
  if (!raw?.governorates) return [];

  const govs: GovernoratePriceInfo[] = [];
  const govEntries = Array.isArray(raw.governorates)
    ? raw.governorates
    : Object.values(raw.governorates);

  for (const gov of govEntries) {
    const govName = gov.governorate_name || gov.name_ar || gov.name || '';
    const wilayats: WilayatPriceInfo[] = [];

    // Handle array-based wilayats
    if (Array.isArray(gov.wilayats)) {
      for (const w of gov.wilayats) {
        wilayats.push(normalizeWilayat(w));
      }
    }
    // Handle legacy object-based regions
    if (gov.regions && typeof gov.regions === 'object' && !Array.isArray(gov.regions)) {
      for (const reg of Object.values(gov.regions)) {
        wilayats.push(normalizeWilayat(reg as any));
      }
    }

    govs.push({ governorateName: govName, wilayats });
  }

  return govs;
}

/** Normalize a wilayat/region entry */
function normalizeWilayat(w: any): WilayatPriceInfo {
  const wilayatName = w.wilayat_name || w.name_ar || w.name || '';
  const areas: AreaPriceInfo[] = [];
  const priceKeyMap = PROPERTY_TYPE_TO_MARKET_KEY;

  // We need to aggregate all price types for each area
  const areaArray = Array.isArray(w.areas) ? w.areas : Array.isArray(w.locations) ? w.locations : [];

  for (const a of areaArray) {
    areas.push({ areaName: a.area_name || a.area || a.name || a.name_ar || '', price: { low: null, high: null } });
  }

  return {
    wilayatName,
    areas,
    avgPrice: { low: null, high: null },
  };
}

/**
 * Get price range for a specific governorate + wilayat + property type.
 * Aggregates across all areas in the wilayat.
 */
export function getPriceForLocation(
  governorateName: string,
  wilayatName: string,
  propertyType: string,
): PriceRange {
  const raw = getRawData();
  if (!raw?.governorates) return { low: null, high: null };

  const marketKey = getPropertyTypeMarketKey(propertyType);
  let allLows: number[] = [];
  let allHighs: number[] = [];

  const govEntries = Array.isArray(raw.governorates)
    ? raw.governorates
    : Object.values(raw.governorates as Record<string, any>);

  // Find the matching governorate (fuzzy match)
  const gov = govEntries.find((g: any) => {
    const name = g.governorate_name || g.name_ar || g.name || '';
    return name.includes(governorateName) || governorateName.includes(name);
  });

  if (!gov) return { low: null, high: null };

  // Find matching wilayat
  const allWilayats: any[] = [];
  if (Array.isArray(gov.wilayats)) {
    allWilayats.push(...gov.wilayats);
  }
  if (gov.regions && typeof gov.regions === 'object' && !Array.isArray(gov.regions)) {
    allWilayats.push(...Object.values(gov.regions));
  }

  const wilayat = allWilayats.find((w: any) => {
    const name = w.wilayat_name || w.name_ar || w.name || '';
    return name.includes(wilayatName) || wilayatName.includes(name);
  });

  if (!wilayat) return { low: null, high: null };

  // Aggregate prices from areas
  const areaArray = Array.isArray(wilayat.areas) ? wilayat.areas : Array.isArray(wilayat.locations) ? wilayat.locations : [];

  for (const area of areaArray) {
    const price = extractPrice(area, marketKey);
    if (price.low != null) allLows.push(price.low);
    if (price.high != null) allHighs.push(price.high);
  }

  return {
    low: allLows.length > 0 ? Math.min(...allLows) : null,
    high: allHighs.length > 0 ? Math.max(...allHighs) : null,
  };
}

/** Extract price from an area object for a given market key */
function extractPrice(area: any, marketKey: string): PriceRange {
  // Flat min/max format: residential_min, commercial_min, tourism_min, etc.
  const keyMap: Record<string, { min: string; max: string }> = {
    residential: { min: 'residential_min', max: 'residential_max' },
    residential_commercial: { min: 'commercial_min', max: 'commercial_max' },
    industrial: { min: 'industrial_min', max: 'industrial_max' },
    agricultural: { min: 'agricultural_min', max: 'agricultural_max' },
    tourist: { min: 'tourism_min', max: 'tourism_max' },
  };

  const mapping = keyMap[marketKey];
  if (mapping) {
    const min = area[mapping.min];
    const max = area[mapping.max];
    if (min != null || max != null) {
      return {
        low: min != null && typeof min === 'number' ? min : null,
        high: max != null && typeof max === 'number' ? max : null,
      };
    }
  }

  // Legacy nested format: { residential: { low, high }, ... }
  if (area[marketKey] && typeof area[marketKey] === 'object') {
    return {
      low: area[marketKey].low ?? area[marketKey].high ?? null,
      high: area[marketKey].high ?? area[marketKey].low ?? null,
    };
  }

  // Range string format: { residential: "33.53-57.13" }
  if (typeof area[marketKey] === 'string') {
    return parseRangeString(area[marketKey]);
  }

  return { low: null, high: null };
}

function parseRangeString(rangeStr: string): PriceRange {
  if (!rangeStr || typeof rangeStr !== 'string') return { low: null, high: null };
  const parts = rangeStr.split('-').map((s: string) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { low: Math.min(parts[0], parts[1]), high: Math.max(parts[0], parts[1]) };
  }
  if (parts.length === 1 && !isNaN(parts[0])) {
    return { low: parts[0], high: parts[0] };
  }
  return { low: null, high: null };
}

/**
 * Get list of wilayat names for a given governorate
 */
export function getWilayatsForGovernorate(governorateName: string): string[] {
  const raw = getRawData();
  if (!raw?.governorates) return [];

  const govEntries = Array.isArray(raw.governorates)
    ? raw.governorates
    : Object.values(raw.governorates as Record<string, any>);

  const gov = govEntries.find((g: any) => {
    const name = g.governorate_name || g.name_ar || g.name || '';
    return name.includes(governorateName) || governorateName.includes(name);
  });

  if (!gov) return [];

  const wilayats: string[] = [];
  if (Array.isArray(gov.wilayats)) {
    for (const w of gov.wilayats) {
      wilayats.push(w.wilayat_name || w.name_ar || w.name || '');
    }
  }
  if (gov.regions && typeof gov.regions === 'object' && !Array.isArray(gov.regions)) {
    for (const reg of Object.values(gov.regions) as any[]) {
      wilayats.push(reg.wilayat_name || reg.name_ar || reg.name || '');
    }
  }

  return wilayats;
}

/**
 * Get list of all governorate names
 */
export function getGovernorateNames(): string[] {
  const raw = getRawData();
  if (!raw?.governorates) return [];

  const govEntries = Array.isArray(raw.governorates)
    ? raw.governorates
    : Object.values(raw.governorates as Record<string, any>);

  return govEntries.map((g: any) => g.governorate_name || g.name_ar || g.name || '').filter(Boolean);
}
