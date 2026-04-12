/**
 * Oman Wilayat Coordinates & OmanReal URL Generators
 * Used to create direct links to omanreal.com map with proper location context
 */

export interface WilayatCoords {
    nameAr: string;
    nameEn: string;
    lat: number;
    lng: number;
    governorate: string;
}

/* ===== Wilayat Coordinates ===== */
export const WILAYAT_COORDS: WilayatCoords[] = [
    // محافظة مسقط
    { nameAr: 'السيب', nameEn: 'Seeb', lat: 23.6722, lng: 58.1792, governorate: 'مسقط' },
    { nameAr: 'بوشر', nameEn: 'Bousher', lat: 23.5806, lng: 58.3875, governorate: 'مسقط' },
    { nameAr: 'مطرح', nameEn: 'Muttrah', lat: 23.5833, lng: 58.4667, governorate: 'مسقط' },
    { nameAr: 'مسقط', nameEn: 'Muscat', lat: 23.5880, lng: 58.3829, governorate: 'مسقط' },
    { nameAr: 'العامرات', nameEn: 'Al Amrat', lat: 23.5500, lng: 58.5500, governorate: 'مسقط' },
    { nameAr: 'قريات', nameEn: 'Quriyat', lat: 23.2750, lng: 58.7900, governorate: 'مسقط' },
    // محافظة ظفار
    { nameAr: 'صلالة', nameEn: 'Salalah', lat: 17.0150, lng: 54.0924, governorate: 'ظفار' },
    { nameAr: 'طاقة', nameEn: 'Taqah', lat: 17.0333, lng: 54.4000, governorate: 'ظفار' },
    { nameAr: 'مرباط', nameEn: 'Mirbat', lat: 16.9667, lng: 54.7000, governorate: 'ظفار' },
    { nameAr: 'سدح', nameEn: 'Sadah', lat: 17.0500, lng: 55.0500, governorate: 'ظفار' },
    { nameAr: 'شليم والحلانيات', nameEn: 'Shalim', lat: 17.7000, lng: 55.3000, governorate: 'ظفار' },
    { nameAr: 'الشصر', nameEn: 'Al Shisr', lat: 18.2833, lng: 53.6333, governorate: 'ظفار' },
    { nameAr: 'رخيوت', nameEn: 'Rakhyut', lat: 16.8500, lng: 53.6500, governorate: 'ظفار' },
    { nameAr: 'ثمريت', nameEn: 'Thumrait', lat: 17.6000, lng: 54.0000, governorate: 'ظفار' },
    { nameAr: 'مقشين', nameEn: 'Muqshin', lat: 18.0167, lng: 53.6333, governorate: 'ظفار' },
    // محافظة الداخلية
    { nameAr: 'نزوى', nameEn: 'Nizwa', lat: 22.9333, lng: 57.5333, governorate: 'الداخلية' },
    { nameAr: 'سمائل', nameEn: 'Samail', lat: 23.3000, lng: 57.9500, governorate: 'الداخلية' },
    { nameAr: 'بهلاء', nameEn: 'Bahla', lat: 22.9833, lng: 57.3000, governorate: 'الداخلية' },
    { nameAr: 'أدم', nameEn: 'Adam', lat: 22.4667, lng: 57.4833, governorate: 'الداخلية' },
    { nameAr: 'الحمراء', nameEn: 'Al Hamra', lat: 23.2000, lng: 57.2833, governorate: 'الداخلية' },
    { nameAr: 'منح', nameEn: 'Manah', lat: 22.8000, lng: 57.6000, governorate: 'الداخلية' },
    { nameAr: 'إزكي', nameEn: 'Izki', lat: 22.9167, lng: 57.7667, governorate: 'الداخلية' },
    { nameAr: 'بدية', nameEn: 'Bidiyya', lat: 22.4667, lng: 58.0500, governorate: 'الداخلية' },
    // محافظة شمال الشرقية
    { nameAr: 'إبراء', nameEn: 'Ibra', lat: 22.6833, lng: 58.5167, governorate: 'شمال الشرقية' },
    { nameAr: 'المضيبي', nameEn: 'Al Mudaybi', lat: 22.4000, lng: 58.9000, governorate: 'شمال الشرقية' },
    { nameAr: 'بدية', nameEn: 'Bidiyya', lat: 22.4667, lng: 58.0500, governorate: 'شمال الشرقية' },
    { nameAr: 'القابل', nameEn: 'Al Qabil', lat: 22.2667, lng: 58.5833, governorate: 'شمال الشرقية' },
    { nameAr: 'وادي بني خالد', nameEn: 'Wadi Bani Khalid', lat: 22.6167, lng: 59.0000, governorate: 'شمال الشرقية' },
    { nameAr: 'دماء والطائيين', nameEn: 'Dama Wa Taiyyin', lat: 22.7500, lng: 58.8500, governorate: 'شمال الشرقية' },
    // محافظة جنوب الشرقية
    { nameAr: 'صور', nameEn: 'Sur', lat: 22.5667, lng: 59.5167, governorate: 'جنوب الشرقية' },
    { nameAr: 'جعلان بني بوحسن', nameEn: 'Jalan Bani Bu Hassan', lat: 22.0500, lng: 59.4333, governorate: 'جنوب الشرقية' },
    { nameAr: 'جعلان بني بوعلي', nameEn: 'Jalan Bani Bu Ali', lat: 21.9667, lng: 59.2833, governorate: 'جنوب الشرقية' },
    { nameAr: 'الكامل والوافي', nameEn: 'Al Kamel Wa Al Wafi', lat: 22.1833, lng: 59.1667, governorate: 'جنوب الشرقية' },
    { nameAr: 'مصيرة', nameEn: 'Masirah', lat: 20.5000, lng: 58.8333, governorate: 'جنوب الشرقية' },
    // محافظة شمال الباطنة
    { nameAr: 'صحار', nameEn: 'Sohar', lat: 24.3500, lng: 56.7000, governorate: 'شمال الباطنة' },
    { nameAr: 'شناص', nameEn: 'Shinas', lat: 24.9500, lng: 56.4667, governorate: 'شمال الباطنة' },
    { nameAr: 'الخابورة', nameEn: 'Al Khabourah', lat: 24.1333, lng: 56.7500, governorate: 'شمال الباطنة' },
    { nameAr: 'صحم', nameEn: 'Saham', lat: 24.1833, lng: 56.8833, governorate: 'شمال الباطنة' },
    { nameAr: 'لوى', nameEn: 'Liwa', lat: 24.5000, lng: 56.5333, governorate: 'شمال الباطنة' },
    { nameAr: 'السويق', nameEn: 'Al Suwayq', lat: 23.8500, lng: 57.0000, governorate: 'شمال الباطنة' },
    // محافظة جنوب الباطنة
    { nameAr: 'الرستاق', nameEn: 'Rustaq', lat: 23.3833, lng: 57.4167, governorate: 'جنوب الباطنة' },
    { nameAr: 'العوابي', nameEn: 'Al Awabi', lat: 23.3333, lng: 57.3167, governorate: 'جنوب الباطنة' },
    { nameAr: 'نخل', nameEn: 'Nakhal', lat: 23.3833, lng: 57.6667, governorate: 'جنوب الباطنة' },
    { nameAr: 'وادي المعاول', nameEn: 'Wadi Al Maawil', lat: 23.3500, lng: 57.6000, governorate: 'جنوب الباطنة' },
    { nameAr: 'بركاء', nameEn: 'Barka', lat: 23.7167, lng: 57.8833, governorate: 'جنوب الباطنة' },
    { nameAr: 'المصنعة', nameEn: 'Al Musannah', lat: 23.8000, lng: 57.7000, governorate: 'جنوب الباطنة' },
    // محافظة البريمي
    { nameAr: 'البريمي', nameEn: 'Al Buraimi', lat: 24.2500, lng: 55.7833, governorate: 'البريمي' },
    { nameAr: 'محضة', nameEn: 'Mahdha', lat: 24.0833, lng: 55.7500, governorate: 'البريمي' },
    { nameAr: 'السنينة', nameEn: 'As Sunaynah', lat: 24.2000, lng: 55.5833, governorate: 'البريمي' },
    // محافظة الظاهرة
    { nameAr: 'عبري', nameEn: 'Ibri', lat: 23.8667, lng: 56.5000, governorate: 'الظاهرة' },
    { nameAr: 'ينقل', nameEn: 'Yanqul', lat: 23.8167, lng: 56.0833, governorate: 'الظاهرة' },
    { nameAr: 'ضنك', nameEn: 'Dhank', lat: 23.7833, lng: 55.9500, governorate: 'الظاهرة' },
    { nameAr: 'محوت', nameEn: 'Mahut', lat: 23.7000, lng: 56.7167, governorate: 'الظاهرة' },
    // محافظة مسندم
    { nameAr: 'خور فكان', nameEn: 'Khasab', lat: 26.2167, lng: 56.2500, governorate: 'مسندم' },
    { nameAr: 'دبا', nameEn: 'Dibba', lat: 25.6167, lng: 56.2667, governorate: 'مسندم' },
    { nameAr: 'بخا', nameEn: 'Bukha', lat: 26.1333, lng: 56.1500, governorate: 'مسندم' },
    { nameAr: 'مدحاء', nameEn: 'Madha', lat: 25.2833, lng: 56.3167, governorate: 'مسندم' },
];

