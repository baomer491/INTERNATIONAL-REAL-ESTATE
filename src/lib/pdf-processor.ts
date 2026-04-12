import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export interface PDFPage {
    pageNumber: number;
    width: number;
    height: number;
    imageData: string; // Base64 image
    textContent: string;
}

export interface PDFDocument {
    totalPages: number;
    pages: PDFPage[];
    metadata?: {
        title?: string;
        author?: string;
        creationDate?: string;
    };
}

const SCALE = 2.0; // High resolution for better OCR quality

/**
 * Convert PDF file to images and extract text
 */
export async function extractPDFContent(file: File): Promise<PDFDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const pages: PDFPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: SCALE });

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport,
        } as any).promise;

        // Convert to base64 image
        const imageData = canvas.toDataURL('image/png', 1.0);

        // Extract text content
        const textContent = await extractTextFromPage(page);

        pages.push({
            pageNumber: i,
            width: viewport.width,
            height: viewport.height,
            imageData,
            textContent,
        });
    }

    // Get PDF metadata
    const metadata = await pdf.getMetadata().catch(() => ({ info: {} })) as { info?: { Title?: string; Author?: string; CreationDate?: string } };

    return {
        totalPages: pdf.numPages,
        pages,
        metadata: {
            title: metadata?.info?.Title,
            author: metadata?.info?.Author,
            creationDate: metadata?.info?.CreationDate,
        },
    };
}

/**
 * Extract text content from a PDF page
 */
async function extractTextFromPage(page: pdfjs.PDFPageProxy): Promise<string> {
    const textContent = await page.getTextContent();

    return textContent.items
        .map((item: any) => {
            if ('str' in item) {
                return item.str;
            }
            return '';
        })
        .join(' ')
        .trim();
}

/**
 * Extract specific page as image
 */
export async function extractPageAsImage(
    file: File,
    pageNumber: number,
    scale: number = 2.0
): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    if (pageNumber < 1 || pageNumber > pdf.numPages) {
        throw new Error(`Invalid page number: ${pageNumber}`);
    }

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport: viewport,
    } as any).promise;

    return canvas.toDataURL('image/png', 1.0);
}

/**
 * Detect document type based on content analysis
 */
export function detectDocumentType(textContent: string, imageBase64: string): 'ownership' | 'sketch' | 'mixed' | 'unknown' {
    const text = textContent.toLowerCase();

    // Keywords for ownership documents (صك الملكية)
    const ownershipKeywords = [
        'صك', 'ملكية', 'عقار', 'مالك', 'إصدار', 'تاريخ', 'رقم الصك',
        'حصر', 'توثيق', 'أرض', 'قطعة', 'مساحة', 'محلة', 'ولاية', 'محافظة',
        'owner', 'ownership', 'property', 'deed', 'registered'
    ];

    // Keywords for sketch documents (كروكي)
    const sketchKeywords = [
        'كروكي', 'رسم', 'هندسي', 'مقياس', 'اتجاه', 'شمال', 'جنوب', 'شرق', 'غرب',
        'حدود', 'مخطط', 'تخطيط', 'north', 'south', 'east', 'west', 'scale',
        'sketch', 'plan', 'drawing', 'boundary', 'dimension'
    ];

    const ownershipScore = ownershipKeywords.filter(k => text.includes(k.toLowerCase())).length;
    const sketchScore = sketchKeywords.filter(k => text.includes(k.toLowerCase())).length;

    // If image contains mostly graphics (low text ratio), likely a sketch
    const hasHighGraphics = imageBase64.length > 50000 && text.length < 100;

    if (hasHighGraphics && ownershipScore < 2 && sketchScore < 2) {
        return 'mixed'; // Mixed content - both text and graphics
    }

    if (ownershipScore > sketchScore && ownershipScore >= 2) {
        return 'ownership';
    }

    if (sketchScore > ownershipScore && sketchScore >= 2) {
        return 'sketch';
    }

    if (ownershipScore >= 1 || sketchScore >= 1) {
        return 'mixed';
    }

    return 'unknown';
}

/**
 * Separate pages by document type
 */
export async function separateDocumentPages(
    file: File
): Promise<{
    ownershipPages: number[];
    sketchPages: number[];
    mixedPages: number[];
}> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const ownershipPages: number[] = [];
    const sketchPages: number[] = [];
    const mixedPages: number[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        // Render at lower scale for analysis
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            viewport: viewport,
        } as any).promise;

        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        const textContent = await extractTextFromPage(page);

        const docType = detectDocumentType(textContent, imageData);

        switch (docType) {
            case 'ownership':
                ownershipPages.push(i);
                break;
            case 'sketch':
                sketchPages.push(i);
                break;
            case 'mixed':
                mixedPages.push(i);
                break;
            default:
                // Unclassified pages go to mixed
                mixedPages.push(i);
        }
    }

    return { ownershipPages, sketchPages, mixedPages };
}

/**
 * Get thumbnail preview of a page
 */
export async function getPageThumbnail(
    file: File,
    pageNumber: number,
    maxWidth: number = 200
): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    if (pageNumber < 1 || pageNumber > pdf.numPages) {
        throw new Error(`Invalid page number: ${pageNumber}`);
    }

    const page = await pdf.getPage(pageNumber);
    const scale = maxWidth / page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport: viewport,
    } as any).promise;

    return canvas.toDataURL('image/jpeg', 0.8);
}
