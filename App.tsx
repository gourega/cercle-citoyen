import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { 
  Home, Map, Sparkles, MessageSquare, User as UserIcon, 
  PlusCircle, X, Gavel, LayoutGrid, Lightbulb, 
  ShieldCheck, Video, Heart, Globe, Settings, LogOut, Bell
} from 'lucide-react';

// Pages & Components
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import ActionMap from './pages/ActionMap';
import LiveAssembly from './pages/LiveAssembly';
import IdeaBankPage from './pages/IdeaBankPage';
import GovernancePage from './pages/GovernancePage';
import ResourceExchange from './pages/ResourceExchange';
import SentinelPage from './pages/SentinelPage';
import ImpactStudio from './pages/ImpactStudio';
import GriotStudio from './pages/GriotStudio';
import CirclesDiscoveryPage from './pages/CirclesDiscoveryPage';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ManifestoPage from './pages/ManifestoPage';
import WelcomePage from './pages/WelcomePage';
import CirclePage from './pages/CirclePage';
import AdminDashboard from './pages/AdminDashboard';
import ChatPage from './pages/ChatPage';

import { User, Role, UserCategory } from './types';
import GuardianAssistant from './components/GuardianAssistant';
import Footer from './components/Footer';

// --- Toast Context Logic ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

// --- App Root Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Persistence simulée
  useEffect(() => {
    const saved = localStorage.getItem('cercle_user');
    if (saved) setUser(JSON.parse(saved));
    setIsAuthLoading(false);

    const splash = document.getElementById('splash-screen');
    if (splash) splash.style.display = 'none';
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('cercle_user', JSON.stringify(u));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('cercle_user');
  };

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  if (isAuthLoading) return null;

  return (
    <ToastContext.Provider value={{ addToast }}>
      <Router>
        <div className="min-h-screen bg-[#0a0c10] text-white selection:bg-blue-600">
          
          {!user ? (
            <Routes>
              <Route path="/" element={<LandingPage onLogin={login} />} />
              <Route path="/manifesto" element={<ManifestoPage />} />
              <Route path="/auth" element={<AuthPage onLogin={login} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <>
              <Navigation user={user} />
              
              <main className="max-w-6xl mx-auto pb-32 pt-6 md:pt-28 md:pb-20">
                <Routes>
                  <Route path="/" element={<FeedPage user={user} />} />
                  <Route path="/feed" element={<FeedPage user={user} />} />
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/map" element={<ActionMap />} />
                  <Route path="/live" element={<LiveAssembly />} />
                  <Route path="/profile" element={<ProfilePage currentUser={user} onLogout={logout} />} />
                  <Route path="/profile/:id" element={<ProfilePage currentUser={user} onLogout={logout} />} />
                  <Route path="/ideas" element={<IdeaBankPage />} />
                  <Route path="/governance" element={<GovernancePage user={user} />} />
                  <Route path="/market" element={<ResourceExchange user={user} />} />
                  <Route path="/sentinel" element={<SentinelPage user={user} />} />
                  <Route path="/impact-studio" element={<ImpactStudio user={user} />} />
                  <Route path="/griot-studio" element={<GriotStudio />} />
                  <Route path="/circles" element={<CirclesDiscoveryPage />} />
                  <Route path="/circle/:type" element={<CirclePage user={user} />} />
                  <Route path="/admin" element={user.role === Role.SUPER_ADMIN ? <AdminDashboard /> : <Navigate to="/" />} />
                  <Route path="/messages" element={<ChatPage user={user} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              <GuardianAssistant />
              <div className="hidden md:block">
                <Footer />
              </div>

              {/* Toast UI */}
              <div className="fixed top-6 right-6 z-[9999] space-y-3 pointer-events-none">
                {toasts.map(t => (
                  <div key={t.id} className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right duration-300 ${
                    t.type === 'success' ? 'bg-emerald-600/90 border-emerald-400' : 
                    t.type === 'error' ? 'bg-rose-600/90 border-rose-400' : 
                    'bg-blue-600/90 border-blue-400'
                  }`}>
                    <p className="text-[10px] font-black uppercase tracking-widest">{t.message}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Router>
    </ToastContext.Provider>
  );
};

// --- Navigation Layout ---
const Navigation = ({ user }: { user: User }) => {
  const { pathname } = useLocation();
  
  const mainTabs = [
    { path: '/feed', icon: Home, label: 'Fil' },
    { path: '/map', icon: Map, label: 'Carte' },
    { path: '/live', icon: Sparkles, label: 'Esprit', special: true },
    { path: '/circles', icon: LayoutGrid, label: 'Cercles' },
    { path: '/profile', icon: UserIcon, label: 'Moi' }
  ];

  const tools = [
    { path: '/ideas', icon: Lightbulb, label: 'Idées' },
    { path: '/governance', icon: Gavel, label: 'Édits' },
    { path: '/market', icon: Heart, label: 'Solidarité' },
    { path: '/sentinel', icon: ShieldCheck, label: 'Sentinelle' },
    { path: '/griot-studio', icon: Video, label: 'Griot' }
  ];

  return (
    <>
      {/* Barre Desktop */}
      <nav className="hidden md:flex fixed top-0 inset-x-0 bg-black/80 backdrop-blur-2xl border-b border-white/5 px-10 py-4 z-50 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-600/20">C</div>
          <span className="font-serif font-bold text-2xl tracking-tighter">CERCLE<span className="text-blue-500">.CI</span></span>
        </div>

        <div className="flex items-center gap-8">
          {mainTabs.filter(t => !t.special).map(t => (
            <NavLink key={t.path} to={t.path} className={({isActive}) => `text-[11px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-blue-500' : 'text-gray-500 hover:text-white'}`}>
              {t.label}
            </NavLink>
          ))}
          <div className="w-px h-6 bg-white/10 mx-2"></div>
          {tools.map(t => (
            <NavLink key={t.path} to={t.path} className={({isActive}) => `p-2 rounded-lg transition-all ${isActive ? 'bg-blue-600/10 text-blue-500' : 'text-gray-500 hover:text-white'}`}>
              <t.icon size={20} />
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <NavLink to="/messages" className="text-gray-400 hover:text-white transition-colors relative">
            <MessageSquare size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          </NavLink>
          <div className="w-10 h-10 rounded-xl bg-gray-800 border border-white/10 overflow-hidden shadow-inner">
            <img src={user.avatar} className="w-full h-full object-cover" alt="" />
          </div>
        </div>
      </nav>

      {/* Barre Mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-black/90 backdrop-blur-3xl border-t border-white/5 px-2 pb-8 pt-2 z-50 flex justify-around items-center">
        {mainTabs.map((tab) => (
          <NavLink 
            key={tab.path} 
            to={tab.path}
            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${
              tab.special 
                ? 'bg-blue-600 p-4 rounded-2xl -mt-12 shadow-2xl shadow-blue-600/40 text-white scale-110' 
                : isActive ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <tab.icon size={tab.special ? 28 : 24} />
            {!tab.special && <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Raccourci flottant mobile pour les outils */}
      <div className="md:hidden fixed bottom-24 right-6 flex flex-col gap-4 z-40">
        <NavLink to="/sentinel" className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20 active:scale-90 transition-transform"><ShieldCheck size={20} /></NavLink>
        <NavLink to="/ideas" className="w-12 h-12 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-amber-900/20 active:scale-90 transition-transform"><Lightbulb size={20} /></NavLink>
      </div>
    </>
  );
};

export default App;