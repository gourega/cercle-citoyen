
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'amber' | 'blue' | 'rose' | 'national';
}

const OFFICIAL_LOGO_URL = "https://nfsskgcpqbccnwacsplc.supabase.co/storage/v1/object/public/Logo-cercle-citoyen/logo-cercle-citoyen.png";

const Logo: React.FC<LogoProps> = ({ className = "", size = 32, showText = true, variant = 'blue' }) => {
  const colors = {
    dark: { text: 'text-gray-900', secondary: 'text-blue-600' },
    light: { text: 'text-white', secondary: 'text-white/80' },
    amber: { text: 'text-amber-900', secondary: 'text-amber-600' },
    blue: { text: 'text-gray-900', secondary: 'text-[#2563eb]' },
    rose: { text: 'text-gray-900', secondary: 'text-rose-600' },
    national: { text: 'text-[#f58220]', secondary: 'text-[#009e49]' }
  };

  const activeColor = colors[variant] || colors.blue;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size * 1.1, height: size * 1.1 }}>
        <img 
          src={OFFICIAL_LOGO_URL} 
          alt="Cercle Citoyen Logo" 
          className="w-full h-full object-contain transition-transform duration-700 hover:scale-105"
          style={{ maxHeight: size * 1.1 }}
        />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`text-base md:text-lg font-bold tracking-tight uppercase font-sans ${activeColor.text}`}>
              CERCLE
            </span>
            <span className={`text-base md:text-lg font-bold tracking-tight uppercase font-sans ${activeColor.secondary}`}>
              CITOYEN
            </span>
          </div>
          <div className="flex items-center justify-between text-[5px] md:text-[6px] font-bold tracking-[0.4em] uppercase opacity-30 mt-0.5">
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
