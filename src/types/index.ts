/* ===== Report Status Types ===== */
export type ReportStatus =
  | 'draft'
  | 'in_progress'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'needs_revision'
  | 'archived';

/* ===== Property Types ===== */
export type PropertyType =
  | 'land'
  | 'villa'
  | 'apartment'
  | 'residential_building'
  | 'commercial_building'
  | 'mixed_use'
  | 'farm'
  | 'warehouse'
  | 'shop';

export type PropertyUsage = 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'investment';
export type PropertyCondition = 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
export type FinishingLevel = 'fully_finished' | 'semi_finished' | 'not_finished' | 'luxury';
export type DevelopmentStatus = 'developed' | 'vacant_land';
export type BeneficiaryRelation = 'owner' | 'buyer' | 'bank_client' | 'legal_representative' | 'other';

/* ===== Notification Types ===== */
export type NotificationType = 'approval' | 'report' | 'task' | 'system' | 'reminder';
export type NotificationPriority = 'low' | 'medium' | 'high';

/* ===== Approval Types ===== */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

/* ===== Task Types ===== */
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

/* ===== OCR Types ===== */
export interface ExtractedField {
  value: string;
  confidence: number;
  source: 'ocr' | 'ai' | 'default' | '';
}

export interface OCRExtractionResult {
  success: boolean;
  rawText: string;
  fields: {
    plotNumber: ExtractedField;
    drawingNumber: ExtractedField;
    area: ExtractedField;
    areaUnit: ExtractedField;
    wilayat: ExtractedField;
    governorate: ExtractedField;
    usageType: ExtractedField;
    owner: ExtractedField;
    blockNumber: ExtractedField;
    street: ExtractedField;
    village: ExtractedField;
    frontage: ExtractedField;
    floors: ExtractedField;
    buildingAge: ExtractedField;
  };
  error?: string;
}

export type OCRStep = 'idle' | 'uploading' | 'processing' | 'parsing' | 'done' | 'error';

/* ===== Apartment Types ===== */
export interface ApartmentComponent {
  name: string;
  ff: number;
  ph: number;
}

export interface InternalFinishingItem {
  description: string;
  typeOfItem: string;
  condition: string;
}

export interface ApartmentDetails {
  bldgPermitNumber: string;
  bldgPermitDate: string;
  sharedAreaFromMotherPlot: string;
  unitArea: string;
  actualBuiltUp: string;
  parking: string;
  numberOfFloors: string;
  apartmentOfFloors: string;
  actualNumberOfFloors: string;
  approvedDrawingDate: string;
  apartmentNo: string;
  houseNo: string;
  completionDate: string;
  buildingMatchApprovedDrawing: string;
  consultantName: string;
  components: ApartmentComponent[];
  foundationAndStructure: string;
  walls: string;
  roof: string;
  floorType: string;
  airConditioning: string;
  internalFinishing: InternalFinishingItem[];
  estimatedPerMonth: string;
}

