
import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Map as MapIcon, 
  Sparkles, 
  User as UserIcon, 
  Menu,
  X,
  Gavel,
  Target,
  CheckCircle,
  Zap,
  ShoppingBag,
  Info,
  Crown,
  ShieldAlert,
  Mic,
  Bell
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
import { ADMIN_ID } from './lib/mocks.ts';
import { supabase, isRealSupabase } from './lib/supabase.ts';

interface ToastContextType {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

const Navbar = ({ user }: { user: User | null }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<CitizenNotification[]>([]);

  if (!user || ['/', '/manifesto', '/auth', '/welcome', '/legal'].includes(location.pathname)) return null;

  const isGuardian = user.role === Role.SUPER_ADMIN;

  const navItems = [
    { to: "/feed", icon: <Home size={16} />, label: "Fil" },
    { to: "/chat", icon: <MessageSquare size={16} />, label: "Palabre" },
    { to: "/live", icon: <Mic size={16} />, label: "Assemblée" },
    { to: "/map", icon: <MapIcon size={16} />, label: "Carte" },
    { to: "/governance", icon: <Gavel size={16} />, label: "Édits" },
    { to: "/quests", icon: <Target size={16} />, label: "Sentiers" },
    { to: "/griot", icon: <Sparkles size={16} />, label: "Griot" },
    { to: "/impact", icon: <Zap size={16} />, label: "Studio" },
    { to: "/exchange", icon: <ShoppingBag size={16} />, label: "Marché" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100 h-20 px-6">
      <div className="max-w-7xl mx-auto h-full flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/feed" className="flex items-center group">
            <Logo size={32} showText={true} />
          </Link>
          {isRealSupabase && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Réseau Souverain Connecté</span>
            </div>
          )}
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link 
              key={item.to} 
              to={item.to} 
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                location.pathname === item.to ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          
          <div className="h-6 w-px bg-gray-100 mx-3"></div>
          
          <button 
            onClick={() => setIsNotifOpen(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative"
          >
            <Bell size={20} />
            {notifications.some(n => !n.isRead) && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></div>}
          </button>

          {isGuardian && (
            <Link 
              to="/admin" 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                location.pathname === '/admin' ? 'text-amber-600 bg-amber-50' : 'text-amber-500/60 hover:text-amber-600 hover:bg-amber-50/50'
              }`}
            >
              <Crown size={16} /> Conseil
            </Link>
          )}
          
          <Link to="/profile" className="flex items-center group ml-2">
             <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-200 transition-all">
               <img src={user.avatar} className="w-full h-full object-cover" alt="Mon Profil" />
             </div>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 lg:hidden">
           <button onClick={() => setIsNotifOpen(true)} className="p-2 text-gray-400 relative">
             <Bell size={24} />
             {notifications.some(n => !n.isRead) && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></div>}
           </button>
           <button className="p-2 text-gray-900" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isNotifOpen && (
        <NotificationDrawer 
          notifications={notifications} 
          onClose={() => setIsNotifOpen(false)} 
          onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n))} 
        />
      )}

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-20 left-0 right-0 bg-white border-t border-gray-100 p-6 flex flex-col gap-2 shadow-2xl animate-in slide-in-from-top duration-300">
          {navItems.map((item) => (
            <Link 
              key={item.to} 
              to={item.to} 
              onClick={() => setIsOpen(false)} 
              className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 font-black text-[10px] uppercase tracking-widest text-gray-600 hover:bg-blue-50 hover:text-blue-600"
            >
              {item.icon} {item.label}
            </Link>
          ))}
          {isGuardian && (
            <Link 
              to="/admin" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 font-black text-[10px] uppercase tracking-widest text-amber-600 hover:bg-amber-100"
            >
              <Crown size={16} /> Conseil du Gardien
            </Link>
          )}
          <Link 
            to="/profile" 
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-4 p-4 rounded-2xl bg-blue-600 text-white shadow-lg mt-4"
          >
            <UserIcon size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Mon Profil</span>
          </Link>
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
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 w-full max-sm px-4">
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
    const saved = localStorage.getItem('cercle_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (u: User) => {
    // SYSTÈME DE PERSISTANCE LOCALE :
    // Avant de connecter l'utilisateur, on vérifie si une version modifiée de son profil existe dans le "Registre Local"
    const localRegistry = JSON.parse(localStorage.getItem('cercle_registry') || '{}');
    const existingProfile = localRegistry[u.id];
    
    const finalUser = existingProfile ? { ...u, ...existingProfile } : u;
    
    setUser(finalUser);
    localStorage.setItem('cercle_user', JSON.stringify(finalUser));
  };

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('cercle_user');
  };

  const handleProfileUpdate = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Mettre à jour la session actuelle
      localStorage.setItem('cercle_user', JSON.stringify(updatedUser));
      
      // Mettre à jour le Registre Local permanent (indexé par ID)
      const localRegistry = JSON.parse(localStorage.getItem('cercle_registry') || '{}');
      localRegistry[user.id] = { 
        ...localRegistry[user.id], 
        ...updates 
      };
      localStorage.setItem('cercle_registry', JSON.stringify(localRegistry));
    }
  };

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar user={user} />
          <main className={`flex-1 w-full mx-auto ${user ? 'pt-20' : ''}`}>
            <Routes>
              <Route path="/" element={<LandingPage onLogin={handleLogin} user={user} />} />
              <Route path="/manifesto" element={<ManifestoPage />} />
              <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
              <Route path="/legal" element={<LegalPage />} />
              <Route path="/welcome" element={user ? <WelcomePage /> : <Navigate to="/" />} />
              <Route path="/feed" element={user ? <FeedPage user={user} /> : <Navigate to="/" />} />
              <Route path="/chat" element={user ? <ChatPage user={user} /> : <Navigate to="/" />} />
              <Route path="/live" element={user ? <LiveAssembly /> : <Navigate to="/" />} />
              <Route path="/map" element={user ? <ActionMap /> : <Navigate to="/" />} />
              <Route path="/governance" element={user ? <GovernancePage user={user} /> : <Navigate to="/" />} />
              <Route path="/quests" element={user ? <QuestsPage /> : <Navigate to="/" />} />
              <Route path="/griot" element={user ? <GriotStudio /> : <Navigate to="/" />} />
              <Route path="/impact" element={user ? <ImpactStudio user={user} /> : <Navigate to="/" />} />
              <Route path="/exchange" element={user ? <ResourceExchange user={user} /> : <Navigate to="/" />} />
              <Route path="/profile" element={user ? <ProfilePage currentUser={user} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} /> : <Navigate to="/" />} />
              <Route path="/admin" element={user?.role === Role.SUPER_ADMIN ? <AdminDashboard /> : <Navigate to="/" />} />
              <Route path="/circle/:type" element={user ? <CirclePage user={user} /> : <Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Footer />
          </main>
          <GuardianAssistant />
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;
