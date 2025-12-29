
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { User, Role } from '../types';
import { 
  LogOut, Loader2, Save, PenLine, Crown, AtSign, RefreshCw, CheckCircle,
  Award, Medal, Star, ShieldCheck, Zap, X, Camera, Upload, 
  Flame, Handshake, Heart, ShieldAlert, Sparkles
} from 'lucide-react';
import { supabase, isRealSupabase } from '../lib/supabase';
import { useToast } from '../App';
import { MOCK_USERS, ADMIN_ID } from '../lib/mocks';

const CitizenAvatar: React.FC<{ url?: string; name: string; size?: string; className?: string; isEditing?: boolean; onUploadClick?: () => void }> = ({ url, name, size = "w-40 h-40", className = "", isEditing, onUploadClick }) => {
  const [error, setError] = useState(false);
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "??";
  
  const displayContent = () => {
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

  return (
    <div className="relative group cursor-pointer" onClick={isEditing ? onUploadClick : undefined}>
      {displayContent()}
      {isEditing && (
        <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white border-8 border-white/20">
          <Camera size={32} />
          <span className="text-[8px] font-black uppercase mt-2">Changer</span>
        </div>
      )}
    </div>
  );
};

const Badge: React.FC<{ icon: React.ReactNode, label: string, color: string, description: string }> = ({ icon, label, color, description }) => (
  <div className="group relative flex flex-col items-center">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white shadow-lg ${color} group-hover:scale-110 group-hover:-rotate-12`}>
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase tracking-widest mt-3 text-gray-400 group-hover:text-gray-900 transition-colors">{label}</span>
    
    {/* Tooltip */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-40 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
      <div className="bg-gray-900 text-white p-3 rounded-xl text-[9px] font-bold text-center leading-relaxed shadow-2xl">
        {description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  </div>
);

const ProfilePage: React.FC<{ currentUser: User; onLogout: () => Promise<void>; onProfileUpdate?: (updates: Partial<User>) => void }> = ({ currentUser, onLogout, onProfileUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editData, setEditData] = useState({
    name: '',
    pseudonym: '',
    bio: '',
    avatar: ''
  });

  const fetchProfile = async () => {
    setLoading(true);
    const targetId = id || currentUser.id;
    let currentProfileState = { ...currentUser, avatar_url: currentUser.avatar, impact_score: currentUser.impact_score || currentUser.impactScore || 0 };

    if (targetId === ADMIN_ID && currentProfileState.impact_score === 0) {
      currentProfileState.impact_score = MOCK_USERS[ADMIN_ID].impact_score;
    }

    setProfile(currentProfileState);
    setEditData({
      name: currentProfileState.name,
      pseudonym: currentProfileState.pseudonym,
      bio: currentProfileState.bio,
      avatar: currentProfileState.avatar
    });

    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('profiles').select('*').eq('id', targetId).maybeSingle();
        if (data) {
          const finalScore = (targetId === currentUser.id) 
            ? Math.max(data.impact_score || 0, currentProfileState.impact_score)
            : (data.impact_score || 0);

          const fetchedProfile = { 
            ...data, 
            avatar: data.avatar_url || data.avatar, 
            impact_score: finalScore 
          };
          setProfile(fetchedProfile);
          if (targetId === currentUser.id) {
            setEditData({
              name: fetchedProfile.name,
              pseudonym: fetchedProfile.pseudonym,
              bio: fetchedProfile.bio,
              avatar: fetchedProfile.avatar
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally { 
      setLoading(false); 
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, avatar: reader.result as string });
        addToast("Nouvelle photo chargée !", "info");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSyncing(true);
    try {
      const updates = {
        name: editData.name,
        pseudonym: editData.pseudonym,
        bio: editData.bio,
        avatar_url: editData.avatar
      };

      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
        if (error) throw error;
      }

      const updatedProfile = { ...profile, ...updates, avatar: editData.avatar };
      setProfile(updatedProfile);
      
      if (profile.id === currentUser.id) {
        const saved = localStorage.getItem('cercle_user');
        if (saved) {
          const user = JSON.parse(saved);
          localStorage.setItem('cercle_user', JSON.stringify({ ...user, ...updates, avatar: editData.avatar }));
        }
        if (onProfileUpdate) onProfileUpdate(updatedProfile);
      }

      addToast("Profil mis à jour avec succès !", "success");
      setIsEditing(false);
    } catch (e: any) {
      addToast(`Erreur : ${e.message}`, "error");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [id, currentUser.id]);

  if (loading && !profile) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;

  const isOwnProfile = profile?.id === currentUser.id;
  const isGuardian = profile?.role === Role.SUPER_ADMIN || profile?.role === 'Gardien';
  const impactScore = profile?.impact_score || 0;

  // Calcul des badges basés sur le score ou le rôle
  const badges = [
    { icon: <ShieldCheck size={24} />, label: "Pionnier", color: "bg-emerald-500 text-white", description: "Fait partie des 100 premiers membres fondateurs du Cercle." },
    { icon: <Medal size={24} />, label: "Acteur", color: "bg-blue-500 text-white", description: "A complété plus de 5 quêtes sur le terrain." },
    ...(impactScore >= 5000 ? [{ icon: <Flame size={24} />, label: "Impactant", color: "bg-orange-500 text-white", description: "A généré un impact social certifié majeur." }] : []),
    ...(isGuardian ? [{ icon: <Crown size={24} />, label: "Gardien", color: "bg-amber-500 text-white", description: "Détenteur de la Sagesse et garant de la cohésion." }] : []),
    { icon: <Heart size={24} />, label: "Solidaire", color: "bg-rose-500 text-white", description: "A effectué au moins un don via le Marché de Solidarité." }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className={`bg-white rounded-[4rem] border ${isGuardian ? 'border-amber-200 shadow-2xl shadow-amber-50' : 'border-gray-100 shadow-sm'} overflow-hidden relative`}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        
        <div className={`h-64 relative overflow-hidden ${isGuardian ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/shattered.png')]"></div>
           <div className="absolute top-8 left-8 flex items-center gap-3 px-4 py-2 bg-black/20 backdrop-blur-xl rounded-full border border-white/20">
              <div className={`w-2 h-2 rounded-full ${isRealSupabase ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-white">
                {isRealSupabase ? 'Liaison Cloud Active' : 'Mode Hors-Ligne'}
              </span>
           </div>
        </div>

        <div className="px-10 pb-12 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left">
              <CitizenAvatar 
                url={isEditing ? editData.avatar : (profile.avatar || profile.avatar_url)} 
                name={profile.name} 
                isEditing={isEditing}
                onUploadClick={() => fileInputRef.current?.click()}
                className="ring-8 ring-white" 
              />
              <div className="pb-4 flex-1">
                {isEditing ? (
                  <div className="space-y-4 max-w-sm">
                    <input 
                      value={editData.name}
                      onChange={e => setEditData({...editData, name: e.target.value})}
                      className="text-4xl font-serif font-bold text-gray-900 bg-gray-50 border-b-2 border-blue-600 w-full outline-none p-2"
                      placeholder="Votre nom"
                    />
                    <div className="flex items-center gap-2 text-blue-600">
                      <AtSign size={16} />
                      <input 
                        value={editData.pseudonym}
                        onChange={e => setEditData({...editData, pseudonym: e.target.value})}
                        className="font-bold text-base outline-none bg-transparent border-b border-blue-200"
                        placeholder="Pseudonyme"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-1">{profile.name}</h1>
                    <p className="text-gray-400 font-bold text-base tracking-wide flex items-center justify-center md:justify-start gap-2">
                      <AtSign size={16} /> {profile.pseudonym}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {isOwnProfile && (
              <div className="flex flex-wrap justify-center gap-3">
                {isEditing ? (
                  <>
                    <button onClick={handleSave} disabled={syncing} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-xl">
                      {syncing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Enregistrer
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} className="px-6 py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl">
                      <PenLine size={16} /> Modifier
                    </button>
                    <button onClick={onLogout} className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100">
                      <LogOut size={16} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-16 pt-12 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Colonne Gauche : Bio */}
            <div className="lg:col-span-2 space-y-12">
                <section>
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-gray-400 mb-6 px-1">Présentation</h3>
                  {isEditing ? (
                    <textarea 
                      value={editData.bio}
                      onChange={e => setEditData({...editData, bio: e.target.value})}
                      className="w-full h-48 text-xl leading-relaxed font-medium text-gray-700 bg-gray-50 p-8 rounded-[2.5rem] border-2 border-blue-100 outline-none focus:bg-white transition-all"
                      placeholder="Décrivez votre vision pour la cité..."
                    />
                  ) : (
                    <p className="text-xl leading-relaxed font-medium text-gray-700 whitespace-pre-wrap bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100/50 min-h-[200px]">
                      {profile.bio || "Ce citoyen n'a pas encore rédigé sa présentation."}
                    </p>
                  )}
                </section>
            </div>

            {/* Colonne Droite : Impact & Badges (Toujours visible) */}
            <aside className="space-y-10">
              <div className="p-10 bg-gray-950 text-white rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                  <Zap size={80} />
                </div>
                <h3 className="font-black text-[10px] uppercase tracking-[0.4em] mb-6 text-blue-400 relative z-10">INDICE D'IMPACT</h3>
                <div className="text-7xl font-serif font-bold mb-4 relative z-10 text-white">
                  {impactScore.toLocaleString()}
                </div>
                <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em] relative z-10">POINTS CITOYENS</p>
              </div>

              {/* Section Badges Repositionnée sous l'Impact */}
              <div className="bg-gray-50/50 border border-gray-100 p-8 rounded-[3rem]">
                <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-8 text-center px-1">DÉCORATIONS CITOYENNES</h3>
                <div className="grid grid-cols-3 gap-y-8 gap-x-2">
                  {badges.map((b, i) => (
                    <Badge key={i} {...b} />
                  ))}
                </div>
                
                {badges.length === 0 && (
                  <p className="text-[10px] text-gray-400 italic text-center py-4">Aucune décoration pour le moment.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
