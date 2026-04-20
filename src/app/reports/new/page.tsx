'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { store } from '@/lib/store';
import { generateId, generateReportNumber } from '@/lib/utils';
import { useApp } from '@/components/layout/AppContext';
import { useTheme } from '@/hooks/useTheme';
import { useOCR } from '@/hooks/useOCR';
import { useFileUpload } from '@/hooks/useFileUpload';
import {
  propertyTypes, apartmentComponentDefaults, internalFinishingDefaults,
} from '@/data/mock';
import type {
  Report, PropertyType, PropertyUsage, PropertyCondition,
  FinishingLevel, DevelopmentStatus, BeneficiaryRelation,
  ApartmentComponent, InternalFinishingItem,
} from '@/types';
import {
  ChevronRight, ChevronLeft, Send, Save, Eye, X,
  ZoomIn, ZoomOut, Maximize2, Briefcase, Building2, User,
  Home, MapPin, DollarSign, LandPlot, FileText,
} from 'lucide-react';

import StepIndicator from '@/components/reports/wizard/StepIndicator';
import FileUploadZone from '@/components/reports/wizard/FileUploadZone';
import PhotosUpload from '@/components/reports/wizard/PhotosUpload';
import ValuationTypeStep from '@/components/reports/wizard/steps/ValuationTypeStep';
import BankSelectionStep from '@/components/reports/wizard/steps/BankSelectionStep';
import BeneficiaryStep from '@/components/reports/wizard/steps/BeneficiaryStep';
import DocumentsStep from '@/components/reports/wizard/steps/DocumentsStep';
import PropertyTypeStep from '@/components/reports/wizard/steps/PropertyTypeStep';
import LandPlotStep from '@/components/reports/wizard/steps/LandPlotStep';
import LandDescriptionStep from '@/components/reports/wizard/steps/LandDescriptionStep';
import ValuationStep from '@/components/reports/wizard/steps/ValuationStep';
import ApartmentDocStep from '@/components/reports/wizard/steps/ApartmentDocStep';
import ApartmentDetailsStep from '@/components/reports/wizard/steps/ApartmentDetailsStep';
import PropertyDetailsStep from '@/components/reports/wizard/steps/PropertyDetailsStep';
import MarketValuationStep from '@/components/reports/wizard/steps/MarketValuationStep';
import ReviewSubmitStep from '@/components/reports/wizard/steps/ReviewSubmitStep';
import ReportPreview from '@/components/reports/wizard/ReportPreview';

interface WizardData {
  valuationType: 'bank' | 'personal';
  bankId: string;
  bankName: string;
  ownershipFile: File | null;
  mapFile: File | null;
  idFile: File | null;
  propertyPhotos: File[];
  extractedData: {
    plotNumber: string; drawingNumber: string; area: string;
    wilayat: string; governorate: string; usageType: string; owner: string;
  };
  beneficiaryName: string;
  civilId: string;
  phone: string;
  address: string;
  relation: BeneficiaryRelation;
  applicantName: string;
  propertyType: PropertyType;
  propertyUsage: PropertyUsage;
  propertyCondition: PropertyCondition;
  isDeveloped: DevelopmentStatus;
  governorate: string;
  wilayat: string;
  village: string;
  blockNumber: string;
  plotNumber: string;
  area: string;
  street: string;
  frontage: string;
  floors: string;
  rooms: string;
  bathrooms: string;
  buildingAge: string;
  finishingLevel: FinishingLevel;
  selectedServices: string[];
  locationNotes: string;
  detailedDescription: string;
  wayNumber: string;
  krookiNumber: string;
  registrationNumber: string;
  registrationDate: string;
  allowableBuildUp: string;
  allowableFloors: string;
  possibleFutureExtension: string;
  zoned: string;
  krookiMatch: string;
  topography: string;
  locationAccess: string;
  surroundingNorth: string;
  surroundingEast: string;
  surroundingSouth: string;
  surroundingWest: string;
  qualityOfSurrounding: string;
  returnOnSaleRent: string;
  landValue: string;
  buildingValue: string;
  totalMarketValue: string;
  quickSaleValue: string;
  rentalValue: string;
  valuationMethod: string;
  riskLevel: string;
  confidencePercentage: string;
  appraiserNotes: string;
  finalRecommendation: string;
  purposeOfValuation: string;
  reportNumber: string;
  aptBldgPermitNumber: string;
  aptBldgPermitDate: string;
  aptSharedArea: string;
  aptUnitArea: string;
  aptActualBuiltUp: string;
  aptParking: string;
  aptNumberOfFloors: string;
  aptApartmentOfFloors: string;
  aptActualNumberOfFloors: string;
  aptApprovedDrawingDate: string;
  aptApartmentNo: string;
  aptHouseNo: string;
  aptCompletionDate: string;
  aptBuildingMatch: string;
  aptConsultantName: string;
  aptComponents: ApartmentComponent[];
  aptFoundation: string;
  aptWalls: string;
  aptRoof: string;
  aptFloorType: string;
  aptAirConditioning: string;
  aptInternalFinishing: InternalFinishingItem[];
  aptEstimatedPerMonth: string;
  valuationFees: string;
}

