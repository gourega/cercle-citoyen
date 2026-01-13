import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import { User, Role } from './types';
import { supabase } from './lib/supabase';

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
    const saved = localStorage.getItem('cercle_user_v4');
    return saved ? JSON.parse(saved) : null;
  });

  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    // FORCE RESET DES ANCIENNES VERSIONS
    if (!localStorage.getItem('cercle_v4_reset')) {
      localStorage.clear();
      localStorage.setItem('cercle_v4_reset', 'true');
      console.log("NETTOYAGE SYSTÈME V4 EFFECTUÉ");
    }
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('cercle_user_v4', JSON.stringify(newUser));
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('cercle_user_v4');
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <Router>
        <div className="min-h-screen bg-[#0a0c10] text-white">
          <Routes>
            <Route path="/" element={<LandingPage onLogin={handleLogin} />} />
            <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
            <Route path="/feed" element={user ? <FeedPage user={user} /> : <Navigate to="/" />} />
            <Route path="/profile" element={user ? <ProfilePage currentUser={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          {/* Toast UI */}
          <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
            {toasts.map(t => (
              <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-2xl border text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right duration-300 ${
                t.type === 'error' ? 'bg-rose-950 border-rose-500 text-rose-200' : 'bg-blue-950 border-blue-500 text-blue-200'
              }`}>
                {t.message}
              </div>
            ))}
          </div>
        </div>
      </Router>
    </ToastContext.Provider>
  );
};

export default App;