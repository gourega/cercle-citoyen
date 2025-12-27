
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Role } from '../types';
import { 
  LogOut, 
  Loader2, 
  X, 
  Save,
  PenLine,
  Crown,
  AlertTriangle,
  RefreshCcw,
  User as UserIcon,
  AtSign,
  FileText,
  Camera,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  Scale,
  TreeDeciduous,
  DraftingCompass,
  Sparkles
} from 'lucide-react';
import { supabase, isRealSupabase } from '../lib/supabase';
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

const GuardianSeal: React.FC<{ icon: React.ReactNode; label: string; sub: string }> = ({ icon, label, sub }) => (
  <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-b from-amber-50 to-white rounded-[2.5rem] border border-amber-100/50 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all">
    <div className="w-14 h-14 bg-amber-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">{label}</p>
      <p className="text-[8px] font-bold text-amber-500 uppercase mt-1">{sub}</p>
    </div>
  </div>
);

const EditProfileModal: React.FC<{ profile: any, onClose: () => void, onSave: (updated: any) => void }> = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    pseudonym: profile.pseudonym || '',
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || profile.avatar || ''
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast("Photo trop lourde (max 2Mo)", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            pseudonym: formData.pseudonym,
            bio: formData.bio,
            avatar_url: formData.avatar_url
          })
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        // Fallback local pour le mode démo
        console.warn("Mode Démo : Mise à jour locale uniquement.");
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      onSave(formData);
      addToast("Identité mise à jour !", "success");
      onClose();
    } catch (e: any) {
      console.error("Erreur mise à jour:", e);
      addToast("Erreur lors de la sauvegarde.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-blue-50/30">
          <div>
            <h3 className="text-2xl font-serif font-bold text-gray-900">Modifier mon identité</h3>
            <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mt-1">Édition de l'ADN Citoyen</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
        </div>
        
        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
          <div className="flex flex-col items-center gap-4">
             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
               <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100 ring-2 ring-blue-100">
                 {formData.avatar_url ? (
                   <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Aperçu" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-300">
                     <ImageIcon size={40} />
                   </div>
                 )}
               </div>
               <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
               </div>
               <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                  <Upload className="text-white" size={16} />
               </div>
             </div>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               className="hidden" 
               accept="image/*" 
             />
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cliquez pour changer de photo</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex items-center gap-2"><UserIcon size={12} /> Nom Complet</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold border border-transparent focus:border-blue-200 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex items-center gap-2"><AtSign size={12} /> Pseudonyme</label>
              <input value={formData.pseudonym} onChange={e => setFormData({...formData, pseudonym: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold border border-transparent focus:border-blue-200 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex items-center gap-2"><FileText size={12} /> Biographie</label>
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full h-32 bg-gray-50 p-4 rounded-2xl outline-none border border-transparent focus:border-blue-200 transition-all resize-none" />
            </div>
          </div>
          
          <button onClick={handleSave} disabled={loading} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-100">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Mettre à jour mon profil
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC<{ currentUser: User; onLogout: () => Promise<void>; onProfileUpdate?: (updates: Partial<User>) => void }> = ({ currentUser, onLogout, onProfileUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setDbError(null);
    const targetId = id || currentUser.id;
    
    // On commence toujours par les données locales pour éviter le chargement infini
    if (targetId === currentUser.id) {
      setProfile({
        ...currentUser,
        avatar_url: currentUser.avatar,
        impact_score: currentUser.impact_score || currentUser.impactScore
      });
    }

    try {
      if (isRealSupabase && supabase) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', targetId).maybeSingle();
        if (error) throw error;
        if (data) {
          setProfile({ ...data, avatar: data.avatar_url || data.avatar || `https://picsum.photos/seed/${data.id}/150/150` });
        } else if (targetId !== currentUser.id) {
          setDbError("Citoyen non trouvé.");
        }
      }
    } catch (e: any) {
      console.warn("Échec de récupération base, conservation des données locales.", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [id, currentUser.id]);

  if (loading && !profile) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 text-gray-400">
      <Loader2 className="animate-spin w-12 h-12 text-blue-600" />
      <p className="text-[10px] font-black uppercase tracking-widest">Consultation...</p>
    </div>
  );

  const isOwnProfile = profile?.id === currentUser.id;
  const isGuardian = profile?.role === Role.SUPER_ADMIN || profile?.role === 'Gardien';
  
  const impactScore = profile?.impact_score !== undefined ? profile.impact_score : (profile?.impactScore || 0);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-16">
      {isEditModalOpen && (
        <EditProfileModal 
          profile={profile} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={(formData) => {
            const updates = {
              name: formData.name,
              pseudonym: formData.pseudonym,
              bio: formData.bio,
              avatar: formData.avatar_url,
              avatar_url: formData.avatar_url
            };
            setProfile({...profile, ...updates});
            if (isOwnProfile && onProfileUpdate) {
              onProfileUpdate(updates);
            }
          }} 
        />
      )}
      <div className={`bg-white rounded-[3rem] border ${isGuardian ? 'border-amber-200 shadow-2xl' : 'border-gray-100 shadow-sm'} overflow-hidden relative`}>
        <div className={`h-64 relative ${isGuardian ? 'bg-amber-600' : 'bg-blue-600'}`}>
          {profile.cover_url && <img src={profile.cover_url} className="w-full h-full object-cover opacity-60" />}
        </div>
        <div className="px-10 pb-12 -mt-24 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-end space-x-8">
              <CitizenAvatar url={profile.avatar || profile.avatar_url} name={profile.name} className="ring-4 ring-white" />
              <div className="pb-4">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">{profile.name}</h1>
                  {isGuardian && <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full flex items-center gap-2"><Crown size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Gardien</span></div>}
                </div>
                <p className="text-gray-400 font-bold text-sm tracking-wide">@{profile.pseudonym}</p>
              </div>
            </div>
            {isOwnProfile && (
              <div className="flex gap-3">
                <button onClick={() => setIsEditModalOpen(true)} className="px-6 py-4 bg-gray-900 text-white rounded-2xl text-[13px] font-black hover:bg-black transition-all flex items-center gap-2 shadow-sm"><PenLine size={16} /> Modifier</button>
                <button onClick={onLogout} className="px-6 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[13px] font-black hover:bg-blue-100 transition-all flex items-center gap-2 shadow-sm"><LogOut size={16} /> Déconnexion</button>
              </div>
            )}
          </div>
          <div className="mt-16 pt-12 border-t border-gray-50 grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="md:col-span-2 space-y-12">
              <div>
                <h3 className="font-black text-[11px] uppercase tracking-widest text-gray-400 mb-6">Présentation</h3>
                <p className="text-lg leading-relaxed font-medium text-gray-700 whitespace-pre-wrap">{profile.bio || "Pas de présentation."}</p>
              </div>
              
              {isGuardian && (
                <div>
                  <h3 className="font-black text-[11px] uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Sceaux de Souveraineté
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <GuardianSeal icon={<TreeDeciduous size={24} />} label="Fondateur" sub="Origine du Cercle" />
                    <GuardianSeal icon={<Scale size={24} />} label="Médiateur" sub="Sagesse Suprême" />
                    <GuardianSeal icon={<ShieldCheck size={24} />} label="Protecteur" sub="Souveraineté Data" />
                    <GuardianSeal icon={<DraftingCompass size={24} />} label="Architecte" sub="Vision Long Terme" />
                  </div>
                </div>
              )}
            </div>
            
            <aside className="p-10 bg-gray-900 text-white rounded-[3rem] text-center shadow-2xl h-fit">
              <h3 className="font-black text-[10px] uppercase tracking-widest mb-8 text-gray-400">IMPACT</h3>
              <div className="text-6xl font-serif font-bold mb-2">{impactScore.toLocaleString()}</div>
              <p className="text-[10px] font-black uppercase text-blue-400">POINTS CITOYENS</p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
