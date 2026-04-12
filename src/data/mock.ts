import type {
  Bank, Beneficiary, Report, Notification, Task, AppSettings, DashboardStats,
  ReportStatus, PropertyType, PropertyUsage, PropertyCondition, FinishingLevel,
  DevelopmentStatus, BeneficiaryRelation, NotificationType, NotificationPriority,
  TaskPriority, TaskStatus, ApprovalStatus
} from '@/types';

/* ===== Banks ===== */
export const banks: Bank[] = [
  {
    id: 'b1', name: 'البنك المركزي العماني', nameEn: 'Central Bank of Oman',
    logo: '/bank-logos/cbo.svg', isActive: true, reportTemplate: 'standard',
    contactPerson: 'أحمد الراشدي', phone: '24768000', email: 'info@cbo.gov.om', address: 'مسقط'
  },
  {
    id: 'b2', name: 'بنك مسقط', nameEn: 'Bank Muscat',
    logo: '/bank-logos/bm.svg', isActive: true, reportTemplate: 'standard',
    contactPerson: 'سعيد الحارثي', phone: '24778888', email: 'info@bankmuscat.com', address: 'مسقط - روي'
  },
  {
    id: 'b3', name: 'بنك صحار الدولي', nameEn: 'Sohar International Bank',
    logo: '/bank-logos/sohar.svg', isActive: true, reportTemplate: 'detailed',
    contactPerson: 'خالد العمري', phone: '24649000', email: 'info@soharinternational.com', address: 'مسقط'
  },
  {
    id: 'b4', name: 'البنك الوطني العماني', nameEn: 'National Bank of Oman',
    logo: '/bank-logos/nbo.svg', isActive: true, reportTemplate: 'standard',
    contactPerson: 'فاطمة البوسعيدية', phone: '24770000', email: 'info@nbo.om', address: 'مسقط'
  },
  {
    id: 'b5', name: 'بنك ظفار', nameEn: 'Dhofar Bank',
    logo: '/bank-logos/dhofar.svg', isActive: true, reportTemplate: 'standard',
    contactPerson: 'محمد السالمي', phone: '24795555', email: 'info@dhfrbank.com', address: 'صلالة'
  },
  {
    id: 'b6', name: 'بنك عمان العربي', nameEn: 'Ahlibank',
    logo: '/bank-logos/ahli.svg', isActive: true, reportTemplate: 'detailed',
    contactPerson: 'عبدالله الحبسي', phone: '24771111', email: 'info@ahlibank.om', address: 'مسقط'
  },
  {
    id: 'b7', name: 'بنك نزوى', nameEn: 'Nizwa Bank',
    logo: '/bank-logos/nizwa.svg', isActive: false, reportTemplate: 'standard',
    contactPerson: 'يوسف الكندي', phone: '25410000', email: 'info@nfrbank.com', address: 'نزوى'
  },
];

/* ===== Beneficiaries ===== */
export const beneficiaries: Beneficiary[] = [
  {
    id: 'bn1', fullName: 'محمد سعيد الراشدي', civilId: '12345678',
    phone: '91234567', email: 'mohamed@email.com', address: 'مسقط - الخوض',
    relation: 'owner', workplace: 'وزارة التربية والتعليم',
    notes: '', reportsCount: 3, lastReportDate: '2025-12-15', banksIds: ['b1', 'b2']
  },
  {
    id: 'bn2', fullName: 'فاطمة أحمد البوسعيدية', civilId: '23456789',
    phone: '92345678', email: 'fatima@email.com', address: 'صلالة - حي السعادة',
    relation: 'owner', workplace: '',
    notes: 'مستثمرة', reportsCount: 1, lastReportDate: '2025-11-20', banksIds: ['b5']
  },
  {
    id: 'bn3', fullName: 'عبدالله خالد الحبسي', civilId: '34567890',
    phone: '93456789', email: 'abdullah@email.com', address: 'نزوى - الحارة',
    relation: 'buyer', workplace: 'شركة عمان للاتصالات',
    notes: '', reportsCount: 2, lastReportDate: '2026-01-05', banksIds: ['b3', 'b4']
  },
  {
    id: 'bn4', fullName: 'عائشة يوسف الكندية', civilId: '45678901',
    phone: '94567890', email: 'aisha@email.com', address: 'صحار - الصناعية',
    relation: 'bank_client', workplace: '',
    notes: '', reportsCount: 1, lastReportDate: '2026-02-10', banksIds: ['b2']
  },
  {
    id: 'bn5', fullName: 'سعيد ناصر السالمي', civilId: '56789012',
    phone: '95678901', email: 'said@email.com', address: 'البريمي - وادي العين',
    relation: 'owner', workplace: 'أعمال حرة',
    notes: 'مزرعة نخيل', reportsCount: 2, lastReportDate: '2025-10-18', banksIds: ['b6']
  },
  {
    id: 'bn6', fullName: 'خالد جمعة العمري', civilId: '67890123',
    phone: '96789012', email: 'khaled@email.com', address: 'مسقط - القرم',
    relation: 'legal_representative', workplace: 'مكتب محاماة العمري',
    notes: 'وكيل قانوني', reportsCount: 4, lastReportDate: '2026-03-01', banksIds: ['b1', 'b2', 'b4']
  },
  {
    id: 'bn7', fullName: 'نورة حمد البلوشية', civilId: '78901234',
    phone: '97890123', email: 'noura@email.com', address: 'صور - وادي بني خالد',
    relation: 'owner', workplace: '',
    notes: '', reportsCount: 1, lastReportDate: '2026-02-28', banksIds: ['b3']
  },
  {
    id: 'bn8', fullName: 'ياسر راشد الهاشمي', civilId: '89012345',
    phone: '98901234', email: 'yasser@email.com', address: 'إبرا - حي الرياض',
    relation: 'buyer', workplace: 'بنك مسقط',
    notes: 'موظف بنك', reportsCount: 3, lastReportDate: '2026-01-20', banksIds: ['b2', 'b6']
  },
];

