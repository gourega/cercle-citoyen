
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Send, Sparkles, 
  ShieldCheck, MessageCircle, RefreshCw, 
  Info, Pencil, Save, Trash2, Crown,
  TrendingUp, Users, Heart, ChevronRight,
  Flame, Award, Clock, Share2, ChevronDown, ChevronUp,
  Facebook, Linkedin, Copy, Check, Bold, Italic, Smile
} from 'lucide-react';
import { User, CircleType, Role, Post, Comment } from '../types';
import { supabase, isRealSupabase, db } from '../lib/supabase';
import { CIRCLES_CONFIG } from '../constants';
import { MOCK_POSTS } from '../lib/mocks';
import { useToast } from '../App';

/**
 * Calcule le temps relatif de façon lisible
 */
const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  return date.toLocaleDateString();
};

/**
 * Formate le contenu avec support Markdown basique (Gras, Italique)
 */
const formatContent = (content: string) => {
  if (!content) return '';
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
};

const PostCard: React.FC<{ 
  post: Post, 
  currentUser: User | null, 
  isHighlighted?: boolean,
  onUpdate: () => void 
}> = ({ post, currentUser, isHighlighted, onUpdate }) => {
  const { addToast } = useToast();
  const [author, setAuthor] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const [reactions, setReactions] = useState(post.reactions || { useful: 0, relevant: 0, inspiring: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [commentInput, setCommentInput] = useState('');
  const [isReacting, setIsReacting] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const TEXT_LIMIT = 280;
  const isLongText = post.content.length > TEXT_LIMIT;
  const displayedContent = (isLongText && !isExpanded) 
    ? post.content.slice(0, TEXT_LIMIT) 
    : post.content;

  const postUrl = `${window.location.origin}${window.location.pathname}#/feed?post=${post.id}`;
  const shareText = `Découvrez cette onde sur le Cercle Citoyen : "${post.content.slice(0, 50)}..."`;

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!isRealSupabase || !supabase) {
        setAuthor({ name: "Citoyen", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', post.author_id).maybeSingle();
      setAuthor(data || { name: "Citoyen Anonyme", avatar_url: `https://picsum.photos/seed/${post.author_id}/150/150`, role: Role.MEMBER });
    };
    fetchAuthor();
  }, [post.author_id]);

  const handleReaction = async (type: 'useful' | 'relevant' | 'inspiring') => {
    if (!currentUser || isReacting) return;
    setIsReacting(type);
    
    const newReactions = { ...reactions, [type]: (reactions[type] || 0) + 1 };
    setReactions(newReactions);

    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('posts').update({ reactions: newReactions }).eq('id', post.id);
        if (error) throw error;
      }
    } catch (e) {
      setReactions(reactions); 
      addToast("Erreur lors de la réaction.", "error");
    } finally {
      setIsReacting(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    addToast("Lien copié !", "success");
    setTimeout(() => setCopied(false), 2000);
    setShowShareMenu(false);
  };

  const shareSocial = (platform: 'wa' | 'fb' | 'in') => {
    let url = '';
    switch(platform) {
      case 'wa': url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + postUrl)}`; break;
      case 'fb': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`; break;
      case 'in': url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`; break;
    }
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim()) return;
    try {
      if (isRealSupabase && supabase) await supabase.from('posts').update({ content: editContent }).eq('id', post.id);
      setIsEditing(false);
      onUpdate();
      addToast("Onde mise à jour.", "success");
    } catch (e) { addToast("Erreur mise à jour.", "error"); }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Voulez-vous vraiment retirer cette onde de la cité ?")) return;
    try {
      if (isRealSupabase && supabase) await supabase.from('posts').delete().eq('id', post.id);
      addToast(currentUser?.role === Role.SUPER_ADMIN ? "Modération souveraine effectuée." : "Onde retirée.", "success");
      onUpdate();
    } catch (e) { addToast("Échec suppression.", "error"); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: currentUser.name,
      avatar: currentUser.avatar,
      content: commentInput,
      created_at: new Date().toISOString()
    };
    try {
      const updatedComments = [...(post.comments || []), newComment];
      if (isRealSupabase && supabase) {
        await supabase.from('posts').update({ comments: updatedComments }).eq('id', post.id);
      } else {
        post.comments = updatedComments; // Fallback pour démo
      }
      setCommentInput('');
      onUpdate();
      addToast("Palabre ajoutée.", "success");
    } catch (e) { addToast("Erreur sauvegarde commentaire.", "error"); }
  };

  if (!author) return <div className="h-64 bg-gray-50 rounded-[3rem] animate-pulse mb-8"></div>;
  
  const isMajestic = post.is_majestic || author.role === Role.SUPER_ADMIN;
  const isOwner = currentUser?.id === post.author_id;
  const isGuardian = currentUser?.role === Role.SUPER_ADMIN;
  const canDelete = isOwner || isGuardian;

  return (
    <article 
      id={`post-${post.id}`}
      className={`bg-white border rounded-[3rem] shadow-sm hover:shadow-xl transition-all mb-10 overflow-hidden flex flex-col group/card
        ${isHighlighted ? 'ring-8 ring-blue-500/10 border-blue-200 bg-blue-50/5' : 'border-gray-100'} 
        ${isMajestic ? 'border-amber-200 ring-4 ring-amber-50 bg-amber-50/5' : ''}`}
    >
      {/* Header */}
      <div className="p-8 pb-4 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link to={`/profile/${post.author_id}`} className="relative group">
            <img src={author.avatar_url || author.avatar} className={`w-14 h-14 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-105 ${isMajestic ? 'ring-2 ring-amber-300' : ''}`} alt="" />
            {isMajestic && <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-lg shadow-lg border-2 border-white"><Crown size={10} /></div>}
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.author_id}`} className="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors">{author.name}</Link>
              {author.role === Role.SUPER_ADMIN && <span title="Gardien Certifié"><ShieldCheck size={18} className="text-amber-600" /></span>}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Clock size={10} /> {getRelativeTime(post.created_at)} • <Link to={`/circle/${encodeURIComponent(post.circle_type)}`} className="text-blue-600 hover:underline">{post.circle_type}</Link>
            </p>
          </div>
        </div>
        <div className="flex gap-2 relative">
          <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            {isOwner && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all" title="Modifier"><Pencil size={16} /></button>
            )}
            {canDelete && (
              <button onClick={handleDeletePost} className={`p-3 rounded-xl transition-all ${isGuardian && !isOwner ? 'bg-rose-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600'}`} title="Supprimer"><Trash2 size={16} /></button>
            )}
          </div>
          <button 
            onClick={() => setShowShareMenu(!showShareMenu)} 
            className={`p-3 rounded-xl transition-all ${showShareMenu ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 opacity-0 group-hover/card:opacity-100'}`} 
            title="Partager"
          >
            <Share2 size={16} />
          </button>
          
          {showShareMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <button onClick={() => shareSocial('wa')} className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><Send size={14} /></div> WhatsApp
              </button>
              <button onClick={() => shareSocial('fb')} className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Facebook size={14} /></div> Facebook
              </button>
              <button onClick={() => shareSocial('in')} className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><Linkedin size={14} /></div> LinkedIn
              </button>
              <div className="h-px bg-gray-50 my-1"></div>
              <button onClick={copyToClipboard} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-gray-700 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">{copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}</div> 
                {copied ? 'Copié !' : 'Copier le lien'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 md:px-12 py-4">
        {isEditing ? (
          <div className="space-y-4">
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full h-40 bg-gray-50 p-6 rounded-2xl outline-none border-2 border-amber-100 font-medium text-lg focus:bg-white" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest">Annuler</button>
              <button onClick={handleUpdatePost} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2"><Save size={14} /> Sauvegarder</button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className={`text-gray-800 leading-relaxed transition-all duration-500 overflow-hidden relative ${isMajestic ? 'text-2xl font-serif italic border-l-8 border-amber-200 pl-10 my-6' : 'text-lg font-medium'}`}>
              <div dangerouslySetInnerHTML={{ __html: formatContent(displayedContent) }} />
              {isLongText && !isExpanded && (
                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              )}
            </div>
            {isLongText && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:text-blue-800 transition-colors py-2"
              >
                {isExpanded ? <><ChevronUp size={14} /> Lire moins</> : <><ChevronDown size={14} /> Lire la suite...</>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toolbar / Actions */}
      <div className="bg-gray-50/50 p-6 flex items-center justify-between border-t border-gray-100 mt-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleReaction('useful')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all hover:scale-105 active:scale-95 ${isReacting === 'useful' ? 'animate-bounce' : ''} bg-white border-gray-100 text-blue-600 hover:bg-blue-50`}
            title="Utile"
          >
            <ThumbsUp size={16} /> <span className="text-xs font-black">{reactions.useful}</span>
          </button>
          <button 
            onClick={() => handleReaction('relevant')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all hover:scale-105 active:scale-95 ${isReacting === 'relevant' ? 'animate-bounce' : ''} bg-white border-gray-100 text-emerald-600 hover:bg-emerald-50`}
            title="Pertinent"
          >
            <Lightbulb size={16} /> <span className="text-xs font-black">{reactions.relevant}</span>
          </button>
          <button 
            onClick={() => handleReaction('inspiring')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all hover:scale-105 active:scale-95 ${isReacting === 'inspiring' ? 'animate-bounce' : ''} bg-white border-gray-100 text-amber-600 hover:bg-amber-50`}
            title="Inspirant"
          >
            <Sparkles size={16} /> <span className="text-xs font-black">{reactions.inspiring}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${showComments ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-300'}`}>Palabres ({post.comments?.length || 0})</button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="p-8 bg-white border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-4 mb-8">
            {post.comments && post.comments.length > 0 ? post.comments.map((c, i) => (
              <div key={i} className="flex gap-4">
                <img src={c.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                <div className="bg-gray-50 p-4 rounded-2xl flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black uppercase text-gray-400">{c.author}</p>
                    <p className="text-[8px] text-gray-300 uppercase font-black">{getRelativeTime(c.created_at)}</p>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{c.content}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-xs text-gray-400 italic py-4">Aucune palabre sur cette onde. Soyez le premier à poser une pierre.</p>
            )}
          </div>
          {currentUser && (
            <form onSubmit={handleAddComment} className="flex gap-3">
              <input value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Ajouter une pierre à la palabre..." className="flex-1 bg-gray-50 px-6 py-3 rounded-xl outline-none border border-gray-100 focus:bg-white transition-all" />
              <button disabled={!commentInput.trim()} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg disabled:opacity-20 active:scale-95"><Send size={18} /></button>
            </form>
          )}
        </div>
      )}
    </article>
  );
};

const FeedPage: React.FC<{ user: User | null }> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const highlightPostId = searchParams.get('post');
  const { addToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<CircleType>(CircleType.PEACE);
  const [sending, setSending] = useState(false);
  const [connStatus, setConnStatus] = useState<{ok: boolean, message: string} | null>(null);
  const [trendingCercles, setTrendingCercles] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const QUICK_EMOJIS = ["🇨🇮", "📢", "✊", "🤝", "💡", "⚖️", "🌳", "🏗️", "✨", "❤️"];

  const fetchPosts = async () => {
    setLoading(true);
    const status = await db.checkConnection();
    setConnStatus(status);
    
    if (isRealSupabase && supabase) { 
      try {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setPosts(data || []);
        
        const counts = (data || []).reduce((acc: any, p: Post) => {
          acc[p.circle_type] = (acc[p.circle_type] || 0) + 1;
          return acc;
        }, {});
        const sorted = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 4);
        setTrendingCercles(sorted);

      } catch (e) { setPosts(MOCK_POSTS); }
    } else { setPosts(MOCK_POSTS); }
    setLoading(false); 
  };

  useEffect(() => { 
    fetchPosts(); 
  }, []);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    
    setNewPostText(newText);
    
    // Rétablir le focus et la sélection
    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    insertText(emoji);
    setShowEmojiPicker(false);
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() || !user) return;
    setSending(true);
    const isGuardian = user.role === Role.SUPER_ADMIN;
    const postData = { 
      author_id: user.id, 
      content: newPostText, 
      circle_type: selectedCircle, 
      is_majestic: isGuardian,
      reactions: { useful: 0, relevant: 0, inspiring: 0 },
      comments: [],
      created_at: new Date().toISOString()
    };
    try {
      if (isRealSupabase && supabase) {
        const { error } = await supabase.from('posts').insert([postData]);
        if (error) throw error;
        addToast(isGuardian ? "Parole souveraine diffusée." : "Onde propagée avec succès !", "success");
      } else {
        setPosts(prev => [ { ...postData, id: 'local-' + Date.now() } as Post, ...prev]);
        addToast("Mode démo activé.", "info");
      }
      setNewPostText('');
      fetchPosts();
    } catch (e: any) { addToast("Échec de diffusion.", "error"); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Gauche */}
        <aside className="lg:col-span-3 space-y-8 hidden lg:block">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 px-2">État de la Cité</h3>
            <div className={`p-4 rounded-2xl flex items-center gap-3 mb-6 ${connStatus?.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              <div className={`w-2 h-2 rounded-full ${connStatus?.ok ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              <span className="text-[10px] font-black uppercase">{connStatus?.ok ? 'Souveraine' : 'Mode Démo'}</span>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span className="flex items-center gap-2"><Users size={14} /> Citoyens</span>
                <span className="bg-gray-50 px-3 py-1 rounded-lg">158</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span className="flex items-center gap-2"><TrendingUp size={14} /> Ondes</span>
                <span className="bg-gray-50 px-3 py-1 rounded-lg">{posts.length}</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 px-2">Cercles actifs</h4>
              <div className="space-y-4">
                {trendingCercles.map(([name, count]) => (
                  <Link key={name} to={`/circle/${encodeURIComponent(name)}`} className="flex items-center justify-between group">
                    <span className="text-[11px] font-bold text-gray-600 group-hover:text-blue-600 transition-colors line-clamp-1 flex-1 pr-2">{name}</span>
                    <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Flux Central */}
        <main className="lg:col-span-6 space-y-12">
          <div className="mb-12">
            <div className="inline-flex items-center gap-3 bg-blue-50 px-5 py-2 rounded-full mb-6 border border-blue-100 shadow-sm">
              <Sparkles className="text-blue-600 w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Le pouls de la Nation</span>
            </div>
            <h2 className="text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Le Fil d'Éveil</h2>
            <p className="text-gray-500 font-medium italic text-lg">Dialogue mature pour un avenir souverain.</p>
          </div>

          {user ? (
            <div className={`bg-white rounded-[4rem] border p-8 md:p-12 shadow-prestige mb-16 relative overflow-hidden group ${user.role === Role.SUPER_ADMIN ? 'border-amber-200 ring-4 ring-amber-50' : 'border-gray-100'}`}>
              
              {/* Toolbar de mise en forme */}
              <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-gray-50/50 rounded-2xl w-fit">
                <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition-all" title="Gras"><Bold size={16} /></button>
                <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition-all" title="Italique"><Italic size={16} /></button>
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <div className="relative">
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 hover:bg-white hover:text-amber-600 rounded-lg transition-all ${showEmojiPicker ? 'bg-white text-amber-600' : ''}`} title="Émojis"><Smile size={16} /></button>
                  {showEmojiPicker && (
                    <div className="absolute left-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-3 grid grid-cols-5 gap-2 z-50 animate-in zoom-in-95">
                      {QUICK_EMOJIS.map(e => (
                        <button key={e} onClick={() => insertEmoji(e)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-all text-lg">{e}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <textarea 
                ref={textareaRef}
                value={newPostText} 
                onChange={e => setNewPostText(e.target.value)} 
                placeholder={user.role === Role.SUPER_ADMIN ? "Gardien, déposez votre édit souverain ici..." : "Déposez une pierre à l'édifice de la cité..."} 
                className="w-full h-44 bg-gray-50/80 p-8 rounded-[3rem] outline-none mb-8 font-serif text-xl focus:bg-white transition-all resize-none border-2 border-transparent focus:border-blue-100 shadow-inner" 
              />
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <select value={selectedCircle} onChange={e => setSelectedCircle(e.target.value as any)} className="bg-gray-50 px-8 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest outline-none border border-gray-100 hover:bg-white transition-colors">
                  {CIRCLES_CONFIG.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
                </select>
                <button onClick={handleCreatePost} disabled={sending || !newPostText.trim()} className={`px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 disabled:opacity-30 ${user.role === Role.SUPER_ADMIN ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-gray-950 hover:bg-black text-white'}`}>
                  {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} 
                  {user.role === Role.SUPER_ADMIN ? "Publier l'Édit" : "Diffuser l'Onde"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-10 px-6">
               <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300">Archives de l'Impact</h3>
               <button onClick={fetchPosts} className="p-4 bg-white border border-gray-100 rounded-2xl hover:text-blue-600 hover:shadow-lg transition-all active:rotate-180 duration-500"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-50">
                 <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Consultation des annales...</p>
              </div>
            ) : posts.length > 0 ? (
              posts.map(p => <PostCard key={p.id} post={p} currentUser={user} isHighlighted={highlightPostId === String(p.id)} onUpdate={fetchPosts} />)
            ) : (
              <div className="bg-white border-4 border-dashed border-gray-50 rounded-[5rem] p-32 text-center text-gray-300">
                 <Info className="w-16 h-16 mx-auto mb-6 opacity-20" />
                 <p className="italic text-lg font-medium">Le fil attend votre première étincelle.</p>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar Droite */}
        <aside className="lg:col-span-3 space-y-8 hidden lg:block">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8 px-2 flex items-center gap-2"><Award size={14} className="text-amber-500" /> Top Citoyens</h3>
            <div className="space-y-6">
              {[
                { name: "Amadou K.", points: "12,4k", role: "Pionnier", avatar: "https://picsum.photos/seed/amadou/80/80" },
                { name: "Sara Diallo", points: "9,2k", role: "Actrice", avatar: "https://picsum.photos/seed/sara/80/80" },
                { name: "Dr. Bamba", points: "8,8k", role: "Expert", avatar: "https://picsum.photos/seed/bamba/80/80" }
              ].map((citizen, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <img src={citizen.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-blue-100 transition-all" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 truncate">{citizen.name}</p>
                    <p className="text-[8px] font-black uppercase text-gray-400">{citizen.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                      <Flame size={10} fill="currentColor" /> {citizen.points}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 pt-10 border-t border-gray-50">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 px-2">Édits majeurs</h3>
              <div className="space-y-6">
                {posts.filter(p => p.is_majestic).slice(0, 2).map(p => (
                  <div key={p.id} className="border-l-4 border-amber-200 pl-4 py-1">
                    <p className="text-[13px] text-gray-600 italic line-clamp-2 leading-relaxed font-medium">"{p.content}"</p>
                    <p className="text-[8px] font-black uppercase text-amber-600 mt-2">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <Link to="/governance" className="mt-10 w-full py-4 bg-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
              Voir le Palais <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Heart size={80} /></div>
            <h3 className="text-xl font-serif font-bold mb-4">Soutenir le Cercle</h3>
            <p className="text-xs text-blue-100 leading-relaxed mb-6 font-medium">Contribuez à l'autonomie du territoire par vos dons Wave.</p>
            <Link to="/impact" className="block w-full py-4 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg hover:bg-blue-50 transition-all">Accéder au Studio</Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FeedPage;
