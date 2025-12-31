
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
import { User, CircleType, Role, Post, Comment } from '../types';
import { supabase, isRealSupabase, db } from '../lib/supabase';
import { CIRCLES_CONFIG } from '../constants';
import { MOCK_POSTS } from '../lib/mocks';
import { useToast } from '../App';

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
  return date.toLocaleDateString();
};

const PostCard: React.FC<{ 
  post: Post, 
  currentUser: User | null, 
  onUpdate: () => void 
}> = ({ post, currentUser, onUpdate }) => {
  const { addToast } = useToast();
  const [author, setAuthor] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const [reactions, setReactions] = useState(post.reactions || { useful: 0, relevant: 0, inspiring: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [commentInput, setCommentInput] = useState('');

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!isRealSupabase || !supabase) {
        setAuthor({ name: "Citoyen", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', post.author_id).maybeSingle();
      setAuthor(data || { name: "Citoyen", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
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
    } catch (e) { addToast("Erreur de réaction", "error"); }
  };

  if (!author) return <div className="h-64 bg-gray-50 rounded-[3rem] animate-pulse mb-8"></div>;
  
  const isMajestic = post.is_majestic || author.role === Role.SUPER_ADMIN;

  return (
    <article className={`bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all mb-10 overflow-hidden ${isMajestic ? 'ring-2 ring-amber-100' : ''}`}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/profile/${post.author_id}`} className="relative">
              <img src={author.avatar_url} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt="" />
              {isMajestic && <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-lg border-2 border-white"><Crown size={10} /></div>}
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
          <button className="text-gray-300 hover:text-gray-900"><MoreHorizontal /></button>
        </div>

        <div className={`text-gray-800 leading-relaxed ${isMajestic ? 'text-2xl font-serif italic border-l-4 border-amber-200 pl-8 mb-8' : 'text-lg font-medium mb-8'}`}>
          {post.content}
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-gray-50">
          <div className="flex gap-4">
            <button onClick={() => handleReaction('useful')} className="flex items-center gap-2 text-blue-600 hover:scale-110 transition-transform">
              <ThumbsUp size={18} /> <span className="text-xs font-black">{reactions.useful}</span>
            </button>
            <button onClick={() => handleReaction('relevant')} className="flex items-center gap-2 text-emerald-600 hover:scale-110 transition-transform">
              <Lightbulb size={18} /> <span className="text-xs font-black">{reactions.relevant}</span>
            </button>
            <button onClick={() => handleReaction('inspiring')} className="flex items-center gap-2 text-amber-600 hover:scale-110 transition-transform">
              <Sparkles size={18} /> <span className="text-xs font-black">{reactions.inspiring}</span>
            </button>
          </div>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900">
            <MessageCircle size={18} /> <span className="text-xs font-black">{post.comments?.length || 0}</span>
          </button>
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
        const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        setPosts(data || []);
      } catch (e) { setPosts(MOCK_POSTS); }
    } else { setPosts(MOCK_POSTS); }
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
        await supabase.from('posts').insert([postData]);
        addToast("Onde propagée !", "success");
      } else {
        setPosts(prev => [ { ...postData, id: 'local-' + Date.now() } as Post, ...prev]);
        addToast("Simulé en local", "info");
      }
      setNewPostText('');
      fetchPosts();
    } catch (e) { addToast("Échec", "error"); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Fil d'Éveil</h1>
        <p className="text-gray-500 font-medium italic text-lg">Dialogue citoyen souverain.</p>
      </div>

      {user && (
        <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm mb-16">
          <textarea 
            value={newPostText} 
            onChange={e => setNewPostText(e.target.value)} 
            placeholder="Déposez une pierre à l'édifice..." 
            className="w-full h-32 bg-gray-50/50 p-6 rounded-2xl outline-none mb-6 font-medium text-lg focus:bg-white transition-all resize-none border-2 border-transparent focus:border-blue-50" 
          />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <select value={selectedCircle} onChange={e => setSelectedCircle(e.target.value as any)} className="bg-gray-50 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none">
              {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
            </select>
            <button onClick={handleCreatePost} disabled={sending || !newPostText.trim()} className="bg-gray-900 text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-30">
              {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} 
              Diffuser l'Onde
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : posts.map(p => <PostCard key={p.id} post={p} currentUser={user} onUpdate={fetchPosts} />)}
      </div>
    </div>
  );
};

export default FeedPage;
