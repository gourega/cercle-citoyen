
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ShieldCheck, 
  Loader2, 
  Shield,
  ArrowLeft,
  Fingerprint,
  Users
} from 'lucide-react';
import Logo from '../Logo.tsx';
import { User, Role, UserCategory } from '../types.ts';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { useToast } from '../App.tsx';

const LandingPage = ({ onLogin, user }: { onLogin: (user: User) => void, user: User | null }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRealSupabase && supabase) {
        const { data: authData, error: authError } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (authError) throw authError;

        if (authData.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
          if (profile) {
            const loggedInUser: User = {
              id: profile.id,
              name: profile.name,
              pseudonym: profile.pseudonym,
              email: profile.email,
              bio: profile.bio,
              role: profile.role as Role,
              category: (profile.category as UserCategory) || UserCategory.CITIZEN,
              interests: [],
              avatar: profile.avatar_url,
              impactScore: profile.impact_score || 0
            };
            onLogin(loggedInUser);
            navigate('/feed');
          }
        }
      } else {
        setError('Accès restreint en mode maintenance.');
        setLoading(false);
      }
    } catch (err: any) {
      setError("Identifiants incorrects ou accès non autorisé.");
      setLoading(false);
    }
  };

  const handleSolicitCouncil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRealSupabase && supabase) {
        // On signale au Conseil via le statut du profil
        // Note: En production, on utiliserait une table de requêtes d'assistance dédiée
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ status: 'recovery_requested' })
          .eq('email', email);
        
        // On affiche le succès pour confirmer que la demande est partie
        setRecoverySuccess(true);
        addToast("Alerte transmise au Conseil.", "success");
      } else {
        setRecoverySuccess(true);
      }
    } catch (err: any) {
      setError("Le signal n'a pu être transmis au Conseil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fcfcfc] overflow-x-hidden flex flex-col items-center page-transition">
      <header className="relative z-20 pt-20 mb-20 flex flex-col items-center gap-10 text-center animate-in fade-in duration-1000">
        <Logo size={80} showText={true} variant="blue" />
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10">
            <Shield size={16} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Souveraineté .CI Certifiée
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center text-center">
        <div className="w-full max-w-[540px] mb-40 animate-in fade-in slide-in-from-bottom-20 duration-1000">
          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-50 p-10 md:p-20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
              <Fingerprint size={160} className="text-blue-600" />
            </div>
            
            <div className="text-left mb-16 relative z-10">
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
                {isRecoveryMode ? "Aide du Conseil" : "Authentification"}
              </h2>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600">
                {isRecoveryMode ? "PROCÉDURE D'URGENCE MANUELLE" : "PORTAIL CITOYEN SÉCURISÉ"}
              </p>
            </div>

            {recoverySuccess ? (
              <div className="text-left animate-in zoom-in duration-500 space-y-8 relative z-10">
                <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 shadow-inner">
                  <Users size={40} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-serif font-bold text-gray-900">Demande prise en compte</h3>
                  <p className="text-gray-500 leading-relaxed font-medium">
                    Votre appel a été déposé au pied du **Conseil des Gardiens**. 
                  </p>
                  <p className="text-gray-600 leading-relaxed font-medium italic">
                    Un administrateur va vérifier votre identité citoyenne et vous transmettra un **mot de passe provisoire** par vos canaux habituels.
                  </p>
                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                    <p className="text-[10px] font-black uppercase text-blue-600 mb-2">Note de sécurité</p>
                    <p className="text-xs text-blue-900 font-bold leading-relaxed">
                      Aucun e-mail automatique n'est envoyé. La sécurité du Cercle repose sur la validation humaine.
                    </p>
                  </div>
                </div>
                <button onClick={() => { setIsRecoveryMode(false); setRecoverySuccess(false); }} className="w-full py-6 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                  RETOUR À L'ENTRÉE
                </button>
              </div>
            ) : (
              <form onSubmit={isRecoveryMode ? handleSolicitCouncil : handleLogin} className="space-y-8 relative z-10">
                {error && <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center gap-4 text-rose-600 text-xs font-bold animate-in shake"><AlertCircle size={20} /> {error}</div>}
                
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Votre Email Citoyen" className="w-full bg-gray-50 border-2 border-transparent py-8 pl-18 pr-8 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-8 focus:ring-blue-50/50 transition-all font-bold" />
                  </div>

                  {!isRecoveryMode && (
                    <div className="relative group">
                      <Lock className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Mot de passe" 
                        className="w-full bg-gray-50 border-2 border-transparent py-8 pl-18 pr-20 rounded-[2rem] outline-none focus:bg-white focus:border-blue-100 focus:ring-8 focus:ring-blue-50/50 transition-all font-bold" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors">{showPassword ? <EyeOff size={22} /> : <Eye size={22} />}</button>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading} className={`w-full py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-3xl active:scale-95 disabled:opacity-50 ${isRecoveryMode ? 'bg-amber-600 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'} text-white hover:bg-black`}>
                  {loading ? <Loader2 className="animate-spin" size={20} /> : isRecoveryMode ? "SOLLICITER LE CONSEIL" : "ENTRER DANS LE CERCLE"}
                </button>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <button type="button" onClick={() => setIsRecoveryMode(!isRecoveryMode)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-2">
                    {isRecoveryMode ? <ArrowLeft size={14} /> : <ShieldCheck size={14} />} {isRecoveryMode ? "RETOUR" : "ACCÈS BLOQUÉ / OUBLIÉ ?"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