/* ===== Core Interfaces ===== */
export interface Bank {
  id: string;
  name: string;
  nameEn: string;
  logo: string;
  isActive: boolean;
  reportTemplate: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface Beneficiary {
  id: string;
  fullName: string;
  civilId: string;
  phone: string;
  email: string;
  address: string;
  relation: BeneficiaryRelation;
  workplace?: string;
  notes?: string;
  reportsCount: number;
  lastReportDate?: string;
  banksIds: string[];
}

export interface PropertyDetails {
  governorate: string;
  wilayat: string;
  village: string;
  blockNumber: string;
  plotNumber: string;
  area: number;
  areaUnit: string;
  street: string;
  frontage: number;
  floors: number;
  rooms: number;
  bathrooms: number;
  buildingAge: number;
  finishingLevel: FinishingLevel;
  services: string[];
  locationNotes: string;
  detailedDescription: string;
  isDeveloped: DevelopmentStatus;
  wayNumber?: string;
  krookiNumber?: string;
  registrationNumber?: string;
  registrationDate?: string;
  allowableBuildUp?: string;
  allowableFloors?: string;
  possibleFutureExtension?: string;
  zoned?: string;
  krookiMatch?: string;
  topography?: string;
  locationAccess?: string;
  surroundingNorth?: string;
  surroundingEast?: string;
  surroundingSouth?: string;
  surroundingWest?: string;
  qualityOfSurrounding?: string;
  returnOnSaleRent?: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export interface ExtractedData {
  plotNumber: string;
  drawingNumber: string;
  area: number;
  wilayat: string;
  governorate: string;
  usageType: string;
  owner: string;
  isEdited: boolean;
}

export interface ValuationData {
  landValue: number;
  buildingValue: number;
  totalMarketValue: number;
  quickSaleValue: number;
  rentalValue?: number;
  valuationMethod: string;
  riskLevel: string;
  confidencePercentage: number;
  appraiserNotes: string;
  finalRecommendation: string;
}

export interface ApprovalInfo {
  status: ApprovalStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export interface Report {
  id: string;
  reportNumber: string;
  bankId: string;
  bankName: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryCivilId: string;
  beneficiaryPhone: string;
  beneficiaryEmail: string;
  beneficiaryAddress: string;
  beneficiaryRelation: BeneficiaryRelation;
  beneficiaryWorkplace: string;
  applicantName?: string;
  propertyType: PropertyType;
  propertyUsage: PropertyUsage;
  propertyCondition: PropertyCondition;
  propertyDetails: PropertyDetails;
  documents: DocumentFile[];
  extractedData: ExtractedData;
  valuation: ValuationData;
  status: ReportStatus;
  approval: ApprovalInfo;
  appraiserId: string;
  appraiserName: string;
  createdAt: string;
  updatedAt: string;
  fees: number;
  notes: string;
  purposeOfValuation?: string;
  apartmentDetails?: ApartmentDetails;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  relatedReportId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  assignedName?: string;
  relatedReportId?: string;
  relatedReportNumber?: string;
}

export interface AppSettings {
  officeName: string;
  officeNameEn: string;
  logo: string;
  reportPrefix: string;
  reportNextNumber: number;
  defaultCurrency: string;
  language: string;
  theme: string;
  userName: string;
  userRole: string;
  userEmail: string;
  userPhone: string;
  defaultFees: number;
}

export interface DashboardStats {
  totalReportsThisMonth: number;
  completedReports: number;
  inProgressReports: number;
  pendingApprovalReports: number;
  monthlyFees: number;
}

/* ===== Employee Types ===== */
export type EmployeeStatus = 'active' | 'suspended' | 'inactive';
export type EmployeeRole = 'admin' | 'appraiser' | 'reviewer' | 'data_entry' | 'viewer';

export interface Permission {
  id: string;
  label: string;
  description: string;
  category: string;
}

export interface Employee {
  id: string;
  fullName: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  avatar: string;
  department: string;
  joinDate: string;
  lastLogin: string | null;
  lastLogout: string | null;
  isActiveSession: boolean;
  permissions: string[];
  notes: string;
}

export interface LoginLog {
  id: string;
  employeeId: string;
  employeeName: string;
  action: 'login' | 'logout';
  timestamp: string;
  ipAddress: string;
}

export const EMPLOYEE_ROLES: { value: EmployeeRole; label: string; color: string }[] = [
  { value: 'admin', label: 'مدير النظام', color: '#7c3aed' },
  { value: 'appraiser', label: 'مقيم عقاري', color: '#1e3a5f' },
  { value: 'reviewer', label: 'مراجع', color: '#b45309' },
  { value: 'data_entry', label: 'مدخل بيانات', color: '#0891b2' },
  { value: 'viewer', label: 'مشاهد', color: '#64748b' },
];

export const PERMISSIONS: Permission[] = [
  { id: 'reports_create', label: 'إنشاء تقارير', description: 'إنشاء تقارير تثمين جديدة', category: 'التقارير' },
  { id: 'reports_view', label: 'عرض التقارير', description: 'عرض جميع التقارير', category: 'التقارير' },
  { id: 'reports_edit', label: 'تعديل التقارير', description: 'تعديل التقارير الموجودة', category: 'التقارير' },
  { id: 'reports_delete', label: 'حذف التقارير', description: 'حذف التقارير', category: 'التقارير' },
  { id: 'reports_export', label: 'تصدير التقارير', description: 'تصدير التقارير كـ PDF', category: 'التقارير' },
  { id: 'reports_archive', label: 'أرشفة التقارير', description: 'أرشفة التقارير المعتمدة', category: 'التقارير' },
  { id: 'approvals_view', label: 'عرض الاعتمادات', description: 'عرض طلبات الاعتماد', category: 'الاعتمادات' },
  { id: 'approvals_approve', label: 'اعتماد التقارير', description: 'اعتماد أو رفض التقارير', category: 'الاعتمادات' },
  { id: 'employees_view', label: 'عرض الموظفين', description: 'عرض قائمة الموظفين', category: 'الموظفين' },
  { id: 'employees_manage', label: 'إدارة الموظفين', description: 'إضافة وتعديل وحذف الموظفين', category: 'الموظفين' },
  { id: 'employees_permissions', label: 'إدارة الصلاحيات', description: 'تعديل صلاحيات الموظفين', category: 'الموظفين' },
  { id: 'banks_manage', label: 'إدارة البنوك', description: 'إضافة وتعديل البنوك', category: 'البنوك' },
  { id: 'beneficiaries_view', label: 'عرض المستفيدين', description: 'عرض قائمة المستفيدين', category: 'المستفيدين' },
  { id: 'settings_manage', label: 'إدارة الإعدادات', description: 'تعديل إعدادات النظام', category: 'النظام' },
  { id: 'archive_view', label: 'عرض الأرشيف', description: 'عرض التقارير المؤرشفة', category: 'الأرشيف' },
  { id: 'notifications_view', label: 'عرض التنبيهات', description: 'عرض الإشعارات والتنبيهات', category: 'النظام' },
];

/* ===== Market Comps Types ===== */
export interface MarketComp {
  id: string;
  title: string;
  propertyType: string;
  wilayat: string;
  area: number;
  price: number;
  pricePerSqm: number;
  source: 'omanreal' | 'cache' | 'manual';
  sourceUrl: string;
  fetchedAt: string;
}

export interface MarketCompsResult {
  success: boolean;
  query: {
    wilayat: string;
    propertyType: string;
    area: number;
    usage: string;
  };
  comparables: MarketComp[];
  analysis: {
    avgPricePerSqm: number;
    minPricePerSqm: number;
    maxPricePerSqm: number;
    estimatedValue: number;
    confidence: number;
    recommendation: string;
    methodology: string;
  };
  cached: boolean;
  timestamp: string;
  error?: string;
}

export interface MarketCacheEntry {
  key: string;
  wilayat: string;
  propertyType: string;
  usage: string;
  results: MarketComp[];
  avgPricePerSqm: number;
  fetchedAt: string;
  expiresAt: string;
}

export const ROLE_DEFAULT_PERMISSIONS: Record<EmployeeRole, string[]> = {
  admin: PERMISSIONS.map(p => p.id),
  appraiser: ['reports_create', 'reports_view', 'reports_edit', 'reports_export', 'reports_archive', 'approvals_view', 'archive_view', 'notifications_view', 'beneficiaries_view'],
  reviewer: ['reports_view', 'approvals_view', 'approvals_approve', 'reports_export', 'reports_archive', 'archive_view', 'notifications_view', 'beneficiaries_view'],
  data_entry: ['reports_create', 'reports_view', 'reports_edit', 'beneficiaries_view', 'notifications_view'],
  viewer: ['reports_view', 'archive_view', 'notifications_view'],
};
