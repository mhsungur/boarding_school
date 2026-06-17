import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE } from '../config';
import { Calendar, Volume2, Quote, Maximize, Minimize } from 'lucide-react';

interface SliderItem {
    id: number;
    title: string;
    image: string | null;
    video: string | null;
    display_duration: number;
    order: number;
}

interface Announcement {
    id: number;
    title: string;
    content: string;
    priority: 'normal' | 'high';
    created_at: string;
}

interface DailyContent {
    content_type: 'hadith' | 'verse' | 'word';
    text: string;
    source: string | null;
    date_to_show: string;
}

interface DailyStats {
    general: {
        total_students: number;
        data_completion: number;
        completion_percentage: number;
    };
    prayer: {
        rate: number;
        geldi: number;
        gec_kaldi: number;
    };
    bed: {
        rate: number;
        tidy: number;
        total: number;
    };
    study: {
        rate: number;
        mukemmel: number;
        iyi: number;
    };
    overall_rate: number;
}

interface GradeStats {
    bed: number;
    prayer: number;
    study: number;
    overall: number;
    student_count: number;
}

interface DashboardContent {
    slider_items: SliderItem[];
    announcements: Announcement[];
    daily_content: DailyContent[];
    stats?: DailyStats;
    grade_stats?: Record<string, GradeStats>;
}