/* ===== Helper to generate dates ===== */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/* ===== Reports ===== */
export const reports: Report[] = [
  {
    id: 'r1', reportNumber: 'VER-2026-001',
    bankId: 'b2', bankName: 'بنك مسقط',
    beneficiaryId: 'bn1', beneficiaryName: 'محمد سعيد الراشدي',
    beneficiaryCivilId: '12345678', beneficiaryPhone: '91234567',
    beneficiaryEmail: 'mohamed@email.com', beneficiaryAddress: 'مسقط - الخوض',
    beneficiaryRelation: 'owner', beneficiaryWorkplace: 'وزارة التربية والتعليم',
    propertyType: 'villa', propertyUsage: 'residential', propertyCondition: 'excellent',
    propertyDetails: {
      governorate: 'مسقط', wilayat: 'السيب', village: 'الخوض',
      blockNumber: '345', plotNumber: '123', area: 600, areaUnit: 'متر مربع',
      street: 'شارع السلطان قابوس', frontage: 20, floors: 2, rooms: 6,
      bathrooms: 4, buildingAge: 5, finishingLevel: 'luxury',
      services: ['كهرباء', 'ماء', 'إنترنت', 'تكييف مركزي'],
      locationNotes: 'قريب من المدارس والمساجد',
      detailedDescription: 'فيلا حديثة التشطيب مع حديقة ومسبح',
      isDeveloped: 'developed'
    },
    documents: [
      { id: 'd1', name: 'صك الملكية.pdf', type: 'ownership', size: 2048000, uploadedAt: daysAgo(30), url: '#' },
      { id: 'd2', name: 'الكروكي.pdf', type: 'map', size: 1024000, uploadedAt: daysAgo(30), url: '#' },
    ],
    extractedData: {
      plotNumber: '123', drawingNumber: 'MP-2024-456', area: 600,
      wilayat: 'السيب', governorate: 'مسقط', usageType: 'سكني', owner: 'محمد سعيد الراشدي', isEdited: false
    },
    valuation: {
      landValue: 180000, buildingValue: 120000, totalMarketValue: 300000,
      quickSaleValue: 255000, rentalValue: 1200,
      valuationMethod: 'طريقة التكلفة وال السوق', riskLevel: 'منخفض',
      confidencePercentage: 92, appraiserNotes: 'عقار ممتاز الموقع والتشطيب',
      finalRecommendation: 'موصى به للتمويل'
    },
    status: 'approved', approval: {
      status: 'approved', submittedAt: daysAgo(20), reviewedAt: daysAgo(18),
      reviewedBy: 'أحمد الراشدي', notes: 'تم الاعتماد'
    },
    appraiserId: 'u1', appraiserName: 'سعيد الحارثي',
    createdAt: daysAgo(30), updatedAt: daysAgo(18), fees: 500, notes: ''
  },
  {
    id: 'r2', reportNumber: 'VER-2026-002',
    bankId: 'b1', bankName: 'البنك المركزي العماني',
    beneficiaryId: 'bn2', beneficiaryName: 'فاطمة أحمد البوسعيدية',
    beneficiaryCivilId: '23456789', beneficiaryPhone: '92345678',
    beneficiaryEmail: 'fatima@email.com', beneficiaryAddress: 'صلالة - حي السعادة',
    beneficiaryRelation: 'owner', beneficiaryWorkplace: '',
    propertyType: 'shop', propertyUsage: 'commercial', propertyCondition: 'good',
    propertyDetails: {
      governorate: 'ظفار', wilayat: 'صلالة', village: 'الرقيبي',
      blockNumber: '78', plotNumber: '45', area: 200, areaUnit: 'متر مربع',
      street: 'شارع السلطان قابوس', frontage: 10, floors: 1, rooms: 2,
      bathrooms: 1, buildingAge: 10, finishingLevel: 'fully_finished',
      services: ['كهرباء', 'ماء', 'إنترنت'],
      locationNotes: 'على الشارع الرئيسي',
      detailedDescription: 'محل تجاري في موقع حيوي',
      isDeveloped: 'developed'
    },
    documents: [
      { id: 'd3', name: 'صك الملكية.pdf', type: 'ownership', size: 1500000, uploadedAt: daysAgo(60), url: '#' },
      { id: 'd4', name: 'الكروكي.pdf', type: 'map', size: 800000, uploadedAt: daysAgo(60), url: '#' },
    ],
    extractedData: {
      plotNumber: '45', drawingNumber: 'MP-2024-789', area: 200,
      wilayat: 'صلالة', governorate: 'ظفار', usageType: 'تجاري', owner: 'فاطمة أحمد البوسعيدية', isEdited: false
    },
    valuation: {
      landValue: 100000, buildingValue: 50000, totalMarketValue: 150000,
      quickSaleValue: 127500, rentalValue: 800,
      valuationMethod: 'طريقة المقارنة', riskLevel: 'متوسط',
      confidencePercentage: 85, appraiserNotes: 'موقع تجاري ممتاز',
      finalRecommendation: 'موصى به للتمويل'
    },
    status: 'archived', approval: {
      status: 'approved', submittedAt: daysAgo(50), reviewedAt: daysAgo(48),
      reviewedBy: 'فاطمة البوسعيدية', notes: 'معتمد'
    },
    appraiserId: 'u1', appraiserName: 'سعيد الحارثي',
    createdAt: daysAgo(60), updatedAt: daysAgo(48), fees: 350, notes: ''
  },
  {
    id: 'r3', reportNumber: 'VER-2026-003',
    bankId: 'b3', bankName: 'بنك صحار الدولي',
    beneficiaryId: 'bn3', beneficiaryName: 'عبدالله خالد الحبسي',
    beneficiaryCivilId: '34567890', beneficiaryPhone: '93456789',
    beneficiaryEmail: 'abdullah@email.com', beneficiaryAddress: 'نزوى - الحارة',
    beneficiaryRelation: 'buyer', beneficiaryWorkplace: 'شركة عمان للاتصالات',
    propertyType: 'land', propertyUsage: 'residential', propertyCondition: 'average',
    propertyDetails: {
      governorate: 'الداخلية', wilayat: 'نزوى', village: 'الحارة',
      blockNumber: '12', plotNumber: '89', area: 1000, areaUnit: 'متر مربع',
      street: '', frontage: 25, floors: 0, rooms: 0, bathrooms: 0, buildingAge: 0,
      finishingLevel: 'not_finished', services: ['كهرباء', 'ماء'],
      locationNotes: 'أرض فضاء في منطقة سكنية',
      detailedDescription: 'أرض فضاء صالحة للبناء',
      isDeveloped: 'vacant_land'
    },
    documents: [
      { id: 'd5', name: 'صك الملكية.pdf', type: 'ownership', size: 1800000, uploadedAt: daysAgo(45), url: '#' },
      { id: 'd6', name: 'الكروكي.pdf', type: 'map', size: 900000, uploadedAt: daysAgo(45), url: '#' },
    ],
    extractedData: {
      plotNumber: '89', drawingNumber: 'MP-2024-123', area: 1000,
      wilayat: 'نزوى', governorate: 'الداخلية', usageType: 'سكني', owner: 'عبدالله خالد الحبسي', isEdited: false
    },
    valuation: {
      landValue: 80000, buildingValue: 0, totalMarketValue: 80000,
      quickSaleValue: 68000, valuationMethod: 'طريقة السوق', riskLevel: 'منخفض',
      confidencePercentage: 88, appraiserNotes: 'أرض في منطقة نامية',
      finalRecommendation: 'موصى به للتمويل'
    },
    status: 'pending_approval', approval: {
      status: 'pending', submittedAt: daysAgo(3), reviewedBy: '', notes: ''
    },
    appraiserId: 'u1', appraiserName: 'سعيد الحارثي',
    createdAt: daysAgo(45), updatedAt: daysAgo(3), fees: 300, notes: ''
  },
  {
    id: 'r4', reportNumber: 'VER-2026-004',
    bankId: 'b4', bankName: 'البنك الوطني العماني',
    beneficiaryId: 'bn4', beneficiaryName: 'عائشة يوسف الكندية',
    beneficiaryCivilId: '45678901', beneficiaryPhone: '94567890',
    beneficiaryEmail: 'aisha@email.com', beneficiaryAddress: 'صحار - الصناعية',
    beneficiaryRelation: 'bank_client', beneficiaryWorkplace: '',
    propertyType: 'warehouse', propertyUsage: 'industrial', propertyCondition: 'good',
    propertyDetails: {
      governorate: 'الباطنة الشمالية', wilayat: 'صحار', village: 'المنطقة الصناعية',
      blockNumber: '56', plotNumber: '201', area: 500, areaUnit: 'متر مربع',
      street: 'شارع المنطقة الصناعية', frontage: 15, floors: 1, rooms: 1,
      bathrooms: 1, buildingAge: 8, finishingLevel: 'semi_finished',
      services: ['كهرباء', 'ماء'],
      locationNotes: 'منطقة صناعية',
      detailedDescription: 'مستودع كبير مجهز للتخزين',
      isDeveloped: 'developed'
    },
    documents: [
      { id: 'd7', name: 'صك الملكية.pdf', type: 'ownership', size: 1600000, uploadedAt: daysAgo(15), url: '#' },
      { id: 'd8', name: 'الكروكي.pdf', type: 'map', size: 700000, uploadedAt: daysAgo(15), url: '#' },
    ],
    extractedData: {
      plotNumber: '201', drawingNumber: 'MP-2024-567', area: 500,
      wilayat: 'صحار', governorate: 'الباطنة الشمالية', usageType: 'صناعي', owner: 'عائشة يوسف الكندية', isEdited: false
    },
    valuation: {
      landValue: 60000, buildingValue: 40000, totalMarketValue: 100000,
      quickSaleValue: 85000, rentalValue: 500,
      valuationMethod: 'طريقة الدخل', riskLevel: 'متوسط',
      confidencePercentage: 80, appraiserNotes: 'مستودع في منطقة صناعية مرخصة',
      finalRecommendation: 'موصى به بشروط'
    },
    status: 'in_progress', approval: {
      status: 'pending', reviewedBy: '', notes: ''
    },
    appraiserId: 'u1', appraiserName: 'سعيد الحارثي',
    createdAt: daysAgo(15), updatedAt: daysAgo(2), fees: 350, notes: 'بانتظار الزيارة الميدانية'
  },
  {
    id: 'r5', reportNumber: 'VER-2026-005',
    bankId: 'b6', bankName: 'بنك عمان العربي',
    beneficiaryId: 'bn5', beneficiaryName: 'سعيد ناصر السالمي',
    beneficiaryCivilId: '56789012', beneficiaryPhone: '95678901',
    beneficiaryEmail: 'said@email.com', beneficiaryAddress: 'البريمي - وادي العين',
    beneficiaryRelation: 'owner', beneficiaryWorkplace: 'أعمال حرة',
    propertyType: 'farm', propertyUsage: 'agricultural', propertyCondition: 'good',
    propertyDetails: {
      governorate: 'البريمي', wilayat: 'البريمي', village: 'وادي العين',
      blockNumber: '90', plotNumber: '156', area: 5000, areaUnit: 'متر مربع',
      street: '', frontage: 50, floors: 1, rooms: 3, bathrooms: 2, buildingAge: 15,
      finishingLevel: 'semi_finished', services: ['ماء'],
      locationNotes: 'مزرعة نخيل',
      detailedDescription: 'مزرعة نخيل مع منزل صغير',
      isDeveloped: 'developed'
    },
    documents: [
      { id: 'd9', name: 'صك الملكية.pdf', type: 'ownership', size: 2200000, uploadedAt: daysAgo(25), url: '#' },
      { id: 'd10', name: 'الكروكي.pdf', type: 'map', size: 1100000, uploadedAt: daysAgo(25), url: '#' },
    ],
    extractedData: {
      plotNumber: '156', drawingNumber: 'MP-2024-901', area: 5000,
      wilayat: 'البريمي', governorate: 'البريمي', usageType: 'زراعي', owner: 'سعيد ناصر السالمي', isEdited: false
    },
    valuation: {
      landValue: 25000, buildingValue: 15000, totalMarketValue: 40000,
      quickSaleValue: 34000, valuationMethod: 'طريقة السوق', riskLevel: 'عالي',
      confidencePercentage: 70, appraiserNotes: 'أرض زراعية في منطقة نائية',
      finalRecommendation: 'يحتاج تقييم إضافي'
    },
    status: 'rejected', approval: {
      status: 'rejected', submittedAt: daysAgo(20), reviewedAt: daysAgo(15),
      reviewedBy: 'عبدالله الحبسي', notes: 'يحتاج تقييم إضافي من مقيم آخر'
    },
    appraiserId: 'u1', appraiserName: 'سعيد الحارثي',
    createdAt: daysAgo(25), updatedAt: daysAgo(15), fees: 400, notes: ''
  },
  {
    id: 'r6', reportNumber: 'VER-2026-006',
    bankId: 'b2', bankName: 'بنك مسقط',
    beneficiaryId: 'bn6', beneficiaryName: 'خالد جمعة العمري',
    beneficiaryCivilId: '67890123', beneficiaryPhone: '96789012',
    beneficiaryEmail: 'khaled@email.com', beneficiaryAddress: 'مسقط - القرم',
    beneficiaryRelation: 'legal_representative', beneficiaryWorkplace: 'مكتب محاماة العمري',
    propertyType: 'apartment', propertyUsage: 'residential', propertyCondition: 'excellent',
    propertyDetails: {
      governorate: 'مسقط', wilayat: 'مطرح', village: 'القرم',
      blockNumber: '67', plotNumber: '34', area: 150, areaUnit: 'متر مربع',
      street: 'شارع القرم', frontage: 8, floors: 1, rooms: 3, bathrooms: 2, buildingAge: 3,
      finishingLevel: 'luxury', services: ['كهرباء', 'ماء', 'إنترنت', 'تكييف مركزي'],
      locationNotes: 'شقة في برج سكني فاخر',
      detailedDescription: 'شقة فاخرة بإطلالة بحرية',
      isDeveloped: 'developed'
    },
    documents: [
      { id: 'd11', name: 'صك الملكية.pdf', type: 'ownership', size: 1900000, uploadedAt: daysAgo(7), url: '#' },
      { id: 'd12', name: 'الكروكي.pdf', type: 'map', size: 950000, uploadedAt: daysAgo(7), url: '#' },
    ],
    extractedData: {
      plotNumber: '34', drawingNumber: 'MP-2026-001', area: 150,
      wilayat: 'مطرح', governorate: 'مسقط', usageType: 'سكني', owner: 'محمد العمري', isEdited: false
    },
    valuation: {
      landValue: 120000, buildingValue: 80000, totalMarketValue: 200000,
      quickSaleValue: 170000, rentalValue: 900,
      valuationMethod: 'طريقة السوق والمقارنة', riskLevel: 'منخفض',
      confidencePercentage: 95, appraiserNotes: 'شقة فاخرة في موقع متميز',
      finalRecommendation: 'موصى به للتمويل'
    },
    status: 'draft', approval: {
      status: 'pending', reviewedBy: '', notes: ''
    },
    appraiserId: 'u1', appraiserName: 'سعيد الحارثي',
    createdAt: daysAgo(7), updatedAt: daysAgo(1), fees: 450, notes: 'قيد الإعداد'
  },
  {
    id: 'r7', reportNumber: 'VER-2026-007',
    bankId: 'b3', bankName: 'بنك صحار الدولي',
    beneficiaryId: 'bn7', beneficiaryName: 'نورة حمد البلوشية',
    beneficiaryCivilId: '78901234', beneficiaryPhone: '97890123',
    beneficiaryEmail: 'noura@email.com', beneficiaryAddress: 'صور - وادي بني خالد',
    beneficiaryRelation: 'owner', beneficiaryWorkplace: '',
    propertyType: 'residential_building', propertyUsage: 'investment', propertyCondition: 'good',
    propertyDetails: {
      governorate: 'الشرقية', wilayat: 'صور', village: 'المنطقة السكنية',
      blockNumber: '23', plotNumber: '78', area: 800, areaUnit: 'متر مربع',
      street: 'شارع الإسكان', frontage: 20, floors: 3, rooms: 12, bathrooms: 6, buildingAge: 12,
      finishingLevel: 'fully_finished', services: ['كهرباء', 'ماء', 'إنترنت'],
      locationNotes: 'مبنى سكني استثماري',
      detailedDescription: 'مبنى سكني من 3 أدوار للاستثمار',
      isDeveloped: 'developed'
    },
    documents: [
      { id: 'd13', name: 'صك الملكية.pdf', type: 'ownership', size: 2100000, uploadedAt: daysAgo(10), url: '#' },
      { id: 'd14', name: 'الكروكي.pdf', type: 'map', size: 1050000, uploadedAt: daysAgo(10), url: '#' },
    ],
    extractedData: {
      plotNumber: '78', drawingNumber: 'MP-2026-002', area: 800,
      wilayat: 'صور', governorate: 'الشرقية', usageType: 'استثماري', owner: 'نورة حمد البلوشية', isEdited: false
    },
    valuation: {
      landValue: 160000, buildingValue: 140000, totalMarketValue: 300000,
      quickSaleValue: 255000, rentalValue: 1800,
      valuationMethod: 'طريقة الدخل', riskLevel: 'منخفض',
      confidencePercentage: 87, appraiserNotes: 'عائد إيجاري جيد',
      finalRecommendation: 'موصى به للتمويل'
    },
    status: 'needs_revision', approval: {
      status: 'needs_revision', submittedAt: daysAgo(5), reviewedAt: daysAgo(2),
      reviewedBy: 'خالد العمري', notes: 'يرجى تحديث بيانات البناء وعمره'
    },
    appraiserId: 'u1', appraiserName: 'سعيد الحارثي',
    createdAt: daysAgo(10), updatedAt: daysAgo(2), fees: 500, notes: ''
  },
  {
    id: 'r8', reportNumber: 'VER-2026-008',
    bankId: 'b1', bankName: 'البنك المركزي العماني',
    beneficiaryId: 'bn8', beneficiaryName: 'ياسر راشد الهاشمي',
    beneficiaryCivilId: '89012345', beneficiaryPhone: '98901234',
    beneficiaryEmail: 'yasser@email.com', beneficiaryAddress: 'إبرا - حي الرياض',
    beneficiaryRelation: 'buyer', beneficiaryWorkplace: 'بنك مسقط',
    propertyType: 'mixed_use', propertyUsage: 'investment', propertyCondition: 'excellent',
    propertyDetails: {
      governorate: 'الداخلية', wilayat: 'إبرا', village: 'حي الرياض',
      blockNumber: '11', plotNumber: '55', area: 400, areaUnit: 'متر مربع',
      street: 'شارع الرياض', frontage: 12, floors: 4, rooms: 8, bathrooms: 6, buildingAge: 2,
      finishingLevel: 'luxury', services: ['كهرباء', 'ماء', 'إنترنت', 'تكييف مركزي'],
      locationNotes: 'مبنى سكني تجاري',
      detailedDescription: 'مبنى حديث بتصميم عصري',
      isDeveloped: 'developed'
    },
    documents: [
      { id: 'd15', name: 'صك الملكية.pdf', type: 'ownership', size: 2300000, uploadedAt: daysAgo(1), url: '#' },
      { id: 'd16', name: 'الكروكي.pdf', type: 'map', size: 1150000, uploadedAt: daysAgo(1), url: '#' },
    ],
    extractedData: {
      plotNumber: '55', drawingNumber: 'MP-2026-003', area: 400,
      wilayat: 'إبرا', governorate: 'الداخلية', usageType: 'استثماري', owner: 'ياسر راشد الهاشمي', isEdited: false
    },
    valuation: {
      landValue: 100000, buildingValue: 200000, totalMarketValue: 300000,
      quickSaleValue: 255000, rentalValue: 2000,
      valuationMethod: 'طريقة الدخل والتكلفة', riskLevel: 'منخفض',
      confidencePercentage: 90, appraiserNotes: 'عقار استثماري ممتاز',
      finalRecommendation: 'موصى به للتمويل'
    },
    status: 'pending_approval', approval: {
      status: 'pending', submittedAt: daysAgo(1), reviewedBy: '', notes: ''
    },
    appraiserId: 'u1', appraiserName: 'سعيد الحارثي',
    createdAt: daysAgo(1), updatedAt: daysAgo(1), fees: 550, notes: ''
  },
];

