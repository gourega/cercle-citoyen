
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
  LogOut
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
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

const NavDropdown = ({ label, icon, items }: { label: string, icon: React.ReactNode, items: { to: string, icon: React.ReactNode, label: string }[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-900'}`}>
        {icon} {label} <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[110] backdrop-blur-xl bg-white/95">
          {items.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                {React.cloneElement(item.icon as React.ReactElement<any>, { size: 14 })}
              </div>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const Navbar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications] = useState<CitizenNotification[]>([]);

  const hideNavbarPaths = ['/', '/manifesto', '/auth', '/welcome', '/legal'];
  if (!user && hideNavbarPaths.includes(location.pathname)) return null;

  const isGuardian = user?.role === Role.SUPER_ADMIN;

  const spacesItems = [
    { to: "/feed", icon: <Home />, label: "Fil d'Éveil" },
    { to: "/chat", icon: <MessageSquare />, label: "Salle des Palabres" },
    { to: "/live", icon: <Mic />, label: "L'Assemblée Directe" },
  ];

  const engagementItems = [
    { to: "/map", icon: <MapIcon />, label: "Empreinte Territoriale" },
    { to: "/governance", icon: <Gavel />, label: "Palais des Édits" },
    { to: "/quests", icon: <Target />, label: "Sentiers d'Impact" },
  ];

  const creationItems = [
    { to: "/griot", icon: <Sparkles />, label: "Griot Studio" },
    { to: "/impact", icon: <Zap />, label: "Studio Visuel" },
    { to: "/exchange", icon: <ShoppingBag />, label: "Marché Solidaire" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100 h-20 px-6 shadow-sm">
      <div className="max-w-7xl mx-auto h-full flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/feed" className="flex items-center group">
            <Logo size={32} showText={true} />
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-1">
          {user ? (
            <>
              <NavDropdown label="Espaces" icon={<Users size={16} />} items={spacesItems} />
              <NavDropdown label="Engagement" icon={<MapIcon size={16} />} items={engagementItems} />
              <NavDropdown label="Outils" icon={<LayoutGrid size={16} />} items={creationItems} />
              
              <div className="h-6 w-px bg-gray-100 mx-3"></div>
              
              <button 
                onClick={() => setIsNotifOpen(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative"
              >
                <Bell size={20} />
                {notifications.some(n => !n.isRead) && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></div>}
              </button>

              {isGuardian && (
                <NavLink 
                  to="/admin" 
                  className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    isActive ? 'text-amber-600 bg-amber-50' : 'text-amber-500/60 hover:text-amber-600 hover:bg-amber-50/50'
                  }`}
                >
                  <Crown size={16} /> Conseil
                </NavLink>
              )}
              
              <div className="flex items-center gap-2 ml-2">
                <NavLink to="/profile" className={({ isActive }) => `flex items-center group rounded-xl overflow-hidden ring-2 transition-all ${isActive ? 'ring-blue-600' : 'ring-transparent hover:ring-blue-200'}`}>
                   <div className="w-10 h-10 bg-gray-100 overflow-hidden">
                     <img src={user.avatar} className="w-full h-full object-cover" alt="Profil" />
                   </div>
                </NavLink>
                <button 
                  onClick={onLogout}
                  className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="Se déconnecter"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <Link to="/auth" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">
              Rejoindre la Cité
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4 lg:hidden">
           {user && (
             <button onClick={() => setIsNotifOpen(true)} className="p-2 text-gray-400 relative">
               <Bell size={24} />
             </button>
           )}
           <button className="p-2 text-gray-900" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isNotifOpen && user && (
        <NotificationDrawer 
          notifications={notifications} 
          onClose={() => setIsNotifOpen(false)} 
          onMarkRead={() => {}} 
        />
      )}

      {isOpen && (
        <div className="lg:hidden absolute top-20 left-0 right-0 bg-white border-t border-gray-100 p-6 flex flex-col gap-2 shadow-2xl animate-in slide-in-from-top duration-300 max-h-[80vh] overflow-y-auto">
          {user ? (
            <>
              <p className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Espaces</p>
              {spacesItems.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600">
                  {item.icon} {item.label}
                </NavLink>
              ))}
              <p className="px-4 py-2 mt-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Engagement</p>
              {engagementItems.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600">
                  {item.icon} {item.label}
                </NavLink>
              ))}
              <p className="px-4 py-2 mt-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Outils</p>
              {creationItems.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600">
                  {item.icon} {item.label}
                </NavLink>
              ))}
              <div className="h-px bg-gray-100 my-4"></div>
              {isGuardian && (
                <NavLink to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 text-amber-600 font-black text-[10px] uppercase tracking-widest">
                  <Crown size={16} /> Conseil du Gardien
                </NavLink>
              )}
              <button onClick={() => { onLogout(); setIsOpen(false); }} className="flex items-center gap-4 p-4 rounded-2xl bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest text-left">
                <LogOut size={16} /> Déconnexion
              </button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setIsOpen(false)} className="bg-blue-600 text-white p-6 rounded-2xl font-black text-center uppercase tracking-widest">
              S'inscrire au Cercle
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<{id: string, message: string, type: string}[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 w-full max-w-sm px-4">
        {toasts.map(t => (
          <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white animate-in slide-in-from-bottom-2 ${t.type === 'success' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
             <CheckCircle size={18} />
             <span className="text-sm font-bold">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cercle_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('cercle_user', JSON.stringify(u));
  };

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('cercle_user');
    window.location.hash = '#/';
  };

  return (
    <ToastProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#fcfcfc]">
          <Navbar user={user} onLogout={handleLogout} />
          <main className={`flex-1 w-full mx-auto ${user ? 'pt-20' : ''}`}>
            <Routes>
              <Route path="/" element={<LandingPage onLogin={handleLogin} user={user} />} />
              <Route path="/manifesto" element={<ManifestoPage />} />
              <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
              <Route path="/legal" element={<LegalPage />} />
              <Route path="/welcome" element={user ? <WelcomePage /> : <Navigate to="/" />} />
              <Route path="/feed" element={<FeedPage user={user} />} />
              <Route path="/admin" element={user?.role === Role.SUPER_ADMIN ? <AdminDashboard /> : <Navigate to="/feed" />} />
              <Route path="/chat" element={user ? <ChatPage user={user} /> : <Navigate to="/" />} />
              <Route path="/live" element={user ? <LiveAssembly /> : <Navigate to="/" />} />
              <Route path="/map" element={user ? <ActionMap /> : <Navigate to="/" />} />
              <Route path="/governance" element={user ? <GovernancePage user={user} /> : <Navigate to="/" />} />
              <Route path="/quests" element={user ? <QuestsPage /> : <Navigate to="/" />} />
              <Route path="/griot" element={user ? <GriotStudio /> : <Navigate to="/" />} />
              <Route path="/impact" element={user ? <ImpactStudio user={user} /> : <Navigate to="/" />} />
              <Route path="/exchange" element={user ? <ResourceExchange user={user} /> : <Navigate to="/" />} />
              <Route path="/profile" element={user ? <ProfilePage currentUser={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
              <Route path="/circle/:type" element={user ? <CirclePage user={user} /> : <Navigate to="/" />} />
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