const DigitalDashboardPage = () => {
    const [content, setContent] = useState<DashboardContent | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentSlide, setCurrentSlide] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Toggle Fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    // Listen for fullscreen changes (e.g. if user presses Esc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Clock ticker
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Content Polling (every 5 minutes)
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await axios.get(`${API_BASE}/dashboard/content`);
                setContent(response.data);
                setError(null);
            } catch (error: any) {
                console.error("Failed to fetch dashboard content", error);
                setError(error.message || "Veri çekilemedi");
            }
        };

        fetchContent();
        const poll = setInterval(fetchContent, 5 * 60 * 1000);
        return () => clearInterval(poll);
    }, []);

    // Slider Logic
    useEffect(() => {
        if (!content || content.slider_items.length === 0) return;

        const item = content.slider_items[currentSlide];
        const duration = item.display_duration * 1000;

        const sliderTimer = setTimeout(() => {
            setCurrentSlide((prev) => (prev + 1) % content.slider_items.length);
        }, duration);

        return () => clearTimeout(sliderTimer);
    }, [currentSlide, content]);


    if (!content) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center">
                <div className="text-2xl animate-pulse mb-4">Pano Yükleniyor...</div>
                {error && (
                    <div className="bg-red-900/50 border border-red-500 rounded p-4 text-red-200 max-w-lg">
                        <p className="font-bold">Hata Oluştu:</p>
                        <p>{error}</p>
                        <p className="text-sm mt-2 text-gray-400">Sunucunun (Backend) çalıştığından emin olun.</p>
                    </div>
                )}
            </div>
        );
    }

    const activeSlide = content.slider_items[currentSlide];
    const todaysWisdom = content.daily_content[0];

    return (
        <div className="min-h-screen bg-gray-950 text-white overflow-hidden flex flex-col font-sans">
            {/* HERDER */}
            <header className="h-20 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8 shadow-lg z-10">
                <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Logo" className="h-12 w-12 object-contain bg-white rounded-lg p-1" />
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                            HASBAHÇE
                        </h1>
                        <p className="text-sm text-gray-400">Talebe Takip Platformu</p>
                    </div>
                </div>

                {/* Center: Scrollling Announcements */}
                <div className="flex-1 mx-12 h-12 bg-gray-800 rounded-lg overflow-hidden flex items-center px-4 relative">
                    <Volume2 className="text-indigo-400 mr-3 animate-pulse" size={20} />
                    <div className="flex-1 overflow-hidden relative h-full flex items-center">
                        <motion.div
                            className="whitespace-nowrap absolute"
                            animate={{ x: [1000, -1000] }}
                            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                        >
                            {content.announcements.map((ann) => (
                                <span key={ann.id} className={`mx-8 text-lg font-medium ${ann.priority === 'high' ? 'text-red-400' : 'text-gray-200'}`}>
                                    📢 {ann.title}: {ann.content}
                                </span>
                            ))}
                            {content.announcements.length === 0 && <span className="text-gray-500">Şu an aktif duyuru bulunmamaktadır.</span>}
                        </motion.div>
                    </div>
                </div>

                <div className="text-right flex items-center gap-6">
                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
                    >
                        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                    </button>

                    <div>
                        <div className="text-3xl font-mono font-bold text-white tracking-widest">
                            {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center justify-end gap-1">
                            <Calendar size={14} />
                            {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT GRID */}
            <main className="flex-1 p-6 grid grid-cols-12 gap-6 h-[calc(100vh-5rem)]">

                {/* LEFT: SLIDER (8 cols) */}
                <div className="col-span-8 bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-gray-800">
                    <AnimatePresence mode='wait'>
                        {activeSlide && (
                            <motion.div
                                key={activeSlide.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1 }}
                                className="absolute inset-0"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {activeSlide.image ? (
                                    <img
                                        src={activeSlide.image}
                                        alt={activeSlide.title}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            width: 'auto',
                                            height: 'auto'
                                        }}
                                    />
                                ) : activeSlide.video ? (
                                    <video
                                        src={activeSlide.video}
                                        autoPlay
                                        muted
                                        loop
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            width: 'auto',
                                            height: 'auto'
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                                        Görsel Yok
                                    </div>
                                )}

                                {/* Overlay Title */}
                                {activeSlide.title && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                                        <h2 className="text-4xl font-bold text-white drop-shadow-md">{activeSlide.title}</h2>
                                    </div>
                                )}
                            </motion.div>
                        )}
                        {!activeSlide && (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Slider içeriği bulunamadı.
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* RIGHT: WIDGETS (4 cols) */}
                <div className="col-span-4 flex flex-col gap-6">

                    {/* 1. Daily Wisdom (Hadis/Ayet) */}
                    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-6 flex-1 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Quote size={120} />
                        </div>
                        <h3 className="text-indigo-300 font-semibold mb-4 uppercase tracking-wider flex items-center gap-2">
                            {todaysWisdom ? (todaysWisdom.content_type === 'verse' ? 'Günün Ayeti' : todaysWisdom.content_type === 'hadith' ? 'Haftanın Hadisi' : 'Günün Sözü') : 'Günün Sözü'}
                        </h3>
                        {todaysWisdom ? (
                            <div className="relative z-10">
                                <p className="text-2xl font-serif leading-relaxed text-gray-100 italic">
                                    "{todaysWisdom.text}"
                                </p>
                                {todaysWisdom.source && (
                                    <p className="mt-4 text-right text-indigo-400 font-semibold">— {todaysWisdom.source}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400">Bugün için içerik girilmemiş.</p>
                        )}
                    </div>

                    {/* 2. Grade Comparison (Replaces Prayer Times) */}
                    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 flex-1 flex flex-col">
                        <h3 className="text-gray-300 font-bold mb-4 uppercase text-lg flex items-center gap-2 tracking-wide">
                            📊 Sınıf Karşılaştırma (Genel)
                        </h3>
                        <div className="flex-1 flex flex-col justify-center gap-4">
                            {content.grade_stats && Object.keys(content.grade_stats).length > 0 ? (
                                Object.entries(content.grade_stats).map(([grade, stats]) => (
                                    <div key={grade} className="space-y-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-300 font-medium">{grade}. Sınıf</span>
                                            <span className={`font-bold ${stats.overall >= 80 ? 'text-emerald-400' :
                                                stats.overall >= 60 ? 'text-yellow-400' : 'text-red-400'
                                                }`}>%{stats.overall}</span>
                                        </div>
                                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.overall}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full rounded-full ${stats.overall >= 80 ? 'bg-emerald-500' :
                                                    stats.overall >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 text-center text-sm py-4">Veri bulunamadı.</div>
                            )}
                        </div>
                    </div>

                    {/* 3. Daily Summary Stats (Replacing simple stats) */}
                    {content.stats && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-gray-400 font-semibold uppercase text-sm pl-1">Günün Özeti</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Namaz */}
                                <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Namaz
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">%{content.stats.prayer.rate}</div>
                                    <div className="text-xs text-gray-400">
                                        {content.stats.prayer.geldi} geldi, {content.stats.prayer.gec_kaldi} geç
                                    </div>
                                </div>

                                {/* Yatak */}
                                <div className="bg-rose-900/40 border border-rose-500/30 rounded-xl p-4 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-rose-400 text-sm font-semibold flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-rose-500"></div> Yatak
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">%{content.stats.bed.rate}</div>
                                    <div className="text-xs text-gray-400">
                                        {content.stats.bed.tidy}/{content.stats.bed.total} düzenli
                                    </div>
                                </div>

                                {/* Etüt */}
                                <div className="bg-amber-900/40 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-amber-400 text-sm font-semibold flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div> Etüt
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">%{content.stats.study.rate}</div>
                                    <div className="text-xs text-gray-400">
                                        {content.stats.study.mukemmel} mükemmel, {content.stats.study.iyi} iyi
                                    </div>
                                </div>

                                {/* Genel */}
                                <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-blue-400 text-sm font-semibold flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Genel
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">%{content.stats.overall_rate}</div>
                                    <div className="text-xs text-gray-400">
                                        {content.stats.general.data_completion}/{content.stats.general.total_students} veri
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default DigitalDashboardPage;
