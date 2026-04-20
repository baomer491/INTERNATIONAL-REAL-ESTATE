'use client';

import React from 'react';
import { useApp } from '@/components/layout/AppContext';
import { store } from '@/lib/store';

interface ReportPreviewProps {
  data: Record<string, any>;
  isLand: boolean;
  isApartment: boolean;
  ownershipPreview: string;
  mapPreview: string;
  idPreview: string;
  photoPreview: string;
  photoPreviews?: string[];
}

const enZoned: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', industrial: 'Industrial', agricultural: 'Agricultural', mixed: 'Mixed Use' };
const enFloors: Record<string, string> = { one: 'One Floor', two: 'Two Floors', three: 'Three Floors', four_plus: 'Four Floors or More', na: 'N/A' };
const enKrookiMatch: Record<string, string> = { yes: 'Yes', no: 'No', partial: 'Partial' };
const enTopography: Record<string, string> = { leveled: 'Leveled', sloped: 'Sloped', elevated: 'Elevated', low_lying: 'Low Lying', mixed: 'Mixed' };
const enQuality: Record<string, string> = { excellent: 'Excellent', good: 'Good', average: 'Average', poor: 'Poor' };
const enReturn: Record<string, string> = { excellent: 'Excellent', good: 'Good', average: 'Average', poor: 'Poor' };
const enPurpose: Record<string, string> = { loan: 'Loan', mortgage: 'Mortgage', sale: 'Sale', purchase: 'Purchase', investment: 'Investment', rental: 'Rental', other: 'Other' };
const enBuildingMatch: Record<string, string> = { yes: 'Yes', no: 'No', partial: 'Partial', na: 'N/A' };
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
const enValuationMethod: Record<string, string> = {
  'طريقة السوق': 'Market Approach',
  'طريقة التكلفة': 'Cost Approach',
  'طريقة الدخل': 'Income Approach',
  'طريقة السوق والتكلفة': 'Market & Cost Approach',
  'طريقة الدخل والتكلفة': 'Income & Cost Approach',
  'طريقة المقارنة': 'Comparison Approach',
};
const enPropertyType: Record<string, string> = {
  land: 'Land', villa: 'Villa', apartment: 'Apartment', residential_building: 'Residential Building',
  commercial_building: 'Commercial Building', mixed_use: 'Mixed Use', farm: 'Farm', warehouse: 'Warehouse', shop: 'Shop',
};
const enUsage: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', industrial: 'Industrial', agricultural: 'Agricultural', investment: 'Investment' };
const enCondition: Record<string, string> = { excellent: 'Excellent', good: 'Good', average: 'Fair', below_average: 'Below Average', poor: 'Poor' };
const enFinishing: Record<string, string> = { luxury: 'Luxury', fully_finished: 'Fully Finished', semi_finished: 'Semi Finished', not_finished: 'Not Finished' };
const enRisk: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const enRelation: Record<string, string> = { owner: 'Owner', tenant: 'Tenant', agent: 'Agent', representative: 'Representative', buyer: 'Buyer', seller: 'Seller', other: 'Other' };

const assumptions = [
  'It is assumed that unless specifically stated, the property is owned freehold and is not subject to any right, obligations, restrictions, or covenants.',
  'We are not aware of any outgoing, easements or rights affecting the property and our valuation assumes that none exist.',
  'It is assumed that the property is utilized by the relevant legal, and statutory permits and it is not subject to any adverse legal notices or proposals and no investigations on this issue have been made.',
  'We have not been instructed to carry out a structural survey nor tested any of the mechanical, electrical or other services.',
  'The valuation has been prepared on the assumption that the property is free from any defects. Therefore, this report must not be considered as providing any express or implied warranty as to the condition of the property.',
  'We have not been made aware of any hazardous or deleterious substances on or about the property and we have made no investigation to determine whether such problems exist. For this report, it is assumed that the property is free from contamination.',
  'For the purpose of the valuation, we assume that the property is unaffected by any statutory notice and we are evaluation the full and unencumbered ownership title.',
  'We have assumed that the financial and other data supplied by the owner / owner\'s representative is correct and we have no reason to believe otherwise.',
  'Furthermore, we have excluded any cash balances, service charges, loans, interest, depreciation, wet and dry stock and payments due to the owners.',
];

