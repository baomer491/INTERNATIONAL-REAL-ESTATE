import { useState, useCallback } from 'react';
import { extractPDFContent, separateDocumentPages, type PDFDocument } from '@/lib/pdf-processor';

export interface ExtractedOwnershipData {
    deedNumber: string;
    deedDate: string;
    owner: {
        name: string;
        idNumber: string;
        idType: string;
    };
    property: {
        type: string;
        usage: string;
        location: {
            governorate: string;
            wilayat: string;
            village: string;
            blockNumber: string;
            plotNumber: string;
            street: string;
        };
        area: {
            value: string;
            unit: string;
        };
        boundaries: {
            north: string;
            south: string;
            east: string;
            west: string;
        };
        frontage: string;
    };
    restrictions: string[];
    notes: string;
}

export interface ExtractedSketchData {
    drawingNumber: string;
    drawingDate: string;
    property: {
        location: {
            governorate: string;
            wilayat: string;
            blockNumber: string;
            plotNumber: string;
        };
        area: {
            totalArea: string;
            buildingArea: string;
            openArea: string;
            unit: string;
        };
        dimensions: {
            width: string;
            depth: string;
            frontage: string;
            unit: string;
        };
        boundaries?: {
            north: string;
            south: string;
            east: string;
            west: string;
        };
        buildings: Array<{
            type: string;
            floors: string;
            area: string;
            usage: string;
        }>;
        facilities: string[];
        scale: {
            ratio: string;
            unit: string;
        };
    };
}

export interface ExtractionResult {
    success: boolean;
    ownership?: ExtractedOwnershipData;
    sketch?: ExtractedSketchData;
    crossValidation?: {
        areaMatch: boolean;
        locationMatch: boolean;
        notes: string;
    };
    overallConfidence: number;
    error?: string;
}

export interface PageInfo {
    pageNumber: number;
    thumbnail: string;
    documentType: 'ownership' | 'sketch' | 'mixed' | 'unknown';
    selected: boolean;
}

export type ExtractionMode = 'combined' | 'ownership' | 'sketch';