/* ===== Notifications ===== */
export const notifications: Notification[] = [
  {
    id: 'n1', type: 'approval', title: 'تقرير جديد بانتظار الاعتماد',
    message: 'تقرير رقم VER-2026-003 بانتظار اعتمادك',
    priority: 'high', isRead: false, createdAt: daysAgo(1), relatedReportId: 'r3'
  },
  {
    id: 'n2', type: 'approval', title: 'تقرير معتمد',
    message: 'تم اعتماد التقرير رقم VER-2026-001',
    priority: 'medium', isRead: true, createdAt: daysAgo(18), relatedReportId: 'r1'
  },
  {
    id: 'n3', type: 'report', title: 'تقرير جديد بحاجة مراجعة',
    message: 'تم إرجاع التقرير VER-2026-007 للمراجعة',
    priority: 'high', isRead: false, createdAt: daysAgo(2), relatedReportId: 'r7'
  },
  {
    id: 'n4', type: 'reminder', title: 'تذكير: تقرير متأخر',
    message: 'التقرير VER-2026-004 متأخر عن الموعد المحدد',
    priority: 'high', isRead: false, createdAt: daysAgo(0), relatedReportId: 'r4'
  },
  {
    id: 'n5', type: 'system', title: 'تحديث النظام',
    message: 'تم تحديث النظام بنجاح',
    priority: 'low', isRead: true, createdAt: daysAgo(7)
  },
  {
    id: 'n6', type: 'approval', title: 'تقرير مرفوض',
    message: 'تم رفض التقرير VER-2026-005',
    priority: 'high', isRead: true, createdAt: daysAgo(15), relatedReportId: 'r5'
  },
  {
    id: 'n7', type: 'report', title: 'تقرير جديد',
    message: 'تم إنشاء تقرير جديد VER-2026-008',
    priority: 'medium', isRead: false, createdAt: daysAgo(1), relatedReportId: 'r8'
  },
  {
    id: 'n8', type: 'task', title: 'مهمة جديدة',
    message: 'تم تعيين مهمة لك: زيارة ميدانية للتقرير VER-2026-004',
    priority: 'high', isRead: false, createdAt: daysAgo(3), relatedReportId: 'r4'
  },
];

