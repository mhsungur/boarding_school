import { useState } from 'react';
import axios from 'axios';
import { Lock, User, LogIn } from 'lucide-react';
import { API_BASE } from './config';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_BASE}/auth/login`, {
                username,
                password
            });

            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                onLoginSuccess();
            } else {
                setError(res.data.error || 'Giriş başarısız');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Bağlantı hatası. Lütfen tekrar deneyin.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Sol Panel — Form */}
            <div className="flex-1 flex items-center justify-center bg-white p-6 sm:p-12">
                <div className="w-full max-w-md">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-50 rounded-2xl shadow-md mb-4">
                            <img src="/logo.png" alt="Hasbahçe Logo" className="w-20 h-20 object-contain" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Hasbahçe Talebe Takip</h1>
                        <p className="text-gray-500 text-base">Öğrenci Yönetim Platformu</p>
                    </div>

                    {/* Login Form */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">Giriş Yap</h2>
                            <p className="text-gray-500 text-sm">Devam etmek için giriş yapın</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Kullanıcı Adı
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                                        placeholder="Kullanıcı adınızı girin"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Şifre
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                                        placeholder="Şifrenizi girin"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 animate-shake">
                                    <p className="text-red-600 text-sm font-medium text-center">
                                        ❌ {error}
                                    </p>
                                </div>
                            )}

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Giriş yapılıyor...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" />
                                        Giriş Yap
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6 text-center">
                            <p className="text-gray-400 text-xs">
                                © 2025 Hasbahçe Eğitim ve Yardımlaşma Derneği
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sağ Panel — Teal (Sadece Desktop) */}
            <div className="hidden sm:flex w-2/5 bg-teal-800 flex-col items-center justify-center p-12 relative overflow-hidden">
                {/* Geometrik arka plan desen */}
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                                <polygon points="30,5 55,20 55,40 30,55 5,40 5,20" fill="none" stroke="white" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#geo)"/>
                    </svg>
                </div>

                {/* Logo (beyaz) */}
                <div className="relative z-10 text-center px-6 max-w-lg">
                    <div className="mb-10">
                        <img
                            src="/logo.png"
                            alt="Hasbahçe"
                            className="w-64 h-auto object-contain mx-auto brightness-0 invert opacity-95 hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <h2 className="text-4xl font-extrabold text-white tracking-wide mb-4">Hasbahçe</h2>
                    <p className="text-teal-200 text-lg font-medium mb-10">Eğitim ve Yardımlaşma Derneği</p>
                    <div className="w-24 h-0.5 bg-teal-400/60 mx-auto mb-10"></div>
                    <p className="text-teal-50 text-xl italic font-light leading-relaxed">
                        "Bir neslin ihyası; kötülerin imhasıyla değil, yeni neslin eğitim ve terbiyesiyle mümkündür."
                    </p>
                </div>
            </div>

            {/* Shake animasyonu */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
}
