import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Role } from '../types';
import { 
  LogOut, Loader2, X, Save, PenLine, Crown, User as UserIcon, AtSign, FileText, Camera, Upload, 
  ImageIcon, ShieldCheck, Scale, TreeDeciduous, DraftingCompass, Sparkles, RefreshCw, CheckCircle,
  Award, Medal, Star, ShieldAlert, Zap
} from 'lucide-react';
import { supabase, isRealSupabase, db } from '../lib/supabase';
import { useToast } from '../App';
import { MOCK_USERS, ADMIN_ID } from '../lib/mocks';

const CitizenAvatar: React.FC<{ url?: string; name: string; size?: string; className?: string }> = ({ url, name, size = "w-40 h-40", className = "" }) => {
  const [error, setError] = useState(false);
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "??";
  if (!url || url.trim() === "" || error) {
    return (
      <div className={`${size} aspect-square shrink-0 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-serif font-bold text-4xl shadow-2xl border-8 border-white ${className}`}>
        {initials}
      </div>
    );
  }
  return (
    <div className={`${size} aspect-square shrink-0 rounded-[2.5rem] border-8 border-white shadow-2xl overflow-hidden bg-gray-100 ${className}`}>
      <img src={url} alt={name} onError={() => setError(true)} className="w-full h-full object-cover" />
    </div>
  );
};

