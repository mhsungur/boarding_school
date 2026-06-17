import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Book, Star, X, Sparkles, Users, Calendar, Save } from 'lucide-react';
import { API_BASE } from './config';

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    grade: number;
    student_number: string;
}

const sessionTypes = [
    { id: 'etut', name: 'Etüt', icon: BookOpen, gradient: 'from-teal-500 to-teal-700' },
    { id: 'dini_ders', name: 'Dini Ders', icon: Book, gradient: 'from-emerald-500 to-teal-600' },
];

const performances = [
    { id: 'mukemmel', name: 'Mükemmel', stars: 4, color: 'bg-gradient-to-r from-purple-500 to-pink-600', textColor: 'text-purple-600' },
    { id: 'iyi', name: 'İyi', stars: 3, color: 'bg-gradient-to-r from-green-500 to-emerald-600', textColor: 'text-green-600' },
    { id: 'orta', name: 'Orta', stars: 2, color: 'bg-gradient-to-r from-yellow-500 to-orange-500', textColor: 'text-yellow-600' },
    { id: 'zayif', name: 'Zayıf', stars: 1, color: 'bg-gradient-to-r from-red-500 to-rose-600', textColor: 'text-red-600' },
    { id: 'katilmadi', name: 'Katılmadı', stars: 0, color: 'bg-gray-500', textColor: 'text-gray-600' },
    { id: 'izinli', name: 'İzinli', stars: 0, color: 'bg-blue-500', textColor: 'text-blue-600' },
];

