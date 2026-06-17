import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sun, Sunset, Moon, Check, Clock, X, HeartPulse, Save, Calendar, Users, Sparkles } from 'lucide-react';
import { API_BASE } from './config';

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    grade: number;
    student_number: string;
}

const prayerTimes = [
    { id: 'sabah', name: 'Sabah', icon: Sun, gradient: 'from-orange-400 to-yellow-500' },
    { id: 'ogle', name: 'Öğle', icon: Sun, gradient: 'from-yellow-400 to-orange-400' },
    { id: 'ikindi', name: 'İkindi', icon: Sun, gradient: 'from-orange-500 to-red-400' },
    { id: 'aksam', name: 'Akşam', icon: Sunset, gradient: 'from-purple-500 to-pink-500' },
    { id: 'yatsi', name: 'Yatsı', icon: Moon, gradient: 'from-indigo-600 to-purple-600' },
];

const statuses = [
    { id: 'geldi', name: 'Geldi', icon: Check, color: 'bg-green-500 hover:bg-green-600', activeColor: 'from-green-500 to-emerald-600' },
    { id: 'gec_kaldi', name: 'Geç Kaldı', icon: Clock, color: 'bg-yellow-500 hover:bg-yellow-600', activeColor: 'from-yellow-500 to-orange-500' },
    { id: 'gelmedi', name: 'Gelmedi', icon: X, color: 'bg-red-500 hover:bg-red-600', activeColor: 'from-red-500 to-rose-600' },
    { id: 'mazeret', name: 'Mazeret', icon: HeartPulse, color: 'bg-blue-400 hover:bg-blue-500', activeColor: 'from-blue-400 to-indigo-500' },
];

