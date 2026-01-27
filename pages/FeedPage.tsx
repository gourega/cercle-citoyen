
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { Link, useNavigate } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Send, Sparkles, 
  ShieldCheck, MessageCircle, RefreshCw, 
  Pencil, Crown, Share2, Volume2, Trash2, 
  Home, Camera, Handshake, Target, Landmark, 
  Menu, X, Plus, MoreVertical, Map as MapIcon, Rocket, 
  Video, User as UserIcon, LogOut, Gavel, Compass, Mic2, 
  Bold, Italic, List, Smile, Type, ChevronDown, ChevronUp, ArrowRight, Smartphone, Save,
  ImageIcon, Zap, BookText, Waves, Square, BarChart2, Users, Search as SearchIcon, 
  Filter, Bell, Heart, Flame, PenLine, Award, MessageSquare, Scale, Database
} from 'lucide-react';
import { User, CircleType, Role, Post, Comment, CitizenNotification } from '../types.ts';
import { supabase, isRealSupabase } from '../lib/supabase.ts';
import { MOCK_POSTS, ADMIN_ID } from '../lib/mocks.ts';
import { useToast } from '../ToastContext.tsx';
import { speakAsGriot } from '../lib/gemini.ts';
import Logo from '../Logo.tsx';
import Footer from '../components/Footer.tsx';
import NotificationDrawer from '../components/NotificationDrawer.tsx';

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return date.toLocaleDateString();
};

const formatContent = (text: string) => {
  if (!text) return text;
  return text.split('\n').map((line, i) => {
    let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-gray-900">$1</strong>');
    formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    return <span key={i} dangerouslySetInnerHTML={{ __html: formattedLine + '<br/>' }} />;
  });
};

