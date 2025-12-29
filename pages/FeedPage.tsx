
import React, { useState, useEffect, useRef } from 'react';
import { 
  ThumbsUp, Lightbulb, Loader2, Volume2, Send, Sparkles, 
  Crown, Share2, ShieldCheck, Heart, MessageCircle, 
  MoreHorizontal, RefreshCw, Info, Play, Pause, AlertCircle,
  Bookmark
} from 'lucide-react';
import { User, CircleType, Role } from '../types';
import { getGriotReading, decode, decodeAudioData } from '../lib/gemini';
import { supabase, isRealSupabase } from '../lib/supabase';
import { CIRCLES_CONFIG } from '../constants';
import { MOCK_POSTS } from '../lib/mocks';
import { useToast } from '../App';

const formatContent = (content: string) => {
  if (!content) return '';
  let html = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  html = html.replace(/__(.*?)__/g, '<u style="text-decoration: underline;">$1</u>');
  html = html.replace(/\n/g, '<br/>');
  return html;
};

const PostCard: React.FC<{ post: any, currentUser: User }> = ({ post, currentUser }) => {
  const { addToast } = useToast();
  const [author, setAuthor] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [reactions, setReactions] = useState(post.reactions || { useful: 0, relevant: 0, inspiring: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!isRealSupabase || !supabase) {
        setAuthor({ name: "Citoyen", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: 'Membre' });
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', post.author_id).maybeSingle();
      setAuthor(data || { name: "Citoyen Anonyme", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: 'Membre' });
    };
    fetchAuthor();
    return () => { if (sourceRef.current) sourceRef.current.stop(); };
  }, [post.author_id]);

  const toggleAudio = async () => {
    if (isPlaying) {
      if (sourceRef.current) sourceRef.current.stop();
      setIsPlaying(false);
      return;
    }
    setIsLoadingAudio(true);
    try {
      const b64 = await getGriotReading(post.content);
      if (b64) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        const bytes = decode(b64);
        const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start(0);
        sourceRef.current = source;
        setIsPlaying(true);
      }
    } catch (e) { 
      console.error(e); 
      addToast("Le Griot est indisponible pour le moment.", "info");
    } finally { 
      setIsLoadingAudio(false); 
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/feed?post=${post.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      addToast("Lien de l'onde copié dans le presse-papier !", "success");
    }).catch(err => {
      console.error('Erreur lors du partage:', err);
      addToast("Échec de la copie du lien.", "error");
    });
  };

  const handleReaction = (type: string) => {
    setReactions((prev: any) => ({ ...prev, [type]: prev[type] + 1 }));
    addToast("Impact enregistré !", "success");
  };

  if (!author) return <div className="h-64 bg-gray-50 rounded-[3rem] animate-pulse mb-8"></div>;
  const isMajestic = post.is_majestic || author.role === Role.SUPER_ADMIN;

  return (
    <article id={`post-${post.id}`} className={`bg-white border rounded-[3rem] shadow-sm hover:shadow-xl transition-all mb-10 overflow-hidden flex flex-col ${isMajestic ? 'border-amber-200 ring-4 ring-amber-50 shadow-amber-50' : 'border-gray-100'}`}>
      
      {/* HEADER */}
      <div className="p-8 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src={author.avatar_url || author.avatar} className={`w-14 h-14 rounded-2xl object-cover shadow-sm ${isMajestic ? 'ring-2 ring-amber-200' : ''}`} alt="" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-lg">{author.name}</span>
              {(author.role === Role.SUPER_ADMIN || author.role === Role.ADMIN) && <ShieldCheck size={18} className="text-blue-600" />}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {new Date(post.created_at).toLocaleDateString()} • <span className="text-blue-600">{post.circle_type}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all" title="Partager">
            <Share2 size={20} />
          </button>
          <button onClick={toggleAudio} className={`p-4 rounded-2xl transition-all flex items-center gap-2 ${isPlaying ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`} title="Écouter le Griot">
            {isLoadingAudio ? <Loader2 className="animate-spin" size={20} /> : isPlaying ? <Pause size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className={`px-8 md:px-12 py-6 text-gray-800 leading-relaxed ${isMajestic ? 'text-2xl font-serif italic border-l-8 border-amber-200 pl-10 my-4' : 'text-lg font-medium'}`} dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />

      {/* TOOLBAR */}
      <div className="bg-gray-50/50 p-6 md:p-8 flex flex-wrap items-center justify-between gap-6 border-t border-gray-100">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => handleReaction('useful')} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm group">
            <ThumbsUp size={18} className="group-hover:scale-110 transition-transform" /> <span className="text-[11px] font-black">{reactions.useful}</span>
          </button>
          <button onClick={() => handleReaction('relevant')} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm group">
            <Lightbulb size={18} className="group-hover:scale-110 transition-transform" /> <span className="text-[11px] font-black">{reactions.relevant}</span>
          </button>
          <button onClick={() => handleReaction('inspiring')} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm group">
            <Sparkles size={18} className="group-hover:scale-110 transition-transform" /> <span className="text-[11px] font-black">{reactions.inspiring}</span>
          </button>
        </div>
        
        <button 
          onClick={() => setShowComments(!showComments)} 
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest ${showComments ? 'bg-gray-900 text-white' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'}`}
        >
          <MessageCircle size={18} /> <span>Palabres ({post.comments?.length || 0})</span>
        </button>
      </div>

      {showComments && (
        <div className="p-8 bg-white border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-6">
            {post.comments?.length > 0 ? post.comments.map((c: any, i: number) => (
              <div key={i} className="flex gap-4">
                <img src={c.avatar || `https://picsum.photos/seed/${i}/50/50`} className="w-10 h-10 rounded-xl object-cover" alt="" />
                <div className="bg-gray-50 p-5 rounded-2xl flex-1">
                   <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{c.author}</p>
                   <p className="text-sm text-gray-700 font-medium">{c.content}</p>
                </div>
              </div>
            )) : <p className="text-center py-8 text-gray-400 italic text-sm">Aucun palabre ici.</p>}
          </div>
        </div>
      )}
    </article>
  );
};

