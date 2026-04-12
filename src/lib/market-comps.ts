import type { MarketComp, MarketCacheEntry } from '@/types';

const OMANREAL_BASE = 'https://api.omanreal.com';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'ireo_market_cache';

/* ===== Property Type ID Mapping (from /api/Structure/GetPropertyTypes) ===== */
const PROPERTY_TYPE_IDS: Record<string, number[]> = {
  land: [3, 4, 5, 6],
  villa: [8],
  apartment: [9],
  residential_building: [8],
  commercial_building: [11, 12],
  mixed_use: [11],
  farm: [23],
  warehouse: [11, 13],
  shop: [11, 14, 15],
};

const USAGE_TYPE_MAP: Record<string, number> = {
  residential: 4,
  commercial: 5,
  industrial: 6,
};

/* ===== Cache Helpers ===== */
function getCache(): MarketCacheEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCache(entries: MarketCacheEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    console.error('Failed to save market cache');
  }
}

function buildCacheKey(wilayat: string, propertyType: string, usage: string): string {
  return `${wilayat}_${propertyType}_${usage}`.toLowerCase().replace(/\s+/g, '_');
}

/* ===== Search from Cache ===== */
export function searchCache(wilayat: string, propertyType: string, usage: string): MarketComp[] {
  const key = buildCacheKey(wilayat, propertyType, usage);
  const cache = getCache();
  const entry = cache.find(e => e.key === key && new Date(e.expiresAt) > new Date());
  if (!entry) return [];
  return entry.results;
}

/* ===== Save to Cache ===== */
export function saveToCache(wilayat: string, propertyType: string, usage: string, results: MarketComp[], avgPricePerSqm: number): void {
  const key = buildCacheKey(wilayat, propertyType, usage);
  const cache = getCache();
  const existingIdx = cache.findIndex(e => e.key === key);
  const entry: MarketCacheEntry = {
    key,
    wilayat,
    propertyType,
    usage,
    results,
    avgPricePerSqm,
    fetchedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  };
  if (existingIdx !== -1) {
    cache[existingIdx] = entry;
  } else {
    cache.push(entry);
  }
  saveCache(cache);
}

/* ===== Get All Cache Stats ===== */
export function getCacheStats(): { total: number; active: number; expired: number; wilayats: string[] } {
  const cache = getCache();
  const now = new Date();
  const active = cache.filter(e => new Date(e.expiresAt) > now);
  const expired = cache.filter(e => new Date(e.expiresAt) <= now);
  const wilayats = [...new Set(cache.map(e => e.wilayat))];
  return { total: cache.length, active: active.length, expired: expired.length, wilayats };
}

/* ===== Clear Expired Cache ===== */
export function clearExpiredCache(): number {
  const cache = getCache();
  const now = new Date();
  const active = cache.filter(e => new Date(e.expiresAt) > now);
  saveCache(active);
  return cache.length - active.length;
}

