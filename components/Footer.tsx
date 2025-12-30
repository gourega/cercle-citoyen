
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import Logo from '../Logo';

const Footer: React.FC = () => {
  return (
    <footer className="w-full pt-16 pb-12 bg-[#fcfcfc] relative z-10 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
          
          {/* Colonne 1 : Identité & Vision */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
            <Logo size={36} showText />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-relaxed max-w-xs">
              RÉSEAU SOCIAL CITOYEN ENGAGÉ POUR LA SOUVERAINETÉ NUMÉRIQUE ET LE PROGRÈS SOCIAL EN CÔTE D'IVOIRE.
            </p>
          </div>

          {/* Colonne 2 : Contact & Support */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-4 h-px bg-blue-600"></span> CONTACT & SUPPORT
            </h3>
            <div className="space-y-4">
              <a href="mailto:cerclecitoyenci@gmail.com" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <Mail size={16} />
                </div>
                <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors">cerclecitoyenci@gmail.com</span>
              </a>
              <a href="tel:+2252522001239" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                  <Phone size={16} />
                </div>
                <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors">+225 2522001239</span>
              </a>
            </div>
          </div>

          {/* Colonne 3 : Cadre Légal */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-4 h-px bg-blue-600"></span> CADRE LÉGAL
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-x-8 gap-y-4">
              <Link to="/legal" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">CGU</Link>
              <Link to="/legal" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">CONFIDENTIALITÉ</Link>
              <Link to="/legal" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">MENTIONS LÉGALES</Link>
              <Link to="/manifesto" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">MANIFESTE</Link>
            </div>
          </div>

        </div>

        {/* Ligne de Copyright - Ultra compacte */}
        <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-2 text-blue-600/30">
            <ShieldCheck size={14} />
            <p className="text-[9px] font-black uppercase tracking-[0.4em]">
              SOUVERAINETÉ NUMÉRIQUE IVOIRIENNE
            </p>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-gray-300">
            © 2025 CERCLE CITOYEN • TOUS DROITS RÉSERVÉS
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
