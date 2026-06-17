
import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Sparkles, ChevronRight, Bot, BookOpen } from 'lucide-react';
import { API_BASE } from './config';

interface Subject {
    id: number;
    name: string;
    grade: number;
}

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    grade: number;
    student_number: string;
}





const examTypes = [
    { id: 'yazili_1', name: '1.Y' },
    { id: 'yazili_2', name: '2.Y' },
    { id: 'sozlu', name: 'Söz' },
    { id: 'performans', name: 'Perf' },
];

const terms = [
    { id: 'donem_1', name: '1. Dönem' },
    { id: 'donem_2', name: '2. Dönem' },
];

export default function SchoolPerformancePage() {
    const [selectedGrade, setSelectedGrade] = useState<number>(5);
    const [selectedTerm, setSelectedTerm] = useState<string>('donem_1');
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentExams, setStudentExams] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [aiReport, setAiReport] = useState<string | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    useEffect(() => {
        fetchStudents();
        fetchSubjects();
    }, [selectedGrade]);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentExams(selectedStudent.id);
        }
    }, [selectedStudent, selectedTerm]);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${API_BASE}/students?grade=${selectedGrade}`);
            setStudents(res.data);
        } catch (error) {
            console.error("Error fetching students", error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await axios.get(`${API_BASE}/subjects?grade=${selectedGrade}`);
            setSubjects(res.data);
        } catch (error) {
            console.error("Error fetching subjects", error);
        }
    };

    const fetchStudentExams = async (studentId: number) => {
        setLoading(true);
        try {
            console.log(`Fetching exams for student ${studentId} term ${selectedTerm}`);
            const res = await axios.get(`${API_BASE}/exams?student_id=${studentId}&term=${selectedTerm}`);
            console.log("API Response:", res.data);

            const examsMap: Record<string, number> = {};
            res.data.forEach((exam: any) => {
                const key = `${exam.subject_id}_${exam.exam_type}`;
                examsMap[key] = exam.score;
            });
            console.log("Mapped Exams Keys:", Object.keys(examsMap));
            console.log("Mapped Exams Values:", examsMap);
            setStudentExams(examsMap);
        } catch (error) {
            console.error("Error fetching exams", error);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (subjectId: number, examType: string, score: string) => {
        const numScore = parseFloat(score);
        if (score === '' || (numScore >= 0 && numScore <= 100)) {
            setStudentExams(prev => ({
                ...prev,
                [`${subjectId}_${examType}`]: score === '' ? 0 : numScore
            }));
        }
    };

    const handleSave = async () => {
        if (!selectedStudent) return;

        setSaving(true);
        try {
            // Prepare payload
            const payload = [];
            for (const [key, score] of Object.entries(studentExams)) {
                // Key format: "subjectId_examType" where examType can contain underscores
                // Example: "5_yazili_1" -> subjectId=5, examType=yazili_1
                const parts = key.split('_');
                const subjectId = parts[0];
                const examType = parts.slice(1).join('_'); // Rejoin remaining parts

                payload.push({
                    student_id: selectedStudent.id,
                    subject_id: parseInt(subjectId),
                    exam_type: examType,
                    term: selectedTerm,
                    score: score,
                    exam_date: new Date().toISOString().split('T')[0] // Default to today
                });
            }

            await axios.post(`${API_BASE}/student-exams`, {
                student_id: selectedStudent.id,
                term: selectedTerm,
                exams: payload
            });

            showToast('✅ Notlar başarıyla kaydedildi!', 'success');
            setSelectedStudent(null); // Close modal
        } catch (error) {
            console.error("Error saving", error);
            showToast('❌ Kaydetme sırasında hata oluştu!', 'error');
        } finally {
            setSaving(false);
        }
    };

    const generateAIReport = async () => {
        if (!selectedStudent) return;
        setLoadingReport(true);
        setAiReport(null);
        try {
            const res = await axios.get(`${API_BASE}/student-report/${selectedStudent.id}`);
            setAiReport(res.data.report);
        } catch (error) {
            console.error("Error generating report", error);
            showToast('❌ Rapor oluşturulurken hata oluştu', 'error');
        } finally {
            setLoadingReport(false);
        }
    };

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
                    <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
                        📊 Okul Performansı
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">Öğrenci bazlı not giriş sistemi</p>
                </div>

                {/* Grade Selector */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6">
                    <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center">
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                            {[5, 6, 7, 8].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setSelectedGrade(g)}
                                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${selectedGrade === g
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

                {/* Student List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                        <button
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all text-left group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                                        {student.first_name[0]}{student.last_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                                            {student.first_name} {student.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-500">No: {student.student_number}</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Student Detail Modal */}
                {selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4 animate-fade-in">
                        <div className="bg-white w-full h-full sm:h-auto sm:rounded-3xl shadow-2xl sm:max-w-4xl sm:max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="p-4 sm:p-6 bg-teal-800 text-white flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg sm:text-xl backdrop-blur-md">
                                        {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                                        <p className="text-indigo-100 text-sm sm:text-base">{selectedStudent.grade}. Sınıf • Okul Performans Karnesi</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Toolbar */}
                            <div className="p-3 sm:p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                                    {terms.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTerm(t.id)}
                                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${selectedTerm === t.id
                                                ? 'bg-white text-teal-600 shadow-sm border border-teal-100'
                                                : 'text-gray-500 hover:bg-gray-100'
                                                }`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={generateAIReport}
                                        disabled={loadingReport}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 text-sm sm:text-base"
                                    >
                                        <Bot size={18} />
                                        {loadingReport ? 'Analiz...' : '✨ AI Analizi'}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-teal-600 text-white px-4 sm:px-6 py-2 rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                                    >
                                        <Save size={18} />
                                        {saving ? '...' : 'Kaydet'}
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto p-6">
                                {/* AI Report Section */}
                                {aiReport && (
                                    <div className="mb-8 bg-teal-50 p-6 rounded-2xl border border-teal-100 animate-fade-in">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="text-teal-600" />
                                            <h3 className="font-bold text-lg text-teal-900">Yapay Zeka Analizi</h3>
                                        </div>
                                        <div className="prose prose-teal max-w-none text-gray-700 whitespace-pre-wrap font-medium leading-relaxed">
                                            {aiReport}
                                        </div>
                                    </div>
                                )}

                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-1 overflow-x-auto">
                                        {/* Header Row */}
                                        <div className="grid grid-cols-12 gap-2 sm:gap-4 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-500 border-b mb-2 min-w-[600px]">
                                            <div className="col-span-4">DERS ADI</div>
                                            {examTypes.map(type => (
                                                <div key={type.id} className="col-span-2 text-center">{type.name}</div>
                                            ))}
                                        </div>

                                        {/* Subject Rows */}
                                        <div className="min-w-[600px]">
                                            {subjects.map(subject => (
                                                <div key={subject.id} className="grid grid-cols-12 gap-2 sm:gap-4 items-center px-2 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                                    <div className="col-span-4 font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                                                        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-teal-400 flex-shrink-0" />
                                                        <span className="truncate">{subject.name}</span>
                                                    </div>
                                                    {examTypes.map(type => {
                                                        const score = studentExams[`${subject.id}_${type.id}`];
                                                        return (
                                                            <div key={type.id} className="col-span-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="-"
                                                                    value={score || ''}
                                                                    onChange={(e) => handleScoreChange(subject.id, type.id, e.target.value)}
                                                                    className={`w-full text-center py-1 sm:py-2 rounded-lg border-2 font-bold transition-all outline-none text-sm sm:text-base ${score
                                                                        ? 'border-teal-100 bg-teal-50 text-teal-700 focus:border-teal-500'
                                                                        : 'border-gray-100 bg-white text-gray-900 focus:border-teal-500'
                                                                        }`}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
