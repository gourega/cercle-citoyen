
import React from 'react';
// @ts-ignore
import { Link } from 'react-router-dom';
import { CIRCLES_CONFIG } from '../constants';
import { ChevronRight, Sparkles, Users, ArrowUpRight } from 'lucide-react';

const CirclesDiscoveryPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16 animate-in fade-in duration-700">
      <div className="mb-16 text-center lg:text-left">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">L'Écosystème du <span className="text-blue-600 italic">Cercle</span></h1>
        <p className="text-gray-500 max-w-2xl text-lg font-medium leading-relaxed">
          Explorez les 12 piliers de la cohésion et du développement souverain. Rejoignez les débats qui vous passionnent.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {CIRCLES_CONFIG.map((circle, i) => (
          <Link 
            key={i} 
            to={`/circle/${encodeURIComponent(circle.type)}`}
            className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 ${circle.color.split(' ')[1]}`}>
               {/* Fixed: Cast to React.ReactElement<any> to allow 'size' prop in cloned icon */}
               {React.cloneElement(circle.icon as React.ReactElement<any>, { size: 120 })}
            </div>

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-inner transition-transform group-hover:-rotate-6 ${circle.color}`}>
               {circle.icon}
            </div>

            <h3 className="text-xl font-serif font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{circle.type}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-10 line-clamp-3 font-medium">
               {circle.description}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <Users size={14} /> 2k+ Citoyens
               </div>
               <div className="flex items-center gap-1 text-blue-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  Entrer <ArrowUpRight size={14} />
               </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-20 p-12 rounded-[4rem] bg-gray-950 text-white relative overflow-hidden text-center group shadow-prestige">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/shattered.png')]"></div>
         <div className="relative z-10 max-w-2xl mx-auto">
            <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-6 animate-pulse" />
            <h2 className="text-3xl font-serif font-bold mb-6">Le Palais des Sages</h2>
            <p className="text-gray-400 text-lg mb-10 italic">"Aucune thématique n'est isolée. Chaque cercle nourrit la vision globale de la Cité."</p>
            <Link to="/feed" className="inline-flex items-center gap-3 bg-white text-gray-900 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all">
               Voir les ondes globales
            </Link>
         </div>
      </div>
    </div>
  );
};

export default CirclesDiscoveryPage;
