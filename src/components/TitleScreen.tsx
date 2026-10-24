import React, { useEffect } from 'react';
import { Play, Users, BookOpen, Dumbbell, Settings, Award, Volume2, Shield, Film } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface TitleScreenProps {
  onPlay: () => void;
  onSelectFighter: () => void;
  onStoryMode: () => void;
  onTraining: () => void;
  onSettings: () => void;
  onCredits: () => void;
  onWatchReplay?: () => void;
  hasSavedReplay?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onPlay,
  onSelectFighter,
  onStoryMode,
  onTraining,
  onSettings,
  onCredits,
  onWatchReplay,
  hasSavedReplay = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        soundEngine.playRoundAnnounce('select');
        onPlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlay]);

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col justify-between overflow-x-hidden overflow-y-auto bg-neutral-950 text-white select-none">
      {/* Background Graphic from Reference Artwork */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/aistudio/file_000000002cac820e8761eab09801e033_9ec31925.png"
          alt="OCTACOMBAT"
          className="w-full h-full object-cover object-top filter brightness-60 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/85" />
      </div>

      {/* Top Bar / Brand Tag */}
      <div className="relative z-10 w-full px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-red-500 clip-octagon flex items-center justify-center bg-red-600/30">
            <span className="font-arcade text-xl font-bold text-red-400">8</span>
          </div>
          <span className="font-tech text-sm tracking-widest text-neutral-300 font-semibold uppercase">
            ARCADE 3D COMBAT ENGINE
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-tech text-neutral-400">
          {hasSavedReplay && onWatchReplay && (
            <button
              onClick={() => {
                soundEngine.playRoundAnnounce('select');
                onWatchReplay();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/80 rounded font-bold text-red-300 hover:text-white transition-all glow-red"
            >
              <Film className="w-3.5 h-3.5 text-red-400" /> DERNIER REPLAY
            </button>
          )}
          <span className="flex items-center gap-1.5 px-3 py-1 bg-black/60 rounded border border-neutral-800">
            <Shield className="w-3.5 h-3.5 text-red-500" /> V1.1.0
          </span>
        </div>
      </div>

      {/* Center Hero Lockup (OCTACOMBAT with Octagon Emblem) */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-3 py-5 sm:px-4 sm:-mt-6">
        {/* Glowing Red Octagon Frame */}
        <div className="title-hero-emblem relative flex items-center justify-center mb-1">
          <div className="w-28 h-28 md:w-36 md:h-36 border-4 border-red-500 clip-octagon flex items-center justify-center bg-black/40 backdrop-blur-xs glow-red">
            <div className="w-20 h-20 md:w-28 md:h-28 border-2 border-red-400/60 clip-octagon flex items-center justify-center">
              <span className="font-arcade text-5xl md:text-7xl font-bold text-red-500 tracking-wider">
                8
              </span>
            </div>
          </div>
        </div>

        {/* Bespoke OCTACOMBAT Typography Title */}
        <h1 className="font-arcade text-5xl sm:text-7xl md:text-9xl font-bold tracking-wide sm:tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-100 to-red-500 drop-shadow-[0_10px_25px_rgba(239,68,68,0.7)] text-stroke-sm">
          OCTACOMBAT
        </h1>

        {/* Slogan */}
        <div className="flex items-center gap-3 mt-1">
          <div className="w-8 md:w-16 h-0.5 bg-gradient-to-r from-transparent to-red-500" />
          <p className="font-tech text-xs sm:text-base md:text-xl font-bold tracking-[0.12em] sm:tracking-[0.35em] text-red-400 uppercase drop-shadow-md">
            8 COMBATTANTS • 1 SEUL CHAMPION
          </p>
          <div className="w-8 md:w-16 h-0.5 bg-gradient-to-l from-transparent to-red-500" />
        </div>
      </div>

      {/* Main Arcade Menu Navigation */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 sm:pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onPlay();
            }}
            className="group relative flex items-center justify-center gap-3 py-3.5 px-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 transition-all rounded clip-slanted shadow-lg shadow-red-950/60 border border-red-400/40"
          >
            <Play className="w-5 h-5 text-white fill-white group-hover:scale-110 transition-transform" />
            <span className="font-arcade text-2xl font-bold tracking-wider text-white">
              JOUER
            </span>
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onSelectFighter();
            }}
            className="group relative flex items-center justify-center gap-3 py-3.5 px-5 bg-neutral-900/90 hover:bg-neutral-800/90 active:scale-95 transition-all rounded clip-slanted border border-neutral-700/80 hover:border-red-500/50"
          >
            <Users className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="font-arcade text-2xl font-bold tracking-wider text-neutral-100">
              COMBATTANTS
            </span>
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onStoryMode();
            }}
            className="group relative flex items-center justify-center gap-3 py-3.5 px-5 bg-neutral-900/90 hover:bg-neutral-800/90 active:scale-95 transition-all rounded clip-slanted border border-neutral-700/80 hover:border-amber-500/50"
          >
            <BookOpen className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-arcade text-2xl font-bold tracking-wider text-neutral-100">
              MODE HISTOIRE
            </span>
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onTraining();
            }}
            className="group relative flex items-center justify-center gap-3 py-3.5 px-5 bg-neutral-900/90 hover:bg-neutral-800/90 active:scale-95 transition-all rounded clip-slanted border border-neutral-700/80 hover:border-blue-500/50"
          >
            <Dumbbell className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="font-arcade text-2xl font-bold tracking-wider text-neutral-100">
              ENTRAÎNEMENT
            </span>
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onSettings();
            }}
            className="group relative flex items-center justify-center gap-3 py-3.5 px-5 bg-neutral-900/90 hover:bg-neutral-800/90 active:scale-95 transition-all rounded clip-slanted border border-neutral-700/80 hover:border-cyan-500/50"
          >
            <Settings className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-arcade text-2xl font-bold tracking-wider text-neutral-100">
              PARAMÈTRES
            </span>
          </button>

          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onCredits();
            }}
            className="group relative flex items-center justify-center gap-3 py-3.5 px-5 bg-neutral-900/90 hover:bg-neutral-800/90 active:scale-95 transition-all rounded clip-slanted border border-neutral-700/80 hover:border-purple-500/50"
          >
            <Award className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="font-arcade text-2xl font-bold tracking-wider text-neutral-100">
              CRÉDITS
            </span>
          </button>
        </div>

        {/* Arcade Instructions Footer Hint */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2 px-3 bg-black/70 rounded-xl border border-neutral-800 text-[10px] sm:text-xs font-tech text-neutral-300">
          <span className="text-red-400 font-bold">CONTRÔLES :</span>
          <span>A / D (Déplacer)</span>
          <span>•</span>
          <span>W (Sauter)</span>
          <span>•</span>
          <span>S (Garde / Bloquer)</span>
          <span>•</span>
          <span>J (Poing Rapide)</span>
          <span>•</span>
          <span>K (Poing Lourd)</span>
          <span>•</span>
          <span>L (Pied)</span>
          <span>•</span>
          <span className="text-amber-400 font-bold">ESPACE (Attaque Spéciale)</span>
        </div>
      </div>
    </div>
  );
};
