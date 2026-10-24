import React, { useRef, useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Flame, 
  ShieldAlert, 
  ArrowUp,
  CircleDot
} from 'lucide-react';

interface TouchControlsProps {
  onMovement: (direction: 'left' | 'right' | 'up' | 'down' | 'none') => void;
  onAction: (action: string) => void;
  opacity?: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMovement,
  onAction,
  opacity = 0.85,
}) => {
  const [activeDir, setActiveDir] = useState<string | null>(null);

  const handleDirStart = (dir: 'left' | 'right' | 'up' | 'down') => {
    setActiveDir(dir);
    onMovement(dir);
  };

  const handleDirEnd = () => {
    setActiveDir(null);
    onMovement('none');
  };

  return (
    <div
      className="absolute inset-x-0 bottom-4 pointer-events-none flex justify-between items-end px-4 md:px-8 select-none z-30 transition-opacity"
      style={{ opacity }}
    >
      {/* Virtual D-Pad / Directional Joystick (Bottom-Left) */}
      <div className="relative pointer-events-auto w-36 h-36 md:w-44 md:h-44 rounded-full bg-black/60 border-2 border-neutral-700/80 backdrop-blur-xs flex items-center justify-center p-2 shadow-2xl">
        {/* Center circle */}
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-neutral-800/80 border border-neutral-600 flex items-center justify-center pointer-events-none">
          <CircleDot className="w-6 h-6 text-neutral-400" />
        </div>

        {/* Up / Jump */}
        <button
          onPointerDown={() => handleDirStart('up')}
          onPointerUp={handleDirEnd}
          onPointerLeave={handleDirEnd}
          className={`absolute top-1 inset-x-1/3 h-10 flex items-center justify-center rounded-t-xl transition-all ${
            activeDir === 'up' ? 'bg-red-600 text-white scale-110' : 'bg-neutral-800/60 text-neutral-300'
          }`}
          title="Sauter"
        >
          <ChevronUp className="w-7 h-7" />
        </button>

        {/* Down / Crouch & Block */}
        <button
          onPointerDown={() => handleDirStart('down')}
          onPointerUp={handleDirEnd}
          onPointerLeave={handleDirEnd}
          className={`absolute bottom-1 inset-x-1/3 h-10 flex items-center justify-center rounded-b-xl transition-all ${
            activeDir === 'down' ? 'bg-red-600 text-white scale-110' : 'bg-neutral-800/60 text-neutral-300'
          }`}
          title="Garde / Baisser"
        >
          <ChevronDown className="w-7 h-7" />
        </button>

        {/* Left */}
        <button
          onPointerDown={() => handleDirStart('left')}
          onPointerUp={handleDirEnd}
          onPointerLeave={handleDirEnd}
          className={`absolute left-1 inset-y-1/3 w-10 flex items-center justify-center rounded-l-xl transition-all ${
            activeDir === 'left' ? 'bg-red-600 text-white scale-110' : 'bg-neutral-800/60 text-neutral-300'
          }`}
          title="Gauche"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        {/* Right */}
        <button
          onPointerDown={() => handleDirStart('right')}
          onPointerUp={handleDirEnd}
          onPointerLeave={handleDirEnd}
          className={`absolute right-1 inset-y-1/3 w-10 flex items-center justify-center rounded-r-xl transition-all ${
            activeDir === 'right' ? 'bg-red-600 text-white scale-110' : 'bg-neutral-800/60 text-neutral-300'
          }`}
          title="Droite"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Combat Action Buttons Cluster (Bottom-Right matching screenshot layout) */}
      <div className="relative pointer-events-auto w-48 h-48 md:w-56 md:h-56">
        {/* Special Move (Super attack) - Center Top Accent */}
        <button
          onClick={() => onAction('attack_special')}
          className="absolute top-0 right-16 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-amber-600 to-red-600 active:scale-90 border-2 border-amber-300/80 shadow-lg shadow-amber-950 flex flex-col items-center justify-center transition-all glow-red"
          title="Attaque Spéciale (Super)"
        >
          <Flame className="w-6 h-6 text-white animate-pulse" />
          <span className="font-arcade text-[10px] font-bold text-amber-200">SUPER</span>
        </button>

        {/* Light Punch (Top-right) */}
        <button
          onClick={() => onAction('attack_light')}
          className="absolute top-6 right-0 w-13 h-13 md:w-15 md:h-15 rounded-full bg-neutral-900/90 active:scale-90 border-2 border-neutral-600 hover:border-red-500 shadow-md flex flex-col items-center justify-center transition-all"
          title="Coup Rapide (J)"
        >
          <Zap className="w-5 h-5 text-red-400" />
          <span className="font-arcade text-[10px] font-bold text-neutral-200">JAB</span>
        </button>

        {/* Heavy Punch (Mid-right) */}
        <button
          onClick={() => onAction('attack_heavy')}
          className="absolute top-22 right-0 w-14 h-14 md:w-16 md:h-16 rounded-full bg-neutral-900/90 active:scale-90 border-2 border-red-500 hover:border-red-400 shadow-md flex flex-col items-center justify-center transition-all glow-red"
          title="Coup Puissant (K)"
        >
          <span className="font-arcade text-xl font-bold text-red-400">POING</span>
          <span className="font-tech text-[9px] text-neutral-400">LOURD</span>
        </button>

        {/* Kick (Bottom-center) */}
        <button
          onClick={() => onAction('attack_kick')}
          className="absolute bottom-0 right-16 w-13 h-13 md:w-15 md:h-15 rounded-full bg-neutral-900/90 active:scale-90 border-2 border-blue-500 hover:border-blue-400 shadow-md flex flex-col items-center justify-center transition-all glow-blue"
          title="Coup de Pied (L)"
        >
          <span className="font-arcade text-lg font-bold text-blue-400">PIED</span>
        </button>

        {/* Jump / Air Attack (Mid-left) */}
        <button
          onClick={() => onAction('attack_air')}
          className="absolute top-20 right-30 w-12 h-12 md:w-14 md:h-14 rounded-full bg-neutral-900/90 active:scale-90 border-2 border-cyan-500 hover:border-cyan-400 shadow-md flex flex-col items-center justify-center transition-all"
          title="Saut / Aérien"
        >
          <ArrowUp className="w-5 h-5 text-cyan-400" />
          <span className="font-arcade text-[10px] font-bold text-cyan-200">AIR</span>
        </button>
      </div>
    </div>
  );
};
