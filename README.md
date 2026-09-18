# Velocity 3D: Highway Racer

A high-performance 3D highway car racing game built with Three.js, React, TypeScript, Tailwind CSS, and the Web Audio API.

## Features

- **3D Sports Cars**: 6 unlockable vehicles (Apex GT-R, Cyber Phantom, Vortex Hypersport, Nebula Roadster, Quantum Venom, Solaris Formula) with custom paint finishes, dynamic wheel rotations, active aero wings, LED headlights, taillight bars, and glowing underglow neon.
- **Dynamic Endless Highway**: 3-lane infinite procedural road chunks, reflective guardrails, overhead signboards, streetlight illumination, moving lane dashes, distant cyberpunk city skyline, and starry night atmosphere.
- **Dynamic Traffic AI**: Randomly spawned sedans, SUVs, delivery vans, and trucks with variable speeds, lane-change maneuvers, and safe obstacle spacing.
- **Near-Miss Scoring System**: Bonus points and auditory whoosh feedback for high-speed close overtakes.
- **Power-Ups**:
  - **Shield**: Absorbs 1 fatal collision with energy shockwave burst.
  - **Coin Magnet**: Gravitationally attracts coins across all lanes within an 18m radius.
  - **Nitro Boost**: Surges vehicle velocity with exhaust flame animations and speed lines.
  - **2X Multiplier**: Doubles score and coin earnings during run.
- **3 Game Modes**:
  1. *Endless Highway*: Survive as long as possible and post record scores.
  2. *Time Challenge*: Race against the clock and reach checkpoints to extend time.
  3. *Mission Run*: Complete distance, coin collection, top speed, and near-miss objectives.
- **Interactive Garage Showroom**: 360° rotating turntable inspection, performance spec comparison, custom color paint shop, and coin unlock system.
- **Web Audio Sound Synthesizer**: Procedural engine RPM harmonics, turbo flutter, nitro roar, coin chime, explosion crash rumble, shield deflection, and looping electronic synthwave soundtrack.
- **Responsive Controls**:
  - **Desktop**: `A`/`D` or Arrow keys to steer, `W`/`Up` to accelerate, `S`/`Down` to brake, `SPACE` for Nitro boost, `ESC` to pause.
  - **Mobile**: Large on-screen responsive touch buttons for left/right steering, brake pedal, big nitro button, and top-right pause button.
- **Local Persistence**: Saves high scores, coins, unlocked cars, custom colors, and mission progress to `localStorage`.

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Development Server

To launch the local development server:

```bash
npm run dev
```

The game will be running at `http://localhost:3000`.

### 3. Production Build

To compile and bundle optimized static assets:

```bash
npm run build
```

The production output will be generated in the `dist/` directory.

---

## Deployment Instructions

### Deploying to Vercel

1. Push the code to GitHub or GitLab.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **"Add New Project"**.
3. Import your repository.
4. Select the **Vite** framework preset (Build command: `npm run build`, Output directory: `dist`).
5. Click **"Deploy"**.

### Deploying to Netlify

1. Go to [Netlify Dashboard](https://www.netlify.com/) and click **"Add new site" > "Import an existing project"**.
2. Select your repository.
3. Configure Build Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **"Deploy site"**.