/* ===== Resolve Address ID from OmanReal ===== */
async function resolveAddressId(wilayat: string): Promise<number | null> {
  try {
    const response = await fetch(`${OMANREAL_BASE}/api/MapData/GetAddresses?q=${encodeURIComponent(wilayat)}`, {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://omanreal.com/',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const governorates = Array.isArray(data) ? data : [];

    if (governorates.length === 0) return null;

    const wilayatLower = wilayat.toLowerCase().trim();
    const arabicWilayatMap: Record<string, string> = {
      'السيب': 'Seeb', 'سيب': 'Seeb',
      'بوشر': 'Bousher',
      'العامرات': 'Al Amrat', 'عامرات': 'Al Amrat',
      'مطرح': 'Muscat', 'مسقط': 'Muscat',
      'قريات': 'Quriat',
      'رمال': 'Rimal', 'صالحية': 'Salalah', 'صلالة': 'Salalah',
      'نخل': 'Nakhal', 'شناص': 'Shinas',
      'سمائل': 'Smail', 'إبراء': 'Ibra',
      'بدية': 'Badiya', 'محضة': 'Mahdha',
      'البريمي': 'Buraimi',
      'ضنك': 'Dank', 'حافت': 'Haima',
    };

    const englishMatch = arabicWilayatMap[wilayat] || arabicWilayatMap[wilayatLower];
    const searchNames = [wilayat, wilayatLower];
    if (englishMatch) searchNames.push(englishMatch.toLowerCase());

    for (const gov of governorates) {
      if (!gov.cities || !Array.isArray(gov.cities)) continue;
      for (const city of gov.cities) {
        const cityNameLower = (city.name || '').toLowerCase().trim();
        if (searchNames.some(n => cityNameLower === n || cityNameLower.includes(n) || n.includes(cityNameLower))) {
          return city.cityId || null;
        }
      }
    }

    for (const gov of governorates) {
      const govNameLower = (gov.name || '').toLowerCase().trim();
      if (searchNames.some(n => govNameLower === n || govNameLower.includes(n) || n.includes(govNameLower))) {
        if (gov.cities && gov.cities.length > 0) {
          return gov.cities[0].cityId || null;
        }
      }
      if (gov.cities && Array.isArray(gov.cities)) {
        for (const city of gov.cities) {
          const cityNameLower = (city.name || '').toLowerCase().trim();
          if (searchNames.some(n => cityNameLower === n || cityNameLower.includes(n) || n.includes(cityNameLower))) {
            return city.cityId || null;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/* ===== Get Guided Filter (features/structure for a type) ===== */
async function getGuidedFilter(typeId: number): Promise<any> {
  try {
    const response = await fetch(`${OMANREAL_BASE}/api/Listing/GetGuidedFilter?selectedTypeId=${typeId}`, {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://omanreal.com/',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/* ===== Find feature ID for land area ===== */
function findAreaFeatureId(guidedFilter: any): { featureId: number; isArea: boolean } | null {
  if (!guidedFilter) return null;

  const features = guidedFilter.features || guidedFilter.commonFeatures || [];
  for (const f of features) {
    if (f.isArea || f.title?.toLowerCase().includes('area') || f.title?.toLowerCase().includes('land area') ||
        f.title?.includes('مساحة') || f.title?.includes('المساحة')) {
      return { featureId: f.featureId, isArea: true };
    }
  }
  return null;
}

/* ===== Fetch from OmanReal API (POST) ===== */
export async function fetchOmanRealProperties(params: {
  wilayat: string;
  propertyType: string;
  area?: number;
  usage?: string;
  pageSize?: number;
}): Promise<{ properties: MarketComp[]; error?: string }> {
  const { wilayat, propertyType, area, usage, pageSize = 20 } = params;

  const typeIds = PROPERTY_TYPE_IDS[propertyType] || [3];
  const selectedTypeId = typeIds[0];

  if (usage === 'residential' && propertyType === 'land') {
    typeIds[0] = 4;
  } else if (usage === 'commercial' && propertyType === 'land') {
    typeIds[0] = 5;
  } else if (usage === 'industrial' && propertyType === 'land') {
    typeIds[0] = 6;
  }

  const finalTypeId = typeIds[0];

  try {
    const [addressId, guidedFilter] = await Promise.all([
      wilayat ? resolveAddressId(wilayat) : Promise.resolve(null),
      getGuidedFilter(finalTypeId),
    ]);

    const areaFeature = findAreaFeatureId(guidedFilter);

    const filters: Record<string, any> = {
      selectedTypeId: finalTypeId,
      listingType: 1,
    };

    if (addressId) {
      filters.addressId = addressId;
    }

    if (area && areaFeature) {
      filters[`f${areaFeature.featureId}_min`] = Math.round(area * 0.7);
      filters[`f${areaFeature.featureId}_max`] = Math.round(area * 1.3);
    }

    const requestBody = {
      maxNumItems: pageSize,
      sortOption: {
        sortDir: 2,
        sortBy: 4,
      },
      filters,
    };

    const response = await fetch(`${OMANREAL_BASE}/api/Listing/GetListings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': 'https://omanreal.com/p',
        'Origin': 'https://omanreal.com',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      if (response.status === 405) {
        return { properties: [], error: 'طريقة الطلب غير صحيحة (405)' };
      }
      return { properties: [], error: `خطأ من الخادم (${response.status})` };
    }

    const data = await response.json();

    const items = data?.items || data?.result?.items || data?.data || data?.listings || [];

    if (!Array.isArray(items) || items.length === 0) {
      if (!addressId && wilayat) {
        return fetchOmanRealPropertiesFallback(params);
      }
      return { properties: [], error: 'لا توجد نتائج مطابقة في هذه المنطقة' };
    }

    const properties: MarketComp[] = items.slice(0, pageSize).map((item: any, idx: number) => {
      const price = Number(item.price || item.getPrice || item.totalPrice || 0);
      const itemArea = Number(
        item.landArea || item.area || item.totalArea || item.size ||
        item.features?.find((f: any) => f.isArea)?.value || 0
      );
      const pricePerSqm = itemArea > 0 ? Math.round(price / itemArea) : 0;
      const itemId = item.id || item.listingId || item.propertyId || idx;
      const slug = item.slug || '';
      const title = item.summary || item.title || item.about || '';

      return {
        id: `omanreal-${itemId}`,
        title: title || `عقار في ${wilayat}`,
        propertyType: propertyType,
        wilayat: item.add1 || item.add2 || wilayat,
        area: itemArea,
        price,
        pricePerSqm,
        source: 'omanreal' as const,
        sourceUrl: `https://omanreal.com/Properties/${itemId}/${slug}`,
        fetchedAt: new Date().toISOString(),
      };
    }).filter((p: MarketComp) => p.price > 0);

    if (properties.length === 0 && wilayat) {
      return fetchOmanRealPropertiesFallback(params);
    }

    return { properties };
  } catch (err: any) {
    const msg = err?.name === 'TimeoutError' ? 'انتهت مهلة الاتصال' : err?.message || 'فشل الاتصال بالخادم';
    return { properties: [], error: msg };
  }
}

/* ===== Fallback: Gemini AI scraping ===== */
async function fetchOmanRealPropertiesFallback(params: {
  wilayat: string;
  propertyType: string;
  area?: number;
  usage?: string;
}): Promise<{ properties: MarketComp[]; error?: string }> {
  const { wilayat, propertyType, area, usage } = params;

  try {
    const searchUrl = `https://omanreal.com/p?listingType=1&selectedTypeId=${PROPERTY_TYPE_IDS[propertyType]?.[0] || 3}`;
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { properties: [], error: 'فشل تحميل صفحة البحث' };
    }

    const html = await response.text();

    const pricePattern = /(\d[\d,]+)\s*R\.O/g;
    const prices: number[] = [];
    let match;
    while ((match = pricePattern.exec(html)) !== null) {
      prices.push(Number(match[1].replace(/,/g, '')));
    }

    if (prices.length === 0) {
      return { properties: [], error: 'لم يتم العثور على أسعار' };
    }

    const typeLabel = propertyType === 'land' ? 'أرض' : propertyType === 'villa' ? 'فيلا' : propertyType;
    const properties: MarketComp[] = prices.slice(0, 5).map((price, idx) => {
      const estArea = area || 500;
      return {
        id: `fallback-${idx}`,
        title: `${typeLabel} في ${wilayat}`,
        propertyType,
        wilayat,
        area: estArea,
        price,
        pricePerSqm: Math.round(price / estArea),
        source: 'omanreal' as const,
        sourceUrl: 'https://omanreal.com/p',
        fetchedAt: new Date().toISOString(),
      };
    });

    return { properties };
  } catch {
    return { properties: [], error: 'فشلت جميع طرق البحث' };
  }
}
