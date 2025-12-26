
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'amber' | 'blue' | 'rose';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 32, showText = true, variant = 'blue' }) => {
  const colors = {
    dark: { accent: '#111827', text: 'text-gray-900', secondary: 'text-blue-600' },
    light: { accent: '#ffffff', text: 'text-white', secondary: 'text-white/80' },
    amber: { accent: '#d97706', text: 'text-amber-900', secondary: 'text-amber-600' },
    blue: { accent: '#2563eb', text: 'text-gray-900', secondary: 'text-[#2563eb]' },
    rose: { accent: '#e11d48', text: 'text-gray-900', secondary: 'text-rose-600' }
  };

  const activeColor = colors[variant];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Icône avec animation de rotation fluide */}
      <div className="relative shrink-0">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="animate-[spin_20s_linear_infinite]"
        >
          <circle cx="50" cy="50" r="45" stroke={activeColor.accent} strokeWidth="2" strokeDasharray="6 6" opacity="0.3" />
          <path 
            d="M50 20C33.43 20 20 33.43 20 50" 
            stroke={activeColor.accent} 
            strokeWidth="10" 
            strokeLinecap="round"
          />
          <path 
            d="M80 50C80 33.43 66.57 20 50 20" 
            stroke={activeColor.accent} 
            strokeWidth="10" 
            strokeLinecap="round"
            opacity="0.4"
          />
          <circle cx="50" cy="50" r="12" fill={activeColor.accent} />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`text-xl md:text-2xl font-bold tracking-tight uppercase font-serif ${activeColor.text}`}>
              CERCLE
            </span>
            <span className={`text-xl md:text-2xl font-bold tracking-tight uppercase font-serif ${activeColor.secondary}`}>
              CITOYEN
            </span>
          </div>
          <div className="flex items-center justify-between text-[7px] md:text-[9px] font-black tracking-[0.45em] uppercase opacity-30 mt-0.5">
            <span>PENSER</span>
            <span className="mx-0.5">•</span>
            <span>RELIER</span>
            <span className="mx-0.5">•</span>
            <span>AGIR</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
