import React from 'react';
import { Clock } from 'lucide-react';

interface TimerRingProps {
  timeLeft: number;
  totalTime: number;
}

export const TimerRing: React.FC<TimerRingProps> = ({ timeLeft, totalTime }) => {
  const radius = 32;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / Math.max(1, totalTime)) * circumference;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isCritical = timeLeft < 15;
  const isWarning = timeLeft >= 15 && timeLeft < 30;

  const colorClass = isCritical
    ? 'text-rose-500 stroke-rose-500'
    : isWarning
    ? 'text-amber-400 stroke-amber-400'
    : 'text-emerald-400 stroke-emerald-400';

  return (
    <div className={`relative flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl glass-panel border shrink-0 ${
      isCritical ? 'border-rose-500/50 bg-rose-500/10 animate-pulse' : 'border-slate-800'
    }`}>
      {/* Circular SVG Ring */}
      <div className="relative w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 64 64" className="w-full h-full transform -rotate-90">
          <circle
            stroke="#1e293b"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className={`transition-all duration-1000 ease-linear ${colorClass}`}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass}`} />
        </div>
      </div>

      {/* Numerical display */}
      <div>
        <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-slate-400">Time Left</div>
        <div className={`font-game text-lg sm:text-2xl font-bold tracking-wider leading-none tabular-nums ${colorClass}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};
