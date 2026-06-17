import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Calendar, Users, TrendingUp, Trophy, AlertTriangle, FileText } from 'lucide-react';
import { API_BASE } from './config';
import StudentWeeklyReportModal from './components/StudentWeeklyReportModal';

interface StudentAnalytics {
    id: number;
    name: string;
    grade: number;
    bed_score: number;
    prayer_score: number;
    study_score: number;
    study_score_percentage: number;
    overall_score: number;
    total_bed_checks: number;
    total_prayers: number;
    total_study_sessions: number;
}

interface GradeStats {
    bed: number;
    prayer: number;
    study: number;
    overall: number;
    student_count: number;
}

interface AnalyticsData {
    students: StudentAnalytics[];
    grade_stats: Record<string, GradeStats>;
    top_performers: StudentAnalytics[];
    needs_attention: StudentAnalytics[];
    summary: {
        total_students: number;
        avg_bed: number;
        avg_prayer: number;
        avg_study: number;
        avg_overall: number;
    };
}

export default function AnalyticsPage() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [dateFilter, setDateFilter] = useState<number | 'week'>('week');
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
    const [selectedStudentName, setSelectedStudentName] = useState<string>('');

    useEffect(() => {
        fetchAnalytics();
    }, [selectedGrade, dateFilter]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedGrade) params.append('grade', selectedGrade.toString());

            if (dateFilter === 'week') {
                const today = new Date();
                const day = today.getDay(); // 0 (Sun) - 6 (Sat)
                // Calculate Monday
                // If Sunday (0), subtract 6 days. If Mon (1), subtract 0. If Tue (2), subtract 1.
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(today.setDate(diff));
                const end = new Date(); // Today

                const formatDate = (d: Date) => {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };

                params.append('start_date', formatDate(monday));
                params.append('end_date', formatDate(end));
            } else {
                params.append('days', dateFilter.toString());
            }

            const res = await axios.get(`${API_BASE}/analytics?${params}`);
            setAnalyticsData(res.data);
        } catch (error) {
            console.error("Error fetching analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getScoreBadge = (score: number) => {
        if (score >= 80) return '🟢';
        if (score >= 60) return '🟡';
        return '🔴';
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!analyticsData) return null;

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-teal-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                        <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" />
                        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">
                            📊 Öğrenci Analiz Paneli
                        </h1>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base">Toplu performans analizi ve istatistikler</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                            <button
                                onClick={() => setSelectedGrade(null)}
                                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${!selectedGrade
                                    ? 'bg-teal-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Tüm Sınıflar
                            </button>
                            {[5, 6, 7, 8].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setSelectedGrade(g)}
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${selectedGrade === g
                                        ? 'bg-teal-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {g}. Sınıf
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                            <button
                                onClick={() => setDateFilter('week')}
                                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap text-sm sm:text-base ${dateFilter === 'week'
                                    ? 'bg-teal-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Bu Hafta
                            </button>
                            {[7, 30, 90].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDateFilter(d)}
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap text-sm sm:text-base ${dateFilter === d
                                        ? 'bg-teal-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Son {d} Gün
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            <span className="text-xs sm:text-sm font-medium text-gray-600">Toplam Öğrenci</span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900">{analyticsData.summary.total_students}</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <span className="text-xl sm:text-2xl">🛏️</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-600">Yatak Düzeni</span>
                        </div>
                        <div className={`text-xl sm:text-3xl font-bold ${getScoreColor(analyticsData.summary.avg_bed)}`}>
                            {analyticsData.summary.avg_bed}%
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <span className="text-xl sm:text-2xl">📿</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-600">Namaz Katılımı</span>
                        </div>
                        <div className={`text-xl sm:text-3xl font-bold ${getScoreColor(analyticsData.summary.avg_prayer)}`}>
                            {analyticsData.summary.avg_prayer}%
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <span className="text-xl sm:text-2xl">📚</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-600">Etüt Performansı</span>
                        </div>
                        <div className="text-xl sm:text-3xl font-bold text-gray-900">
                            {analyticsData.summary.avg_study}/5
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            <span className="text-xs sm:text-sm font-medium text-gray-600">Genel Ortalama</span>
                        </div>
                        <div className={`text-2xl sm:text-3xl font-bold ${getScoreColor(analyticsData.summary.avg_overall)}`}>
                            {analyticsData.summary.avg_overall}%
                        </div>
                    </div>
                </div>

                {/* Top Performers & Needs Attention */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Top Performers */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <h3 className="text-xl font-bold text-gray-900">En Başarılı Öğrenciler</h3>
                        </div>
                        <div className="space-y-2">
                            {analyticsData.top_performers.slice(0, 5).map((student, index) => (
                                <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}</span>
                                        <div>
                                            <div className="font-bold text-gray-900">{student.name}</div>
                                            <div className="text-sm text-gray-600">{student.grade}. Sınıf</div>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-green-600">{student.overall_score}%</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Needs Attention */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Dikkat Gereken Öğrenciler</h3>
                        </div>
                        <div className="space-y-2">
                            {analyticsData.needs_attention.length > 0 ? (
                                analyticsData.needs_attention.map((student) => (
                                    <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl sm:text-2xl">⚠️</span>
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm sm:text-base">{student.name}</div>
                                                <div className="text-xs sm:text-sm text-gray-600">{student.grade}. Sınıf</div>
                                            </div>
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-red-600">{student.overall_score}%</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-2">🎉</div>
                                    <div>Tüm öğrenciler başarılı!</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grade Comparison */}
                {Object.keys(analyticsData.grade_stats).length > 1 && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">📊 Sınıf Karşılaştırması</h3>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">Sınıf</th>
                                        <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">Öğrenci Sayısı</th>
                                        <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">🛏️ Yatak</th>
                                        <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">📿 Namaz</th>
                                        <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">📚 Etüt</th>
                                        <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">📈 Genel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(analyticsData.grade_stats).map(([grade, stats]) => (
                                        <tr key={grade} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 font-bold text-gray-900 text-sm sm:text-base">{grade}. Sınıf</td>
                                            <td className="py-3 px-4 text-center text-gray-700 text-sm sm:text-base">{stats.student_count}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`font-bold px-2 sm:px-3 py-1 rounded-lg text-sm sm:text-base ${getScoreColor(stats.bed)}`}>
                                                    {stats.bed}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`font-bold px-2 sm:px-3 py-1 rounded-lg text-sm sm:text-base ${getScoreColor(stats.prayer)}`}>
                                                    {stats.prayer}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-gray-900 text-sm sm:text-base">{stats.study}/5</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`font-bold px-2 sm:px-3 py-1 rounded-lg text-sm sm:text-base ${getScoreColor(stats.overall)}`}>
                                                    {stats.overall}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* All Students Table */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">👥 Tüm Öğrenciler</h3>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">Sıra</th>
                                    <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">Öğrenci</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">Sınıf</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">🛏️ Yatak</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">📿 Namaz</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">📚 Etüt</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">📈 Genel</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm sm:text-base">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.students.map((student, index) => (
                                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-gray-700 font-medium text-sm sm:text-base">#{index + 1}</td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-gray-900 text-sm sm:text-base">{student.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {student.total_bed_checks} yatak • {student.total_prayers} namaz • {student.total_study_sessions} etüt
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-700 text-sm sm:text-base">{student.grade}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`font-bold px-2 sm:px-3 py-1 rounded-lg text-sm sm:text-base ${getScoreColor(student.bed_score)}`}>
                                                {getScoreBadge(student.bed_score)} {student.bed_score}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`font-bold px-2 sm:px-3 py-1 rounded-lg text-sm sm:text-base ${getScoreColor(student.prayer_score)}`}>
                                                {getScoreBadge(student.prayer_score)} {student.prayer_score}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold text-gray-900 text-sm sm:text-base">{student.study_score}/5</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`font-bold px-2 sm:px-3 py-1 rounded-lg text-sm sm:text-base ${getScoreColor(student.overall_score)}`}>
                                                {getScoreBadge(student.overall_score)} {student.overall_score}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedStudentId(student.id);
                                                    setSelectedStudentName(student.name);
                                                    setShowReportModal(true);
                                                }}
                                                className="inline-flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                                            >
                                                <FileText className="w-4 h-4" />
                                                <span className="hidden sm:inline">Rapor</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Weekly Report Modal */}
            {showReportModal && selectedStudentId && (
                <StudentWeeklyReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    studentId={selectedStudentId}
                    studentName={selectedStudentName}
                    startDate={
                        dateFilter === 'week'
                            ? (() => {
                                const today = new Date();
                                const monday = new Date(today);
                                const dayOfWeek = today.getDay();
                                const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                                monday.setDate(today.getDate() + diff);
                                return monday.toISOString().split('T')[0];
                            })()
                            : (() => {
                                const today = new Date();
                                const pastDate = new Date(today);
                                pastDate.setDate(today.getDate() - (typeof dateFilter === 'number' ? dateFilter - 1 : 6));
                                return pastDate.toISOString().split('T')[0];
                            })()
                    }
                    endDate={new Date().toISOString().split('T')[0]}
                />
            )}
        </div>
    );
}
