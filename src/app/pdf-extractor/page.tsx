'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import to avoid SSR issues with pdfjs-dist
const PDFExtractor = dynamic(
    () => import('@/components/pdf-extractor/PDFExtractor').then(mod => mod.PDFExtractor),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                <span className="mr-3 text-gray-600">جاري تحميل المكون...</span>
            </div>
        )
    }
);

export default function PDFExtractorPage() {
    const handleExtractedData = (data: any) => {
        console.log('Extracted data:', data);
        // يمكنك إضافة البيانات المستخرجة إلى النموذج أو إرسالها للخادم
        alert('تم استخراج البيانات بنجاح! شاهد الكونسول للتفاصيل.');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        استخراج بيانات الملكية والكروكي
                    </h1>
                    <p className="text-gray-600">
                        استخدم الذكاء الاصطناعي لاستخراج البيانات من صكوك الملكية والكروكي بشكل احترافي
                    </p>
                </div>

                {/* Main Component */}
                <PDFExtractor onExtractedData={handleExtractedData} />

                {/* Instructions */}
                <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">كيفية الاستخدام</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">1</div>
                            <div>
                                <h4 className="font-medium text-gray-900">رفع ملف PDF</h4>
                                <p className="text-sm text-gray-600">اسحب ملف PDF الذي يحتوي على صك الملكية والكروكي أو انقر لاختيار الملف</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">2</div>
                            <div>
                                <h4 className="font-medium text-gray-900">اختيار الصفحات</h4>
                                <p className="text-sm text-gray-600">سيقوم النظام بتحليل الصفحات تلقائياً وتصنيفها. يمكنك اختيار الصفحات يدوياً</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">3</div>
                            <div>
                                <h4 className="font-medium text-gray-900">استخراج البيانات</h4>
                                <p className="text-sm text-gray-600">اضغط على زر الاستخراج لبدء تحليل الذكاء الاصطناعي واستخراج البيانات</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">4</div>
                            <div>
                                <h4 className="font-medium text-gray-900">مراجعة واستخدام</h4>
                                <p className="text-sm text-gray-600">راجع البيانات المستخرجة مع نسب الثقة، ثم استخدمها في تقريرك</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">دقة عالية</h4>
                        <p className="text-sm text-gray-600">يستخدم الذكاء الاصطناعي Google's Gemini لاستخراج البيانات بدقة عالية</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">تحقق متقدم</h4>
                        <p className="text-sm text-gray-600">يقارن البيانات بين الصك والكروكي للتحقق من صحتها</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">سريع وسهل</h4>
                        <p className="text-sm text-gray-600">استخراج البيانات في ثوانٍ بدلاً من ساعات من الإدخال اليدوي</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
