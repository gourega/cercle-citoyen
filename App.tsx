import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
/* Import useNavigate from react-router-dom to fix the error on line 191 */
import { HashRouter as Router, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  Home, Map, Sparkles, MessageSquare, User as UserIcon, 
  X, Gavel, LayoutGrid, Lightbulb, ShieldCheck, Video, 
  Heart, Settings, Bell, ChevronLeft, BookOpen, ShieldAlert,
  Menu as MenuIcon, Layout
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
import LegalPage from './pages/LegalPage';

import { User, Role } from './types';
import GuardianAssistant from './components/GuardianAssistant';

// --- Toast Context ---
interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }
interface ToastContextType { addToast: (msg: string, type: 'success' | 'error' | 'info') => void; }
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const useToast = () => {
  const c = useContext(ToastContext);
  if (!c) throw new Error('useToast error');
  return c;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cercle_user');
    if (saved) setUser(JSON.parse(saved));
    setIsReady(true);
    const splash = document.getElementById('splash-screen');
    if (splash) splash.style.display = 'none';
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('cercle_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cercle_user');
  };

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  if (!isReady) return null;

  return (
    <ToastContext.Provider value={{ addToast }}>
      <Router>
        <div className="w-full bg-[#020617] text-slate-100 min-h-screen relative">
          {!user ? (
            <Routes>
              <Route path="/" element={<LandingPage onLogin={login} />} />
              <Route path="/manifesto" element={<ManifestoPage />} />
              <Route path="/auth" element={<AuthPage onLogin={login} />} />
              <Route path="/legal" element={<LegalPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <>
              <DesktopNav user={user} onLogout={logout} />
              <main className="max-w-6xl mx-auto w-full px-6 pt-10 md:pt-32 pb-32">
                <Routes>
                  <Route path="/" element={<FeedPage user={user} />} />
                  <Route path="/feed" element={<FeedPage user={user} />} />
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/map" element={<ActionMap />} />
                  <Route path="/live" element={<LiveAssembly />} />
                  <Route path="/profile" element={<ProfilePage currentUser={user} onLogout={async () => logout()} />} />
                  <Route path="/profile/:id" element={<ProfilePage currentUser={user} onLogout={async () => logout()} />} />
                  <Route path="/ideas" element={<IdeaBankPage />} />
                  <Route path="/governance" element={<GovernancePage user={user} />} />
                  <Route path="/market" element={<ResourceExchange user={user} />} />
                  <Route path="/sentinel" element={<SentinelPage user={user} />} />
                  <Route path="/impact-studio" element={<ImpactStudio user={user} />} />
                  <Route path="/griot-studio" element={<GriotStudio />} />
                  <Route path="/circles" element={<CirclesDiscoveryPage />} />
                  <Route path="/circle/:type" element={<CirclePage user={user} />} />
                  <Route path="/messages" element={<ChatPage user={user} />} />
                  <Route path="/legal" element={<LegalPage />} />
                  <Route path="/admin" element={user.role === Role.SUPER_ADMIN ? <AdminDashboard /> : <Navigate to="/" />} />
                  <Route path="*" element={<Navigate to="/feed" replace />} />
                </Routes>
              </main>
              <MobileNav onOpenMenu={() => setIsMobileMenuOpen(true)} />
              {isMobileMenuOpen && <MobileMenuOverlay onClose={() => setIsMobileMenuOpen(false)} user={user} />}
              <GuardianAssistant />
            </>
          )}

          {/* Toast UI */}
          <div className="fixed top-6 right-6 z-[9999] space-y-3 pointer-events-none">
            {toasts.map(t => (
              <div key={t.id} className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right duration-300 ${
                t.type === 'success' ? 'bg-emerald-600/90 border-emerald-400' : 
                t.type === 'error' ? 'bg-rose-600/90 border-rose-400' : 'bg-blue-600/90 border-blue-400'
              }`}>
                <p className="text-[11px] font-black uppercase tracking-widest text-white">{t.message}</p>
              </div>
            ))}
          </div>
        </div>
      </Router>
    </ToastContext.Provider>
  );
};

const DesktopNav = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const tools = [
    { path: '/feed', label: "Fil d'Éveil" },
    { path: '/messages', label: 'Palabre' },
    { path: '/map', label: 'Carte' },
    { path: '/circles', label: 'Cercles' },
    { path: '/ideas', label: 'Idées' },
    { path: '/market', label: 'Marché' },
    { path: '/sentinel', label: 'Sentinelle' }
  ];

  return (
    <nav className="hidden md:flex fixed top-0 inset-x-0 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-10 py-4 z-50 items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/20">C</div>
        <NavLink to="/" className="font-serif font-bold text-2xl tracking-tighter text-white">CERCLE <span className="text-blue-500">CITOYEN</span></NavLink>
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        {tools.map(t => (
          <NavLink key={t.path} to={t.path} className={({isActive}) => `text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}>{t.label}</NavLink>
        ))}
        <NavLink to="/live" className="flex items-center gap-2 px-5 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
          <Sparkles size={14} /> L'Esprit
        </NavLink>
      </div>
      <div className="flex items-center gap-6">
        <NavLink to="/profile" className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 overflow-hidden ring-2 ring-transparent hover:ring-blue-500 transition-all">
          <img src={user.avatar} className="w-full h-full object-cover" alt="" />
        </NavLink>
        <button onClick={onLogout} className="text-slate-500 hover:text-rose-500 transition-colors"><X size={18} /></button>
      </div>
    </nav>
  );
}

