import React from 'react';
import { ArrowLeft, Play, Trophy, Shield, Swords, Sparkles, CheckCircle2 } from 'lucide-react';
import { FighterId, ArenaId } from '../types/combat';
import { FIGHTERS, ARENAS } from '../game/constants';
import { soundEngine } from '../audio/soundEngine';

interface StoryModeModalProps {
  playerFighterId: FighterId;
  storyStage: number; // 0 to 6
  onStartStage: (playerFighterId: FighterId, opponentId: FighterId, arenaId: ArenaId) => void;
  onBack: () => void;
}

export const StoryModeModal: React.FC<StoryModeModalProps> = ({
  playerFighterId,
  storyStage,
  onStartStage,
  onBack,
}) => {
  // Opponents ladder sequence excluding player
  const ladderFighters: { id: FighterId; arenaId: ArenaId; title: string; storyQuote: string }[] = [
    {
      id: 'zen',
      arenaId: 'temple',
      title: 'Étape 1 : Le Défi du Temple',
      storyQuote: '« Ton énergie est fougueuse, mais le calme de l’esprit surpasse la rage aveugle. »',
    },
    {
      id: 'kai',
      arenaId: 'city',
      title: 'Étape 2 : L’Embuscade des Toits',
      storyQuote: '« Tu ne peux pas frapper ce que tes yeux ne peuvent pas anticiper. Disparais dans la nuit ! »',
    },
    {
      id: 'luna',
      arenaId: 'city',
      title: 'Étape 3 : La Danse des Comètes',
      storyQuote: '« Voyons si ta garde résiste à un tourbillon céleste en apesanteur ! »',
    },
    {
      id: 'maya',
      arenaId: 'temple',
      title: 'Étape 4 : L’Épreuve Technique',
      storyQuote: '« Chaque membre du corps humain possède son point de rupture. Prépare-toi. »',
    },
    {
      id: 'volt',
      arenaId: 'cyberbase',
      title: 'Étape 5 : La Tempête Électrique',
      storyQuote: '« Surtension maximale ! Cent mille volts vont griller tes réflexes ! »',
    },
    {
      id: 'razor',
      arenaId: 'volcano',
      title: 'Étape 6 : Le Colosse Balafré',
      storyQuote: '« Des os brisés et du sang sur le ring... Voilà tout ce qui reste de mes opposants ! »',
    },
    {
      id: 'spectre',
      arenaId: 'volcano',
      title: 'Étape Finale : Le Maître du Néant',
      storyQuote: '« Tu as gravi l’Octogone jusqu’au sommet. Mais face au Néant, aucun champion ne survit... »',
    },
  ];

  const currentMatch = ladderFighters[Math.min(storyStage, ladderFighters.length - 1)];
  const opponentDef = FIGHTERS[currentMatch.id];
  const playerDef = FIGHTERS[playerFighterId];

  const handleStart = () => {
    soundEngine.playRoundAnnounce('fight');
    onStartStage(playerFighterId, currentMatch.id, currentMatch.arenaId);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-neutral-950 text-white select-none">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial from-red-950/30 via-neutral-950 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-scanlines opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xs">
        <button
          onClick={() => {
            soundEngine.playRoundAnnounce('select');
            onBack();
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-700 font-tech text-sm text-neutral-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> RETOUR
        </button>

        <div className="text-center">
          <h2 className="font-arcade text-3xl md:text-4xl font-bold tracking-wider italic text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-500">
            MODE HISTOIRE — LA ROUTE DU CHAMPION
          </h2>
          <p className="font-tech text-xs tracking-widest text-neutral-400 uppercase">
            ÉTAPE {storyStage + 1} SUR {ladderFighters.length}
          </p>
        </div>

        <div className="flex items-center gap-2 font-tech text-xs text-amber-400 bg-amber-950/30 px-3 py-1.5 rounded border border-amber-800/60">
          <Trophy className="w-4 h-4" /> CEINTURE MONDIALE
        </div>
      </div>

      {/* Main Ladder & Encounter Stage */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full items-center">
        {/* Ladder Stages List (Left) */}
        <div className="lg:col-span-6 space-y-2.5">
          <span className="font-tech text-xs font-bold tracking-widest text-neutral-400 uppercase block mb-1">
            PARCOURS DU TOURNOI D’OCTACOMBAT
          </span>

          {ladderFighters.map((stage, idx) => {
            const isCompleted = idx < storyStage;
            const isCurrent = idx === storyStage;
            const fighter = FIGHTERS[stage.id];

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-red-950/40 border-red-500 shadow-md glow-red'
                    : isCompleted
                    ? 'bg-neutral-900/40 border-neutral-800 opacity-60'
                    : 'bg-neutral-950/60 border-neutral-800/60 opacity-40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-arcade text-base font-bold ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div>
                    <h4 className="font-arcade text-xl font-bold leading-tight text-white">
                      {stage.title}
                    </h4>
                    <span className="text-xs font-tech text-neutral-400">
                      Adversaire : <span style={{ color: fighter.primaryColor }} className="font-bold">{fighter.name}</span>
                    </span>
                  </div>
                </div>

                <span className="font-tech text-xs font-bold px-2 py-1 bg-black/50 rounded text-neutral-400">
                  {ARENAS[stage.arenaId].name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current Match Showcase (Right) */}
        <div className="lg:col-span-6 bg-neutral-900/90 border-2 border-neutral-700/80 rounded-xl p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 bg-red-600/30 text-red-400 border border-red-500/50 rounded font-tech text-xs font-bold tracking-wider uppercase">
                {currentMatch.title}
              </span>
              <span className="font-tech text-xs text-neutral-400">
                Arène : {ARENAS[currentMatch.arenaId].name}
              </span>
            </div>

            {/* Face-off banner */}
            <div className="grid grid-cols-2 gap-4 text-center my-4 p-4 bg-black/60 rounded-lg border border-neutral-800">
              <div className="flex flex-col items-center">
                <span className="font-tech text-xs text-neutral-400">CHAMPION JOUEUR</span>
                <span className="font-arcade text-3xl font-bold text-red-400">{playerDef.name}</span>
                <span className="font-tech text-xs text-neutral-300">{playerDef.title}</span>
              </div>

              <div className="flex flex-col items-center border-l border-neutral-800">
                <span className="font-tech text-xs text-neutral-400">DÉFENSEUR</span>
                <span className="font-arcade text-3xl font-bold text-blue-400">{opponentDef.name}</span>
                <span className="font-tech text-xs text-neutral-300">{opponentDef.title}</span>
              </div>
            </div>

            {/* Story Dialogue Quote */}
            <div className="p-4 bg-neutral-950/80 border-l-4 border-amber-500 rounded-r-lg my-4">
              <p className="italic text-sm font-tech text-amber-200">
                {currentMatch.storyQuote}
              </p>
              <span className="text-xs font-tech font-bold text-amber-400 mt-2 block text-right">
                — {opponentDef.name}
              </span>
            </div>
          </div>

          {/* Launch Match Button */}
          <button
            onClick={handleStart}
            className="w-full mt-4 py-4 bg-gradient-to-r from-amber-600 via-red-600 to-red-700 hover:from-amber-500 hover:to-red-600 active:scale-98 transition-all rounded-lg font-arcade text-3xl font-bold tracking-widest text-white shadow-xl shadow-red-950/80 flex items-center justify-center gap-3 border border-amber-400/50"
          >
            <Play className="w-6 h-6 fill-white" /> ENTRER DANS L’ARÈNE
          </button>
        </div>
      </div>
    </div>
  );
};
