import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, PageBreak,
  TableLayoutType, VerticalAlign,
} from 'docx';
import { saveAs } from 'file-saver';
import type { Report, AppSettings, PropertyType } from '@/types';
import { store } from '@/lib/store';
import { formatDate } from '@/lib/utils';

const enPropertyType: Record<string, string> = {
  land: 'Land', villa: 'Villa', apartment: 'Apartment', residential_building: 'Residential Building',
  commercial_building: 'Commercial Building', mixed_use: 'Mixed Use', farm: 'Farm', warehouse: 'Warehouse', shop: 'Shop',
};
const enUsage: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', industrial: 'Industrial', agricultural: 'Agricultural', investment: 'Investment' };
const enCondition: Record<string, string> = { excellent: 'Excellent', good: 'Good', average: 'Fair', below_average: 'Below Average', poor: 'Poor' };
const enFinishing: Record<string, string> = { luxury: 'Luxury', fully_finished: 'Fully Finished', semi_finished: 'Semi Finished', not_finished: 'Not Finished' };
const enRelation: Record<string, string> = { owner: 'Owner', tenant: 'Tenant', agent: 'Agent', representative: 'Representative', buyer: 'Buyer', seller: 'Seller', other: 'Other' };
const enTopography: Record<string, string> = { leveled: 'Leveled', sloped: 'Sloped', elevated: 'Elevated', low_lying: 'Low Lying', mixed: 'Mixed' };
const enQuality: Record<string, string> = { excellent: 'Excellent', good: 'Good', average: 'Average', poor: 'Poor' };
const enKrookiMatch: Record<string, string> = { yes: 'Yes', no: 'No', partial: 'Partial' };
const enZoned: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', industrial: 'Industrial', agricultural: 'Agricultural', mixed: 'Mixed Use' };
const enFloors: Record<string, string> = { one: 'One Floor', two: 'Two Floors', three: 'Three Floors', four_plus: 'Four Floors or More', na: 'N/A' };
const enBuildingMatch: Record<string, string> = { yes: 'Yes', no: 'No', partial: 'Partial', na: 'N/A' };
const enPurpose: Record<string, string> = { loan: 'Loan', mortgage: 'Mortgage', sale: 'Sale', purchase: 'Purchase', investment: 'Investment', rental: 'Rental', other: 'Other' };
const enRisk: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const enValuationMethod: Record<string, string> = {
  'طريقة السوق': 'Market Approach', 'طريقة التكلفة': 'Cost Approach', 'طريقة الدخل': 'Income Approach',
  'طريقة السوق والتكلفة': 'Market & Cost Approach', 'طريقة الدخل والتكلفة': 'Income & Cost Approach', 'طريقة المقارنة': 'Comparison Approach',
};
const enGov: Record<string, string> = {
  'مسقط': 'Muscat', 'الباطنة': 'Al Batinah', 'الباطنة الشمالية': 'North Al Batinah', 'الباطنة الجنوبية': 'South Al Batinah',
  'الداخلية': 'Ad Dakhiliyah', 'الظاهرة': 'Ad Dhahirah', 'الشرقية': 'Ash Sharqiyah', 'الوسطى': 'Al Wusta',
  'ظفار': 'Dhofar', 'مسندم': 'Musandam', 'البريمي': 'Al Buraimi',
};
const enWilayat: Record<string, string> = {
  'مطرح': 'Muttrah', 'السيب': 'Seeb', 'العامرات': 'Al Amerat', 'بهلاء': 'Bahla', 'قريات': 'Quriyat', 'الخوض': 'Al Khoudh',
  'صحار': 'Sohar', 'الرستاق': 'Rustaq', 'السويق': 'Suwaiq', 'البيحان': 'Al Biyahan', 'نخل': 'Nakhal', 'وادي المعاول': 'Wadi Al Maawil',
  'شناص': 'Shinas', 'ليوا': 'Liwa', 'خصب': 'Khasab',
  'نزوى': 'Nizwa', 'إبرا': 'Ibra', 'سمائل': 'Samail', 'بدبد': 'Bidbid', 'منح': 'Manah', 'الحمراء': 'Al Hamra',
  'صور': 'Sur', 'إبراء': 'Ibra', 'القابل': 'Al Qabil', 'دماء والطائيين': 'Dama Wa At Taiyyin', 'وادي بني خالد': 'Wadi Bani Khalid',
  'صلالة': 'Salalah', 'طاقة': 'Taqah', 'مرباط': 'Mirbat', 'ثمريت': 'Thumrait', 'رخيوت': 'Rakhyut',
  'مدحاء': 'Madha', 'الحاسنة': 'Al Hasana', 'دبا': 'Dibba',
  'السنينة': 'As Sunaynah', 'محضة': 'Mahdah',
  'عبري': 'Ibri', 'ينقل': 'Yanqul', 'محوت': 'Mahut', 'الحصن': 'Al Hisn', 'المنطف': 'Al Muntarif',
  'هيما': 'Haima', 'الدقم': 'Duqm', 'جعلان بني بوحسن': 'Jalan Bani Bu Hassan', 'جعلان بني بو علي': 'Jalan Bani Bu Ali', 'المحيط': 'Al Muhit',
  'البريمي': 'Al Buraimi',
};

