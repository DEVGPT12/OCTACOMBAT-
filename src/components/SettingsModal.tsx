import React from 'react';
import { ArrowLeft, Volume2, VolumeX, Monitor, Smartphone, Cpu, Keyboard } from 'lucide-react';
import { GameSettings, Difficulty } from '../types/combat';
import { soundEngine } from '../audio/soundEngine';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onBack: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-neutral-950 text-white select-none">
      <div className="absolute inset-0 bg-scanlines opacity-25 pointer-events-none" />

      {/* Top Header */}
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

        <h2 className="font-arcade text-3xl md:text-4xl font-bold tracking-wider italic text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-500">
          PARAMÈTRES & CONFIGURATION
        </h2>

        <div className="w-20" />
      </div>

      {/* Settings Grid */}
      <div className="relative z-10 flex-1 max-w-4xl mx-auto w-full p-6 overflow-y-auto space-y-6">
        {/* Audio Section */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5">
          <h3 className="font-arcade text-2xl font-bold tracking-wider text-red-400 flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5" /> AUDIO & EFFETS SONORES
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs font-tech font-bold mb-1">
                <span className="text-neutral-300">EFFETS SONORES (SFX)</span>
                <span className="text-red-400">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ sfxVolume: val });
                  soundEngine.setVolumes(val, settings.musicVolume);
                  soundEngine.playHit('light');
                }}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-tech font-bold mb-1">
                <span className="text-neutral-300">MUSIQUE SYNTHWAVE D'ARCADE</span>
                <span className="text-red-400">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ musicVolume: val });
                  soundEngine.setVolumes(settings.sfxVolume, val);
                }}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Gameplay & Difficulty Section */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5">
          <h3 className="font-arcade text-2xl font-bold tracking-wider text-blue-400 flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5" /> INTELLIGENCE ARTIFICIELLE & COMBAT
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  soundEngine.playRoundAnnounce('select');
                  onUpdateSettings({ difficulty: diff });
                }}
                className={`py-3 px-4 rounded-lg font-tech font-bold text-sm border transition-all text-center ${
                  settings.difficulty === diff
                    ? 'border-blue-500 bg-blue-600/30 text-white shadow-md'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                {diff === 'easy' ? 'FACILE (DÉBUTANT)' :
                 diff === 'normal' ? 'NORMAL (ÉQUILIBRÉ)' : 'DIFFICILE (EXPERT)'}
              </button>
            ))}
          </div>
        </div>

        {/* Controls and Touch Display */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5">
          <h3 className="font-arcade text-2xl font-bold tracking-wider text-cyan-400 flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5" /> COMMANDES TACTILES SUR ÉCRAN
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-xs font-tech text-neutral-300">
              Afficher le joystick virtuel et boutons d’action (obligatoire sur mobile / tablette)
            </span>
            <button
              onClick={() => {
                soundEngine.playRoundAnnounce('select');
                onUpdateSettings({ touchControls: !settings.touchControls });
              }}
              className={`px-4 py-2 rounded-lg font-tech font-bold text-xs border transition-colors ${
                settings.touchControls
                  ? 'bg-cyan-600 text-white border-cyan-400'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {settings.touchControls ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
            </button>
          </div>
        </div>

        {/* Keyboard Map Reference */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5">
          <h3 className="font-arcade text-2xl font-bold tracking-wider text-amber-400 flex items-center gap-2 mb-3">
            <Keyboard className="w-5 h-5" /> MAPPAGE DU CLAVIER (PC)
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-tech">
            <div className="p-2.5 bg-black/60 rounded border border-neutral-800">
              <span className="text-neutral-400 block">DÉPLACEMENT</span>
              <span className="font-bold text-white text-sm">A / D ou Flèches</span>
            </div>
            <div className="p-2.5 bg-black/60 rounded border border-neutral-800">
              <span className="text-neutral-400 block">SAUT & GARDE</span>
              <span className="font-bold text-white text-sm">W (Saut) / S (Garde)</span>
            </div>
            <div className="p-2.5 bg-black/60 rounded border border-neutral-800">
              <span className="text-neutral-400 block">ATTAQUES</span>
              <span className="font-bold text-white text-sm">J (Rapide) / K (Lourd) / L (Pied)</span>
            </div>
            <div className="p-2.5 bg-black/60 rounded border border-neutral-800">
              <span className="text-neutral-400 block">TECHNIQUE SPÉCIALE</span>
              <span className="font-bold text-amber-400 text-sm">ESPACE ou Touche U</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
