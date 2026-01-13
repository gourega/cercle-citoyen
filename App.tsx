
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Home, Map, Sparkles, MessageSquare, User as UserIcon, PlusCircle, X } from 'lucide-react';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import ActionMap from './pages/ActionMap';
import LiveAssembly from './pages/LiveAssembly';
import { User, Role, UserCategory } from './types';

// Define Toast types
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Export useToast hook for other components to use
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const MOCK_ME: User = {
  id: 'u-current',
  name: 'Citoyen Ivoirien',
  pseudonym: 'Patriote225',
  bio: 'Engagé pour une Côte d\'Ivoire souveraine.',
  role: Role.MEMBER,
  category: UserCategory.CITIZEN,
  interests: ['Civisme'],
  avatar: 'https://picsum.photos/seed/civ/200/200',
  impactScore: 100
};

const Navigation = () => {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-black border-t border-white/10 p-4 z-50 flex justify-around items-center md:top-0 md:bottom-auto">
      <NavLink to="/feed" className={({isActive}) => isActive ? "text-blue-500" : "text-gray-500"}><Home /></NavLink>
      <NavLink to="/map" className={({isActive}) => isActive ? "text-blue-500" : "text-gray-500"}><Map /></NavLink>
      <NavLink to="/live" className="bg-blue-600 p-3 rounded-full text-white -mt-10 md:mt-0 shadow-lg"><Sparkles /></NavLink>
      <NavLink to="/messages" className={({isActive}) => isActive ? "text-blue-500" : "text-gray-500"}><MessageSquare /></NavLink>
      <NavLink to="/profile" className={({isActive}) => isActive ? "text-blue-500" : "text-gray-500"}><UserIcon /></NavLink>
    </nav>
  );
};

const App: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Function to add a toast message
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Function to manually remove a toast
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // Masquer le splash screen une fois React prêt
    const splash = document.getElementById('splash-screen');
    if (splash) splash.style.display = 'none';
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      <Router>
        <div className="min-h-screen bg-[#0a0c10] text-white">
          <Navigation />
          <main className="max-w-4xl mx-auto px-4 pb-24 pt-6 md:pt-24">
            <Routes>
              <Route path="/" element={<FeedPage user={MOCK_ME} />} />
              <Route path="/feed" element={<FeedPage user={MOCK_ME} />} />
              <Route path="/map" element={<ActionMap />} />
              <Route path="/live" element={<LiveAssembly />} />
              <Route path="/profile" element={<ProfilePage currentUser={MOCK_ME} onLogout={async () => {}} />} />
            </Routes>
          </main>

          {/* Global Toast Container */}
          <div className="fixed top-4 right-4 z-[9999] space-y-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`flex items-center justify-between px-6 py-4 rounded-2xl shadow-2xl min-w-[300px] border border-white/10 backdrop-blur-md animate-in slide-in-from-right duration-300 ${
                  toast.type === 'success' ? 'bg-emerald-600/90' : 
                  toast.type === 'error' ? 'bg-rose-600/90' : 'bg-blue-600/90'
                } text-white`}
              >
                <span className="font-bold text-sm">{toast.message}</span>
                <button onClick={() => removeToast(toast.id)} className="ml-4 hover:opacity-70 transition-opacity">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Router>
    </ToastContext.Provider>
  );
};

export default App;
