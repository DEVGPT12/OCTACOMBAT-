import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft, 
  Film, 
  Eye, 
  EyeOff, 
  Zap, 
  Shield 
} from 'lucide-react';
import { 
  MatchReplayData, 
  ReplayFrame, 
  ReplayInputEvent 
} from '../types/combat';
import { FIGHTERS } from '../game/constants';
import { ReplayEngine } from '../game/graphics/ReplayEngine';
import { soundEngine } from '../audio/soundEngine';

interface ReplayViewerProps {
  replayData: MatchReplayData;
  onExit: () => void;
}

export const ReplayViewer: React.FC<ReplayViewerProps> = ({
  replayData,
  onExit,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ReplayEngine | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [currentFrame, setCurrentFrame] = useState<ReplayFrame | null>(replayData.frames[0] || null);
  const [recentInputs, setRecentInputs] = useState<ReplayInputEvent[]>([]);
  const [showInputLog, setShowInputLog] = useState<boolean>(true);

  const p1Def = FIGHTERS[replayData.p1Id];
  const p2Def = FIGHTERS[replayData.p2Id];

  // Initialize ReplayEngine
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new ReplayEngine(canvasMountRef.current, replayData, {
      onFrameUpdate: (frame, idx, total, progress, inputs) => {
        setCurrentFrame(frame);
        setCurrentProgress(progress);
        setRecentInputs(inputs);
      },
      onReplayComplete: () => {
        setIsPlaying(false);
      },
    });

    engineRef.current = engine;

    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const playing = engine.togglePlay();
        setIsPlaying(playing);
      } else if (e.code === 'ArrowRight') {
        engine.stepFrame(1);
        setIsPlaying(false);
      } else if (e.code === 'ArrowLeft') {
        engine.stepFrame(-1);
        setIsPlaying(false);
      } else if (e.code === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
      engineRef.current = null;
    };
  }, [replayData, onExit]);

  const handleTogglePlay = () => {
    if (!engineRef.current) return;
    const playing = engineRef.current.togglePlay();
    setIsPlaying(playing);
  };

  const handleSpeedChange = (speed: number) => {
    if (!engineRef.current) return;
    engineRef.current.setSpeed(speed);
    setPlaybackSpeed(speed);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!engineRef.current) return;
    const progress = parseFloat(e.target.value);
    setCurrentProgress(progress);
    engineRef.current.seekProgress(progress);
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    engineRef.current.seekIndex(0);
    engineRef.current.setPlaying(true);
    setIsPlaying(true);
  };

  const handleStep = (dir: 1 | -1) => {
    if (!engineRef.current) return;
    engineRef.current.stepFrame(dir);
    setIsPlaying(false);
  };

  const currentTimeSeconds = currentFrame
    ? (currentProgress * replayData.totalDuration).toFixed(1)
    : '0.0';

  const p1Hp = currentFrame ? currentFrame.p1.hp : 100;
  const p2Hp = currentFrame ? currentFrame.p2.hp : 100;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Top Replay Status Header */}
      <div className="absolute top-0 inset-x-0 z-30 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onExit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 rounded-lg border border-neutral-700 text-xs font-tech text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> QUITTER LE REPLAY
          </button>

          {/* Glowing Replay Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-red-950/80 border border-red-500/80 rounded-full glow-red">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-arcade text-lg font-bold text-red-400 tracking-wider">
              ● REPLAY THÉÂTRE
            </span>
          </div>
        </div>

        <div className="text-center">
          <span className="font-arcade text-2xl font-bold tracking-wider text-white">
            {p1Def.name} <span className="text-red-500">VS</span> {p2Def.name}
          </span>
          <span className="font-tech text-xs text-neutral-400 block">
            Vainqueur : <span className="font-bold text-amber-400">{FIGHTERS[replayData.winnerId].name}</span> • {replayData.date}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowInputLog(!showInputLog)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 rounded-lg border border-neutral-700 text-xs font-tech text-neutral-300 hover:text-white transition-colors"
            title="Afficher/Masquer les touches enregistrées"
          >
            {showInputLog ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-neutral-500" />}
            TOUCHES
          </button>
        </div>
      </div>

      {/* Floating Mini HUD for Health & Combos */}
      {currentFrame && (
        <div className="absolute top-16 inset-x-0 z-20 px-6 flex justify-between items-center pointer-events-none max-w-5xl mx-auto">
          {/* P1 HP Pill */}
          <div className="flex items-center gap-2 bg-black/60 p-2 rounded-lg border border-neutral-800">
            <span className="font-arcade text-xl font-bold text-red-400">{p1Def.name}</span>
            <div className="w-36 h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-amber-400 transition-all duration-75"
                style={{ width: `${p1Hp}%` }}
              />
            </div>
            <span className="font-tech text-xs font-bold text-white w-7 text-right">{p1Hp}%</span>
          </div>

          {/* Center Round and Timer */}
          <div className="bg-black/70 px-4 py-1.5 rounded-lg border border-neutral-700 text-center">
            <span className="font-arcade text-2xl font-bold text-white tracking-widest block">
              {currentFrame.timer}s
            </span>
            <span className="font-tech text-[10px] text-neutral-400 uppercase font-semibold">
              ROUND {currentFrame.round}
            </span>
          </div>

          {/* P2 HP Pill */}
          <div className="flex items-center gap-2 bg-black/60 p-2 rounded-lg border border-neutral-800 flex-row-reverse">
            <span className="font-arcade text-xl font-bold text-blue-400">{p2Def.name}</span>
            <div className="w-36 h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700 flex justify-end">
              <div 
                className="h-full bg-gradient-to-l from-blue-600 to-cyan-400 transition-all duration-75"
                style={{ width: `${p2Hp}%` }}
              />
            </div>
            <span className="font-tech text-xs font-bold text-white w-7 text-left">{p2Hp}%</span>
          </div>
        </div>
      )}

      {/* Input Sequence History (Tournament fighting replay stream) */}
      {showInputLog && (
        <div className="absolute top-32 left-6 z-20 pointer-events-none flex flex-col gap-1.5 max-w-xs">
          <div className="bg-black/80 px-3 py-1 rounded-t border-t border-x border-neutral-800 text-[10px] font-tech font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" /> SÉQUENCE DES TOUCHES (P1)
          </div>

          <div className="bg-black/70 p-2 rounded-b border border-neutral-800 space-y-1">
            {recentInputs.length === 0 ? (
              <span className="text-[11px] font-tech text-neutral-500 italic block py-1">
                En attente d’entrées...
              </span>
            ) : (
              recentInputs.slice(-5).map((inp, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between text-xs font-tech px-2 py-1 rounded border animate-fadeIn ${
                    inp.player === 'p1'
                      ? 'bg-red-950/40 border-red-500/40 text-red-200'
                      : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1">
                    {inp.label}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {inp.time}s
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bottom Replay Control Dock (Collapsible, Ergonomic glassmorphic dock) */}
      <div className="absolute bottom-6 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-30 w-full max-w-2xl bg-neutral-900/95 border border-neutral-700/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
        {/* Timeline Slider */}
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-xs text-neutral-400 font-bold w-12 text-right">
            {currentTimeSeconds}s
          </span>

          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={currentProgress}
            onChange={handleSeek}
            className="flex-1 accent-red-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
          />

          <span className="font-mono text-xs text-neutral-400 font-bold w-12 text-left">
            {replayData.totalDuration}s
          </span>
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between">
          {/* Step Back & Restart */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 rounded-lg transition-colors border border-neutral-700"
              title="Recommencer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleStep(-1)}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 rounded-lg transition-colors border border-neutral-700"
              title="Image précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Play / Pause Main CTA */}
          <button
            onClick={handleTogglePlay}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 rounded-xl text-white font-arcade text-2xl font-bold flex items-center gap-2 shadow-lg shadow-red-950/60 border border-red-400/50"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 fill-white" /> PAUSE
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" /> LECTURE
              </>
            )}
          </button>

          {/* Step Forward & Speed Multipliers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStep(1)}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 rounded-lg transition-colors border border-neutral-700"
              title="Image suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Speed Selector Buttons */}
            <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-tech font-bold">
              {[0.5, 1.0, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    playbackSpeed === spd
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
