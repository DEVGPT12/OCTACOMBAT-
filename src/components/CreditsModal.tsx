import React from 'react';
import { ArrowLeft, Award, Shield, Code, Sparkles, Heart } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface CreditsModalProps {
  onBack: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ onBack }) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-neutral-950 text-white select-none">
      <div className="absolute inset-0 bg-scanlines opacity-25 pointer-events-none" />

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

        <h2 className="font-arcade text-3xl md:text-4xl font-bold tracking-wider italic text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-red-400">
          CRÉDITS & ÉQUIPE DE PRODUCTION
        </h2>

        <div className="w-20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col justify-center space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-red-500 clip-octagon mx-auto flex items-center justify-center bg-red-950/30 glow-red mb-3">
            <span className="font-arcade text-4xl font-bold text-red-500">8</span>
          </div>
          <h1 className="font-arcade text-5xl font-bold tracking-wider text-white">
            OCTACOMBAT
          </h1>
          <p className="font-tech text-base font-bold tracking-[0.3em] text-red-400 uppercase mt-1">
            « 8 COMBATTANTS. 1 SEUL CHAMPION. »
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-lg">
            <h4 className="font-tech text-xs font-bold text-red-400 uppercase flex items-center gap-2 mb-2">
              <Code className="w-4 h-4" /> MOTEUR & DÉVELOPPEMENT 3D
            </h4>
            <p className="text-sm font-tech text-neutral-300">
              Moteur 3D temps réel Three.js, rendu PBR Studio, cinématique inverse et squelettes articulés procéduraux.
            </p>
          </div>

          <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-lg">
            <h4 className="font-tech text-xs font-bold text-blue-400 uppercase flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" /> GAME DESIGN & COMBAT
            </h4>
            <p className="text-sm font-tech text-neutral-300">
              Système de combos dynamiques, hitboxes & hurtboxes millimétrées, hitstop cinématique et intelligence artificielle réactive.
            </p>
          </div>

          <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-lg">
            <h4 className="font-tech text-xs font-bold text-cyan-400 uppercase flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" /> AUDIO & SYNTHÉTISEURS
            </h4>
            <p className="text-sm font-tech text-neutral-300">
              Synthèse sonore procédurale Web Audio API : impacts de coups, ondes de choc, charges d'énergie et rythme arcade.
            </p>
          </div>

          <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-lg">
            <h4 className="font-tech text-xs font-bold text-purple-400 uppercase flex items-center gap-2 mb-2">
              <Award className="w-4 h-4" /> DIRECTION ARTISTIQUE
            </h4>
            <p className="text-sm font-tech text-neutral-300">
              Inspiré de l'esthétique cyberpunk nocturne et des arts martiaux traditionnels d'Asie et de boxe urbaine.
            </p>
          </div>
        </div>

        <div className="text-center font-tech text-xs text-neutral-500 pt-4 flex items-center justify-center gap-1.5">
          <span>Créé avec passion pour le jeu vidéo d'arcade</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
        </div>
      </div>
    </div>
  );
};
