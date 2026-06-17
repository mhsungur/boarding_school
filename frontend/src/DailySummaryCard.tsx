import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Users, AlertTriangle, Trophy, TrendingUp, RefreshCw } from 'lucide-react';
import { API_BASE } from './config';

interface DailySummary {
    date: string;
    general: {
        total_students: number;
        data_completion: number;
        missing_data: number;
        completion_percentage: number;
    };
    prayer: {
        geldi: number;
        gec_kaldi: number;
        gelmedi: number;
        mazeret: number;
        total: number;
        rate: number;
    };
    bed: {
        tidy: number;
        untidy: number;
        total: number;
        rate: number;
    };
    study: {
        mukemmel: number;
        iyi: number;
        orta: number;
        zayif: number;
        katilmadi: number;
        total: number;
        avg_score: number;
        rate: number;
    };
    overall_rate: number;
    warnings: Array<{
        student_id: number;
        name: string;
        grade: number;
        issues: string[];
    }>;
    top_performers: Array<{
        student_id: number;
        name: string;
        grade: number;
        score: number;
    }>;
}

export default function DailySummaryCard() {
    const [summary, setSummary] = useState<DailySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchSummary();
    }, [selectedDate]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/daily-summary?date=${selectedDate}`);
            setSummary(res.data);
        } catch (error) {
            console.error('Error fetching daily summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getScoreEmoji = (score: number) => {
        if (score >= 80) return '🟢';
        if (score >= 60) return '🟡';
        return '🔴';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!summary) {
        return null;
    }

    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-teal-700 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-white" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">📊 Günün Özeti</h2>
                            <p className="text-teal-100 text-sm">
                                {new Date(summary.date).toLocaleDateString('tr-TR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchSummary}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                    >
                        <RefreshCw className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                {/* Prayer */}
                <div className={`p-4 rounded-2xl ${getScoreColor(summary.prayer.rate)}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">🕌 Namaz</span>
                        <span className="text-2xl">{getScoreEmoji(summary.prayer.rate)}</span>
                    </div>
                    <div className="text-3xl font-bold">{summary.prayer.rate}%</div>
                    <div className="text-xs mt-1 opacity-75">
                        {summary.prayer.geldi} geldi, {summary.prayer.gec_kaldi} geç
                    </div>
                </div>

                {/* Bed */}
                <div className={`p-4 rounded-2xl ${getScoreColor(summary.bed.rate)}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">🛏️ Yatak</span>
                        <span className="text-2xl">{getScoreEmoji(summary.bed.rate)}</span>
                    </div>
                    <div className="text-3xl font-bold">{summary.bed.rate}%</div>
                    <div className="text-xs mt-1 opacity-75">
                        {summary.bed.tidy}/{summary.bed.total} düzenli
                    </div>
                </div>

                {/* Study */}
                <div className={`p-4 rounded-2xl ${getScoreColor(summary.study.rate)}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">📚 Etüt</span>
                        <span className="text-2xl">{getScoreEmoji(summary.study.rate)}</span>
                    </div>
                    <div className="text-3xl font-bold">{summary.study.rate}%</div>
                    <div className="text-xs mt-1 opacity-75">
                        {summary.study.mukemmel} mükemmel, {summary.study.iyi} iyi
                    </div>
                </div>

                {/* Overall */}
                <div className={`p-4 rounded-2xl ${getScoreColor(summary.overall_rate)}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">📊 Genel</span>
                        <span className="text-2xl">{getScoreEmoji(summary.overall_rate)}</span>
                    </div>
                    <div className="text-3xl font-bold">{summary.overall_rate}%</div>
                    <div className="text-xs mt-1 opacity-75">
                        {summary.general.data_completion}/{summary.general.total_students} veri
                    </div>
                </div>
            </div>

            {/* Warnings and Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pt-0">
                {/* Warnings */}
                <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h3 className="text-lg font-bold text-red-900">
                            ⚠️ Dikkat Gerektiren ({summary.warnings.length})
                        </h3>
                    </div>
                    {summary.warnings.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {summary.warnings.map((warning, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl">
                                    <div className="font-semibold text-gray-900">
                                        {warning.name} ({warning.grade}. Sınıf)
                                    </div>
                                    <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                                        {warning.issues.map((issue, i) => (
                                            <li key={i}>{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl text-center">
                            <div className="text-4xl mb-2">✅</div>
                            <div className="font-semibold text-gray-700">Harika!</div>
                            <div className="text-sm text-gray-500 mt-1">
                                Dikkat gerektiren öğrenci yok
                            </div>
                        </div>
                    )}
                </div>

                {/* Top Performers */}
                <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-bold text-green-900">
                            🏆 Günün Yıldızları ({summary.top_performers.length})
                        </h3>
                    </div>
                    {summary.top_performers.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {summary.top_performers.map((performer, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            {idx + 1}. {performer.name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {performer.grade}. Sınıf
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                        <span className="text-2xl font-bold text-green-600">
                                            {performer.score}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl text-center">
                            <div className="text-4xl mb-2">📊</div>
                            <div className="font-semibold text-gray-700">Henüz veri yok</div>
                            <div className="text-sm text-gray-500 mt-1">
                                Performans verileri bekleniyor
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>
                            Toplam {summary.general.total_students} öğrenci •
                            Veri girişi: %{summary.general.completion_percentage}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500">
                        Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
                    </div>
                </div>
            </div>
        </div>
    );
}