const FeedPage: React.FC<{ user: User }> = ({ user }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<CircleType>(CircleType.PEACE);
  const [sending, setSending] = useState(false);
  const { addToast } = useToast();

  const fetchPosts = async () => {
    setLoading(true);
    let allPosts: any[] = [...MOCK_POSTS];
    
    if (isRealSupabase && supabase) { 
      try {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (data) {
          allPosts = [...data, ...MOCK_POSTS];
        }
      } catch (e) {
        console.error("Fetch error:", e);
      }
    }
    
    // Tri chronologique strict : les plus récents en premier
    allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setPosts(allPosts);
    setLoading(false); 
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    setSending(true);
    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('posts').insert([{ 
          author_id: user.id, 
          content: newPostText, 
          circle_type: selectedCircle, 
          is_majestic: user.role === Role.SUPER_ADMIN,
          reactions: { useful: 0, relevant: 0, inspiring: 0 },
          comments: []
        }]);
        
        if (error) {
          throw new Error(error.message || "Erreur d'insertion.");
        }
        
        addToast("Votre onde a été diffusée !", "success");
        setNewPostText('');
        fetchPosts();
      } else {
        addToast("Mode démo : Publication simulée.", "info");
        setNewPostText('');
      }
    } catch (e: any) { 
      addToast(`Échec de la publication : ${e.message}`, "error"); 
    } finally { 
      setSending(false); 
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      <div className="mb-16 text-center md:text-left">
        <div className="inline-flex items-center gap-3 bg-blue-50 px-5 py-2 rounded-full mb-6 border border-blue-100 shadow-sm">
          <Sparkles className="text-blue-600 w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Flux Souverain</span>
        </div>
        <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Le Fil d'Éveil</h2>
        <p className="text-gray-500 font-medium italic text-lg leading-relaxed">Exprimez votre vision, bâtissez la cité avec vos concitoyens.</p>
      </div>

      {/* COMPOSER */}
      <div className="bg-white rounded-[4rem] border border-gray-100 p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] mb-20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-focus-within:opacity-10 transition-opacity">
           <Send size={120} />
        </div>
        <textarea 
          value={newPostText} 
          onChange={e => setNewPostText(e.target.value)} 
          placeholder="Quelle onde souhaitez-vous partager avec la cité ?" 
          className="w-full h-44 bg-gray-50/80 p-10 rounded-[3rem] outline-none mb-8 font-serif text-xl focus:bg-white focus:ring-8 focus:ring-blue-50/50 transition-all resize-none border-2 border-transparent focus:border-blue-100 shadow-inner leading-relaxed" 
        />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="w-full sm:w-auto relative">
            <select 
              value={selectedCircle} 
              onChange={e => setSelectedCircle(e.target.value as any)} 
              className="w-full bg-gray-50 px-8 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest outline-none border border-gray-100 hover:bg-gray-100 transition-all cursor-pointer appearance-none pr-14"
            >
              {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <MoreHorizontal size={16} />
            </div>
          </div>
          <button 
            onClick={handleCreatePost} 
            disabled={sending || !newPostText.trim()} 
            className="w-full sm:w-auto bg-gray-950 text-white px-14 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 shadow-2xl hover:bg-black hover:-translate-y-2 active:translate-y-0 transition-all disabled:opacity-30 disabled:translate-y-0"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} 
            {sending ? "Diffusion..." : "Publier l'Onde"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-12 px-6">
           <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300">Chronologie Citoyenne</h3>
           <button onClick={fetchPosts} className="p-4 bg-white border border-gray-100 rounded-2xl hover:text-blue-600 hover:border-blue-100 hover:shadow-lg transition-all"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-8 opacity-50">
             <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Consultation des archives...</p>
          </div>
        ) : posts.length > 0 ? (
          posts.map(p => <PostCard key={p.id} post={p} currentUser={user} />)
        ) : (
          <div className="bg-white border-4 border-dashed border-gray-50 rounded-[5rem] p-32 text-center text-gray-400 font-bold">
             <Info className="w-16 h-16 mx-auto mb-6 opacity-10" />
             <p className="italic text-lg">Aucune onde détectée.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
