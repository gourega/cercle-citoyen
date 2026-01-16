
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'amber' | 'blue' | 'rose';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 32, showText = true, variant = 'blue' }) => {
  const colors = {
    dark: { text: 'text-gray-900', secondary: 'text-blue-600', gradientStart: '#111827', gradientEnd: '#374151' },
    light: { text: 'text-white', secondary: 'text-white/80', gradientStart: '#ffffff', gradientEnd: '#e5e7eb' },
    amber: { text: 'text-amber-900', secondary: 'text-amber-600', gradientStart: '#d97706', gradientEnd: '#f59e0b' },
    blue: { text: 'text-gray-900', secondary: 'text-[#2563eb]', gradientStart: '#2563eb', gradientEnd: '#1e40af' },
    rose: { text: 'text-gray-900', secondary: 'text-rose-600', gradientStart: '#e11d48', gradientEnd: '#be123c' }
  };

  const activeColor = colors[variant];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative shrink-0" style={{ width: size * 1.4, height: size }}>
        <svg 
          viewBox="0 0 140 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={activeColor.gradientStart} />
              <stop offset="100%" stopColor={activeColor.gradientEnd} />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Cercle Gauche */}
          <circle 
            cx="50" 
            cy="50" 
            r="40" 
            stroke="url(#circleGradient)" 
            strokeWidth="12" 
            className="opacity-90"
          />
          
          {/* Cercle Droit - Entrelacé */}
          <circle 
            cx="90" 
            cy="50" 
            r="40" 
            stroke="url(#circleGradient)" 
            strokeWidth="12" 
            className="opacity-70"
          />
          
          {/* Points d'intersection symboliques */}
          <circle cx="70" cy="50" r="6" fill={activeColor.gradientStart} className="animate-pulse" />
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
