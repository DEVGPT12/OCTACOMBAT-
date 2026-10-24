/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { CharacterSelect } from './components/CharacterSelect';
import { FightHUD } from './components/FightHUD';
import { TouchControls } from './components/TouchControls';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { StoryModeModal } from './components/StoryModeModal';
import { SettingsModal } from './components/SettingsModal';
import { CreditsModal } from './components/CreditsModal';
import { TrainingOverlay } from './components/TrainingOverlay';
import { ReplayViewer } from './components/ReplayViewer';
import { ReplayRecorder } from './game/combat/ReplayRecorder';

import { 
  FighterId, 
  ArenaId, 
  GameMode, 
  GameSettings, 
  CombatEntity,
  MatchReplayData 
} from './types/combat';
import { FIGHTERS, ARENAS, INITIAL_SETTINGS } from './game/constants';
import { CombatEngine } from './game/combat/CombatEngine';
import { soundEngine } from './audio/soundEngine';

type ScreenState = 'title' | 'select' | 'fight' | 'story' | 'settings' | 'credits' | 'replay';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('title');
  const [gameMode, setGameMode] = useState<GameMode>('arcade');
  const [playerFighterId, setPlayerFighterId] = useState<FighterId>('octav');
  const [cpuFighterId, setCpuFighterId] = useState<FighterId>('zen');
  const [currentArenaId, setCurrentArenaId] = useState<ArenaId>('temple');
  const [storyStage, setStoryStage] = useState<number>(0);
  const [settings, setSettings] = useState<GameSettings>(INITIAL_SETTINGS);

  // Replay State
  const [activeReplay, setActiveReplay] = useState<MatchReplayData | null>(null);

  // In-Fight States
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [matchOutcome, setMatchOutcome] = useState<{ winnerId: FighterId; isPlayerWin: boolean } | null>(null);
  const [announcement, setAnnouncement] = useState<{ main: string; sub?: string } | null>(null);

  // Entities snapshot for HUD
  const [p1State, setP1State] = useState<CombatEntity | null>(null);
  const [p2State, setP2State] = useState<CombatEntity | null>(null);
  const [matchTimer, setMatchTimer] = useState<number>(80);
  const [currentRound, setCurrentRound] = useState<number>(1);

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const combatEngineRef = useRef<CombatEngine | null>(null);

  // Initialize Audio Volumes
  useEffect(() => {
    soundEngine.setVolumes(settings.sfxVolume, settings.musicVolume);
  }, []);

  // Handle Match Initialization when entering 'fight' screen
  useEffect(() => {
    if (currentScreen !== 'fight' || !canvasMountRef.current) return;

    setIsPaused(false);
    setIsGameOver(false);
    setMatchOutcome(null);

    const engine = new CombatEngine(
      canvasMountRef.current,
      FIGHTERS[playerFighterId],
      FIGHTERS[cpuFighterId],
      ARENAS[currentArenaId],
      gameMode,
      settings.difficulty,
      {
        onStateUpdate: (p1, p2, timer, round, roundState) => {
          setP1State({ ...p1 });
          setP2State({ ...p2 });
          setMatchTimer(timer);
          setCurrentRound(round);
        },
        onAnnounce: (msg, sub) => {
          setAnnouncement(msg ? { main: msg, sub } : null);
        },
        onMatchEnd: (winnerId, isPlayerWin) => {
          setMatchOutcome({ winnerId: winnerId as FighterId, isPlayerWin });
          setIsGameOver(true);
          if (gameMode === 'story' && isPlayerWin) {
            setStoryStage((prev) => prev + 1);
          }
        },
      }
    );

    combatEngineRef.current = engine;
    engine.start();

    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setIsPaused((prev) => {
          const next = !prev;
          if (next) engine.pause();
          else engine.resume();
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
      combatEngineRef.current = null;
    };
  }, [currentScreen, playerFighterId, cpuFighterId, currentArenaId, gameMode, settings.difficulty]);

  // Screen Actions
  const handleStartQuickFight = () => {
    setGameMode('arcade');
    setCurrentScreen('select');
  };

  const handleStartStory = () => {
    setGameMode('story');
    setCurrentScreen('story');
  };

  const handleStartTraining = () => {
    setGameMode('training');
    setPlayerFighterId('octav');
    setCpuFighterId('zen');
    setCurrentArenaId('temple');
    setCurrentScreen('fight');
  };

  const handleConfirmSelect = (p1Id: FighterId, p2Id: FighterId, arenaId: ArenaId) => {
    setPlayerFighterId(p1Id);
    setCpuFighterId(p2Id);
    setCurrentArenaId(arenaId);
    setCurrentScreen('fight');
  };

  const handleStartStoryStage = (p1Id: FighterId, oppId: FighterId, arenaId: ArenaId) => {
    setPlayerFighterId(p1Id);
    setCpuFighterId(oppId);
    setCurrentArenaId(arenaId);
    setCurrentScreen('fight');
  };

  const handlePauseToggle = () => {
    if (!combatEngineRef.current) return;
    setIsPaused((prev) => {
      const next = !prev;
      if (next) combatEngineRef.current?.pause();
      else combatEngineRef.current?.resume();
      return next;
    });
  };

  const handleRestartMatch = () => {
    setIsPaused(false);
    setIsGameOver(false);
    combatEngineRef.current?.resetMatch();
  };

  const handleWatchReplay = (targetReplay?: MatchReplayData) => {
    const replay = targetReplay || ReplayRecorder.getInstance().getLastReplay();
    if (replay) {
      setActiveReplay(replay);
      setCurrentScreen('replay');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
      {/* 1. TITLE SCREEN */}
      {currentScreen === 'title' && (
        <TitleScreen
          onPlay={handleStartQuickFight}
          onSelectFighter={() => setCurrentScreen('select')}
          onStoryMode={handleStartStory}
          onTraining={handleStartTraining}
          onSettings={() => setCurrentScreen('settings')}
          onCredits={() => setCurrentScreen('credits')}
          onWatchReplay={() => handleWatchReplay()}
          hasSavedReplay={!!ReplayRecorder.getInstance().getLastReplay()}
        />
      )}

      {/* 2. CHARACTER SELECTION SCREEN */}
      {currentScreen === 'select' && (
        <CharacterSelect
          onConfirm={handleConfirmSelect}
          onBack={() => setCurrentScreen('title')}
          initialFighterId={playerFighterId}
        />
      )}

      {/* 3. STORY MODE LADDER */}
      {currentScreen === 'story' && (
        <StoryModeModal
          playerFighterId={playerFighterId}
          storyStage={storyStage}
          onStartStage={handleStartStoryStage}
          onBack={() => setCurrentScreen('title')}
        />
      )}

      {/* 4. SETTINGS SCREEN */}
      {currentScreen === 'settings' && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
          onBack={() => setCurrentScreen('title')}
        />
      )}

      {/* 5. CREDITS SCREEN */}
      {currentScreen === 'credits' && (
        <CreditsModal onBack={() => setCurrentScreen('title')} />
      )}

      {/* 6. REAL 3D FIGHT VIEWPORT */}
      {currentScreen === 'fight' && (
        <div className="relative w-full h-full">
          {/* Isolated WebGL Mount for Three.js (No React state re-renders) */}
          <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />

          {/* Arcade Fighting HUD */}
          {p1State && p2State && (
            <FightHUD
              p1={p1State}
              p2={p2State}
              p1Def={FIGHTERS[playerFighterId]}
              p2Def={FIGHTERS[cpuFighterId]}
              timer={matchTimer}
              currentRound={currentRound}
              announcement={announcement}
              onPause={handlePauseToggle}
              isTraining={gameMode === 'training'}
            />
          )}

          {/* Virtual On-Screen Controls */}
          {settings.touchControls && (
            <TouchControls
              opacity={settings.touchOpacity}
              onMovement={(dir) => combatEngineRef.current?.setVirtualMovement(dir)}
              onAction={(action) => combatEngineRef.current?.triggerPlayerAction(action)}
            />
          )}

          {/* Practice Mode Overlay */}
          {gameMode === 'training' && (
            <TrainingOverlay
              fighterDef={FIGHTERS[playerFighterId]}
              onResetPositions={() => combatEngineRef.current?.resetMatch()}
              onToggleDummyBehavior={(behavior) => {
                if (combatEngineRef.current) {
                  if (behavior === 'guard') {
                    combatEngineRef.current.p2.isBlocking = true;
                    combatEngineRef.current.p2.action = 'block';
                  } else {
                    combatEngineRef.current.p2.isBlocking = false;
                    combatEngineRef.current.p2.action = 'idle';
                  }
                }
              }}
              onExitTraining={() => setCurrentScreen('title')}
            />
          )}

          {/* In-Game Pause Modal */}
          {isPaused && (
            <PauseModal
              onResume={handlePauseToggle}
              onRestart={handleRestartMatch}
              onSelectCharacter={() => setCurrentScreen('select')}
              onMainMenu={() => setCurrentScreen('title')}
            />
          )}

          {/* Game Over / Victory Modal */}
          {isGameOver && matchOutcome && p1State && p2State && (
            <GameOverModal
              isPlayerWinner={matchOutcome.isPlayerWin}
              winnerDef={FIGHTERS[matchOutcome.winnerId]}
              loserDef={FIGHTERS[matchOutcome.isPlayerWin ? cpuFighterId : playerFighterId]}
              p1RoundsWon={p1State.roundsWon}
              p2RoundsWon={p2State.roundsWon}
              onRematch={handleRestartMatch}
              onWatchReplay={() => handleWatchReplay()}
              onSelectCharacter={() => setCurrentScreen('select')}
              onMainMenu={() => setCurrentScreen('title')}
            />
          )}
        </div>
      )}

      {/* 7. CINEMATIC REPLAY THEATER */}
      {currentScreen === 'replay' && activeReplay && (
        <ReplayViewer
          replayData={activeReplay}
          onExit={() => {
            if (isGameOver) {
              setCurrentScreen('fight');
            } else {
              setCurrentScreen('title');
            }
          }}
        />
      )}
    </div>
  );
}
