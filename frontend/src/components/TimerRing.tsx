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
    <div className={`relative flex items-center gap-3 px-4 py-2 rounded-2xl glass-panel border ${
      isCritical ? 'border-rose-500/50 bg-rose-500/10 animate-pulse' : 'border-slate-800'
    }`}>
      {/* Circular SVG Ring */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
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
        <Clock className={`w-5 h-5 absolute ${colorClass}`} />
      </div>

      {/* Numerical display */}
      <div>
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Time Left</div>
        <div className={`font-game text-2xl font-bold tracking-wider leading-none ${colorClass}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};
