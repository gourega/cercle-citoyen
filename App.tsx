import React, { useState, createContext, useContext } from 'react';
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
  AlertCircle,
  Info,
  Mic,
  BarChart3,
  Mail,
  Phone,
  Crown
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
import TransparencyLedger from './pages/TransparencyLedger.tsx';
import LegalPage from './pages/LegalPage.tsx';
import ImpactStudio from './pages/ImpactStudio.tsx';
import CirclePage from './pages/CirclePage.tsx';
import LiveAssembly from './pages/LiveAssembly.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';

// Shared Components
import Logo from './Logo.tsx';
import GuardianAssistant from './components/GuardianAssistant.tsx';
import { User } from './types.ts';
import { ADMIN_ID, MOCK_USERS } from './lib/mocks.ts';

// Toast Context
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
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

const Navbar = ({ user }: { user: User | null }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const hideNav = ['/', '/manifesto', '/auth', '/welcome'].includes(location.pathname) || !user;
  if (hideNav) return null;

  const isGardien = user?.id === ADMIN_ID;

  const navItems = [
    { to: "/feed", icon: <Home size={18} />, label: "Fil" },
    { to: "/chat", icon: <MessageSquare size={18} />, label: "Palabre" },
    { to: "/map", icon: <MapIcon size={18} />, label: "Carte" },
    { to: "/governance", icon: <Gavel size={18} />, label: "Édits" },
    { to: "/quests", icon: <Target size={18} />, label: "Sentiers" },
    { to: "/assembly", icon: <Mic size={18} />, label: "Direct" },
    { to: "/griot", icon: <Sparkles size={18} />, label: "Griot" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4">
      <div className="max-w-7xl mx-auto h-20 flex justify-between items-center">
        <Link to="/feed" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo size={32} showText={false} />
          <span className="font-serif font-bold uppercase tracking-tighter text-xl hidden sm:block">Cercle</span>
        </Link>

        <div className="hidden lg:flex items-center gap-4">
          {navItems.map((item) => (
            <Link 
              key={item.to} 
              to={item.to} 
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-3 py-2 rounded-xl ${
                location.pathname === item.to ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          
          <div className="h-6 w-px bg-gray-100 mx-2"></div>
          
          {isGardien && (
            <Link to="/admin" className={`p-2 rounded-xl transition-all ${location.pathname === '/admin' ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-amber-600'}`} title="Conseil du Gardien">
              <Crown size={20} />
            </Link>
          )}

          <Link to="/ledger" className={`p-2 rounded-xl transition-all ${location.pathname === '/ledger' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600'}`} title="Transparence">
            <BarChart3 size={20} />
          </Link>
          
          <Link to="/profile" className="flex items-center gap-3 pl-2 group">
             <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-200 transition-all shadow-sm">
               <img src={user?.avatar} className="w-full h-full object-cover" alt="" />
             </div>
          </Link>
        </div>

        <button className="lg:hidden p-2 text-gray-900 bg-gray-50 rounded-xl" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="lg:hidden absolute top-20 left-0 right-0 bg-white border-t border-gray-100 p-6 flex flex-col gap-4 animate-in slide-in-from-top duration-300 shadow-2xl">
          <div className="grid grid-cols-2 gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.to} 
                to={item.to} 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                {item.icon} {item.label}
              </Link>
            ))}
            {isGardien && (
              <Link 
                to="/admin" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-100 transition-all"
              >
                <Crown size={18} /> Conseil
              </Link>
            )}
            <Link 
                to="/ledger" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                <BarChart3 size={18} /> Budget
              </Link>
          </div>
          <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-blue-600 text-white shadow-lg">
            <UserIcon size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Mon Profil</span>
          </Link>
        </div>
      )}
    </nav>
  );
};

