
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ThumbsUp, Lightbulb, Loader2, Send, Sparkles, 
  ShieldCheck, Share2, MessageCircle, RefreshCw, 
  Info, LogIn, Bold, Italic, Underline, Smile, 
  Pencil, Save, X, ChevronDown, ChevronUp, Trash2, AlertTriangle,
  Linkedin, MessageSquare as WhatsAppIcon, Link as LinkIcon, Crown,
  TrendingUp, Users, Heart, ChevronRight
} from 'lucide-react';
import { User, CircleType, Role, Post, Comment } from '../types';
import { supabase, isRealSupabase, db } from '../lib/supabase';
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

const PostCard: React.FC<{ 
  post: Post, 
  currentUser: User | null, 
  isHighlighted?: boolean,
  onUpdate: () => void 
}> = ({ post, currentUser, isHighlighted, onUpdate }) => {
  const { addToast } = useToast();
  const [author, setAuthor] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [reactions, setReactions] = useState(post.reactions || { useful: 0, relevant: 0, inspiring: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [commentInput, setCommentInput] = useState('');
  const shareMenuRef = useRef<HTMLDivElement>(null);

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

  const handleUpdatePost = async () => {
    if (!editContent.trim()) return;
    try {
      if (isRealSupabase && supabase) await supabase.from('posts').update({ content: editContent }).eq('id', post.id);
      post.content = editContent;
      setIsEditing(false);
      addToast("Onde mise à jour.", "success");
      onUpdate();
    } catch (e) { addToast("Erreur mise à jour.", "error"); }
  };

  const handleDeletePost = async () => {
    try {
      if (isRealSupabase && supabase) await supabase.from('posts').delete().eq('id', post.id);
      addToast(currentUser?.role === Role.SUPER_ADMIN ? "Action de modération souveraine effectuée." : "Onde retirée.", "success");
      onUpdate();
    } catch (e) { addToast("Échec suppression.", "error"); }
    finally { setShowDeleteConfirm(false); }
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
      if (isRealSupabase && supabase) await supabase.from('posts').update({ comments: updatedComments }).eq('id', post.id);
      post.comments = updatedComments;
      setCommentInput('');
      addToast("Palabre ajoutée.", "success");
      onUpdate();
    } catch (e) { addToast("Erreur sauvegarde.", "error"); }
  };

  if (!author) return <div className="h-64 bg-gray-50 rounded-[3rem] animate-pulse mb-8"></div>;
  
  const isMajestic = post.is_majestic || author.role === Role.SUPER_ADMIN;
  const isOwner = currentUser?.id === post.author_id;
  const isGuardian = currentUser?.role === Role.SUPER_ADMIN;
  const canDelete = isOwner || isGuardian;

  return (
    <article 
      className={`bg-white border rounded-[3rem] shadow-sm hover:shadow-xl transition-all mb-10 overflow-hidden flex flex-col 
        ${isHighlighted ? 'ring-8 ring-amber-500/10 border-amber-200' : 'border-gray-100'} 
        ${isMajestic ? 'border-amber-200 ring-4 ring-amber-50 bg-amber-50/5' : ''}`}
    >
      <div className="p-8 pb-4 flex justify-between items-center">
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
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {new Date(post.created_at).toLocaleDateString()} • <Link to={`/circle/${encodeURIComponent(post.circle_type)}`} className="text-blue-600 hover:underline">{post.circle_type}</Link>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-amber-50 hover:text-amber-600 transition-all"><Pencil size={18} /></button>
          )}
          {canDelete && (
            <button onClick={() => setShowDeleteConfirm(true)} className={`p-4 rounded-2xl transition-all ${isGuardian && !isOwner ? 'bg-rose-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600'}`} title={isGuardian && !isOwner ? "Action Souveraine" : "Supprimer"}><Trash2 size={18} /></button>
          )}
        </div>
      </div>

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
          <div className={`text-gray-800 leading-relaxed ${isMajestic ? 'text-2xl font-serif italic border-l-8 border-amber-200 pl-10 my-6' : 'text-lg font-medium'}`}>
            <div dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
          </div>
        )}
      </div>

      <div className="bg-gray-50/50 p-6 flex items-center justify-between border-t border-gray-100 mt-4">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 text-blue-600 shadow-sm transition-all hover:scale-105 active:scale-95"><ThumbsUp size={16} /> <span className="text-xs font-black">{reactions.useful}</span></button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 text-emerald-600 shadow-sm transition-all hover:scale-105 active:scale-95"><Lightbulb size={16} /> <span className="text-xs font-black">{reactions.relevant}</span></button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 text-amber-600 shadow-sm transition-all hover:scale-105 active:scale-95"><Sparkles size={16} /> <span className="text-xs font-black">{reactions.inspiring}</span></button>
        </div>
        <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${showComments ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-300'}`}>Palabres ({post.comments?.length || 0})</button>
      </div>

      {showComments && (
        <div className="p-8 bg-white border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-4 mb-8">
            {post.comments?.map((c, i) => (
              <div key={i} className="flex gap-4">
                <img src={c.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                <div className="bg-gray-50 p-4 rounded-2xl flex-1">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{c.author}</p>
                  <p className="text-sm text-gray-700 font-medium">{c.content}</p>
                </div>
              </div>
            ))}
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchPosts = async () => {
    setLoading(true);
    const status = await db.checkConnection();
    setConnStatus(status);
    
    if (isRealSupabase && supabase) { 
      try {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setPosts(data || []);
      } catch (e) { setPosts(MOCK_POSTS); }
    } else { setPosts(MOCK_POSTS); }
    setLoading(false); 
  };

  useEffect(() => { fetchPosts(); }, []);

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
        addToast("Mode démo : Variables de connexion invalides dans Cloudflare.", "info");
      }
      setNewPostText('');
      fetchPosts();
    } catch (e: any) { addToast("Échec de diffusion. Vérifiez vos accès.", "error"); }
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
            {!connStatus?.ok && (
              <p className="text-[10px] font-bold text-rose-600 bg-rose-50 p-4 rounded-2xl mb-6 leading-relaxed border border-rose-100">
                {connStatus?.message}
              </p>
            )}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span className="flex items-center gap-2"><Users size={14} /> Citoyens</span>
                <span>{posts.length * 3 + 12}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span className="flex items-center gap-2"><TrendingUp size={14} /> Ondes</span>
                <span>{posts.length}</span>
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
          ) : (
            <div className="bg-gray-900 rounded-[3rem] p-10 mb-16 text-white shadow-2xl flex items-center justify-between overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-2xl font-serif font-bold mb-2">Participez à l'Éveil</h3>
                <p className="opacity-60 text-sm font-medium">Rejoignez le Cercle pour influencer le destin du territoire.</p>
              </div>
              <Link to="/auth" className="relative z-10 bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl">Rejoindre la Cité</Link>
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Sparkles size={120} /></div>
            </div>
          )}

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
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8 px-2 flex items-center gap-2"><Crown size={14} className="text-amber-500" /> Paroles du Gardien</h3>
            <div className="space-y-6">
              {posts.filter(p => p.is_majestic).slice(0, 3).map(p => (
                <div key={p.id} className="border-l-4 border-amber-200 pl-4 py-1">
                  <p className="text-[13px] text-gray-600 italic line-clamp-2 leading-relaxed font-medium">"{p.content}"</p>
                  <p className="text-[8px] font-black uppercase text-amber-600 mt-2">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            <Link to="/governance" className="mt-10 w-full py-4 bg-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
              Voir le Palais des Édits <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Heart size={80} /></div>
            <h3 className="text-xl font-serif font-bold mb-4">Soutenir le Cercle</h3>
            <p className="text-xs text-blue-100 leading-relaxed mb-6 font-medium">Financez la souveraineté numérique du pays par vos dons via Wave.</p>
            <Link to="/impact" className="block w-full py-4 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg hover:bg-blue-50 transition-all">Accéder au Studio</Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FeedPage;