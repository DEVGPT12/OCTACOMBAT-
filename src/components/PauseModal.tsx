import React from 'react';
import { Play, RotateCcw, Users, Home, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onSelectCharacter: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onSelectCharacter,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-neutral-900 border-2 border-red-500/80 rounded-xl p-6 text-center shadow-2xl glow-red">
        <h2 className="font-arcade text-5xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-red-300 to-red-500 mb-6 italic">
          PAUSE
        </h2>

        <div className="space-y-3 font-arcade text-2xl tracking-wider">
          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onResume();
            }}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold flex items-center justify-center gap-2 transition-colors border border-red-400"
          >
            <Play className="w-5 h-5 fill-white" /> REPRENDRE LE COMBAT
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onRestart();
            }}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-bold flex items-center justify-center gap-2 transition-colors border border-neutral-700"
          >
            <RotateCcw className="w-5 h-5" /> RECOMMENCER LE MATCH
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onSelectCharacter();
            }}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-bold flex items-center justify-center gap-2 transition-colors border border-neutral-700"
          >
            <Users className="w-5 h-5" /> CHANGER DE COMBATTANT
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onMainMenu();
            }}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-bold flex items-center justify-center gap-2 transition-colors border border-neutral-700"
          >
            <Home className="w-5 h-5" /> MENU PRINCIPAL
          </button>
        </div>

        {/* Quick controls recall */}
        <div className="mt-6 pt-4 border-t border-neutral-800 text-xs font-tech text-neutral-400 flex justify-between">
          <span>Clavier : A / D (Déplacer)</span>
          <span>J / K / L (Coups)</span>
          <span>Espace (Spécial)</span>
        </div>
      </div>
    </div>
  );
};
