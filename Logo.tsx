
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'amber' | 'blue' | 'rose';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 32, showText = true, variant = 'blue' }) => {
  const colors = {
    dark: { accent: '#111827', text: 'text-gray-900' },
    light: { accent: '#ffffff', text: 'text-white' },
    amber: { accent: '#d97706', text: 'text-amber-900' },
    blue: { accent: '#2563eb', text: 'text-gray-900' },
    rose: { accent: '#e11d48', text: 'text-gray-900' }
  };

  const activeColor = colors[variant];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <circle cx="50" cy="50" r="45" stroke={activeColor.accent} strokeWidth="2" strokeDasharray="6 6" opacity="0.2" />
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
      
      {showText && (
        <span className={`text-xl font-bold tracking-widest uppercase font-serif ${activeColor.text}`}>
          CERCLE
        </span>
      )}
    </div>
  );
};

export default Logo;
