import React, { useState } from 'react';
import { ArrowLeft, Check, Shield, Zap, Swords, Flame, Sparkles, MapPin } from 'lucide-react';
import { FighterDefinition, FighterId, ArenaId } from '../types/combat';
import { FIGHTERS, ARENAS } from '../game/constants';
import { soundEngine } from '../audio/soundEngine';

interface CharacterSelectProps {
  onConfirm: (p1Id: FighterId, p2Id: FighterId, arenaId: ArenaId) => void;
  onBack: () => void;
  initialFighterId?: FighterId;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  onConfirm,
  onBack,
  initialFighterId = 'octav',
}) => {
  const [selectedP1, setSelectedP1] = useState<FighterId>(initialFighterId);
  const [selectedP2, setSelectedP2] = useState<FighterId>('zen');
  const [selectedArena, setSelectedArena] = useState<ArenaId>('temple');
  const [isPickingP2, setIsPickingP2] = useState(false);

  const fightersList = Object.values(FIGHTERS);
  const arenasList = Object.values(ARENAS);
  const currentFighter = FIGHTERS[isPickingP2 ? selectedP2 : selectedP1];
  const currentArena = ARENAS[selectedArena];

  const handleSelectFighter = (id: FighterId) => {
    soundEngine.playRoundAnnounce('select');
    if (isPickingP2) {
      setSelectedP2(id);
    } else {
      setSelectedP1(id);
    }
  };

  const handleConfirm = () => {
    soundEngine.playRoundAnnounce('fight');
    onConfirm(selectedP1, selectedP2, selectedArena);
  };

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col justify-start overflow-x-hidden overflow-y-auto bg-neutral-950 text-white select-none">
      {/* Background ambient lighting */}
      <div 
        className="absolute inset-0 opacity-25 transition-colors duration-500 blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at 75% 40%, ${currentFighter.primaryColor} 0%, transparent 60%)`,
        }}
      />
      <div className="absolute inset-0 bg-scanlines opacity-40 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 w-full px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playRoundAnnounce('select');
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-700 font-tech text-sm text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> RETOUR
          </button>
          <h2 className="font-arcade text-xl sm:text-3xl md:text-4xl font-bold tracking-wide sm:tracking-wider italic text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-red-400">
            CHOISIS TON COMBATTANT
          </h2>
        </div>

        {/* Player 1 / CPU Toggle tab */}
        <div className="flex flex-wrap items-center gap-1 bg-neutral-900 p-1 rounded-md border border-neutral-800 text-[10px] sm:text-xs font-tech max-w-full">
          <button
            onClick={() => setIsPickingP2(false)}
            className={`px-3 py-1.5 rounded transition-all font-bold ${
              !isPickingP2
                ? 'bg-red-600 text-white shadow-sm shadow-red-900/60'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            JOUEUR 1 : {FIGHTERS[selectedP1].name}
          </button>
          <button
            onClick={() => setIsPickingP2(true)}
            className={`px-3 py-1.5 rounded transition-all font-bold ${
              isPickingP2
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/60'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            ADVERSAIRE (IA) : {FIGHTERS[selectedP2].name}
          </button>
        </div>
      </div>

      {/* Main Body: Grid on Left, Fighter Preview on Right */}
      <div className="relative z-10 flex-none grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-3 sm:p-6 overflow-visible">
        {/* Left Column: 8 Fighters Grid */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {fightersList.map((fighter) => {
              const isSelected = isPickingP2 ? selectedP2 === fighter.id : selectedP1 === fighter.id;
              const isP1 = selectedP1 === fighter.id;
              const isP2 = selectedP2 === fighter.id;

              return (
                <button
                  key={fighter.id}
                  onClick={() => handleSelectFighter(fighter.id)}
                  className={`group relative flex flex-col rounded-md overflow-hidden transition-all duration-200 border-2 text-left active:scale-95 ${
                    isSelected
                      ? 'border-red-500 scale-102 shadow-lg shadow-red-950/70'
                      : 'border-neutral-800 hover:border-neutral-500 bg-neutral-900/80'
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 16px ${fighter.primaryColor}80` : undefined,
                  }}
                >
                  {/* Portrait Placeholder with stylized fighter silhouette & glowing background */}
                  <div
                    className="relative w-full aspect-square flex items-center justify-center overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${fighter.secondaryColor} 0%, #000 100%)`,
                    }}
                  >
                    <FighterPortrait fighterId={fighter.id} color={fighter.primaryColor} accent={fighter.accentColor} />

                    {/* Selection Badges */}
                    {isP1 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-red-600 font-arcade text-xs font-bold text-white rounded">
                        P1
                      </span>
                    )}
                    {isP2 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-blue-600 font-arcade text-xs font-bold text-white rounded">
                        CPU
                      </span>
                    )}
                  </div>

                  {/* Character Name Label */}
                  <div
                    className={`py-1.5 px-2 text-center font-arcade text-lg md:text-xl font-bold tracking-wide transition-colors ${
                      isSelected ? 'bg-red-600 text-white' : 'bg-neutral-950/90 text-neutral-300'
                    }`}
                  >
                    {fighter.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Arena Selector Strip */}
          <div className="mt-5 p-3 rounded-md bg-neutral-900/90 border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-tech text-xs tracking-wider uppercase text-neutral-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500" /> SÉLECTION DE L’ARÈNE
              </span>
              <span className="font-tech text-xs font-bold text-red-400">
                {currentArena.name}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {arenasList.map((arena) => (
                <button
                  key={arena.id}
                  onClick={() => {
                    soundEngine.playRoundAnnounce('select');
                    setSelectedArena(arena.id);
                  }}
                  className={`py-2 px-2.5 rounded font-tech text-xs font-bold truncate transition-all text-center border ${
                    selectedArena === arena.id
                      ? 'border-red-500 bg-red-600/20 text-white shadow-sm'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  {arena.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Fighter Details & Live Stats */}
        <div className="lg:col-span-5 flex flex-col justify-between p-3 sm:p-5 rounded-lg bg-neutral-900/90 border border-neutral-800 octa-panel">
          <div>
            {/* Fighter Titles */}
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="px-2 py-0.5 rounded text-[11px] font-tech font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${currentFighter.primaryColor}30`, color: currentFighter.primaryColor }}
              >
                {currentFighter.title}
              </span>
              <span className="text-xs font-tech text-neutral-400">
                {currentFighter.fightingStyle}
              </span>
            </div>

            <h3
              className="font-arcade text-5xl md:text-6xl font-bold tracking-wider italic leading-none drop-shadow-md"
              style={{ color: currentFighter.primaryColor }}
            >
              {currentFighter.name}
            </h3>

            <p className="font-tech text-xs font-bold tracking-widest text-neutral-300 uppercase mt-1 mb-3">
              {currentFighter.slogan}
            </p>

            <p className="text-xs font-tech text-neutral-400 leading-relaxed mb-4">
              {currentFighter.bio}
            </p>

            {/* Combat Stats Bars */}
            <div className="space-y-2 mb-4 bg-black/40 p-3 rounded border border-neutral-800/80">
              <StatBar
                label="VITESSE"
                value={currentFighter.stats.speed}
                color={currentFighter.primaryColor}
                icon={<Zap className="w-3.5 h-3.5" />}
              />
              <StatBar
                label="PUISSANCE"
                value={currentFighter.stats.power}
                color={currentFighter.primaryColor}
                icon={<Flame className="w-3.5 h-3.5" />}
              />
              <StatBar
                label="DÉFENSE"
                value={currentFighter.stats.defense}
                color={currentFighter.primaryColor}
                icon={<Shield className="w-3.5 h-3.5" />}
              />
              <StatBar
                label="ÉNERGIE / CHI"
                value={currentFighter.stats.energyRate}
                color={currentFighter.primaryColor}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              />
            </div>

            {/* Signature Moves Preview */}
            <div className="bg-black/40 p-3 rounded border border-neutral-800/80">
              <span className="font-tech text-[11px] font-bold tracking-wider uppercase text-neutral-400 block mb-2">
                TECHNIQUE SPÉCIALE (SUPER GAUGE 50%)
              </span>
              <div className="flex items-center justify-between text-xs font-tech font-bold">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" /> {currentFighter.moves.specialMove.nameFr}
                </span>
                <span className="text-neutral-400">
                  Dégâts : {currentFighter.moves.specialMove.damage}
                </span>
              </div>
              <p className="text-[11px] font-tech text-neutral-400 mt-1">
                {currentFighter.moves.specialMove.description}
              </p>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-98 transition-all rounded font-arcade text-2xl font-bold tracking-wider text-white shadow-lg shadow-red-950/70 flex items-center justify-center gap-2 border border-red-400/40"
          >
            <Check className="w-6 h-6" /> COMMENCER LE COMBAT
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatBarProps {
  label: string;
  value: number; // 0 to 10
  color: string;
  icon: React.ReactNode;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, color, icon }) => (
  <div className="flex items-center gap-3 text-xs font-tech">
    <div className="w-24 flex items-center gap-1.5 text-neutral-400 font-semibold">
      {icon}
      <span>{label}</span>
    </div>
    <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${(value / 10) * 100}%`,
          backgroundColor: color,
        }}
      />
    </div>
    <span className="w-7 text-right font-bold text-neutral-300">
      {value.toFixed(1)}
    </span>
  </div>
);


const FighterPortrait: React.FC<{ fighterId: FighterId; color: string; accent: string }> = ({ fighterId, color, accent }) => {
  const isHooded = fighterId === 'spectre';
  const isMasked = fighterId === 'kai';
  const isLongHair = fighterId === 'luna' || fighterId === 'maya';
  const isHeavy = fighterId === 'razor';
  const isSpiky = fighterId === 'octav' || fighterId === 'volt';
  return (
    <div className="fighter-portrait relative h-full w-full overflow-hidden" style={{ background: `radial-gradient(ellipse at 50% 28%, ${color}70 0%, transparent 56%), linear-gradient(145deg, ${color}30, #03050a 76%)` }} aria-hidden="true">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,.75), transparent 45%), repeating-linear-gradient(135deg, transparent 0 9px, rgba(255,255,255,.07) 10px 11px)' }} />
      <div className="absolute bottom-[-10%] left-[16%] h-[59%] w-[68%] rounded-t-[45%] border border-white/10" style={{ background: `linear-gradient(115deg, ${color} 0%, #10131d 70%)`, boxShadow: `0 0 28px ${color}40` }} />
      {isLongHair && <div className="absolute left-[24%] top-[13%] h-[53%] w-[53%] rounded-t-[45%] rounded-b-[20%]" style={{ background: `linear-gradient(90deg, ${color}, ${accent})` }} />}
      {isHooded && <div className="absolute left-[15%] top-[5%] h-[64%] w-[70%] rounded-t-[50%] rounded-b-[20%] border-2 border-slate-700 bg-slate-950 shadow-[0_0_25px_rgba(6,182,212,.25)]" />}
      <div className={`absolute left-[31%] top-[19%] h-[36%] w-[39%] overflow-hidden rounded-[44%_44%_38%_38%] border border-white/20 ${isHeavy ? 'scale-110' : ''}`} style={{ background: 'linear-gradient(135deg, #e8b99a, #a66b52 72%, #3b2927)' }}>
        <div className={`absolute left-[-10%] top-[-18%] h-[43%] w-[120%] rounded-t-[60%] ${isSpiky ? 'rotate-[-7deg]' : ''}`} style={{ background: `linear-gradient(120deg, ${color}, ${accent})`, clipPath: isSpiky ? 'polygon(0 100%, 8% 20%, 22% 70%, 35% 0, 48% 66%, 65% 10%, 78% 70%, 100% 25%, 100% 100%)' : undefined }} />
        <div className="absolute left-[13%] top-[49%] h-[5%] w-[22%] rounded-full bg-slate-950" />
        <div className="absolute right-[13%] top-[49%] h-[5%] w-[22%] rounded-full bg-slate-950" />
        <div className="absolute bottom-[15%] left-[39%] h-[3%] w-[22%] rounded-full bg-black/70" />
        {isMasked && <div className="absolute bottom-[8%] left-[-4%] h-[31%] w-[108%] border-y-2 border-red-400/60 bg-neutral-950" />}
        {isHooded && <div className="absolute inset-x-0 top-[45%] h-[15%] bg-slate-950"><span className="absolute left-[17%] top-[40%] h-1 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" /><span className="absolute right-[17%] top-[40%] h-1 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" /></div>}
      </div>
      {isHeavy && <div className="absolute left-[20%] top-[40%] h-[14%] w-[60%] rounded-t-full border-t-4 border-amber-200/50" />}
      <div className="absolute bottom-[18%] left-[6%] h-[17%] w-[40%] rotate-[-25deg] rounded-full border border-white/10" style={{ background: color }} />
      <div className="absolute bottom-[18%] right-[6%] h-[17%] w-[40%] rotate-[25deg] rounded-full border border-white/10" style={{ background: color }} />
      <div className="absolute bottom-[19%] right-[8%] h-[12%] w-[24%] rotate-[20deg] rounded-md border border-white/20" style={{ background: accent, boxShadow: `0 0 12px ${accent}65` }} />
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-black/90 to-transparent" />
    </div>
  );
};
