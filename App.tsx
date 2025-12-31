
import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, Navigate, Link } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Map as MapIcon, 
  Sparkles, 
  Menu,
  X,
  Gavel,
  Target,
  CheckCircle,
  Zap,
  ShoppingBag,
  Crown,
  Mic,
  Bell,
  ChevronDown,
  LayoutGrid,
  Users,
  LogOut,
  Search,
  Smartphone,
  PlusCircle
} from 'lucide-react';

// Pages
import FeedPage from './pages/FeedPage.tsx';
import ChatPage from './pages/ChatPage.tsx';
import ActionMap from './pages/ActionMap.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import LandingPage from './pages/LandingPage.tsx';
import GriotStudio from './pages/GriotStudio.tsx';
import AuthPage from './pages/AuthPage.tsx';
import ManifestoPage from './pages/ManifestoPage.tsx';
import WelcomePage from './pages/WelcomePage.tsx';
import GovernancePage from './pages/GovernancePage.tsx';
import QuestsPage from './pages/QuestsPage.tsx';
import LegalPage from './pages/LegalPage.tsx';
import ImpactStudio from './pages/ImpactStudio.tsx';
import CirclePage from './pages/CirclePage.tsx';
import ResourceExchange from './pages/ResourceExchange.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import LiveAssembly from './pages/LiveAssembly.tsx';

// Components
import Logo from './Logo.tsx';
import Footer from './components/Footer.tsx';
import GuardianAssistant from './components/GuardianAssistant.tsx';
import NotificationDrawer from './components/NotificationDrawer.tsx';
import { User, Role, CitizenNotification } from './types.ts';

interface ToastContextType {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [pathname]);
  return null;
};

