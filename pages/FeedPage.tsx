
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Send, Sparkles, 
  ShieldCheck, MessageCircle, RefreshCw, 
  Pencil, Crown, Share2, ChevronDown, ChevronUp,
  Bold, Italic, Smile, MoreHorizontal, Type as TypeIcon
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
  const TRUNCATE_LIMIT = 300; 
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
            {isAuthor && (
              <button onClick={() => addToast("Édition bientôt disponible", "info")} className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Modifier">
                <Pencil size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Modifier</span>
              </button>
            )}
            <button className="text-gray-300 hover:text-gray-900 p-2"><MoreHorizontal /></button>
          </div>
        </div>

        <div className={`text-gray-800 leading-[1.8] whitespace-pre-wrap ${isMajestic ? 'text-2xl md:text-3xl font-serif font-semibold italic border-l-4 border-amber-200 pl-8 mb-8 first-letter:text-6xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-amber-600 first-letter:leading-none' : 'text-lg font-normal mb-6'}`}>
          {displayContent}
        </div>

        {needsTruncation && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.3em] mb-10 flex items-center gap-2 hover:bg-blue-50 px-5 py-3 rounded-full transition-all w-fit shadow-sm border border-blue-50"
          >
            {isExpanded ? <><ChevronUp size={14} /> Replier la Sagesse</> : <><ChevronDown size={14} /> Déplier la Sagesse</>}
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between pt-10 border-t border-gray-50 gap-6">
          <div className="flex flex-wrap gap-4">
            <button onClick={() => handleReaction('useful')} className="flex items-center gap-2 text-blue-600 hover:scale-110 transition-transform bg-blue-50/50 px-5 py-2.5 rounded-xl group shadow-sm border border-blue-50/50">
              <ThumbsUp size={18} className="group-active:scale-125 transition-transform" /> <span className="text-xs font-black">{reactions.useful}</span>
            </button>
            <button onClick={() => handleReaction('relevant')} className="flex items-center gap-2 text-emerald-600 hover:scale-110 transition-transform bg-emerald-50/50 px-5 py-2.5 rounded-xl group shadow-sm border border-emerald-50/50">
              <Lightbulb size={18} className="group-active:scale-125 transition-transform" /> <span className="text-xs font-black">{reactions.relevant}</span>
            </button>
            <button onClick={() => handleReaction('inspiring')} className="flex items-center gap-2 text-amber-600 hover:scale-110 transition-transform bg-amber-50/50 px-5 py-2.5 rounded-xl group shadow-sm border border-amber-50/50">
              <Sparkles size={18} className="group-active:scale-125 transition-transform" /> <span className="text-xs font-black">{reactions.inspiring}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="flex items-center gap-3 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-100/50 px-6 py-3 rounded-xl transition-all group shadow-sm" title="Partager">
              <Share2 size={18} className="group-hover:rotate-12 transition-transform" /> <span className="text-[10px] font-black uppercase tracking-widest">Partager</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-3 text-gray-500 hover:text-gray-900 bg-gray-50 px-6 py-3 rounded-xl transition-all shadow-sm">
              <MessageCircle size={18} /> <span className="text-xs font-black">{post.comments?.length || 0}</span>
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
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

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
      setIsBold(false);
      setIsItalic(false);
    } catch (e) { 
      addToast("La cité rencontre une difficulté technique.", "error"); 
    }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      <div className="mb-12">
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6 tracking-tight">Fil d'Éveil</h1>
        <p className="text-gray-500 font-medium italic text-xl">Dialogue citoyen souverain.</p>
      </div>

      {user && (
        <div className="bg-white rounded-[3.5rem] border-2 border-gray-100 p-10 shadow-xl mb-16 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-focus-within:rotate-12 transition-transform duration-700">
            <Sparkles size={120} className="text-blue-600" />
          </div>
          
          <div className="relative z-10">
            <textarea 
              value={newPostText} 
              onChange={e => setNewPostText(e.target.value)} 
              placeholder="Déposez une pierre à l'édifice..." 
              className={`w-full h-44 bg-gray-50/50 p-8 rounded-3xl outline-none mb-4 font-normal text-xl focus:bg-white transition-all resize-none border-2 border-transparent focus:border-blue-100/30 ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''}`} 
            />
            
            <div className="flex items-center gap-2 mb-8 px-2">
              <button 
                onClick={() => setIsBold(!isBold)} 
                className={`p-3 rounded-xl transition-all ${isBold ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}
                title="Gras"
              >
                <Bold size={18} />
              </button>
              <button 
                onClick={() => setIsItalic(!isItalic)} 
                className={`p-3 rounded-xl transition-all ${isItalic ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}
                title="Italique"
              >
                <Italic size={18} />
              </button>
              <div className="w-px h-6 bg-gray-100 mx-2"></div>
              <button className="p-3 text-gray-400 hover:bg-gray-100 rounded-xl transition-all" title="Émojis">
                <Smile size={18} />
              </button>
              <button className="p-3 text-gray-400 hover:bg-gray-100 rounded-xl transition-all" title="Style de texte">
                <TypeIcon size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">Destination :</span>
              <select value={selectedCircle} onChange={e => setSelectedCircle(e.target.value as any)} className="bg-gray-50 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-blue-100 cursor-pointer shadow-sm hover:bg-gray-100 transition-all font-bold">
                {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
              </select>
            </div>
            <button onClick={handleCreatePost} disabled={sending || !newPostText.trim()} className="w-full sm:w-auto bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 disabled:opacity-30 shadow-2xl hover:bg-black active:scale-95 transition-all">
              {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} className="text-blue-400" />} 
              Diffuser l'Onde
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : (
          posts.length > 0 ? (
            posts.map(p => <PostCard key={p.id} post={p} currentUser={user} onUpdate={fetchPosts} />)
          ) : (
            <div className="p-24 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-100">
               <RefreshCw size={48} className="mx-auto mb-8 text-gray-200" />
               <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Le fil est en attente d'étincelles...</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FeedPage;
