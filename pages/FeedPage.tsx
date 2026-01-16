
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
  Briefcase, ShieldAlert, Fingerprint, LogOut
} from 'lucide-react';
import { User, CircleType, Role, Post } from '../types.ts';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { CIRCLES_CONFIG } from '../constants.tsx';
import { MOCK_POSTS } from '../lib/mocks.ts';
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
  <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm mb-10 animate-pulse">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl"></div>
      <div className="space-y-2">
        <div className="w-32 h-4 bg-gray-100 rounded"></div>
        <div className="w-24 h-2 bg-gray-50 rounded"></div>
      </div>
    </div>
    <div className="space-y-3 mb-8">
      <div className="w-full h-4 bg-gray-100 rounded"></div>
    </div>
  </div>
);

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active?: boolean; color?: string; onClick?: () => void }> = ({ to, icon, label, active, color = "text-blue-600", onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest ${active ? `bg-blue-50 ${color} shadow-sm ring-1 ring-blue-100` : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
  >
    <span className={active ? color : "text-gray-400"}>{icon}</span> {label}
  </Link>
);

const PostCard: React.FC<{ 
  post: Post, 
  currentUser: User | null, 
  onUpdate: () => void 
}> = ({ post, currentUser, onUpdate }) => {
  const { addToast } = useToast();
  const [author, setAuthor] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [showClean, setShowClean] = useState(false);
  const [reactions, setReactions] = useState(post.reactions || { useful: 0, relevant: 0, inspiring: 0 });
  const [deleting, setDeleting] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      if (post.author_id === '00000000-0000-0000-0000-000000000001' || post.author_id === 'admin-suprême') {
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
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
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

  if (!author) return <PostSkeleton />;
  
  const isMajestic = post.is_majestic || author.role === Role.SUPER_ADMIN;
  const isAuthor = currentUser?.id === post.author_id;
  const isAdmin = currentUser?.role === Role.SUPER_ADMIN;
  
  return (
    <article className={`bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all mb-10 overflow-hidden animate-in fade-in duration-500 ${isMajestic ? 'ring-2 ring-amber-100 shadow-amber-50/50' : ''}`}>
      <div className="p-8 md:p-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <Link to={`/profile/${post.author_id}`} className="relative group">
              <img src={author.avatar_url || author.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-105" alt="" />
              {isMajestic && <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-2 rounded-xl border-2 border-white shadow-lg"><Crown size={14} /></div>}
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-lg">{author.name}</p>
                {author.role === Role.SUPER_ADMIN && <ShieldCheck size={18} className="text-amber-600" />}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {getRelativeTime(post.created_at)} • {post.circle_type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isMajestic && (
              <button 
                onClick={handleListen} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest ${isReading ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'}`}
              >
                <Volume2 size={14} /> {isReading ? "Le Griot parle..." : "Écouter"}
              </button>
            )}
          </div>
        </div>

        <div className={`text-gray-800 leading-[1.8] whitespace-pre-wrap ${isMajestic ? 'text-2xl md:text-3xl font-serif font-semibold italic border-l-4 border-amber-200 pl-8 mb-8 first-letter:text-6xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-amber-600' : 'text-lg font-normal mb-6'}`}>
          {post.content}
        </div>

        {post.image_url && (
          <div className="relative rounded-[2.5rem] overflow-hidden border border-gray-100 mb-8 aspect-video bg-gray-50 group/image">
            <img src={showClean && post.clean_vision_url ? post.clean_vision_url : post.image_url} className="w-full h-full object-cover transition-all duration-700" alt="" />
            {post.clean_vision_url && (
              <button 
                onClick={() => setShowClean(!showClean)}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/90 backdrop-blur-md rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-2xl border border-white"
              >
                <Sparkles size={14} className="text-emerald-500" /> {showClean ? 'Vision Originale' : 'Révéler la Vision IA'}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between pt-10 border-t border-gray-50 gap-6">
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 text-blue-600 bg-blue-50/50 px-5 py-2.5 rounded-xl font-black text-xs">
              <ThumbsUp size={18} /> {reactions.useful}
            </button>
            <button className="flex items-center gap-2 text-emerald-600 bg-emerald-50/50 px-5 py-2.5 rounded-xl font-black text-xs">
              <Lightbulb size={18} /> {reactions.relevant}
            </button>
            <button className="flex items-center gap-2 text-amber-600 bg-amber-50/50 px-5 py-2.5 rounded-xl font-black text-xs">
              <Sparkles size={18} /> {reactions.inspiring}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const FeedPage: React.FC<{ user: User, onLogout: () => Promise<void> }> = ({ user, onLogout }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">Navigation Principale</div>
        <NavLink to="/feed" active icon={<Home size={20} />} label="Agora Citoyenne" onClick={onLinkClick} />
        <NavLink to="/sentinel" icon={<Camera size={20} className="text-emerald-500" />} label="Sentinelle Verte" color="text-emerald-600" onClick={onLinkClick} />
        <NavLink to="/map" icon={<MapIcon size={20} className="text-blue-500" />} label="Empreinte CI" color="text-blue-600" onClick={onLinkClick} />
      </section>

      <section className="space-y-2">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">Action & Impact</div>
        <NavLink to="/quests" icon={<Target size={20} className="text-rose-500" />} label="Sentiers d'Impact" color="text-rose-600" onClick={onLinkClick} />
        <NavLink to="/solidarity" icon={<Handshake size={20} className="text-amber-500" />} label="Marché Solidaire" color="text-amber-600" onClick={onLinkClick} />
        <NavLink to="/ideas" icon={<Lightbulb size={20} className="text-yellow-500" />} label="Banque des Idées" color="text-yellow-600" onClick={onLinkClick} />
        <NavLink to="/governance" icon={<Gavel size={20} className="text-slate-500" />} label="Palais des Édits" color="text-slate-600" onClick={onLinkClick} />
      </section>
      
      <section className="space-y-2">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">Intelligence & Studio</div>
        <NavLink to="/griot" icon={<Video size={20} className="text-amber-500" />} label="Studio Griot" color="text-amber-600" onClick={onLinkClick} />
        <NavLink to="/studio" icon={<Rocket size={20} className="text-purple-500" />} label="Studio d'Impact" color="text-purple-600" onClick={onLinkClick} />
        <NavLink to="/compass" icon={<Compass size={20} className="text-indigo-500" />} label="Boussole Légale" color="text-indigo-600" onClick={onLinkClick} />
        <NavLink to="/assembly" icon={<Waves size={20} className="text-cyan-500" />} label="Assemblée Live" color="text-cyan-600" onClick={onLinkClick} />
      </section>

      <section className="space-y-2">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">Transparence</div>
        <NavLink to="/transparency" icon={<BarChart3 size={20} className="text-emerald-500" />} label="Registre des Flux" color="text-emerald-600" onClick={onLinkClick} />
      </section>

      {isAdmin && (
        <div className="pt-6 mt-4 border-t border-gray-100">
          <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-4 mb-3">Gouvernance Suprême</div>
          <NavLink to="/admin" icon={<Landmark size={20} className="text-amber-700" />} label="Conseil du Gardien" color="text-amber-700" onClick={onLinkClick} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 lg:pb-0">
      {/* Mobile Menu Overlay (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
           <div className="absolute inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl animate-in slide-in-from-left duration-500 flex flex-col">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-blue-50/30">
                 <Logo size={32} showText variant="blue" />
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-white rounded-2xl shadow-sm text-gray-400"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                 <NavSections onLinkClick={() => setIsMobileMenuOpen(false)} />
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
                 <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 group">
                    <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover ring-4 ring-white shadow-md" />
                    <div>
                       <p className="font-bold text-gray-900">{user.name}</p>
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Mon Profil Citoyen</p>
                    </div>
                 </Link>
                 <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-rose-100 active:scale-95 transition-all"
                 >
                   <LogOut size={16} /> Déconnexion du Cercle
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-[100] bg-white/90 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <Logo size={30} showText variant="blue" />
        <Link to="/profile" className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-50 shadow-inner">
          <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col lg:flex-row gap-12">
        
        {/* Sidebar Desktop - Toujours visible sur grand écran */}
        <aside className="hidden lg:block lg:w-80 space-y-8 sticky top-12 self-start">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm overflow-y-auto max-h-[85vh] no-scrollbar">
             <Logo size={40} showText variant="blue" className="mb-10" />
             <NavSections />
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0 px-2">Citoyen Connecté</h3>
            <div className="flex items-center justify-between gap-4">
              <Link to="/profile" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all group flex-1 min-w-0">
                <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">{(user.impactScore || user.impact_score || 0).toLocaleString()} XP</p>
                </div>
              </Link>
              <button 
                onClick={onLogout}
                title="Déconnexion"
                className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </aside>

        {/* Fil Agora */}
        <main className="flex-1 max-w-2xl mx-auto lg:mx-0">
          <header className="mb-12 flex justify-between items-end px-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-2 tracking-tight">Agora</h1>
              <p className="text-gray-500 font-medium italic">Le pouls de la Nation Ivoirienne.</p>
            </div>
            <button 
              onClick={fetchPosts} 
              disabled={isRefreshing}
              className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </header>

          <div className="space-y-4 px-2 md:px-0">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
            ) : posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} currentUser={user} onUpdate={fetchPosts} />)
            ) : (
              <div className="bg-white rounded-[3rem] p-20 border border-gray-100 text-center shadow-sm">
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs italic">Le silence règne sur l'Agora...</p>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar Droite Desktop */}
        <aside className="hidden xl:block w-80 space-y-8 sticky top-12 self-start">
           <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
                <Crown size={120} />
              </div>
              <h3 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-6 relative z-10">Parole de Sagesse</h3>
              <p className="text-sm text-gray-700 leading-relaxed font-serif italic relative z-10">
                "La cité ne se bâtit pas avec des mots, mais avec des actes reliés par une vision commune."
              </p>
              <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">— Kouassi G. Ouréga</p>
           </div>

           <div className="bg-blue-600 text-white p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Heart size={80} /></div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">Urgence Sociale</h3>
              <p className="text-lg font-serif font-bold mb-6 italic leading-relaxed">Faites vivre le Marché de Solidarité en offrant vos ressources inutilisées.</p>
              <Link to="/solidarity" className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-all">
                Participer <ChevronDown className="-rotate-90 w-4 h-4" />
              </Link>
           </div>
        </aside>
      </div>

      {/* Barre de Navigation Mobile Totale */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-4 py-4 flex justify-between items-center z-[110] shadow-[0_-15px_50px_rgba(0,0,0,0.08)]">
        <Link to="/feed" className="flex flex-col items-center gap-1.5 text-blue-600 transition-all active:scale-90">
          <div className="p-1"><Home size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Agora</span>
        </Link>
        <Link to="/solidarity" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-amber-600 transition-all active:scale-90">
          <div className="p-1"><Handshake size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Marché</span>
        </Link>
        <Link to="/sentinel" className="flex flex-col items-center gap-1 text-gray-400 group active:scale-95 transition-all">
          <div className="w-16 h-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white -mt-12 shadow-2xl shadow-emerald-200 border-[6px] border-white ring-1 ring-emerald-50 group-hover:bg-emerald-700">
            <Camera size={26} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600 font-bold mt-1">Scan</span>
        </Link>
        <Link to="/griot" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-purple-600 transition-all active:scale-90">
          <div className="p-1"><Video size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Studio</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="flex flex-col items-center gap-1.5 text-gray-400 transition-all active:scale-90"
        >
          <div className="p-1"><Menu size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Menu</span>
        </button>
      </nav>
    </div>
  );
};

export default FeedPage;