const PostSkeleton = () => (
  <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm mb-6 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl"></div>
      <div className="space-y-2">
        <div className="w-24 h-2 bg-gray-100 rounded"></div>
        <div className="w-16 h-1.5 bg-gray-50 rounded"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="w-full h-2 bg-gray-50 rounded"></div>
      <div className="w-3/4 h-2 bg-gray-50 rounded"></div>
    </div>
  </div>
);

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active?: boolean; color?: string; onClick?: () => void }> = ({ to, icon, label, active, color = "text-blue-600", onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest ${active ? `bg-blue-50/50 ${color} shadow-sm ring-1 ring-blue-100/30` : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
  >
    <span className={active ? color : "text-gray-400"}>{icon}</span> {label}
  </Link>
);

const VisionStory: React.FC<{ user: any }> = ({ user }) => (
  <Link to={`/profile/${user.id}`} className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer">
    <div className="relative p-1 rounded-[1.8rem] bg-gradient-to-tr from-amber-400 via-rose-500 to-blue-500 group-hover:scale-105 transition-transform">
      <div className="p-0.5 bg-white rounded-[1.6rem]">
        <img src={user.avatar_url || user.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover" alt="" />
      </div>
      {user.role === Role.SUPER_ADMIN && (
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-lg border-2 border-white">
          <Crown size={10} />
        </div>
      )}
    </div>
    <span className="text-[9px] font-black uppercase text-gray-500 truncate w-16 text-center">{user.pseudonym}</span>
  </Link>
);

const PublishModal: React.FC<{ user: User, onClose: () => void, onSuccess: () => void }> = ({ user, onClose, onSuccess }) => {
  const [content, setContent] = useState('');
  const [circle, setCircle] = useState<CircleType>(CircleType.URBAN);
  const [loading, setLoading] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const { addToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const emojis = ["🇨🇮", "🤝", "✊🏾", "✨", "🛡️", "🔥", "🌍", "🏗️", "🌱", "💡", "📢", "🗳️"];

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('posts').insert([{
          author_id: user.id,
          circle_type: circle,
          content: content,
          reactions: { useful: 0, relevant: 0, inspiring: 0 }
        }]);
        if (error) throw error;
        addToast("Onde diffusée avec succès !", "success");
        onSuccess();
        onClose();
      }
    } catch (e) {
      addToast("Erreur lors de la diffusion.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-3xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <PenLine size={20} />
             </div>
             <div>
                <h3 className="font-serif font-bold text-gray-900">Émettre une Onde</h3>
                <p className="text-[8px] font-black uppercase tracking-widest text-blue-500">Dialogue & Action</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-gray-300 hover:text-gray-900 hover:bg-white rounded-2xl transition-all"><X size={24}/></button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
          <div className="flex items-center gap-4 mb-4">
             <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt=""/>
             <div>
                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                <div className="flex items-center gap-2 mt-1">
                   <select 
                     value={circle} 
                     onChange={e => setCircle(e.target.value as CircleType)}
                     className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                   >
                     {Object.values(CircleType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
             </div>
          </div>

          <div className="relative group">
            <textarea 
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Exprimez votre vision pour la Nation..."
              className="w-full h-48 bg-[#fdfdfd] p-6 rounded-[2rem] text-lg text-gray-800 outline-none border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all resize-none shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <button onClick={() => insertText('**', '**')} className="p-3 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all" title="Gras"><Bold size={20}/></button>
              <button onClick={() => insertText('*', '*')} className="p-3 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all" title="Italique"><Italic size={20}/></button>
              <button onClick={() => insertText('\n- ')} className="p-3 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all" title="Liste"><List size={20}/></button>
              <div className="relative">
                <button 
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`p-3 rounded-xl transition-all ${showEmojis ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                >
                  <Smile size={20}/>
                </button>
                {showEmojis && (
                  <div className="absolute bottom-full left-0 mb-4 bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 grid grid-cols-4 gap-2 animate-in slide-in-from-bottom-2 duration-200">
                    {emojis.map(e => (
                      <button key={e} onClick={() => { insertText(e); setShowEmojis(false); }} className="text-xl p-2 hover:bg-gray-50 rounded-xl transition-all">{e}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handlePublish}
              disabled={loading || !content.trim()}
              className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
              Sceller l'Onde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: Post, currentUser: User, onUpdate: () => void }> = ({ post, currentUser, onUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [author, setAuthor] = useState<any>({ name: 'Citoyen', avatar: 'https://picsum.photos/seed/default/100/100', pseudonym: 'citoyen' });
  const { addToast } = useToast();

  useEffect(() => {
    const fetchAuthor = async () => {
      if (isRealSupabase && supabase) {
        const { data } = await supabase.from('profiles').select('*').eq('id', post.author_id).single();
        if (data) setAuthor({ ...data, avatar: data.avatar_url });
      }
    };
    fetchAuthor();
  }, [post.author_id]);

  const handleReaction = async (type: keyof Post['reactions']) => {
    if (!isRealSupabase || !supabase) {
      addToast("Mode démo : Réaction enregistrée.", "info");
      return;
    }
    
    try {
      const newReactions = { 
        ...post.reactions, 
        [type]: (post.reactions[type] || 0) + 1 
      };
      const { error } = await supabase
        .from('posts')
        .update({ reactions: newReactions })
        .eq('id', post.id);
        
      if (error) throw error;
      onUpdate();
    } catch (e) {
      addToast("Erreur de vote.", "error");
    }
  };

  const handlePlayAudio = () => {
    setIsPlaying(true);
    speakAsGriot(post.content);
    // On simule la fin de l'audio pour réinitialiser l'état du bouton (ou on utilise onend si dispo)
    setTimeout(() => setIsPlaying(false), post.content.length * 80); 
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm mb-6 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <Link to={`/profile/${post.author_id}`} className="flex items-center gap-3 group/author">
          <img src={author.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover/author:ring-2 ring-blue-100 transition-all" alt="" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 text-sm group-hover/author:text-blue-600 transition-colors">{author.name}</h4>
              {post.is_majestic && <Crown className="w-3 h-3 text-amber-500" />}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getRelativeTime(post.created_at)} • {post.circle_type}</p>
          </div>
        </Link>
        <button className="p-2 text-gray-300 hover:text-gray-900 transition-colors"><MoreVertical size={16} /></button>
      </div>
      <div className="mb-4 text-[15px] leading-relaxed text-gray-700">{formatContent(post.content)}</div>
      {post.image_url && <div className="mb-4 rounded-2xl overflow-hidden border border-gray-50"><img src={post.image_url} className="w-full object-cover max-h-96" alt="" /></div>}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center gap-6">
          <button onClick={() => handleReaction('useful')} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase"><ThumbsUp size={16} /> {post.reactions.useful}</button>
          <button onClick={() => handleReaction('relevant')} className="flex items-center gap-2 text-gray-400 hover:text-amber-600 transition-colors text-[10px] font-black uppercase"><Lightbulb size={16} /> {post.reactions.relevant}</button>
          <button onClick={() => handleReaction('inspiring')} className="flex items-center gap-2 text-gray-400 hover:text-rose-600 transition-colors text-[10px] font-black uppercase"><Heart size={16} /> {post.reactions.inspiring}</button>
          <button onClick={handlePlayAudio} className={`flex items-center gap-2 transition-colors text-[10px] font-black uppercase ${isPlaying ? 'text-blue-600 animate-pulse' : 'text-gray-400 hover:text-gray-900'}`}><Volume2 size={16} /> {isPlaying ? 'Lecture...' : 'Écouter'}</button>
        </div>
        <button className="text-gray-400 hover:text-gray-900 transition-colors"><Share2 size={16} /></button>
      </div>
    </div>
  );
};

const FeedPage: React.FC<{ user: User, onLogout: () => Promise<void> }> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [realCitizens, setRealCitizens] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [activeCircle, setActiveCircle] = useState<CircleType | 'all'>('all');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<CitizenNotification[]>([
    { id: '1', type: 'drum_call', title: 'Nouvel Édit', message: 'Un RIC sur la santé vient d\'être lancé.', timestamp: 'Il y a 5m', isRead: false },
    { id: '2', type: 'award', title: 'Impact atteint !', message: 'Vous avez gagné 50 XP pour votre action.', timestamp: 'Il y a 1h', isRead: false }
  ]);

  const isGuardian = user.role === Role.SUPER_ADMIN;

  const fetchData = async () => {
    try {
      if (isRealSupabase && supabase) {
        const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (postsData) setPosts(postsData);
        
        const { data: citizensData } = await supabase.from('profiles').select('*').limit(5);
        if (citizensData) setRealCitizens(citizensData);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = posts;
    if (activeCircle !== 'all') result = result.filter(p => p.circle_type === activeCircle);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.content.toLowerCase().includes(q) || p.circle_type.toLowerCase().includes(q));
    }
    setFilteredPosts(result);
  }, [posts, searchQuery, activeCircle]);

  const markNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-3xl border-b border-gray-100 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Link to="/feed"><Logo size={28} showText variant="blue" /></Link>
            <div className="hidden md:flex relative group w-80">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Chercher dans l'Agora..." 
                className="w-full bg-gray-50 border-none py-3 pl-12 pr-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setIsNotifOpen(true)} className="relative p-3 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-2xl transition-all">
                <Bell size={20} />
                {notifications.some(n => !n.isRead) && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>}
             </button>
             <div className="flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-3 p-1.5 bg-gray-50 pr-4 rounded-2xl hover:bg-gray-100 transition-all">
                   <img src={user.avatar} className="w-8 h-8 rounded-xl object-cover shadow-sm" alt="" />
                   <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest text-gray-500">{user.pseudonym}</span>
                </Link>
                <button 
                  onClick={onLogout}
                  className="p-3 bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                  title="Déconnexion"
                >
                  <LogOut size={20} />
                </button>
             </div>
          </div>
        </div>
      </header>

      {isNotifOpen && <NotificationDrawer notifications={notifications} onClose={() => setIsNotifOpen(false)} onMarkRead={markNotifRead} />}
      
      {isPublishModalOpen && <PublishModal user={user} onClose={() => setIsPublishModalOpen(false)} onSuccess={fetchData} />}

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block lg:w-64 space-y-6 sticky top-28 self-start">
          <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="space-y-1">
              <NavLink to="/feed" active icon={<Home size={18} />} label="Agora" />
              <NavLink to="/messages" icon={<MessageCircle size={18} />} label="Messages" />
              <NavLink to="/sentinel" icon={<Camera size={18} />} label="Sentinelle" color="text-emerald-600" />
              <NavLink to="/governance" icon={<Gavel size={18} />} label="Référendum" color="text-orange-600" />
              <NavLink to="/map" icon={<MapIcon size={18} />} label="Empreinte" />
              <NavLink to="/quests" icon={<Target size={18} />} label="Missions" color="text-rose-600" />
              <NavLink to="/ideas" icon={<Lightbulb size={18} />} label="Idées" color="text-amber-600" />
              
              {isGuardian && (
                <div className="pt-4 mt-4 border-t border-gray-50">
                   <NavLink to="/admin" icon={<Database size={18} />} label="CONSEIL" color="text-amber-500" />
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-950 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Target size={80} /></div>
             <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-3 relative z-10">INDICE D'IMPACT</p>
             <p className="text-4xl font-serif font-bold mb-6 relative z-10">{user.impactScore || 0}</p>
             <Link to="/studio" className="w-full block py-4 bg-white/10 rounded-2xl text-center text-[9px] font-black uppercase tracking-widest border border-white/5 relative z-10 hover:bg-white/20 transition-all">Studio Impact</Link>
          </div>
        </aside>

        <main className="flex-1 max-w-2xl">
          <div className="mb-8 flex gap-5 overflow-x-auto no-scrollbar pb-2">
            <div className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer" onClick={() => navigate('/studio')}>
              <div className="w-[72px] h-[72px] rounded-[1.8rem] bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-500 transition-all">
                <Plus size={24} />
              </div>
              <span className="text-[9px] font-black uppercase text-gray-400">Ma Vision</span>
            </div>
            {realCitizens.map(u => <VisionStory key={u.id} user={u} />)}
          </div>

          <div className="mb-10 flex gap-2 overflow-x-auto no-scrollbar pb-2">
             <button onClick={() => setActiveCircle('all')} className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeCircle === 'all' ? 'bg-gray-950 text-white border-gray-950 shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>Tous les Cercles</button>
             {Object.values(CircleType).slice(0, 8).map(type => (
               <button key={type} onClick={() => setActiveCircle(type)} className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeCircle === type ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>{type}</button>
             ))}
          </div>

          <div className="w-full bg-white border border-gray-100 p-8 rounded-[3rem] shadow-sm mb-10 flex items-center gap-6 group hover:shadow-xl hover:border-blue-50 transition-all">
            <div className="relative">
              <img src={user.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <button onClick={() => setIsPublishModalOpen(true)} className="flex-1 text-left text-gray-400 font-medium text-lg italic">Qu'avez-vous à dire à la Nation aujourd'hui ?</button>
            <button onClick={() => setIsPublishModalOpen(true)} className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"><PenLine size={24} /></button>
          </div>

          <div className="space-y-6">
            {loading ? <PostSkeleton /> : filteredPosts.length > 0 ? filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUser={user} onUpdate={fetchData} />
            )) : (
              <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-50">
                 <Waves className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Le calme règne sur l'Agora.</p>
              </div>
            )}
          </div>
        </main>

        <aside className="hidden xl:block w-80 sticky top-28 self-start space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:rotate-12 transition-transform"><Gavel size={100} /></div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 px-2 flex items-center gap-2">
                <Landmark size={14} className="text-orange-600" /> Référendums Actifs
              </h3>
              <div className="space-y-6">
                 <Link to="/governance" className="text-[9px] font-black uppercase text-gray-400 hover:text-orange-600 flex items-center justify-center gap-2">Consulter les édits <ArrowRight size={12} /></Link>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:rotate-12 transition-transform"><Award size={100} /></div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 px-2 flex items-center gap-2">
                <Users size={14} className="text-blue-600" /> Citoyens de Référence
              </h3>
              <div className="space-y-6">
                 {realCitizens.map(u => (
                   <Link key={u.id} to={`/profile/${u.id}`} className="flex items-center gap-4 group/item">
                      <div className="relative">
                        <img src={u.avatar_url} className="w-12 h-12 rounded-2xl object-cover group-hover/item:ring-4 ring-blue-50 transition-all"/>
                        {u.role === Role.SUPER_ADMIN && <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-lg border-2 border-white"><Crown size={10} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-bold text-gray-900 truncate">{u.name}</p>
                         <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{u.impact_score || 0} XP</p>
                      </div>
                      <ArrowRight size={14} className="text-gray-200 group-hover/item:text-blue-500 group-hover/item:translate-x-1 transition-all"/>
                   </Link>
                 ))}
              </div>
           </div>
           
           <div className="bg-blue-600 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
              <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-4">ASSEMBLÉE DIRECTE</h3>
              <p className="text-lg font-serif font-bold text-white mb-6 leading-tight">Invoquez la Sagesse du Cercle de vive voix.</p>
              <button onClick={() => navigate('/assembly')} className="w-full py-5 bg-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-200 shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                 <Mic2 size={16} /> Entrer en Séance
              </button>
           </div>
        </aside>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-3xl border-t border-gray-100 px-8 py-5 flex justify-between items-center z-[110] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <Link to="/feed" className="text-blue-600 flex flex-col items-center gap-1"><Home size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Agora</span></Link>
        <Link to="/sentinel" className="text-gray-400 flex flex-col items-center gap-1"><Camera size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Scanner</span></Link>
        <button onClick={() => setIsPublishModalOpen(true)} className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center -translate-y-8 shadow-2xl shadow-blue-200 active:scale-90 transition-all border-4 border-white"><Plus size={32} /></button>
        <Link to="/governance" className="text-gray-400 flex flex-col items-center gap-1"><Gavel size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Édits</span></Link>
        <Link to="/profile" className="text-gray-400 flex flex-col items-center gap-1"><UserIcon size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Cité</span></Link>
      </nav>
    </div>
  );
};

export default FeedPage;
