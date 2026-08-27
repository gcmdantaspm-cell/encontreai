import React from 'react';

export function Logo({ className = "", isDark = false, hideText = false, hideSubtitle = false }: { className?: string, isDark?: boolean, hideText?: boolean, hideSubtitle?: boolean }) {
  const primaryColor = isDark ? "#ffffff" : "#002a5d";
  const subtitleColor = isDark ? "#a1a1aa" : "#64748b";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={hideSubtitle ? "32" : "40"} height={hideSubtitle ? "38" : "48"} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <defs>
          <mask id="pin-mask">
            <path d="M50 0 C 22.4 0, 0 22.4, 0 50 C 0 87.5, 50 120, 50 120 C 50 120, 100 87.5, 100 50 C 100 22.4, 77.6 0, 50 0 Z" fill="white" />
            <circle cx="45" cy="45" r="22" fill="black" />
            <circle cx="45" cy="45" r="16" fill="white" />
            <circle cx="43" cy="47" r="18" fill="black" />
            <rect x="58" y="58" width="10" height="30" rx="5" transform="rotate(-45 58 58)" fill="black" />
          </mask>
        </defs>
        <path d="M50 0 C 22.4 0, 0 22.4, 0 50 C 0 87.5, 50 120, 50 120 C 50 120, 100 87.5, 100 50 C 100 22.4, 77.6 0, 50 0 Z" fill={primaryColor} mask="url(#pin-mask)" />
      </svg>
      
      {!hideText && (
        <div className="flex flex-col justify-center">
          <span className={`font-black tracking-tight leading-none ${hideSubtitle ? 'text-xl' : 'text-2xl'}`} style={{ color: primaryColor }}>EncontreAi</span>
          {!hideSubtitle && (
            <span className="text-[10px] font-medium tracking-wide mt-0.5" style={{ color: subtitleColor }}>busca e localização profissional</span>
          )}
        </div>
      )}
    </div>
  );
}
