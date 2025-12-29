
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
  let html = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  html = html.replace(/__(.*?)__/g, '<u style="text-decoration: underline;">$1</u>');
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
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
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
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-5">
          <img src={author.avatar_url} className={`w-14 h-14 rounded-2xl object-cover shadow-md ${isMajestic ? 'ring-4 ring-amber-100' : ''}`} alt="" />
          <div>
            <div className="flex items-center gap-2">
               <h4 className="font-bold text-gray-900 text-lg">{author.name}</h4>
               {author.role === 'Gardien' && <ShieldCheck size={16} className="text-blue-600" />}
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
              {new Date(post.created_at).toLocaleDateString()} • <span className="text-blue-600">{post.circle_type}</span>
            </div>
          </div>
        </div>
        <button onClick={toggleAudio} className={`p-4 rounded-2xl transition-all ${isPlaying ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
          {isLoadingAudio ? <Loader2 className="animate-spin" /> : <Volume2 size={20} />}
        </button>
      </div>
      <div className={`text-gray-800 leading-relaxed mb-10 ${isMajestic ? 'text-2xl font-serif italic border-l-4 border-amber-200 pl-8' : 'text-[17px]'}`} dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
    </div>
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
    if (!supabase) { setPosts(MOCK_POSTS); setLoading(false); return; }
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts([...MOCK_POSTS, ...(data || [])]);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    setSending(true);
    try {
      if (supabase) {
        await supabase.from('posts').insert([{ author_id: user.id, content: newPostText, circle_type: selectedCircle, is_majestic: user.role === Role.SUPER_ADMIN }]);
        addToast("Onde publiée !", "success");
        setNewPostText('');
        fetchPosts();
      }
    } catch (e) { addToast("Erreur lors de la publication", "error"); } finally { setSending(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h2 className="text-4xl font-serif font-bold text-gray-900 mb-2">L'Éveil de la Cité</h2>
        <p className="text-gray-500 font-medium italic">Le fil d'actualité souverain.</p>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm mb-16">
        <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="Partagez une réflexion..." className="w-full h-32 bg-gray-50 p-6 rounded-2xl outline-none mb-6 font-medium" />
        <div className="flex justify-between items-center">
          <select value={selectedCircle} onChange={e => setSelectedCircle(e.target.value as any)} className="bg-gray-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
            {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
          </select>
          <button onClick={handleCreatePost} disabled={sending} className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase flex items-center gap-2">
            {sending ? <Loader2 className="animate-spin" /> : <Send size={16} />} Publier
          </button>
        </div>
      </div>

      {loading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" /></div> : posts.map(p => <PostCard key={p.id} post={p} />)}
    </div>
  );
};

export default FeedPage;