const basis = [
  'A willing seller.',
  'Buyer and seller each acting prudently, knowledgeably and assuming the price is not affected on due stimulus.',
  'A reasonable time is allowed for exposure in the open market.',
  'The property shall be freely exposed to the market.',
  'Prior to the date of valuation, there had been a reasonable period (having regards to the nature of the property and the state of the market) for the proper marketing of the interest, for the agreement of the price and terms for the completion of the sale.',
  'No account is taken of any additional bid by a prospective buyer with special interest.',
];

const blt: React.CSSProperties = { fontSize: 12.5, lineHeight: 1.8, margin: '0 0 3px', paddingLeft: 16 };
const td: React.CSSProperties = { padding: '5px 8px', borderBottom: '1px solid #ccc', fontSize: 12.5, verticalAlign: 'top' };
const tdL: React.CSSProperties = { ...td, fontWeight: 700, background: '#f9f9f9', width: '22%' };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const sec: React.CSSProperties = { fontSize: 13, fontWeight: 800, margin: '20px 0 8px', padding: '0 0 5px', borderBottom: '2px solid #111', textTransform: 'uppercase', letterSpacing: 1.5 };
const imgS: React.CSSProperties = { width: '100%', maxWidth: 300, borderRadius: 2, border: '1px solid #ccc' };
const emptyS: React.CSSProperties = { width: '100%', height: 120, background: '#f5f5f5', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 11 };

function fmtCurrency(v: string | undefined): string {
  if (!v) return '—';
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  return `${n.toLocaleString('en-US')} OMR`;
}

function fmtArea(v: string | undefined): string {
  if (!v) return '—';
  return `${v} m²`;
}

