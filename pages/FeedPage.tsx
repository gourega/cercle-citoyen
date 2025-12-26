import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Volume2, Send, Tag, ChevronDown, Sparkles
} from 'lucide-react';
import { User, CircleType } from '../types';
import { getGriotReading, decodeBase64Audio, decodeAudioBuffer } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { CIRCLES_CONFIG } from '../constants';

const PostCard: React.FC<{ post: any }> = ({ post }) => {
  const [author, setAuthor] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAuthor = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', post.author_id).single();
      if (isMounted && data) {
        setAuthor(data);
      }
    };
    fetchAuthor();
    return () => { isMounted = false; };
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
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsLoadingAudio(false); 
    }
  };

  if (!author) return <div className="h-40 bg-gray-50 rounded-[3rem] animate-pulse mb-12"></div>;

  return (
    <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm hover:shadow-2xl transition-all group relative">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-5">
          <Link to={`/profile/${author.id}`}>
            <img src={author.avatar_url || `https://picsum.photos/seed/${author.id}/150/150`} className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white" alt="" />
          </Link>
          <div>
            <Link to={`/profile/${author.id}`} className="font-bold text-lg text-gray-900 hover:text-blue-600 transition-colors">
              {author.name}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
              <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1">
                <Tag size={10} /> {post.circle_type}
              </span>
            </div>
          </div>
        </div>
        <button onClick={toggleAudio} className={`p-3 rounded-2xl transition-all ${isPlaying ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
          {isLoadingAudio ? <Loader2 className="animate-spin w-5 h-5" /> : <Volume2 size={20} />}
        </button>
      </div>
      <div className="text-gray-900 text-lg leading-relaxed mb-10 font-medium whitespace-pre-wrap">
        {post.content}
      </div>
      <div className="flex items-center gap-8 pt-8 border-t border-gray-50">
        <button className="flex items-center gap-2 text-[11px] font-black uppercase text-gray-400 hover:text-blue-600 transition-colors">
          <ThumbsUp size={18} /> {post.reactions?.useful || 0}
        </button>
        <button className="flex items-center gap-2 text-[11px] font-black uppercase text-gray-400 hover:text-amber-500 transition-colors">
          <Lightbulb size={18} /> {post.reactions?.inspiring || 0}
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
  const [showCircles, setShowCircles] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (isMounted && data) {
        setPosts(data);
        setLoading(false);
      }
    };

    fetchPosts();

    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        if (isMounted) {
          setPosts(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => { 
      isMounted = false;
      supabase.removeChannel(channel); 
    };
  }, []);

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    setSending(true);
    const { error } = await supabase.from('posts').insert([
      {
        author_id: user.id,
        content: newPostText,
        circle_type: selectedCircle
      }
    ]);
    if (!error) {
      setNewPostText('');
      setShowCircles(false);
    }
    setSending(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
       <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Sparkles className="text-blue-600" /> Le Mur des Citoyens
          </h2>
          <p className="text-gray-500 font-medium">Réflexions, initiatives et éveil collectif.</p>
       </div>

       <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm mb-16 relative overflow-visible">
          <div className="flex items-center gap-4 mb-6">
            <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
            <div className="relative">
              <button 
                onClick={() => setShowCircles(!showCircles)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all"
              >
                Cercle : {selectedCircle} <ChevronDown size={14} />
              </button>
              {showCircles && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-[2rem] shadow-2xl z-50 p-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto no-scrollbar">
                    {CIRCLES_CONFIG.map(c => (
                      <button 
                        key={c.type}
                        onClick={() => { setSelectedCircle(c.type); setShowCircles(false); }}
                        className={`text-left p-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedCircle === c.type ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-400'}`}
                      >
                        {c.type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <textarea 
            value={newPostText}
            onChange={e => setNewPostText(e.target.value)}
            placeholder="Partagez une réflexion pour la cité..."
            className="w-full h-32 bg-gray-50 rounded-2xl p-6 text-gray-800 outline-none border border-transparent focus:border-blue-100 focus:bg-white transition-all resize-none mb-4 font-medium"
          />
          <div className="flex justify-end">
             <button 
               onClick={handleCreatePost}
               disabled={sending || !newPostText.trim()}
               className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-gray-200"
             >
               {sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={16} />}
               Publier l'étincelle
             </button>
          </div>
       </div>

       {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
             <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
             <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.4em]">Consultation des ondes...</p>
          </div>
       ) : (
          <div className="space-y-12">
             {posts.map(p => <PostCard key={p.id} post={p} />)}
             {posts.length === 0 && (
               <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                 <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Aucune étincelle pour le moment.</p>
               </div>
             )}
          </div>
       )}
    </div>
  );
};

export default FeedPage;