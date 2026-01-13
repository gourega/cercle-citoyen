import React, { useState, useEffect } from 'react';
import { Send, ThumbsUp, Lightbulb, MessageCircle, Crown, ShieldCheck, Volume2, Camera, Loader2, Sparkles } from 'lucide-react';
import { User, CircleType, Role, Post } from '../types';
import { MOCK_POSTS } from '../lib/mocks';
import { useToast } from '../App';

const FeedPage: React.FC<{ user: User }> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handlePost = () => {
    if (!newPost.trim()) return;
    const p: Post = {
      id: Math.random().toString(),
      author_id: user.id,
      content: newPost,
      circle_type: CircleType.PEACE,
      created_at: new Date().toISOString(),
      reactions: { useful: 0, relevant: 0, inspiring: 0 }
    };
    setPosts([p, ...posts]);
    setNewPost('');
    addToast("Onde citoyenne diffusée !", "success");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      
      <header className="mb-16">
        <h1 className="text-5xl font-serif font-bold text-white mb-2">Fil d'Éveil</h1>
        <p className="text-slate-500 text-lg font-serif italic">Dialogue citoyen souverain.</p>
      </header>

      {/* Compositeur */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <textarea 
          value={newPost} onChange={e => setNewPost(e.target.value)}
          className="w-full h-32 bg-transparent text-xl text-white outline-none resize-none placeholder:text-slate-700 leading-relaxed"
          placeholder="Déposez une pierre à l'édifice..."
        />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
           <div className="flex items-center gap-4 text-slate-500">
             <button className="hover:text-blue-500 transition-colors"><Camera size={20} /></button>
             <button className="hover:text-blue-500 transition-colors"><Sparkles size={20} /></button>
           </div>
           <button 
             onClick={handlePost} disabled={!newPost.trim()}
             className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
           >
             <Send size={16} /> DIFFUSER L'ONDE
           </button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-10">
        {posts.map(post => (
          <article key={post.id} className={`bg-slate-900/40 rounded-[3rem] border border-white/5 p-8 md:p-12 shadow-xl transition-all hover:border-blue-500/20 group ${post.is_majestic ? 'ring-1 ring-amber-500/30' : ''}`}>
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${post.author_id}/150/150`} alt="" className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <p className="font-bold text-base text-white">Citoyen Actif</p>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{post.circle_type}</p>
                 </div>
               </div>
               <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Volume2 size={18} /></button>
             </div>

             <div className={`text-slate-200 leading-relaxed mb-10 ${post.is_majestic ? 'text-2xl font-serif italic text-white' : 'text-lg'}`}>
               {post.content}
             </div>

             <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-all">
                    <ThumbsUp size={14} /> {post.reactions.useful}
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all">
                    <Lightbulb size={14} /> {post.reactions.relevant}
                  </button>
                </div>
                <button className="text-slate-500 hover:text-white flex items-center gap-2 transition-all">
                   <MessageCircle size={18} /> <span className="text-xs font-bold">24</span>
                </button>
             </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default FeedPage;