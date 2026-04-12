'use client';

import React, { useCallback, useRef, useState } from 'react';
import { usePDFExtractor, type ExtractionMode } from '@/hooks/usePDFExtractor';
import { Upload, FileText, Map, CheckCircle, AlertCircle, Loader2, X, ChevronRight } from 'lucide-react';

interface PDFExtractorProps {
    onExtractedData?: (data: any) => void;
    className?: string;
}

export function PDFExtractor({ onExtractedData, className = '' }: PDFExtractorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        isLoading,
        pdfDocument,
        pages,
        extractionResult,
        selectedPages,
        extractionMode,
        error,
        totalPages,
        loadPDF,
        togglePage,
        selectPagesByType,
        extractData,
        reset,
        setExtractionMode,
        getConfidenceStyle,
    } = usePDFExtractor();

    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                loadPDF(file);
            }
        }
    }, [loadPDF]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            loadPDF(e.target.files[0]);
        }
    }, [loadPDF]);

    const getDocumentTypeLabel = (type: string) => {
        switch (type) {
            case 'ownership': return { label: 'صك الملكية', color: 'bg-blue-100 text-blue-800', icon: FileText };
            case 'sketch': return { label: 'كروكي', color: 'bg-green-100 text-green-800', icon: Map };
            case 'mixed': return { label: 'مختلط', color: 'bg-amber-100 text-amber-800', icon: FileText };
            default: return { label: 'غير محدد', color: 'bg-gray-100 text-gray-800', icon: FileText };
        }
    };

    const handleUseData = useCallback(() => {
        if (extractionResult?.success) {
            onExtractedData?.(extractionResult);
        }
    }, [extractionResult, onExtractedData]);

    return (
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-l from-primary-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    استخراج البيانات من صك الملكية والكروكي
                </h3>
                <p className="text-sm text-gray-500 mt-1">قم برفع ملف PDF واستخراج البيانات تلقائياً بالذكاء الاصطناعي</p>
            </div>

            <div className="p-6">
                {/* File Upload Area */}
                {!pdfDocument && (
                    <div
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="flex flex-col items-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${dragActive ? 'bg-primary-100' : 'bg-gray-100'
                                }`}>
                                <Upload className={`w-8 h-8 ${dragActive ? 'text-primary-600' : 'text-gray-400'}`} />
                            </div>
                            <p className="text-lg font-medium text-gray-700 mb-2">
                                اسحب ملف PDF هنا أو انقر للاختيار
                            </p>
                            <p className="text-sm text-gray-500">
                                يدعم ملفات PDF متعددة الصفحات
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                اختر ملف
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && !pdfDocument && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                        <p className="text-gray-600">جاري تحميل وتحليل الملف...</p>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                        <button onClick={reset} className="text-red-600 hover:text-red-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* PDF Preview & Page Selection */}
                {pdfDocument && pages.length > 0 && !extractionResult && (
                    <div className="space-y-6">
                        {/* Controls Bar */}
                        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">وضع الاستخراج:</span>
                                <select
                                    value={extractionMode}
                                    onChange={(e) => setExtractionMode(e.target.value as ExtractionMode)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="combined">مجمع (صك + كروكي)</option>
                                    <option value="ownership">صك الملكية فقط</option>
                                    <option value="sketch">الكروكي فقط</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">تحديد الصفحات:</span>
                                <button
                                    onClick={() => selectPagesByType('all')}
                                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    الكل ({totalPages})
                                </button>
                                <button
                                    onClick={() => selectPagesByType('ownership')}
                                    className="px-3 py-1.5 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100"
                                >
                                    صكوك ({pages.filter(p => p.documentType === 'ownership' || p.documentType === 'mixed').length})
                                </button>
                                <button
                                    onClick={() => selectPagesByType('sketch')}
                                    className="px-3 py-1.5 text-sm bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100"
                                >
                                    كروكي ({pages.filter(p => p.documentType === 'sketch' || p.documentType === 'mixed').length})
                                </button>
                            </div>

                            <div className="flex-1"></div>

                            <button
                                onClick={reset}
                                className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                            >
                                رفع ملف جديد
                            </button>
                        </div>

                        {/* Pages Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {pages.map((page) => {
                                const typeInfo = getDocumentTypeLabel(page.documentType);
                                const TypeIcon = typeInfo.icon;

                                return (
                                    <div
                                        key={page.pageNumber}
                                        onClick={() => togglePage(page.pageNumber)}
                                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${page.selected
                                            ? 'border-primary-500 ring-2 ring-primary-200'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {/* Page Image */}
                                        <img
                                            src={page.thumbnail}
                                            alt={`صفحة ${page.pageNumber}`}
                                            className="w-full aspect-[3/4] object-cover"
                                        />

                                        {/* Selection Overlay */}
                                        {page.selected && (
                                            <div className="absolute top-2 right-2">
                                                <CheckCircle className="w-5 h-5 text-primary-600 bg-white rounded-full" />
                                            </div>
                                        )}

                                        {/* Page Number */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                            <span className="text-white text-sm font-medium">صفحة {page.pageNumber}</span>
                                        </div>

                                        {/* Document Type Badge */}
                                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color} flex items-center gap-1`}>
                                            <TypeIcon className="w-3 h-3" />
                                            {typeInfo.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Extract Button */}
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={extractData}
                                disabled={selectedPages.length === 0 || isLoading}
                                className="px-8 py-3 bg-gradient-to-l from-primary-600 to-primary-700 text-white rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-primary-200"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        جاري الاستخراج...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        استخراج البيانات ({selectedPages.length} صفحة)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading Extraction */}
                {isLoading && pdfDocument && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-lg font-medium text-gray-700 mb-2">الذكاء الاصطناعي يعمل على تحليل المستندات</p>
                        <p className="text-sm text-gray-500">هذا قد يستغرق بضع ثوانٍ...</p>
                    </div>
                )}

                {/* Extraction Results */}
                {extractionResult?.success && (
                    <div className="space-y-6">
                        {/* Confidence Badge */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-l from-gray-50 to-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`px-4 py-2 rounded-lg font-medium ${getConfidenceStyle(extractionResult.overallConfidence).bg
                                    } ${getConfidenceStyle(extractionResult.overallConfidence).color}`}>
                                    نسبة الثقة: {Math.round(extractionResult.overallConfidence * 100)}%
                                </div>
                                <span className="text-sm text-gray-500">
                                    {getConfidenceStyle(extractionResult.overallConfidence).label}
                                </span>
                            </div>
                            <button
                                onClick={reset}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                استخراج جديد
                            </button>
                        </div>

                        {/* Ownership Data */}
                        {extractionResult.ownership && (
                            <div className="border border-blue-200 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-semibold text-blue-900">بيانات صك الملكية</h4>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <DataField label="رقم الصك" value={extractionResult.ownership.deedNumber} />
                                    <DataField label="تاريخ الصك" value={extractionResult.ownership.deedDate} />
                                    <DataField label="اسم المالك" value={extractionResult.ownership.owner?.name} />
                                    <DataField label="رقم الهوية" value={extractionResult.ownership.owner?.idNumber} />
                                    <DataField label="المحافظة" value={extractionResult.ownership.property?.location?.governorate} />
                                    <DataField label="الولاية" value={extractionResult.ownership.property?.location?.wilayat} />
                                    <DataField label="رقم البلوك" value={extractionResult.ownership.property?.location?.blockNumber} />
                                    <DataField label="رقم القطعة" value={extractionResult.ownership.property?.location?.plotNumber} />
                                    <DataField label="المساحة" value={extractionResult.ownership.property?.area?.value} />
                                    <DataField label="وحدة المساحة" value={extractionResult.ownership.property?.area?.unit} />
                                    <DataField label="نوع العقار" value={extractionResult.ownership.property?.type} />
                                    <DataField label="الاستخدام" value={extractionResult.ownership.property?.usage} />
                                </div>
                            </div>
                        )}

                        {/* Sketch Data */}
                        {extractionResult.sketch && (
                            <div className="border border-green-200 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 bg-green-50 border-b border-green-200 flex items-center gap-2">
                                    <Map className="w-5 h-5 text-green-600" />
                                    <h4 className="font-semibold text-green-900">بيانات الكروكي</h4>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <DataField label="رقم الكروكي" value={extractionResult.sketch.drawingNumber} />
                                    <DataField label="المقياس" value={extractionResult.sketch.property?.scale?.ratio} />
                                    <DataField label="المساحة الإجمالية" value={extractionResult.sketch.property?.area?.totalArea} />
                                    <DataField label="مساحة البناء" value={extractionResult.sketch.property?.area?.buildingArea} />
                                    <DataField label="العرض" value={extractionResult.sketch.property?.dimensions?.width} />
                                    <DataField label="العمق" value={extractionResult.sketch.property?.dimensions?.depth} />
                                    <DataField label="الواجهة" value={extractionResult.sketch.property?.dimensions?.frontage} />
                                    <DataField label="الحدود الشمالية" value={extractionResult.sketch.property?.boundaries?.north} />
                                    <DataField label="الحدود الجنوبية" value={extractionResult.sketch.property?.boundaries?.south} />
                                    <DataField label="الحدود الشرقية" value={extractionResult.sketch.property?.boundaries?.east} />
                                    <DataField label="الحدود الغربية" value={extractionResult.sketch.property?.boundaries?.west} />
                                </div>

                                {/* Buildings */}
                                {extractionResult.sketch.property?.buildings && extractionResult.sketch.property.buildings.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-green-200">
                                        <h5 className="font-medium text-green-800 mb-2">المباني:</h5>
                                        <div className="space-y-2">
                                            {extractionResult.sketch.property.buildings.map((building, idx) => (
                                                <div key={idx} className="bg-green-50 p-3 rounded-lg text-sm">
                                                    <span className="font-medium">{building.type}</span> - {building.floors} أدوار - {building.area}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Facilities */}
                                {extractionResult.sketch.property?.facilities && extractionResult.sketch.property.facilities.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-green-200">
                                        <h5 className="font-medium text-green-800 mb-2">المرافق:</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {extractionResult.sketch.property.facilities.map((facility, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                                    {facility}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cross Validation */}
                        {extractionResult.crossValidation && (
                            <div className={`p-4 rounded-lg border ${extractionResult.crossValidation.areaMatch && extractionResult.crossValidation.locationMatch
                                ? 'bg-green-50 border-green-200'
                                : 'bg-amber-50 border-amber-200'
                                }`}>
                                <h4 className={`font-semibold mb-2 flex items-center gap-2 ${extractionResult.crossValidation.areaMatch && extractionResult.crossValidation.locationMatch
                                    ? 'text-green-800'
                                    : 'text-amber-800'
                                    }`}>
                                    <CheckCircle className="w-5 h-5" />
                                    التحقق من صحة البيانات
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className={extractionResult.crossValidation.areaMatch ? 'text-green-700' : 'text-amber-700'}>
                                        {extractionResult.crossValidation.areaMatch ? '✓' : '⚠'} المطابقة: المساحة
                                    </span>
                                    <span className={extractionResult.crossValidation.locationMatch ? 'text-green-700' : 'text-amber-700'}>
                                        {extractionResult.crossValidation.locationMatch ? '✓' : '⚠'} المطابقة: الموقع
                                    </span>
                                </div>
                                {extractionResult.crossValidation.notes && (
                                    <p className="mt-2 text-sm text-gray-600">{extractionResult.crossValidation.notes}</p>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={reset}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                            >
                                استخراج جديد
                            </button>
                            <button
                                onClick={handleUseData}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                            >
                                استخدام البيانات
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Extraction Error */}
                {extractionResult && !extractionResult.success && (
                    <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-red-800 mb-2">فشل في استخراج البيانات</h4>
                        <p className="text-red-600">{extractionResult.error}</p>
                        <button
                            onClick={reset}
                            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            حاول مرة أخرى
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper component for data fields
function DataField({ label, value }: { label: string; value?: string }) {
    if (!value) return null;

    return (
        <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">{label}</span>
            <span className="text-gray-900 font-medium">{value}</span>
        </div>
    );
}

export default PDFExtractor;
