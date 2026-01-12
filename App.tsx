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
  CheckCircle,
  Bell,
  LogOut,
  Wifi,
  AlertTriangle,
  ChevronDown,
  Target,
  Video,
  Handshake,
  BookText,
  Mic,
  ImageIcon,
  Crown,
  ShieldCheck,
  Eye,
  Layers,
  Building2
} from 'lucide-react';

// Pages
import FeedPage from './pages/FeedPage';
import ChatPage from './pages/ChatPage';
import ActionMap from './pages/ActionMap';
import ProfilePage from './pages/ProfilePage';
import LandingPage from './pages/LandingPage';
import GriotStudio from './pages/GriotStudio';
import AuthPage from './pages/AuthPage';
import ManifestoPage from './pages/ManifestoPage';
import WelcomePage from './pages/WelcomePage';
import GovernancePage from './pages/GovernancePage';
import QuestsPage from './pages/QuestsPage';
import LegalPage from './pages/LegalPage';
import ImpactStudio from './pages/ImpactStudio';
import CirclePage from './pages/CirclePage';
import CirclesDiscoveryPage from './pages/CirclesDiscoveryPage';
import ResourceExchange from './pages/ResourceExchange';
import AdminDashboard from './pages/AdminDashboard';
import LiveAssembly from './pages/LiveAssembly';
import TransparencyLedger from './pages/TransparencyLedger';
import SentinelPage from './pages/SentinelPage';
import BusinessPortal from './pages/BusinessPortal';

// Components
import Logo from './Logo';
import Footer from './components/Footer';
import GuardianAssistant from './components/GuardianAssistant';
import NotificationDrawer from './components/NotificationDrawer';
import { User, Role, CitizenNotification, UserCategory } from './types';
import { supabase, isRealSupabase, db } from './lib/supabase';

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
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

