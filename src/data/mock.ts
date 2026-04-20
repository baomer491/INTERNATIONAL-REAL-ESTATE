import type {
  Bank, Beneficiary, Report, Notification, Task, AppSettings, DashboardStats,
  PropertyType, PropertyUsage, PropertyCondition, FinishingLevel,
  BeneficiaryRelation, ReportStatus, ApprovalStatus, FeesRanges
} from '@/types';

/* ===== Mock Data (empty — data comes from store/localStorage) ===== */
export const banks: Bank[] = [];
export const beneficiaries: Beneficiary[] = [];
export const reports: Report[] = [];
export const notifications: Notification[] = [];
export const tasks: Task[] = [];
export const loginLogs: import('@/types').LoginLog[] = [];
export const employees: import('@/types').Employee[] = [];
export const monthlyPerformance: { month: string; employeeId: string; reports: number; approvals: number; avgTime: number; fees: number }[] = [];

/* ===== Settings ===== */
export const settings: AppSettings = {
  officeName: 'مكتب العقارات الدولية',
  officeNameEn: 'International Real Estate Office',
  logo: '/logo.svg',
  reportPrefix: 'VER',
  reportNextNumber: 1,
  defaultCurrency: 'OMR',
  language: 'ar',
  theme: 'light',
  userName: '',
  userRole: '',
  userEmail: '',
  userPhone: '',
  defaultFees: 500,
  feesRanges: {
    land:                  { min: 50,  max: 70  },
    villa:                 { min: 100, max: 130 },
    apartment:             { min: 80,  max: 100 },
    residential_building:  { min: 100, max: 150 },
    commercial_building:   { min: 150, max: 250 },
    mixed_use:             { min: 150, max: 250 },
    farm:                  { min: 100, max: 200 },
    warehouse:             { min: 80,  max: 120 },
    shop:                  { min: 80,  max: 120 },
  } satisfies FeesRanges,
};

/* ===== Dashboard Stats ===== */
export const dashboardStats: DashboardStats = {
  totalReportsThisMonth: 0,
  completedReports: 0,
  inProgressReports: 0,
  pendingApprovalReports: 0,
  monthlyFees: 0
};

/* ===== Lookup Data ===== */
export const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'land', label: 'أرض' },
  { value: 'villa', label: 'فيلا' },
  { value: 'apartment', label: 'شقة' },
  { value: 'residential_building', label: 'مبنى سكني' },
  { value: 'commercial_building', label: 'مبنى تجاري' },
  { value: 'mixed_use', label: 'سكني تجاري' },
  { value: 'farm', label: 'مزرعة' },
  { value: 'warehouse', label: 'مستودع' },
  { value: 'shop', label: 'محل تجاري' },
];

export const propertyUsages: { value: PropertyUsage; label: string }[] = [
  { value: 'residential', label: 'سكني' },
  { value: 'commercial', label: 'تجاري' },
  { value: 'industrial', label: 'صناعي' },
  { value: 'agricultural', label: 'زراعي' },
  { value: 'investment', label: 'استثماري' },
];

export const propertyConditions: { value: PropertyCondition; label: string }[] = [
  { value: 'excellent', label: 'ممتاز' },
  { value: 'good', label: 'جيد' },
  { value: 'average', label: 'مقبول' },
  { value: 'below_average', label: 'دون المتوسط' },
  { value: 'poor', label: 'سيء' },
];

export const finishingLevels: { value: FinishingLevel; label: string }[] = [
  { value: 'luxury', label: 'فاخر' },
  { value: 'fully_finished', label: 'تشطيب كامل' },
  { value: 'semi_finished', label: 'تشطيب نصف كامل' },
  { value: 'not_finished', label: 'بدون تشطيب' },
];

export const reportStatuses: { value: ReportStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'مسودة', color: 'gray' },
  { value: 'in_progress', label: 'قيد الإنجاز', color: 'blue' },
  { value: 'pending_approval', label: 'بانتظار الاعتماد', color: 'amber' },
  { value: 'approved', label: 'معتمد', color: 'green' },
  { value: 'rejected', label: 'مرفوض', color: 'red' },
  { value: 'needs_revision', label: 'يحتاج تعديل', color: 'orange' },
  { value: 'archived', label: 'مؤرشف', color: 'purple' },
];

export const governorates = [
  'مسقط', 'الباطنة', 'الباطنة الشمالية', 'الباطنة الجنوبية',
  'الداخلية', 'الظاهرة', 'الشرقية', 'الوسطى',
  'ظفار', 'مسندم', 'البريمي'
];

export const services = [
  'كهرباء', 'ماء', 'إنترنت', 'غاز', 'تكييف مركزي',
  'مصعد', 'حارس أمن', 'موقف سيارات', 'حديقة', 'مسبح'
];

export const valuationMethods = [
  'طريقة السوق', 'طريقة التكلفة', 'طريقة الدخل',
  'طريقة السوق والتكلفة', 'طريقة الدخل والتكلفة', 'طريقة المقارنة'
];

export const riskLevels = [
  { value: 'low', label: 'منخفض' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'عالي' },
];

export const beneficiaryRelations: { value: BeneficiaryRelation; label: string }[] = [
  { value: 'owner', label: 'مالك' },
  { value: 'buyer', label: 'مشتري' },
  { value: 'bank_client', label: 'عميل البنك' },
  { value: 'legal_representative', label: 'ممثل قانوني' },
  { value: 'other', label: 'آخر' },
];

