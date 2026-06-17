import { useState, useEffect } from 'react'
import axios from 'axios'
import './index.css'
import BedCheckPage from './BedCheckPage'
import PrayerTrackingPage from './PrayerTrackingPage'
import StudyPerformancePage from './StudyPerformancePage'
import SchoolPerformancePage from './SchoolPerformancePage'
import AnalyticsPage from './AnalyticsPage'
import LoginPage from './LoginPage'
import DailySummaryCard from './DailySummaryCard'
import DigitalDashboardPage from './pages/DigitalDashboardPage'
import { LogOut } from 'lucide-react'
import { API_BASE } from './config'

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'bed' | 'prayer' | 'study' | 'school' | 'analytics'>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log('Checking auth status with token...');
      const res = await axios.get(`${API_BASE}/auth/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Auth status response:', res.data);
      if (res.data.authenticated) {
        setIsAuthenticated(true);
        setUsername(res.data.username);
        // Set default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // If token is invalid, clear it
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    checkAuthStatus();
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        await axios.post(`${API_BASE}/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUsername('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-800">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Special Route for Digital Dashboard (No Auth Required for View Only? Or Auth Required?)
  // For now, let's assume it requires Auth or we can make it public. The user said "Tek şifre tek sistem", so probably auth.
  // But usually dashboards on TVs run unattended.
  // Let's keep it under Auth for now, or check window.location.pathname.

  const path = window.location.pathname;
  if (path === '/digital-dashboard') {
    return <DigitalDashboardPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-teal-50">
      {/* Modern Navigation Header */}
      <nav className="bg-teal-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5">
          {/* Top Row: Logo and Title */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white p-1 sm:p-2 rounded-xl sm:rounded-2xl shadow-xl">
                <img src="/logo.png" alt="Hasbahçe Logo" className="h-12 w-12 sm:h-20 sm:w-20 object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Hasbahçe Talebe Takip</h1>
                <p className="text-white/80 text-xs sm:text-sm font-medium">Öğrenci Yönetim Platformu</p>
              </div>
            </div>
            {/* User Info & Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-xl border border-white/20">
                <div className="text-white text-xs sm:text-sm text-right">
                  <div className="font-semibold">{username}</div>
                  <div className="text-white/70 text-xs">Hoş Geldiniz</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-1 sm:gap-2 text-white font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Navigation Buttons */}
          <div className="flex gap-1 sm:gap-3 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`group relative px-2 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${currentPage === 'dashboard'
                ? 'bg-white text-teal-700 shadow-2xl scale-105'
                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-xl">📊</span>
                <span className="text-xs sm:text-sm"><span className="hidden sm:inline">Ana Sayfa</span><span className="sm:hidden">Ana</span></span>
              </div>
              {currentPage === 'dashboard' && (
                <div className="hidden sm:block absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-teal-500 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setCurrentPage('bed')}
              className={`group relative px-2 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${currentPage === 'bed'
                ? 'bg-white text-teal-700 shadow-2xl scale-105'
                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-xl">🛏️</span>
                <span className="text-xs sm:text-sm"><span className="hidden sm:inline">Yatak Düzeni</span><span className="sm:hidden">Yatak</span></span>
              </div>
              {currentPage === 'bed' && (
                <div className="hidden sm:block absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-teal-500 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setCurrentPage('prayer')}
              className={`group relative px-2 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${currentPage === 'prayer'
                ? 'bg-white text-teal-700 shadow-2xl scale-105'
                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-xl">📿</span>
                <span className="text-xs sm:text-sm"><span className="hidden sm:inline">Namaz Takibi</span><span className="sm:hidden">Namaz</span></span>
              </div>
              {currentPage === 'prayer' && (
                <div className="hidden sm:block absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-teal-500 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setCurrentPage('study')}
              className={`group relative px-2 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${currentPage === 'study'
                ? 'bg-white text-teal-700 shadow-2xl scale-105'
                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-xl">📚</span>
                <span className="text-xs sm:text-sm"><span className="hidden sm:inline">Etüt & Ders</span><span className="sm:hidden">Etüt</span></span>
              </div>
              {currentPage === 'study' && (
                <div className="hidden sm:block absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-teal-500 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setCurrentPage('school')}
              className={`group relative px-2 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${currentPage === 'school'
                ? 'bg-white text-teal-700 shadow-2xl scale-105'
                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-xl">📊</span>
                <span className="text-xs sm:text-sm"><span className="hidden sm:inline">Okul Performansı</span><span className="sm:hidden">Okul</span></span>
              </div>
              {currentPage === 'school' && (
                <div className="hidden sm:block absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-teal-500 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setCurrentPage('analytics')}
              className={`group relative px-2 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${currentPage === 'analytics'
                ? 'bg-white text-teal-700 shadow-2xl scale-105'
                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-xl">📈</span>
                <span className="text-xs sm:text-sm"><span className="hidden sm:inline">Analiz Paneli</span><span className="sm:hidden">Analiz</span></span>
              </div>
              {currentPage === 'analytics' && (
                <div className="hidden sm:block absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-teal-500 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => window.location.href = '/digital-dashboard'}
              className="group relative px-2 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-xl">📺</span>
                <span className="text-xs sm:text-sm"><span className="hidden sm:inline">Dijital Pano</span><span className="sm:hidden">Pano</span></span>
              </div>
            </button>
          </div>
        </div >
      </nav >

      {/* Page Content */}
      {
        currentPage === 'dashboard' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <DailySummaryCard />
          </div>
        ) : currentPage === 'bed' ? <BedCheckPage /> :
          currentPage === 'prayer' ? <PrayerTrackingPage /> :
            currentPage === 'study' ? <StudyPerformancePage /> :
              currentPage === 'school' ? <SchoolPerformancePage /> :
                <AnalyticsPage />
      }
    </div >
  )
}

export default App