/* ===== Property Type ID Mapping for OmanReal URLs ===== */
export const PROPERTY_TYPE_URL_MAP: Record<string, { typeId: number; labelAr: string }> = {
    land: { typeId: 3, labelAr: 'أرض' },
    villa: { typeId: 8, labelAr: 'فيلا' },
    apartment: { typeId: 9, labelAr: 'شقة' },
    residential_building: { typeId: 8, labelAr: 'مبنى سكني' },
    commercial_building: { typeId: 11, labelAr: 'مبنى تجاري' },
    mixed_use: { typeId: 11, labelAr: 'استخدام مختلط' },
    farm: { typeId: 23, labelAr: 'مزرعة' },
    warehouse: { typeId: 13, labelAr: 'مستودع' },
    shop: { typeId: 14, labelAr: 'محل تجاري' },
};

/* ===== Lookup Helpers ===== */

/** Find coordinates for a wilayat by Arabic or English name */
export function getWilayatCoords(name: string): WilayatCoords | null {
    if (!name) return null;
    const normalized = name.trim();
    return WILAYAT_COORDS.find(w =>
        w.nameAr === normalized ||
        w.nameEn.toLowerCase() === normalized.toLowerCase() ||
        w.nameAr.includes(normalized) ||
        normalized.includes(w.nameAr)
    ) || null;
}

