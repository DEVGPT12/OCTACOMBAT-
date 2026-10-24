import React, { useState } from 'react';
import { RotateCcw, Shield, Swords, Info, X, Zap } from 'lucide-react';
import { FighterDefinition } from '../types/combat';

interface TrainingOverlayProps {
  fighterDef: FighterDefinition;
  onResetPositions: () => void;
  onToggleDummyBehavior: (behavior: 'stand' | 'guard' | 'attack' | 'jump') => void;
  onExitTraining: () => void;
}

export const TrainingOverlay: React.FC<TrainingOverlayProps> = ({
  fighterDef,
  onResetPositions,
  onToggleDummyBehavior,
  onExitTraining,
}) => {
  const [dummyMode, setDummyMode] = useState<'stand' | 'guard' | 'attack' | 'jump'>('stand');
  const [showMoveList, setShowMoveList] = useState(false);

  const handleModeChange = (mode: 'stand' | 'guard' | 'attack' | 'jump') => {
    setDummyMode(mode);
    onToggleDummyBehavior(mode);
  };

  return (
    <>
      {/* Floating Training Controls Dock (Bottom-Center, Non-obstructive) */}
      <div className="absolute top-20 left-4 z-30 pointer-events-auto bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-3 shadow-xl backdrop-blur-xs flex flex-col gap-2 max-w-xs text-xs font-tech">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
          <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase">
            <Swords className="w-3.5 h-3.5" /> ENTRAÎNEMENT LIBRE
          </span>
          <button
            onClick={onExitTraining}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
            title="Quitter l'entraînement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dummy Behavior */}
        <div>
          <span className="text-[10px] text-neutral-400 block mb-1 uppercase font-semibold">
            COMPORTEMENT DU MANNEQUIN
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'stand', label: 'Immobile' },
              { id: 'guard', label: 'Garde Haute' },
              { id: 'attack', label: 'Riposte' },
              { id: 'jump', label: 'Saut en boucle' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleModeChange(btn.id as any)}
                className={`py-1 px-2 rounded font-semibold transition-colors border ${
                  dummyMode === btn.id
                    ? 'bg-amber-600 text-white border-amber-400'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onResetPositions}
            className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 flex items-center justify-center gap-1.5 text-neutral-200"
          >
            <RotateCcw className="w-3 h-3" /> REPLACER
          </button>

          <button
            onClick={() => setShowMoveList(!showMoveList)}
            className="py-1.5 px-3 bg-red-600/40 hover:bg-red-600/60 rounded border border-red-500/60 flex items-center justify-center gap-1 text-red-300 font-bold"
          >
            <Info className="w-3 h-3" /> LISTE DES COUPS
          </button>
        </div>
      </div>

      {/* Move list modal */}
      {showMoveList && (
        <div className="absolute top-20 left-80 z-40 bg-neutral-900 border border-neutral-700 rounded-xl p-4 shadow-2xl w-80 text-xs font-tech">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2 mb-2">
            <h4 className="font-arcade text-xl font-bold text-red-400">
              COUPS DE {fighterDef.name}
            </h4>
            <button
              onClick={() => setShowMoveList(false)}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="p-2 bg-black/50 rounded border border-neutral-800">
              <span className="font-bold text-white block">J : {fighterDef.moves.lightPunch.nameFr}</span>
              <span className="text-neutral-400 text-[11px]">{fighterDef.moves.lightPunch.description}</span>
            </div>

            <div className="p-2 bg-black/50 rounded border border-neutral-800">
              <span className="font-bold text-white block">K : {fighterDef.moves.heavyPunch.nameFr}</span>
              <span className="text-neutral-400 text-[11px]">{fighterDef.moves.heavyPunch.description}</span>
            </div>

            <div className="p-2 bg-black/50 rounded border border-neutral-800">
              <span className="font-bold text-white block">L : {fighterDef.moves.kick.nameFr}</span>
              <span className="text-neutral-400 text-[11px]">{fighterDef.moves.kick.description}</span>
            </div>

            <div className="p-2 bg-black/50 rounded border border-neutral-800">
              <span className="font-bold text-white block">W + L : {fighterDef.moves.airKick.nameFr}</span>
              <span className="text-neutral-400 text-[11px]">{fighterDef.moves.airKick.description}</span>
            </div>

            <div className="p-2 bg-amber-950/40 rounded border border-amber-600/60">
              <span className="font-bold text-amber-300 block flex items-center gap-1">
                <Zap className="w-3 h-3" /> ESPACE : {fighterDef.moves.specialMove.nameFr}
              </span>
              <span className="text-amber-200/80 text-[11px]">{fighterDef.moves.specialMove.description}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