export default function ReportPreview({ data, isLand, isApartment, ownershipPreview, mapPreview, idPreview, photoPreview, photoPreviews }: ReportPreviewProps) {
  const { currentUser } = useApp();
  const settings = store.getSettings();
  const today = new Date().toLocaleDateString('en-GB');
  const isBank = data.valuationType === 'bank';
  const bankEnName = isBank && data.bankId ? (store.getActiveBanks().find(b => b.id === data.bankId)?.nameEn || data.bankName) : data.bankName;
  const roleLabel = currentUser?.role === 'admin' ? 'Head of Valuation' : currentUser?.role === 'reviewer' ? 'Reviewer' : 'Valuator';

  const pStyle: React.CSSProperties = { background: 'white', color: '#111', padding: '32px 40px', fontFamily: '"Times New Roman", Times, serif', fontSize: 13, lineHeight: 1.7, direction: 'ltr', textAlign: 'left' };

  const reportType = isApartment ? 'APARTMENT' : 'LAND';
  const totalFF = (data.aptComponents || []).reduce((s: number, c: any) => s + (c.ff || 0), 0);
  const totalPH = (data.aptComponents || []).reduce((s: number, c: any) => s + (c.ph || 0), 0);

  const purposeLabel = enPurpose[data.purposeOfValuation] || data.purposeOfValuation || 'Loan';
  const purposeText = `We understand that the Valuation is sought for the ${purposeLabel.toLowerCase()} purpose only.`;

  const valuationLabel = enValuationMethod[data.valuationMethod] || data.valuationMethod || 'Market Approach';

  return (
    <div style={pStyle}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <table style={{ width: 'auto', margin: '0 auto', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={{ ...td, fontWeight: 700, fontSize: 12 }}>{data.reportNumber}</td><td style={{ ...td, fontWeight: 700, fontSize: 12 }}>Case Number</td></tr>
            <tr><td style={{ ...td, fontWeight: 700, fontSize: 14, padding: '4px 8px' }}>{settings.officeNameEn}</td><td style={td}></td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', margin: '16px 0', padding: '12px 0', borderTop: '3px double #111', borderBottom: '3px double #111' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: 2 }}>EVALUATION {reportType} REPORT</h2>
      </div>

      {/* COVER LETTER */}
      <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.8 }}>
        SUB: {reportType} VALUATION FOR {isBank ? bankEnName : data.beneficiaryName}, ON BEHALF OF {data.beneficiaryName}, PLOT NO. {data.plotNumber}{data.blockNumber ? `, Block ${data.blockNumber}` : ''}, LOCATED AT {data.village ? `${data.village}, ` : ''}{enWilayat[data.wilayat] || data.wilayat}.
      </p>
      <p style={{ margin: '0 0 2px' }}><strong>OWNER:</strong> {data.beneficiaryName}</p>
      <p style={{ margin: '0 0 4px' }}><strong>CIVIL ID:</strong> {data.civilId || '—'}</p>
      <p style={{ margin: '0 0 4px' }}><strong>PHONE:</strong> {data.phone || '—'}</p>
      <p style={{ margin: '0 0 4px' }}><strong>RELATION:</strong> {enRelation[data.relation] || data.relation || '—'}</p>
      <p style={{ margin: '0 0 16px' }}><strong>APPLICANT:</strong> {data.applicantName || data.beneficiaryName}</p>

      <p style={{ margin: '0 0 6px' }}>Dear Sir,</p>
      <p style={{ margin: '0 0 6px' }}>Further to our discussion with {isBank ? bankEnName : (currentUser?.fullName || 'our valuator')}, our valuator Inspected the site on {today} and we are enclosing the Valuation Report of the above mentioned client.</p>
      <p style={{ margin: '0 0 6px' }}>We hope all the information is herewith explanatory. However, if any further clarification is required, please feel free to contact us to clarify better.</p>
      <p style={{ margin: '0 0 16px' }}>Assuring you of our best services at all times.</p>
      <p style={{ fontWeight: 800, margin: '0 0 20px' }}>AUTHORIZED SIGNATORY</p>

      {/* VALUATION SUMMARY */}
      <h3 style={{ ...sec, borderBottom: 'none', textAlign: 'center', fontSize: 16 }}>VALUATION</h3>
      <table style={tbl}>
        <tbody>
          <tr><td style={tdL}>Market Value</td><td style={td}>{isApartment ? 'Apartment' : 'Land'}</td><td style={{ ...td, fontWeight: 700 }}>{fmtCurrency(data.totalMarketValue)}</td></tr>
          <tr><td style={tdL}>Force Sale Value</td><td style={td}>{isApartment ? 'Apartment' : 'Land'}</td><td style={{ ...td, fontWeight: 700 }}>{fmtCurrency(data.quickSaleValue)}</td></tr>
          <tr><td style={tdL}>Valuation Fees</td><td style={td} colSpan={2}><strong>{fmtCurrency(data.valuationFees)}</strong></td></tr>
          <tr><td style={tdL}>Valuation Method</td><td style={td} colSpan={2}>{valuationLabel}</td></tr>
          <tr><td style={tdL}>Risk Level</td><td style={td} colSpan={2}>{enRisk[data.riskLevel] || data.riskLevel || '—'}</td></tr>
          <tr><td style={tdL}>Confidence</td><td style={td} colSpan={2}>{data.confidencePercentage || '—'}%</td></tr>
        </tbody>
      </table>

      {/* DOCUMENTATION DETAILS */}
      <h4 style={sec}>DOCUMENTATION DETAILS OF PLOT</h4>
      <table style={tbl}>
        <tbody>
          <tr><td style={tdL}>Plot No</td><td style={td}>{data.plotNumber}</td><td style={tdL}>Block No</td><td style={td}>{data.blockNumber || '—'}</td></tr>
          <tr><td style={tdL}></td><td style={td}></td><td style={tdL}>Way No</td><td style={td}>{data.wayNumber || '—'}</td></tr>
          <tr><td style={tdL}>Krookie Number</td><td style={td}>{data.krookiNumber || '—'}</td><td style={tdL}>Zoned</td><td style={td}>{enZoned[data.zoned] || data.zoned || '—'}</td></tr>
          <tr><td style={tdL}>Registration Number</td><td style={td}>{data.registrationNumber || '—'}</td><td style={tdL}>Registration Date</td><td style={td}>{data.registrationDate || '—'}</td></tr>
          <tr><td style={tdL}>Plot Area (SQM)</td><td style={{ ...td, fontWeight: 700 }} colSpan={3}>{fmtArea(data.area)}</td></tr>
          <tr><td style={tdL}>Allowable Build Up</td><td style={td} colSpan={3}>{data.allowableBuildUp || '—'}</td></tr>
          <tr><td style={tdL}>Allowable Number of Floors</td><td style={td} colSpan={3}>{enFloors[data.allowableFloors] || data.allowableFloors || 'N/A'}</td></tr>
          <tr><td style={tdL}>Possible Future Extension</td><td style={td} colSpan={3}>{data.possibleFutureExtension || '—'}</td></tr>
        </tbody>
      </table>

      {isApartment && (
        <table style={tbl}>
          <tbody>
            <tr><td style={tdL}>Bldg. Permit Number</td><td style={td}>{data.aptBldgPermitNumber || '—'}</td><td style={tdL}>Bldg. Permit Date</td><td style={td}>{data.aptBldgPermitDate || '—'}</td></tr>
            <tr><td style={tdL}>Shared Area (SQM)</td><td style={{ ...td, fontWeight: 700 }}>{fmtArea(data.area)}</td><td style={tdL}></td><td style={td}></td></tr>
            <tr><td style={tdL}>Unit Area Sq. m</td><td style={{ ...td, fontWeight: 700 }}>{fmtArea(data.aptUnitArea)}</td><td style={tdL}>Actual Build Up</td><td style={{ ...td, fontWeight: 700 }}>{fmtArea(data.aptActualBuiltUp)}</td></tr>
            <tr><td style={tdL}>Parking</td><td style={td}>{data.aptParking || '—'}</td><td style={tdL}>Number Of Floors</td><td style={td}>{data.aptNumberOfFloors || '—'}</td></tr>
            <tr><td style={tdL}>Apartment of Floors</td><td style={td}>{data.aptApartmentOfFloors || '—'}</td><td style={tdL}>Actual Number of Floors</td><td style={td}>{data.aptActualNumberOfFloors || '—'}</td></tr>
            <tr><td style={tdL}>Approved Drawing Date</td><td style={td}>{data.aptApprovedDrawingDate || '—'}</td><td style={tdL}></td><td style={td}></td></tr>
          </tbody>
        </table>
      )}

      <p style={{ fontWeight: 800, margin: '16px 0 20px' }}>AUTHORIZED SIGNATORY</p>

      {/* DESCRIPTION AND DETAILS */}
      <h4 style={sec}>DESCRIPTION AND DETAILS OF PLOT</h4>
      <table style={tbl}>
        <tbody>
          <tr><td style={tdL}>Krooki Match {isApartment ? 'Apartment' : 'Plot'}</td><td style={td}>{enKrookiMatch[data.krookiMatch] || data.krookiMatch || '—'}</td></tr>
          <tr><td style={tdL}>Topography</td><td style={td}>{enTopography[data.topography] || data.topography || '—'}</td></tr>
          <tr><td style={tdL}>Location / Access</td><td style={td}>{data.locationAccess || '—'}</td></tr>
          <tr><td style={tdL}>Surrounding Plots</td><td style={tdL}>North</td><td style={td}>{data.surroundingNorth || '—'}</td></tr>
          <tr><td style={td}></td><td style={tdL}>East</td><td style={td}>{data.surroundingEast || '—'}</td></tr>
          <tr><td style={td}></td><td style={tdL}>South</td><td style={td}>{data.surroundingSouth || '—'}</td></tr>
          <tr><td style={td}></td><td style={tdL}>West</td><td style={td}>{data.surroundingWest || '—'}</td></tr>
          <tr><td style={tdL}>Quality of Surrounding Properties</td><td style={td}>{enQuality[data.qualityOfSurrounding] || data.qualityOfSurrounding || '—'}</td></tr>
          <tr><td style={tdL}>Return on Sale / Rent</td><td style={td}>{enReturn[data.returnOnSaleRent] || data.returnOnSaleRent || '—'}</td></tr>
        </tbody>
      </table>

      {/* APARTMENT SECTIONS */}
      {isApartment && (
        <>
          <h4 style={sec}>APARTMENT DETAILS</h4>
          <table style={tbl}>
            <tbody>
              <tr><td style={tdL}>Apartment No</td><td style={td}>{data.aptApartmentNo || '—'}</td><td style={tdL}>House No</td><td style={td}>{data.aptHouseNo || '—'}</td></tr>
              <tr><td style={tdL}>Region</td><td style={td}>{enGov[data.governorate] || data.governorate || '—'}</td><td style={tdL}>Wilayat</td><td style={td}>{enWilayat[data.wilayat] || data.wilayat || '—'}</td></tr>
              <tr><td style={tdL}>Age / Year of Construction</td><td style={td}>{data.aptCompletionDate || '—'}</td><td style={tdL}></td><td style={td}></td></tr>
              <tr><td style={tdL}>Building Match Approved Drawing</td><td style={td}>{enBuildingMatch[data.aptBuildingMatch] || data.aptBuildingMatch || '—'}</td><td style={tdL}></td><td style={td}></td></tr>
              <tr><td style={tdL}>Consultant Name</td><td style={td}>{data.aptConsultantName || '—'}</td><td style={tdL}></td><td style={td}></td></tr>
            </tbody>
          </table>

          <h4 style={sec}>APARTMENT COMPONENTS</h4>
          <table style={tbl}>
            <thead>
              <tr style={{ borderBottom: '2px solid #111' }}>
                <th style={{ ...td, fontWeight: 800, textAlign: 'left', width: '40%' }}>Components of Apartment</th>
                <th style={{ ...td, fontWeight: 800, textAlign: 'center', width: '20%' }}>F. F.</th>
                <th style={{ ...td, fontWeight: 800, textAlign: 'center', width: '20%' }}>P. H.</th>
                <th style={{ ...td, fontWeight: 800, textAlign: 'center', width: '20%' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {(data.aptComponents || []).map((comp: any, i: number) => (
                <tr key={i}>
                  <td style={td}>{comp.name}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{comp.ff || ''}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{comp.ph || ''}</td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{(comp.ff || 0) + (comp.ph || 0) || ''}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 800, background: '#f0f0f0' }}>
                <td style={{ ...td, fontWeight: 800 }}>Total</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 800 }}>{totalFF || ''}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 800 }}>{totalPH || ''}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 800 }}>{totalFF + totalPH || ''}</td>
              </tr>
            </tbody>
          </table>

          <h4 style={sec}>APARTMENT SPECIFICATIONS</h4>
          <table style={tbl}>
            <tbody>
              {[
                { label: 'Foundation & Structure', val: data.aptFoundation },
                { label: 'Walls', val: data.aptWalls },
                { label: 'Roof', val: data.aptRoof },
                { label: 'Floors', val: data.aptFloorType },
                { label: 'Air Conditioning', val: data.aptAirConditioning },
              ].map((r) => (
                <tr key={r.label}><td style={tdL}>{r.label}</td><td style={td}>{r.val || '—'}</td></tr>
              ))}
            </tbody>
          </table>

          <h4 style={sec}>INTERNAL FINISHING</h4>
          <table style={tbl}>
            <thead>
              <tr style={{ borderBottom: '2px solid #111' }}>
                <th style={{ ...td, fontWeight: 800, textAlign: 'left' }}>No</th>
                <th style={{ ...td, fontWeight: 800, textAlign: 'left' }}>Item Description</th>
                <th style={{ ...td, fontWeight: 800, textAlign: 'left' }}>Type of Item / Qnty</th>
                <th style={{ ...td, fontWeight: 800, textAlign: 'left' }}>Condition</th>
              </tr>
            </thead>
            <tbody>
              {(data.aptInternalFinishing || []).map((item: any, i: number) => (
                <tr key={i}>
                  <td style={{ ...td, textAlign: 'center' }}>{i + 1}</td>
                  <td style={td}>{item.description}</td>
                  <td style={td}>{item.typeOfItem || '—'}</td>
                  <td style={td}>{item.condition || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={sec}>RENTAL PROSPECTS</h4>
          <p style={{ fontSize: 13, margin: '0 0 4px' }}>Estimated Per Month = <strong>{fmtCurrency(data.aptEstimatedPerMonth)}</strong></p>
        </>
      )}

      {/* STANDARD SECTIONS */}
      <h4 style={sec}>ADDITIONAL REMARKS</h4>
      <p style={blt}>&#x25B6; The Valuation Report Has Prepared Based on the Krookie.</p>
      <p style={blt}>&#x25B6; Based on this Mulkiya and Krookie; the Owner is holding only one Unit.</p>

      <h4 style={sec}>PURPOSE OF VALUATION</h4>
      <p style={blt}>&#x25B6; {purposeText}</p>

      <h4 style={sec}>ASSUMPTIONS &amp; PROVISIONS</h4>
      {assumptions.map((a, i) => <p key={i} style={blt}>- {a}</p>)}

      <h4 style={sec}>BASIS OF VALUATION</h4>
      <p style={blt}>- This valuation is conducted on an open market basis. The value quoted in our opinion is the most probable price that the property would bring in a competitive and open market under all conditions requisite to a fair sale assuming:</p>
      {basis.map((b, i) => <p key={i} style={blt}>- ({i + 1}) {b}</p>)}

      <h4 style={sec}>CONFIRMATION</h4>
      <p style={blt}>- We hereby confirm that the firm&apos;s authorized officials had visited the property site and factored in all respects of evaluation before finalizing the current Market value and Forced-sale Value of the property indicated in the reports. A further confirmed to the effect that the firm had handled a purchase / sale transaction in the immediate vicinity of the property under valuation in recent times, based on which the market value is assessed.</p>

      <h4 style={sec}>TRANSFER FEES</h4>
      <p style={blt}>- As of the date of valuation, there is a transfer fee of 3% on the sale of the properties in the Sultanate of Oman. And in our valuation, we assume that this will not affect the market value and the value obtained at the level of agreement on the deal before registration with the Ministry of Housing and Electricity &amp; Water.</p>

      <h4 style={sec}>SOURCES &amp; NON-DISCLOSURE</h4>
      <p style={blt}>- We cannot take any responsibility for any errors, omissions or inaccuracies that may subsequently become apparent as result of incomplete or inaccurate information provided. Therefore, certain information outlined in this report may be subject to further verification and the information contained in this report is provided in good faith.</p>

      <h4 style={sec}>SAVING CLAUSES (Restrictions)</h4>
      <p style={blt}>- This report is confidential to you for the specific purpose to which it refers. Our valuation is prepared solely for yourself and no responsibility can be accepted to any other party in respect of the valuation, either as a whole or in any part. It may be disclosed to other professional advisors assisting you in respect of this purpose, but you shall not disclose this report to any other person.</p>
      <p style={blt}>- This valuation report or any part of it or any reference thereto may not be published in any way without our written permission and approval of the form and context in which it may appear.</p>

      <h4 style={sec}>CONCLUSION</h4>
      <p style={blt}>&#x25B6; We trust that this Report and Valuation satisfies the requirement of your instruction.</p>

      {/* ENCLOSURES */}
      <h4 style={sec}>ENCLOSURES</h4>
      <p style={{ ...blt, paddingLeft: 8 }}>1. Copy of Mulkiya</p>
      <p style={{ ...blt, paddingLeft: 8 }}>2. Copy of Krookie</p>
      {isApartment && <p style={{ ...blt, paddingLeft: 8 }}>3. Copy of Building Completion Certificate</p>}
      <p style={{ ...blt, paddingLeft: 8 }}>{isApartment ? '4' : '3'}. Copy of Approved Drawings</p>
      <p style={{ ...blt, paddingLeft: 8 }}>{isApartment ? '5' : '4'}. Copy of ID</p>
      <p style={{ ...blt, paddingLeft: 8 }}>{isApartment ? '6' : '5'}. Photographs of the Property</p>

      {/* AUTHORIZED SIGNATORY */}
      <h4 style={sec}>AUTHORIZED SIGNATORY</h4>
      <table style={tbl}>
        <tbody>
          <tr><td style={tdL}>Market Value</td><td style={td}>{isApartment ? 'Apartment' : 'Land'}</td><td style={{ ...td, fontWeight: 700 }}>{fmtCurrency(data.totalMarketValue)}</td></tr>
          <tr><td style={tdL}>Force Sale Value</td><td style={td}>{isApartment ? 'Apartment' : 'Land'}</td><td style={{ ...td, fontWeight: 700 }}>{fmtCurrency(data.quickSaleValue)}</td></tr>
          <tr><td style={tdL}>Valuation Fees</td><td style={td} colSpan={2}><strong>{fmtCurrency(data.valuationFees)}</strong></td></tr>
        </tbody>
      </table>
      <table style={{ ...tbl, marginTop: 12 }}>
        <tbody>
          <tr><td style={tdL}>Name</td><td style={td}>{currentUser?.fullName || settings.userName}</td></tr>
          <tr><td style={tdL}>Position</td><td style={td}>{roleLabel}</td></tr>
          <tr><td style={tdL}>Signature &amp; Stamp</td><td style={{ ...td, height: 40 }}></td></tr>
          <tr><td style={tdL}>Date</td><td style={td}>{today}</td></tr>
        </tbody>
      </table>

      {/* DOCUMENT PHOTOGRAPHS */}
      <h4 style={sec}>{isApartment ? 'EXTERNAL VIEWS OF THE PROPERTY' : 'PHOTOGRAPH OF THE PROPERTY'}</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ ...td, width: '50%', verticalAlign: 'top', padding: 8 }}>
              <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: 12 }}>Mulkiya</p>
              {ownershipPreview ? <img src={ownershipPreview} alt="Mulkiya" style={imgS} /> : <div style={emptyS}>No file uploaded</div>}
            </td>
            <td style={{ ...td, width: '50%', verticalAlign: 'top', padding: 8 }}>
              <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: 12 }}>Krooki</p>
              {mapPreview ? <img src={mapPreview} alt="Krookie" style={imgS} /> : <div style={emptyS}>No file uploaded</div>}
            </td>
          </tr>
          <tr>
            <td style={{ ...td, verticalAlign: 'top', padding: 8 }}>
              <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: 12 }}>{isApartment ? 'Completion Certificate' : "Owner / Client ID's"}</p>
              {(isApartment ? photoPreview : idPreview) ? <img src={isApartment ? photoPreview : idPreview} alt="ID" style={imgS} /> : <div style={emptyS}>No file uploaded</div>}
            </td>
            <td style={{ ...td, verticalAlign: 'top', padding: 8 }}>
              <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: 12 }}>{isApartment ? "Owner / Client ID's" : 'Location Satellite Photography'}</p>
              {(() => {
                const src = isApartment ? idPreview : (photoPreviews?.[0] || photoPreview);
                return src ? <img src={src} alt="Property" style={imgS} /> : <div style={emptyS}>No file uploaded</div>;
              })()}
            </td>
          </tr>
          {isApartment && (
            <tr>
              <td style={{ ...td, verticalAlign: 'top', padding: 8 }} colSpan={2}>
                <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: 12 }}>Location Satellite Photography</p>
                {(photoPreviews?.[0] || photoPreview) ? <img src={photoPreviews?.[0] || photoPreview} alt="Satellite" style={{ ...imgS, maxWidth: 400 }} /> : <div style={emptyS}>No file uploaded</div>}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* PHOTOGRAPHS OF THE PROPERTY */}
      <h4 style={sec}>PHOTOGRAPHS OF THE PROPERTY</h4>
      {(photoPreviews && photoPreviews.length > 0) ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {Array.from({ length: Math.ceil(photoPreviews.length / 2) }, (_, rowIdx) => (
              <tr key={rowIdx}>
                {[0, 1].map(colIdx => {
                  const photoIdx = rowIdx * 2 + colIdx;
                  const src = photoPreviews[photoIdx];
                  return (
                    <td key={colIdx} style={{ ...td, width: '50%', verticalAlign: 'top', padding: 8 }}>
                      {src ? (
                        <>
                          <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: 12 }}>Photo {photoIdx + 1}</p>
                          <img src={src} alt={`Photo ${photoIdx + 1}`} style={imgS} />
                        </>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={emptyS}>No photographs uploaded</div>
      )}
    </div>
  );
}
