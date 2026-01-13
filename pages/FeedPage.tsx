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
    <div className="max-w-xl mx-auto space-y-8 md:space-y-12">
      
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-1">Fil d'Éveil</h1>
        <p className="text-slate-500 text-base italic">Dialogue citoyen souverain.</p>
      </header>

      {/* Compositeur */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl backdrop-blur-xl">
        <textarea 
          value={newPost} onChange={e => setNewPost(e.target.value)}
          className="w-full h-24 md:h-28 bg-transparent text-lg text-white outline-none resize-none placeholder:text-slate-700 leading-relaxed"
          placeholder="Déposez une pierre..."
        />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/5">
           <div className="flex items-center gap-4 text-slate-500">
             <button className="hover:text-blue-500 transition-colors"><Camera size={18} /></button>
             <button className="hover:text-blue-500 transition-colors"><Sparkles size={18} /></button>
           </div>
           <button 
             onClick={handlePost} disabled={!newPost.trim()}
             className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all flex items-center justify-center gap-3"
           >
             <Send size={14} /> DIFFUSER
           </button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6 md:space-y-8">
        {posts.map(post => (
          <article key={post.id} className={`bg-slate-900/40 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 p-6 md:p-10 shadow-xl transition-all group ${post.is_majestic ? 'ring-1 ring-amber-500/20' : ''}`}>
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${post.author_id}/150/150`} alt="" className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <p className="font-bold text-sm text-white">Citoyen Actif</p>
                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">{post.circle_type}</p>
                 </div>
               </div>
               <button className="p-2.5 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"><Volume2 size={16} /></button>
             </div>

             <div className={`text-slate-200 leading-relaxed mb-8 ${post.is_majestic ? 'text-xl font-serif italic text-white' : 'text-base'}`}>
               {post.content}
             </div>

             <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-bold hover:bg-blue-500/20 transition-all">
                    <ThumbsUp size={12} /> {post.reactions.useful}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition-all">
                    <Lightbulb size={12} /> {post.reactions.relevant}
                  </button>
                </div>
                <button className="text-slate-500 hover:text-white flex items-center gap-2 transition-all">
                   <MessageCircle size={16} /> <span className="text-[10px] font-bold">24</span>
                </button>
             </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default FeedPage;