/* ===== Tasks ===== */
export const tasks: Task[] = [
  {
    id: 't1', title: 'زيارة ميدانية - مستودع صحار',
    description: 'زيارة ميدانية لتقسيم المستودع في المنطقة الصناعية بصحار',
    priority: 'high', status: 'overdue', dueDate: daysAgo(1),
    createdAt: daysAgo(5), relatedReportId: 'r4', relatedReportNumber: 'VER-2026-004'
  },
  {
    id: 't2', title: 'مراجعة تقرير نورة البلوشية',
    description: 'تحديث بيانات البناء والعمر بناءً على ملاحظات المراجع',
    priority: 'high', status: 'pending', dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAt: daysAgo(2), relatedReportId: 'r7', relatedReportNumber: 'VER-2026-007'
  },
  {
    id: 't3', title: 'إعداد تقرير ياسر الهاشمي',
    description: 'إكمال التقرير وإرساله للاعتماد',
    priority: 'medium', status: 'in_progress', dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    createdAt: daysAgo(1), relatedReportId: 'r8', relatedReportNumber: 'VER-2026-008'
  },
  {
    id: 't4', title: 'مراجعة تقرير شقة القرم',
    description: 'إكمال معاينة التقرير وإرساله',
    priority: 'medium', status: 'pending', dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    createdAt: daysAgo(1), relatedReportId: 'r6', relatedReportNumber: 'VER-2026-006'
  },
  {
    id: 't5', title: 'متابعة مع بنك صحار',
    description: 'التواصل مع البنك بخصوص تقارير معلقة',
    priority: 'low', status: 'pending', dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: daysAgo(4)
  },
];

