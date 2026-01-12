import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import { User, Role } from './types';
import { supabase } from './lib/supabase';

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
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cercle_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // PURGE DE SÉCURITÉ AU DÉMARRAGE
  useEffect(() => {
    // Si on détecte une erreur persistante dans la console, on peut forcer un clear ici
    console.log("Système Cercle V3 Initialisé");
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('cercle_user', JSON.stringify(newUser));
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('cercle_user');
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <Router>
        <div className="min-h-screen bg-[#0a0c10] text-white selection:bg-blue-500/30">
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage onLogin={handleLogin} />} />
              <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
              <Route path="/feed" element={user ? <FeedPage user={user} /> : <Navigate to="/" />} />
              <Route path="/profile" element={user ? <ProfilePage currentUser={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* Toast Container */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2">
            {toasts.map(toast => (
              <div 
                key={toast.id}
                className={`px-6 py-4 rounded-2xl shadow-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border animate-in slide-in-from-bottom-2 duration-300 ${
                  toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 
                  toast.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-blue-600 border-blue-500'
                }`}
              >
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