
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Volume2, Send, Tag, Sparkles, Bell
} from 'lucide-react';
import { User, CircleType } from '../types';
import { getGriotReading, decodeBase64Audio, decodeAudioBuffer } from '../lib/gemini';
import { supabase, isRealSupabase } from '../lib/supabase';
import { CIRCLES_CONFIG } from '../constants';

const PostCard: React.FC<{ post: any }> = ({ post }) => {
  const [author, setAuthor] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!supabase) {
        setAuthor({ name: "Citoyen", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150` });
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', post.author_id).maybeSingle();
      setAuthor(data || { name: "Citoyen Anonyme", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150` });
    };
    fetchAuthor();
  }, [post.author_id]);

  const toggleAudio = async () => {
    if (isPlaying) { setIsPlaying(false); return; }
    setIsLoadingAudio(true);
    try {
      const b64 = await getGriotReading(post.content);
      if (b64) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const buffer = await decodeAudioBuffer(decodeBase64Audio(b64), audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start(0);
        setIsPlaying(true);
      }
    } catch (e) { console.error(e); } finally { setIsLoadingAudio(false); }
  };

  if (!author) return <div className="h-48 bg-gray-50 rounded-[2.5rem] animate-pulse mb-8"></div>;

  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all mb-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <img src={author.avatar_url || `https://picsum.photos/seed/${post.author_id}/150/150`} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
          <div>
            <h4 className="font-bold text-gray-900">{author.name}</h4>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
              {new Date(post.created_at).toLocaleDateString()} • <span className="text-blue-600">{post.circle_type}</span>
            </div>
          </div>
        </div>
        <button onClick={toggleAudio} className={`p-3 rounded-2xl transition-all ${isPlaying ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
          {isLoadingAudio ? <Loader2 className="animate-spin w-5 h-5" /> : <Volume2 size={20} />}
        </button>
      </div>
      <p className="text-gray-800 text-lg leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>
      <div className="flex gap-6 pt-6 border-t border-gray-50">
        <button className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-blue-600">
          <ThumbsUp size={16} /> Utile ({post.reactions?.useful || 0})
        </button>
        <button className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-amber-500">
          <Lightbulb size={16} /> Inspirant ({post.reactions?.inspiring || 0})
        </button>
      </div>
    </div>
  );
};

const FeedPage: React.FC<{ user: User }> = ({ user }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<CircleType>(CircleType.PEACE);
  const [sending, setSending] = useState(false);
  const [newIncomingCount, setNewIncomingCount] = useState(0);

  const fetchPosts = async () => {
    if (!supabase) {
      const local = JSON.parse(localStorage.getItem('cercle_db_posts') || '[]');
      setPosts(local);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
    setNewIncomingCount(0);
  };

  useEffect(() => {
    fetchPosts();

    // REALTIME: Écouter les nouvelles publications dans toute la cité
    if (supabase) {
      const channel = supabase
        .channel('public:posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
          // Si ce n'est pas notre propre post, on notifie
          if (payload.new.author_id !== user.id) {
            setNewIncomingCount(prev => prev + 1);
          } else {
            setPosts(prev => [payload.new, ...prev]);
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user.id]);

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    setSending(true);
    
    if (supabase) {
      const { error } = await supabase.from('posts').insert([{
        author_id: user.id,
        content: newPostText,
        circle_type: selectedCircle
      }]);
      if (!error) {
        setNewPostText('');
      }
    } else {
      // Fallback local
      const posts = JSON.parse(localStorage.getItem('cercle_db_posts') || '[]');
      const newPost = { id: crypto.randomUUID(), author_id: user.id, content: newPostText, circle_type: selectedCircle, created_at: new Date().toISOString() };
      localStorage.setItem('cercle_db_posts', JSON.stringify([newPost, ...posts]));
      setPosts([newPost, ...posts]);
      setNewPostText('');
    }
    setSending(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">L'Éveil de la Cité</h2>
          <p className="text-gray-500 font-medium">La mémoire vive de notre nation.</p>
        </div>
        {newIncomingCount > 0 && (
          <button 
            onClick={fetchPosts}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce shadow-lg"
          >
            <Bell size={14} /> {newIncomingCount} Nouvelles étincelles
          </button>
        )}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-12">
        <textarea 
          value={newPostText}
          onChange={e => setNewPostText(e.target.value)}
          placeholder="Partagez une réflexion pour le bien commun..."
          className="w-full h-32 bg-gray-50 rounded-2xl p-6 text-gray-800 outline-none border border-transparent focus:border-blue-100 mb-4 font-medium transition-all"
        />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
            <Tag size={14} className="text-blue-600" />
            <select 
              value={selectedCircle}
              onChange={e => setSelectedCircle(e.target.value as CircleType)}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none"
            >
              {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
            </select>
          </div>
          <button 
            onClick={handleCreatePost}
            disabled={sending || !newPostText.trim()}
            className="w-full sm:w-auto px-10 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
          >
            {sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={16} />} Publier
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4 text-gray-400">
          <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
          <p className="text-[10px] font-black uppercase tracking-widest">Récupération des ondes...</p>
        </div>
      ) : posts.length > 0 ? (
        posts.map(p => <PostCard key={p.id} post={p} />)
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
           <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-4" />
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Le silence précède souvent la grande sagesse.</p>
        </div>
      )}
    </div>
  );
};

export default FeedPage;
