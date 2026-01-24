
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Role } from '../types.ts';
import { 
  LogOut, Loader2, Save, Pencil, Crown, AtSign, ShieldCheck, Zap, Camera, 
  Flame, Heart, Sparkles, Medal, Shield, UserPlus, UserCheck, MessageSquare, 
  Lock, Eye, EyeOff, ChevronLeft, Award
} from 'lucide-react';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { useToast } from '../ToastContext.tsx';
import { ADMIN_ID, MOCK_USERS } from '../lib/mocks.ts';

const CitizenAvatar: React.FC<{ url?: string; name: string; size?: string; className?: string; isEditing?: boolean; onUploadClick?: () => void; isGuardian?: boolean }> = ({ url, name, size = "w-40 h-40", className = "", isEditing, onUploadClick, isGuardian }) => {
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
      {isGuardian && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-3 rounded-2xl border-4 border-white shadow-lg animate-in zoom-in duration-700">
           <Crown size={20} />
        </div>
      )}
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
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 border-white shadow-sm ${color} group-hover:scale-110 group-hover:shadow-md`}>
      {icon}
    </div>
    <span className="text-[7px] font-black uppercase tracking-widest mt-2 text-gray-400 group-hover:text-gray-900 text-center leading-tight">{label}</span>
    
    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-32 p-3 bg-gray-900 text-white text-[8px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl text-center font-medium">
      {description}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const ProfilePage: React.FC<{ currentUser: User; onLogout: () => Promise<void>; onProfileUpdate?: (updates: Partial<User>) => void }> = ({ currentUser, onLogout, onProfileUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [showPwdFields, setShowPwdFields] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editData, setEditData] = useState({ name: '', pseudonym: '', bio: '', avatar: '' });

  const fetchProfile = async () => {
    setLoading(true);
    const targetId = id || currentUser.id;
    
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('profiles').select('*').eq('id', targetId).maybeSingle();
        if (data) {
          const score = data.impact_score ?? 0;
          const fetchedProfile = { ...data, avatar: data.avatar_url || data.avatar, impact_score: score };
          setProfile(fetchedProfile);
          if (targetId === currentUser.id) {
            setEditData({ name: fetchedProfile.name, pseudonym: fetchedProfile.pseudonym, bio: fetchedProfile.bio, avatar: fetchedProfile.avatar });
          }
        } else handleMockFallback(targetId);
      } else handleMockFallback(targetId);
    } catch (e) { handleMockFallback(targetId); } finally { setLoading(false); }
  };

  const handleMockFallback = (targetId: string) => {
    const mockUser = MOCK_USERS[targetId] || (targetId === currentUser.id ? currentUser : null);
    if (mockUser) {
      setProfile({ ...mockUser, impact_score: mockUser.impact_score ?? 120 });
      if (targetId === currentUser.id) {
        setEditData({ name: mockUser.name, pseudonym: mockUser.pseudonym, bio: mockUser.bio, avatar: mockUser.avatar });
      }
    }
  };

  const handleSave = async () => {
    setSyncing(true);
    try {
      const updates = { name: editData.name, pseudonym: editData.pseudonym, bio: editData.bio, avatar_url: editData.avatar };
      if (isRealSupabase && supabase) await supabase.from('profiles').update(updates).eq('id', profile.id);
      const updatedProfile = { ...profile, ...updates, avatar: editData.avatar };
      setProfile(updatedProfile);
      if (profile.id === currentUser.id && onProfileUpdate) onProfileUpdate(updatedProfile);
      addToast("Profil mis à jour !", "success");
      setIsEditing(false);
    } catch (e: any) { addToast("Erreur de sauvegarde", "error"); } finally { setSyncing(false); }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      addToast("Mot de passe trop court (min. 6).", "error");
      return;
    }
    setPwdLoading(true);
    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        addToast("Mot de passe mis à jour !", "success");
        setNewPassword('');
        setShowPwdFields(false);
      }
    } catch (e: any) { addToast("Échec de la mise à jour.", "error"); } finally { setPwdLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, [id, currentUser.id]);

  if (loading && !profile) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;

  const isOwnProfile = profile?.id === currentUser.id;
  const isGuardian = profile?.role === Role.SUPER_ADMIN;
  const impactScoreValue = profile?.id === ADMIN_ID ? 19740 : (profile?.impact_score || 0);

  const renderBadges = () => {
    const badges = [];
    badges.push({ icon: <Award size={20} />, label: "Graine", color: "bg-blue-50 text-blue-500", description: "Membre vérifié de la Nation numérique." });
    if (impactScoreValue > 100) badges.push({ icon: <MessageSquare size={20} />, label: "Agora", color: "bg-indigo-50 text-indigo-500", description: "Citoyen dont la parole porte au sein des Cercles." });
    if (impactScoreValue > 500) badges.push({ icon: <ShieldCheck size={20} />, label: "Sentinelle", color: "bg-emerald-50 text-emerald-500", description: "Contributeur actif à la protection du territoire." });
    if (impactScoreValue > 5000) badges.push({ icon: <Zap size={20} />, label: "Pilier", color: "bg-orange-50 text-orange-500", description: "Soutien majeur de l'infrastructure souveraine." });
    if (isGuardian) badges.push({ icon: <Crown size={20} />, label: "Gardien", color: "bg-amber-100 text-amber-600", description: "Garant du Sceau et de la cohésion nationale." });

    return (
      <div className="flex flex-wrap gap-4 mt-6">
        {badges.map((b, i) => <Badge key={i} {...b} />)}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className="mb-8">
        <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 font-bold text-sm group">
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour Agora
        </Link>
      </div>

      <div className={`bg-white rounded-[4rem] border ${isGuardian ? 'border-amber-200 shadow-2xl shadow-amber-50/50' : 'border-gray-100 shadow-sm'} overflow-hidden relative`}>
        <input type="file" ref={fileInputRef} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditData({ ...editData, avatar: reader.result as string });
            reader.readAsDataURL(file);
          }
        }} className="hidden" accept="image/*" />
        
        <div className={`h-64 relative overflow-hidden ${isGuardian ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/shattered.png')]"></div>
        </div>

        <div className="px-10 pb-12 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left">
              <CitizenAvatar url={isEditing ? editData.avatar : (profile.avatar || profile.avatar_url)} name={profile.name} isEditing={isEditing} onUploadClick={() => fileInputRef.current?.click()} isGuardian={isGuardian} className={`ring-8 ring-white ${isGuardian ? 'shadow-amber-200/50' : ''}`} />
              <div className="pb-4 flex-1">
                {isEditing ? (
                  <div className="space-y-4 max-w-sm">
                    <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="text-4xl font-serif font-bold text-gray-900 bg-gray-50 border-b-2 border-blue-600 w-full outline-none p-2" />
                    <div className="flex items-center gap-2 text-blue-600"><AtSign size={16} /><input value={editData.pseudonym} onChange={e => setEditData({...editData, pseudonym: e.target.value})} className="font-bold outline-none bg-transparent" /></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h1 className="text-4xl font-serif font-bold text-gray-900 mb-1">{profile.name}</h1>
                      {isGuardian && <ShieldCheck size={24} className="text-amber-600" />}
                    </div>
                    <p className="text-gray-400 font-bold flex items-center justify-center md:justify-start gap-2 mb-4"><AtSign size={16} /> {profile.pseudonym}</p>
                    {renderBadges()}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {isOwnProfile ? (
                isEditing ? (
                  <><button onClick={handleSave} disabled={syncing} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-xl">{syncing ? <Loader2 className="animate-spin" /> : <Save size={16} />} Enregistrer</button><button onClick={() => setIsEditing(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Annuler</button></>
                ) : <><button onClick={() => setIsEditing(true)} className="px-6 py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl"><Pencil size={16} /> Modifier</button><button onClick={onLogout} className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"><LogOut size={16} /></button></>
              ) : (
                <button onClick={() => setIsFollowing(!isFollowing)} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl ${isFollowing ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{isFollowing ? <><UserCheck size={18} /> Soutenu</> : <><UserPlus size={18} /> Soutenir</>}</button>
              )}
            </div>
          </div>

          <div className="mt-16 pt-12 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-12">
                <section>
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-gray-400 mb-6">Présentation</h3>
                  {isEditing ? <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full h-48 text-xl leading-relaxed font-medium text-gray-700 bg-gray-50 p-8 rounded-[2.5rem] border-2 border-blue-100 outline-none focus:bg-white transition-all shadow-inner" /> : <p className="text-xl leading-relaxed font-medium text-gray-700 whitespace-pre-wrap bg-gray-50/50 p-10 rounded-[3rem] border border-gray-100/50 min-h-[300px] shadow-sm">{profile.bio || "Ce citoyen n'a pas encore rédigé sa présentation."}</p>}
                </section>

                {isOwnProfile && (
                  <section className="bg-gray-50 rounded-[3rem] p-10 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="font-serif font-bold text-2xl text-gray-900 flex items-center gap-3"><Lock size={20} className="text-blue-600" /> Sécurité</h3>
                       <button onClick={() => setShowPwdFields(!showPwdFields)} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">{showPwdFields ? "Réduire" : "Changer mot de passe"}</button>
                    </div>
                    {showPwdFields && (
                      <div className="space-y-6">
                        <div className="relative">
                          <input type={showPwd ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full bg-white py-6 pl-6 pr-16 rounded-2xl outline-none shadow-sm focus:ring-4 focus:ring-blue-100 font-bold" />
                          <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300">{showPwd ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                        </div>
                        <button onClick={handleUpdatePassword} disabled={pwdLoading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">{pwdLoading ? <Loader2 className="animate-spin" /> : <Shield size={16} />} Confirmer</button>
                      </div>
                    )}
                  </section>
                )}
            </div>

            <aside className="lg:sticky lg:top-24 space-y-10 self-start">
              <div className={`p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group border transition-all duration-700 ${isGuardian ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 text-white border-amber-400/30' : 'bg-gray-950 text-white border-white/5'}`}>
                <h3 className={`font-black text-[10px] uppercase tracking-[0.4em] mb-6 relative z-10 ${isGuardian ? 'text-amber-200' : 'text-blue-400'}`}>{isGuardian ? "Autorité Fondatrice" : "INDICE D'IMPACT"}</h3>
                <div className="text-7xl font-serif font-bold mb-4 relative z-10 text-white">{impactScoreValue.toLocaleString()}</div>
                <p className={`text-[9px] font-black uppercase tracking-[0.3em] relative z-10 ${isGuardian ? 'text-white/60' : 'text-gray-500'}`}>POINTS CITOYENS</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