export const topographyOptions = [
  { value: 'leveled', label: 'مستوية' },
  { value: 'sloped', label: 'مائلة' },
  { value: 'elevated', label: 'مرتفعة' },
  { value: 'low_lying', label: 'منخفضة' },
  { value: 'mixed', label: 'ممزوجة' },
];

export const qualityOfSurroundingOptions = [
  { value: 'excellent', label: 'ممتاز' },
  { value: 'good', label: 'جيد' },
  { value: 'average', label: 'متوسط' },
  { value: 'poor', label: 'ضعيف' },
];

export const returnOnSaleRentOptions = [
  { value: 'excellent', label: 'ممتاز' },
  { value: 'good', label: 'جيد' },
  { value: 'average', label: 'متوسط' },
  { value: 'poor', label: 'ضعيف' },
];

export const purposeOfValuationOptions = [
  { value: 'loan', label: 'قرض' },
  { value: 'mortgage', label: 'رهن' },
  { value: 'sale', label: 'بيع' },
  { value: 'purchase', label: 'شراء' },
  { value: 'investment', label: 'استثمار' },
  { value: 'rental', label: 'تأجير' },
  { value: 'other', label: 'أخرى' },
];

export const zonedOptions = [
  { value: 'residential', label: 'سكني' },
  { value: 'commercial', label: 'تجاري' },
  { value: 'industrial', label: 'صناعي' },
  { value: 'agricultural', label: 'زراعي' },
  { value: 'mixed', label: 'مختلط' },
];

export const krookiMatchOptions = [
  { value: 'yes', label: 'نعم' },
  { value: 'no', label: 'لا' },
  { value: 'partial', label: 'جزئياً' },
];

export const allowableFloorsOptions = [
  { value: 'one', label: 'طابق واحد' },
  { value: 'two', label: 'طابقان' },
  { value: 'three', label: 'ثلاثة طوابق' },
  { value: 'four_plus', label: 'أربعة طوابق أو أكثر' },
  { value: 'na', label: 'غير محدد' },
];

export const buildingMatchOptions = [
  { value: 'yes', label: 'نعم' },
  { value: 'no', label: 'لا' },
  { value: 'partial', label: 'جزئياً' },
  { value: 'na', label: 'غير محدد' },
];

export const conditionOptions = [
  { value: 'excellent', label: 'ممتاز' },
  { value: 'good', label: 'جيد' },
  { value: 'average', label: 'متوسط' },
  { value: 'poor', label: 'ضعيف' },
  { value: 'new', label: 'جديد' },
];

export const apartmentComponentDefaults: { name: string; nameEn: string }[] = [
  { name: 'مجلس', nameEn: 'Majlis' },
  { name: 'صالة/صلاة', nameEn: 'Hall / Salah' },
  { name: 'طعام', nameEn: 'Dining' },
  { name: 'غرفة نوم', nameEn: 'Bedroom' },
  { name: 'مطبخ', nameEn: 'Kitchen' },
  { name: 'دورة مياه', nameEn: 'Toilet / W.C' },
  { name: 'غسيل/ملابس', nameEn: 'Washroom / Dressing' },
  { name: 'شرفة/بلكونة', nameEn: 'Veranda / Balcony' },
  { name: 'مخزن', nameEn: 'Store / Pantry' },
  { name: 'بهو/ممر', nameEn: 'Lobby / Passage' },
  { name: 'موقف سيارات', nameEn: 'Car Parking / Garage' },
  { name: 'غرفة صلاة/خدم', nameEn: 'Prayer Room / Servant Room' },
  { name: 'درج', nameEn: 'Staircase' },
];

export const internalFinishingDefaults: { description: string; descriptionEn: string }[] = [
  { description: 'بلاط الأرضيات', descriptionEn: 'Flooring Tiles' },
  { description: 'الجدران الداخلية', descriptionEn: 'Inside Walls' },
  { description: 'الأبواب', descriptionEn: 'Doors' },
  { description: 'الأدوات الصحية', descriptionEn: 'Sanitary Wares' },
  { description: 'الدرابزينات', descriptionEn: 'Hand-railings' },
  { description: 'وحدات المطبخ', descriptionEn: 'Kitchen Units' },
  { description: 'الإنارة', descriptionEn: 'Light Fittings' },
  { description: 'القواطع', descriptionEn: 'Skirting' },
];

export const wilayatData: Record<string, string[]> = {
  'مسقط': ['مطرح', 'السيب', 'العامرات', 'بهلاء', 'قريات', 'الخوض'],
  'الباطنة': ['صحار', 'الرستاق', 'السويق', 'البيحان', 'نخل', 'وادي المعاول'],
  'الباطنة الشمالية': ['صحار', 'شناص', 'ليوا', 'البريمي', 'خصب'],
  'الباطنة الجنوبية': ['الرستاق', 'نخل', 'وادي المعاول', 'السويق'],
  'الداخلية': ['نزوى', 'إبرا', 'سمائل', 'بدبد', 'منح', 'الحمراء'],
  'الشرقية': ['صور', 'إبراء', 'القابل', 'دماء والطائيين', 'وادي بني خالد'],
  'ظفار': ['صلالة', 'طاقة', 'مرباط', 'ثمريت', 'رخيوت'],
  'مسندم': ['خصب', 'مدحاء', 'الحاسنة', 'دبا'],
  'البريمي': ['البريمي', 'السنينة', 'محضة'],
  'الظاهرة': ['عبري', 'ينقل', 'محوت', 'الحصن', 'المنطف'],
  'الوسطى': ['هيما', 'الدقم', 'جعلان بني بوحسن', 'جعلان بني بو علي', 'المحيط'],
};