const ProtectedRoute: React.FC<{ isAuth: boolean; children: React.ReactNode }> = ({ isAuth, children }) => {
  if (!isAuth) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 w-full max-w-sm px-4">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300 border ${
              toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
              toast.type === 'error' ? 'bg-blue-600 border-blue-500 text-white' :
              'bg-blue-600 border-blue-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : 
             toast.type === 'error' ? <AlertCircle size={18} /> : <Info size={18} />}
            <span className="text-sm font-bold">{toast.message}</span>
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
  const [isAuth, setIsAuth] = useState(!!user);

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setIsAuth(true);
    localStorage.setItem('cercle_user', JSON.stringify(authenticatedUser));
  };

  const handleLogout = async () => {
    setUser(null);
    setIsAuth(false);
    localStorage.removeItem('cercle_user');
  };

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar user={user} />
          <main className={`flex-1 w-full mx-auto ${isAuth ? 'pt-20' : ''}`}>
            <Routes>
              <Route path="/" element={<LandingPage onLogin={handleLogin} user={user} />} />
              <Route path="/manifesto" element={<ManifestoPage />} />
              <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
              <Route path="/legal" element={<LegalPage />} />
              <Route path="/welcome" element={<ProtectedRoute isAuth={isAuth}><WelcomePage /></ProtectedRoute>} />
              <Route path="/feed" element={<ProtectedRoute isAuth={isAuth}><FeedPage user={user!} /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute isAuth={isAuth}><ChatPage user={user!} /></ProtectedRoute>} />
              <Route path="/map" element={<ProtectedRoute isAuth={isAuth}><ActionMap /></ProtectedRoute>} />
              <Route path="/griot" element={<ProtectedRoute isAuth={isAuth}><GriotStudio /></ProtectedRoute>} />
              <Route path="/studio" element={<ProtectedRoute isAuth={isAuth}><ImpactStudio user={user!} /></ProtectedRoute>} />
              <Route path="/governance" element={<ProtectedRoute isAuth={isAuth}><GovernancePage user={user!} /></ProtectedRoute>} />
              <Route path="/quests" element={<ProtectedRoute isAuth={isAuth}><QuestsPage /></ProtectedRoute>} />
              <Route path="/assembly" element={<ProtectedRoute isAuth={isAuth}><LiveAssembly /></ProtectedRoute>} />
              <Route path="/ledger" element={<ProtectedRoute isAuth={isAuth}><TransparencyLedger /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute isAuth={isAuth}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute isAuth={isAuth}><ProfilePage currentUser={user!} onLogout={handleLogout} /></ProtectedRoute>} />
              <Route path="/circle/:type" element={<ProtectedRoute isAuth={isAuth}><CirclePage user={user!} /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          <GuardianAssistant />
          
          <footer className="py-20 border-t border-gray-100 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 items-start text-center md:text-left">
              <div>
                <Logo size={28} showText={true} variant="blue" className="mb-6 opacity-80" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 max-w-xs leading-relaxed">
                  Réseau social citoyen engagé pour la souveraineté numérique et le progrès social en Côte d'Ivoire.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6">Contact & Support</h4>
                <div className="flex flex-col gap-3">
                  <a href="mailto:cerclecitoyenci@gmail.com" className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center md:justify-start gap-3">
                    <Mail size={14} className="text-blue-400" /> cerclecitoyenci@gmail.com
                  </a>
                  <a href="tel:+2252522001239" className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center md:justify-start gap-3">
                    <Phone size={14} className="text-emerald-400" /> +225 2522001239
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6">Cadre Légal</h4>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <Link to="/legal" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">CGU</Link>
                  <Link to="/legal" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Confidentialité</Link>
                  <Link to="/legal" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Mentions Légales</Link>
                  <Link to="/manifesto" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">Manifeste</Link>
                </div>
              </div>
            </div>

            <div className="mt-20 border-t border-gray-100 pt-8 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">
                © 2025 CERCLE CITOYEN • SOUVERAINETÉ NUMÉRIQUE
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;