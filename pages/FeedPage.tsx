
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Send, Sparkles, 
  ShieldCheck, MessageCircle, RefreshCw, 
  Pencil, Crown, Share2, Volume2, Trash2, 
  Home, Camera, Handshake, Target, Landmark, 
  Menu, X, Plus, MoreVertical, Map as MapIcon, Rocket, 
  Video, User as UserIcon, LogOut, Gavel, Compass, Mic2, 
  Bold, Italic, List, Smile, Type, ChevronDown, ChevronUp, ArrowRight, Smartphone, Save,
  Image as ImageIcon
} from 'lucide-react';
import { User, CircleType, Role, Post } from '../types.ts';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { MOCK_POSTS, ADMIN_ID } from '../lib/mocks.ts';
import { useToast } from '../ToastContext.tsx';
import { getGriotReading, decode, decodeAudioData } from '../lib/gemini.ts';
import Logo from '../Logo.tsx';

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return date.toLocaleDateString();
};

const formatContent = (text: string) => {
  if (!text) return text;
  return text.split('\n').map((line, i) => {
    let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-gray-900">$1</strong>');
    formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    return <span key={i} dangerouslySetInnerHTML={{ __html: formattedLine + '<br/>' }} />;
  });
};

const PostSkeleton = () => (
  <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm mb-6 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-gray-50 rounded-xl"></div>
      <div className="space-y-2">
        <div className="w-24 h-2 bg-gray-100 rounded"></div>
        <div className="w-16 h-1.5 bg-gray-50 rounded"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="w-full h-2 bg-gray-50 rounded"></div>
      <div className="w-3/4 h-2 bg-gray-50 rounded"></div>
    </div>
  </div>
);

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active?: boolean; color?: string; onClick?: () => void }> = ({ to, icon, label, active, color = "text-blue-600", onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest ${active ? `bg-blue-50/50 ${color} shadow-sm ring-1 ring-blue-100/30` : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
  >
    <span className={active ? color : "text-gray-400"}>{icon}</span> {label}
  </Link>
);

const PublishModal: React.FC<{ user: User, isOpen: boolean, onClose: () => void, onPublish: (post: any) => void }> = ({ user, isOpen, onClose, onPublish }) => {
  const [content, setContent] = useState('');
  const [circleType, setCircleType] = useState<CircleType>(CircleType.IDEAS);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast("Image trop lourde (max 2Mo pour le prototype)", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    setContent(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + before.length, end + before.length);
      }
    }, 10);
  };

  const handlePost = async () => {
    if (!content.trim() && !image) return;
    setLoading(true);
    
    const postData = {
      author_id: user.id,
      circle_type: circleType,
      content: content.trim() || "Image partagée",
      image_url: image,
      created_at: new Date().toISOString(),
      reactions: { useful: 0, relevant: 0, inspiring: 0 }
    };

    try {
      if (isRealSupabase && supabase) {
        // Tentative d'insertion
        const { data, error } = await supabase.from('posts').insert([postData]).select();
        
        if (error) {
          console.error("Supabase Error:", error);
          if (error.code === '42501' || error.message.includes('Unauthorized')) {
            throw new Error("Erreur de permission. Vérifiez vos règles RLS (exécutez le script SQL d'assouplissement).");
          }
          throw error;
        }
        
        onPublish(data[0]);
        addToast("Votre onde a été diffusée", "success");
      } else {
        // Mode démo
        onPublish({ ...postData, id: Date.now().toString() });
        addToast("Diffusé (Mode Démo)", "success");
      }
      
      setContent('');
      setImage(null);
      onClose();
    } catch (e: any) {
      console.error("Publishing fail:", e);
      addToast(e.message || "Échec de la publication", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h3 className="font-serif font-bold text-xl text-gray-900">Nouvelle Onde</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
              <select 
                value={circleType}
                onChange={e => setCircleType(e.target.value as CircleType)}
                className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-lg outline-none cursor-pointer"
              >
                {Object.values(CircleType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
            <button onClick={() => insertText('**', '**')} title="Gras" className="p-2.5 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600 transition-all active:scale-90"><Bold size={18} /></button>
            <button onClick={() => insertText('*', '*')} title="Italique" className="p-2.5 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600 transition-all active:scale-90"><Italic size={18} /></button>
            <button onClick={() => insertText('\n* ', '')} title="Liste" className="p-2.5 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600 transition-all active:scale-90"><List size={18} /></button>
            <div className="w-px h-6 bg-gray-100 mx-1"></div>
            <button onClick={() => fileInputRef.current?.click()} title="Ajouter une photo" className={`p-2.5 rounded-xl transition-all active:scale-90 ${image ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'}`}>
              <ImageIcon size={18} />
            </button>
            <button onClick={() => setShowEmojis(!showEmojis)} title="Émojis" className={`p-2.5 rounded-xl transition-all active:scale-90 ${showEmojis ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'}`}><Smile size={18} /></button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          </div>

          {showEmojis && (
            <div className="grid grid-cols-8 gap-2 p-4 bg-gray-50 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              {['✨', '🇨🇮', '🔥', '🤝', '💡', '⚖️', '🌱', '🌍', '🧡', '🤍', '💚', '✊', '🏛️', '🛡️', '📢', '🚀'].map(emoji => (
                <button key={emoji} onClick={() => { setContent(prev => prev + emoji); setShowEmojis(false); }} className="text-xl p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all transform hover:scale-125">{emoji}</button>
              ))}
            </div>
          )}

          {image && (
            <div className="relative rounded-[2rem] overflow-hidden group animate-in zoom-in duration-300">
              <img src={image} className="w-full h-auto max-h-[300px] object-cover" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-all"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <textarea 
            ref={textareaRef}
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Quelle réflexion souhaitez-vous partager ?"
            className="w-full min-h-[150px] text-lg font-medium text-gray-800 placeholder:text-gray-300 outline-none resize-none leading-relaxed"
          />
        </div>
        <div className="p-6 border-t border-gray-50 flex justify-end bg-gray-50/20">
          <button onClick={handlePost} disabled={loading || (!content.trim() && !image)} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-3">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={16} />} Publier l'Onde
          </button>
        </div>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: Post, currentUser: User | null, onUpdate: () => void }> = ({ post, currentUser, onUpdate }) => {
  const { addToast } = useToast();
  const [author, setAuthor] = useState<any>(null);
  const [isReading, setIsReading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      if (post.author_id === ADMIN_ID) {
        setAuthor({ name: "Kouassi G. Ouréga", pseudonym: "Gardien", avatar: 'https://picsum.photos/seed/admin/200/200', role: Role.SUPER_ADMIN });
        return;
      }
      if (!isRealSupabase || !supabase) {
        setAuthor({ name: "Citoyen", avatar: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
        return;
      }
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', post.author_id).maybeSingle();
        setAuthor(data ? { ...data, avatar: data.avatar_url || data.avatar } : { name: "Citoyen", avatar: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
      } catch (e) {
        setAuthor({ name: "Citoyen", avatar: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
      }
    };
    fetchAuthor();
  }, [post.author_id]);

  const handleListen = async () => {
    if (isReading) return;
    setIsReading(true);
    try {
      const base64Audio = await getGriotReading(post.content);
      if (base64Audio) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const bytes = decode(base64Audio);
        const buffer = await decodeAudioData(bytes, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsReading(false);
        source.start(0);
      }
    } catch (e) { setIsReading(false); }
  };

  const handleShare = async () => {
    const shareText = `${post.content}\n\nRejoignez le Cercle Citoyen pour participer au progrès social.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cercle Citoyen - Onde', text: shareText, url: window.location.href });
      } catch (e) { console.debug('Share cancelled'); }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      addToast("Lien et contenu copiés !", "success");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Souhaitez-vous vraiment effacer cette onde ?")) return;
    try {
      if (isRealSupabase && supabase) await supabase.from('posts').delete().eq('id', post.id);
      onUpdate();
      addToast("Onde effacée", "success");
    } catch (e) { addToast("Échec de la suppression", "error"); }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      if (isRealSupabase && supabase) await supabase.from('posts').update({ content: editContent }).eq('id', post.id);
      setIsEditing(false);
      onUpdate();
      addToast("Onde rectifiée", "success");
    } catch (e) { addToast("Erreur lors de la mise à jour", "error"); } finally { setIsSaving(false); }
  };

  if (!author) return <PostSkeleton />;
  
  const isMajestic = post.is_majestic || author.role === Role.SUPER_ADMIN;
  const isOwner = currentUser?.id === post.author_id;
  const TRUNCATE_LIMIT = 280;
  const shouldTruncate = post.content && post.content.length > TRUNCATE_LIMIT && !isMajestic;
  const displayContent = isExpanded || !shouldTruncate ? post.content : post.content.slice(0, TRUNCATE_LIMIT).trim() + "...";

  return (
    <article className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm mb-6 overflow-hidden animate-in fade-in duration-500">
      <div className="p-5 md:p-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author_id}`} className="relative shrink-0">
              <img src={author.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
              {isMajestic && <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-lg border-2 border-white shadow-sm"><Crown size={8} /></div>}
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link to={`/profile/${post.author_id}`} className="font-bold text-gray-900 text-[13px] hover:text-blue-600 transition-colors">{author.name}</Link>
                {author.role === Role.SUPER_ADMIN && <ShieldCheck size={12} className="text-amber-600" />}
              </div>
              <p className="text-[7px] font-black uppercase tracking-widest text-gray-300 mt-1.5">{getRelativeTime(post.created_at)} • {post.circle_type}</p>
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="mb-4">
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full min-h-[120px] bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none text-sm font-medium resize-none focus:bg-white transition-all" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Annuler</button>
              <button onClick={handleSaveEdit} disabled={isSaving || !editContent.trim()} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-50">
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Sauvegarder
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`text-gray-800 leading-relaxed whitespace-pre-wrap transition-all duration-300 ${isMajestic ? 'text-lg md:text-xl font-serif italic border-l-2 border-amber-100 pl-5 mb-5' : 'text-[14px] font-medium mb-4'}`}>
              {formatContent(displayContent)}
            </div>
            
            {(post.image_url || post.clean_vision_url) && (
              <div className="mb-6 rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm animate-in zoom-in duration-500">
                <img src={post.image_url || post.clean_vision_url} className="w-full h-auto object-cover" alt="Illustration citoyenne" />
              </div>
            )}

            {shouldTruncate && (
              <button onClick={() => setIsExpanded(!isExpanded)} className="mb-5 flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:text-blue-700 transition-colors">
                {isExpanded ? <><ChevronUp size={14} /> Voir moins</> : <><ChevronDown size={14} /> Lire la suite</>}
              </button>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-50 gap-y-3">
          <div className="flex gap-1 items-center">
            <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-all"><ThumbsUp size={14} /> <span className="text-[10px] font-bold">{post.reactions.useful}</span></button>
            <button className="flex items-center gap-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-all"><Lightbulb size={14} /> <span className="text-[10px] font-bold">{post.reactions.relevant}</span></button>
            <div className="w-px h-4 bg-gray-100 mx-1"></div>
            <button onClick={handleShare} className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-all"><Share2 size={14} /> <span className="text-[10px] font-bold">PARTAGER</span></button>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && !isEditing && (
              <div className="flex gap-1">
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-all"><Pencil size={13} /> <span className="text-[9px] font-black uppercase">Modifier</span></button>
                <button onClick={handleDelete} className="flex items-center gap-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all"><Trash2 size={13} /> <span className="text-[9px] font-black uppercase">Supprimer</span></button>
              </div>
            )}
            <button onClick={handleListen} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[7px] uppercase transition-all ${isReading ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
              <Volume2 size={12} /> {isReading ? "LECTURE..." : "ÉCOUTER"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const MissionItem = ({ icon: Icon, label, link, color }: any) => (
  <Link to={link} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all group">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}>{Icon && <Icon size={18} />}</div>
    <div className="flex-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{label}</p>
      <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase mt-0.5">Prêt à agir <ArrowRight size={8} className="group-hover:translate-x-1 transition-transform" /></div>
    </div>
  </Link>
);

const FeedPage: React.FC<{ user: User, onLogout: () => Promise<void> }> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const { addToast } = useToast();

  const fetchPosts = async () => {
    setIsRefreshing(true);
    try {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) setPosts(data); else setPosts(MOCK_POSTS);
      } else setPosts(MOCK_POSTS);
    } catch (e) { setPosts(MOCK_POSTS); } finally { setLoading(false); setIsRefreshing(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const NavSections = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="space-y-6">
      <section className="space-y-1">
        <div className="text-[8px] font-black text-gray-300 uppercase tracking-widest px-3 mb-2">Navigation</div>
        <NavLink to="/feed" active icon={<Home size={18} />} label="Agora" onClick={onLinkClick} />
        {user.role === Role.SUPER_ADMIN && <NavLink to="/admin" icon={<Crown size={18} />} label="Conseil" color="text-amber-600" onClick={onLinkClick} />}
        <NavLink to="/sentinel" icon={<Camera size={18} />} label="Sentinelle" color="text-emerald-600" onClick={onLinkClick} />
        <NavLink to="/map" icon={<MapIcon size={18} />} label="Empreinte" color="text-blue-600" onClick={onLinkClick} />
        <NavLink to="/assembly" icon={<Mic2 size={18} />} label="Assemblée" color="text-indigo-600" onClick={onLinkClick} />
        <NavLink to="/compass" icon={<Compass size={18} />} label="Boussole" color="text-teal-600" onClick={onLinkClick} />
      </section>
      <section className="space-y-1">
        <div className="text-[8px] font-black text-gray-300 uppercase tracking-widest px-3 mb-2">Action</div>
        <NavLink to="/quests" icon={<Target size={18} />} label="Sentiers" color="text-rose-600" onClick={onLinkClick} />
        <NavLink to="/solidarity" icon={<Handshake size={18} />} label="Marché" color="text-amber-600" onClick={onLinkClick} />
        <NavLink to="/ideas" icon={<Lightbulb size={18} />} label="Idées" color="text-yellow-600" onClick={onLinkClick} />
        <NavLink to="/governance" icon={<Gavel size={18} />} label="RIC" color="text-slate-600" onClick={onLinkClick} />
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 lg:pb-0">
      <PublishModal user={user} isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} onPublish={(p) => setPosts(prev => [p, ...prev])} />

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/30">
              <Logo size={20} showText variant="blue" />
              <X size={20} className="text-gray-300" onClick={() => setIsMobileMenuOpen(false)} />
            </div>
            <div className="flex-1 p-5 overflow-y-auto no-scrollbar"><NavSections onLinkClick={() => setIsMobileMenuOpen(false)} /></div>
            <div className="p-6 border-t border-gray-100 space-y-3">
               <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 py-4 text-rose-600 bg-rose-50 rounded-xl font-black text-[10px] uppercase tracking-widest"><LogOut size={16} /> Déconnexion</button>
            </div>
          </div>
        </div>
      )}

      <header className="lg:hidden sticky top-0 z-[100] bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
        <Logo size={20} showText variant="blue" />
        <Link to="/profile" className="w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-gray-50"><img src={user.avatar} className="w-full h-full object-cover" /></Link>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block lg:w-60 space-y-6 sticky top-12 self-start">
          <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm"><Logo size={24} showText variant="blue" className="mb-8 px-2"/><NavSections /></div>
          <div className="bg-gray-950 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><Sparkles size={40} /></div>
             <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-3">Impact</p>
             <p className="text-xl font-serif font-bold mb-4">{user.impactScore || 0} XP</p>
             <div className="space-y-2">
               <button onClick={() => navigate('/transparency')} className="w-full py-2 bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/5">Registre</button>
             </div>
          </div>
        </aside>

        <main className="flex-1 max-w-2xl">
          <header className="mb-8 flex justify-between items-end px-2">
            <div><h1 className="text-3xl font-serif font-bold text-gray-900 mb-1">Agora</h1><p className="text-gray-400 font-bold italic text-[12px]">Le pouls de la Nation.</p></div>
            <button onClick={fetchPosts} className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-300 hover:text-blue-600 transition-colors"><RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
          </header>

          <button onClick={() => setIsPublishModalOpen(true)} className="w-full bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm mb-10 flex items-center gap-6 hover:shadow-md transition-all group">
            <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
            <span className="text-gray-400 font-medium text-lg flex-1 text-left group-hover:text-gray-600">Quelle est votre onde ?</span>
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Plus size={24} /></div>
          </button>

          <div className="space-y-4">
            {posts.map((post, index) => (
              <React.Fragment key={post.id}>
                <PostCard post={post} currentUser={user} onUpdate={fetchPosts} />
                {index === 0 && (
                  <div className="bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden mb-6 group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform"><Smartphone size={100} /></div>
                     <h3 className="text-2xl font-serif font-bold mb-4 leading-tight">Devenez Pilier du Cercle</h3>
                     <p className="text-blue-100 text-sm mb-8 font-medium">Votre soutien direct via Wave finance l'intelligence souveraine de la Cité.</p>
                     <button onClick={() => navigate('/transparency')} className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Soutenir maintenant</button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </main>

        <aside className="hidden xl:block w-72 sticky top-12 self-start space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 px-2 flex items-center gap-2"><Target size={14} className="text-blue-600" /> Missions du Citoyen</h3>
              <div className="space-y-4">
                 <MissionItem icon={Camera} label="Signaler une anomalie" link="/sentinel" color="bg-emerald-500" />
                 <MissionItem icon={Gavel} label="Lancer un RIC national" link="/governance" color="bg-orange-500" />
                 <MissionItem icon={Lightbulb} label="Déposer une étincelle" link="/ideas" color="bg-yellow-500" />
                 <MissionItem icon={Video} label="Tisser une vision" link="/griot" color="bg-amber-500" />
              </div>
           </div>
        </aside>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-3xl border-t border-gray-100 px-6 py-4 flex justify-between items-center z-[110] shadow-lg rounded-t-[1.5rem]">
        <Link to="/feed" className="flex flex-col items-center gap-1 text-blue-600"><Home size={20} /><span className="text-[6px] font-black uppercase">Agora</span></Link>
        <Link to="/sentinel" className="flex flex-col items-center gap-1 text-gray-300"><Camera size={20} /><span className="text-[6px] font-black uppercase">Sentinelle</span></Link>
        <Link to="/map" className="flex flex-col items-center gap-1 text-gray-300"><MapIcon size={20} /><span className="text-[6px] font-black uppercase">Empreinte</span></Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1 text-gray-300"><Menu size={20} /><span className="text-[6px] font-black uppercase">Menu</span></button>
      </nav>
    </div>
  );
};

export default FeedPage;
