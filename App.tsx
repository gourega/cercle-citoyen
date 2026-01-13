import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { 
  Home, Map, Sparkles, MessageSquare, User as UserIcon, 
  X, Gavel, LayoutGrid, Lightbulb, ShieldCheck, Video, 
  Heart, Settings, Bell, ChevronLeft, BookOpen, ShieldAlert
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
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
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
              <main className="flex-1 max-w-6xl mx-auto w-full px-6 pt-6 md:pt-28 pb-32">
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
              <MobileNav />
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
    { path: '/map', icon: Map, label: 'Carte' },
    { path: '/circles', icon: LayoutGrid, label: 'Cercles' },
    { path: '/ideas', icon: Lightbulb, label: 'Idées' },
    { path: '/market', icon: Heart, label: 'Marché' },
    { path: '/sentinel', icon: ShieldCheck, label: 'Sentinelle' }
  ];

  return (
    <nav className="hidden md:flex fixed top-0 inset-x-0 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-10 py-4 z-50 items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/20">C</div>
        <NavLink to="/" className="font-serif font-bold text-2xl tracking-tighter text-white">CERCLE <span className="text-blue-500">CITOYEN</span></NavLink>
      </div>
      <div className="flex items-center gap-8">
        <NavLink to="/feed" className={({isActive}) => `text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}>Fil d'Éveil</NavLink>
        {tools.map(t => (
          <NavLink key={t.path} to={t.path} className={({isActive}) => `text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}>{t.label}</NavLink>
        ))}
        <NavLink to="/live" className="flex items-center gap-2 px-5 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
          <Sparkles size={14} /> L'Esprit
        </NavLink>
      </div>
      <div className="flex items-center gap-6">
        <NavLink to="/messages" className="text-slate-500 hover:text-white transition-colors relative">
          <MessageSquare size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        </NavLink>
        <NavLink to="/profile" className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 overflow-hidden ring-2 ring-transparent hover:ring-blue-500 transition-all">
          <img src={user.avatar} className="w-full h-full object-cover" alt="" />
        </NavLink>
        <button onClick={onLogout} className="text-slate-500 hover:text-rose-500 transition-colors"><X size={18} /></button>
      </div>
    </nav>
  );
}

const MobileNav = () => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-3xl border-t border-white/5 px-2 pb-8 pt-2 z-50 flex justify-around items-center">
    <NavLink to="/feed" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
      <Home size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Fil</span>
    </NavLink>
    <NavLink to="/circles" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
      <LayoutGrid size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Cercles</span>
    </NavLink>
    <NavLink to="/live" className="bg-blue-600 p-4 rounded-2xl -mt-12 shadow-2xl shadow-blue-600/40 text-white active:scale-90 transition-transform"><Sparkles size={28} /></NavLink>
    <NavLink to="/messages" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
      <MessageSquare size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Palabre</span>
    </NavLink>
    <NavLink to="/profile" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
      <UserIcon size={22} /><span className="text-[8px] font-black uppercase tracking-widest">Moi</span>
    </NavLink>
  </nav>
);

export default App;