function fmtNum(n: number | undefined | null): string {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString('en-US');
}

function fmtCurrency(n: number | undefined | null, currency: string = 'OMR'): string {
  if (n === undefined || n === null) return '—';
  return `${n.toLocaleString('en-US')} ${currency}`;
}

function ltrPara(children: TextRun[], options?: {
  spacing?: { after?: number; before?: number };
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  border?: { bottom?: { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string } };
}): Paragraph {
  return new Paragraph({
    alignment: options?.alignment || AlignmentType.LEFT,
    spacing: options?.spacing || { after: 80 },
    border: options?.border ? { bottom: options.border.bottom } : undefined,
    children,
  });
}

function textRun(t: string, opts?: { bold?: boolean; size?: number; color?: string; font?: string }): TextRun {
  return new TextRun({
    text: t,
    font: opts?.font || 'Times New Roman',
    size: opts?.size || 24,
    bold: opts?.bold || false,
    color: opts?.color || '000000',
  });
}

const THIN_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
};

function fieldRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        borders: THIN_BORDER,
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: 'F8F9FA' },
        children: [ltrPara([textRun(label, { bold: true })])],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        borders: THIN_BORDER,
        verticalAlign: VerticalAlign.CENTER,
        children: [ltrPara([textRun(value)])],
      }),
    ],
  });
}

function fieldTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: rows.map(([l, v]) => fieldRow(l, v)),
  });
}

function sectionTitle(title: string): Paragraph {
  return ltrPara(
    [textRun(title, { bold: true, size: 28, color: '1E3A5F' })],
    {
      spacing: { before: 300, after: 150 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: '1E3A5F' } },
    },
  );
}

function sectionDivider(): Paragraph {
  return ltrPara([textRun('')], { spacing: { before: 100, after: 100 } });
}

