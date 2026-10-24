import React from 'react';
import { Pause, Swords, Shield, Zap } from 'lucide-react';
import { CombatEntity, FighterDefinition } from '../types/combat';

interface FightHUDProps {
  p1: CombatEntity;
  p2: CombatEntity;
  p1Def: FighterDefinition;
  p2Def: FighterDefinition;
  timer: number;
  currentRound: number;
  announcement: { main: string; sub?: string } | null;
  onPause: () => void;
  isTraining?: boolean;
}

export const FightHUD: React.FC<FightHUDProps> = ({
  p1,
  p2,
  p1Def,
  p2Def,
  timer,
  currentRound,
  announcement,
  onPause,
  isTraining = false,
}) => {
  const p1HpPercent = Math.max(0, Math.min(100, (p1.hp / p1.maxHp) * 100));
  const p2HpPercent = Math.max(0, Math.min(100, (p2.hp / p2.maxHp) * 100));

  const p1EnergyPercent = Math.max(0, Math.min(100, (p1.energy / p1.maxEnergy) * 100));
  const p2EnergyPercent = Math.max(0, Math.min(100, (p2.energy / p2.maxEnergy) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none z-20">
      {/* Top Bar: Health Bars, Timer, Avatars */}
      <div className="w-full flex items-start justify-between gap-2 md:gap-4 max-w-7xl mx-auto">
        {/* P1 Section (Left) */}
        <div className="flex-1 flex items-center gap-2 md:gap-3">
          {/* P1 Avatar */}
          <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-md bg-neutral-900 border-2 border-red-500 overflow-hidden flex items-center justify-center shadow-lg shadow-red-950/60 shrink-0">
            <span className="font-arcade text-3xl font-bold text-red-500">
              {p1Def.name[0]}
            </span>
            <span className="absolute bottom-0 inset-x-0 bg-red-600 text-[10px] font-tech font-bold text-center text-white">
              P1
            </span>
          </div>

          {/* P1 Bars Container */}
          <div className="flex-1 flex flex-col gap-1">
            {/* Name & Rounds Won */}
            <div className="flex items-center justify-between px-1">
              <span className="font-arcade text-2xl md:text-3xl font-bold tracking-wider italic text-white drop-shadow-md">
                {p1Def.name}
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 1].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full border border-red-400 ${
                      p1.roundsWon > idx ? 'bg-red-500 shadow-sm shadow-red-400' : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Health Bar (Slanted) */}
            <div className="relative w-full h-5 md:h-6 bg-neutral-950/90 rounded border border-neutral-700/80 overflow-hidden clip-slanted shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 transition-all duration-150"
                style={{ width: `${p1HpPercent}%` }}
              />
            </div>

            {/* Super Energy Meter */}
            <div className="flex items-center gap-1.5 px-0.5">
              <span className="font-tech text-[10px] font-bold text-amber-400 flex items-center">
                <Zap className="w-2.5 h-2.5 fill-amber-400" /> SUPER
              </span>
              <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-200"
                  style={{ width: `${p1EnergyPercent}%` }}
                />
              </div>
              <span className="font-tech text-[10px] font-bold text-neutral-300">
                {Math.round(p1EnergyPercent)}%
              </span>
            </div>
          </div>
        </div>

        {/* Center: Timer & Pause Button */}
        <div className="flex flex-col items-center justify-center shrink-0 px-2">
          <div className="relative w-16 h-14 md:w-20 md:h-16 bg-neutral-900/95 border-2 border-blue-500/80 rounded flex items-center justify-center shadow-xl clip-octagon">
            <span className="font-arcade text-4xl md:text-5xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">
              {isTraining ? '∞' : timer}
            </span>
          </div>

          <button
            onClick={onPause}
            className="pointer-events-auto mt-1 p-1 px-3 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 hover:text-white transition-colors"
            title="Pause"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* P2 Section (Right) */}
        <div className="flex-1 flex items-center gap-2 md:gap-3 flex-row-reverse">
          {/* P2 Avatar */}
          <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-md bg-neutral-900 border-2 border-blue-500 overflow-hidden flex items-center justify-center shadow-lg shadow-blue-950/60 shrink-0">
            <span className="font-arcade text-3xl font-bold text-blue-500">
              {p2Def.name[0]}
            </span>
            <span className="absolute bottom-0 inset-x-0 bg-blue-600 text-[10px] font-tech font-bold text-center text-white">
              CPU
            </span>
          </div>

          {/* P2 Bars Container */}
          <div className="flex-1 flex flex-col gap-1">
            {/* Name & Rounds Won */}
            <div className="flex items-center justify-between px-1 flex-row-reverse">
              <span className="font-arcade text-2xl md:text-3xl font-bold tracking-wider italic text-white drop-shadow-md">
                {p2Def.name}
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 1].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full border border-blue-400 ${
                      p2.roundsWon > idx ? 'bg-blue-500 shadow-sm shadow-blue-400' : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Health Bar (Reversed Slant) */}
            <div className="relative w-full h-5 md:h-6 bg-neutral-950/90 rounded border border-neutral-700/80 overflow-hidden clip-slanted-right shadow-inner flex justify-end">
              <div
                className="h-full bg-gradient-to-l from-blue-600 via-cyan-500 to-teal-400 transition-all duration-150"
                style={{ width: `${p2HpPercent}%` }}
              />
            </div>

            {/* Super Energy Meter */}
            <div className="flex items-center gap-1.5 px-0.5 flex-row-reverse">
              <span className="font-tech text-[10px] font-bold text-cyan-400 flex items-center">
                <Zap className="w-2.5 h-2.5 fill-cyan-400" /> SUPER
              </span>
              <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 flex justify-end">
                <div
                  className="h-full bg-gradient-to-l from-cyan-500 to-blue-300 transition-all duration-200"
                  style={{ width: `${p2EnergyPercent}%` }}
                />
              </div>
              <span className="font-tech text-[10px] font-bold text-neutral-300">
                {Math.round(p2EnergyPercent)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Hit Combo Counter (Left side matching reference image) */}
      <div className="absolute top-[22%] left-4 right-4 flex items-start justify-between gap-3 pointer-events-none">
        {p1.comboCount >= 2 && (
          <div className="max-w-[42vw] flex flex-col items-start bg-black/70 p-2 md:p-3 rounded-lg border-l-4 border-amber-500">
            <span className="font-arcade text-2xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow-[0_4px_12px_rgba(245,158,11,0.8)] leading-none italic">
              {p1.comboCount} HITS
            </span>
            <span className="font-arcade text-lg md:text-3xl font-bold tracking-widest text-white italic drop-shadow-md">
              COMBO !
            </span>
            <span className="font-tech text-xs font-bold text-neutral-300">
              +{p1.comboDamage} DÉGÂTS
            </span>
          </div>
        )}

        {p2.comboCount >= 2 && (
          <div className="ml-auto max-w-[42vw] flex flex-col items-end bg-black/70 p-2 md:p-3 rounded-lg border-r-4 border-cyan-500">
            <span className="font-arcade text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-cyan-300 via-blue-400 to-indigo-500 drop-shadow-[0_4px_12px_rgba(6,182,212,0.8)] leading-none italic">
              {p2.comboCount} HITS
            </span>
            <span className="font-arcade text-2xl md:text-3xl font-bold tracking-widest text-white italic drop-shadow-md">
              COMBO !
            </span>
          </div>
        )}
      </div>

      {/* Center Announcer Banner (Fight, Round 1, KO, etc.) */}
      {announcement && announcement.main && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-black/80 px-10 py-5 rounded-lg border-y-2 border-red-500 text-center shadow-2xl backdrop-blur-xs">
            <h1 className="font-arcade text-7xl md:text-9xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-red-200 to-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.9)] italic">
              {announcement.main}
            </h1>
            {announcement.sub && (
              <p className="font-tech text-base md:text-xl font-bold tracking-[0.25em] text-amber-400 uppercase mt-1">
                {announcement.sub}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