/* ===== Settings ===== */
export const settings: AppSettings = {
  officeName: 'مكتب العقارات الدولية',
  officeNameEn: 'International Real Estate Office',
  logo: '/logo.svg',
  reportPrefix: 'VER',
  reportNextNumber: 9,
  defaultCurrency: 'OMR',
  language: 'ar',
  theme: 'light',
  userName: 'سعيد الحارثي',
  userRole: 'مقيم عقاري معتمد',
  userEmail: 'said@ireo.om',
  userPhone: '91234567',
  defaultFees: 500
};

/* ===== Dashboard Stats ===== */
export const dashboardStats: DashboardStats = {
  totalReportsThisMonth: 8,
  completedReports: 3,
  inProgressReports: 2,
  pendingApprovalReports: 2,
  monthlyFees: 3400
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

/* ===== Monthly chart data ===== */
export const monthlyData = [
  { month: 'يناير', count: 5, fees: 2100 },
  { month: 'فبراير', count: 7, fees: 2900 },
  { month: 'مارس', count: 6, fees: 2500 },
  { month: 'أبريل', count: 8, fees: 3400 },
  { month: 'مايو', count: 0, fees: 0 },
  { month: 'يونيو', count: 0, fees: 0 },
];

export const statusChartData = [
  { name: 'معتمد', value: 3, color: '#22c55e' },
  { name: 'قيد الإنجاز', value: 2, color: '#3b82f6' },
  { name: 'بانتظار الاعتماد', value: 2, color: '#f59e0b' },
  { name: 'مسودة', value: 1, color: '#6b7280' },
  { name: 'مرفوض', value: 1, color: '#ef4444' },
  { name: 'يحتاج تعديل', value: 1, color: '#f97316' },
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

/* ===== Employees ===== */
import type { Employee, LoginLog, EmployeeRole, EmployeeStatus } from '@/types';
import { ROLE_DEFAULT_PERMISSIONS } from '@/types';

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

export const employees: Employee[] = [
  {
    id: 'e1', fullName: 'سعيد الحارثي', username: 'admin', password: 'admin123', email: 'said@ireo.om', phone: '91234567',
    role: 'admin', status: 'active', avatar: '', department: 'الإدارة العامة',
    joinDate: '2023-01-15', lastLogin: hoursAgo(1), lastLogout: null, isActiveSession: true,
    permissions: ROLE_DEFAULT_PERMISSIONS.admin, notes: 'مدير النظام الرئيسي',
  },
  {
    id: 'e2', fullName: 'أحمد الراشدي', username: 'ahmed.rashdi', password: 'pass123', email: 'ahmed@ireo.om', phone: '92345678',
    role: 'appraiser', status: 'active', avatar: '', department: 'قسم التثمين',
    joinDate: '2023-06-01', lastLogin: hoursAgo(3), lastLogout: hoursAgo(2), isActiveSession: false,
    permissions: ROLE_DEFAULT_PERMISSIONS.appraiser, notes: '',
  },
  {
    id: 'e3', fullName: 'خالد العمري', username: 'khaled.almri', password: 'pass123', email: 'khaled@ireo.om', phone: '93456789',
    role: 'appraiser', status: 'active', avatar: '', department: 'قسم التثمين',
    joinDate: '2023-09-10', lastLogin: daysAgo(1), lastLogout: daysAgo(1), isActiveSession: false,
    permissions: ROLE_DEFAULT_PERMISSIONS.appraiser, notes: 'متخصص في التثمين التجاري',
  },
  {
    id: 'e4', fullName: 'فاطمة البوسعيدية', username: 'fatima.bosaidi', password: 'pass123', email: 'fatima@ireo.om', phone: '94567890',
    role: 'reviewer', status: 'active', avatar: '', department: 'قسم المراجعة',
    joinDate: '2023-03-20', lastLogin: hoursAgo(5), lastLogout: hoursAgo(4), isActiveSession: false,
    permissions: ROLE_DEFAULT_PERMISSIONS.reviewer, notes: 'مراجعة أولى',
  },
  {
    id: 'e5', fullName: 'محمد السالمي', username: 'mohamed.salmi', password: 'pass123', email: 'mohamed@ireo.om', phone: '95678901',
    role: 'data_entry', status: 'active', avatar: '', department: 'قسم إدخال البيانات',
    joinDate: '2024-02-01', lastLogin: daysAgo(2), lastLogout: daysAgo(2), isActiveSession: false,
    permissions: ROLE_DEFAULT_PERMISSIONS.data_entry, notes: '',
  },
  {
    id: 'e6', fullName: 'نورة الكندية', username: 'noura.kindi', password: 'pass123', email: 'noura@ireo.om', phone: '96789012',
    role: 'data_entry', status: 'suspended', avatar: '', department: 'قسم إدخال البيانات',
    joinDate: '2024-05-15', lastLogin: daysAgo(15), lastLogout: daysAgo(15), isActiveSession: false,
    permissions: ROLE_DEFAULT_PERMISSIONS.data_entry, notes: 'موقوفة مؤقتاً',
  },
  {
    id: 'e7', fullName: 'ياسر الهاشمي', username: 'yasser.hashmi', password: 'pass123', email: 'yasser@ireo.om', phone: '97890123',
    role: 'reviewer', status: 'active', avatar: '', department: 'قسم المراجعة',
    joinDate: '2024-01-10', lastLogin: hoursAgo(8), lastLogout: hoursAgo(7), isActiveSession: false,
    permissions: ROLE_DEFAULT_PERMISSIONS.reviewer, notes: 'مراجعة ثانية',
  },
  {
    id: 'e8', fullName: 'عبدالله الحبسي', username: 'abdullah.habsi', password: 'pass123', email: 'abdullah@ireo.om', phone: '98901234',
    role: 'viewer', status: 'inactive', avatar: '', department: 'المبيعات',
    joinDate: '2024-08-01', lastLogin: daysAgo(30), lastLogout: daysAgo(30), isActiveSession: false,
    permissions: ROLE_DEFAULT_PERMISSIONS.viewer, notes: 'غير نشط حالياً',
  },
  {
    id: 'e9', fullName: 'مريم البلوشية', username: 'mariam.balushi', password: 'pass123', email: 'mariam@ireo.om', phone: '99112345',
    role: 'appraiser', status: 'active', avatar: '', department: 'قسم التثمين',
    joinDate: '2024-04-20', lastLogin: hoursAgo(2), lastLogout: hoursAgo(1), isActiveSession: true,
    permissions: ROLE_DEFAULT_PERMISSIONS.appraiser, notes: 'متخصصة في التثمين الزراعي',
  },
  {
    id: 'e10', fullName: 'سلطان المعولي', username: 'sultan.maawali', password: 'admin123', email: 'sultan@ireo.om', phone: '99223456',
    role: 'admin', status: 'active', avatar: '', department: 'الإدارة العامة',
    joinDate: '2023-01-15', lastLogin: daysAgo(5), lastLogout: daysAgo(5), isActiveSession: false,
    permissions: ROLE_DEFAULT_PERMISSIONS.admin, notes: 'مدير النظام الاحتياطي',
  },
];

export const loginLogs: LoginLog[] = [
  { id: 'l1', employeeId: 'e1', employeeName: 'سعيد الحارثي', action: 'login', timestamp: hoursAgo(1), ipAddress: '192.168.1.100' },
  { id: 'l2', employeeId: 'e9', employeeName: 'مريم البلوشية', action: 'login', timestamp: hoursAgo(2), ipAddress: '192.168.1.105' },
  { id: 'l3', employeeId: 'e9', employeeName: 'مريم البلوشية', action: 'logout', timestamp: hoursAgo(1), ipAddress: '192.168.1.105' },
  { id: 'l4', employeeId: 'e2', employeeName: 'أحمد الراشدي', action: 'login', timestamp: hoursAgo(3), ipAddress: '192.168.1.101' },
  { id: 'l5', employeeId: 'e2', employeeName: 'أحمد الراشدي', action: 'logout', timestamp: hoursAgo(2), ipAddress: '192.168.1.101' },
  { id: 'l6', employeeId: 'e4', employeeName: 'فاطمة البوسعيدية', action: 'login', timestamp: hoursAgo(5), ipAddress: '192.168.1.102' },
  { id: 'l7', employeeId: 'e4', employeeName: 'فاطمة البوسعيدية', action: 'logout', timestamp: hoursAgo(4), ipAddress: '192.168.1.102' },
  { id: 'l8', employeeId: 'e7', employeeName: 'ياسر الهاشمي', action: 'login', timestamp: hoursAgo(8), ipAddress: '192.168.1.107' },
  { id: 'l9', employeeId: 'e7', employeeName: 'ياسر الهاشمي', action: 'logout', timestamp: hoursAgo(7), ipAddress: '192.168.1.107' },
  { id: 'l10', employeeId: 'e3', employeeName: 'خالد العمري', action: 'login', timestamp: daysAgo(1), ipAddress: '192.168.1.103' },
  { id: 'l11', employeeId: 'e3', employeeName: 'خالد العمري', action: 'logout', timestamp: daysAgo(1), ipAddress: '192.168.1.103' },
  { id: 'l12', employeeId: 'e5', employeeName: 'محمد السالمي', action: 'login', timestamp: daysAgo(2), ipAddress: '192.168.1.104' },
  { id: 'l13', employeeId: 'e5', employeeName: 'محمد السالمي', action: 'logout', timestamp: daysAgo(2), ipAddress: '192.168.1.104' },
  { id: 'l14', employeeId: 'e10', employeeName: 'سلطان المعولي', action: 'login', timestamp: daysAgo(5), ipAddress: '10.0.0.50' },
  { id: 'l15', employeeId: 'e10', employeeName: 'سلطان المعولي', action: 'logout', timestamp: daysAgo(5), ipAddress: '10.0.0.50' },
  { id: 'l16', employeeId: 'e1', employeeName: 'سعيد الحارثي', action: 'login', timestamp: daysAgo(1), ipAddress: '192.168.1.100' },
  { id: 'l17', employeeId: 'e1', employeeName: 'سعيد الحارثي', action: 'logout', timestamp: daysAgo(1), ipAddress: '192.168.1.100' },
  { id: 'l18', employeeId: 'e2', employeeName: 'أحمد الراشدي', action: 'login', timestamp: daysAgo(1), ipAddress: '192.168.1.101' },
  { id: 'l19', employeeId: 'e2', employeeName: 'أحمد الراشدي', action: 'logout', timestamp: daysAgo(1), ipAddress: '192.168.1.101' },
  { id: 'l20', employeeId: 'e3', employeeName: 'خالد العمري', action: 'login', timestamp: daysAgo(2), ipAddress: '192.168.1.103' },
  { id: 'l21', employeeId: 'e3', employeeName: 'خالد العمري', action: 'logout', timestamp: daysAgo(2), ipAddress: '192.168.1.103' },
  { id: 'l22', employeeId: 'e9', employeeName: 'مريم البلوشية', action: 'login', timestamp: daysAgo(1), ipAddress: '192.168.1.105' },
  { id: 'l23', employeeId: 'e9', employeeName: 'مريم البلوشية', action: 'logout', timestamp: daysAgo(1), ipAddress: '192.168.1.105' },
  { id: 'l24', employeeId: 'e4', employeeName: 'فاطمة البوسعيدية', action: 'login', timestamp: daysAgo(2), ipAddress: '192.168.1.102' },
  { id: 'l25', employeeId: 'e4', employeeName: 'فاطمة البوسعيدية', action: 'logout', timestamp: daysAgo(2), ipAddress: '192.168.1.102' },
  { id: 'l26', employeeId: 'e7', employeeName: 'ياسر الهاشمي', action: 'login', timestamp: daysAgo(1), ipAddress: '192.168.1.107' },
  { id: 'l27', employeeId: 'e7', employeeName: 'ياسر الهاشمي', action: 'logout', timestamp: daysAgo(1), ipAddress: '192.168.1.107' },
  { id: 'l28', employeeId: 'e1', employeeName: 'سعيد الحارثي', action: 'login', timestamp: daysAgo(2), ipAddress: '192.168.1.100' },
  { id: 'l29', employeeId: 'e1', employeeName: 'سعيد الحارثي', action: 'logout', timestamp: daysAgo(2), ipAddress: '192.168.1.100' },
  { id: 'l30', employeeId: 'e2', employeeName: 'أحمد الراشدي', action: 'login', timestamp: daysAgo(3), ipAddress: '192.168.1.101' },
  { id: 'l31', employeeId: 'e2', employeeName: 'أحمد الراشدي', action: 'logout', timestamp: daysAgo(3), ipAddress: '192.168.1.101' },
  { id: 'l32', employeeId: 'e5', employeeName: 'محمد السالمي', action: 'login', timestamp: daysAgo(3), ipAddress: '192.168.1.104' },
  { id: 'l33', employeeId: 'e5', employeeName: 'محمد السالمي', action: 'logout', timestamp: daysAgo(3), ipAddress: '192.168.1.104' },
  { id: 'l34', employeeId: 'e3', employeeName: 'خالد العمري', action: 'login', timestamp: daysAgo(3), ipAddress: '192.168.1.103' },
  { id: 'l35', employeeId: 'e3', employeeName: 'خالد العمري', action: 'logout', timestamp: daysAgo(3), ipAddress: '192.168.1.103' },
  { id: 'l36', employeeId: 'e9', employeeName: 'مريم البلوشية', action: 'login', timestamp: daysAgo(2), ipAddress: '192.168.1.105' },
  { id: 'l37', employeeId: 'e9', employeeName: 'مريم البلوشية', action: 'logout', timestamp: daysAgo(2), ipAddress: '192.168.1.105' },
  { id: 'l38', employeeId: 'e4', employeeName: 'فاطمة البوسعيدية', action: 'login', timestamp: daysAgo(3), ipAddress: '192.168.1.102' },
  { id: 'l39', employeeId: 'e4', employeeName: 'فاطمة البوسعيدية', action: 'logout', timestamp: daysAgo(3), ipAddress: '192.168.1.102' },
  { id: 'l40', employeeId: 'e1', employeeName: 'سعيد الحارثي', action: 'login', timestamp: daysAgo(3), ipAddress: '192.168.1.100' },
  { id: 'l41', employeeId: 'e1', employeeName: 'سعيد الحارثي', action: 'logout', timestamp: daysAgo(3), ipAddress: '192.168.1.100' },
  { id: 'l42', employeeId: 'e7', employeeName: 'ياسر الهاشمي', action: 'login', timestamp: daysAgo(2), ipAddress: '192.168.1.107' },
  { id: 'l43', employeeId: 'e7', employeeName: 'ياسر الهاشمي', action: 'logout', timestamp: daysAgo(2), ipAddress: '192.168.1.107' },
  { id: 'l44', employeeId: 'e2', employeeName: 'أحمد الراشدي', action: 'login', timestamp: daysAgo(4), ipAddress: '192.168.1.101' },
  { id: 'l45', employeeId: 'e2', employeeName: 'أحمد الراشدي', action: 'logout', timestamp: daysAgo(4), ipAddress: '192.168.1.101' },
  { id: 'l46', employeeId: 'e10', employeeName: 'سلطان المعولي', action: 'login', timestamp: daysAgo(3), ipAddress: '10.0.0.50' },
  { id: 'l47', employeeId: 'e10', employeeName: 'سلطان المعولي', action: 'logout', timestamp: daysAgo(3), ipAddress: '10.0.0.50' },
  { id: 'l48', employeeId: 'e1', employeeName: 'سعيد الحارثي', action: 'login', timestamp: daysAgo(4), ipAddress: '192.168.1.100' },
  { id: 'l49', employeeId: 'e1', employeeName: 'سعيد الحارثي', action: 'logout', timestamp: daysAgo(4), ipAddress: '192.168.1.100' },
  { id: 'l50', employeeId: 'e9', employeeName: 'مريم البلوشية', action: 'login', timestamp: daysAgo(3), ipAddress: '192.168.1.105' },
  { id: 'l51', employeeId: 'e9', employeeName: 'مريم البلوشية', action: 'logout', timestamp: daysAgo(3), ipAddress: '192.168.1.105' },
];

/* ===== Monthly Employee Performance ===== */
export const monthlyPerformance = [
  { month: 'يناير', employeeId: 'e2', reports: 4, approvals: 0, avgTime: 3.2, fees: 2000 },
  { month: 'يناير', employeeId: 'e3', reports: 3, approvals: 0, avgTime: 4.1, fees: 1500 },
  { month: 'يناير', employeeId: 'e9', reports: 0, approvals: 0, avgTime: 0, fees: 0 },
  { month: 'فبراير', employeeId: 'e2', reports: 5, approvals: 0, avgTime: 2.8, fees: 2500 },
  { month: 'فبراير', employeeId: 'e3', reports: 4, approvals: 0, avgTime: 3.5, fees: 2000 },
  { month: 'فبراير', employeeId: 'e9', reports: 2, approvals: 0, avgTime: 5.0, fees: 1000 },
  { month: 'مارس', employeeId: 'e2', reports: 6, approvals: 0, avgTime: 2.5, fees: 3000 },
  { month: 'مارس', employeeId: 'e3', reports: 3, approvals: 0, avgTime: 3.8, fees: 1500 },
  { month: 'مارس', employeeId: 'e9', reports: 3, approvals: 0, avgTime: 4.2, fees: 1500 },
  { month: 'أبريل', employeeId: 'e2', reports: 3, approvals: 0, avgTime: 3.0, fees: 1500 },
  { month: 'أبريل', employeeId: 'e3', reports: 2, approvals: 0, avgTime: 4.5, fees: 1000 },
  { month: 'أبريل', employeeId: 'e9', reports: 3, approvals: 0, avgTime: 3.6, fees: 1500 },
  { month: 'يناير', employeeId: 'e4', reports: 0, approvals: 7, avgTime: 1.2, fees: 0 },
  { month: 'فبراير', employeeId: 'e4', reports: 0, approvals: 9, avgTime: 1.0, fees: 0 },
  { month: 'مارس', employeeId: 'e4', reports: 0, approvals: 6, avgTime: 1.5, fees: 0 },
  { month: 'أبريل', employeeId: 'e4', reports: 0, approvals: 2, avgTime: 1.3, fees: 0 },
  { month: 'يناير', employeeId: 'e7', reports: 0, approvals: 5, avgTime: 1.8, fees: 0 },
  { month: 'فبراير', employeeId: 'e7', reports: 0, approvals: 7, avgTime: 1.5, fees: 0 },
  { month: 'مارس', employeeId: 'e7', reports: 0, approvals: 6, avgTime: 2.0, fees: 0 },
  { month: 'أبريل', employeeId: 'e7', reports: 0, approvals: 2, avgTime: 1.6, fees: 0 },
  { month: 'يناير', employeeId: 'e5', reports: 5, approvals: 0, avgTime: 0, fees: 0 },
  { month: 'فبراير', employeeId: 'e5', reports: 7, approvals: 0, avgTime: 0, fees: 0 },
  { month: 'مارس', employeeId: 'e5', reports: 6, approvals: 0, avgTime: 0, fees: 0 },
  { month: 'أبريل', employeeId: 'e5', reports: 4, approvals: 0, avgTime: 0, fees: 0 },
];
