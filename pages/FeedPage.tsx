
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Volume2, Send, Tag, Sparkles, Bell, RefreshCw,
  Crown, Share2, MessageSquare, ShieldCheck, Bold, Italic, Underline as UnderlineIcon
} from 'lucide-react';
import { User, CircleType, Role } from '../types';
import { getGriotReading, decodeBase64Audio, decodeAudioBuffer } from '../lib/gemini';
import { supabase, isRealSupabase } from '../lib/supabase';
import { CIRCLES_CONFIG } from '../constants';
import { MOCK_POSTS } from '../lib/mocks';
import { useToast } from '../App';

// Parseur de texte pour les styles simples
const formatContent = (content: string) => {
  if (!content) return '';
  
  // Remplacement sécurisé pour éviter l'injection XSS tout en permettant le gras/italique/souligné
  let html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Appliquer le Markdown-lite
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Gras
  html = html.replace(/_(.*?)_/g, '<em>$1</em>'); // Italique
  html = html.replace(/__(.*?)__/g, '<u style="text-decoration: underline;">$1</u>'); // Souligné
  
  return html;
};

const PostCard: React.FC<{ post: any }> = ({ post }) => {
  const [author, setAuthor] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!supabase) {
        setAuthor({ name: "Citoyen", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: 'Membre' });
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', post.author_id).maybeSingle();
      setAuthor(data || { name: "Citoyen Anonyme", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: 'Membre' });
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

  const isMajestic = post.is_majestic || author.role === 'Gardien';

  return (
    <div className={`bg-white border rounded-[2.5rem] p-8 md:p-10 shadow-sm hover:shadow-xl transition-all mb-8 animate-in fade-in slide-in-from-bottom-4 group relative overflow-hidden ${isMajestic ? 'border-amber-200 ring-2 ring-amber-50 shadow-amber-50' : 'border-gray-100'}`}>
      
      {isMajestic && (
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
          <Crown size={120} />
        </div>
      )}

      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-5">
          <div className="relative">
            <img src={author.avatar_url || `https://picsum.photos/seed/${post.author_id}/150/150`} className={`w-14 h-14 rounded-2xl object-cover shadow-md ${isMajestic ? 'ring-4 ring-amber-100' : ''}`} alt="" />
            {isMajestic && <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-lg shadow-lg"><Crown size={12} /></div>}
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h4 className="font-bold text-gray-900 text-lg">{author.name}</h4>
               {author.role === 'Gardien' && <ShieldCheck size={16} className="text-blue-600" />}
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
              {new Date(post.created_at).toLocaleDateString()} • <span className={`${isMajestic ? 'text-amber-600' : 'text-blue-600'}`}>{post.circle_type}</span>
            </div>
          </div>
        </div>
        <button onClick={toggleAudio} className={`p-4 rounded-2xl transition-all shadow-sm ${isPlaying ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
          {isLoadingAudio ? <Loader2 className="animate-spin w-5 h-5" /> : <Volume2 size={20} />}
        </button>
      </div>

      {post.image_url && (
        <div className="mb-8 rounded-[2.5rem] overflow-hidden bg-gray-50 flex items-center justify-center p-8 border border-gray-100 shadow-inner">
          <img src={post.image_url} className="max-h-80 object-contain" alt="Image de la publication" />
        </div>
      )}

      <div 
        className={`text-gray-800 leading-relaxed mb-10 whitespace-pre-wrap ${isMajestic ? 'text-2xl font-serif font-medium italic text-gray-900 border-l-4 border-amber-200 pl-8' : 'text-[17px]'}`}
        dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
      />
      
      <div className="flex items-center justify-between pt-8 border-t border-gray-50">
        <div className="flex gap-8">
            <button className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-blue-600 transition-colors">
            <ThumbsUp size={16} /> Utile ({post.reactions?.useful || 0})
            </button>
            <button className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-amber-500 transition-colors">
            <Lightbulb size={16} /> Inspirant ({post.reactions?.inspiring || 0})
            </button>
        </div>
        <button className="p-3 text-gray-300 hover:text-blue-600 transition-colors"><Share2 size={18} /></button>
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addToast } = useToast();

  const fetchPosts = async () => {
    setLoading(true);
    if (!supabase) {
      const local = JSON.parse(localStorage.getItem('cercle_db_posts') || '[]');
      setPosts([...MOCK_POSTS, ...local]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts([...MOCK_POSTS, ...data]);
    setLoading(false);
    setNewIncomingCount(0);
  };

  useEffect(() => {
    fetchPosts();

    if (supabase) {
      const channel = supabase
        .channel('public:posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
          if (payload.new.author_id !== user.id) {
            setNewIncomingCount(prev => prev + 1);
          } else {
            // Uniquement si on n'a pas déjà ajouté localement pour éviter les doublons
            setPosts(prev => {
                if (prev.some(p => p.id === payload.new.id)) return prev;
                return [payload.new, ...prev];
            });
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user.id]);

  const applyFormatting = (prefix: string, suffix: string) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = newPostText.substring(start, end);
    
    const formattedText = `${prefix}${selectedText}${suffix}`;
    const newFullText = 
      newPostText.substring(0, start) + 
      formattedText + 
      newPostText.substring(end);
    
    setNewPostText(newFullText);
    
    // Repositionner le curseur après l'insertion
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + prefix.length + selectedText.length + suffix.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    setSending(true);
    
    const isGuardian = user.role === Role.SUPER_ADMIN;

    try {
        if (supabase) {
            const { error } = await supabase.from('posts').insert([{
                author_id: user.id,
                content: newPostText,
                circle_type: selectedCircle,
                is_majestic: isGuardian 
            }]);
            
            if (error) throw error;
            
            addToast("Onde publiée sur le Cloud !", "success");
            setNewPostText('');
        } else {
            const localPosts = JSON.parse(localStorage.getItem('cercle_db_posts') || '[]');
            const newPost = { 
                id: crypto.randomUUID(), 
                author_id: user.id, 
                content: newPostText, 
                circle_type: selectedCircle, 
                created_at: new Date().toISOString(),
                is_majestic: isGuardian,
                reactions: { useful: 0, relevant: 0, inspiring: 0 }
            };
            
            const updatedLocal = [newPost, ...localPosts];
            localStorage.setItem('cercle_db_posts', JSON.stringify(updatedLocal));
            setPosts(prev => [newPost, ...prev]);
            setNewPostText('');
            addToast("Onde enregistrée localement.", "info");
        }
    } catch (err: any) {
        console.error("Erreur de publication:", err);
        addToast(`Échec de publication: ${err.message}`, "error");
    } finally {
        setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-gray-900 mb-2 tracking-tight">L'Éveil de la Cité</h2>
          <p className="text-gray-500 font-medium">La mémoire vive et souveraine de notre nation.</p>
        </div>
        <div className="flex gap-4">
           <button onClick={fetchPosts} className="p-4 bg-white border border-gray-100 text-gray-400 rounded-2xl hover:text-blue-600 shadow-sm transition-all active:scale-95">
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
           {newIncomingCount > 0 && (
            <button 
              onClick={fetchPosts}
              className="flex items-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] animate-bounce shadow-xl shadow-blue-100"
            >
              <Bell size={16} /> {newIncomingCount} Nouvelles Ondes
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm mb-16 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-20"></div>
        
        {/* Toolbar de mise en forme */}
        <div className="px-8 pt-8 flex items-center gap-2 border-b border-gray-50 pb-4">
          <button 
            onClick={() => applyFormatting('**', '**')}
            title="Gras"
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            <Bold size={18} />
          </button>
          <button 
            onClick={() => applyFormatting('_', '_')}
            title="Italique"
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            <Italic size={18} />
          </button>
          <button 
            onClick={() => applyFormatting('__', '__')}
            title="Souligné"
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            <UnderlineIcon size={18} />
          </button>
          <div className="h-6 w-px bg-gray-100 mx-2"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">Style Citoyen</span>
        </div>

        <textarea 
          ref={textareaRef}
          value={newPostText}
          onChange={e => setNewPostText(e.target.value)}
          placeholder="Partagez une réflexion pour le bien commun, Citoyen..."
          className="w-full h-40 bg-gray-50/50 p-8 text-gray-800 outline-none border-none focus:bg-white mb-6 text-lg font-medium transition-all resize-none"
        />
        
        <div className="px-8 pb-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 w-full sm:w-auto">
            <Tag size={16} className="text-blue-600" />
            <select 
              value={selectedCircle}
              onChange={e => setSelectedCircle(e.target.value as CircleType)}
              className="bg-transparent text-[11px] font-black uppercase tracking-widest text-gray-500 outline-none cursor-pointer flex-1"
            >
              {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
            </select>
          </div>
          <button 
            onClick={handleCreatePost}
            disabled={sending || !newPostText.trim()}
            className="w-full sm:w-auto px-12 py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
          >
            {sending ? <Loader2 className="animate-spin w-5 h-5" /> : <Send size={18} className="text-blue-400" />} Publier l'Onde
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-6 text-gray-300">
          <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Récupération de la sagesse...</p>
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
            {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      ) : (
        <div className="text-center py-32 bg-gray-50 rounded-[4rem] border-4 border-dashed border-gray-100">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm text-gray-200">
                <Sparkles size={40} />
           </div>
           <p className="text-sm font-black text-gray-300 uppercase tracking-[0.3em]">Le silence est d'or, mais l'éveil est d'action.</p>
        </div>
      )}
    </div>
  );
};

export default FeedPage;
