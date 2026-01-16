
import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import SentinelPage from './pages/SentinelPage';
import AdminDashboard from './pages/AdminDashboard';
import CirclesDiscoveryPage from './pages/CirclesDiscoveryPage';
import CirclePage from './pages/CirclePage';
import ActionMap from './pages/ActionMap';
import IdeaBankPage from './pages/IdeaBankPage';
import GovernancePage from './pages/GovernancePage';
import GriotStudio from './pages/GriotStudio';
import ImpactStudio from './pages/ImpactStudio';
import LegislativeCompass from './pages/LegislativeCompass';
import LiveAssembly from './pages/LiveAssembly';
import BusinessPortal from './pages/BusinessPortal';
import ResourceExchange from './pages/ResourceExchange';
import TransparencyLedger from './pages/TransparencyLedger';
import LegalPage from './pages/LegalPage';
import ManifestoPage from './pages/ManifestoPage';
import WelcomePage from './pages/WelcomePage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import QuestsPage from './pages/QuestsPage';
import { User, Role } from './types';
import { supabase } from './lib/supabase';
import GuardianAssistant from './components/GuardianAssistant';

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
    if (!localStorage.getItem('cercle_v4_reset')) {
      localStorage.clear();
      localStorage.setItem('cercle_v4_reset', 'true');
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
            <Route path="/manifesto" element={<ManifestoPage />} />
            <Route path="/welcome" element={user ? <WelcomePage /> : <Navigate to="/" />} />
            
            {/* Flux Principal */}
            <Route path="/feed" element={user ? <FeedPage user={user} /> : <Navigate to="/" />} />
            <Route path="/profile" element={user ? <ProfilePage currentUser={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
            <Route path="/profile/:id" element={user ? <ProfilePage currentUser={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
            
            {/* Écosystème Citoyen */}
            <Route path="/sentinel" element={user ? <SentinelPage user={user} /> : <Navigate to="/" />} />
            <Route path="/circles" element={user ? <CirclesDiscoveryPage /> : <Navigate to="/" />} />
            <Route path="/circle/:type" element={user ? <CirclePage user={user} /> : <Navigate to="/" />} />
            <Route path="/map" element={user ? <ActionMap /> : <Navigate to="/" />} />
            <Route path="/quests" element={user ? <QuestsPage /> : <Navigate to="/" />} />
            <Route path="/ideas" element={user ? <IdeaBankPage /> : <Navigate to="/" />} />
            <Route path="/governance" element={user ? <GovernancePage user={user} /> : <Navigate to="/" />} />
            
            {/* Studios IA */}
            <Route path="/griot" element={user ? <GriotStudio /> : <Navigate to="/" />} />
            <Route path="/studio" element={user ? <ImpactStudio user={user} /> : <Navigate to="/" />} />
            <Route path="/compass" element={user ? <LegislativeCompass /> : <Navigate to="/" />} />
            <Route path="/assembly" element={user ? <LiveAssembly /> : <Navigate to="/" />} />
            
            {/* Économie & Transparence */}
            <Route path="/business" element={user ? <BusinessPortal user={user} /> : <Navigate to="/" />} />
            <Route path="/solidarity" element={user ? <ResourceExchange user={user} /> : <Navigate to="/" />} />
            <Route path="/transparency" element={user ? <TransparencyLedger /> : <Navigate to="/" />} />
            
            {/* Communication */}
            <Route path="/messages" element={user ? <MessagesPage user={user} /> : <Navigate to="/" />} />
            <Route path="/messages/:id" element={user ? <MessagesPage user={user} /> : <Navigate to="/" />} />
            <Route path="/chat" element={user ? <ChatPage user={user} /> : <Navigate to="/" />} />

            {/* Administration (Gardien) */}
            <Route path="/admin" element={user?.role === Role.SUPER_ADMIN ? <AdminDashboard /> : <Navigate to="/feed" />} />
            
            <Route path="/legal" element={<LegalPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          {user && <GuardianAssistant />}

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
