import React from 'react';
import { GameMode, PlayerProfile, DifficultyLevel } from '../types';
import { CARS_CATALOG } from '../utils/carsData';
import { DIFFICULTY_CONFIGS } from '../utils/difficultyData';
import { audioManager } from '../audio/AudioManager';
import {
  Play,
  Car,
  Target,
  Settings as SettingsIcon,
  Flame,
  Coins,
  Timer,
  Infinity as InfinityIcon,
  ShieldCheck,
  Gauge,
  Zap,
} from 'lucide-react';

interface MainMenuProps {
  profile: PlayerProfile;
  selectedMode: GameMode;
  selectedDifficulty: DifficultyLevel;
  onSelectMode: (mode: GameMode) => void;
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  onStartGame: (mode: GameMode, difficulty: DifficultyLevel) => void;
  onOpenGarage: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  selectedMode,
  selectedDifficulty,
  onSelectMode,
  onSelectDifficulty,
  onStartGame,
  onOpenGarage,
  onOpenMissions,
  onOpenSettings,
}) => {
  const currentCar = CARS_CATALOG.find((c) => c.id === profile.selectedCarId) || CARS_CATALOG[0];
  const unclaimedMissions = profile.missions.filter((m) => m.completed && !m.claimed).length;
  const currentDiffConfig = DIFFICULTY_CONFIGS[selectedDifficulty];

  const handlePlay = () => {
    audioManager.init();
    audioManager.playClick();
    onStartGame(selectedMode, selectedDifficulty);
  };

  const handleModeClick = (mode: GameMode) => {
    audioManager.playClick();
    onSelectMode(mode);
  };

  const handleDifficultyClick = (diff: DifficultyLevel) => {
    audioManager.playClick();
    onSelectDifficulty(diff);
  };

  const difficulties: { id: DifficultyLevel; icon: React.ReactNode; sub: string }[] = [
    {
      id: 'easy',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      sub: 'Relaxed Traffic',
    },
    {
      id: 'medium',
      icon: <Gauge className="w-4 h-4 text-amber-400" />,
      sub: 'Standard Flow',
    },
    {
      id: 'hard',
      icon: <Zap className="w-4 h-4 text-rose-400" />,
      sub: 'Rush Hour Rush',
    },
  ];

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-7 pointer-events-none z-10 select-none overflow-y-auto">
      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between pointer-events-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-400/40">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-chakra font-black text-xl sm:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
              VELOCITY 3D
            </h1>
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-widest text-cyan-400 uppercase">
              Highway Cyber Racer
            </p>
          </div>
        </div>

        {/* Currency & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Coins Display */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-neutral-800 shadow-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-chakra font-bold text-sm sm:text-base text-amber-300">
              {profile.coins.toLocaleString()}
            </span>
          </div>

          {/* Missions Button */}
          <button
            id="menu-missions-btn"
            onClick={() => {
              audioManager.playClick();
              onOpenMissions();
            }}
            className="relative p-2 sm:px-3 sm:py-2 bg-neutral-900/80 hover:bg-neutral-800 backdrop-blur-md rounded-xl border border-neutral-800 hover:border-cyan-500/50 transition-all flex items-center gap-1.5 text-neutral-200 hover:text-white group cursor-pointer"
          >
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-chakra text-xs sm:text-sm font-semibold">Missions</span>
            {unclaimedMissions > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-[10px] font-bold text-black flex items-center justify-center animate-bounce shadow-md">
                {unclaimedMissions}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            id="menu-settings-btn"
            onClick={() => {
              audioManager.playClick();
              onOpenSettings();
            }}
            aria-label="Game Settings"
            className="p-2 sm:p-2.5 bg-neutral-900/80 hover:bg-neutral-800 backdrop-blur-md rounded-xl border border-neutral-800 hover:border-cyan-500/50 transition-all text-neutral-300 hover:text-white cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Middle Active Car Badge */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-auto py-2">
        <div className="bg-neutral-900/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-neutral-800/80 flex items-center gap-2.5 shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
          <span className="font-chakra font-medium text-xs text-neutral-400 uppercase tracking-widest">
            Equipped:
          </span>
          <span className="font-chakra font-bold text-sm text-white tracking-wide">
            {currentCar.name}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
            {currentCar.tier}
          </span>
        </div>
      </div>

      {/* Bottom Control Hub */}
      <footer className="w-full max-w-4xl mx-auto flex flex-col gap-3 pointer-events-auto">
        {/* Difficulty Level Selector (EASY / MEDIUM / HARD) */}
        <div className="bg-neutral-950/85 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-neutral-800 shadow-xl">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-chakra font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>Select Difficulty Level</span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-neutral-400">
              Bonus: <strong className={currentDiffConfig.textColor}>{currentDiffConfig.badge} Score & Coins</strong>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {difficulties.map(({ id, icon, sub }) => {
              const cfg = DIFFICULTY_CONFIGS[id];
              const isSelected = selectedDifficulty === id;
              return (
                <button
                  key={id}
                  id={`diff-btn-${id}`}
                  onClick={() => handleDifficultyClick(id)}
                  className={`p-2 sm:p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? `${cfg.bgColor} ${cfg.borderColor} ring-1 ring-white/20 shadow-lg`
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/90'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5">
                      {icon}
                      <span className={`font-chakra font-black text-xs sm:text-sm tracking-wider ${isSelected ? cfg.textColor : 'text-white'}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/10 text-white' : 'text-neutral-400'}`}>
                      {cfg.badge}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-neutral-400 font-mono line-clamp-1">
                    {sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Game Mode Selector Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Mode 1: Endless */}
          <button
            id="mode-btn-endless"
            onClick={() => handleModeClick('endless')}
            className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between backdrop-blur-md cursor-pointer ${
              selectedMode === 'endless'
                ? 'bg-gradient-to-b from-cyan-950/80 to-neutral-900/90 border-cyan-400/80 shadow-[0_0_20px_rgba(0,229,255,0.25)] ring-1 ring-cyan-400'
                : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <InfinityIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedMode === 'endless' ? 'text-cyan-400' : 'text-neutral-400'}`} />
              <span className="text-[9px] sm:text-[11px] font-mono font-bold text-neutral-400">
                BEST: {profile.highScores.endless.toLocaleString()}
              </span>
            </div>
            <div>
              <h3 className="font-chakra font-bold text-xs sm:text-sm text-white">Endless Highway</h3>
              <p className="text-[10px] text-neutral-400 hidden sm:block">Dodge traffic & set the ultimate distance record.</p>
            </div>
          </button>

          {/* Mode 2: Time Trial */}
          <button
            id="mode-btn-timetrial"
            onClick={() => handleModeClick('time_trial')}
            className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between backdrop-blur-md cursor-pointer ${
              selectedMode === 'time_trial'
                ? 'bg-gradient-to-b from-amber-950/80 to-neutral-900/90 border-amber-400/80 shadow-[0_0_20px_rgba(255,183,0,0.25)] ring-1 ring-amber-400'
                : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Timer className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedMode === 'time_trial' ? 'text-amber-400' : 'text-neutral-400'}`} />
              <span className="text-[9px] sm:text-[11px] font-mono font-bold text-neutral-400">
                BEST: {profile.highScores.time_trial.toLocaleString()}
              </span>
            </div>
            <div>
              <h3 className="font-chakra font-bold text-xs sm:text-sm text-white">Time Challenge</h3>
              <p className="text-[10px] text-neutral-400 hidden sm:block">Hit distance checkpoints before clock runs out.</p>
            </div>
          </button>

          {/* Mode 3: Missions */}
          <button
            id="mode-btn-missions"
            onClick={() => handleModeClick('missions')}
            className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between backdrop-blur-md cursor-pointer ${
              selectedMode === 'missions'
                ? 'bg-gradient-to-b from-purple-950/80 to-neutral-900/90 border-purple-400/80 shadow-[0_0_20px_rgba(157,0,255,0.25)] ring-1 ring-purple-400'
                : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Target className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedMode === 'missions' ? 'text-purple-400' : 'text-neutral-400'}`} />
              <span className="text-[9px] sm:text-[11px] font-mono font-bold text-neutral-400">
                BEST: {profile.highScores.missions.toLocaleString()}
              </span>
            </div>
            <div>
              <h3 className="font-chakra font-bold text-xs sm:text-sm text-white">Mission Run</h3>
              <p className="text-[10px] text-neutral-400 hidden sm:block">Complete in-run challenges & coin bounties.</p>
            </div>
          </button>
        </div>

        {/* Primary Action Row */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {/* Garage Entry */}
          <button
            id="menu-garage-btn"
            onClick={() => {
              audioManager.playClick();
              onOpenGarage();
            }}
            className="col-span-1 py-3.5 sm:py-4.5 bg-neutral-900/90 hover:bg-neutral-800 backdrop-blur-md border border-neutral-700 hover:border-cyan-500 rounded-2xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 group shadow-lg cursor-pointer"
          >
            <Car className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-chakra font-bold text-xs sm:text-base text-white">Garage</span>
          </button>

          {/* Large Start Race Button */}
          <button
            id="menu-play-btn"
            onClick={handlePlay}
            className="col-span-3 py-3.5 sm:py-4.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-chakra font-black text-base sm:text-2xl rounded-2xl shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:shadow-[0_0_45px_rgba(0,229,255,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 sm:gap-3 border border-cyan-300/40 group cursor-pointer"
          >
            <Play className="w-5 h-5 sm:w-7 sm:h-7 fill-current group-hover:scale-110 transition-transform" />
            <span className="tracking-wider">
              START RACE • <span className={currentDiffConfig.textColor}>{currentDiffConfig.label}</span>
            </span>
          </button>
        </div>

        {/* Keyboard Quick Hint (Desktop) */}
        <div className="hidden sm:flex items-center justify-center gap-5 text-[11px] font-mono text-neutral-400">
          <span><strong className="text-cyan-400">[A / D]</strong> or <strong className="text-cyan-400">[← / →]</strong> Steer</span>
          <span><strong className="text-cyan-400">[W / ↑]</strong> Accelerate</span>
          <span><strong className="text-cyan-400">[S / ↓]</strong> Brake</span>
          <span><strong className="text-cyan-400">[SPACE]</strong> Nitro Boost</span>
          <span><strong className="text-cyan-400">[ESC]</strong> Pause</span>
        </div>
      </footer>
    </div>
  );
};