export default function PrayerTrackingPage() {
    const [selectedGrade, setSelectedGrade] = useState<number>(5);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedPrayer, setSelectedPrayer] = useState<string>('sabah');
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<number, string>>({});
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allAttendance, setAllAttendance] = useState<Record<number, string>>({});
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
    }, [selectedGrade, selectedDate, selectedPrayer]);

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

            const allAttendanceRes = await axios.get(`${API_BASE}/prayer-attendance?date=${selectedDate}&prayer=${selectedPrayer}`);
            const allAttendanceMap: Record<number, string> = {};
            allAttendanceRes.data.forEach((a: any) => {
                allAttendanceMap[a.student_id] = a.status;
            });
            setAllAttendance(allAttendanceMap);
        } catch (error) {
            console.error("Error fetching overview data", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // If selectedGrade is 0, fetch all students (or remove grade filter)
            const url = selectedGrade === 0
                ? `${API_BASE}/students`
                : `${API_BASE}/students?grade=${selectedGrade}`;

            const studentRes = await axios.get(url);
            let fetchedStudents = studentRes.data;

            // Sort by grade then name for bulk view
            if (selectedGrade === 0) {
                fetchedStudents.sort((a: Student, b: Student) => {
                    if (a.grade !== b.grade) return a.grade - b.grade;
                    return a.first_name.localeCompare(b.first_name);
                });
            }

            setStudents(fetchedStudents);

            const attendanceRes = await axios.get(`${API_BASE}/prayer-attendance?date=${selectedDate}&prayer=${selectedPrayer}`);
            const attendanceMap: Record<number, string> = {};

            const studentIds = new Set(fetchedStudents.map((s: Student) => s.id));
            attendanceRes.data.forEach((a: any) => {
                if (studentIds.has(a.student_id)) {
                    attendanceMap[a.student_id] = a.status;
                }
            });
            setAttendance(attendanceMap);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (studentId: number, status: string) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = Object.entries(attendance).map(([studentId, status]) => ({
                student_id: parseInt(studentId),
                status: status
            }));

            await axios.post(`${API_BASE}/prayer-attendance?att_date=${selectedDate}&prayer=${selectedPrayer}`, payload);
            showToast('✅ Devamsızlık kayıtları başarıyla kaydedildi!', 'success');
            fetchOverviewData(); // Refresh overview after save
        } catch (error) {
            console.error("Error saving", error);
            showToast('❌ Kaydetme sırasında hata oluştu!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const stats = {
        geldi: Object.values(attendance).filter(s => s === 'geldi').length,
        gec_kaldi: Object.values(attendance).filter(s => s === 'gec_kaldi').length,
        gelmedi: Object.values(attendance).filter(s => s === 'gelmedi').length,
        mazeret: Object.values(attendance).filter(s => s === 'mazeret').length,
        unchecked: students.filter(s => !attendance[s.id]).length
    };

    const getGradeStats = (grade: number) => {
        const gradeStudents = allStudents.filter(s => s.grade === grade);
        const geldi = gradeStudents.filter(s => allAttendance[s.id] === 'geldi').length;
        const gec_kaldi = gradeStudents.filter(s => allAttendance[s.id] === 'gec_kaldi').length;
        const gelmedi = gradeStudents.filter(s => allAttendance[s.id] === 'gelmedi').length;
        const mazeret = gradeStudents.filter(s => allAttendance[s.id] === 'mazeret').length;
        const unchecked = gradeStudents.filter(s => !allAttendance[s.id]).length;
        return { total: gradeStudents.length, geldi, gec_kaldi, gelmedi, mazeret, unchecked };
    };

    const currentPrayer = prayerTimes.find(p => p.id === selectedPrayer) || prayerTimes[0];

    return (
        <div className="min-h-screen p-3 sm:p-6">
            {toast.show && (
                <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
                    <div className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-2xl ${toast.type === 'success'
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
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full mb-4">
                        <Sparkles className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-medium text-teal-800">Hasbahçe Talebe Takip Sistemi</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
                        📿 Namaz Devamsızlık Takibi
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">Öğrencilerinizin cemaat namazlarını kolayca takip edin</p>
                </div>

                {/* Overall Statistics - All Grades */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowOverview(!showOverview)}
                        className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all mb-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-teal-600" />
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">Tüm Sınıflar - {currentPrayer.name} Namazı Genel Durum</span>
                        </div>
                        <span className="text-gray-500">{showOverview ? '▼' : '▶'}</span>
                    </button>

                    {showOverview && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[5, 6, 7, 8].map(grade => {
                                const gradeStats = getGradeStats(grade);

                                // Weighted Prayer Scoring: geldi=100%, gec_kaldi=70%, gelmedi=0%, mazeret excluded
                                const totalForCalc = gradeStats.total - gradeStats.unchecked - gradeStats.mazeret;
                                const attendanceRate = totalForCalc > 0
                                    ? Math.round((gradeStats.geldi * 100 + gradeStats.gec_kaldi * 70) / totalForCalc)
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
                                                    Geldi
                                                </span>
                                                <span className="font-semibold">{gradeStats.geldi}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1 text-yellow-600">
                                                    <Clock className="w-4 h-4" />
                                                    Geç Kaldı
                                                </span>
                                                <span className="font-semibold">{gradeStats.gec_kaldi}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1 text-red-600">
                                                    <X className="w-4 h-4" />
                                                    Gelmedi
                                                </span>
                                                <span className="font-semibold">{gradeStats.gelmedi}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1 text-blue-600">
                                                    <HeartPulse className="w-4 h-4" />
                                                    Mazeret
                                                </span>
                                                <span className="font-semibold">{gradeStats.mazeret}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1 text-gray-600">
                                                    <Users className="w-4 h-4" />
                                                    İşaretlenmedi
                                                </span>
                                                <span className="font-semibold">{gradeStats.unchecked}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                <span>Katılım Oranı</span>
                                                <span className="font-semibold">{attendanceRate}%</span>
                                            </div>
                                            <div className="bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${attendanceRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Prayer Time Tabs */}
                <div className="mb-6 overflow-x-auto pb-2">
                    <div className="flex gap-2 sm:gap-3 min-w-max">
                        {prayerTimes.map(prayer => {
                            const Icon = prayer.icon;
                            return (
                                <button
                                    key={prayer.id}
                                    onClick={() => setSelectedPrayer(prayer.id)}
                                    className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 ${selectedPrayer === prayer.id
                                        ? `bg-gradient-to-r ${prayer.gradient} text-white shadow-lg scale-105`
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="text-sm sm:text-base">{prayer.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-green-600">Geldi</p>
                                <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.geldi}</p>
                            </div>
                            <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-yellow-600">Geç Kaldı</p>
                                <p className="text-xl sm:text-2xl font-bold text-yellow-700">{stats.gec_kaldi}</p>
                            </div>
                            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-red-600">Gelmedi</p>
                                <p className="text-xl sm:text-2xl font-bold text-red-700">{stats.gelmedi}</p>
                            </div>
                            <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-blue-600">Mazeret</p>
                                <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.mazeret}</p>
                            </div>
                            <HeartPulse className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">İşaretlenmedi</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-700">{stats.unchecked}</p>
                            </div>
                            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                        </div>
                    </div>
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
                            <div className="bg-gray-100 p-1 rounded-xl flex gap-1 overflow-x-auto">
                                <button
                                    onClick={() => setSelectedGrade(0)}
                                    className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedGrade === 0
                                        ? 'bg-white text-teal-700 shadow-md ring-1 ring-black/5'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                        }`}
                                >
                                    Tüm Liste
                                </button>
                                {[5, 6, 7, 8].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setSelectedGrade(g)}
                                        className={`flex-1 min-w-[60px] px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedGrade === g
                                            ? 'bg-white text-teal-700 shadow-md ring-1 ring-black/5'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
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
                    <div className={`px-3 sm:px-6 py-3 sm:py-4 bg-teal-700 border-b flex flex-col gap-3`}>
                        <div className="flex justify-between items-center gap-2 text-white">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <currentPrayer.icon className="w-5 sm:w-6 h-5 sm:h-6" />
                                <span className="font-semibold text-sm sm:text-lg">
                                    {currentPrayer.name} Namazı - {students.length} Öğrenci
                                    {selectedGrade === 0 && <span className="text-white/80 text-sm ml-2 font-normal">(Toplu Liste)</span>}
                                </span>
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
                                const studentStatus = attendance[student.id];
                                const showGradeHeader = selectedGrade === 0 && (index === 0 || students[index - 1].grade !== student.grade);

                                return (
                                    <div key={student.id}>
                                        {showGradeHeader && (
                                            <div className="bg-gray-50/80 px-4 py-2 border-y border-gray-200 font-bold text-gray-500 text-sm tracking-wide uppercase sticky top-0 backdrop-blur-sm z-10">
                                                {student.grade}. Sınıf Öğrencileri
                                            </div>
                                        )}
                                        <div
                                            className="p-3 sm:p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div className="relative flex-shrink-0">
                                                        <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg bg-gradient-to-br ${student.grade === 5 ? 'from-blue-400 to-indigo-500' :
                                                                student.grade === 6 ? 'from-green-400 to-emerald-500' :
                                                                    student.grade === 7 ? 'from-orange-400 to-red-500' :
                                                                        'from-purple-400 to-pink-500'
                                                            }`}>
                                                            {student.first_name[0]}{student.last_name[0]}
                                                        </div>
                                                        {selectedGrade === 0 && (
                                                            <div className="absolute -bottom-1 -right-1 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded-full border border-white">
                                                                {student.grade}.S
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm sm:text-base">{student.first_name} {student.last_name}</div>
                                                        <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                                                            <span>No: {student.student_number}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                                    {statuses.map(status => {
                                                        const StatusIcon = status.icon;
                                                        const isActive = studentStatus === status.id;

                                                        return (
                                                            <button
                                                                key={status.id}
                                                                onClick={() => toggleStatus(student.id, status.id)}
                                                                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 border flex-1 sm:flex-initial min-w-[80px] sm:min-w-0 ${isActive
                                                                    ? `bg-gradient-to-r ${status.activeColor} border-transparent text-white shadow-lg scale-105`
                                                                    : `${status.color} border-transparent text-white opacity-60 hover:opacity-100`
                                                                    }`}
                                                            >
                                                                <StatusIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                                                                <span className="text-xs sm:text-sm whitespace-nowrap">{status.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
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
