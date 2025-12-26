
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  PenLine,
  CheckCircle2
} from 'lucide-react';
import { MANIFESTO_TEXT } from '../constants';
import { supabase } from '../lib/supabase';
import { UserCategory, Role, User } from '../types';
import Logo from '../Logo';
import { MOCK_USERS, ADMIN_ID } from '../lib/mocks';

const AuthPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    pseudonym: '',
    bio: '',
    email: '',
    password: '',
    category: UserCategory.CITIZEN,
  });

  useEffect(() => {
    const hasRead = sessionStorage.getItem('manifesto_read');
    if (!hasRead) {
      navigate('/manifesto');
    }
  }, [navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulation d'authentification pour la démo
    setTimeout(() => {
      const newUser: User = {
        id: 'u-temp-' + Date.now(),
        name: formData.name || "Citoyen Démo",
        pseudonym: formData.pseudonym || "citoyen",
        bio: formData.bio || "Engagé pour la cité.",
        role: Role.MEMBER,
        category: formData.category,
        interests: [],
        avatar: `https://picsum.photos/seed/${formData.pseudonym || 'seed'}/150/150`,
        impactScore: 0
      };
      
      onLogin(newUser);
      navigate('/welcome');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:flex md:w-1/2 bg-gray-950 p-20 flex-col justify-between text-white relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="z-10">
           <Link to="/manifesto" className="flex items-center text-gray-400 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest">
             <ArrowLeft size={14} className="mr-2" /> Retour au Manifeste
           </Link>
        </div>
        <div className="z-10">
          <Logo size={60} variant="light" showText />
          <h2 className="text-6xl font-serif font-bold mt-12 mb-8 leading-tight">L'entrée <br />du Cercle.</h2>
          <p className="text-gray-400 text-xl max-w-md leading-relaxed">
            Citoyen, entrepreneur ou acteur social. Votre identité numérique au service du territoire commence ici.
          </p>
        </div>
        <div className="z-10 flex items-center gap-6">
          <div className="w-16 h-1 bg-blue-600"></div>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-400">Penser • Relier • Agir</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50/50">
        <div className="max-w-md w-full">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-12">
                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl mb-8">
                  <Sparkles size={32} />
                </div>
                <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Rejoindre la Cité</h1>
                <p className="text-gray-500 font-medium">Inscrivez votre identité citoyenne.</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      required 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Nom complet" 
                      className="w-full bg-white border border-gray-100 py-5 pl-14 pr-6 rounded-[1.5rem] outline-none shadow-sm focus:ring-4 focus:ring-blue-50 transition-all" 
                    />
                  </div>
                  <div className="relative">
                    <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      required 
                      type="text" 
                      value={formData.pseudonym}
                      onChange={e => setFormData({...formData, pseudonym: e.target.value})}
                      placeholder="Pseudonyme unique" 
                      className="w-full bg-white border border-gray-100 py-5 pl-14 pr-6 rounded-[1.5rem] outline-none shadow-sm focus:ring-4 focus:ring-blue-50 transition-all" 
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      required 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="Email citoyen" 
                      className="w-full bg-white border border-gray-100 py-5 pl-14 pr-6 rounded-[1.5rem] outline-none shadow-sm focus:ring-4 focus:ring-blue-50 transition-all" 
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-gray-900 text-white py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl">Continuer</button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10 text-center">
                 <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                    <ShieldCheck size={40} />
                 </div>
                 <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Engagement</h2>
                 <p className="text-gray-500 text-sm">Le dernier pas avant d'entrer.</p>
              </div>
              
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 mb-8 space-y-4 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Règles d'Honneur</p>
                {MANIFESTO_TEXT.rules.map((rule, i) => (
                  <div key={i} className="flex gap-4 text-xs text-gray-700 font-bold leading-relaxed text-left">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    {rule}
                  </div>
                ))}
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <label className="flex items-start gap-4 cursor-pointer group text-left">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-5 w-5 mt-0.5 cursor-pointer accent-blue-600" />
                  <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors leading-relaxed">
                    Je jure sur mon honneur de citoyen de respecter ces règles et de contribuer à la paix de la Cité.
                  </span>
                </label>
                <button 
                  type="submit" 
                  disabled={!agreed || loading} 
                  className="w-full bg-blue-600 text-white py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] disabled:opacity-30 shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" /> : null}
                  Entrer dans le Cercle
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-gray-900 transition-colors">Retour</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
