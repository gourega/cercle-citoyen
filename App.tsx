
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import AuthPage from './pages/AuthPage.tsx';
import FeedPage from './pages/FeedPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import SentinelPage from './pages/SentinelPage.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import CirclesDiscoveryPage from './pages/CirclesDiscoveryPage.tsx';
import CirclePage from './pages/CirclePage.tsx';
import ActionMap from './pages/ActionMap.tsx';
import IdeaBankPage from './pages/IdeaBankPage.tsx';
import GovernancePage from './pages/GovernancePage.tsx';
import GriotStudio from './pages/GriotStudio.tsx';
import ImpactStudio from './pages/ImpactStudio.tsx';
import LegislativeCompass from './pages/LegislativeCompass.tsx';
import LiveAssembly from './pages/LiveAssembly.tsx';
import BusinessPortal from './pages/BusinessPortal.tsx';
import ResourceExchange from './pages/ResourceExchange.tsx';
import TransparencyLedger from './pages/TransparencyLedger.tsx';
import LegalPage from './pages/LegalPage.tsx';
import ManifestoPage from './pages/ManifestoPage.tsx';
import WelcomePage from './pages/WelcomePage.tsx';
import MessagesPage from './pages/MessagesPage.tsx';
import ChatPage from './pages/ChatPage.tsx';
import QuestsPage from './pages/QuestsPage.tsx';
import { User, Role } from './types.ts';
import { supabase } from './lib/supabase.ts';
import { ToastProvider } from './ToastContext.tsx';
import GuardianAssistant from './components/GuardianAssistant.tsx';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cercle_user_v4');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!localStorage.getItem('cercle_v4_reset')) {
      localStorage.clear();
      localStorage.setItem('cercle_v4_reset', 'true');
    }
  }, []);

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
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-[#0a0c10] text-white">
          <Routes>
            <Route path="/" element={<LandingPage onLogin={handleLogin} />} />
            <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
            <Route path="/manifesto" element={<ManifestoPage />} />
            <Route path="/welcome" element={user ? <WelcomePage /> : <Navigate to="/" />} />
            
            <Route path="/feed" element={user ? <FeedPage user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
            <Route path="/profile" element={user ? <ProfilePage currentUser={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
            <Route path="/profile/:id" element={user ? <ProfilePage currentUser={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
            
            <Route path="/sentinel" element={user ? <SentinelPage user={user} /> : <Navigate to="/" />} />
            <Route path="/circles" element={user ? <CirclesDiscoveryPage /> : <Navigate to="/" />} />
            <Route path="/circle/:type" element={user ? <CirclePage user={user} /> : <Navigate to="/" />} />
            <Route path="/map" element={user ? <ActionMap /> : <Navigate to="/" />} />
            <Route path="/quests" element={user ? <QuestsPage /> : <Navigate to="/" />} />
            <Route path="/ideas" element={user ? <IdeaBankPage /> : <Navigate to="/" />} />
            <Route path="/governance" element={user ? <GovernancePage user={user} /> : <Navigate to="/" />} />
            
            <Route path="/griot" element={user ? <GriotStudio /> : <Navigate to="/" />} />
            <Route path="/studio" element={user ? <ImpactStudio user={user} /> : <Navigate to="/" />} />
            <Route path="/compass" element={user ? <LegislativeCompass /> : <Navigate to="/" />} />
            <Route path="/assembly" element={user ? <LiveAssembly /> : <Navigate to="/" />} />
            
            <Route path="/business" element={user ? <BusinessPortal user={user} /> : <Navigate to="/" />} />
            <Route path="/solidarity" element={user ? <ResourceExchange user={user} /> : <Navigate to="/" />} />
            <Route path="/transparency" element={user ? <TransparencyLedger /> : <Navigate to="/" />} />
            
            <Route path="/messages" element={user ? <MessagesPage user={user} /> : <Navigate to="/" />} />
            <Route path="/messages/:id" element={user ? <MessagesPage user={user} /> : <Navigate to="/" />} />
            <Route path="/chat" element={user ? <ChatPage user={user} /> : <Navigate to="/" />} />

            <Route path="/admin" element={user?.role === Role.SUPER_ADMIN ? <AdminDashboard /> : <Navigate to="/feed" />} />
            
            <Route path="/legal" element={<LegalPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          {user && <GuardianAssistant />}
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;
