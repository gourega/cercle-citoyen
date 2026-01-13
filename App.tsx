
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { 
  Home, Search, Bell, User as UserIcon, PlusSquare, 
  MessageSquare, Sparkles, Shield, Heart, Share2, 
  Volume2, Globe, Bookmark, MoreHorizontal, Send,
  Zap, Users, Map, X, CheckCircle, AlertCircle, Info as InfoIcon
} from 'lucide-react';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import ActionMap from './pages/ActionMap';
import LiveAssembly from './pages/LiveAssembly';
import { User, Role, UserCategory } from './types';

// --- TOAST SYSTEM ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
} | undefined>(undefined);

// Export useToast to fix import errors in other files
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[999] flex flex-col gap-4 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <AlertCircle size={20} />}
            {toast.type === 'info' && <InfoIcon size={20} />}
            <span className="text-sm font-bold">{toast.message}</span>
            <button 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-2 opacity-50 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Mock User pour la démonstration immédiate
const MOCK_USER: User = {
  id: 'u-current',
  name: 'Citoyen Souverain',
  pseudonym: 'Vigilant225',
  bio: 'Engagé pour le progrès social en Côte d\'Ivoire.',
  role: Role.MEMBER,
  category: UserCategory.CITIZEN,
  interests: ['Éducation', 'Tech'],
  avatar: 'https://picsum.photos/seed/ivory/200/200',
  impactScore: 1250
};

const Navigation = () => {
  const location = useLocation();
  const tabs = [
    { path: '/feed', icon: Home, label: 'Éveil' },
    { path: '/map', icon: Map, label: 'Territoire' },
    { path: '/live', icon: Sparkles, label: 'Assemblée', special: true },
    { path: '/messages', icon: MessageSquare, label: 'Palabres' },
    { path: '/profile', icon: UserIcon, label: 'Profil' }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#0a0c10]/80 backdrop-blur-2xl border-t border-white/5 px-4 pb-6 pt-2 z-[100] flex justify-around items-center md:top-0 md:bottom-auto md:border-t-0 md:border-b md:px-20 md:py-4">
      <div className="hidden md:flex items-center gap-3 mr-auto">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">C</div>
        <span className="font-serif font-bold text-lg tracking-tight">CERCLE<span className="text-blue-500">.CI</span></span>
      </div>
      
      <div className="flex justify-around items-center w-full md:w-auto md:gap-12">
        {tabs.map((tab) => (
          <NavLink 
            key={tab.path} 
            to={tab.path}
            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${
              tab.special 
                ? 'bg-blue-600 p-4 rounded-2xl -mt-10 shadow-2xl shadow-blue-600/40 text-white' 
                : isActive ? 'text-blue-500' : 'text-gray-500 hover:text-white'
            }`}
          >
            <tab.icon size={tab.special ? 24 : 22} />
            {!tab.special && <span className="text-[9px] font-black uppercase tracking-widest md:hidden">{tab.label}</span>}
          </NavLink>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-6 ml-auto">
        <button className="text-gray-400 hover:text-white"><Search size={20}/></button>
        <button className="text-gray-400 hover:text-white"><Bell size={20}/></button>
        <div className="w-10 h-10 rounded-xl bg-gray-800 overflow-hidden border border-white/10">
          <img src={MOCK_USER.avatar} alt="Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(MOCK_USER);

  useEffect(() => {
    // Masquage du loader HTML une fois React monté
    const loader = document.getElementById('initial-loader');
    if (loader) loader.style.display = 'none';
  }, []);

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-[#0a0c10] text-white pb-24 md:pb-0 md:pt-20">
          <Navigation />
          
          <main className="max-w-4xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<FeedPage user={user} />} />
              <Route path="/feed" element={<FeedPage user={user} />} />
              <Route path="/profile" element={user ? <ProfilePage currentUser={user} onLogout={async () => setUser(null)} /> : <Link to="/">Se connecter</Link>} />
              <Route path="/map" element={<ActionMap />} />
              <Route path="/live" element={<LiveAssembly />} />
              <Route path="*" element={<FeedPage user={user} />} />
            </Routes>
          </main>

          {/* Bouton de Publication Flottant Desktop */}
          <button className="hidden md:flex fixed bottom-10 right-10 w-16 h-16 bg-blue-600 rounded-full items-center justify-center text-white shadow-3xl hover:scale-110 transition-transform z-50">
            <PlusSquare size={28} />
          </button>
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;
