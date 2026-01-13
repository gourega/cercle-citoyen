import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'amber' | 'blue' | 'rose';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 48, showText = true, variant = 'blue' }) => {
  const colors = {
    dark: { primary: '#111827', text: 'text-gray-900', secondary: 'text-blue-600' },
    light: { primary: '#ffffff', text: 'text-white', secondary: 'text-white/80' },
    amber: { primary: '#d97706', text: 'text-amber-900', secondary: 'text-amber-600' },
    blue: { primary: '#3b82f6', text: 'text-gray-900', secondary: 'text-[#3b82f6]' },
    rose: { primary: '#e11d48', text: 'text-gray-900', secondary: 'text-rose-600' }
  };

  const activeColor = colors[variant];

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Cercles Entrelacés SVG */}
      <div className="relative shrink-0">
        <svg 
          width={size * 1.5} 
          height={size} 
          viewBox="0 0 120 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-xl"
        >
          {/* Cercle Gauche */}
          <circle cx="40" cy="40" r="30" stroke={activeColor.primary} strokeWidth="8" opacity="0.8" />
          {/* Cercle Droit */}
          <circle cx="80" cy="40" r="30" stroke={activeColor.primary} strokeWidth="8" opacity="0.6" />
          {/* Cercle Central Entrelacé */}
          <circle cx="60" cy="50" r="25" stroke={activeColor.primary} strokeWidth="6" strokeDasharray="5 5" />
          
          {/* Point Central d'Impact */}
          <circle cx="60" cy="40" r="6" fill={activeColor.primary} className="animate-pulse" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className={`text-2xl md:text-3xl font-bold tracking-tighter uppercase font-serif ${activeColor.text}`}>
              CERCLE <span className={activeColor.secondary}>CITOYEN</span>
            </span>
          </div>
          <div className="flex items-center justify-between w-full text-[8px] font-black tracking-[0.4em] uppercase opacity-40 mt-1">
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