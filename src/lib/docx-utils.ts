'use client';

import JSZip from 'jszip';

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

// Map common placeholder patterns to friendly Arabic labels and types
const FIELD_MAP: Record<string, { label: string; type: TemplateField['type']; options?: string[] }> = {
  beneficiary_name: { label: 'اسم المستفيد', type: 'text' },
  اسم_المستفيد: { label: 'اسم المستفيد', type: 'text' },
  civil_id: { label: 'الرقم المدني', type: 'text' },
  الرقم_المدني: { label: 'الرقم المدني', type: 'text' },
  phone: { label: 'رقم الهاتف', type: 'text' },
  هاتف: { label: 'رقم الهاتف', type: 'text' },
  mobile: { label: 'رقم الجوال', type: 'text' },
  جوال: { label: 'رقم الجوال', type: 'text' },
  property_type: { label: 'نوع العقار', type: 'select', options: ['أرض', 'فيلا', 'شقة', 'مبنى سكني', 'مبنى تجاري', 'استخدام مختلط', 'مزرعة', 'مستودع', 'محل تجاري'] },
  نوع_العقار: { label: 'نوع العقار', type: 'select', options: ['أرض', 'فيلا', 'شقة', 'مبنى سكني', 'مبنى تجاري', 'استخدام مختلط', 'مزرعة', 'مستودع', 'محل تجاري'] },
  governorate: { label: 'المحافظة', type: 'text' },
  محافظة: { label: 'المحافظة', type: 'text' },
  wilayat: { label: 'الولاية', type: 'text' },
  ولاية: { label: 'الولاية', type: 'text' },
  area: { label: 'المساحة (م²)', type: 'text' },
  مساحة: { label: 'المساحة (م²)', type: 'text' },
  plot_number: { label: 'رقم القطعة', type: 'text' },
  رقم_القطعة: { label: 'رقم القطعة', type: 'text' },
  estimated_value: { label: 'القيمة التقديرية (ر.ع)', type: 'text' },
  قيمة_تقديرية: { label: 'القيمة التقديرية (ر.ع)', type: 'text' },
  notes: { label: 'ملاحظات', type: 'textarea' },
  ملاحظات: { label: 'ملاحظات', type: 'textarea' },
  bank_name: { label: 'اسم البنك', type: 'text' },
  اسم_البنك: { label: 'اسم البنك', type: 'text' },
  date: { label: 'التاريخ', type: 'date' },
  التاريخ: { label: 'التاريخ', type: 'date' },
  report_number: { label: 'رقم التقرير', type: 'text' },
  رقم_التقرير: { label: 'رقم التقرير', type: 'text' },
  location: { label: 'الموقع', type: 'text' },
  موقع: { label: 'الموقع', type: 'text' },
};

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, '_').replace(/-/g, '_');
}

export function getFieldInfo(key: string): TemplateField {
  const normalized = normalizeKey(key);
  const mapped = FIELD_MAP[normalized];
  if (mapped) {
    return { key, label: mapped.label, type: mapped.type, options: mapped.options, required: false };
  }
  // Fallback: create a readable label from the key
  const label = key
    .replace(/[_-]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();
  return { key, label: label || key, type: 'text', required: false };
}

export async function extractPlaceholders(base64Content: string): Promise<TemplateField[]> {
  try {
    const cleanBase64 = base64Content.includes(',') ? base64Content.split(',')[1] : base64Content;
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const zip = await JSZip.loadAsync(bytes);
    const docXml = await zip.file('word/document.xml')?.async('text');
    if (!docXml) return [];

    // Extract text from all w:t elements
    const textMatches = docXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const fullText = textMatches.map(m => {
      const inner = m.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
      return inner ? inner[1] : '';
    }).join('');

    // Find {{placeholder}} patterns
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = placeholderRegex.exec(fullText)) !== null) {
      matches.add(match[1].trim());
    }

    // Also try finding placeholders that might be split across XML nodes
    // by searching the raw XML for patterns with XML tags between braces
    const rawMatches = docXml.match(/\{\{[^}]+\}\}/g) || [];
    for (const m of rawMatches) {
      const key = m.replace(/\{\{|\}\}/g, '').trim();
      if (key) matches.add(key);
    }

    return Array.from(matches).map(key => getFieldInfo(key));
  } catch (err) {
    console.error('[docx-utils] Failed to extract placeholders:', err);
    return [];
  }
}

