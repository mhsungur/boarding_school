import React, { useEffect, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { API_BASE } from '../config';
import html2pdf from 'html2pdf.js';

interface StudentWeeklyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: number;
    studentName: string;
    startDate: string;
    endDate: string;
}

interface ReportData {
    student: {
        id: number;
        name: string;
        grade: number;
        student_number: string;
    };
    period: {
        start_date: string;
        end_date: string;
        days_count: number;
    };
    summary: {
        overall_score: number;
        performance_level: string;
        performance_text: string;
        bed_score: number;
        prayer_score: number;
        study_score: number;
        bed_stats: any;
        prayer_stats: any;
        study_stats: any;
    };
    daily_details: Array<{
        date: string;
        day_name: string;
        bed: {
            status: string;
            display: string;
        };
        prayers: any;
        studies: any;
    }>;
}

const StudentWeeklyReportModal: React.FC<StudentWeeklyReportModalProps> = ({
    isOpen,
    onClose,
    studentId,
    startDate,
    endDate
}) => {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && studentId) {
            fetchReport();
        }
    }, [isOpen, studentId, startDate, endDate]);

    // Add class to body when modal is open for print styling
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('report-modal-open');
        } else {
            document.body.classList.remove('report-modal-open');
        }

        return () => {
            document.body.classList.remove('report-modal-open');
        };
    }, [isOpen]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const apiUrl = `${API_BASE}/student-weekly-report/${studentId}?start_date=${startDate}&end_date=${endDate}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                console.error('API returned error:', data.error);
                return;
            }

            setReportData(data);
        } catch (error) {
            console.error('Rapor yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        const element = document.querySelector('.report-content') as HTMLElement;
        if (!element || !reportData) return;

        const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: `${reportData.student.name}_Haftalik_Rapor_${reportData.period.start_date}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatDateShort = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const getDayNameTR = (dayName: string) => {
        const days: Record<string, string> = {
            'Monday': 'Pazartesi',
            'Tuesday': 'Salı',
            'Wednesday': 'Çarşamba',
            'Thursday': 'Perşembe',
            'Friday': 'Cuma',
            'Saturday': 'Cumartesi',
            'Sunday': 'Pazar'
        };
        return days[dayName] || dayName;
    };

    if (!isOpen) return null;

    return (
        <div className="report-modal fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
            <div className="min-h-screen px-4 py-8 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Screen Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 no-print">
                        <h2 className="text-2xl font-bold text-gray-900">Haftalık Performans Raporu</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownloadPDF}
                                disabled={!reportData}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                PDF İndir
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                Yazdır
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="report-content">
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            </div>
                        ) : reportData ? (
                            <>
                                {/* PAGE 1 - SUMMARY */}
                                <div className="page page-1 p-12" style={{ minHeight: '250mm' }}>
                                    {/* Header */}
                                    <div className="text-center mb-8 pb-4 border-b-2 border-indigo-600">
                                        <div className="flex items-center justify-center gap-3 mb-2">
                                            <span className="text-4xl">📊</span>
                                            <h1 className="text-3xl font-bold text-indigo-600">Haftalık Performans Raporu</h1>
                                        </div>
                                        <p className="text-gray-600 text-sm">Hasbahçe Talebe Takip Platformu</p>
                                    </div>

                                    {/* Student Info */}
                                    <div className="bg-gray-50 rounded-lg p-5 mb-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-1">{reportData.student.name}</h2>
                                                <p className="text-gray-600">{reportData.student.grade}. Sınıf • Okul No: {reportData.student.student_number}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{formatDateShort(reportData.period.start_date)} - {formatDateShort(reportData.period.end_date)}</p>
                                                <p className="text-sm text-gray-500">{reportData.period.days_count} Günlük Dönem</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Overall Performance - Large Display */}
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 mb-6 text-center border-2 border-indigo-200">
                                        <p className="text-sm font-semibold text-gray-600 mb-2">GENEL PERFORMANS SKORU</p>
                                        <div className="flex items-center justify-center gap-6">
                                            <div className="text-7xl font-bold text-indigo-600">{reportData.summary.overall_score}%</div>
                                            <div className="text-left">
                                                <p className="text-3xl font-bold text-gray-900">{reportData.summary.performance_text}</p>
                                                <p className="text-gray-600 mt-1">Seviye</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Bars */}
                                    <div className="space-y-4 mb-8">
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Kategori Detayları</h3>

                                        {/* Bed Bar */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">🛏️</span>
                                                    <span className="font-semibold text-gray-900">Yatak Düzeni</span>
                                                </div>
                                                <span className="text-2xl font-bold text-gray-900">{reportData.summary.bed_score}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                                <div
                                                    className="bg-blue-600 h-3 rounded-full transition-all"
                                                    style={{ width: `${reportData.summary.bed_score}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                ✅ Düzenli: {reportData.summary.bed_stats.tidy} gün •
                                                ❌ Düzensiz: {reportData.summary.bed_stats.untidy} gün
                                            </p>
                                        </div>

                                        {/* Prayer Bar */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">🕌</span>
                                                    <span className="font-semibold text-gray-900">Namaz Devamı</span>
                                                </div>
                                                <span className="text-2xl font-bold text-gray-900">{reportData.summary.prayer_score}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                                <div
                                                    className="bg-purple-600 h-3 rounded-full transition-all"
                                                    style={{ width: `${reportData.summary.prayer_score}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                ✅ Geldi: {reportData.summary.prayer_stats.geldi} •
                                                ⏰ Geç: {reportData.summary.prayer_stats.gec_kaldi} •
                                                ❌ Gelmedi: {reportData.summary.prayer_stats.gelmedi}
                                            </p>
                                        </div>

                                        {/* Study Bar */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">📚</span>
                                                    <span className="font-semibold text-gray-900">Etüt Performansı</span>
                                                </div>
                                                <span className="text-2xl font-bold text-gray-900">{reportData.summary.study_score}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                                <div
                                                    className="bg-green-600 h-3 rounded-full transition-all"
                                                    style={{ width: `${reportData.summary.study_score}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                📖 Toplam Oturum: {reportData.summary.study_stats.total} •
                                                ⭐ Ortalama: {reportData.summary.study_stats.average}/5
                                            </p>
                                        </div>
                                    </div>

                                    {/* Weekly Summary Stats */}
                                    <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100 mb-6">
                                        <h3 className="font-bold text-gray-900 mb-3 text-center">Haftalık Özet</h3>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-2xl font-bold text-indigo-600">{reportData.summary.bed_stats.total}</p>
                                                <p className="text-sm text-gray-600">Yatak Kontrolü</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-indigo-600">{reportData.summary.prayer_stats.total}</p>
                                                <p className="text-sm text-gray-600">Namaz Kaydı</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-indigo-600">{reportData.summary.study_stats.total}</p>
                                                <p className="text-sm text-gray-600">Etüt Oturumu</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Page 1 */}
                                    <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                                        <p className="text-xs text-gray-500">
                                            Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')} • Sayfa 1/2
                                        </p>
                                    </div>
                                </div>

                                {/* PAGE 2 - DAILY DETAILS */}
                                <div className="page page-2 p-12">
                                    {/* Header Page 2 */}
                                    <div className="text-center mb-6 pb-3 border-b border-gray-300">
                                        <h2 className="text-xl font-bold text-gray-900">Günlük Detaylar</h2>
                                        <p className="text-sm text-gray-600">{reportData.student.name} - {formatDateShort(reportData.period.start_date)} / {formatDateShort(reportData.period.end_date)}</p>
                                    </div>

                                    {/* Daily Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Gün</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Tarih</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold w-12">Y</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold w-12">S</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold w-12">Ö</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold w-12">İ</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold w-12">A</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold w-12">Ya</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Etüt</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.daily_details.map((day, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="border border-gray-300 px-3 py-2 font-medium">
                                                            {getDayNameTR(day.day_name)}
                                                        </td>
                                                        <td className="border border-gray-300 px-3 py-2 text-gray-600">
                                                            {formatDateShort(day.date)}
                                                        </td>
                                                        <td className="border border-gray-300 px-3 py-2 text-center">
                                                            {day.bed.status === 'tidy' ? '✓' : day.bed.status === 'untidy' ? '✗' : '-'}
                                                        </td>
                                                        {['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'].map((prayer) => (
                                                            <td key={prayer} className="border border-gray-300 px-3 py-2 text-center">
                                                                {day.prayers[prayer]?.status === 'geldi' ? '✓' :
                                                                    day.prayers[prayer]?.status === 'gec_kaldi' ? '⏰' :
                                                                        day.prayers[prayer]?.status === 'gelmedi' ? '✗' :
                                                                            day.prayers[prayer]?.status === 'mazeret' ? 'M' : '-'}
                                                            </td>
                                                        ))}
                                                        <td className="border border-gray-300 px-3 py-2 text-center">
                                                            {day.studies.etut?.display || day.studies.dini_ders?.display || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Legend */}
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-700 mb-2 font-semibold">AÇIKLAMA:</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            <p><strong>Y:</strong> Yatak Düzeni</p>
                                            <p><strong>✓:</strong> Başarılı / Geldi</p>
                                            <p><strong>S, Ö, İ, A, Ya:</strong> Namaz Vakitleri</p>
                                            <p><strong>✗:</strong> Başarısız / Gelmedi</p>
                                            <p><strong>Etüt:</strong> Etüt Performansı</p>
                                            <p><strong>⏰:</strong> Geç Kaldı • <strong>M:</strong> Mazeretli</p>
                                        </div>
                                    </div>

                                    {/* Footer Page 2 */}
                                    <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                                        <p className="text-xs text-gray-500 mb-2">
                                            Bu rapor {new Date().toLocaleDateString('tr-TR')} tarihinde Hasbahçe Talebe Takip Platformu tarafından oluşturulmuştur.
                                        </p>
                                        <p className="text-xs text-gray-500">Sayfa 2/2</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-24">
                                <p className="text-gray-500">Rapor yüklenemedi.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    .page {
                        page-break-after: always;
                        page-break-inside: avoid;
                    }
                    
                    .page-2 {
                        page-break-before: always;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default StudentWeeklyReportModal;
