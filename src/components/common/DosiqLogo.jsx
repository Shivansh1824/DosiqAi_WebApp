import React from 'react';

export const DosiqLogo = ({ size = 'default', showBadge = false, variant = 'dark' }) => {
  const isLarge = size === 'large';
  const isLight = variant === 'light';
  const imgSize = isLarge ? 40 : 32;
  const textSize = isLarge ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <img
        src="/dosiq-logo.jpg"
        alt="dosiq logo"
        width={imgSize}
        height={imgSize}
        className="rounded-xl object-cover shrink-0"
        style={{ width: imgSize, height: imgSize }}
      />
      <div className="flex items-center leading-none">
        <span className={`font-display font-black tracking-tight ${textSize} ${isLight ? 'text-white' : 'text-slate-900'}`}>
          dosiq
        </span>
        <span className={`font-display font-black tracking-tight ${textSize} ml-0.5 ${isLight ? 'text-emerald-300' : 'text-emerald-600'}`}>
          AI
        </span>
        {showBadge && (
          <span className={`ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${isLight ? 'bg-white/10 text-emerald-300 border border-white/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            Beta
          </span>
        )}
      </div>
    </div>
  );
};
