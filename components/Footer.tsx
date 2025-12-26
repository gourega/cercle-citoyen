
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import Logo from '../Logo';

const Footer: React.FC = () => {
  return (
    <footer className="w-full pt-20 pb-16 bg-[#fcfcfc] relative z-10 border-t border-gray-50">
      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
        
        {/* Logo Section */}
        <div className="mb-12">
          <Logo size={42} showText />
        </div>

        {/* Vision Text */}
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-gray-400 leading-relaxed max-w-lg mb-20 px-4">
          RÉSEAU SOCIAL CITOYEN ENGAGÉ POUR LA SOUVERAINETÉ NUMÉRIQUE ET LE PROGRÈS SOCIAL EN CÔTE D'IVOIRE.
        </p>

        {/* Contact & Support Section */}
        <div className="mb-20 space-y-10 w-full">
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900">CONTACT & SUPPORT</h3>
          <div className="flex flex-col items-center gap-6">
            <a href="mailto:cerclecitoyenci@gmail.com" className="flex items-center gap-4 group">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Mail size={20} />
              </div>
              <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors tracking-tight">cerclecitoyenci@gmail.com</span>
            </a>
            <a href="tel:+2252522001239" className="flex items-center gap-4 group">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <Phone size={20} />
              </div>
              <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors tracking-tight">+225 2522001239</span>
            </a>
          </div>
        </div>

        {/* Legal Frame Section */}
        <div className="mb-24 space-y-10 w-full">
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900">CADRE LÉGAL</h3>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-6">
            <Link to="/legal" className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">CGU</Link>
            <Link to="/legal" className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">CONFIDENTIALITÉ</Link>
            <Link to="/legal" className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">MENTIONS LÉGALES</Link>
            <Link to="/manifesto" className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">MANIFESTE</Link>
          </div>
        </div>

        {/* Copyright Line */}
        <div className="w-full pt-10 border-t border-gray-100 flex flex-col items-center">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-gray-300">
            © 2025 CERCLE CITOYEN • SOUVERAINETÉ NUMÉRIQUE
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
