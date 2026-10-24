# FRUIT MANIA ULTRA

A premium, mobile-first 5×3 fruit slot-style arcade game built with **React**, **TypeScript**, **Tailwind CSS**, and **Web Audio API**. Features 9 fixed paylines, high-gloss 3D vector SVG fruit symbols, Golden Wild Stars, Scatter Gem Bonus Round with 3 free spins and escalating multipliers, screen shake, and local storage persistence.

> **⚠️ IMPORTANT SAFETY REQUIREMENT**  
> This game is strictly a **FREE ENTERTAINMENT ARCADE GAME** using fictional virtual points only.  
> There is **NO REAL MONEY**, no deposits, no withdrawals, no betting, no cryptocurrency, and no cash prizes.  
> All points are fictional and have zero monetary value.

---

## 🎰 Game Highlights & Features

- **5×3 Animated Reel System**:
  - 5 vertical reels with realistic vertical motion blur during acceleration and deceleration.
  - Staggered reel stops (reels 1 through 5) with mechanical spring bounce landing (`animate-reel-bounce`).
  - Settling light wave animation when symbols settle into place.
- **High-Quality 3D Vector Fruit Symbols (`FruitSymbol3D.tsx`)**:
  - 🍓 **Strawberry**: Dimensional heart-conical shape, golden seeds with drop shadows, green calyx crown leaves.
  - 🍋 **Lemon**: 3D citrus oval with realistic volume, bright yellow radial gradients, and leaf.
  - 🍉 **Watermelon**: Triangular juicy slice with striped rind, mint inner layer, and 3D black seeds.
  - 🍇 **Grapes**: 11 overlapping 3D spherical purple grapes with individual specular light glints.
  - 🍊 **Orange**: Textured dimpled citrus surface with curved specular gloss arc and leaves.
  - 🍍 **Pineapple**: Diamond cross-hatch body with depth crevices and spiky tropical crown.
  - 🥝 **Kiwi**: Translucent emerald slice with radial rays, creamy core, and black seed ring.
  - ⭐ **Golden Wild Star**: 3D beveled 10-facet star with metallic reflections (substitutes for regular fruits on paylines).
  - 💎 **Glowing Scatter Gem**: Faceted brilliant-cut diamond with cyan neon halo (3+ activates Bonus Round).
- **9 Fixed Paylines Engine**:
  - Evaluated left-to-right starting from Reel 1 for 3 (small), 4 (medium), or 5 (large) matching consecutive symbols.
  - Line 1: Top Row `[0, 0, 0, 0, 0]`
  - Line 2: Middle Row `[1, 1, 1, 1, 1]`
  - Line 3: Bottom Row `[2, 2, 2, 2, 2]`
  - Line 4: Upper Zigzag `[1, 0, 1, 0, 1]`
  - Line 5: Lower Zigzag `[1, 2, 1, 2, 1]`
  - Line 6: V Shape `[0, 1, 2, 1, 0]`
  - Line 7: Inverted V `[2, 1, 0, 1, 2]`
  - Line 8: Upper Wave `[0, 1, 0, 1, 0]`
  - Line 9: Lower Wave `[2, 1, 2, 1, 2]`
- **Animated Win-Line Vector Overlay (`WinLineOverlay.tsx`)**:
  - Displays glowing neon spline paths connecting the matching symbols along winning lines.
- **Dynamic Multiplier System (2x, 3x, 5x, 10x)**:
  - Winning spins can trigger an animated Ultra Multiplier with transparent calculation display.
- **Dedicated Scatter Gem Bonus Round (`BonusRound.tsx`)**:
  - Triggered by 3+ Scatter Gems anywhere on the grid.
  - Awards 3 Free Bonus Spins (zero points deducted).
  - Multiplier grows during the round (2x ➔ 3x ➔ 5x ➔ 10x).
- **Web Audio API Sound Synthesizer (`audio.ts`)**:
  - 100% self-contained audio synthesis: button clicks, reel spinning whir, mechanical stop clunks, small win chimes, multiplier pops, and large win fanfare.
- **Player Progression & Session Tracking**:
  - Live session statistics (spins, points won, net).
  - Lifetime statistics (spins count, total won, best single win, peak balance).
  - Last 20 spins history log with timestamp, bet, multiplier, win, and net.
  - Daily Free Bonus (+2,500 points every 24h with countdown clock).
  - Free Refill Booster (+1,000 points) anytime balance runs low.
  - Reset Game Progress button with confirmation dialog.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Custom Keyframe Animations
