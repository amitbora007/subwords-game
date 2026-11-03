import React from 'react';

interface LetterTileProps {
  letter: string;
  count: number;
  remainingCount: number;
  onClick: (letter: string) => void;
  disabled?: boolean;
}

export const LetterTile: React.FC<LetterTileProps> = ({
  letter,
  count,
  remainingCount,
  onClick,
  disabled = false,
}) => {
  const isExhausted = remainingCount <= 0;

  return (
    <button
      type="button"
      onClick={() => !isExhausted && !disabled && onClick(letter)}
      disabled={isExhausted || disabled}
      aria-label={`Letter ${letter.toUpperCase()}, ${remainingCount} remaining`}
      className={`relative flex items-center justify-center font-game font-bold rounded-2xl select-none transition-all duration-150
        w-11 h-13 sm:w-14 sm:h-16 md:w-16 md:h-18 text-xl sm:text-2xl md:text-3xl
        ${
          isExhausted
            ? 'bg-slate-900/60 border border-slate-800 text-slate-600 cursor-not-allowed opacity-40 scale-95'
            : 'tile-press bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700/80 text-emerald-400 hover:border-emerald-500 hover:text-white cursor-pointer active:scale-95'
        }
      `}
    >
      <span className="drop-shadow-sm">{letter.toUpperCase()}</span>

      {/* Multi-letter indicator badge */}
      {count > 1 && (
        <span
          className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.2 min-w-4 text-[10px] font-mono rounded-full font-bold border ${
            isExhausted
              ? 'bg-slate-800 text-slate-500 border-slate-700'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
          }`}
        >
          {remainingCount}
        </span>
      )}
    </button>
  );
};