const ProfilePage: React.FC<{ currentUser: User; onLogout: () => Promise<void>; onProfileUpdate?: (updates: Partial<User>) => void }> = ({ currentUser, onLogout, onProfileUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { addToast } = useToast();

  const fetchProfile = async () => {
    setLoading(true);
    const targetId = id || currentUser.id;
    
    // Initialisation avec les données locales (Mocks inclus)
    let currentProfileState = { ...currentUser, avatar_url: currentUser.avatar, impact_score: currentUser.impact_score || currentUser.impactScore || 0 };

    // Si c'est le Gardien et qu'on est sur son profil, on s'assure qu'il a son score de fondateur par défaut
    if (targetId === ADMIN_ID && currentProfileState.impact_score === 0) {
      currentProfileState.impact_score = MOCK_USERS[ADMIN_ID].impact_score;
    }

    setProfile(currentProfileState);

    try {
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', targetId).maybeSingle();
        if (data) {
          // Fusion intelligente : On garde le score le plus haut si c'est le nôtre (protection du prestige)
          const finalScore = (targetId === currentUser.id) 
            ? Math.max(data.impact_score || 0, currentProfileState.impact_score)
            : (data.impact_score || 0);

          setProfile({ 
            ...data, 
            avatar: data.avatar_url || data.avatar, 
            impact_score: finalScore 
          });
        }
      }
    } catch (e) {
      console.error("Erreur de récupération profil:", e);
    } finally { 
      setLoading(false); 
    }
  };

  const forceSync = async () => {
    if (!isRealSupabase || !supabase || syncing) return;
    setSyncing(true);
    try {
      const dbUpdates = {
        id: profile.id,
        name: profile.name,
        pseudonym: profile.pseudonym,
        bio: profile.bio || "Citoyen du Cercle",
        avatar_url: profile.avatar || profile.avatar_url,
        impact_score: profile.impact_score || 0,
        role: profile.role
      };

      // Upsert pour s'assurer que le profil existe dans Supabase
      const { error } = await supabase.from('profiles').upsert([dbUpdates]);
      
      if (error) throw error;
      
      addToast("Synchronisation Cloud réussie ! Prestige sauvegardé.", "success");
    } catch (e: any) {
      addToast(`Erreur : ${e.message}`, "error");
    } finally { setSyncing(false); }
  };

  useEffect(() => { fetchProfile(); }, [id, currentUser.id]);

  if (loading && !profile) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;

  const isOwnProfile = profile?.id === currentUser.id;
  const isGuardian = profile?.role === Role.SUPER_ADMIN || profile?.role === 'Gardien';
  const impactScore = profile?.impact_score || 0;

  // Définition des badges basés sur le score
  const badges = [
    { id: 'founder', label: 'Fondateur', icon: <Crown className="text-amber-500" />, active: isGuardian, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { id: 'builder', label: 'Bâtisseur', icon: <Medal className="text-blue-500" />, active: impactScore >= 1000, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'pioneer', label: 'Éclaireur', icon: <Zap className="text-emerald-500" />, active: impactScore >= 5000, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { id: 'verified', label: 'Identité Vérifiée', icon: <ShieldCheck className="text-indigo-500" />, active: true, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className={`bg-white rounded-[4rem] border ${isGuardian ? 'border-amber-200 shadow-2xl shadow-amber-50' : 'border-gray-100 shadow-sm'} overflow-hidden relative`}>
        
        {/* Banner Section */}
        <div className={`h-64 relative overflow-hidden ${isGuardian ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/shattered.png')]"></div>
           <div className="absolute top-8 left-8 flex items-center gap-3 px-4 py-2 bg-black/20 backdrop-blur-xl rounded-full border border-white/20">
              <div className={`w-2 h-2 rounded-full ${isRealSupabase ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-white">
                {isRealSupabase ? 'Liaison Cloud Active' : 'Mode Hors-Ligne'}
              </span>
           </div>
           {isGuardian && (
             <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
               <Crown size={14} className="text-amber-300" />
               <span className="text-[9px] font-black uppercase tracking-widest text-white">Autorité Suprême</span>
             </div>
           )}
        </div>

        <div className="px-10 pb-12 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left">
              <CitizenAvatar url={profile.avatar || profile.avatar_url} name={profile.name} className="ring-8 ring-white" />
              <div className="pb-4">
                <h1 className="text-4xl font-serif font-bold text-gray-900 mb-1">{profile.name}</h1>
                <p className="text-gray-400 font-bold text-base tracking-wide flex items-center justify-center md:justify-start gap-2">
                  <AtSign size={16} /> {profile.pseudonym}
                </p>
              </div>
            </div>
            
            {isOwnProfile && (
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={forceSync} 
                  disabled={syncing} 
                  className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 border border-emerald-100 shadow-sm"
                >
                   {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sync Cloud
                </button>
                <button className="px-6 py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl">
                  <PenLine size={16} /> Modifier
                </button>
                <button onClick={onLogout} className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="mt-16 pt-12 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-12">
                <section>
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-gray-400 mb-6 px-1">Présentation</h3>
                  <p className="text-xl leading-relaxed font-medium text-gray-700 whitespace-pre-wrap bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100/50">
                    {profile.bio || "Ce citoyen n'a pas encore rédigé sa présentation."}
                  </p>
                </section>

                <section>
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-gray-400 mb-8 px-1">Distinctions Citoyennes</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {badges.filter(b => b.active).map(badge => (
                      <div key={badge.id} className={`flex flex-col items-center justify-center p-6 rounded-3xl border ${badge.color} transition-transform hover:scale-105`}>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                          {/* Fix: cast element to React.ReactElement<any> to allow 'size' prop and resolve TypeScript error */}
                          {React.cloneElement(badge.icon as React.ReactElement<any>, { size: 24 })}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
            </div>

            <aside className="space-y-8">
              <div className="p-10 bg-gray-950 text-white rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <h3 className="font-black text-[10px] uppercase tracking-[0.4em] mb-6 text-blue-400 relative z-10">INDICE D'IMPACT</h3>
                <div className="text-7xl font-serif font-bold mb-4 relative z-10 text-white">
                  {impactScore.toLocaleString()}
                </div>
                <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em] relative z-10">POINTS CITOYENS</p>
                
                {impactScore > 0 && (
                  <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-black uppercase">
                      <Star size={14} className="fill-current" /> Citoyen d'Élite
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 border-dashed">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">Statistiques Civiques</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Réflexions', val: profile.civicStats?.thought || 0, color: 'bg-blue-400' },
                    { label: 'Palabres', val: profile.civicStats?.link || 0, color: 'bg-purple-400' },
                    { label: 'Actions', val: profile.civicStats?.action || 0, color: 'bg-emerald-400' }
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                        <span>{stat.label}</span>
                        <span className="text-gray-400">{stat.val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <div className={`h-full ${stat.color} transition-all duration-1000`} style={{ width: `${stat.val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;