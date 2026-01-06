
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Send, Sparkles, 
  ShieldCheck, MessageCircle, RefreshCw, 
  Info, Pencil, Save, Trash2, Crown,
  TrendingUp, Users, Heart, ChevronRight,
  Flame, Award, Clock, Share2, ChevronDown, ChevronUp,
  Bold, Italic, Smile, MoreHorizontal
} from 'lucide-react';
import { User, CircleType, Role, Post, Comment } from '../types.ts';
import { supabase, isRealSupabase, db } from '../lib/supabase.ts';
import { CIRCLES_CONFIG } from '../constants.tsx';
import { MOCK_POSTS } from '../lib/mocks.ts';
import { useToast } from '../App.tsx';

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
      <div className="w-5/6 h-4 bg-gray-100 rounded"></div>
      <div className="w-4/6 h-4 bg-gray-100 rounded"></div>
    </div>
    <div className="pt-8 border-t border-gray-50 flex gap-4">
      <div className="w-12 h-6 bg-gray-50 rounded-full"></div>
      <div className="w-12 h-6 bg-gray-50 rounded-full"></div>
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
  const [reactions, setReactions] = useState(post.reactions || { useful: 0, relevant: 0, inspiring: 0 });

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!isRealSupabase || !supabase) {
        setAuthor({ name: "Citoyen", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
        return;
      }
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', post.author_id).maybeSingle();
        setAuthor(data || { name: "Citoyen", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
      } catch (e) {
        setAuthor({ name: "Citoyen", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
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
    } catch (e) { addToast("Action enregistrée localement", "info"); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#/feed?post=${post.id}`);
    addToast("Lien de la réflexion copié !", "success");
  };

  if (!author) return <PostSkeleton />;
  
  const isMajestic = post.is_majestic || author.role === Role.SUPER_ADMIN;
  const isAuthor = currentUser?.id === post.author_id;
  const needsTruncation = post.content.length > 280;
  const displayContent = (needsTruncation && !isExpanded) ? post.content.slice(0, 280) + '...' : post.content;

  return (
    <article className={`bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all mb-10 overflow-hidden animate-in fade-in duration-500 ${isMajestic ? 'ring-2 ring-amber-100 shadow-amber-50' : ''}`}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/profile/${post.author_id}`} className="relative group">
              <img src={author.avatar_url} className="w-14 h-14 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-105" alt="" />
              {isMajestic && <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1.5 rounded-lg border-2 border-white shadow-lg"><Crown size={12} /></div>}
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900">{author.name}</p>
                {author.role === Role.SUPER_ADMIN && <ShieldCheck size={16} className="text-amber-600" />}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {getRelativeTime(post.created_at)} • {post.circle_type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthor && (
              <button onClick={() => addToast("Édition bientôt disponible", "info")} className="p-2 text-gray-300 hover:text-blue-600 transition-colors" title="Modifier">
                <Pencil size={18} />
              </button>
            )}
            <button className="text-gray-300 hover:text-gray-900 p-2"><MoreHorizontal /></button>
          </div>
        </div>

        <div className={`text-gray-800 leading-relaxed whitespace-pre-wrap ${isMajestic ? 'text-2xl font-serif italic border-l-4 border-amber-200 pl-8 mb-4' : 'text-lg font-normal mb-4'}`}>
          {displayContent}
        </div>

        {needsTruncation && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2 hover:underline"
          >
            {isExpanded ? <><ChevronUp size={14} /> Réduire</> : <><ChevronDown size={14} /> Lire la suite</>}
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between pt-8 border-t border-gray-50 gap-4">
          <div className="flex flex-wrap gap-4">
            <button onClick={() => handleReaction('useful')} className="flex items-center gap-2 text-blue-600 hover:scale-110 transition-transform bg-blue-50/50 px-4 py-2 rounded-xl">
              <ThumbsUp size={16} /> <span className="text-xs font-black">{reactions.useful}</span>
            </button>
            <button onClick={() => handleReaction('relevant')} className="flex items-center gap-2 text-emerald-600 hover:scale-110 transition-transform bg-emerald-50/50 px-4 py-2 rounded-xl">
              <Lightbulb size={16} /> <span className="text-xs font-black">{reactions.relevant}</span>
            </button>
            <button onClick={() => handleReaction('inspiring')} className="flex items-center gap-2 text-amber-600 hover:scale-110 transition-transform bg-amber-50/50 px-4 py-2 rounded-xl">
              <Sparkles size={16} /> <span className="text-xs font-black">{reactions.inspiring}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 px-4 py-2 rounded-xl transition-all" title="Partager">
              <Share2 size={16} /> <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Partager</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 px-4 py-2 rounded-xl transition-all">
              <MessageCircle size={16} /> <span className="text-xs font-black">{post.comments?.length || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const FeedPage: React.FC<{ user: User | null }> = ({ user }) => {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<CircleType>(CircleType.PEACE);
  const [sending, setSending] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    if (isRealSupabase && supabase) { 
      try {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setPosts(data || []);
      } catch (e) { 
        console.warn("Using mock data due to connection error", e);
        setPosts(MOCK_POSTS); 
      }
    } else { 
      setPosts(MOCK_POSTS); 
    }
    setLoading(false); 
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCreatePost = async () => {
    if (!newPostText.trim() || !user) return;
    setSending(true);
    const postData = { 
      author_id: user.id, 
      content: newPostText, 
      circle_type: selectedCircle, 
      is_majestic: user.role === Role.SUPER_ADMIN,
      reactions: { useful: 0, relevant: 0, inspiring: 0 },
      created_at: new Date().toISOString()
    };
    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('posts').insert([postData]);
        if (error) throw error;
        addToast("Onde citoyenne propagée !", "success");
        fetchPosts();
      } else {
        setPosts(prev => [ { ...postData, id: 'local-' + Date.now() } as Post, ...prev]);
        addToast("Action enregistrée en local", "info");
      }
      setNewPostText('');
    } catch (e) { 
      addToast("La cité rencontre une difficulté technique.", "error"); 
    }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Fil d'Éveil</h1>
        <p className="text-gray-500 font-medium italic text-lg">Dialogue citoyen souverain.</p>
      </div>

      {user && (
        <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm mb-16 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-focus-within:rotate-12 transition-transform duration-700">
            <Sparkles size={100} className="text-blue-600" />
          </div>
          
          <div className="relative z-10">
            <textarea 
              value={newPostText} 
              onChange={e => setNewPostText(e.target.value)} 
              placeholder="Déposez une pierre à l'édifice..." 
              className="w-full h-32 bg-gray-50/50 p-6 rounded-2xl outline-none mb-4 font-normal text-lg focus:bg-white transition-all resize-none border-2 border-transparent focus:border-blue-50" 
            />
            
            {/* TOOLBAR MISE EN FORME */}
            <div className="flex items-center gap-6 mb-6 px-4">
              <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Gras">
                <Bold size={20} />
              </button>
              <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Italique">
                <Italic size={20} />
              </button>
              <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Émojis">
                <Smile size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">Cercle :</span>
              <select value={selectedCircle} onChange={e => setSelectedCircle(e.target.value as any)} className="bg-gray-50 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-blue-100 cursor-pointer">
                {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
              </select>
            </div>
            <button onClick={handleCreatePost} disabled={sending || !newPostText.trim()} className="w-full sm:w-auto bg-gray-900 text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-30 shadow-xl hover:bg-black active:scale-95 transition-all">
              {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} 
              Diffuser l'Onde
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : (
          posts.length > 0 ? (
            posts.map(p => <PostCard key={p.id} post={p} currentUser={user} onUpdate={fetchPosts} />)
          ) : (
            <div className="p-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
               <RefreshCw size={40} className="mx-auto mb-4 text-gray-200" />
               <p className="text-gray-400 font-bold uppercase tracking-widest">Le fil est encore calme...</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FeedPage;