export default function StudyPerformancePage() {
    const [selectedGrade, setSelectedGrade] = useState<number>(5);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedSession, setSelectedSession] = useState<string>('etut');
    const [students, setStudents] = useState<Student[]>([]);
    const [performance, setPerformance] = useState<Record<number, string>>({});
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allPerformance, setAllPerformance] = useState<Record<number, string>>({});
    const [showOverview, setShowOverview] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    useEffect(() => {
        fetchData();
        fetchOverviewData();
    }, [selectedGrade, selectedDate, selectedSession]);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ ...toast, show: false });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const fetchOverviewData = async () => {
        try {
            const allStudentsRes = await axios.get(`${API_BASE}/students`);
            setAllStudents(allStudentsRes.data);

            const allPerfRes = await axios.get(`${API_BASE}/study-performance?date=${selectedDate}&session=${selectedSession}`);
            const allPerfMap: Record<number, string> = {};
            allPerfRes.data.forEach((p: any) => {
                allPerfMap[p.student_id] = p.performance;
            });
            setAllPerformance(allPerfMap);
        } catch (error) {
            console.error("Error fetching overview data", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const studentRes = await axios.get(`${API_BASE}/students?grade=${selectedGrade}`);
            const fetchedStudents = studentRes.data;
            setStudents(fetchedStudents);

            const perfRes = await axios.get(`${API_BASE}/study-performance?date=${selectedDate}&session=${selectedSession}`);
            const perfMap: Record<number, string> = {};

            const studentIds = new Set(fetchedStudents.map((s: Student) => s.id));
            perfRes.data.forEach((p: any) => {
                if (studentIds.has(p.student_id)) {
                    perfMap[p.student_id] = p.performance;
                }
            });
            setPerformance(perfMap);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const togglePerformance = (studentId: number, perf: string) => {
        setPerformance(prev => ({
            ...prev,
            [studentId]: perf
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = Object.entries(performance).map(([studentId, perf]) => ({
                student_id: parseInt(studentId),
                performance: perf
            }));

            await axios.post(`${API_BASE}/study-performance?perf_date=${selectedDate}&session=${selectedSession}`, payload);
            showToast('✅ Performans kayıtları başarıyla kaydedildi!', 'success');
            fetchOverviewData();
        } catch (error) {
            console.error("Error saving", error);
            showToast('❌ Kaydetme sırasında hata oluştu!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const stats = {
        mukemmel: Object.values(performance).filter(p => p === 'mukemmel').length,
        iyi: Object.values(performance).filter(p => p === 'iyi').length,
        orta: Object.values(performance).filter(p => p === 'orta').length,
        zayif: Object.values(performance).filter(p => p === 'zayif').length,
        katilmadi: Object.values(performance).filter(p => p === 'katilmadi').length,
        izinli: Object.values(performance).filter(p => p === 'izinli').length,
        unchecked: students.filter(s => !performance[s.id]).length
    };

    const getGradeStats = (grade: number) => {
        const gradeStudents = allStudents.filter(s => s.grade === grade);
        const mukemmel = gradeStudents.filter(s => allPerformance[s.id] === 'mukemmel').length;
        const iyi = gradeStudents.filter(s => allPerformance[s.id] === 'iyi').length;
        const orta = gradeStudents.filter(s => allPerformance[s.id] === 'orta').length;
        const zayif = gradeStudents.filter(s => allPerformance[s.id] === 'zayif').length;
        const katilmadi = gradeStudents.filter(s => allPerformance[s.id] === 'katilmadi').length;
        const izinli = gradeStudents.filter(s => allPerformance[s.id] === 'izinli').length;
        const unchecked = gradeStudents.filter(s => !allPerformance[s.id]).length;
        return { total: gradeStudents.length, mukemmel, iyi, orta, zayif, katilmadi, izinli, unchecked };
    };

    const currentSession = sessionTypes.find(s => s.id === selectedSession)!;
    const SessionIcon = currentSession.icon;

    return (
        <div className="min-h-screen p-3 sm:p-6">
            {/* Toast */}
            {toast.show && (
                <div className="fixed top-6 right-6 z-50 animate-slide-in">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-2 ${toast.type === 'success'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400'
                        : 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400'
                        }`}>
                        <span className="text-white font-semibold">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full mb-4">
                        <Sparkles className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-medium text-teal-800">Hasbahçe Talebe Takip Sistemi</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        📚 Etüt & Ders Performansı
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">Öğrencilerinizin performansını takip edin</p>
                </div>

                {/* Overview */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowOverview(!showOverview)}
                        className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all mb-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-teal-600" />
                            <span className="font-semibold text-gray-900">Tüm Sınıflar - {currentSession.name} Genel Durum</span>
                        </div>
                        <span className="text-gray-500">{showOverview ? '▼' : '▶'}</span>
                    </button>

                    {showOverview && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[5, 6, 7, 8].map(grade => {
                                const gradeStats = getGradeStats(grade);
                                const validTotal = gradeStats.total - gradeStats.izinli;
                                const avgPerf = validTotal > 0
                                    ? Math.round(((gradeStats.mukemmel * 4 + gradeStats.iyi * 3 + gradeStats.orta * 2 + gradeStats.zayif * 1) / validTotal) * 25)
                                    : 0;

                                return (
                                    <div key={grade} className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">{grade}. Sınıf</h3>
                                            <div className="text-2xl font-bold text-teal-600">{gradeStats.total}</div>
                                        </div>
                                        <div className="space-y-2 mb-3">
                                            {performances.map(perf => (
                                                <div key={perf.id} className="flex items-center justify-between text-sm">
                                                    <span className={`flex items-center gap-1 ${perf.textColor}`}>
                                                        {perf.stars > 0 ? (
                                                            <div className="flex">
                                                                {[...Array(perf.stars)].map((_, i) => (
                                                                    <Star key={i} className="w-3 h-3 fill-current" />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <X className="w-3 h-3" />
                                                        )}
                                                        <span className="text-xs">{perf.name}</span>
                                                    </span>
                                                    <span className="font-semibold">{gradeStats[perf.id as keyof typeof gradeStats]}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                <span>Ortalama</span>
                                                <span className="font-semibold">{avgPerf}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-teal-500 to-teal-700 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${avgPerf}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Session Tabs */}
                <div className="mb-6 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex gap-2 sm:gap-3 min-w-max">
                        {sessionTypes.map(session => {
                            const Icon = session.icon;
                            return (
                                <button
                                    key={session.id}
                                    onClick={() => setSelectedSession(session.id)}
                                    className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 ${selectedSession === session.id
                                        ? `bg-teal-600 text-white shadow-lg scale-105`
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="text-sm sm:text-base">{session.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                    {performances.map(perf => (
                        <div key={perf.id} className="bg-white border rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium ${perf.textColor}`}>{perf.name}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats[perf.id as keyof typeof stats]}</p>
                                </div>
                                {perf.stars > 0 ? (
                                    <div className="flex">{[...Array(perf.stars)].map((_, i) => <Star key={i} className={`w-4 h-4 ${perf.textColor} fill-current`} />)}</div>
                                ) : (
                                    <X className={`w-6 h-6 ${perf.textColor}`} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6">
                    <div className="flex flex-wrap gap-4 sm:gap-6 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Tarih Seçin
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all outline-none"
                            />
                            <button
                                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                                className="mt-2 px-3 py-1.5 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-all"
                            >
                                Bugün
                            </button>
                        </div>

                        <div className="flex-1 min-w-[300px]">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Users className="w-4 h-4" />
                                Sınıf Seçin
                            </label>
                            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                                {[5, 6, 7, 8].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setSelectedGrade(g)}
                                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${selectedGrade === g
                                            ? 'bg-teal-600 text-white shadow-lg scale-105'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {g}. Sınıf
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-3 sm:px-6 py-3 sm:py-4 bg-teal-700 border-b flex flex-col gap-3">
                        <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 text-white">
                                <SessionIcon className="w-5 sm:w-6 h-5 sm:h-6" />
                                <span className="font-semibold text-sm sm:text-lg">{currentSession.name} - {students.length} Öğrenci</span>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1 sm:gap-2 bg-white text-teal-700 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                            >
                                <Save className="w-4 sm:w-5 h-4 sm:h-5" />
                                <span className="hidden sm:inline">{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                                <span className="sm:hidden">{saving ? '...' : 'Kaydet'}</span>
                            </button>
                        </div>
                        {/* Arama */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="🔍 Öğrenci ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 text-sm border border-white/30 bg-white/20 text-white placeholder-white/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="inline-block w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="p-16 text-center">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">Bu sınıfta öğrenci bulunamadı</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {students
                                .filter(s => searchQuery === '' || `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || s.student_number.includes(searchQuery))
                                .map((student, index) => {
                                const studentPerf = performance[student.id];

                                return (
                                    <div
                                        key={student.id}
                                        className="p-3 sm:p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg">
                                                        {student.first_name[0]}{student.last_name[0]}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{student.first_name} {student.last_name}</div>
                                                    <div className="text-xs sm:text-sm text-gray-500">No: {student.student_number}</div>
                                                </div>
                                            </div>

                                            <div className="flex gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                                                {performances.map(perf => {
                                                    const isActive = studentPerf === perf.id;

                                                    return (
                                                        <button
                                                            key={perf.id}
                                                            onClick={() => togglePerformance(student.id, perf.id)}
                                                            className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 sm:flex-initial min-w-[80px] sm:min-w-0 ${isActive
                                                                ? `${perf.color} text-white shadow-lg scale-105`
                                                                : `bg-gray-100 ${perf.textColor} hover:bg-gray-200`
                                                                }`}
                                                        >
                                                            {perf.stars > 0 ? (
                                                                <div className="flex">
                                                                    {[...Array(perf.stars)].map((_, i) => (
                                                                        <Star key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${isActive ? 'fill-white' : 'fill-current'}`} />
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            )}
                                                            <span className="text-xs sm:text-sm whitespace-nowrap">{perf.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