export async function exportReportToDocx(report: Report, settings: AppSettings): Promise<void> {
  const pd = report.propertyDetails;
  const apt = report.apartmentDetails;
  const val = report.valuation;
  const isLand = report.propertyType === 'land';
  const isApartment = report.propertyType === 'apartment';

  const bankEnName = report.bankId ? (store.getActiveBanks().find(b => b.id === report.bankId)?.nameEn || report.bankName) : '';

  const children: (Paragraph | Table)[] = [];

  children.push(ltrPara(
    [textRun(settings.officeNameEn || settings.officeName, { bold: true, size: 32, color: '1E3A5F' })],
    { alignment: AlignmentType.CENTER, spacing: { after: 40 } },
  ));
  children.push(ltrPara(
    [textRun('EVALUATION PROPERTY REPORT', { bold: true, size: 30 })],
    { alignment: AlignmentType.CENTER, spacing: { after: 200 } },
  ));

  children.push(ltrPara(
    [
      textRun(`Report No: ${report.reportNumber}`, { bold: true, size: 24 }),
      textRun(`          Date: ${formatDate(report.createdAt)}`, { size: 24 }),
    ],
    { alignment: AlignmentType.CENTER, spacing: { after: 300 } },
  ));

  children.push(sectionTitle('BANK / CLIENT INFORMATION'));
  children.push(sectionDivider());

  const bankRows: [string, string][] = [
    [report.bankId ? 'Bank Name' : 'Valuation Type', report.bankId ? bankEnName : 'Personal Valuation'],
  ];
  children.push(fieldTable(bankRows));
  children.push(sectionDivider());

  const beneficiaryTitle = isLand ? 'OWNER & APPLICANT' : 'BENEFICIARY';
  children.push(ltrPara(
    [textRun(beneficiaryTitle, { bold: true, size: 26, color: '1E3A5F' })],
    { spacing: { after: 100 } },
  ));

  const beneficiaryRows: [string, string][] = [
    [isLand ? 'Owner Name' : 'Full Name', report.beneficiaryName],
    ['Civil ID', report.beneficiaryCivilId],
    ['Phone', report.beneficiaryPhone],
    ['Email', report.beneficiaryEmail],
    ['Address', report.beneficiaryAddress],
    ['Relation', enRelation[report.beneficiaryRelation] || report.beneficiaryRelation || '—'],
  ];
  if (isLand && report.applicantName) {
    beneficiaryRows.push(['Applicant Name', report.applicantName]);
  }
  children.push(fieldTable(beneficiaryRows));
  children.push(sectionDivider());

  children.push(sectionTitle('PROPERTY INFORMATION'));
  children.push(sectionDivider());

  const propertyInfoRows: [string, string][] = [
    ['Property Type', enPropertyType[report.propertyType] || report.propertyType],
    ['Usage', enUsage[report.propertyUsage] || report.propertyUsage],
    ['Condition', enCondition[report.propertyCondition] || report.propertyCondition],
  ];
  if (report.purposeOfValuation) {
    propertyInfoRows.push(['Purpose of Valuation', enPurpose[report.purposeOfValuation] || report.purposeOfValuation]);
  }
  children.push(fieldTable(propertyInfoRows));
  children.push(sectionDivider());

  if (isLand) {
    children.push(sectionTitle('DOCUMENTATION DETAILS OF PLOT'));
    children.push(sectionDivider());
    children.push(fieldTable([
      ['Governorate', enGov[pd.governorate] || pd.governorate],
      ['Wilayat', enWilayat[pd.wilayat] || pd.wilayat],
      ['Village / Area', pd.village],
      ['Plot No.', pd.plotNumber],
      ['Block No.', pd.blockNumber],
      ['Area', `${fmtNum(pd.area)} ${pd.areaUnit}`],
      ['Way No.', pd.wayNumber || '—'],
      ['Krookie Number', pd.krookiNumber || '—'],
      ['Registration Number', pd.registrationNumber || '—'],
      ['Registration Date', pd.registrationDate || '—'],
      ['Zoned', (pd.zoned && enZoned[pd.zoned]) || pd.zoned || '—'],
      ['Allowable Build Up', pd.allowableBuildUp || '—'],
      ['Allowable Floors', (pd.allowableFloors && enFloors[pd.allowableFloors]) || pd.allowableFloors || 'N/A'],
      ['Possible Future Extension', pd.possibleFutureExtension || '—'],
    ]));
    children.push(sectionDivider());

    children.push(sectionTitle('DESCRIPTION AND DETAILS OF PLOT'));
    children.push(sectionDivider());
    children.push(fieldTable([
      ['Krooki Match', (pd.krookiMatch && enKrookiMatch[pd.krookiMatch]) || pd.krookiMatch || '—'],
      ['Topography', (pd.topography && enTopography[pd.topography]) || pd.topography || '—'],
      ['Quality of Surrounding', (pd.qualityOfSurrounding && enQuality[pd.qualityOfSurrounding]) || pd.qualityOfSurrounding || '—'],
      ['Return on Sale / Rent', (pd.returnOnSaleRent && enQuality[pd.returnOnSaleRent]) || pd.returnOnSaleRent || '—'],
    ]));
    if (pd.locationAccess) {
      children.push(sectionDivider());
      children.push(ltrPara([textRun('Location / Access:', { bold: true, size: 24 })], { spacing: { after: 60 } }));
      children.push(ltrPara([textRun(pd.locationAccess)], { spacing: { after: 60 } }));
    }
    if (pd.surroundingNorth || pd.surroundingEast || pd.surroundingSouth || pd.surroundingWest) {
      children.push(sectionDivider());
      children.push(ltrPara([textRun('Surrounding Plots:', { bold: true, size: 24 })], { spacing: { after: 60 } }));
      const surroundingRows: [string, string][] = [];
      if (pd.surroundingNorth) surroundingRows.push(['North', pd.surroundingNorth]);
      if (pd.surroundingEast) surroundingRows.push(['East', pd.surroundingEast]);
      if (pd.surroundingSouth) surroundingRows.push(['South', pd.surroundingSouth]);
      if (pd.surroundingWest) surroundingRows.push(['West', pd.surroundingWest]);
      children.push(fieldTable(surroundingRows));
    }
    if (pd.locationNotes) {
      children.push(sectionDivider());
      children.push(ltrPara([textRun('Additional Remarks:', { bold: true, size: 24 })], { spacing: { after: 60 } }));
      children.push(ltrPara([textRun(pd.locationNotes)], { spacing: { after: 60 } }));
    }
  } else if (isApartment && apt) {
    children.push(sectionTitle('DOCUMENTATION DETAILS'));
    children.push(sectionDivider());
    children.push(fieldTable([
      ['Governorate', enGov[pd.governorate] || pd.governorate],
      ['Wilayat', enWilayat[pd.wilayat] || pd.wilayat],
      ['Village / Area', pd.village],
      ['Plot No.', pd.plotNumber],
      ['Block No.', pd.blockNumber],
      ['Mother Plot Area', `${fmtNum(pd.area)} ${pd.areaUnit}`],
      ['Way No.', pd.wayNumber || '—'],
      ['Krookie Number', pd.krookiNumber || '—'],
      ['Registration Number', pd.registrationNumber || '—'],
      ['Registration Date', pd.registrationDate || '—'],
      ['Bldg. Permit Number', apt.bldgPermitNumber || '—'],
      ['Bldg. Permit Date', apt.bldgPermitDate || '—'],
      ['Shared Area', apt.sharedAreaFromMotherPlot || '—'],
      ['Unit Area', apt.unitArea || '—'],
      ['Actual Built Up', apt.actualBuiltUp || '—'],
      ['Parking', apt.parking || '—'],
      ['Number of Floors', apt.numberOfFloors || '—'],
      ['Apartment of Floors', apt.apartmentOfFloors || '—'],
      ['Actual Number of Floors', apt.actualNumberOfFloors || '—'],
      ['Approved Drawing Date', apt.approvedDrawingDate || '—'],
    ]));
    children.push(sectionDivider());

    children.push(sectionTitle('LOCATION DESCRIPTION'));
    children.push(sectionDivider());
    children.push(fieldTable([
      ['Krooki Match', (pd.krookiMatch && enKrookiMatch[pd.krookiMatch]) || pd.krookiMatch || '—'],
      ['Topography', (pd.topography && enTopography[pd.topography]) || pd.topography || '—'],
      ['Quality of Surrounding', (pd.qualityOfSurrounding && enQuality[pd.qualityOfSurrounding]) || pd.qualityOfSurrounding || '—'],
      ['Return on Sale / Rent', (pd.returnOnSaleRent && enQuality[pd.returnOnSaleRent]) || pd.returnOnSaleRent || '—'],
    ]));
    if (pd.surroundingNorth || pd.surroundingEast || pd.surroundingSouth || pd.surroundingWest) {
      children.push(sectionDivider());
      children.push(ltrPara([textRun('Surrounding Plots:', { bold: true, size: 24 })], { spacing: { after: 60 } }));
      const surroundingRows: [string, string][] = [];
      if (pd.surroundingNorth) surroundingRows.push(['North', pd.surroundingNorth]);
      if (pd.surroundingEast) surroundingRows.push(['East', pd.surroundingEast]);
      if (pd.surroundingSouth) surroundingRows.push(['South', pd.surroundingSouth]);
      if (pd.surroundingWest) surroundingRows.push(['West', pd.surroundingWest]);
      children.push(fieldTable(surroundingRows));
    }
    if (pd.locationAccess) {
      children.push(sectionDivider());
      children.push(ltrPara([textRun('Location / Access:', { bold: true, size: 24 })], { spacing: { after: 60 } }));
      children.push(ltrPara([textRun(pd.locationAccess)], { spacing: { after: 60 } }));
    }
    children.push(sectionDivider());

    children.push(sectionTitle('APARTMENT DETAILS'));
    children.push(sectionDivider());
    children.push(fieldTable([
      ['Apartment No', apt.apartmentNo || '—'],
      ['House No', apt.houseNo || '—'],
      ['Completion Date', apt.completionDate || '—'],
      ['Building Match Approved Drawing', enBuildingMatch[apt.buildingMatchApprovedDrawing] || apt.buildingMatchApprovedDrawing || '—'],
      ['Consultant Name', apt.consultantName || '—'],
    ]));
    children.push(sectionDivider());

    if (apt.components.length > 0) {
      children.push(ltrPara(
        [textRun('APARTMENT COMPONENTS', { bold: true, size: 26, color: '1E3A5F' })],
        { spacing: { after: 100 } },
      ));
      const componentHeader = new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, shading: { fill: '1E3A5F' }, verticalAlign: VerticalAlign.CENTER,
            children: [ltrPara([textRun('TOTAL', { bold: true, color: 'FFFFFF', size: 22 })], { alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, shading: { fill: '1E3A5F' }, verticalAlign: VerticalAlign.CENTER,
            children: [ltrPara([textRun('P.H.', { bold: true, color: 'FFFFFF', size: 22 })], { alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, shading: { fill: '1E3A5F' }, verticalAlign: VerticalAlign.CENTER,
            children: [ltrPara([textRun('F.F.', { bold: true, color: 'FFFFFF', size: 22 })], { alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, shading: { fill: '1E3A5F' }, verticalAlign: VerticalAlign.CENTER,
            children: [ltrPara([textRun('Component', { bold: true, color: 'FFFFFF', size: 22 })])],
          }),
        ],
      });
      const componentRows = apt.components.map(c => new TableRow({
        children: [
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, verticalAlign: VerticalAlign.CENTER, children: [ltrPara([textRun(String((c.ff || 0) + (c.ph || 0)), { size: 22 })], { alignment: AlignmentType.CENTER })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, verticalAlign: VerticalAlign.CENTER, children: [ltrPara([textRun(c.ph ? String(c.ph) : '—', { size: 22 })], { alignment: AlignmentType.CENTER })] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, verticalAlign: VerticalAlign.CENTER, children: [ltrPara([textRun(c.ff ? String(c.ff) : '—', { size: 22 })], { alignment: AlignmentType.CENTER })] }),
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, verticalAlign: VerticalAlign.CENTER, children: [ltrPara([textRun(c.name, { size: 22 })])] }),
        ],
      }));
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, rows: [componentHeader, ...componentRows] }));
      children.push(sectionDivider());
    }

    children.push(sectionTitle('APARTMENT SPECIFICATIONS'));
    children.push(sectionDivider());
    children.push(fieldTable([
      ['Foundation & Structure', apt.foundationAndStructure || '—'],
      ['Walls', apt.walls || '—'],
      ['Roof', apt.roof || '—'],
      ['Floors', apt.floorType || '—'],
      ['Air Conditioning', apt.airConditioning || '—'],
    ]));
    children.push(sectionDivider());

    if (apt.internalFinishing.length > 0) {
      children.push(ltrPara(
        [textRun('INTERNAL FINISHING', { bold: true, size: 26, color: '1E3A5F' })],
        { spacing: { after: 100 } },
      ));
      const finishingHeader = new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, shading: { fill: '1E3A5F' }, verticalAlign: VerticalAlign.CENTER, children: [ltrPara([textRun('Condition', { bold: true, color: 'FFFFFF', size: 22 })])] }),
          new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, shading: { fill: '1E3A5F' }, verticalAlign: VerticalAlign.CENTER, children: [ltrPara([textRun('Type / Qnty', { bold: true, color: 'FFFFFF', size: 22 })])] }),
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, shading: { fill: '1E3A5F' }, verticalAlign: VerticalAlign.CENTER, children: [ltrPara([textRun('Item Description', { bold: true, color: 'FFFFFF', size: 22 })])] }),
        ],
      });
      const finishingRows = apt.internalFinishing.map(item => new TableRow({
        children: [
          new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, verticalAlign: VerticalAlign.CENTER, children: [ltrPara([textRun(item.condition || '—', { size: 22 })])] }),
          new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, verticalAlign: VerticalAlign.CENTER, children: [ltrPara([textRun(item.typeOfItem || '—', { size: 22 })])] }),
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: THIN_BORDER, verticalAlign: VerticalAlign.CENTER, children: [ltrPara([textRun(item.description, { size: 22 })])] }),
        ],
      }));
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, rows: [finishingHeader, ...finishingRows] }));
      children.push(sectionDivider());
    }

    if (apt.estimatedPerMonth) {
      children.push(fieldTable([['Estimated Per Month', `${apt.estimatedPerMonth} OMR`]]));
      children.push(sectionDivider());
    }
  } else {
    children.push(sectionTitle('PROPERTY DETAILS'));
    children.push(sectionDivider());
    const locationRows: [string, string][] = [
      ['Governorate', enGov[pd.governorate] || pd.governorate],
      ['Wilayat', enWilayat[pd.wilayat] || pd.wilayat],
      ['Village / Area', pd.village],
      ['Plot No.', pd.plotNumber],
      ['Area', `${fmtNum(pd.area)} ${pd.areaUnit}`],
      ['Street', pd.street || '—'],
      ['Frontage', pd.frontage ? `${fmtNum(pd.frontage)} m` : '—'],
    ];
    if (pd.floors > 0) locationRows.push(['Floors', String(pd.floors)]);
    if (pd.rooms > 0) locationRows.push(['Rooms', String(pd.rooms)]);
    if (pd.bathrooms > 0) locationRows.push(['Bathrooms', String(pd.bathrooms)]);
    if (pd.buildingAge > 0) locationRows.push(['Building Age', `${pd.buildingAge} years`]);
    if (pd.finishingLevel) locationRows.push(['Finishing Level', enFinishing[pd.finishingLevel as keyof typeof enFinishing] || pd.finishingLevel]);
    if (pd.services.length > 0) locationRows.push(['Services', pd.services.join(', ')]);
    if (pd.locationNotes) locationRows.push(['Location Notes', pd.locationNotes]);
    if (pd.detailedDescription) locationRows.push(['Detailed Description', pd.detailedDescription]);
    children.push(fieldTable(locationRows));
    children.push(sectionDivider());
  }

  children.push(sectionTitle('VALUATION'));
  children.push(sectionDivider());

  if (isLand) {
    children.push(fieldTable([
      ['Market Value', fmtCurrency(val.totalMarketValue, settings.defaultCurrency)],
      ['Force Sale Value', fmtCurrency(val.quickSaleValue, settings.defaultCurrency)],
    ]));
  } else if (isApartment) {
    const aptValRows: [string, string][] = [
      ['Market Value', fmtCurrency(val.totalMarketValue, settings.defaultCurrency)],
      ['Force Sale Value', fmtCurrency(val.quickSaleValue, settings.defaultCurrency)],
    ];
    if (apt?.estimatedPerMonth) {
      aptValRows.push(['Estimated Per Month', `${apt.estimatedPerMonth} OMR`]);
    }
    children.push(fieldTable(aptValRows));
  } else {
    children.push(fieldTable([
      ['Land Value', fmtCurrency(val.landValue, settings.defaultCurrency)],
      ['Building Value', fmtCurrency(val.buildingValue, settings.defaultCurrency)],
      ['Total Market Value', fmtCurrency(val.totalMarketValue, settings.defaultCurrency)],
      ['Quick Sale Value', fmtCurrency(val.quickSaleValue, settings.defaultCurrency)],
      ...(val.rentalValue ? [['Rental Value', `${fmtCurrency(val.rentalValue, settings.defaultCurrency)}/month`]] as [string, string][] : []),
    ]));
  }
  children.push(sectionDivider());

  children.push(fieldTable([
    ['Valuation Method', enValuationMethod[val.valuationMethod] || val.valuationMethod],
    ['Risk Level', enRisk[val.riskLevel] || val.riskLevel],
    ['Confidence', `${val.confidencePercentage}%`],
  ]));
  children.push(sectionDivider());

  if (val.appraiserNotes) {
    children.push(ltrPara([textRun('Appraiser Notes:', { bold: true, size: 24 })], { spacing: { after: 60 } }));
    children.push(ltrPara([textRun(val.appraiserNotes)], { spacing: { after: 120 } }));
  }
  if (val.finalRecommendation) {
    children.push(ltrPara([textRun('Final Recommendation:', { bold: true, size: 24 })], { spacing: { after: 60 } }));
    children.push(ltrPara([textRun(val.finalRecommendation)], { spacing: { after: 200 } }));
  }

  children.push(ltrPara([textRun('')], { spacing: { before: 400 } }));
  children.push(ltrPara(
    [textRun('Valuator: ', { bold: true, size: 24 }), textRun(report.appraiserName, { size: 24 })],
    { spacing: { after: 300 } },
  ));
  children.push(ltrPara(
    [textRun('Signature: ___________________________', { size: 24 })],
    { spacing: { after: 100 } },
  ));
  children.push(ltrPara(
    [textRun(`Date: ${formatDate(report.createdAt)}`, { size: 24 })],
    { spacing: { after: 100 } },
  ));

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${report.reportNumber}.docx`);
}
