import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Users, Calendar, Save, Sparkles } from 'lucide-react';
import { API_BASE } from './config';

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    grade: number;
    student_number: string;
}

export default function BedCheckPage() {
    const [selectedGrade, setSelectedGrade] = useState<number>(5);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<Student[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [checks, setChecks] = useState<Record<number, boolean>>({});
    const [allChecks, setAllChecks] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showOverview, setShowOverview] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    useEffect(() => {
        fetchData();
        fetchOverviewData();
    }, [selectedGrade, selectedDate]);

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

            const allChecksRes = await axios.get(`${API_BASE}/bed-checks?date=${selectedDate}`);
            const allChecksMap: Record<number, boolean> = {};
            allChecksRes.data.forEach((c: any) => {
                allChecksMap[c.student_id] = c.is_tidy;
            });
            setAllChecks(allChecksMap);
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

            const checkRes = await axios.get(`${API_BASE}/bed-checks?date=${selectedDate}`);
            const checkMap: Record<number, boolean> = {};

            const studentIds = new Set(fetchedStudents.map((s: Student) => s.id));
            checkRes.data.forEach((c: any) => {
                if (studentIds.has(c.student_id)) {
                    checkMap[c.student_id] = c.is_tidy;
                }
            });
            setChecks(checkMap);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCheck = (studentId: number, isTidy: boolean) => {
        setChecks(prev => ({
            ...prev,
            [studentId]: isTidy
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = Object.entries(checks).map(([studentId, isTidy]) => ({
                student_id: parseInt(studentId),
                is_tidy: isTidy
            }));

            await axios.post(`${API_BASE}/bed-checks?bed_date=${selectedDate}`, payload);
            showToast('✅ Kayıtlar başarıyla kaydedildi!', 'success');
            fetchOverviewData(); // Refresh overview stats
        } catch (error) {
            console.error("Error saving", error);
            showToast('❌ Kaydetme sırasında hata oluştu!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const stats = {
        tidy: Object.entries(checks).filter(([id, isTidy]) =>
            students.some(s => s.id === parseInt(id)) && isTidy === true
        ).length,
        untidy: Object.entries(checks).filter(([id, isTidy]) =>
            students.some(s => s.id === parseInt(id)) && isTidy === false
        ).length,
        unchecked: students.filter(s => checks[s.id] === undefined).length
    };

    const getGradeStats = (grade: number) => {
        const gradeStudents = allStudents.filter(s => s.grade === grade);
        const tidy = gradeStudents.filter(s => allChecks[s.id] === true).length;
        const untidy = gradeStudents.filter(s => allChecks[s.id] === false).length;
        const unchecked = gradeStudents.filter(s => allChecks[s.id] === undefined).length;
        return { total: gradeStudents.length, tidy, untidy, unchecked };
    };

    return (
        <div className="min-h-screen p-6">
            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-6 right-6 z-50 animate-slide-in">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-2 ${toast.type === 'success'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400'
                        : 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400'
                        }`}>
                        {toast.type === 'success' ? (
                            <Check className="w-6 h-6 text-white" />
                        ) : (
                            <X className="w-6 h-6 text-white" />
                        )}
                        <span className="text-white font-semibold">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full mb-4">
                        <Sparkles className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-medium text-teal-800">Hasbahçe Talebe Takip Sistemi</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Yatak Düzeni Kontrolü
                    </h1>
                    <p className="text-gray-600">Öğrencilerinizin yatak düzenini kolayca takip edin</p>
                </div>

                {/* Overall Statistics - All Grades */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowOverview(!showOverview)}
                        className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all mb-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-teal-600" />
                            <span className="font-semibold text-gray-900">Tüm Sınıflar - Genel Durum</span>
                        </div>
                        <span className="text-gray-500">{showOverview ? '▼' : '▶'}</span>
                    </button>

                    {showOverview && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[5, 6, 7, 8].map(grade => {
                                const gradeStats = getGradeStats(grade);
                                const percentage = gradeStats.total > 0
                                    ? Math.round((gradeStats.tidy / gradeStats.total) * 100)
                                    : 0;

                                return (
                                    <div key={grade} className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">{grade}. Sınıf</h3>
                                            <div className="text-2xl font-bold text-teal-600">{gradeStats.total}</div>
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <Check className="w-4 h-4" />
                                                    Düzenli
                                                </span>
                                                <span className="font-semibold">{gradeStats.tidy}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1 text-red-600">
                                                    <X className="w-4 h-4" />
                                                    Düzensiz
                                                </span>
                                                <span className="font-semibold">{gradeStats.untidy}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1 text-blue-600">
                                                    <Users className="w-4 h-4" />
                                                    Kontrol Edilmedi
                                                </span>
                                                <span className="font-semibold">{gradeStats.unchecked}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                <span>Düzen Oranı</span>
                                                <span className="font-semibold">{percentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Düzenli</p>
                                <p className="text-2xl font-bold text-green-700">{stats.tidy}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600">Düzensiz</p>
                                <p className="text-2xl font-bold text-red-700">{stats.untidy}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <X className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Kontrol Edilmedi</p>
                                                <p className="text-2xl font-bold text-gray-600">{stats.unchecked}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Users className="w-6 h-6 text-gray-500" />
                                            </div>
                                        </div>
                                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <div className="flex flex-wrap gap-6 items-end">
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
                            <div className="flex gap-2">
                                {[5, 6, 7, 8].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setSelectedGrade(g)}
                                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${selectedGrade === g
                                            ? 'bg-teal-600 text-white shadow-lg scale-105'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
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
                            <div className="flex items-center gap-2">
                                <Users className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                                <span className="font-semibold text-white text-sm sm:text-base">{students.length} Öğrenci</span>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1 sm:gap-2 bg-teal-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
                                const isTidy = checks[student.id];

                                return (
                                    <div
                                        key={student.id}
                                        className={`p-3 sm:p-5 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-teal-50/40`}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
                                            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-10 sm:w-14 h-10 sm:h-14 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                                                        {student.first_name[0]}{student.last_name[0]}
                                                    </div>
                                                    {isTidy !== undefined && (
                                                        <div className={`absolute -bottom-1 -right-1 w-5 sm:w-6 h-5 sm:h-6 rounded-full border-2 border-white flex items-center justify-center ${isTidy ? 'bg-green-500' : 'bg-red-500'
                                                            }`}>
                                                            {isTidy ? <Check className="w-2 sm:w-3 h-2 sm:h-3 text-white" /> : <X className="w-2 sm:w-3 h-2 sm:h-3 text-white" />}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-gray-900 text-sm sm:text-lg truncate">{student.first_name} {student.last_name}</div>
                                                    <div className="text-xs sm:text-sm text-gray-500">Okul No: {student.student_number}</div>
                                                </div>
                                            </div>

                                            <div className="flex gap-1 sm:gap-3 w-full sm:w-auto">
                                                <button
                                                    onClick={() => toggleCheck(student.id, true)}
                                                    className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-base font-semibold transition-all duration-200 border-2 flex-1 sm:flex-initial ${isTidy === true
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 text-white shadow-lg scale-105'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
                                                        }`}
                                                >
                                                    <Check className="w-4 sm:w-5 h-4 sm:h-5" />
                                                    <span>Düzenli</span>
                                                </button>
                                                <button
                                                    onClick={() => toggleCheck(student.id, false)}
                                                    className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-base font-semibold transition-all duration-200 border-2 flex-1 sm:flex-initial ${isTidy === false
                                                        ? 'bg-gradient-to-r from-red-500 to-rose-600 border-red-500 text-white shadow-lg scale-105'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                                                        }`}
                                                >
                                                    <X className="w-4 sm:w-5 h-4 sm:h-5" />
                                                    <span>Düzensiz</span>
                                                </button>
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