/* ===== OmanReal URL Generators ===== */

const OMANREAL_MAP_BASE = 'https://omanreal.com/p';
const OMANREAL_PROPERTY_BASE = 'https://omanreal.com/Properties';

/**
 * Generate a map URL on omanreal.com centered on a wilayat with optional filters
 * Example: https://omanreal.com/p?zoom=13&lat=23.6722&lng=58.1792&listingType=1&selectedTypeId=4
 */
export function generateOmanRealMapUrl(params: {
    wilayat: string;
    propertyType?: string;
    usage?: string;
    zoom?: number;
}): string {
    const coords = getWilayatCoords(params.wilayat);
    const lat = coords?.lat ?? 23.564743;
    const lng = coords?.lng ?? 61.061044;
    const zoom = params.zoom ?? 13;

    const url = new URL(OMANREAL_MAP_BASE);
    url.searchParams.set('zoom', String(zoom));
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lng', String(lng));
    url.searchParams.set('listingType', '1'); // For sale

    if (params.propertyType) {
        const typeId = PROPERTY_TYPE_URL_MAP[params.propertyType]?.typeId;
        // Map usage to specific land type IDs
        let finalTypeId = typeId || 3;
        if (params.propertyType === 'land') {
            if (params.usage === 'residential') finalTypeId = 4;
            else if (params.usage === 'commercial') finalTypeId = 5;
            else if (params.usage === 'industrial') finalTypeId = 6;
            else finalTypeId = 3;
        }
        url.searchParams.set('selectedTypeId', String(finalTypeId));
    }

    return url.toString();
}

/**
 * Generate a direct search URL on omanreal.com
 */
export function generateOmanRealSearchUrl(params: {
    wilayat: string;
    propertyType?: string;
    usage?: string;
}): string {
    return generateOmanRealMapUrl({ ...params, zoom: 12 });
}

/**
 * Generate a direct link to a specific property listing
 */
export function generatePropertyUrl(listingId: string | number, slug?: string): string {
    return `${OMANREAL_PROPERTY_BASE}/${listingId}${slug ? `/${slug}` : ''}`;
}