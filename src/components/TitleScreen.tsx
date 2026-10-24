import React, { useEffect } from 'react';
import { Play, Users, BookOpen, Dumbbell, Settings, Award, Shield, Film, Zap, Swords, Trophy } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { FIGHTERS } from '../game/constants';

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
  onPlay, onSelectFighter, onStoryMode, onTraining, onSettings, onCredits,
  onWatchReplay, hasSavedReplay = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Enter' || e.code === 'Space') && !(e.target instanceof HTMLButtonElement)) {
        soundEngine.playRoundAnnounce('select');
        onPlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlay]);

  const fighters = Object.values(FIGHTERS);
  const action = (callback: () => void) => {
    soundEngine.playRoundAnnounce('select');
    callback();
  };

  return (
    <main className="octa-home relative w-full h-full min-h-0 overflow-x-hidden overflow-y-auto bg-[#05070d] text-white select-none">
      <section className="octa-hero relative flex min-h-[390px] sm:min-h-[450px] lg:min-h-[470px] items-center justify-center overflow-hidden border-b border-white/10">
        <img
          src="/assets/aistudio/file_000000002cac820e8761eab09801e033_9ec31925.png"
          alt=""
          aria-hidden="true"
          className="octa-hero-art absolute inset-x-0 top-0 w-full h-auto min-h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040b]/20 via-[#03050b]/15 to-[#05070d]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_0%,rgba(1,3,8,.28)_48%,rgba(1,3,8,.9)_100%)]" />
        <div className="relative z-10 flex w-full flex-col items-center px-4 pb-5 pt-8 text-center">
          <div className="mb-2 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] sm:text-xs font-bold tracking-[.22em] text-slate-200 backdrop-blur">
            <Shield className="h-3.5 w-3.5 text-red-400" /> ARCADE 3D COMBAT ENGINE <span className="text-red-400">/</span> V1.1.0
          </div>
          <div className="relative my-1 flex items-center justify-center">
            <div className="absolute h-28 w-28 sm:h-40 sm:w-40 rotate-45 border-[5px] border-red-600/90 shadow-[0_0_35px_rgba(239,38,53,.65)]" />
            <h1 className="relative z-10 font-arcade text-[clamp(3rem,10vw,8.5rem)] font-black leading-none tracking-tight drop-shadow-[0_8px_22px_rgba(0,0,0,.95)]">
              <span className="text-white">OCTA</span><span className="text-red-500">COMBAT</span>
            </h1>
          </div>
          <p className="mt-4 text-[10px] sm:text-sm font-black tracking-[.25em] sm:tracking-[.48em] text-white drop-shadow-lg">
            8 COMBATTANTS <span className="mx-1 text-red-500">•</span> 1 SEUL CHAMPION
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => action(onPlay)} className="octa-primary-button inline-flex items-center gap-2 rounded-sm border border-red-300/70 bg-gradient-to-r from-red-600 to-red-800 px-6 py-3 font-arcade text-xl font-bold tracking-wider shadow-[0_0_25px_rgba(220,38,38,.32)] transition hover:brightness-125 active:scale-95">
              <Play className="h-5 w-5 fill-current" /> JOUER
            </button>
            {hasSavedReplay && onWatchReplay && (
              <button onClick={() => action(onWatchReplay)} className="inline-flex items-center gap-2 border border-red-400/50 bg-black/65 px-4 py-3 text-xs font-bold tracking-wider text-red-200 hover:bg-red-950">
                <Film className="h-4 w-4" /> REPLAY
              </button>
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
      </section>

      <section className="relative z-10 mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-5 lg:grid-cols-2">
        <article className="octa-panel relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-xl border border-slate-500/60 bg-[#080c15] p-4 sm:min-h-[350px] sm:p-6">
          <div className="absolute inset-0 opacity-35" style={{ background: 'radial-gradient(circle at 50% 75%, #f43f5e 0%, transparent 28%), radial-gradient(circle at 82% 40%, #2563eb 0%, transparent 30%), linear-gradient(135deg, #172554, #030712 70%)' }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,15,.18),rgba(2,6,15,.9))]" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black tracking-[.3em] text-red-300">MODE COMBAT</p>
              <h2 className="mt-1 font-arcade text-3xl font-bold sm:text-4xl">ENTRE DANS L’ARÈNE</h2>
              <p className="max-w-md text-sm text-slate-300">Des combos rapides, des coups spéciaux et une victoire à arracher.</p>
            </div>
            <div className="hidden rounded-lg border border-blue-400/40 bg-blue-950/60 p-3 sm:block"><Swords className="h-7 w-7 text-blue-300" /></div>
          </div>
          <div className="relative my-5 flex min-h-[125px] items-end justify-center gap-8 overflow-hidden rounded-lg border border-white/10 bg-black/25 px-4 pt-5">
            <div className="absolute inset-x-0 bottom-0 h-10 border-t border-blue-300/20 bg-gradient-to-t from-slate-800/70 to-transparent" />
            <div className="absolute bottom-10 h-24 w-24 rounded-full bg-red-500/10 blur-2xl" />
            <FighterSilhouette color="#ef4444" accent="#fb7185" side="left" />
            <div className="z-10 mb-8 flex flex-col items-center">
              <span className="font-arcade text-4xl font-black italic text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,.65)]">VS</span>
              <span className="mt-1 text-[9px] font-bold tracking-[.3em] text-slate-400">ROUND 01</span>
            </div>
            <FighterSilhouette color="#2563eb" accent="#7dd3fc" side="right" />
            <div className="absolute left-3 top-3 w-[38%]">
              <div className="mb-1 flex justify-between text-[9px] font-black tracking-wider"><span>OCTAV</span><span>100%</span></div>
              <div className="h-2 border border-white/20 bg-slate-900"><div className="h-full w-full bg-gradient-to-r from-red-600 to-orange-400" /></div>
            </div>
            <div className="absolute right-3 top-3 w-[38%] text-right">
              <div className="mb-1 flex justify-between text-[9px] font-black tracking-wider"><span>ZEN</span><span>100%</span></div>
              <div className="h-2 border border-white/20 bg-slate-900"><div className="ml-auto h-full w-full bg-gradient-to-r from-cyan-400 to-blue-600" /></div>
            </div>
          </div>
          <div className="relative flex flex-wrap gap-2">
            <button onClick={() => action(onPlay)} className="flex flex-1 items-center justify-center gap-2 rounded bg-red-600 px-4 py-3 font-arcade text-xl font-bold hover:bg-red-500"><Play className="h-4 w-4 fill-current" /> COMBATTRE</button>
            <button onClick={() => action(onTraining)} className="flex items-center justify-center gap-2 rounded border border-slate-600 bg-slate-900/90 px-4 py-3 font-arcade text-lg font-bold hover:border-blue-400"><Dumbbell className="h-4 w-4 text-blue-300" /> ENTRAÎNEMENT</button>
          </div>
        </article>

        <article className="octa-panel relative overflow-hidden rounded-xl border border-slate-500/60 bg-[#05080f] p-4 sm:p-6">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_80%_45%,rgba(220,38,38,.18),transparent_70%)]" />
          <div className="relative mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-black tracking-[.3em] text-slate-400">ROSTER OFFICIEL</p>
              <h2 className="font-arcade text-3xl font-bold italic sm:text-4xl">CHOISIS TON COMBATTANT</h2>
            </div>
            <span className="shrink-0 rounded border border-red-500/50 bg-red-950/60 px-2 py-1 text-[10px] font-black text-red-300">08 FIGHTERS</span>
          </div>
          <div className="relative grid grid-cols-4 gap-2 sm:gap-3">
            {fighters.map((fighter, index) => (
              <button key={fighter.id} onClick={() => action(onSelectFighter)} className="group relative flex min-w-0 flex-col overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-left transition duration-200 hover:-translate-y-1 hover:border-red-400 hover:shadow-[0_0_18px_rgba(239,68,68,.25)]">
                <div className="relative flex aspect-[4/5] w-full items-end justify-center overflow-hidden" style={{ background: `radial-gradient(circle at 50% 30%, ${fighter.primaryColor}77, transparent 42%), linear-gradient(150deg, ${fighter.secondaryColor}, #03050a 80%)` }}>
                  <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 8px, rgba(255,255,255,.08) 9px 10px)' }} />
                  <FighterSilhouette color={fighter.primaryColor} accent={fighter.accentColor} side={index % 2 === 0 ? 'left' : 'right'} compact />
                  <span className="absolute left-1 top-1 rounded-sm border border-white/15 bg-black/65 px-1 text-[8px] font-black text-white">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <span className="w-full truncate bg-black/80 px-1 py-1.5 text-center font-arcade text-sm font-bold tracking-wide sm:text-base" style={{ color: fighter.primaryColor }}>{fighter.name}</span>
              </button>
            ))}
          </div>
          <div className="relative mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <button onClick={() => action(onSelectFighter)} className="flex flex-1 items-center justify-center gap-2 rounded border border-red-500/60 bg-red-950/60 px-3 py-2.5 font-arcade text-lg font-bold text-red-100 hover:bg-red-900"><Users className="h-4 w-4" /> SÉLECTIONNER</button>
            <button onClick={() => action(onStoryMode)} className="flex items-center justify-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 py-2.5 font-arcade text-lg font-bold hover:border-amber-400"><Trophy className="h-4 w-4 text-amber-300" /> HISTOIRE</button>
          </div>
        </article>
      </section>

      <nav className="mx-auto mb-5 flex w-full max-w-[1500px] flex-wrap justify-center gap-2 px-3">
        <button onClick={() => action(onSettings)} className="octa-secondary-action"><Settings className="h-4 w-4" /> PARAMÈTRES</button>
        <button onClick={() => action(onCredits)} className="octa-secondary-action"><Award className="h-4 w-4" /> CRÉDITS</button>
        <span className="inline-flex items-center gap-2 px-3 py-2 text-[10px] font-bold tracking-[.2em] text-slate-500"><Zap className="h-3.5 w-3.5 text-red-400" /> 3D • COMBOS • SPÉCIAUX</span>
      </nav>
    </main>
  );
};