export async function generateFilledDocx(
  base64Content: string,
  values: Record<string, string>
): Promise<Blob> {
  const cleanBase64 = base64Content.includes(',') ? base64Content.split(',')[1] : base64Content;
  const binary = atob(cleanBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const zip = await JSZip.loadAsync(bytes);
  let docXml = await zip.file('word/document.xml')?.async('text') || '';

  // Replace placeholders in the XML
  // Handle both simple {{key}} and cases where XML tags might be inside
  for (const [key, value] of Object.entries(values)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match {{key}} possibly with XML tags in between characters
    const regex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');
    docXml = docXml.replace(regex, escapeXml(value));
  }

  zip.file('word/document.xml', docXml);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  return blob;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ────────────────────────────────────────────────
   Built-in Preliminary Valuation Report Generator
   ──────────────────────────────────────────────── */

const PT_TITLE: Record<string, string> = {
  land: 'INITIAL LAND VALUATION',
  villa: 'INITIAL VILLA VALUATION',
  apartment: 'INITIAL APARTMENT VALUATION',
  residential_building: 'INITIAL RESIDENTIAL BUILDING VALUATION',
  commercial_building: 'INITIAL COMMERCIAL BUILDING VALUATION',
  mixed_use: 'INITIAL MIXED USE PROPERTY VALUATION',
  farm: 'INITIAL FARM VALUATION',
  warehouse: 'INITIAL WAREHOUSE VALUATION',
  shop: 'INITIAL SHOP VALUATION',
};

interface PreliminaryDocxData {
  propertyType: string;
  date: string;
  surveyNumber: string;
  applicant: string;
  plotNumber: string;
  blockNumber: string;
  location: string;
  wilayat: string;
  estimatedValue: string;
  area: string;
  bankNameEn: string;
  officeNameEn: string;
  reportNumber: string;
}

function tcCell(text: string, opts?: { bold?: boolean; width?: number; gridSpan?: number; shading?: string }): string {
  const pr: string[] = [];
  if (opts?.width) pr.push(`<w:tcW w:w="${opts.width}" w:type="dxa"/>`);
  if (opts?.gridSpan) pr.push(`<w:gridSpan w:val="${opts.gridSpan}"/>`);
  if (opts?.shading) pr.push(`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shading}"/>`);
  const tcPr = pr.length ? `<w:tcPr>${pr.join('')}</w:tcPr>` : '';
  const rpr = `<w:rPr>${opts?.bold ? '<w:b/>' : ''}<w:sz w:val="20"/><w:szCs w:val="20"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/></w:rPr>`;
  return `<w:tc>${tcPr}<w:p><w:pPr><w:spacing w:before="40" w:after="40" w:line="240" w:lineRule="auto"/></w:pPr><w:r>${rpr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`;
}

function para(text: string, opts?: { bold?: boolean; size?: number; color?: string; align?: string; before?: number; after?: number; border?: string }): string {
  const rpr = `<w:rPr>${opts?.bold ? '<w:b/>' : ''}<w:sz w:val="${opts?.size || 22}"/><w:szCs w:val="${opts?.size || 22}"/>${opts?.color ? `<w:color w:val="${opts.color}"/>` : ''}<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/></w:rPr>`;
  const ppr = `<w:pPr>${opts?.align ? `<w:jc w:val="${opts.align}"/>` : ''}<w:spacing w:before="${opts?.before || 0}" w:after="${opts?.after || 0}" w:line="276" w:lineRule="auto"/>${opts?.border ? `<w:pBdr><w:bottom w:val="${opts.border}" w:sz="6" w:space="1" w:color="1F3864"/></w:pBdr>` : ''}</w:pPr>`;
  return `<w:p>${ppr}<w:r>${rpr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function richPara(runs: { text: string; bold?: boolean; size?: number; color?: string }[], opts?: { before?: number; after?: number }): string {
  const ppr = `<w:pPr><w:spacing w:before="${opts?.before || 0}" w:after="${opts?.after || 0}" w:line="276" w:lineRule="auto"/></w:pPr>`;
  const runsXml = runs.map(r => {
    const rpr = `<w:rPr>${r.bold ? '<w:b/>' : ''}<w:sz w:val="${r.size || 22}"/><w:szCs w:val="${r.size || 22}"/>${r.color ? `<w:color w:val="${r.color}"/>` : ''}<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/></w:rPr>`;
    return `<w:r>${rpr}<w:t xml:space="preserve">${esc(r.text)}</w:t></w:r>`;
  }).join('');
  return `<w:p>${ppr}${runsXml}</w:p>`;
}

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHeaderTable(d: PreliminaryDocxData): string {
  const rows = [
    `<w:tr>${tcCell('DATE', { bold: true, width: 2200, shading: 'E8EDF3' })}${tcCell(d.date, { width: 7400, gridSpan: 3 })}</w:tr>`,
    `<w:tr>${tcCell('SURVEY PLAN NO.', { bold: true, width: 2200, shading: 'E8EDF3' })}${tcCell(d.surveyNumber || '—', { width: 7400, gridSpan: 3 })}</w:tr>`,
    `<w:tr>${tcCell('APPLICANT', { bold: true, width: 2200, shading: 'E8EDF3' })}${tcCell(d.applicant, { width: 7400, gridSpan: 3 })}</w:tr>`,
    `<w:tr>${tcCell('PLOT NO.', { bold: true, width: 2200, shading: 'E8EDF3' })}${tcCell(d.plotNumber, { width: 2600 })}${tcCell('BLOCK NO.', { bold: true, width: 2200, shading: 'E8EDF3' })}${tcCell(d.blockNumber || '—', { width: 2600 })}</w:tr>`,
    `<w:tr>${tcCell('LOCATION', { bold: true, width: 2200, shading: 'E8EDF3' })}${tcCell(d.location, { width: 2600 })}${tcCell('WILLIYAT', { bold: true, width: 2200, shading: 'E8EDF3' })}${tcCell(d.wilayat, { width: 2600 })}</w:tr>`,
    `<w:tr>${tcCell('AREA', { bold: true, width: 2200, shading: 'E8EDF3' })}${tcCell(d.area ? d.area + ' m²' : '—', { width: 2600 })}${tcCell('EST. VALUE', { bold: true, width: 2200, shading: 'E8EDF3' })}${tcCell(d.estimatedValue ? 'OMR ' + d.estimatedValue : '—', { width: 2600 })}</w:tr>`,
  ];
  return `<w:tbl><w:tblPr><w:tblW w:w="9600" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="1F3864"/><w:left w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="1F3864"/><w:right w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="2200"/><w:gridCol w:w="2600"/><w:gridCol w:w="2200"/><w:gridCol w:w="2600"/></w:tblGrid>${rows.join('')}</w:tbl>`;
}

export async function generatePreliminaryDocx(d: PreliminaryDocxData): Promise<Blob> {
  const title = PT_TITLE[d.propertyType] || 'INITIAL PROPERTY VALUATION';

  const disclaimerItems = [
    { t: 'Nature of the Report', v: 'This valuation is a preliminary estimate and not a final or official report. The value may change upon a thorough technical examination or detailed on-site inspection.' },
    { t: 'Purpose of Use', v: 'This document is for informational purposes only and may not be used before official bodies, courts, banks, or for the purpose of mortgaging or official sale until a certified and stamped valuation report is issued.' },
    { t: 'Legal Liability', v: 'The company disclaims all liability for any financial, investment, or legal decisions made based on this preliminary valuation. The company is not responsible to any third party who may access this document.' },
    { t: 'Validity of the Estimate', v: 'This value is based solely on market conditions at the time of issuance and will become invalid after 15 days due to market fluctuations.' },
    { t: 'Information accuracy', v: 'This valuation depends on the information and documents provided by the client, and if any of them are found to be inaccurate, this valuation is considered invalid.' },
  ];

  const disclaimerXml = disclaimerItems.map(item =>
    richPara([
      { text: item.t + ': ', bold: true, size: 20 },
      { text: item.v, size: 20 },
    ], { before: 100, after: 60 })
  ).join('');

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="">
<w:body>
${para(title, { bold: true, size: 36, color: '1F3864', align: 'center', after: 0 })}
${para('', { after: 0, border: 'double' })}
${para('', { before: 120, after: 0 })}
${buildHeaderTable(d)}
${para('A.  VALUATION', { bold: true, size: 26, color: '1F3864', before: 300, after: 120 })}
${richPara([
  { text: 'The estimated market value of the above-referenced property is ', size: 22 },
  { text: d.estimatedValue ? 'OMR ' + d.estimatedValue : 'N/A', bold: true, size: 22 },
  { text: ' as of ' + d.date + '.', size: 22 },
], { before: 60, after: 200 })}
${para('Disclaimer and Legal Restrictions (Very Important)', { bold: true, size: 24, color: 'C00000', before: 200, after: 80 })}
${para('Please note that this valuation is subject to the following terms and conditions to avoid any legal misunderstanding:', { size: 20, before: 40, after: 100 })}
${disclaimerXml}
${para('', { before: 400, after: 0, border: 'single' })}
${para((d.officeNameEn || '') + '  —  ' + (d.reportNumber || ''), { size: 16, color: '999999', align: 'center', before: 60 })}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>
</w:body>
</w:document>`;

  const CT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const DRELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

  const zip = new JSZip();
  zip.file('[Content_Types].xml', CT);
  zip.file('_rels/.rels', RELS);
  zip.file('word/document.xml', docXml);
  zip.file('word/_rels/document.xml.rels', DRELS);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
