import React, { useState, useEffect, useRef } from 'react';
import { 
  ThumbsUp, Lightbulb, Loader2, Send, Sparkles, 
  ShieldCheck, MessageCircle, RefreshCw, 
  Crown, Share2, ChevronDown, ChevronUp,
  Bold, Italic, Smile, Type as TypeIcon,
  Volume2, Trash2, Camera
} from 'lucide-react';
import { User, CircleType, Role, Post } from '../types';
import { supabase, isRealSupabase } from '../lib/supabase';
import { CIRCLES_CONFIG } from '../constants';
import { MOCK_POSTS } from '../lib/mocks';
import { useToast } from '../App';
import { getGriotReading, decode, decodeAudioData } from '../lib/gemini';

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
  return date.toLocaleDateString();
};

const PostCard: React.FC<{ post: Post, currentUser: User | null, onUpdate: () => void }> = ({ post, currentUser, onUpdate }) => {
  const { addToast } = useToast();
  const [author, setAuthor] = useState<any>(null);
  const [isReading, setIsReading] = useState(false);
  const [reactions, setReactions] = useState(post.reactions || { useful: 0, relevant: 0, inspiring: 0 });
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!isRealSupabase || !supabase) {
        setAuthor({ name: "Citoyen", avatar: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', post.author_id).maybeSingle();
      setAuthor(data ? { ...data, avatar: data.avatar_url || data.avatar } : { name: "Anonyme", avatar: `https://picsum.photos/seed/anon/150/150`, role: Role.MEMBER });
    };
    fetchAuthor();
  }, [post.author_id]);

  const handleReaction = async (type: keyof typeof reactions) => {
    const newReactions = { ...reactions, [type]: reactions[type] + 1 };
    setReactions(newReactions);
    if (isRealSupabase && supabase) {
      await supabase.from('posts').update({ reactions: newReactions }).eq('id', post.id);
    }
  };

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
    } catch (e) {
      setIsReading(false);
      addToast("Le Griot n'est pas disponible.", "error");
    }
  };

  if (!author) return null;
  const isMajestic = post.is_majestic || author.role === Role.SUPER_ADMIN;

  return (
    <article className={`bg-[#11141b] rounded-[2.5rem] border border-white/5 shadow-xl mb-8 overflow-hidden transition-all hover:border-blue-500/20 group ${isMajestic ? 'ring-1 ring-amber-500/30' : ''}`}>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={author.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
              {isMajestic && <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-md"><Crown size={10} /></div>}
            </div>
            <div>
              <p className="font-bold text-sm flex items-center gap-1">
                {author.name} 
                {author.role === Role.SUPER_ADMIN && <ShieldCheck size={14} className="text-amber-500" />}
              </p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{getRelativeTime(post.created_at)} • {post.circle_type}</p>
            </div>
          </div>
          <button onClick={handleListen} disabled={isReading} className={`p-2 rounded-xl transition-all ${isReading ? 'bg-amber-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
            <Volume2 size={18} />
          </button>
        </div>

        <div className={`text-gray-300 leading-relaxed whitespace-pre-wrap mb-6 ${isMajestic ? 'text-xl font-serif italic text-white' : 'text-base'}`}>
          {post.content}
        </div>

        {post.image_url && (
          <div className="rounded-3xl overflow-hidden mb-6 border border-white/5">
            <img src={post.image_url} className="w-full h-auto object-cover" alt="Impact" />
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex gap-2">
            <button onClick={() => handleReaction('useful')} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-all">
              <ThumbsUp size={14} /> {reactions.useful}
            </button>
            <button onClick={() => handleReaction('relevant')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all">
              <Lightbulb size={14} /> {reactions.relevant}
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-white transition-all">
            <MessageCircle size={18} /> <span className="text-xs font-bold">{post.comments?.length || 0}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

const FeedPage: React.FC<{ user: User }> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [selectedCircle, setSelectedCircle] = useState(CircleType.PEACE);
  const { addToast } = useToast();

  const fetchPosts = async () => {
    setLoading(true);
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (data) setPosts(data);
    } else {
      setPosts(MOCK_POSTS);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    const postData = {
      author_id: user.id,
      content: newPost,
      circle_type: selectedCircle,
      reactions: { useful: 0, relevant: 0, inspiring: 0 },
      created_at: new Date().toISOString()
    };
    
    if (isRealSupabase && supabase) {
      await supabase.from('posts').insert([postData]);
      fetchPosts();
    } else {
      setPosts(prev => [{ ...postData, id: Math.random().toString() } as Post, ...prev]);
    }
    setNewPost('');
    addToast("Onde citoyenne diffusée !", "success");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">Fil d'Éveil</h1>
        <p className="text-gray-500 font-medium italic">Penser. Relier. Agir.</p>
      </div>

      {/* Compositeur */}
      <div className="bg-[#11141b] rounded-[2.5rem] p-6 mb-12 border border-white/5 shadow-2xl">
        <textarea 
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          className="w-full h-32 bg-transparent text-lg text-white outline-none resize-none mb-4 placeholder:text-gray-600"
          placeholder="Déposez une pierre à l'édifice..."
        />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <select 
              value={selectedCircle}
              onChange={e => setSelectedCircle(e.target.value as CircleType)}
              className="bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none"
            >
              {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
            </select>
            <button className="text-gray-500 hover:text-white p-2 transition-all"><Camera size={20}/></button>
          </div>
          <button 
            onClick={handlePost}
            disabled={!newPost.trim()}
            className="w-full sm:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
          >
            <Send size={16} /> Diffuser
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : (
        <div className="space-y-4">
          {posts.map(p => <PostCard key={p.id} post={p} currentUser={user} onUpdate={fetchPosts} />)}
        </div>
      )}
    </div>
  );
};

export default FeedPage;