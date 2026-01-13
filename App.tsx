
import React, { useState, createContext, useContext, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { 
  Home, Map, Sparkles, MessageSquare, User as UserIcon, 
  Search, Bell, PlusCircle
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

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Fix: Export useToast hook to resolve errors in sub-pages that import it from '../App'
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

// Mock du citoyen actuel
const CURRENT_CITIZEN: User = {
  id: 'u-main',
  name: 'Citoyen Engagé',
  pseudonym: 'Souverain225',
  bio: 'Pour une Côte d\'Ivoire forte et unie par le numérique.',
  role: Role.MEMBER,
  category: UserCategory.CITIZEN,
  interests: ['Tech', 'Social'],
  avatar: 'https://picsum.photos/seed/civ/200/200',
  impactScore: 850
};

const Navigation = () => {
  const tabs = [
    { path: '/feed', icon: Home, label: 'Éveil' },
    { path: '/map', icon: Map, label: 'Territoire' },
    { path: '/live', icon: Sparkles, label: 'L\'Esprit', special: true },
    { path: '/messages', icon: MessageSquare, label: 'Palabres' },
    { path: '/profile', icon: UserIcon, label: 'Profil' }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#0a0c10]/90 backdrop-blur-xl border-t border-white/5 px-2 pb-8 pt-2 z-50 flex justify-around items-center md:top-0 md:bottom-auto md:px-20 md:py-4 md:border-b">
      <div className="hidden md:flex items-center gap-2 mr-auto">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">C</div>
        <span className="font-bold tracking-tighter text-xl italic">CERCLE<span className="text-blue-500">.CI</span></span>
      </div>

      <div className="flex justify-around items-center w-full md:w-auto md:gap-12">
        {tabs.map((tab) => (
          <NavLink 
            key={tab.path} 
            to={tab.path}
            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${
              tab.special 
                ? 'bg-blue-600 p-4 rounded-2xl -mt-10 shadow-xl shadow-blue-600/40 text-white scale-110' 
                : isActive ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <tab.icon size={tab.special ? 24 : 22} />
            {!tab.special && <span className="text-[9px] font-bold uppercase tracking-widest md:hidden">{tab.label}</span>}
          </NavLink>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-6 ml-auto">
        <button className="text-gray-400 hover:text-white"><Search size={20}/></button>
        <button className="text-gray-400 hover:text-white"><Bell size={20}/></button>
        <div className="w-10 h-10 rounded-xl bg-gray-800 border border-white/10 overflow-hidden">
          <img src={CURRENT_CITIZEN.avatar} alt="Me" className="w-full h-full object-cover" />
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Function to add a toast notification
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      <Router>
        <div className="min-h-screen bg-[#0a0c10] text-white">
          <Navigation />
          
          <main className="max-w-4xl mx-auto px-4 pt-4 pb-32 md:pt-28">
            <Routes>
              <Route path="/" element={<FeedPage user={CURRENT_CITIZEN} />} />
              <Route path="/feed" element={<FeedPage user={CURRENT_CITIZEN} />} />
              <Route path="/map" element={<ActionMap />} />
              <Route path="/live" element={<LiveAssembly />} />
              <Route path="/profile" element={<ProfilePage currentUser={CURRENT_CITIZEN} onLogout={async () => {}} />} />
            </Routes>
          </main>

          {/* Bouton de création flottant (Mobile) */}
          <button className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl z-40 active:scale-90 transition-transform">
            <PlusCircle size={28} />
          </button>

          {/* Toast Notification Container */}
          <div className="fixed top-24 right-4 z-[999] space-y-2 pointer-events-none">
            {toasts.map(toast => (
              <div 
                key={toast.id} 
                className={`p-4 rounded-2xl shadow-2xl text-white font-bold text-[10px] uppercase tracking-[0.2em] border border-white/10 animate-in slide-in-from-right duration-500 pointer-events-auto flex items-center gap-3 ${
                  toast.type === 'error' ? 'bg-rose-600/90 backdrop-blur-xl' : toast.type === 'success' ? 'bg-emerald-600/90 backdrop-blur-xl' : 'bg-blue-600/90 backdrop-blur-xl'
                }`}
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                {toast.message}
              </div>
            ))}
          </div>
        </div>
      </Router>
    </ToastContext.Provider>
  );
};

export default App;