const FighterSilhouette: React.FC<{ color: string; accent: string; side: 'left' | 'right'; compact?: boolean }> = ({ color, accent, side, compact = false }) => (
  <div className={`relative ${compact ? 'h-[78%] w-[75%]' : 'h-28 w-24 sm:h-36 sm:w-32'} ${side === 'right' ? '-scale-x-100' : ''}`} aria-hidden="true">
    <div className="absolute bottom-0 left-[22%] h-[52%] w-[58%] rounded-t-[42%] border border-white/10" style={{ background: `linear-gradient(115deg, ${color}, #090b12 72%)`, boxShadow: `0 0 24px ${color}35` }} />
    <div className="absolute bottom-[42%] left-[32%] h-[35%] w-[37%] rounded-[45%_45%_38%_38%] border border-white/15" style={{ background: `linear-gradient(135deg, #f4c6a2 0%, #9a604d 65%, #33211f 100%)` }}>
      <div className="absolute -left-[12%] -top-[15%] h-[40%] w-[124%] rounded-t-[65%] rounded-b-[22%]" style={{ background: color }} />
      <div className="absolute right-[12%] top-[43%] h-[5%] w-[20%] rounded-full bg-slate-950" />
    </div>
    <div className="absolute bottom-[28%] left-[3%] h-[15%] w-[42%] rotate-[-25deg] rounded-full border border-white/10" style={{ background: color }} />
    <div className="absolute bottom-[27%] right-[1%] h-[14%] w-[42%] rotate-[25deg] rounded-full border border-white/10" style={{ background: color }} />
    <div className="absolute bottom-[31%] right-0 h-[14%] w-[25%] rotate-[15deg] rounded-full border border-white/20" style={{ background: accent, boxShadow: `0 0 12px ${accent}70` }} />
    <div className="absolute bottom-0 left-[24%] h-[10%] w-[54%] rounded-t-full bg-black/80 blur-sm" />
  </div>
);
