import React from 'react';
import { RotateCcw, Users, Home, Trophy, Skull, Film } from 'lucide-react';
import { FighterDefinition } from '../types/combat';
import { soundEngine } from '../audio/soundEngine';

interface GameOverModalProps {
  isPlayerWinner: boolean;
  winnerDef: FighterDefinition;
  loserDef: FighterDefinition;
  p1RoundsWon: number;
  p2RoundsWon: number;
  onRematch: () => void;
  onWatchReplay: () => void;
  onSelectCharacter: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isPlayerWinner,
  winnerDef,
  loserDef,
  p1RoundsWon,
  p2RoundsWon,
  onRematch,
  onWatchReplay,
  onSelectCharacter,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-neutral-900 border-2 border-red-500 rounded-2xl p-6 text-center shadow-2xl glow-red">
        {/* Victory Icon / Banner */}
        <div className="flex justify-center mb-2">
          {isPlayerWinner ? (
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 animate-bounce">
              <Trophy className="w-9 h-9" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-500">
              <Skull className="w-9 h-9" />
            </div>
          )}
        </div>

        <h1
          className={`font-arcade text-6xl md:text-7xl font-bold tracking-widest italic mb-1 ${
            isPlayerWinner
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500'
              : 'text-red-500'
          }`}
        >
          {isPlayerWinner ? 'VICTOIRE !' : 'DÉFAITE !'}
        </h1>

        <p className="font-tech text-sm tracking-widest text-neutral-400 uppercase mb-4">
          CHAMPION : <span className="font-bold text-white">{winnerDef.name}</span> ({winnerDef.title})
        </p>

        {/* Score Summary Card */}
        <div className="bg-black/60 rounded-lg p-4 border border-neutral-800 mb-6 flex items-center justify-around font-arcade text-3xl">
          <div className="flex flex-col items-center">
            <span className="text-red-400 font-bold">{isPlayerWinner ? winnerDef.name : loserDef.name}</span>
            <span className="text-4xl text-white font-bold">{p1RoundsWon}</span>
            <span className="font-tech text-xs text-neutral-400">ROUNDS</span>
          </div>

          <span className="text-neutral-600 font-tech text-2xl">VS</span>

          <div className="flex flex-col items-center">
            <span className="text-blue-400 font-bold">{isPlayerWinner ? loserDef.name : winnerDef.name}</span>
            <span className="text-4xl text-white font-bold">{p2RoundsWon}</span>
            <span className="font-tech text-xs text-neutral-400">ROUNDS</span>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="space-y-3 font-arcade text-2xl tracking-wider">
          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onWatchReplay();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-red-600 to-red-700 hover:from-amber-500 hover:to-red-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-950/80 border border-amber-400/60 glow-red"
          >
            <Film className="w-6 h-6 text-amber-300" /> VOIR LE REPLAY DU MATCH
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onRematch();
            }}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/60 border border-red-400/40"
          >
            <RotateCcw className="w-5 h-5" /> REVANCHE IMMÉDIATE
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onSelectCharacter();
            }}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors border border-neutral-700"
          >
            <Users className="w-5 h-5" /> CHANGER DE COMBATTANT
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onMainMenu();
            }}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors border border-neutral-700"
          >
            <Home className="w-5 h-5" /> MENU PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};