const PrivateRoute = ({ children, user }: { children?: React.ReactNode, user: User | null }) => {
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const NavDropdown = ({ label, items }: { label: string, items: { to: string, icon: React.ReactNode, label: string, desc: string }[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div 
      className="relative group h-full flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-600 transition-colors py-8">
        {label} <ChevronDown size={10} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 bg-white rounded-[2rem] shadow-2xl border border-gray-50 p-4 animate-in fade-in zoom-in duration-200 z-[110]">
          <div className="space-y-1">
            {items.map((item, idx) => (
              <NavLink 
                key={idx} 
                to={item.to} 
                className={({ isActive }) => `flex items-center gap-4 p-4 rounded-2xl transition-all group/item ${isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
                onClick={() => setIsOpen(false)}
              >
                <div className="p-2 rounded-lg bg-gray-100 group-hover/item:bg-blue-100 transition-colors">
                  {React.cloneElement(item.icon as React.ReactElement<any>, { size: 16 })}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">{item.label}</p>
                  <p className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-tight">{item.desc}</p>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = ({ user, onLogout, connStatus }: { user: User | null, onLogout: () => void, connStatus: { ok: boolean, message: string } | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<CitizenNotification[]>([
    { id: '1', type: 'drum_call', title: 'Appel du Conseil', message: 'Bienvenue sur cerclecitoyen.ci ! Le réseau est désormais ouvert.', timestamp: '1m', isRead: false }
  ]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-b border-gray-100 h-20 px-6 shadow-sm">
        {connStatus && (
          <div className={`absolute top-0 inset-x-0 text-[7px] py-1 px-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all duration-700 z-[110] ${connStatus.ok ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
            {connStatus.ok ? <Wifi size={8} /> : <AlertTriangle size={8} />} {connStatus.message}
          </div>
        )}
        <div className="max-w-7xl mx-auto h-full flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center shrink-0"><Logo size={32} showText /></Link>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            {user ? (
              <>
                <NavDropdown label="Dialogue" items={[
                  { to: '/feed', icon: <Home />, label: "Fil d'Éveil", desc: "Refléxions citoyennes" }, 
                  { to: '/circles', icon: <Layers />, label: "Les Cercles", desc: "Thématiques d'engagement" },
                  { to: '/chat', icon: <MessageSquare />, label: "Palabres", desc: "Salle de discussion" }, 
                  { to: '/live', icon: <Mic />, label: "L'Assemblée", desc: "Dialogue en temps réel" }
                ]} />
                <NavDropdown label="Action" items={[
                  { to: '/map', icon: <MapIcon />, label: "Carte", desc: "Maillage territorial" }, 
                  { to: '/quests', icon: <Target />, label: "Sentiers", desc: "Quêtes d'impact social" }, 
                  { to: '/sentinel', icon: <ShieldCheck />, label: "Sentinelle", desc: "Éveil environnemental" }, 
                  { to: '/exchange', icon: <Handshake />, label: "Marché", desc: "Dons et solidarité" }
                ]} />
                <NavDropdown label="Studio" items={[{ to: '/griot', icon: <Video />, label: "Griot Studio", desc: "Vidéos de mobilisation" }, { to: '/impact', icon: <ImageIcon />, label: "Impact Studio", desc: "Visuels de vision" }]} />
                <NavDropdown label="Souveraineté" items={[
                  { to: '/governance', icon: <Gavel />, label: "Édits", desc: "Gouvernance et votes" }, 
                  { to: '/transparency', icon: <BookText />, label: "Transparence", desc: "Registre des flux" },
                  { to: '/business', icon: <Building2 />, label: "Entreprises", desc: "Portail d'impact éco" }
                ]} />
                
                <div className="h-8 w-px bg-gray-100 mx-2"></div>
                
                {user.role === Role.SUPER_ADMIN && (
                  <NavLink 
                    to="/admin" 
                    className={({ isActive }) => `flex items-center gap-2.5 px-6 py-2.5 rounded-2xl transition-all border-2 border-amber-200 ${isActive ? 'bg-amber-600 text-white border-amber-600 shadow-xl' : 'bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white hover:border-amber-600 shadow-amber-100 shadow-lg'}`}
                  >
                    <Crown size={18} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">CONSEIL</span>
                  </NavLink>
                )}

                <button onClick={() => setIsNotifOpen(true)} className="p-2 text-gray-400 hover:text-blue-600 relative transition-colors">
                  <Bell size={20} />
                  {notifications.some(n => !n.isRead) && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></div>}
                </button>
                <NavLink to="/profile" className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-transparent hover:ring-blue-100 transition-all">
                  <img src={user.avatar} className="w-full h-full object-cover" alt="Moi" />
                </NavLink>
                <button onClick={onLogout} className="text-gray-400 hover:text-rose-600 transition-all"><LogOut size={18} /></button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 px-4">Inscription</Link>
                <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-100">Se Connecter</Link>
              </div>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-4">
            {!user && <Link to="/auth" className="text-[10px] font-black uppercase text-blue-600">Inscription</Link>}
            <button className="p-2 text-gray-900" onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X size={28} /> : <Menu size={28} />}</button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col p-10 animate-in slide-in-from-right duration-300 lg:hidden overflow-y-auto">
          <button onClick={() => setIsOpen(false)} className="absolute top-10 right-10 p-4"><X size={32} /></button>
          <div className="mt-20 flex flex-col gap-8">
            {user ? (
              <>
                {user.role === Role.SUPER_ADMIN && (
                  <div className="bg-amber-600 p-10 rounded-[3rem] shadow-2xl shadow-amber-200 mb-4 border-2 border-amber-400">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-200 mb-4 flex items-center gap-2">
                      <Crown size={14} className="animate-pulse" /> Sagesse du Gardien
                    </p>
                    <NavLink to="/admin" onClick={() => setIsOpen(false)} className="block text-4xl font-serif font-bold text-white">Conseil Suprême</NavLink>
                  </div>
                )}
                <div className="space-y-4">
                  <NavLink to="/feed" onClick={() => setIsOpen(false)} className="block text-2xl font-serif font-bold">Fil d'Éveil</NavLink>
                  <NavLink to="/circles" onClick={() => setIsOpen(false)} className="block text-2xl font-serif font-bold">Les Cercles</NavLink>
                  <NavLink to="/chat" onClick={() => setIsOpen(false)} className="block text-2xl font-serif font-bold">Palabres</NavLink>
                  <NavLink to="/live" onClick={() => setIsOpen(false)} className="block text-2xl font-serif font-bold">L'Assemblée</NavLink>
                </div>
                <div className="h-px bg-gray-100 my-4"></div>
                <NavLink to="/profile" onClick={() => setIsOpen(false)} className="text-2xl font-serif font-bold">Mon Profil</NavLink>
                <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-rose-600 text-left text-2xl font-serif font-bold">Déconnexion</button>
              </>
            ) : (
              <>
                <NavLink to="/" onClick={() => setIsOpen(false)} className="text-3xl font-serif font-bold">Accueil</NavLink>
                <NavLink to="/manifesto" onClick={() => setIsOpen(false)} className="text-3xl font-serif font-bold">Manifeste</NavLink>
                <Link to="/auth" onClick={() => setIsOpen(false)} className="bg-blue-600 text-white py-6 rounded-3xl font-black text-center text-[11px] uppercase tracking-widest">Rejoindre la Cité</Link>
              </>
            )}
          </div>
        </div>
      )}

      {isNotifOpen && user && <NotificationDrawer notifications={notifications} onClose={() => setIsNotifOpen(false)} onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))} />}
    </>
  );
};

const ToastProvider = ({ children }: { children?: React.ReactNode }) => {
  const [toasts, setToasts] = useState<{id: string, message: string, type: string}[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(current => current.filter(t => t.id !== id)), 4000);
  };
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 text-white animate-in slide-in-from-bottom-5 duration-500 ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-gray-950'}`}>
             <CheckCircle size={18} /> <span className="text-[11px] font-black uppercase tracking-widest">{t.message}</span>
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
  const [connStatus, setConnStatus] = useState<{ok: boolean, message: string} | null>(null);

  const handleLogin = (u: User) => { 
    setUser(u); 
    localStorage.setItem('cercle_user', JSON.stringify(u)); 
  };

  const handleLogout = async () => { 
    if (isRealSupabase && supabase) await (supabase.auth as any).signOut();
    setUser(null); 
    localStorage.removeItem('cercle_user'); 
    window.location.hash = '/';
  };

  useEffect(() => {
    const check = async () => {
      const status = await db.checkConnection();
      setConnStatus(status);
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ToastProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#fcfcfc]">
          <Navbar user={user} onLogout={handleLogout} connStatus={connStatus} />
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
              <Route path="/transparency" element={<TransparencyLedger />} />
              <Route path="/quests" element={<PrivateRoute user={user}><QuestsPage /></PrivateRoute>} />
              <Route path="/sentinel" element={<PrivateRoute user={user}><SentinelPage user={user!} /></PrivateRoute>} />
              <Route path="/griot" element={<PrivateRoute user={user}><GriotStudio /></PrivateRoute>} />
              <Route path="/impact" element={<PrivateRoute user={user}><ImpactStudio user={user} /></PrivateRoute>} />
              <Route path="/exchange" element={<PrivateRoute user={user}><ResourceExchange user={user} /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute user={user}><ProfilePage currentUser={user!} onLogout={handleLogout} /></PrivateRoute>} />
              <Route path="/profile/:id" element={<PrivateRoute user={user}><ProfilePage currentUser={user!} onLogout={handleLogout} /></PrivateRoute>} />
              <Route path="/circles" element={<PrivateRoute user={user}><CirclesDiscoveryPage /></PrivateRoute>} />
              <Route path="/circle/:type" element={<PrivateRoute user={user}><CirclePage user={user!} /></PrivateRoute>} />
              <Route path="/business" element={<PrivateRoute user={user}><BusinessPortal user={user!} /></PrivateRoute>} />
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