const MobileNav = ({ onOpenMenu }: { onOpenMenu: () => void }) => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-3xl border-t border-white/5 px-2 pb-8 pt-2 z-50 flex justify-around items-center">
    <NavLink to="/feed" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
      <Home size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Fil</span>
    </NavLink>
    <button onClick={onOpenMenu} className="flex flex-col items-center gap-1 text-slate-500">
      <Layout size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Menu</span>
    </button>
    <NavLink to="/live" className="bg-blue-600 p-4 rounded-2xl -mt-12 shadow-2xl shadow-blue-600/40 text-white active:scale-90 transition-transform"><Sparkles size={28} /></NavLink>
    <NavLink to="/messages" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
      <MessageSquare size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Palabre</span>
    </NavLink>
    <NavLink to="/profile" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
      <UserIcon size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Moi</span>
    </NavLink>
  </nav>
);

const MobileMenuOverlay = ({ onClose, user }: { onClose: () => void, user: User }) => {
  /* Fix: Use the imported useNavigate from react-router-dom */
  const navigate = useNavigate();
  const tools = [
    { path: '/map', icon: Map, label: 'Carte', color: 'bg-emerald-500/10 text-emerald-500' },
    { path: '/circles', icon: LayoutGrid, label: 'Cercles', color: 'bg-blue-500/10 text-blue-500' },
    { path: '/ideas', icon: Lightbulb, label: 'Idées', color: 'bg-yellow-500/10 text-yellow-500' },
    { path: '/market', icon: Heart, label: 'Marché', color: 'bg-rose-500/10 text-rose-500' },
    { path: '/sentinel', icon: ShieldCheck, label: 'Sentinelle', color: 'bg-teal-500/10 text-teal-500' },
    { path: '/griot-studio', icon: Video, label: 'Griot', color: 'bg-amber-500/10 text-amber-500' },
    { path: '/impact-studio', icon: Sparkles, label: 'Impact', color: 'bg-indigo-500/10 text-indigo-500' },
    { path: '/governance', icon: Gavel, label: 'Édits', color: 'bg-slate-500/10 text-slate-400' }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in slide-in-from-bottom-20 duration-500">
      <header className="p-8 flex justify-between items-center border-b border-white/5">
        <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Toute la Cité</h2>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><X size={24} /></button>
      </header>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-4">
          {tools.map((t) => (
            <button
              key={t.path}
              onClick={() => { navigate(t.path); onClose(); }}
              className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all group active:scale-95"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${t.color}`}>
                <t.icon size={28} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-white">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <footer className="p-10 border-t border-white/5 bg-slate-900/50">
        <p className="text-[8px] font-black text-center text-slate-600 uppercase tracking-[0.5em]">CERCLE CITOYEN • V4.2.0</p>
      </footer>
    </div>
  );
};

export default App;