- **Graphics**: High-Resolution Responsive Vector SVGs
- **Audio**: Web Audio API (zero external asset latency)
- **Effects**: Canvas Confetti
- **Icons**: Lucide React
- **Build Tool**: Vite 8

---

## 🚀 Running the Project Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `bun` or `yarn`

### 2. Installation
Extract the ZIP archive to your desired folder and open a terminal inside the project directory:

```bash
# Install dependencies
npm install
```

### 3. Start Local Development Server
```bash
npm run dev
```

Open your browser at `http://localhost:3000` (or the URL displayed in the terminal) to play immediately.

### 4. Build for Production
```bash
npm run build
```
This generates an optimized static production bundle in the `dist/` directory ready for deployment or mobile bundling.

---

## 📱 Converting to an Android APK (Capacitor & Android Studio)

Follow these step-by-step instructions to convert this web game into an installable Android APK:

### Step 1: Install Capacitor in the Project
In the root directory of the project, run:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Step 2: Initialize Capacitor
```bash
npx cap init "FRUIT MANIA ULTRA" "com.fruitmania.ultra" --web-dir dist
```

### Step 3: Build the Web Assets
```bash
npm run build
```

### Step 4: Add the Android Platform
```bash
npx cap add android
```
This generates a native `android/` project folder pre-configured with the Android manifest, gradle scripts, and WebView settings.

### Step 5: Sync Web Code to Native Project
```bash
npx cap sync
```

### Step 6: Open Project in Android Studio
```bash
npx cap open android
```

### Step 7: Build the APK in Android Studio
1. In Android Studio, wait for Gradle to finish syncing.
2. Select **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Once completed, a notification will appear with a **locate** link to your release or debug `.apk` file (e.g. `android/app/build/outputs/apk/debug/app-debug.apk`).
4. Transfer this `.apk` to any Android phone to install and play natively!

*(Optional: To publish on the Google Play Store, select **Build** > **Generate Signed Bundle / APK** and follow the prompts to sign your application.)*

---

## 📁 Project Structure

```
├── index.html                 # HTML Entry point with typography & meta tags
├── metadata.json              # Applet metadata & permissions
├── package.json               # Dependencies and scripts
├── public/
│   ├── icon.svg               # App & PWA icon
│   └── manifest.json          # Web app manifest
├── src/
│   ├── App.tsx                # Master game container & coordinator
│   ├── main.tsx               # Application bootstrap
│   ├── index.css              # Global styles, keyframe animations, & neon glow
│   ├── components/
│   │   ├── BonusRound.tsx     # Dedicated 3-spin Scatter Gem Bonus Round
│   │   ├── DailyBonusModal.tsx# 24h bonus claim modal with live countdown
│   │   ├── DisclaimerBanner.tsx# Free entertainment safety footer
│   │   ├── FruitSymbol3D.tsx  # High-gloss 3D vector SVG fruit symbols
│   │   ├── GameHeader.tsx     # Top marquee, points balance, and controls
│   │   ├── GameHistory.tsx    # Last 20 spins history & lifetime statistics
│   │   ├── PaytableModal.tsx  # Interactive 9 paylines diagram & payouts
│   │   ├── PointsDisplay.tsx  # Balance indicator with FREE GAME label
│   │   ├── Reel.tsx           # Individual reel column with blur & bounce
│   │   ├── ReelGrid.tsx       # 5x3 cabinet frame & reel coordinator
│   │   ├── RefillModal.tsx    # Instant +1,000 free points booster
│   │   ├── SettingsModal.tsx  # Sound, turbo, vibration, shake & reset
│   │   ├── SpinControls.tsx   # Bet chips, Max Bet, Auto Spin & Spin button
│   │   ├── WinCelebration.tsx # Big win / Jackpot confetti celebration
│   │   ├── WinDisplay.tsx     # Win banner with animated multiplier calculation
│   │   └── WinLineOverlay.tsx # Animated SVG spline paths for winning lines
│   ├── services/
│   │   ├── audio.ts           # Web Audio API sound synthesizer
│   │   └── storage.ts         # LocalStorage persistence & safety recovery
│   ├── types/
│   │   └── game.ts            # TypeScript interfaces & types
│   └── utils/
│       └── gameLogic.ts       # 9 paylines, symbols, payouts, & evaluator
├── tsconfig.json              # TypeScript compiler configuration
└── vite.config.ts             # Vite build configuration
```

---

## 📜 License
Strictly for free entertainment purposes. No real money or gambling involved.
