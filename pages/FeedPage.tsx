
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
  Target, BarChart3, Heart, Rocket
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

  const handleReaction = async (type: 'useful' | 'relevant' | 'inspiring') => {
    if (!currentUser) return;
    const newReactions = { ...reactions, [type]: (reactions[type] || 0) + 1 };
    setReactions(newReactions);
    try {
      if (isRealSupabase && supabase) {
        await supabase.from('posts').update({ reactions: newReactions }).eq('id', post.id);
      }
    } catch (e) { }
  };

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
      } else {
        setIsReading(false);
      }
    } catch (e) {
      setIsReading(false);
      addToast("Le Griot n'a pu porter sa voix.", "error");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Voulez-vous vraiment retirer cette onde du Cercle ?")) return;
    setDeleting(true);
    try {
      if (isRealSupabase && supabase) {
        await supabase.from('posts').delete().eq('id', post.id);
        addToast("L'onde a été dissipée.", "success");
      }
      onUpdate();
    } catch (e) {
      addToast("La suppression a échoué.", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (!author) return <PostSkeleton />;
  
  const isMajestic = post.is_majestic || author.role === Role.SUPER_ADMIN;
  const isAuthor = currentUser?.id === post.author_id;
  const isAdmin = currentUser?.role === Role.SUPER_ADMIN;
  
  const TRUNCATE_LIMIT = 320; 
  const needsTruncation = post.content.length > TRUNCATE_LIMIT;
  const displayContent = (needsTruncation && !isExpanded) ? post.content.slice(0, TRUNCATE_LIMIT) + '...' : post.content;

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
                {(author.role === Role.SUPER_ADMIN || author.isVerifiedEntity) && <ShieldCheck size={18} className={author.role === Role.SUPER_ADMIN ? "text-amber-600" : "text-blue-500"} />}
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
                disabled={isReading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest ${isReading ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'}`}
              >
                {isReading ? <Loader2 className="animate-spin" size={14} /> : <Volume2 size={14} />}
                {isReading ? "Le Griot parle..." : "Écouter la Sagesse"}
              </button>
            )}
            
            {(isAuthor || isAdmin) && (
              <button 
                onClick={handleDelete} 
                disabled={deleting}
                className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2.5 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                {deleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                <span className="text-[9px] font-black uppercase tracking-widest">{isAdmin && !isAuthor ? "Médiation" : "Retirer"}</span>
              </button>
            )}
          </div>
        </div>

        <div className={`text-gray-800 leading-[1.8] whitespace-pre-wrap ${isMajestic ? 'text-2xl md:text-3xl font-serif font-semibold italic border-l-4 border-amber-200 pl-8 mb-8 first-letter:text-6xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-amber-600 first-letter:leading-none' : 'text-lg font-normal mb-6'}`}>
          {displayContent}
        </div>

        {post.image_url && (
          <div className="relative rounded-[2.5rem] overflow-hidden border border-gray-100 mb-8 aspect-video bg-gray-50 group/image">
            <img 
              src={showClean && post.clean_vision_url ? post.clean_vision_url : post.image_url} 
              className="w-full h-full object-cover transition-all duration-700" 
              alt="Post visual" 
            />
            {post.clean_vision_url && (
              <div className="absolute bottom-6 inset-x-0 flex justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                <button 
                  onClick={() => setShowClean(!showClean)}
                  className={`px-6 py-3 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all border ${showClean ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/90 text-gray-900 border-white backdrop-blur-md'}`}
                >
                  {showClean ? <CheckCircle size={14}/> : <Sparkles size={14} className="text-emerald-500" />}
                  {showClean ? 'Vision Propre Active' : 'Révéler la Vision IA'}
                </button>
              </div>
            )}
          </div>
        )}

        {needsTruncation && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 hover:bg-blue-50 px-5 py-3 rounded-full transition-all mb-10"
          >
            {isExpanded ? <><ChevronUp size={14} /> Replier</> : <><ChevronDown size={14} /> Déplier la pensée</>}
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between pt-10 border-t border-gray-50 gap-6">
          <div className="flex flex-wrap gap-4">
            <button onClick={() => handleReaction('useful')} className="flex items-center gap-2 text-blue-600 bg-blue-50/50 px-5 py-2.5 rounded-xl font-black text-xs">
              <ThumbsUp size={18} /> {reactions.useful}
            </button>
            <button onClick={() => handleReaction('relevant')} className="flex items-center gap-2 text-emerald-600 bg-emerald-50/50 px-5 py-2.5 rounded-xl font-black text-xs">
              <Lightbulb size={18} /> {reactions.relevant}
            </button>
            <button onClick={() => handleReaction('inspiring')} className="flex items-center gap-2 text-amber-600 bg-amber-50/50 px-5 py-2.5 rounded-xl font-black text-xs">
              <Sparkles size={18} /> {reactions.inspiring}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-3 text-gray-500 hover:text-gray-900 bg-gray-50 px-6 py-3 rounded-xl transition-all shadow-sm">
              <MessageCircle size={18} /> <span className="text-xs font-black">{post.comments?.length || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active?: boolean; color?: string }> = ({ to, icon, label, active, color = "text-blue-600" }) => (
  <Link to={to} className={`flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${active ? `bg-blue-50 ${color} shadow-sm ring-1 ring-blue-100` : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
    {icon} {label}
  </Link>
);

const FeedPage: React.FC<{ user: User }> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 lg:pb-0">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <Logo size={32} showText variant="blue" />
        <Link to="/profile" className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-50">
          <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col lg:flex-row gap-12">
        
        {/* Barre Latérale Gauche - Desktop */}
        <aside className="hidden lg:block lg:w-80 space-y-8 sticky top-12 self-start">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-y-auto max-h-[90vh] no-scrollbar">
             <Logo size={40} showText variant="blue" className="mb-10" />
             
             <nav className="space-y-6">
                <section className="space-y-2">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">Navigation</div>
                  <NavLink to="/feed" active icon={<Home size={18} />} label="Agora Citoyenne" />
                  <NavLink to="/sentinel" icon={<Camera size={18} className="text-emerald-500" />} label="Sentinelle Verte" color="text-emerald-600" />
                  <NavLink to="/map" icon={<MapIcon size={18} className="text-blue-500" />} label="Empreinte CI" color="text-blue-600" />
                </section>

                <section className="space-y-2">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">Action & Impact</div>
                  <NavLink to="/quests" icon={<Target size={18} className="text-rose-500" />} label="Sentiers d'Impact" color="text-rose-600" />
                  <NavLink to="/solidarity" icon={<Handshake size={18} className="text-amber-500" />} label="Marché Solidaire" color="text-amber-600" />
                  <NavLink to="/ideas" icon={<Lightbulb size={18} className="text-yellow-500" />} label="Banque des Idées" color="text-yellow-600" />
                  <NavLink to="/governance" icon={<Gavel size={18} className="text-slate-500" />} label="Palais des Édits" color="text-slate-600" />
                </section>
                
                <section className="space-y-2">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">Intelligence & Studio</div>
                  <NavLink to="/griot" icon={<Video size={18} className="text-amber-500" />} label="Studio Griot" color="text-amber-600" />
                  <NavLink to="/studio" icon={<Rocket size={18} className="text-purple-500" />} label="Studio d'Impact" color="text-purple-600" />
                  <NavLink to="/compass" icon={<Compass size={18} className="text-indigo-500" />} label="Boussole Légale" color="text-indigo-600" />
                  <NavLink to="/assembly" icon={<Waves size={18} className="text-cyan-500" />} label="Assemblée Live" color="text-cyan-600" />
                </section>

                <section className="space-y-2">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">Transparence</div>
                  <NavLink to="/transparency" icon={<BarChart3 size={18} className="text-emerald-500" />} label="Registre des Flux" color="text-emerald-600" />
                </section>

                {isAdmin && (
                  <div className="pt-4 mt-4 border-t border-gray-50">
                    <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest px-4 mb-2">Souveraineté</div>
                    <NavLink to="/admin" icon={<Landmark size={18} className="text-amber-700" />} label="Conseil du Gardien" color="text-amber-700" />
                  </div>
                )}
             </nav>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6 px-2">Citoyen Connecté</h3>
            <Link to="/profile" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all group">
              <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-[8px] font-black uppercase text-blue-600 tracking-widest">{(user.impactScore || user.impact_score || 0).toLocaleString()} XP</p>
              </div>
            </Link>
          </div>
        </aside>

        {/* Contenu Principal */}
        <main className="flex-1 max-w-2xl mx-auto lg:mx-0">
          <header className="mb-12 flex justify-between items-end px-4">
            <div>
              <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2 tracking-tight">Agora</h1>
              <p className="text-gray-500 font-medium italic">Le pouls de la Nation Ivoirienne.</p>
            </div>
            <button 
              onClick={fetchPosts} 
              disabled={isRefreshing}
              className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 transition-all hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </header>

          <div className="space-y-2 px-2 md:px-0">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
            ) : posts.length > 0 ? (
              posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={user} 
                  onUpdate={fetchPosts} 
                />
              ))
            ) : (
              <div className="bg-white rounded-[3rem] p-20 border border-gray-100 text-center shadow-sm">
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Le silence règne sur l'Agora...</p>
              </div>
            )}
          </div>
        </main>

        {/* Barre Latérale Droite - Desktop */}
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

      {/* Mobile Bottom Navigation Bar - Optimized */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-2xl border-t border-gray-100 px-6 py-4 flex justify-between items-center z-[110] shadow-[0_-10_40px_rgba(0,0,0,0.05)]">
        <Link to="/feed" className="flex flex-col items-center gap-1 text-blue-600">
          <Home size={22} />
          <span className="text-[7px] font-black uppercase tracking-widest">Agora</span>
        </Link>
        <Link to="/quests" className="flex flex-col items-center gap-1 text-gray-400">
          <Target size={22} />
          <span className="text-[7px] font-black uppercase tracking-widest">Impact</span>
        </Link>
        <Link to="/sentinel" className="flex flex-col items-center gap-1 text-gray-400">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white -mt-10 shadow-2xl shadow-emerald-200 border-4 border-white active:scale-90 transition-all">
            <Camera size={24} />
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600 font-bold mt-1">Scan</span>
        </Link>
        <Link to="/solidarity" className="flex flex-col items-center gap-1 text-gray-400">
          <Handshake size={22} />
          <span className="text-[7px] font-black uppercase tracking-widest">Marché</span>
        </Link>
        <Link to="/griot" className="flex flex-col items-center gap-1 text-gray-400">
          <Video size={22} />
          <span className="text-[7px] font-black uppercase tracking-widest">Studio</span>
        </Link>
      </nav>
    </div>
  );
};

export default FeedPage;