export function usePDFExtractor() {
    const [isLoading, setIsLoading] = useState(false);
    const [pdfDocument, setPdfDocument] = useState<PDFDocument | null>(null);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [extractionMode, setExtractionMode] = useState<ExtractionMode>('combined');
    const [error, setError] = useState<string | null>(null);

    /**
     * Load and process a PDF file
     */
    const loadPDF = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setExtractionResult(null);

        try {
            // Extract content and detect page types
            const [doc, pageTypes] = await Promise.all([
                extractPDFContent(file),
                separateDocumentPages(file),
            ]);

            setPdfDocument(doc);

            // Create page info array
            const pageInfos: PageInfo[] = [];
            for (let i = 0; i < doc.totalPages; i++) {
                const pageNum = i + 1;
                let docType: PageInfo['documentType'] = 'unknown';

                if (pageTypes.ownershipPages.includes(pageNum)) {
                    docType = 'ownership';
                } else if (pageTypes.sketchPages.includes(pageNum)) {
                    docType = 'sketch';
                } else if (pageTypes.mixedPages.includes(pageNum)) {
                    docType = 'mixed';
                }

                pageInfos.push({
                    pageNumber: pageNum,
                    thumbnail: doc.pages[i].imageData,
                    documentType: docType,
                    selected: true,
                });
            }

            setPages(pageInfos);
            setSelectedPages(pageInfos.map(p => p.pageNumber));

        } catch (err: any) {
            setError(err.message || 'فشل في تحميل ملف PDF');
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Toggle page selection
     */
    const togglePage = useCallback((pageNumber: number) => {
        setPages(prev => prev.map(p => {
            if (p.pageNumber === pageNumber) {
                const newSelected = !p.selected;
                if (newSelected) {
                    setSelectedPages(s => [...s, pageNumber]);
                } else {
                    setSelectedPages(s => s.filter(num => num !== pageNumber));
                }
                return { ...p, selected: newSelected };
            }
            return p;
        }));
    }, []);

    /**
     * Select all pages of a specific type
     */
    const selectPagesByType = useCallback((type: 'ownership' | 'sketch' | 'all') => {
        setPages(prev => {
            const newPages = prev.map(p => {
                let shouldSelect = false;
                if (type === 'all') {
                    shouldSelect = true;
                } else if (type === 'ownership') {
                    shouldSelect = p.documentType === 'ownership' || p.documentType === 'mixed';
                } else if (type === 'sketch') {
                    shouldSelect = p.documentType === 'sketch' || p.documentType === 'mixed';
                }
                return { ...p, selected: shouldSelect };
            });

            const selected = newPages.filter(p => p.selected).map(p => p.pageNumber);
            setSelectedPages(selected);

            return newPages;
        });
    }, []);

    /**
     * Extract data from selected pages - sends pages separately by type
     */
    const extractData = useCallback(async () => {
        if (!pdfDocument || selectedPages.length === 0) {
            setError('الرجاء تحديد صفحات للاستخراج');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Separate selected pages by document type
            const ownershipPages: string[] = [];
            const sketchPages: string[] = [];
            const mixedPages: string[] = [];

            const sortedSelected = [...selectedPages].sort((a, b) => a - b);

            for (const pageNum of sortedSelected) {
                const page = pages.find(p => p.pageNumber === pageNum);
                const imageData = pdfDocument.pages[pageNum - 1].imageData;

                if (page?.documentType === 'ownership') {
                    ownershipPages.push(imageData);
                } else if (page?.documentType === 'sketch') {
                    sketchPages.push(imageData);
                } else if (page?.documentType === 'mixed') {
                    mixedPages.push(imageData);
                } else {
                    // Unknown type - add to mixed
                    mixedPages.push(imageData);
                }
            }

            // Call extraction API with separate arrays
            const csrfToken = localStorage.getItem('csrf_token');
            const pdfHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
            if (csrfToken) pdfHeaders['x-csrf-token'] = csrfToken;

            const response = await fetch('/api/pdf-extract', {
                method: 'POST',
                headers: pdfHeaders,
                body: JSON.stringify({
                    ownershipPages,
                    sketchPages,
                    mixedPages,
                    mode: extractionMode,
                }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'فشل في استخراج البيانات');
            }

            setExtractionResult({
                success: true,
                ownership: result.ownership,
                sketch: result.sketch,
                crossValidation: result.crossValidation,
                overallConfidence: result.overallConfidence,
            });

        } catch (err: any) {
            setError(err.message || 'فشل في استخراج البيانات');
            setExtractionResult({
                success: false,
                overallConfidence: 0,
                error: err.message,
            });
        } finally {
            setIsLoading(false);
        }
    }, [pdfDocument, selectedPages, pages, extractionMode]);

    /**
     * Reset extractor state
     */
    const reset = useCallback(() => {
        setPdfDocument(null);
        setPages([]);
        setExtractionResult(null);
        setSelectedPages([]);
        setError(null);
    }, []);

    /**
     * Get confidence label and color
     */
    const getConfidenceStyle = useCallback((confidence: number) => {
        if (confidence >= 0.8) {
            return { label: 'عالي جداً', color: '#15803d', bg: '#dcfce7' };
        } else if (confidence >= 0.6) {
            return { label: 'عالي', color: '#16a34a', bg: '#dcfce7' };
        } else if (confidence >= 0.4) {
            return { label: 'متوسط', color: '#b45309', bg: '#fef3c7' };
        } else if (confidence >= 0.2) {
            return { label: 'منخفض', color: '#dc2626', bg: '#fef2f2' };
        } else {
            return { label: 'غير متاح', color: '#6b7280', bg: '#f3f4f6' };
        }
    }, []);

    return {
        // State
        isLoading,
        pdfDocument,
        pages,
        extractionResult,
        selectedPages,
        extractionMode,
        error,
        totalPages: pdfDocument?.totalPages || 0,

        // Actions
        loadPDF,
        togglePage,
        selectPagesByType,
        extractData,
        reset,
        setExtractionMode,

        // Helpers
        getConfidenceStyle,
    };
}
