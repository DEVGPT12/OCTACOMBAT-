# OCTACOMBAT — « 8 Combattants. 1 Seul Champion. »

Véritable jeu vidéo de combat 3D d'arcade, inspiré des classiques du genre (Tekken, Street Fighter, anime fighters) combinant arts martiaux traditionnels et univers cyberpunk.

![OCTACOMBAT](/assets/aistudio/file_000000002cac820e8761eab09801e033_9ec31925.png)

---

## 🥊 1. Concept et Direction Artistique

- **Slogan** : *« 8 combattants. 1 seul champion. »*
- **Direction Artistique** : Esthétique 3D néo-arcade avec éclairage PBR cinématique (rouge carmin, bleu électrique, cyan néon et violet spectral), arènes emblématiques, traînées d'impact et particules d'énergie.
- **Identité Visuelle** : Logo octogonal emblématique, typographie sportive et percutante, HUD d'arcade avec jauges de vie dynamiques, compteur de combos en temps réel et jauges de super-technique.

---

## 🥋 2. Les 8 Combattants Uniques

| Combattant | Titre | Style de Combat | Caractéristiques & Spécialité | Technique Spéciale |
| :--- | :--- | :--- | :--- | :--- |
| **OCTAV** | L’Héritier d’Octa | Boxe Hybride & Ninjutsu | Tenue noire & rouge, rapide, équilibré et puissant | *Déferlante d'Octa (Charge enflammée)* |
| **ZEN** | Maître des Quatre Vents | Aïkido & Kenpo Moderne | Keikogi bleu, chignon samouraï, contre-attaques dévastatrices | *Parade Mystique du Lotus* |
| **KAI** | L’Ombre Écarlate | Ninjutsu Tactique Moderne | Masque ninja et traits rouges, agilité extrême, furtivité | *Assassinat Écarlate (Tempête d'ombres)* |
| **LUNA** | La Danseuse Céleste | Capoeira Cyber & Tae Kwon Do | Chevelure violette, cadences acrobatiques et combos aériens | *Séisme de la Nouvelle Lune* |
| **RAZOR** | Le Colosse de Fer | Lutte Brutale & Pancrace | Titan balafré avec blindage de torse, force colossale | *Broyeur de Mondes (Cataclysme)* |
| **MAYA** | La Reine des Enchaînements | Muay Thai & BJJ Hybride | Tresses guerrières, frappes techniques chirurgicales et clés | *Ouragan de Feu d'Or (Cyclone 8 Portes)* |
| **SPECTRE** | L’Entité du Néant | Arts Énergétiques Obscurs | Capuche mystérieuse, yeux cyan luminescents, failles de gravité | *Faille Gravitationnelle (Supernova)* |
| **VOLT** | Le Cyber-Éclair | Cyber-Krav Maga & Plasma | Chevelure blonde en épis, gantelets haute tension | *Rayon de Foudre Total (100 000V)* |

---

## 🏛️ 3. Les 4 Arènes 3D Interactives

1. **Temple Néo-Tokyo** : Cour pavée ancestrale sous pleine lune, cerisiers en fleurs avec chute de pétales, grand Torii rouge néon et lanternes traditionnelles luminescentes.
2. **Tokyo Cyber Rooftop** : Toit de gratte-ciel surplombant une métropole nocturne avec tours vitrées, hologrammes et reflets néons.
3. **Base Technologique H-8** : Hangar militaire automatisé avec arches blindées, conduits d'énergie cyan et ventilateurs industriels.
4. **Arène Volcanique** : Plateforme d'obsidienne noire au cœur d'un cratère en fusion avec brèches de lave incandescente et braises en suspension.

---

## 🎮 4. Contrôles et Maniabilité

Le jeu est optimisé pour les ordinateurs (clavier/manette) et les appareils mobiles / tablettes (commandes tactiles virtuelles).

### Commandes Clavier (PC) :
- **Déplacement gauche / droite** : Touches `A` / `D` ou `Flèches gauche / droite`
- **Garde / Blocage & Accroupissement** : Touche `S` ou `Flèche bas` (ou reculer face à l'adversaire)
- **Saut** : Touche `W` ou `Flèche haut`
- **Coup Rapide (Jab)** : Touche `J` ou `Z`
- **Coup Puissant (Crochet / Smash)** : Touche `K` ou `X`
- **Coup de Pied (Roundhouse)** : Touche `L` ou `C`
- **Coup Aérien (Jump Kick)** : Saut (`W`) puis `L`
- **Attaque Spéciale (Super Move)** : Touche `ESPACE` ou `U` (consomme 50% de la jauge d'énergie)
- **Pause** : Touche `Échap` (Escape)

### Commandes Tactiles (Mobile / Tablette / Écran tactile) :
- **Joystick Virtuel 8 Directions** (en bas à gauche) pour les déplacements, sauts et blocages.
- **Cluster de Boutons d'Action Circulaires** (en bas à droite) :
  - Bouton `JAB` (Coup rapide)
  - Bouton `POING LOURD` (Coup puissant)
  - Bouton `PIED` (Coup de pied)
  - Bouton `AIR` (Attaque aérienne)
  - Bouton `SUPER` (Déclenchement cinématique de la technique ultime)

---

## 🧠 5. Architecture Logicielle et Moteur de Jeu

- **Three.js PBR Engine** (`/src/game/graphics/`) :
  - Modèles 3D procéduraux composites (10+ pièces articulées avec cinématique directe, détection de recul, hit-flash blanc instantané et poses dynamiques).
  - Éclairage multi-points avec ombres portées douces (`PCFSoftShadowMap`), tone mapping `ACESFilmicToneMapping` et éclairage d'ambiance adapté à chaque arène.
  - Système de particules 3D dynamiques pour les étincelles d'impact, les étincelles de blocage et les braises atmosphériques.
- **Moteur de Combat** (`/src/game/combat/CombatEngine.ts`) :
  - Détection précise des hitboxes et hurtboxes selon les fenêtres de frames d'attaque.
  - Système de hitstop cinématique (30 à 80 ms de gel d'impact pour accentuer la lourdeur des coups).
  - Secousses de caméra dynamiques (`camera shake`) lors des frappes lourdes et super-attaques.
  - Multiplicateur et compteur de combos en temps réel.
- **Système d'Enregistrement & Théâtre de Replay** (`/src/game/combat/ReplayRecorder.ts` & `/src/game/graphics/ReplayEngine.ts`) :
  - **Enregistrement des séquences d'entrées** : capture horodatée de chaque action (déplacement, jab, smash, pied, super move, garde) pour le joueur et l'IA.
  - **Visualiseur de touches d'arcade (Input Stream)** : défilement en direct des boutons appuyés durant le combat.
  - **Lecteur de Replay 3D interactif** : curseur temporel (scrubbing), pause/lecture, vitesses variables (0.5x ralenti, 1.0x normal, 2.0x accéléré) et avance image par image.
  - Sauvegarde locale automatique des derniers matchs consultables à la fin d'un combat ou depuis l'écran d'accueil.
- **Intelligence Artificielle Locale** (`/src/game/combat/CombatAI.ts`) :
  - Évaluation de distance (zoning, corps à corps, mi-distance).
  - Gestion adaptative de la garde selon 3 niveaux de difficulté (`Facile`, `Normal`, `Difficile`).
  - Capacité à déclencher des enchaînements et des super-attaques lorsque la jauge d'énergie est remplie.
- **Synthèse Sonore Web Audio API** (`/src/audio/soundEngine.ts`) :
  - 100% autonome et procédurale (aucune dépendance à des fichiers audio externes qui risquent une erreur 404).
  - Bruits de coups, détonations sub-bass, cliquetis métalliques de garde, jingles d'annonce ("Round 1", "Fight!", "K.O.!") et musique synthwave arcade dynamique.

---

## 📱 6. Compilation et Déploiement

### Exécution en Développement Web
```bash
npm install
npm run dev
```
Ouvrez votre navigateur à l'adresse indiquée (ex: `http://localhost:3000`).

### Compilation Web de Production
```bash
npm run build
```
Les fichiers statiques optimisés seront générés dans le dossier `dist/`.

### Déploiement Mobile Android / iOS
Pour porter OCTACOMBAT sur mobile via Capacitor :
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init OCTACOMBAT com.octacombat.game
npm run build
npx cap add android
npx cap copy
npx cap open android
```
Ouvrez le projet dans Android Studio pour générer l'APK ou le bundle Google Play Store.
