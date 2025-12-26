
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
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
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
      if (file.size > 2 * 1024 * 1024) { // Limite 2MB pour le stockage base64
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
      
      onSave(formData);
      addToast("Identité mise à jour !", "success");
      onClose();
    } catch (e: any) {
      addToast(e.message || "Erreur de mise à jour", "error");
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
          {/* Section Photo de Profil */}
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

const ProfilePage: React.FC<{ currentUser: User; onLogout: () => Promise<void>; onProfileUpdate?: () => void }> = ({ currentUser, onLogout, onProfileUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setDbError(null);
    const targetId = id || currentUser.id;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', targetId).maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile({ ...data, avatar: data.avatar_url || data.avatar || `https://picsum.photos/seed/${data.id}/150/150` });
      } else if (targetId === currentUser.id) {
        setProfile(currentUser);
      } else {
        setDbError("Citoyen non trouvé.");
      }
    } catch (e: any) {
      if (targetId === currentUser.id) setProfile(currentUser);
      else setDbError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [id, currentUser.id]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 text-gray-400">
      <Loader2 className="animate-spin w-12 h-12 text-blue-600" />
      <p className="text-[10px] font-black uppercase tracking-widest">Consultation...</p>
    </div>
  );

  if (dbError && !profile) return (
    <div className="max-w-xl mx-auto p-20 text-center">
      <AlertTriangle className="w-20 h-20 text-blue-600 mx-auto mb-8" />
      <h2 className="text-2xl font-serif font-bold mb-4">{dbError}</h2>
      <button onClick={() => fetchProfile()} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"><RefreshCcw size={16} /> Réessayer</button>
    </div>
  );

  const isOwnProfile = profile.id === currentUser.id;
  const isGuardian = profile.role === Role.SUPER_ADMIN || profile.role === 'Gardien';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-16">
      {isEditModalOpen && (
        <EditProfileModal 
          profile={profile} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={(updated) => {
            setProfile({...profile, ...updated, avatar: updated.avatar_url});
            if (onProfileUpdate) onProfileUpdate();
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
              <CitizenAvatar url={profile.avatar} name={profile.name} className="ring-4 ring-white" />
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
            <div className="md:col-span-2">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-gray-400 mb-6">Présentation</h3>
              <p className="text-lg leading-relaxed font-medium text-gray-700 whitespace-pre-wrap">{profile.bio || "Pas de présentation."}</p>
            </div>
            <aside className="p-10 bg-gray-900 text-white rounded-[3rem] text-center shadow-2xl">
              <h3 className="font-black text-[10px] uppercase tracking-widest mb-8 text-gray-400">IMPACT</h3>
              <div className="text-6xl font-serif font-bold mb-2">{profile.impact_score || 0}</div>
              <p className="text-[10px] font-black uppercase text-blue-400">Points Citoyens</p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
