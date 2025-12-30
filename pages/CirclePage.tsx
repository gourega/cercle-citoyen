
import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, CircleType, Post, UserCategory } from '../types';
import { CIRCLES_CONFIG } from '../constants';
import { 
  ChevronLeft, 
  Users, 
  Info, 
  MessageCircle, 
  Sparkles, 
  Loader2, 
  RefreshCw, 
  Library,
  Trophy,
  Bookmark,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { summarizeCircleDiscussions } from '../lib/gemini';
import { MOCK_POSTS, MOCK_USERS } from '../lib/mocks';

const CirclePage: React.FC<{ user: User }> = ({ user }) => {
  const { type } = useParams<{ type: string }>();
  const circleType = decodeURIComponent(type || '') as CircleType;
  const config = CIRCLES_CONFIG.find(c => c.type === circleType);
  
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'institutions'>('all');

  const allCirclePosts = MOCK_POSTS.filter(p => p.circle_type === circleType);
  const filteredPosts = activeFilter === 'institutions' 
    ? allCirclePosts.filter(p => MOCK_USERS[p.author_id]?.category !== UserCategory.CITIZEN)
    : allCirclePosts;

  const topContributions = [...allCirclePosts]
    .sort((a, b) => (b.reactions.useful + b.reactions.inspiring) - (a.reactions.useful + a.reactions.inspiring))
    .slice(0, 2);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const posts = allCirclePosts.map(p => p.content);
      const result = await summarizeCircleDiscussions(circleType, posts.length > 0 ? posts : ["Pas encore de discussions."]);
      setSummary(result || "Impossible de générer une synthèse.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!config) return <div className="p-20 text-center font-bold text-gray-400 uppercase tracking-widest">Cercle introuvable</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12 animate-in fade-in duration-700">
      <Link to="/feed" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 transition-colors text-sm font-bold group">
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour au fil citoyen
      </Link>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mb-12">
        <div className={`h-3 bg-current ${config.color.split(' ')[1]}`}></div>
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className={`w-20 h-20 md:w-28 md:h-28 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner ${config.color}`}>
              {React.cloneElement(config.icon as React.ReactElement<any>, { className: "w-10 h-10 md:w-12 md:h-12" })}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">{circleType}</h1>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Actif</span>
              </div>
              <p className="text-[17px] text-gray-500 leading-relaxed mb-8 max-w-3xl">
                {config.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100/50">
                  <Library className="w-4 h-4 mr-2 text-blue-600" /> {allCirclePosts.length} réflexions
                </div>
                <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100/50">
                  <Building2 className="w-4 h-4 mr-2 text-teal-600" /> {allCirclePosts.filter(p => MOCK_USERS[p.author_id]?.category !== UserCategory.CITIZEN).length} institutions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          
          <section>
            <div className="flex items-center justify-between mb-8 px-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-500" /> Le Panthéon du Cercle
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {topContributions.length > 0 ? (
                topContributions.map(post => {
                  const author = MOCK_USERS[post.author_id];
                  return (
                    <div key={post.id} className="bg-gradient-to-br from-amber-50/30 to-white border border-amber-100 p-8 rounded-[2.5rem] shadow-sm relative group hover:shadow-md transition-all">
                      <div className="absolute top-6 right-8"><Bookmark className="w-5 h-5 text-amber-400" /></div>
                      <div className="flex items-center gap-4 mb-6">
                        <img src={author.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{author.name}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Réflexion d'Élite</p>
                        </div>
                      </div>
                      <p className="text-gray-800 text-[15px] leading-relaxed italic mb-6">"{post.content}"</p>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                  <Library className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm text-gray-400 font-medium">Panthéon en cours de constitution.</p>
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Échanges récents</h2>
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
              >
                Tous
              </button>
              <button 
                onClick={() => setActiveFilter('institutions')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'institutions' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-400'}`}
              >
                Institutions
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => {
                const author = MOCK_USERS[post.author_id];
                const isOrg = author?.category !== UserCategory.CITIZEN;
                return (
                  <div key={post.id} className={`bg-white p-8 rounded-[2rem] border transition-all ${isOrg ? 'border-teal-100 shadow-teal-50 shadow-sm' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={author.avatar} className={`w-8 h-8 rounded-lg object-cover ${isOrg ? 'ring-2 ring-teal-400' : ''}`} alt="" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-900">{author.name}</p>
                          {isOrg && <BadgeCheck className="w-3 h-3 text-teal-500" />}
                        </div>
                        <p className="text-[9px] text-gray-400 uppercase font-black">{post.created_at}</p>
                      </div>
                    </div>
                    <p className={`text-sm text-gray-700 leading-relaxed ${isOrg ? 'font-bold' : ''}`}>{post.content}</p>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-16 text-center">
                <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Aucune réflexion correspondante.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Sparkles className="w-32 h-32 text-indigo-900" />
            </div>
            <div className="mb-6">
              <h3 className="indigo-900 font-black text-[11px] uppercase tracking-[0.2em] mb-1">Intelligence du Cercle</h3>
              <p className="text-indigo-700/70 font-medium">Synthèse IA des Sages</p>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-white text-indigo-600 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all border border-indigo-100/50 disabled:opacity-50"
              >
                {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Générer la synthèse textuelle
              </button>
            </div>
            
            {summary && (
              <div className="mt-6 text-indigo-900/80 text-[13px] leading-relaxed italic bg-white/40 p-4 rounded-xl border border-indigo-100/30 animate-in fade-in">
                "{summary.slice(0, 300)}..."
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CirclePage;
