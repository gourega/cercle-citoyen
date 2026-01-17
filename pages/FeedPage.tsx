
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Send, Sparkles, 
  ShieldCheck, MessageCircle, RefreshCw, 
  Pencil, Crown, Share2, ChevronDown, ChevronUp,
  Bold, Italic, Smile, MoreHorizontal, Type as TypeIcon,
  Volume2, Trash2, CheckCircle, LayoutGrid, Map as MapIcon, 
  Video, Gavel, BookText, Compass, Waves, Landmark,
  Home, Camera, Search, User as UserIcon, Handshake,
  Target, BarChart3, Heart, Rocket, Menu, X, Globe,
  Briefcase, ShieldAlert, Fingerprint, LogOut, Plus, Image as ImageIcon,
  MoreVertical, Link as LinkIcon, List, Eye, MessageSquare
} from 'lucide-react';
import { User, CircleType, Role, Post, Comment } from '../types.ts';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { CIRCLES_CONFIG } from '../constants.tsx';
import { MOCK_POSTS, ADMIN_ID } from '../lib/mocks.ts';
import { useToast } from '../ToastContext.tsx';
import { getGriotReading, decode, decodeAudioData } from '../lib/gemini.ts';
import Logo from '../Logo.tsx';

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 8400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
  return date.toLocaleDateString();
};