const PrivateRoute = ({ children, user }: { children: React.ReactNode, user: User | null }) => {
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const Navbar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<CitizenNotification[]>([
    { id: '1', type: 'drum_call', title: 'Appel du Conseil', message: 'Un nouvel édit sur la souveraineté alimentaire vient d\'être publié.', timestamp: '10m', isRead: false },
    { id: '2', type: 'award', title: 'Distinction', message: 'Vous avez reçu le badge "Pionnier" !', timestamp: '1h', isRead: false }
  ]);

  if (!user && ['/', '/manifesto', '/auth', '/welcome', '/legal'].includes(location.pathname)) return null;

  const isGuardian = user?.role === Role.SUPER_ADMIN;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-b border-gray-100 h-20 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto h-full flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center shrink-0"><Logo size={32} showText /></Link>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            {user ? (
              <>
                <NavLink to="/feed" className={({ isActive }) => `text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}>Fil d'Éveil</NavLink>
                <NavLink to="/chat" className={({ isActive }) => `text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}>Palabres</NavLink>
                <NavLink to="/map" className={({ isActive }) => `text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}>Carte</NavLink>
                <NavLink to="/governance" className={({ isActive }) => `text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}>Édits</NavLink>
                <button onClick={() => setIsNotifOpen(true)} className="p-2 text-gray-400 hover:text-blue-600 relative">
                  <Bell size={20} />
                  {notifications.some(n => !n.isRead) && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></div>}
                </button>
                <NavLink to="/profile" className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-transparent hover:ring-blue-100">
                  <img src={user.avatar} className="w-full h-full object-cover" alt="Moi" />
                </NavLink>
                <button onClick={onLogout} className="text-gray-400 hover:text-rose-600 transition-all"><LogOut size={18} /></button>
              </>
            ) : (
              <Link to="/auth" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Rejoindre la Cité</Link>
            )}
          </div>

          <div className="lg:hidden">
            <button className="p-2 text-gray-900" onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X size={28} /> : <Menu size={28} />}</button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col p-10 animate-in slide-in-from-right duration-300 lg:hidden">
          <button onClick={() => setIsOpen(false)} className="absolute top-10 right-10"><X size={32} /></button>
          <div className="mt-20 flex flex-col gap-8">
            <NavLink to="/feed" onClick={() => setIsOpen(false)} className="text-2xl font-serif font-bold">Fil d'Éveil</NavLink>
            <NavLink to="/chat" onClick={() => setIsOpen(false)} className="text-2xl font-serif font-bold">Palabres</NavLink>
            <NavLink to="/map" onClick={() => setIsOpen(false)} className="text-2xl font-serif font-bold">Carte d'Impact</NavLink>
            <NavLink to="/profile" onClick={() => setIsOpen(false)} className="text-2xl font-serif font-bold">Mon Profil</NavLink>
            <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-rose-600 text-left text-2xl font-serif font-bold">Déconnexion</button>
          </div>
        </div>
      )}

      {isNotifOpen && user && <NotificationDrawer notifications={notifications} onClose={() => setIsNotifOpen(false)} onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))} />}

      {/* Mobile Tab Bar */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-[90] bg-white/90 backdrop-blur-md border-t border-gray-100 h-20 px-6 flex justify-between items-center lg:hidden pb-safe">
          <NavLink to="/feed" className={({ isActive }) => `p-3 rounded-2xl ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}><Home size={24} /></NavLink>
          <NavLink to="/chat" className={({ isActive }) => `p-3 rounded-2xl ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}><MessageSquare size={24} /></NavLink>
          <NavLink to="/map" className={({ isActive }) => `p-3 rounded-2xl ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}><MapIcon size={24} /></NavLink>
          <NavLink to="/governance" className={({ isActive }) => `p-3 rounded-2xl ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}><Gavel size={24} /></NavLink>
          <NavLink to="/profile" className={({ isActive }) => `p-3 rounded-2xl ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}><img src={user.avatar} className="w-6 h-6 rounded-lg object-cover" alt="" /></NavLink>
        </div>
      )}
    </>
  );
};

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<{id: string, message: string, type: string}[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white animate-in slide-in-from-bottom-2 ${t.type === 'success' ? 'bg-emerald-600' : 'bg-gray-900'}`}>
             <CheckCircle size={18} /> <span className="text-sm font-bold">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(() => {
    try { const saved = localStorage.getItem('cercle_user'); return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
  });

  const handleLogin = (u: User) => { setUser(u); localStorage.setItem('cercle_user', JSON.stringify(u)); };
  const handleLogout = async () => { setUser(null); localStorage.removeItem('cercle_user'); window.location.hash = '#/'; };

  return (
    <ToastProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#fcfcfc] pb-20 lg:pb-0">
          <Navbar user={user} onLogout={handleLogout} />
          <main className={`flex-1 w-full mx-auto ${user ? 'pt-20' : ''}`}>
            <Routes>
              <Route path="/" element={<LandingPage onLogin={handleLogin} user={user} />} />
              <Route path="/manifesto" element={<ManifestoPage />} />
              <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
              <Route path="/legal" element={<LegalPage />} />
              <Route path="/welcome" element={<PrivateRoute user={user}><WelcomePage /></PrivateRoute>} />
              <Route path="/feed" element={<PrivateRoute user={user}><FeedPage user={user} /></PrivateRoute>} />
              <Route path="/admin" element={user?.role === Role.SUPER_ADMIN ? <AdminDashboard /> : <Navigate to="/" />} />
              <Route path="/chat" element={<PrivateRoute user={user}><ChatPage user={user} /></PrivateRoute>} />
              <Route path="/live" element={<PrivateRoute user={user}><LiveAssembly /></PrivateRoute>} />
              <Route path="/map" element={<PrivateRoute user={user}><ActionMap /></PrivateRoute>} />
              <Route path="/governance" element={<PrivateRoute user={user}><GovernancePage user={user} /></PrivateRoute>} />
              <Route path="/quests" element={<PrivateRoute user={user}><QuestsPage /></PrivateRoute>} />
              <Route path="/griot" element={<PrivateRoute user={user}><GriotStudio /></PrivateRoute>} />
              <Route path="/impact" element={<PrivateRoute user={user}><ImpactStudio user={user} /></PrivateRoute>} />
              <Route path="/exchange" element={<PrivateRoute user={user}><ResourceExchange user={user} /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute user={user}><ProfilePage currentUser={user!} onLogout={handleLogout} /></PrivateRoute>} />
              <Route path="/profile/:id" element={<PrivateRoute user={user}><ProfilePage currentUser={user!} onLogout={handleLogout} /></PrivateRoute>} />
              <Route path="/circle/:type" element={<PrivateRoute user={user}><CirclePage user={user!} /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <GuardianAssistant />
          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;
