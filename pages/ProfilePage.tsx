
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Role } from '../types';
import { 
  LogOut, Loader2, X, Save, PenLine, Crown, User as UserIcon, AtSign, FileText, Camera, Upload, 
  Image as ImageIcon, ShieldCheck, Scale, TreeDeciduous, DraftingCompass, Sparkles, RefreshCw, CheckCircle
} from 'lucide-react';
import { supabase, isRealSupabase, db } from '../lib/supabase';
import { useToast } from '../App';

const CitizenAvatar: React.FC<{ url?: string; name: string; size?: string; className?: string }> = ({ url, name, size = "w-40 h-40", className = "" }) => {
  const [error, setError] = useState(false);
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "??";
  if (!url || url.trim() === "" || error) {
    return (
      <div className={`${size} aspect-square shrink-0 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-serif font-bold text-4xl shadow-2xl border-8 border-white ${className}`}>
        {initials}
      </div>
    );
  }
  return (
    <div className={`${size} aspect-square shrink-0 rounded-[2rem] border-8 border-white shadow-2xl overflow-hidden bg-gray-100 ${className}`}>
      <img src={url} alt={name} onError={() => setError(true)} className="w-full h-full object-cover" />
    </div>
  );
};

const ProfilePage: React.FC<{ currentUser: User; onLogout: () => Promise<void>; onProfileUpdate?: (updates: Partial<User>) => void }> = ({ currentUser, onLogout, onProfileUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { addToast } = useToast();

  const fetchProfile = async () => {
    setLoading(true);
    const targetId = id || currentUser.id;
    if (targetId === currentUser.id) {
      setProfile({ ...currentUser, avatar_url: currentUser.avatar, impact_score: currentUser.impact_score || currentUser.impactScore });
    }
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('profiles').select('*').eq('id', targetId).maybeSingle();
        if (data) setProfile({ ...data, avatar: data.avatar_url || data.avatar });
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const forceSync = async () => {
    if (!isRealSupabase || !supabase || syncing) return;
    setSyncing(true);
    try {
      const dbUpdates = {
        name: profile.name,
        pseudonym: profile.pseudonym,
        bio: profile.bio,
        avatar_url: profile.avatar || profile.avatar_url,
        impact_score: profile.impact_score || 0
      };
      await db.updateProfile(profile.id, dbUpdates);
      addToast("Synchronisation Cloud réussie !", "success");
    } catch (e: any) {
      addToast(`Erreur : ${e.message}`, "error");
    } finally { setSyncing(false); }
  };

  useEffect(() => { fetchProfile(); }, [id, currentUser.id]);

  if (loading && !profile) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;

  const isOwnProfile = profile?.id === currentUser.id;
  const isGuardian = profile?.role === Role.SUPER_ADMIN || profile?.role === 'Gardien';
  const impactScore = profile?.impact_score || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-16">
      <div className={`bg-white rounded-[3rem] border ${isGuardian ? 'border-amber-200 shadow-2xl' : 'border-gray-100 shadow-sm'} overflow-hidden relative`}>
        <div className={`h-48 relative ${isGuardian ? 'bg-amber-600' : 'bg-blue-600'}`}>
           <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
              <div className={`w-1.5 h-1.5 rounded-full ${isRealSupabase ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-white">
                {isRealSupabase ? 'Liaison Cloud Active' : 'Mode Hors-Ligne'}
              </span>
           </div>
        </div>
        <div className="px-10 pb-12 -mt-20 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-end space-x-8">
              <CitizenAvatar url={profile.avatar || profile.avatar_url} name={profile.name} className="ring-4 ring-white" />
              <div className="pb-4">
                <h1 className="text-3xl font-serif font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-400 font-bold text-sm tracking-wide">@{profile.pseudonym}</p>
              </div>
            </div>
            {isOwnProfile && (
              <div className="flex flex-wrap gap-2">
                <button onClick={forceSync} disabled={syncing} className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-black hover:bg-emerald-100 transition-all flex items-center gap-2">
                   {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sync Cloud
                </button>
                <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-3 bg-gray-900 text-white rounded-xl text-[11px] font-black hover:bg-black transition-all flex items-center gap-2"><PenLine size={14} /> Modifier</button>
                <button onClick={onLogout} className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black hover:bg-blue-100 transition-all"><LogOut size={14} /></button>
              </div>
            )}
          </div>
          <div className="mt-12 pt-12 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-8">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-gray-400">Présentation</h3>
                <p className="text-lg leading-relaxed font-medium text-gray-700 whitespace-pre-wrap">{profile.bio || "Pas de présentation."}</p>
            </div>
            <aside className="p-8 bg-gray-900 text-white rounded-[2.5rem] text-center shadow-xl">
              <h3 className="font-black text-[9px] uppercase tracking-[0.3em] mb-4 text-gray-400">IMPACT</h3>
              <div className="text-5xl font-serif font-bold mb-2">{impactScore.toLocaleString()}</div>
              <p className="text-[8px] font-black uppercase text-blue-400">POINTS CITOYENS</p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
