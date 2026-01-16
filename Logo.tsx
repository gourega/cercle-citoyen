
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'amber' | 'blue' | 'rose' | 'national';
}

// URL par défaut vers le nouveau logo (à remplacer par l'URL Supabase finale)
const DEFAULT_LOGO_URL = "https://nfsskgcpqbccnwacsplc.supabase.co/storage/v1/object/public/assets/logo_cercle_ci.png";

const Logo: React.FC<LogoProps> = ({ className = "", size = 32, showText = true, variant = 'blue' }) => {
  const colors = {
    dark: { text: 'text-gray-900', secondary: 'text-blue-600' },
    light: { text: 'text-white', secondary: 'text-white/80' },
    amber: { text: 'text-amber-900', secondary: 'text-amber-600' },
    blue: { text: 'text-gray-900', secondary: 'text-[#2563eb]' },
    rose: { text: 'text-gray-900', secondary: 'text-rose-600' },
    national: { text: 'text-[#f58220]', secondary: 'text-[#009e49]' } // Orange et Vert de la CI
  };

  const activeColor = colors[variant] || colors.blue;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size * 1.2, height: size * 1.2 }}>
        {/* Le logo image (Carte de CI) remplace les cercles SVG */}
        <img 
          src={DEFAULT_LOGO_URL} 
          alt="Cercle Citoyen Logo" 
          className="w-full h-full object-contain drop-shadow-sm"
          style={{ maxHeight: size * 1.2 }}
          onError={(e) => {
            // Fallback si l'image n'est pas encore sur Supabase
            (e.target as any).style.display = 'none';
          }}
        />
        {/* Fallback SVG si l'image ne charge pas (Anciens cercles entrelacés en gris léger) */}
        <div className="absolute inset-0 -z-10 opacity-10">
           <svg viewBox="0 0 140 100" fill="none" className="w-full h-full">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" />
              <circle cx="90" cy="50" r="40" stroke="currentColor" strokeWidth="8" />
           </svg>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`text-xl md:text-2xl font-bold tracking-tight uppercase font-sans ${activeColor.text}`}>
              CERCLE
            </span>
            <span className={`text-xl md:text-2xl font-bold tracking-tight uppercase font-sans ${activeColor.secondary}`}>
              CITOYEN
            </span>
          </div>
          <div className="flex items-center justify-between text-[7px] md:text-[8px] font-black tracking-[0.4em] uppercase opacity-40 mt-0.5">
            <span>PENSER</span>
            <span>•</span>
            <span>RELIER</span>
            <span>•</span>
            <span>AGIR</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
