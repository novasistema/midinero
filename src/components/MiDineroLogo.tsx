import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'auto' | 'light' | 'dark';
}

export const MiDineroLogo: React.FC<LogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  variant = 'auto',
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-lg', gap: 'gap-2' },
    md: { icon: 38, text: 'text-2xl', gap: 'gap-2.5' },
    lg: { icon: 52, text: 'text-3xl', gap: 'gap-3' },
    xl: { icon: 72, text: 'text-4xl', gap: 'gap-4' },
  };

  const currentSize = sizeMap[size];

  // Colors adapted for dark/light modes
  const dineroColorClass =
    variant === 'light'
      ? 'text-slate-900'
      : variant === 'dark'
      ? 'text-white'
      : 'text-slate-900 dark:text-white';

  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform hover:scale-105"
      >
        <defs>
          <linearGradient id="mTealGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="mNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Outer M ribbon - Left loop to middle drop */}
        <path
          d="M 18 68 C 18 68 34 38 48 38 C 58 38 45 68 45 68 L 56 68 C 56 68 64 48 72 32 C 76 24 82 15 82 15 L 68 22 L 86 12 L 82 32 L 75 24 C 64 42 54 58 48 68 C 42 58 35 48 26 48 C 22 48 18 68 18 68 Z"
          fill="url(#mTealGrad)"
          filter="url(#shadow)"
        />

        {/* Overlapping Navy/Dark teal fold creating the 3D 'M' depth */}
        <path
          d="M 38 68 L 58 38 C 52 46 48 54 44 68 Z"
          fill="url(#mNavyGrad)"
          opacity="0.8"
        />

        {/* Clean precise M logo vector reproduction matching prompt image */}
        <path
          d="M 18 68 C 22 42 38 34 48 38 C 58 42 46 68 46 68 L 60 48 L 78 18 L 86 12 L 82 30 L 76 22 L 62 42 C 54 54 48 68 48 68 C 42 58 35 48 26 48 C 20 48 18 68 18 68 Z"
          fill="url(#mTealGrad)"
        />

        {/* Arrowhead highlight */}
        <polygon points="86,12 66,22 75,26" fill="#14b8a6" />
        <polygon points="86,12 82,30 75,26" fill="#0d9488" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none select-none">
          <div className={`font-black tracking-tight ${currentSize.text} flex items-center`}>
            <span className="text-teal-600 dark:text-teal-400">Mi</span>
            <span className={dineroColorClass}>Dinero</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">
            Finanzas Personales
          </span>
        </div>
      )}
    </div>
  );
};
