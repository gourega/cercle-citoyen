
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Send, Sparkles, 
  ShieldCheck, MessageCircle, RefreshCw, 
  Pencil, Crown, Share2, ChevronDown, ChevronUp,
  Bold, Italic, Smile, MoreHorizontal, Type as TypeIcon,
  Volume2, Trash2, CheckCircle, LayoutGrid, Map as MapIcon, 
  Video, Gavel, BookText, Compass, Waves, Landmark
} from 'lucide-react';
import { User, CircleType, Role, Post } from '../types';
import { supabase, isRealSupabase } from '../lib/supabase';
import { CIRCLES_CONFIG } from '../constants';
import { MOCK_POSTS } from '../lib/mocks';
import { useToast } from '../App';
import { getGriotReading, decode, decodeAudioData } from '../lib/gemini';
import Logo from '../Logo';

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
      if (post.author_id === '00000000-0000-0000-0000-000000000001') {
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

const FeedPage: React.FC<{ user: User }> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 flex flex-col lg:flex-row gap-12">
        
        {/* Barre Latérale Gauche */}
        <aside className="hidden lg:block lg:w-72 space-y-8 sticky top-12 self-start">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-y-auto max-h-[85vh] no-scrollbar">
             <Logo size={40} showText variant="blue" className="mb-10" />
             
             <nav className="space-y-4">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">Navigation</div>
                <Link to="/feed" className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest shadow-sm">
                  <LayoutGrid size={18} /> Agora Citoyenne
                </Link>
                <Link to="/sentinel" className="flex items-center gap-4 p-4 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-black text-[10px] uppercase tracking-widest transition-all">
                  <ShieldCheck size={18} className="text-emerald-500" /> Sentinelle Verte
                </Link>
                <Link to="/map" className="flex items-center gap-4 p-4 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-black text-[10px] uppercase tracking-widest transition-all">
                  <MapIcon size={18} className="text-blue-500" /> Empreinte CI
                </Link>
                
                <div className="pt-6 text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2 border-t border-gray-50">Intelligence & Studio</div>
                <Link to="/griot" className="flex items-center gap-4 p-4 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-black text-[10px] uppercase tracking-widest transition-all">
                  <Video size={18} className="text-amber-500" /> Studio Griot
                </Link>
                <Link to="/compass" className="flex items-center gap-4 p-4 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-black text-[10px] uppercase tracking-widest transition-all">
                  <Compass size={18} className="text-indigo-500" /> Boussole Légale
                </Link>
                <Link to="/assembly" className="flex items-center gap-4 p-4 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-black text-[10px] uppercase tracking-widest transition-all">
                  <Waves size={18} className="text-cyan-500" /> Assemblée Live
                </Link>

                {isAdmin && (
                  <div className="pt-6 mt-4 border-t border-gray-50">
                    <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest px-4 mb-2">Souveraineté</div>
                    <Link to="/admin" className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 text-amber-700 font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-amber-100 transition-all">
                      <Landmark size={18} /> Conseil du Gardien
                    </Link>
                  </div>
                )}
             </nav>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6 px-2">Citoyen</h3>
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

          <div className="space-y-2">
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
                <Sparkles size={48} className="text-gray-100 mx-auto mb-6" />
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Le silence règne sur l'Agora...</p>
              </div>
            )}
          </div>
        </main>

        {/* Barre Latérale Droite */}
        <aside className="hidden xl:block w-72 space-y-8 sticky top-12 self-start">
           <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
                <Crown size={120} />
              </div>
              <h3 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-6 relative z-10">Parole de Sagesse</h3>
              <p className="text-sm text-gray-700 leading-relaxed font-serif italic relative z-10">
                "La cité ne se bâtit pas avec des mots, mais avec des actes reliés par une vision commune."
              </p>
           </div>
           
           <div className="bg-blue-600 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
              <Sparkles className="absolute -top-4 -right-4 w-24 h-24 opacity-20" />
              <h4 className="text-xl font-serif font-bold mb-4 leading-tight">Proposez votre <br/>propre Sentier</h4>
              <p className="text-xs text-blue-100 mb-8 opacity-80">Chaque citoyen peut initier une action pour transformer sa localité.</p>
              <Link to="/quests" className="block text-center bg-white text-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-all">
                Tracer un Sentier
              </Link>
           </div>
        </aside>

      </div>
    </div>
  );
};

export default FeedPage;