const initialData: WizardData = {
  valuationType: 'bank', bankId: '', bankName: '',
  ownershipFile: null, mapFile: null, idFile: null, propertyPhotos: [],
  extractedData: { plotNumber: '', drawingNumber: '', area: '', wilayat: '', governorate: '', usageType: '', owner: '' },
  beneficiaryName: '', civilId: '', phone: '', address: '',
  relation: 'owner', applicantName: '',
  propertyType: 'land', propertyUsage: 'residential', propertyCondition: 'good', isDeveloped: 'vacant_land',
  governorate: '', wilayat: '', village: '', blockNumber: '', plotNumber: '',
  area: '', street: '', frontage: '', floors: '0', rooms: '0', bathrooms: '0',
  buildingAge: '0', finishingLevel: 'not_finished', selectedServices: [],
  locationNotes: '', detailedDescription: '',
  wayNumber: '', krookiNumber: '', registrationNumber: '', registrationDate: '',
  allowableBuildUp: '', allowableFloors: 'na', possibleFutureExtension: '', zoned: 'residential',
  krookiMatch: 'yes', topography: 'leveled', locationAccess: '',
  surroundingNorth: '', surroundingEast: '', surroundingSouth: '', surroundingWest: '',
  qualityOfSurrounding: 'good', returnOnSaleRent: 'good',
  landValue: '', buildingValue: '', totalMarketValue: '', quickSaleValue: '',
  rentalValue: '', valuationMethod: 'طريقة السوق', riskLevel: 'medium',
  confidencePercentage: '80', appraiserNotes: '', finalRecommendation: '',
  purposeOfValuation: 'loan',
  reportNumber: '',
  aptBldgPermitNumber: '', aptBldgPermitDate: '', aptSharedArea: '', aptUnitArea: '',
  aptActualBuiltUp: '', aptParking: '', aptNumberOfFloors: '', aptApartmentOfFloors: '',
  aptActualNumberOfFloors: '', aptApprovedDrawingDate: '', aptApartmentNo: '', aptHouseNo: '',
  aptCompletionDate: '', aptBuildingMatch: 'na', aptConsultantName: '',
  aptComponents: apartmentComponentDefaults.map(c => ({ name: c.nameEn, ff: 0, ph: 0 })),
  aptFoundation: '', aptWalls: '', aptRoof: '', aptFloorType: '', aptAirConditioning: '',
  aptInternalFinishing: internalFinishingDefaults.map(f => ({ description: f.descriptionEn, typeOfItem: '', condition: '' })),
  aptEstimatedPerMonth: '',
  valuationFees: '',
};

const allSteps = [
  { num: 1, title: 'نوع التثمين', icon: <Briefcase size={18} /> },
  { num: 2, title: 'اختيار البنك', icon: <Building2 size={18} /> },
  { num: 3, title: 'بيانات المالك', icon: <User size={18} /> },
  { num: 4, title: 'المستندات', icon: <FileText size={18} /> },
  { num: 5, title: 'نوع العقار', icon: <Home size={18} /> },
  { num: 6, title: 'بيانات القطعة', icon: <LandPlot size={18} /> },
  { num: 7, title: 'وصف الأرض', icon: <MapPin size={18} /> },
  { num: 8, title: 'التثمين', icon: <DollarSign size={18} /> },
  { num: 9, title: 'مراجعة وإرسال', icon: <Send size={18} /> },
];

const apartmentSteps = [
  { num: 1, title: 'نوع التثمين', icon: <Briefcase size={18} /> },
  { num: 2, title: 'اختيار البنك', icon: <Building2 size={18} /> },
  { num: 3, title: 'بيانات المالك', icon: <User size={18} /> },
  { num: 4, title: 'المستندات', icon: <FileText size={18} /> },
  { num: 5, title: 'نوع العقار', icon: <Home size={18} /> },
  { num: 6, title: 'بيانات التوثيق', icon: <LandPlot size={18} /> },
  { num: 7, title: 'تفاصيل الشقة', icon: <MapPin size={18} /> },
  { num: 8, title: 'التثمين', icon: <DollarSign size={18} /> },
  { num: 9, title: 'مراجعة وإرسال', icon: <Send size={18} /> },
];

const nonLandSteps = [
  { num: 1, title: 'نوع التثمين', icon: <Briefcase size={18} /> },
  { num: 2, title: 'اختيار البنك', icon: <Building2 size={18} /> },
  { num: 3, title: 'بيانات المستفيد', icon: <User size={18} /> },
  { num: 4, title: 'المستندات والكروكي', icon: <FileText size={18} /> },
  { num: 5, title: 'نوع العقار', icon: <Home size={18} /> },
  { num: 6, title: 'تفاصيل العقار', icon: <MapPin size={18} /> },
  { num: 7, title: 'القيمة السوقية', icon: <DollarSign size={18} /> },
  { num: 8, title: 'حفظ وإرسال', icon: <Send size={18} /> },
];

function CreateReportWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { showToast, currentUser, notify } = useApp();
  const { isDark } = useTheme();
  const dm = isDark;
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(() => {
    if (editId) {
      const existing = store.getReport(editId);
      if (existing) {
        const pd = existing.propertyDetails;
        const v = existing.valuation;
        return {
          valuationType: existing.bankId ? 'bank' : 'personal',
          bankId: existing.bankId,
          bankName: existing.bankName === 'تثمين شخصي' ? '' : existing.bankName,
          ownershipFile: null, mapFile: null, idFile: null, propertyPhotos: [],
          extractedData: { plotNumber: existing.extractedData.plotNumber || '', drawingNumber: '', area: String(existing.extractedData.area || ''), wilayat: existing.extractedData.wilayat || '', governorate: existing.extractedData.governorate || '', usageType: existing.extractedData.usageType || '', owner: '' },
          beneficiaryName: existing.beneficiaryName,
          civilId: existing.beneficiaryCivilId,
          phone: existing.beneficiaryPhone,
          address: existing.beneficiaryAddress,
          relation: existing.beneficiaryRelation,
          applicantName: existing.applicantName || '',
          propertyType: existing.propertyType,
          propertyUsage: existing.propertyUsage,
          propertyCondition: existing.propertyCondition,
          isDeveloped: pd.isDeveloped || 'vacant_land',
          governorate: pd.governorate,
          wilayat: pd.wilayat,
          village: pd.village,
          blockNumber: pd.blockNumber,
          plotNumber: pd.plotNumber,
          area: String(pd.area),
          street: pd.street,
          frontage: String(pd.frontage || ''),
          floors: String(pd.floors || 0),
          rooms: String(pd.rooms || 0),
          bathrooms: String(pd.bathrooms || 0),
          buildingAge: String(pd.buildingAge || 0),
          finishingLevel: pd.finishingLevel,
          selectedServices: pd.services || [],
          locationNotes: pd.locationNotes || '',
          detailedDescription: pd.detailedDescription || '',
          wayNumber: pd.wayNumber || '',
          krookiNumber: pd.krookiNumber || '',
          registrationNumber: pd.registrationNumber || '',
          registrationDate: pd.registrationDate || '',
          allowableBuildUp: pd.allowableBuildUp || '',
          allowableFloors: pd.allowableFloors || 'na',
          possibleFutureExtension: pd.possibleFutureExtension || '',
          zoned: pd.zoned || 'residential',
          krookiMatch: pd.krookiMatch || 'yes',
          topography: pd.topography || 'leveled',
          locationAccess: pd.locationAccess || '',
          surroundingNorth: pd.surroundingNorth || '',
          surroundingEast: pd.surroundingEast || '',
          surroundingSouth: pd.surroundingSouth || '',
          surroundingWest: pd.surroundingWest || '',
          qualityOfSurrounding: pd.qualityOfSurrounding || 'good',
          returnOnSaleRent: pd.returnOnSaleRent || 'good',
          landValue: String(v.landValue || ''),
          buildingValue: String(v.buildingValue || ''),
          totalMarketValue: String(v.totalMarketValue || ''),
          quickSaleValue: String(v.quickSaleValue || ''),
          rentalValue: String(v.rentalValue || ''),
          valuationMethod: v.valuationMethod || 'طريقة السوق',
          riskLevel: v.riskLevel || 'medium',
          confidencePercentage: String(v.confidencePercentage || 80),
          appraiserNotes: v.appraiserNotes || '',
          finalRecommendation: v.finalRecommendation || '',
          purposeOfValuation: existing.purposeOfValuation || 'loan',
          reportNumber: existing.reportNumber,
          aptBldgPermitNumber: existing.apartmentDetails?.bldgPermitNumber || '',
          aptBldgPermitDate: existing.apartmentDetails?.bldgPermitDate || '',
          aptSharedArea: existing.apartmentDetails?.sharedAreaFromMotherPlot || '',
          aptUnitArea: existing.apartmentDetails?.unitArea || '',
          aptActualBuiltUp: existing.apartmentDetails?.actualBuiltUp || '',
          aptParking: existing.apartmentDetails?.parking || '',
          aptNumberOfFloors: existing.apartmentDetails?.numberOfFloors || '',
          aptApartmentOfFloors: existing.apartmentDetails?.apartmentOfFloors || '',
          aptActualNumberOfFloors: existing.apartmentDetails?.actualNumberOfFloors || '',
          aptApprovedDrawingDate: existing.apartmentDetails?.approvedDrawingDate || '',
          aptApartmentNo: existing.apartmentDetails?.apartmentNo || '',
          aptHouseNo: existing.apartmentDetails?.houseNo || '',
          aptCompletionDate: existing.apartmentDetails?.completionDate || '',
          aptBuildingMatch: existing.apartmentDetails?.buildingMatchApprovedDrawing || 'na',
          aptConsultantName: existing.apartmentDetails?.consultantName || '',
          aptComponents: existing.apartmentDetails?.components || apartmentComponentDefaults.map(c => ({ name: c.nameEn, ff: 0, ph: 0 })),
          aptFoundation: existing.apartmentDetails?.foundationAndStructure || '',
          aptWalls: existing.apartmentDetails?.walls || '',
          aptRoof: existing.apartmentDetails?.roof || '',
          aptFloorType: existing.apartmentDetails?.floorType || '',
          aptAirConditioning: existing.apartmentDetails?.airConditioning || '',
          aptInternalFinishing: existing.apartmentDetails?.internalFinishing || internalFinishingDefaults.map(f => ({ description: f.descriptionEn, typeOfItem: '', condition: '' })),
          aptEstimatedPerMonth: existing.apartmentDetails?.estimatedPerMonth || '',
          valuationFees: String(existing.fees || ''),
        };
      }
    }
    return { ...initialData, reportNumber: generateReportNumber(store.getSettings().reportNextNumber) };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bankSearch, setBankSearch] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState<{ url: string; type: string; name: string; label: string } | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);

  // Individual extraction state
  const [ownershipExtracting, setOwnershipExtracting] = useState(false);
  const [sketchExtracting, setSketchExtracting] = useState(false);
  const [ownershipExtracted, setOwnershipExtracted] = useState(false);
  const [sketchExtracted, setSketchExtracted] = useState(false);

  const { extracting, ocrResult, ocrStep, runExtraction } = useOCR(showToast);
  const { previews, createPreview, removePreview } = useFileUpload();

  const isLand = data.propertyType === 'land';
  const isApartment = data.propertyType === 'apartment';
  const isPersonal = data.valuationType === 'personal';

  const activeSteps = isLand ? allSteps : isApartment ? apartmentSteps : nonLandSteps;
  const visibleSteps = isPersonal ? activeSteps.filter(s => s.num !== 2) : activeSteps;
  const totalSteps = visibleSteps.length;

  const getContentStep = (): number => {
    if (isPersonal && currentStep >= 2) return currentStep + 1;
    return currentStep;
  };
  const contentStep = getContentStep();

  useEffect(() => {
    const draft = store.getDraft('new_report');
    if (draft) setShowDraftModal(true);
  }, []);

  const banks = store.getActiveBanks();

  const update = useCallback((field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  }, []);

  const updateExtracted = useCallback((field: string, value: string) => {
    setData(prev => ({ ...prev, extractedData: { ...prev.extractedData, [field]: value } }));
  }, []);

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};
    const s = isPersonal && step >= 2 ? step + 1 : step;

    if (s === 2 && data.valuationType === 'bank' && !data.bankId) errs.bankId = 'يرجى اختيار البنك';
    if (s === 3) {
      if (!data.beneficiaryName.trim()) errs.beneficiaryName = 'يرجى إدخال الاسم';
      if (!data.civilId.trim()) errs.civilId = 'يرجى إدخال الرقم المدني';
      if (data.civilId.trim() && !/^\d{8}$/.test(data.civilId)) errs.civilId = 'الرقم المدني يجب أن يكون 8 أرقام';
      if (!data.phone.trim()) errs.phone = 'يرجى إدخال رقم الهاتف';
    }
    if (s === 6) {
      if (!data.governorate) errs.governorate = 'يرجى اختيار المحافظة';
      if (!data.wilayat) errs.wilayat = 'يرجى اختيار الولاية';
      if (!data.plotNumber.trim()) errs.plotNumber = 'يرجى إدخال رقم القطعة';
      if (!data.area.trim()) errs.area = 'يرجى إدخال المساحة';
      if (isApartment && !data.aptUnitArea.trim()) errs.aptUnitArea = 'يرجى إدخال مساحة الوحدة';
    }
    if ((isLand && s === 8) || (isApartment && s === 8)) {
      if (!data.totalMarketValue.trim()) errs.totalMarketValue = 'يرجى إدخال القيمة السوقية';
    }
    if (!isLand && !isApartment && s === 7) {
      if (!data.landValue.trim()) errs.landValue = 'يرجى إدخال قيمة الأرض';
      if (!data.totalMarketValue.trim()) errs.totalMarketValue = 'يرجى إدخال القيمة السوقية';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, totalSteps)); };
  const prev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleFileUpload = useCallback((field: string, file: File) => {
    setData(prev => ({ ...prev, [field]: file }));
    createPreview(field, file);
  }, [createPreview]);

  const handleFileRemove = useCallback((field: string) => {
    setData(prev => ({ ...prev, [field]: null }));
    removePreview(field);
  }, [removePreview]);

  // Multi-photo handlers
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handlePhotosAdd = useCallback((files: File[]) => {
    setData(prev => ({
      ...prev,
      propertyPhotos: [...prev.propertyPhotos, ...files],
    }));
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const handlePhotoRemove = useCallback((index: number) => {
    setData(prev => ({
      ...prev,
      propertyPhotos: prev.propertyPhotos.filter((_, i) => i !== index),
    }));
    setPhotoPreviews(prev => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleOCRExtraction = () => {
    const files = [data.ownershipFile, data.mapFile].filter((f): f is File => f !== null);
    runExtraction(files, (result) => {
      const { fields } = result;
      setData(prev => ({
        ...prev,
        extractedData: {
          plotNumber: fields.plotNumber.value,
          drawingNumber: fields.drawingNumber.value,
          area: fields.area.value,
          wilayat: fields.wilayat.value,
          governorate: fields.governorate.value,
          usageType: fields.usageType.value,
          owner: fields.owner.value,
        },
        governorate: fields.governorate.value || prev.governorate,
        wilayat: fields.wilayat.value || prev.wilayat,
        plotNumber: fields.plotNumber.value || prev.plotNumber,
        area: fields.area.value || prev.area,
        blockNumber: fields.blockNumber.value || prev.blockNumber,
        street: fields.street.value || prev.street,
        village: fields.village.value || prev.village,
        frontage: fields.frontage.value || prev.frontage,
        floors: fields.floors.value || prev.floors,
        buildingAge: fields.buildingAge.value || prev.buildingAge,
        beneficiaryName: fields.owner.value || prev.beneficiaryName,
        krookiNumber: fields.drawingNumber.value || prev.krookiNumber,
      }));
    });
  };

  const handlePreviewFile = (url: string, type: string, name: string, label: string) => {
    setFullscreenPreview({ url, type, name, label });
    setPreviewZoom(1);
  };

  const handleSaveDraft = () => {
    const { ownershipFile, mapFile, idFile, propertyPhotos, ...draftData } = data;
    store.saveDraft('new_report', draftData);
    showToast('تم حفظ المسودة', 'success');
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
    const settings = store.getSettings();
    const { compressImageToDataUrl } = await import('@/lib/image-compress');
    const [ownershipUrl, mapUrl, idUrl] = await Promise.all([
      data.ownershipFile ? compressImageToDataUrl(data.ownershipFile) : Promise.resolve(''),
      data.mapFile ? compressImageToDataUrl(data.mapFile) : Promise.resolve(''),
      data.idFile ? compressImageToDataUrl(data.idFile) : Promise.resolve(''),
    ]);
    const photoUrls = await Promise.all(
      data.propertyPhotos.map(f => compressImageToDataUrl(f))
    );

    const report: Report = {
      id: generateId('r'),
      reportNumber: data.reportNumber,
      bankId: data.valuationType === 'bank' ? data.bankId : '',
      bankName: data.valuationType === 'bank' ? data.bankName : 'تثمين شخصي',
      beneficiaryId: generateId('bn'),
      beneficiaryName: data.beneficiaryName,
      beneficiaryCivilId: data.civilId,
      beneficiaryPhone: data.phone,
      beneficiaryEmail: '',
      beneficiaryAddress: data.address,
      beneficiaryRelation: data.relation,
      beneficiaryWorkplace: '',
      applicantName: data.applicantName || undefined,
      propertyType: data.propertyType,
      propertyUsage: data.propertyUsage,
      propertyCondition: data.propertyCondition,
      propertyDetails: {
        governorate: data.governorate,
        wilayat: data.wilayat,
        village: data.village,
        blockNumber: data.blockNumber,
        plotNumber: data.plotNumber,
        area: parseFloat(data.area) || 0,
        areaUnit: 'متر مربع',
        street: data.street,
        frontage: parseFloat(data.frontage) || 0,
        floors: parseInt(data.floors) || 0,
        rooms: parseInt(data.rooms) || 0,
        bathrooms: parseInt(data.bathrooms) || 0,
        buildingAge: parseInt(data.buildingAge) || 0,
        finishingLevel: data.finishingLevel,
        services: data.selectedServices,
        locationNotes: data.locationNotes,
        detailedDescription: data.detailedDescription,
        isDeveloped: data.isDeveloped,
        ...(isLand ? {
          wayNumber: data.wayNumber || undefined,
          krookiNumber: data.krookiNumber || undefined,
          registrationNumber: data.registrationNumber || undefined,
          registrationDate: data.registrationDate || undefined,
          allowableBuildUp: data.allowableBuildUp || undefined,
          allowableFloors: data.allowableFloors || undefined,
          possibleFutureExtension: data.possibleFutureExtension || undefined,
          zoned: data.zoned || undefined,
          krookiMatch: data.krookiMatch || undefined,
          topography: data.topography || undefined,
          locationAccess: data.locationAccess || undefined,
          surroundingNorth: data.surroundingNorth || undefined,
          surroundingEast: data.surroundingEast || undefined,
          surroundingSouth: data.surroundingSouth || undefined,
          surroundingWest: data.surroundingWest || undefined,
          qualityOfSurrounding: data.qualityOfSurrounding || undefined,
          returnOnSaleRent: data.returnOnSaleRent || undefined,
        } : {}),
      },
      documents: [
        ...(data.ownershipFile ? [{ id: generateId('d'), name: data.ownershipFile.name, type: 'ownership' as const, size: data.ownershipFile.size, uploadedAt: new Date().toISOString(), url: ownershipUrl }] : []),
        ...(data.mapFile ? [{ id: generateId('d'), name: data.mapFile.name, type: 'map' as const, size: data.mapFile.size, uploadedAt: new Date().toISOString(), url: mapUrl }] : []),
        ...(data.idFile ? [{ id: generateId('d'), name: data.idFile.name, type: 'id' as const, size: data.idFile.size, uploadedAt: new Date().toISOString(), url: idUrl }] : []),
        ...data.propertyPhotos.map((f, i) => ({ id: generateId('d'), name: f.name, type: 'photo' as const, size: f.size, uploadedAt: new Date().toISOString(), url: photoUrls[i] })),
      ],
      extractedData: { ...data.extractedData, area: parseFloat(data.extractedData.area) || 0, isEdited: false },
      valuation: {
        landValue: parseFloat(data.landValue) || 0,
        buildingValue: parseFloat(data.buildingValue) || 0,
        totalMarketValue: parseFloat(data.totalMarketValue) || 0,
        quickSaleValue: parseFloat(data.quickSaleValue) || 0,
        rentalValue: data.rentalValue ? parseFloat(data.rentalValue) : undefined,
        valuationMethod: data.valuationMethod,
        riskLevel: data.riskLevel,
        confidencePercentage: parseFloat(data.confidencePercentage) || 0,
        appraiserNotes: data.appraiserNotes,
        finalRecommendation: data.finalRecommendation,
      },
      status: 'pending_approval',
      approval: { status: 'pending', submittedAt: new Date().toISOString(), reviewedBy: '', notes: '' },
      appraiserId: currentUser?.id || 'u1',
      appraiserName: currentUser?.fullName || settings.userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fees: data.valuationFees ? parseFloat(data.valuationFees) : (settings.defaultFees || 500),
      notes: '',
      purposeOfValuation: data.purposeOfValuation || undefined,
      ...(isApartment ? {
        apartmentDetails: {
          bldgPermitNumber: data.aptBldgPermitNumber,
          bldgPermitDate: data.aptBldgPermitDate,
          sharedAreaFromMotherPlot: data.aptSharedArea,
          unitArea: data.aptUnitArea,
          actualBuiltUp: data.aptActualBuiltUp,
          parking: data.aptParking,
          numberOfFloors: data.aptNumberOfFloors,
          apartmentOfFloors: data.aptApartmentOfFloors,
          actualNumberOfFloors: data.aptActualNumberOfFloors,
          approvedDrawingDate: data.aptApprovedDrawingDate,
          apartmentNo: data.aptApartmentNo,
          houseNo: data.aptHouseNo,
          completionDate: data.aptCompletionDate,
          buildingMatchApprovedDrawing: data.aptBuildingMatch,
          consultantName: data.aptConsultantName,
          components: data.aptComponents,
          foundationAndStructure: data.aptFoundation,
          walls: data.aptWalls,
          roof: data.aptRoof,
          floorType: data.aptFloorType,
          airConditioning: data.aptAirConditioning,
          internalFinishing: data.aptInternalFinishing,
          estimatedPerMonth: data.aptEstimatedPerMonth,
        },
      } : {}),
    };

    if (editId) {
      const existing = store.getReport(editId);
      if (existing) {
        // Ensure beneficiary exists in DB
        const existingBeneficiary = store.getBeneficiary(report.beneficiaryId);
        if (!existingBeneficiary) {
          await store.addBeneficiary({
            id: report.beneficiaryId,
            fullName: report.beneficiaryName,
            civilId: report.beneficiaryCivilId,
            phone: report.beneficiaryPhone,
            email: report.beneficiaryEmail || '',
            address: report.beneficiaryAddress,
            relation: report.beneficiaryRelation,
            workplace: report.beneficiaryWorkplace || '',
            notes: '',
            reportsCount: 1,
            lastReportDate: new Date().toISOString(),
            banksIds: report.bankId ? [report.bankId] : [],
          });
        }
        store.updateReport(editId, {
          ...report, id: existing.id, createdAt: existing.createdAt, reportNumber: existing.reportNumber,
          status: 'pending_approval',
          approval: { status: 'pending', submittedAt: new Date().toISOString(), reviewedBy: '', notes: '' },
          updatedAt: new Date().toISOString(),
        });
        store.clearDraft('new_report');
        notify({ type: 'approval', title: `تم إعادة إرسال التقرير للتعديل: ${data.reportNumber}`, message: `تم تعديل وإعادة إرسال تقرير ${data.reportNumber} بعد المراجعة`, priority: 'high', relatedReportId: existing.id });
        showToast('تم تعديل التقرير وإعادة إرساله للاعتماد بنجاح', 'success');
        router.push('/reports');
        return;
      }
    }

    // Ensure beneficiary exists in DB before creating the report (FK constraint)
    const existingBen = store.getBeneficiary(report.beneficiaryId);
    if (!existingBen) {
      await store.addBeneficiary({
        id: report.beneficiaryId,
        fullName: report.beneficiaryName,
        civilId: report.beneficiaryCivilId,
        phone: report.beneficiaryPhone,
        email: report.beneficiaryEmail || '',
        address: report.beneficiaryAddress,
        relation: report.beneficiaryRelation,
        workplace: report.beneficiaryWorkplace || '',
        notes: '',
        reportsCount: 1,
        lastReportDate: new Date().toISOString(),
        banksIds: report.bankId ? [report.bankId] : [],
      });
    }

    store.addReport(report);
    store.updateSettings({ reportNextNumber: settings.reportNextNumber + 1 });
    store.clearDraft('new_report');
    notify({ type: 'approval', title: `تقرير جديد بانتظار الاعتماد: ${data.reportNumber}`, message: `تم إرسال تقرير تثمين ${propertyTypes.find(pt => pt.value === data.propertyType)?.label || ''} للمستفيد ${data.beneficiaryName} - القطعة رقم ${data.plotNumber} في ${data.wilayat}`, priority: 'high', relatedReportId: report.id });
    showToast('تم إرسال التقرير للاعتماد بنجاح', 'success');
    router.push('/reports');
    } catch {
      showToast('حدث خطأ أثناء إرسال التقرير', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReport = () => (
    <ReportPreview
      data={data}
      isLand={isLand}
      isApartment={isApartment}
      ownershipPreview={previews.ownershipFile || ''}
      mapPreview={previews.mapFile || ''}
      idPreview={previews.idFile || ''}
      photoPreview={photoPreviews[0] || ''}
      photoPreviews={photoPreviews}
    />
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>{editId ? 'تعديل التقرير' : 'إنشاء تقرير جديد'}</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>{data.reportNumber}</p>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <StepIndicator
          steps={visibleSteps}
          currentStep={currentStep}
          onStepClick={(step) => {
            const s = isPersonal && step >= 2 ? step + 1 : step;
            if (s <= (isPersonal && currentStep >= 2 ? contentStep : currentStep)) {
              setCurrentStep(step);
            }
          }}
        />
      </div>

      <div className="card" style={{ marginBottom: 0, minHeight: 400, paddingBottom: 80, overflow: 'hidden' }}>
        {contentStep === 1 && <ValuationTypeStep value={data.valuationType} onChange={(v) => update('valuationType', v)} />}

        {contentStep === 2 && data.valuationType === 'bank' && (
          <BankSelectionStep
            bankId={data.bankId}
            bankName={data.bankName}
            search={bankSearch}
            onSearchChange={setBankSearch}
            onSelect={(id, name) => { update('bankId', id); update('bankName', name); }}
            banks={banks}
            error={errors.bankId}
          />
        )}

        {contentStep === 3 && (
          <BeneficiaryStep
            data={{
              beneficiaryName: data.beneficiaryName,
              civilId: data.civilId,
              phone: data.phone,
              address: data.address,
              relation: data.relation,
              applicantName: data.applicantName,
            }}
            isLand={isLand}
            errors={errors}
            onChange={update}
          />
        )}

        {contentStep === 4 && (
          <DocumentsStep
            isLand={isLand}
            ownershipFile={data.ownershipFile}
            mapFile={data.mapFile}
            idFile={data.idFile}
            propertyPhotos={data.propertyPhotos}
            ownershipPreview={previews.ownershipFile || ''}
            mapPreview={previews.mapFile || ''}
            idPreview={previews.idFile || ''}
            photoPreview={previews.propertyPhotos_0 || ''}
            photoPreviews={photoPreviews}
            extracting={extracting}
            ocrResult={ocrResult}
            ocrStep={ocrStep}
            extractedData={data.extractedData as any}
            dataFields={data as any}
            ownershipExtracting={ownershipExtracting}
            sketchExtracting={sketchExtracting}
            ownershipExtracted={ownershipExtracted}
            sketchExtracted={sketchExtracted}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
            onPhotosAdd={handlePhotosAdd}
            onPhotoRemove={handlePhotoRemove}
            onRunOCR={handleOCRExtraction}
            onExtractOwnership={() => {}}
            onExtractSketch={() => {}}
            onPreview={handlePreviewFile}
            onUpdateExtracted={updateExtracted}
          />
        )}

        {contentStep === 5 && (
          <PropertyTypeStep
            propertyType={data.propertyType}
            propertyUsage={data.propertyUsage}
            propertyCondition={data.propertyCondition}
            isDeveloped={data.isDeveloped}
            onChange={update}
          />
        )}

        {isLand && contentStep === 6 && (
          <LandPlotStep
            data={{
              governorate: data.governorate, wilayat: data.wilayat, village: data.village,
              plotNumber: data.plotNumber, blockNumber: data.blockNumber, wayNumber: data.wayNumber,
              krookiNumber: data.krookiNumber, registrationNumber: data.registrationNumber,
              registrationDate: data.registrationDate, area: data.area, zoned: data.zoned,
              allowableBuildUp: data.allowableBuildUp, allowableFloors: data.allowableFloors,
              possibleFutureExtension: data.possibleFutureExtension,
            }}
            errors={errors}
            onChange={update}
          />
        )}

        {isLand && contentStep === 7 && (
          <LandDescriptionStep
            data={{
              krookiMatch: data.krookiMatch, topography: data.topography,
              qualityOfSurrounding: data.qualityOfSurrounding, returnOnSaleRent: data.returnOnSaleRent,
              locationAccess: data.locationAccess, surroundingNorth: data.surroundingNorth,
              surroundingEast: data.surroundingEast, surroundingSouth: data.surroundingSouth,
              surroundingWest: data.surroundingWest, locationNotes: data.locationNotes,
            }}
            onChange={update}
          />
        )}

        {(isLand || isApartment) && contentStep === 8 && (
          <ValuationStep
            data={{
              totalMarketValue: data.totalMarketValue,
              quickSaleValue: data.quickSaleValue,
              valuationMethod: data.valuationMethod,
              riskLevel: data.riskLevel,
              confidencePercentage: data.confidencePercentage,
              purposeOfValuation: data.purposeOfValuation,
              appraiserNotes: data.appraiserNotes,
              finalRecommendation: data.finalRecommendation,
              wilayat: data.wilayat,
              propertyType: data.propertyType,
              area: data.area,
              propertyUsage: data.propertyUsage,
              landValue: data.landValue,
              valuationFees: data.valuationFees,
            }}
            errors={errors}
            onChange={update}
            useUnitArea={isApartment}
            unitArea={data.aptUnitArea}
          />
        )}

        {isApartment && contentStep === 6 && (
          <ApartmentDocStep data={data as any} errors={errors} onChange={update} />
        )}

        {isApartment && contentStep === 7 && (
          <ApartmentDetailsStep
            data={{
              aptApartmentNo: data.aptApartmentNo,
              aptHouseNo: data.aptHouseNo,
              aptCompletionDate: data.aptCompletionDate,
              aptConsultantName: data.aptConsultantName,
              aptBuildingMatch: data.aptBuildingMatch,
              aptComponents: data.aptComponents,
              aptFoundation: data.aptFoundation,
              aptWalls: data.aptWalls,
              aptRoof: data.aptRoof,
              aptFloorType: data.aptFloorType,
              aptAirConditioning: data.aptAirConditioning,
              aptInternalFinishing: data.aptInternalFinishing,
              aptEstimatedPerMonth: data.aptEstimatedPerMonth,
            }}
            onChange={update}
          />
        )}

        {!isLand && !isApartment && contentStep === 6 && (
          <PropertyDetailsStep
            data={{
              governorate: data.governorate, wilayat: data.wilayat, village: data.village,
              blockNumber: data.blockNumber, plotNumber: data.plotNumber, area: data.area,
              street: data.street, frontage: data.frontage, floors: data.floors,
              rooms: data.rooms, bathrooms: data.bathrooms, buildingAge: data.buildingAge,
              finishingLevel: data.finishingLevel, selectedServices: data.selectedServices,
              locationNotes: data.locationNotes, detailedDescription: data.detailedDescription,
            }}
            errors={errors}
            onChange={update}
          />
        )}

        {!isLand && !isApartment && contentStep === 7 && (
          <MarketValuationStep
            data={{
              landValue: data.landValue, buildingValue: data.buildingValue,
              totalMarketValue: data.totalMarketValue, quickSaleValue: data.quickSaleValue,
              rentalValue: data.rentalValue, valuationFees: data.valuationFees,
              confidencePercentage: data.confidencePercentage,
              valuationMethod: data.valuationMethod, riskLevel: data.riskLevel,
              appraiserNotes: data.appraiserNotes, finalRecommendation: data.finalRecommendation,
              wilayat: data.wilayat, propertyType: data.propertyType,
              area: data.area, propertyUsage: data.propertyUsage,
            }}
            errors={errors}
            onChange={update}
          />
        )}

        {currentStep === totalSteps && (
          <ReviewSubmitStep data={data} isLand={isLand} isApartment={isApartment} renderReport={renderReport} />
        )}

        <div className="wizard-nav-bar">
          <div>
            {currentStep > 1 && (
              <button onClick={prev} className="btn btn-outline"><ChevronRight size={18} /> السابق</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSaveDraft} className="btn btn-ghost"><Save size={18} /> حفظ مسودة</button>
            {currentStep < totalSteps ? (
              <button onClick={next} className="btn btn-primary">التالي <ChevronLeft size={18} /></button>
            ) : (
              <>
                <button onClick={() => setShowPreview(true)} className="btn btn-outline"><Eye size={18} /> معاينة</button>
                <button onClick={() => setShowConfirm(true)} className="btn btn-success" disabled={submitting}><Send size={18} /> إرسال للاعتماد</button>
              </>
            )}
          </div>
        </div>
      </div>

      {showDraftModal && (
        <div className="wizard-modal-backdrop">
          <div className="wizard-modal-content">
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: dm ? '#451a03' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Save size={32} color="#d97706" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>مسودة محفوظة</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 8px', lineHeight: 1.6 }}>تم العثور على مسودة غير مكتملة. هل تريد استئناف العمل من حيث توقفت؟</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 24px' }}>يمكنك البدء من جديد لمسح المسودة القديمة</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => { store.clearDraft('new_report'); setShowDraftModal(false); setData({ ...initialData, reportNumber: generateReportNumber(store.getSettings().reportNextNumber) }); }} className="btn btn-outline" style={{ flex: 1 }}>البدء من جديد</button>
              <button onClick={() => { const draft = store.getDraft('new_report') as Partial<WizardData> | null; if (draft) setData({ ...initialData, ...draft, ownershipFile: null, mapFile: null, idFile: null, propertyPhotos: [], reportNumber: draft.reportNumber || generateReportNumber(store.getSettings().reportNextNumber) }); showToast('تم استعادة المسودة بنجاح', 'success'); setShowDraftModal(false); }} className="btn btn-primary" style={{ flex: 1 }}>استئناف المسودة</button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="wizard-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}>
          <div className="wizard-modal-content">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: dm ? 'var(--color-success-bg)' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Send size={28} color="#15803d" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{editId ? 'إعادة إرسال التقرير بعد التعديل؟' : 'إرسال التقرير للاعتماد؟'}</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 24px' }}>{editId ? `هل أنت متأكد من إعادة إرسال التقرير ${data.reportNumber} بعد التعديل؟` : `هل أنت متأكد من إرسال التقرير ${data.reportNumber} للاعتماد؟`}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowConfirm(false)} className="btn btn-ghost" disabled={submitting}>إلغاء</button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting}>
                {submitting ? 'جاري الإرسال...' : 'تأكيد الإرسال'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="wizard-preview-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}>
          <div className="wizard-preview-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>معاينة التقرير — {data.reportNumber}</h3>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={24} /></button>
            </div>
            <div style={{ maxHeight: '85vh', overflowY: 'auto' }}>
              {renderReport()}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '16px 24px', borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setShowPreview(false)} className="btn btn-ghost">إغلاق</button>
              <button onClick={() => { setShowPreview(false); setShowConfirm(true); }} className="btn btn-primary">إرسال للاعتماد</button>
            </div>
          </div>
        </div>
      )}

      {fullscreenPreview && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setFullscreenPreview(null); setPreviewZoom(1); } }}
          className="wizard-preview-backdrop"
          style={{ background: 'rgba(0,0,0,0.85)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 900, padding: '12px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{fullscreenPreview.label}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{fullscreenPreview.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {fullscreenPreview.type !== 'application/pdf' && (
                <>
                  <button onClick={() => setPreviewZoom(z => Math.max(0.25, z - 0.25))} style={{ padding: 8, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', color: 'white' }}><ZoomOut size={18} /></button>
                  <span style={{ fontSize: 13, color: 'white', fontWeight: 600, minWidth: 48, textAlign: 'center' }}>{Math.round(previewZoom * 100)}%</span>
                  <button onClick={() => setPreviewZoom(z => Math.min(4, z + 0.25))} style={{ padding: 8, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', color: 'white' }}><ZoomIn size={18} /></button>
                  <button onClick={() => setPreviewZoom(1)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'white', fontSize: 12, fontWeight: 500 }}><Maximize2 size={14} /> ملء الشاشة</button>
                </>
              )}
              <button onClick={() => { setFullscreenPreview(null); setPreviewZoom(1); }} style={{ padding: 8, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', color: 'white' }}><X size={20} /></button>
            </div>
          </div>
          <div style={{ flex: 1, width: '100%', maxWidth: 900, maxHeight: 'calc(100vh - 100px)', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
            {fullscreenPreview.type === 'application/pdf' ? (
              <iframe src={fullscreenPreview.url} style={{ width: '100%', height: '100%', minHeight: '70vh', border: 'none', borderRadius: 12, background: 'var(--color-surface)' }} title={fullscreenPreview.name} />
            ) : (
              <img src={fullscreenPreview.url} alt={fullscreenPreview.label} style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 100px)', objectFit: 'contain', transform: `scale(${previewZoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease', borderRadius: 8 }} />
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

export default function CreateReportWizard() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 60 }}>جاري التحميل...</div>}>
      <CreateReportWizardInner />
    </Suspense>
  );
}