const PostSkeleton = () => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm mb-8 animate-pulse">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl"></div>
      <div className="space-y-2">
        <div className="w-32 h-2.5 bg-gray-100 rounded"></div>
        <div className="w-20 h-2 bg-gray-50 rounded"></div>
      </div>
    </div>
    <div className="space-y-3 mb-6">
      <div className="w-full h-2 bg-gray-50 rounded"></div>
      <div className="w-full h-2 bg-gray-50 rounded"></div>
      <div className="w-3/4 h-2 bg-gray-50 rounded"></div>
    </div>
  </div>
);

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active?: boolean; color?: string; onClick?: () => void }> = ({ to, icon, label, active, color = "text-blue-600", onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest ${active ? `bg-blue-50/50 ${color} shadow-sm ring-1 ring-blue-100/30` : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
  >
    <span className={active ? color : "text-gray-300"}>{icon}</span> {label}
  </Link>
);

const CommentModal: React.FC<{ post: Post, user: User, isOpen: boolean, onClose: () => void, onCommentAdded: (c: Comment) => void }> = ({ post, user, isOpen, onClose, onCommentAdded }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handlePostComment = async () => {
    if (!comment.trim()) return;
    setLoading(true);
    const newComment: Comment = {
      id: Date.now().toString(),
      author: user.name,
      avatar: user.avatar,
      content: comment,
      created_at: new Date().toISOString()
    };

    setComments(prev => [newComment, ...prev]);
    onCommentAdded(newComment);
    setComment('');
    setLoading(false);
    addToast("Écho partagé sur l'Agora", "success");
  };

  return (
    <div className="fixed inset-0 z-[400] bg-gray-950/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[85vh] overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-serif font-bold text-xl text-gray-900 flex items-center gap-3">
             <MessageCircle size={22} className="text-blue-600"/> Fil de Discussion
          </h3>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400"><X size={20}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {comments.length > 0 ? (
            comments.map((c, i) => (
              <div key={i} className="flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
                <img src={c.avatar} className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-sm border-2 border-white" alt="" />
                <div className="flex-1">
                  <div className="bg-gray-50 p-5 rounded-[1.5rem] rounded-tl-none border border-gray-100 shadow-sm">
                    <p className="font-bold text-[10px] text-gray-900 mb-1.5 uppercase tracking-widest">{c.author}</p>
                    <p className="text-[14px] text-gray-700 leading-relaxed font-medium">{c.content}</p>
                  </div>
                  <p className="text-[8px] font-black uppercase text-gray-300 tracking-widest mt-2 ml-2">{getRelativeTime(c.created_at)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 opacity-30 italic text-sm text-gray-400 font-bold uppercase tracking-widest">Silence sur l'Agora...</div>
          )}
        </div>

        <div className="p-8 border-t border-gray-50 bg-white">
          <div className="flex gap-4 bg-gray-50 p-3 rounded-[2rem] border border-gray-100 focus-within:bg-white focus-within:border-blue-200 transition-all shadow-inner">
            <input 
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Ajouter votre écho..."
              className="flex-1 bg-transparent px-5 py-3 outline-none text-sm font-semibold"
            />
            <button 
              onClick={handlePostComment}
              disabled={!comment.trim() || loading}
              className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl disabled:opacity-30 active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ 
  post: Post, 
  currentUser: User | null, 
  onUpdate: () => void 
}> = ({ post, currentUser, onUpdate }) => {
  const { addToast } = useToast();
  const [author, setAuthor] = useState<any>(null);
  const [isReading, setIsReading] = useState(false);
  const [showClean, setShowClean] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [reactions, setReactions] = useState(post.reactions || { useful: 0, relevant: 0, inspiring: 0 });
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

  const handleReaction = (type: 'useful' | 'relevant' | 'inspiring') => {
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
    addToast("Votre soutien a été entendu", "success");
  };

  const handleShare = async () => {
    setShowMenu(false);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Cercle Citoyen', text: post.content.substring(0, 100), url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        addToast("Lien copié dans le presse-papier", "info");
      }
    } catch (e) {}
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!window.confirm("Souhaitez-vous effacer cette réflexion du Cercle ?")) return;
    if (isRealSupabase && supabase) {
      await supabase.from('posts').delete().eq('id', post.id);
      onUpdate();
      addToast("Réflexion effacée", "success");
    } else {
      addToast("Mode démo : Réflexion effacée localement", "success");
      onUpdate();
    }
  };

  if (!author) return <PostSkeleton />;
  
  const isMajestic = post.is_majestic || author.role === Role.SUPER_ADMIN;
  // Correction de la logique de vérification d'auteur
  const isAuthor = currentUser?.id === post.author_id;

  return (
    <article className={`bg-white rounded-[3rem] border border-gray-100 shadow-prestige hover:shadow-lg transition-all mb-8 overflow-hidden animate-in fade-in duration-500 ${isMajestic ? 'ring-2 ring-amber-100/20' : ''}`}>
      <CommentModal 
        post={localPost} 
        user={currentUser!} 
        isOpen={isCommentOpen} 
        onClose={() => setIsCommentOpen(false)} 
        onCommentAdded={(c) => setLocalPost(prev => ({ ...prev, comments: [c, ...(prev.comments || [])] }))}
      />
      
      <div className="p-8 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/profile/${post.author_id}`} className="relative group shrink-0">
              <img src={author.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-md transition-transform group-hover:scale-105 border-2 border-white ring-1 ring-gray-100" alt="" />
              {isMajestic && <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-1.5 rounded-xl border-2 border-white shadow-lg"><Crown size={10} /></div>}
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-base leading-none">{author.name}</p>
                {author.role === Role.SUPER_ADMIN && <ShieldCheck size={14} className="text-amber-600" />}
              </div>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-300 mt-2">
                {getRelativeTime(post.created_at)} • {post.circle_type}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-3 hover:bg-gray-50 rounded-2xl text-gray-300 hover:text-gray-900 transition-colors"><MoreVertical size={20} /></button>
            {showMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-[2rem] shadow-2xl border border-gray-50 z-30 py-3 animate-in fade-in zoom-in duration-200 ring-1 ring-black/5">
                <button onClick={handleShare} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 flex items-center gap-4 transition-colors"><Share2 size={16} /> Partager</button>
                {isAuthor && (
                  <>
                    <button onClick={() => { setShowMenu(false); addToast("Modification bientôt disponible", "info"); }} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-gray-50 flex items-center gap-4 transition-colors"><Pencil size={16} /> Modifier</button>
                    <button onClick={handleDelete} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 flex items-center gap-4 transition-colors border-t border-gray-50 mt-1"><Trash2 size={16} /> Supprimer</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${isMajestic ? 'text-xl md:text-2xl font-serif font-medium italic border-l-4 border-amber-100 pl-8 mb-8 tracking-tight' : 'text-base font-medium mb-8'}`}>
          {post.content}
        </div>

        {post.image_url && (
          <div className="relative rounded-[2.5rem] overflow-hidden border border-gray-50 mb-8 aspect-video bg-gray-50 group">
            <img src={showClean && post.clean_vision_url ? post.clean_vision_url : post.image_url} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" alt="" />
            {post.clean_vision_url && (
              <button onClick={() => setShowClean(!showClean)} className="absolute bottom-6 left-6 px-5 py-2.5 bg-white/95 backdrop-blur-md rounded-full font-black text-[8px] uppercase tracking-widest flex items-center gap-3 shadow-2xl border border-white transition-all active:scale-95">
                <Sparkles size={12} className="text-emerald-500" /> {showClean ? 'ORIGINAL' : 'VISION PROPRE'}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-gray-50">
          <div className="flex gap-2">
            <button 
              onClick={() => handleReaction('useful')}
              className="flex items-center gap-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-all group"
            >
              <ThumbsUp size={18} className="group-active:scale-125 transition-transform" /> 
              <span className="text-xs font-bold">{reactions.useful}</span>
            </button>
            <button 
              onClick={() => handleReaction('relevant')}
              className="flex items-center gap-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 px-4 py-2.5 rounded-xl transition-all group"
            >
              <Lightbulb size={18} className="group-active:scale-125 transition-transform" /> 
              <span className="text-xs font-bold">{reactions.relevant}</span>
            </button>
            <button 
              onClick={() => setIsCommentOpen(true)}
              className="flex items-center gap-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-all group"
            >
              <MessageCircle size={18} className="group-active:scale-125 transition-transform" /> 
              <span className="text-xs font-bold">{localPost.comments?.length || 0}</span>
            </button>
          </div>
          <button 
            onClick={handleListen}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-[8px] uppercase tracking-[0.2em] transition-all shadow-sm ${isReading ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
          >
            <Volume2 size={14} /> {isReading ? "LECTURE..." : "ÉCOUTER"}
          </button>
        </div>
      </div>
    </article>
  );
};

const PublishModal: React.FC<{ user: User, isOpen: boolean, onClose: () => void, onPublish: (post: any) => void }> = ({ user, isOpen, onClose, onPublish }) => {
  const [content, setContent] = useState('');
  const [circleType, setCircleType] = useState<CircleType>(CircleType.IDEAS);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const insertFormat = (prefix: string, suffix: string = prefix) => {
    const textarea = document.getElementById('publish-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);
    const postData = {
      id: Date.now().toString(),
      author_id: user.id,
      circle_type: circleType,
      content,
      image_url: image,
      created_at: new Date().toISOString(),
      reactions: { useful: 0, relevant: 0, inspiring: 0 },
      comments: []
    };

    if (isRealSupabase && supabase) await supabase.from('posts').insert([postData]);
    onPublish(postData);
    setContent('');
    setImage(null);
    setLoading(false);
    onClose();
  };

  const emojis = ['😊', '🤝', '🇨🇮', '✊', '💡', '✨', '⚖️', '🌱'];

  return (
    <div className="fixed inset-0 z-[500] bg-gray-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[92vh] overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><Plus size={22}/></div>
            <h3 className="font-serif font-bold text-xl text-gray-900">Nouvelle Onde</h3>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400"><X size={20}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="flex items-center gap-4 mb-2">
            <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-md border-2 border-white ring-1 ring-gray-100" alt="" />
            <div>
              <p className="font-bold text-sm text-gray-900">{user.name}</p>
              <select 
                value={circleType}
                onChange={e => setCircleType(e.target.value as CircleType)}
                className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-transparent border-none outline-none cursor-pointer hover:underline transition-all"
              >
                {Object.values(CircleType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <textarea 
            id="publish-textarea"
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Structurez votre pensée citoyenne..."
            className="w-full min-h-[220px] text-xl font-medium text-gray-800 placeholder:text-gray-300 outline-none resize-none leading-relaxed"
          />

          {image && (
            <div className="relative rounded-[2.5rem] overflow-hidden aspect-video border-4 border-gray-50 group shadow-lg">
              <img src={image} className="w-full h-full object-cover" />
              <button onClick={() => setImage(null)} className="absolute top-6 right-6 p-3 bg-black/60 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all active:scale-90"><X size={16}/></button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-50 bg-gray-50/40 flex flex-col gap-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-1.5">
              <button onClick={() => insertFormat('**')} title="Gras" className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100 shadow-sm"><Bold size={18} /></button>
              <button onClick={() => insertFormat('_')} title="Italique" className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100 shadow-sm"><Italic size={18} /></button>
              <button onClick={() => insertFormat('• ')} title="Liste" className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100 shadow-sm"><List size={18} /></button>
              <div className="w-px h-8 bg-gray-200 mx-2 hidden sm:block"></div>
              <div className="flex items-center overflow-x-auto max-w-[140px] sm:max-w-none no-scrollbar">
                 {emojis.map(e => <button key={e} onClick={() => setContent(prev => prev + e)} className="p-3 text-lg hover:scale-125 transition-transform active:scale-150">{e}</button>)}
              </div>
              <div className="w-px h-8 bg-gray-200 mx-2 hidden sm:block"></div>
              <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-emerald-600 transition-all border border-transparent hover:border-gray-100 shadow-sm"><ImageIcon size={18} /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
            
            <button 
              onClick={handlePost}
              disabled={loading || !content.trim()}
              className="bg-gray-950 text-white px-8 sm:px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl disabled:opacity-50 flex items-center gap-3 active:scale-95 border border-white/10"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={16} />} Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeedPage: React.FC<{ user: User, onLogout: () => Promise<void> }> = ({ user, onLogout }) => {
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
        if (data && data.length > 0) setPosts(data);
        else setPosts(MOCK_POSTS);
      } else setPosts(MOCK_POSTS);
    } catch (e) { setPosts(MOCK_POSTS); } 
    finally { setLoading(false); setIsRefreshing(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const isAdmin = user.role === Role.SUPER_ADMIN;

  const NavSections = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] px-5 mb-3">Navigation</div>
        <NavLink to="/feed" active icon={<Home size={20} />} label="Agora" onClick={onLinkClick} />
        <NavLink to="/sentinel" icon={<Camera size={20} className="text-emerald-500" />} label="Sentinelle" color="text-emerald-600" onClick={onLinkClick} />
        <NavLink to="/map" icon={<MapIcon size={20} className="text-blue-500" />} label="Empreinte" color="text-blue-600" onClick={onLinkClick} />
      </section>

      <section className="space-y-2">
        <div className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] px-5 mb-3">Action</div>
        <NavLink to="/quests" icon={<Target size={20} className="text-rose-500" />} label="Sentiers" color="text-rose-600" onClick={onLinkClick} />
        <NavLink to="/solidarity" icon={<Handshake size={20} className="text-amber-500" />} label="Marché" color="text-amber-600" onClick={onLinkClick} />
        <NavLink to="/ideas" icon={<Lightbulb size={20} className="text-yellow-500" />} label="Idées" color="text-yellow-600" onClick={onLinkClick} />
      </section>
      
      <section className="space-y-2">
        <div className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] px-5 mb-3">Intelligence</div>
        <NavLink to="/griot" icon={<Video size={20} className="text-amber-500" />} label="Studio Griot" color="text-amber-600" onClick={onLinkClick} />
        <NavLink to="/studio" icon={<Rocket size={20} className="text-purple-500" />} label="Studio Impact" color="text-purple-600" onClick={onLinkClick} />
      </section>

      {isAdmin && (
        <div className="pt-6 border-t border-gray-100">
          <div className="text-[9px] font-black text-amber-600/60 uppercase tracking-[0.3em] px-5 mb-3">Gardien</div>
          <NavLink to="/admin" icon={<Landmark size={20} className="text-amber-700" />} label="Conseil" color="text-amber-700" onClick={onLinkClick} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pb-32 lg:pb-0">
      <PublishModal 
        user={user} 
        isOpen={isPublishModalOpen} 
        onClose={() => setIsPublishModalOpen(false)} 
        onPublish={(newPost) => {
          setPosts(prev => [newPost, ...prev]);
          addToast("Onde citoyenne publiée", "success");
        }}
      />

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
           <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-md animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}></div>
           <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-3xl animate-in slide-in-from-left duration-400 flex flex-col overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/40">
                 <Logo size={28} showText variant="blue" />
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 transition-all active:scale-90"><X size={22}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                 <NavSections onLinkClick={() => setIsMobileMenuOpen(false)} />
              </div>
              <div className="p-8 border-t border-gray-50 bg-gray-50">
                 <button onClick={onLogout} className="w-full py-5 text-rose-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-4 border-2 border-rose-100 rounded-2xl bg-rose-50/50 transition-all active:scale-95 shadow-sm">
                   <LogOut size={18} /> Déconnexion
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-[100] bg-white/95 backdrop-blur-2xl border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <Logo size={26} showText variant="blue" />
        <Link to="/profile" className="w-10 h-10 rounded-2xl overflow-hidden ring-4 ring-gray-50 shadow-md transition-transform active:scale-90 border border-white">
          <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 lg:py-16 flex flex-col lg:flex-row gap-16">
        
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block lg:w-72 space-y-8 sticky top-16 self-start">
          <div className="bg-white p-6 rounded-[3.5rem] border border-gray-100 shadow-prestige overflow-y-auto max-h-[82vh] no-scrollbar">
             <Logo size={32} showText variant="blue" className="mb-10 mt-2 px-2" />
             <NavSections />
          </div>

          <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-prestige">
            <div className="flex items-center justify-between gap-3">
              <Link to="/profile" className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all flex-1 min-w-0 border border-gray-100/50 group">
                <img src={user.avatar} className="w-10 h-10 rounded-2xl object-cover shadow-md border-2 border-white transition-transform group-hover:scale-105" />
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate text-[11px] leading-tight">{user.name}</p>
                  <p className="text-[7px] font-black uppercase text-blue-600 tracking-widest mt-1">{(user.impactScore || 0).toLocaleString()} XP</p>
                </div>
              </Link>
              <button onClick={onLogout} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm active:scale-90"><LogOut size={18} /></button>
            </div>
          </div>
        </aside>

        {/* Fil Agora */}
        <main className="flex-1 max-w-2xl mx-auto lg:mx-0">
          <header className="mb-12 flex justify-between items-end px-3">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-2 tracking-tight">Agora</h1>
              <p className="text-gray-400 font-bold italic text-[14px]">Le pouls de la Nation.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsPublishModalOpen(true)}
                className="hidden md:flex items-center gap-3 px-7 py-3.5 bg-gray-950 text-white rounded-[2rem] font-black text-[9px] uppercase tracking-widest shadow-2xl shadow-gray-300 hover:bg-black transition-all active:scale-95 border border-white/10"
              >
                <Plus size={16} /> NOUVELLE ONDE
              </button>
              <button onClick={fetchPosts} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-300 hover:text-blue-600 transition-all active:scale-90"><RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
            </div>
          </header>

          <div className="space-y-2 px-1 md:px-0">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
            ) : posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} currentUser={user} onUpdate={fetchPosts} />)
            ) : (
              <div className="bg-white rounded-[4rem] p-24 border border-gray-100 text-center shadow-prestige">
                <p className="text-gray-300 font-bold uppercase tracking-[0.4em] text-[10px] italic">Silence sur l'Agora...</p>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-72 space-y-8 sticky top-16 self-start">
           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-prestige relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-[1000ms]"><Crown size={100} /></div>
              <h3 className="text-[9px] font-black uppercase text-amber-600 tracking-[0.3em] mb-5">Sagesse</h3>
              <p className="text-[14px] text-gray-700 leading-relaxed font-serif italic mb-6">"La cité ne se bâtit pas avec des mots, mais avec des actes reliés par une vision."</p>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-inner"><Fingerprint size={16}/></div>
                 <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">— K. G. Ouréga</p>
              </div>
           </div>

           <div className="bg-blue-600 text-white p-10 rounded-[3rem] shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-[1000ms]"><Heart size={80} /></div>
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] mb-5 opacity-70">Engagement</h3>
              <p className="text-[15px] font-serif font-medium mb-8 italic leading-relaxed opacity-95">Participez à la solidarité du Marché Citoyen.</p>
              <Link to="/solidarity" className="inline-flex items-center gap-3 bg-white text-blue-600 px-7 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-2xl hover:bg-blue-50 transition-all active:scale-95 border border-white">AGIR MAINTENANT</Link>
           </div>
        </aside>
      </div>

      {/* Barre de Navigation Mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-3xl border-t border-gray-100 px-8 py-5 flex justify-between items-center z-[110] shadow-[0_-15px_50px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
        <Link to="/feed" className="flex flex-col items-center gap-1.5 text-blue-600 active:scale-90 transition-all"><Home size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Agora</span></Link>
        <Link to="/solidarity" className="flex flex-col items-center gap-1.5 text-gray-300 active:scale-90 transition-all"><Handshake size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Marché</span></Link>
        <button onClick={() => setIsPublishModalOpen(true)} className="relative -mt-12"><div className="w-14 h-14 bg-gray-950 text-white rounded-[1.2rem] flex items-center justify-center shadow-3xl border-[5px] border-white active:scale-90 transition-all ring-1 ring-black/5"><Plus size={24} /></div></button>
        <Link to="/griot" className="flex flex-col items-center gap-1.5 text-gray-300 active:scale-90 transition-all"><Video size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Griot</span></Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1.5 text-gray-300 active:scale-90 transition-all"><Menu size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Menu</span></button>
      </nav>
    </div>
  );
};

export default FeedPage;
