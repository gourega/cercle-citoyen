
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'amber' | 'blue' | 'rose';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 40, showText = true, variant = 'blue' }) => {
  const colors = {
    dark: { primary: '#111827', secondary: '#1e293b', text: 'text-gray-900', accent: '#2563eb' },
    light: { primary: '#ffffff', secondary: '#ffffff', text: 'text-white', accent: '#ffffff' },
    amber: { primary: '#d97706', secondary: '#92400e', text: 'text-amber-900', accent: '#d97706' },
    blue: { primary: '#111827', secondary: '#2563eb', text: 'text-gray-900', accent: '#2563eb' },
    rose: { primary: '#111827', secondary: '#e11d48', text: 'text-gray-900', accent: '#e11d48' }
  };

  const activeColor = colors[variant];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* Cercle de fond subtil */}
        <circle cx="50" cy="50" r="48" stroke={activeColor.accent} strokeWidth="0.5" strokeDasharray="4 4" opacity="0.2" />
        
        {/* Arc 'Penser' */}
        <path 
          d="M50 15C30.67 15 15 30.67 15 50" 
          stroke={activeColor.accent} 
          strokeWidth="8" 
          strokeLinecap="round"
          className="animate-[spin_8s_linear_infinite]"
          style={{ transformOrigin: '50px 50px' }}
        />
        
        {/* Arc 'Relier' */}
        <path 
          d="M85 50C85 30.67 69.33 15 50 15" 
          stroke={activeColor.accent} 
          strokeWidth="8" 
          strokeLinecap="round"
          opacity="0.6"
          className="animate-[spin_12s_linear_infinite_reverse]"
          style={{ transformOrigin: '50px 50px' }}
        />
        
        {/* Arc 'Agir' */}
        <path 
          d="M50 85C69.33 85 85 69.33 85 50" 
          stroke={activeColor.accent} 
          strokeWidth="10" 
          strokeLinecap="round"
        />

        {/* Noyau central */}
        <circle cx="50" cy="50" r="12" fill={activeColor.accent} />
        <circle cx="50" cy="50" r="6" fill="white" opacity="0.8" />
      </svg>
      
      {showText && (
        <div className="flex flex-col leading-none text-left">
          <span className={`text-2xl font-black tracking-tighter uppercase ${activeColor.text} flex gap-1.5`}>
            CERCLE <span className={variant === 'rose' ? 'text-rose-600' : 'text-blue-600'}>CITOYEN</span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.5em] opacity-30 mt-1">
            PENSER • RELIER • AGIR
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
