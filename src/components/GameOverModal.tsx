import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameOverData, PlayerProfile } from '../types';
import { DIFFICULTY_CONFIGS } from '../utils/difficultyData';
import { audioManager } from '../audio/AudioManager';
import {
  RotateCcw,
  Home,
  Car,
  Trophy,
  Coins,
  Flame,
  Award,
  ShieldCheck,
  Gauge,
  Zap,
} from 'lucide-react';

interface GameOverModalProps {
  data: GameOverData;
  profile: PlayerProfile;
  onRestart: () => void;
  onMainMenu: () => void;
  onOpenGarage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  data,
  profile,
  onRestart,
  onMainMenu,
  onOpenGarage,
}) => {
  useEffect(() => {
    if (data.isNewHighScore) {
      audioManager.playUnlock();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00e5ff', '#ffb700', '#9d00ff', '#ffffff'],
      });
    }
  }, [data.isNewHighScore]);

  const diffConfig = data.difficulty ? DIFFICULTY_CONFIGS[data.difficulty] : undefined;

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-30 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-neutral-950/95 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 text-center">
        {/* Header Title & Difficulty Pill */}
        <div>
          {data.isNewHighScore ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-chakra font-black text-xs sm:text-sm tracking-wider uppercase mb-3 shadow-[0_0_20px_rgba(255,183,0,0.5)] animate-bounce">
              <Trophy className="w-4 h-4" /> NEW RECORD HIGH SCORE!
            </div>
          ) : (
            <span className="text-xs font-mono font-bold text-rose-400 tracking-widest uppercase block mb-2">
              {data.reason === 'time_up'
                ? 'TIME EXPIRED'
                : data.reason === 'crashed'
                ? 'CHASSIS TOTALED'
                : 'RACE COMPLETED'}
            </span>
          )}

          <div className="flex items-center justify-center gap-3">
            <h2 className="font-chakra font-black text-3xl sm:text-4xl text-white tracking-wider uppercase">
              RACE REPORT
            </h2>
            {diffConfig && (
              <span className={`px-3 py-1 rounded-xl text-xs font-chakra font-black uppercase border ${diffConfig.bgColor} ${diffConfig.borderColor} ${diffConfig.textColor}`}>
                {diffConfig.label} ({diffConfig.badge})
              </span>
            )}
          </div>
        </div>

        {/* Final Score Hero */}
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 p-5 rounded-2xl border border-neutral-800 shadow-inner">
          <span className="text-xs font-chakra font-semibold text-neutral-400 uppercase tracking-widest">
            FINAL SCORE
          </span>
          <div className="font-chakra font-black text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-400 tracking-tight font-mono mt-1">
            {data.score.toLocaleString()}
          </div>
          <div className="text-xs font-mono text-neutral-400 mt-2">
            ALL-TIME BEST ({data.mode.toUpperCase()}): <strong className="text-cyan-400">{(profile.highScores[data.mode] || 0).toLocaleString()}</strong>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {/* Distance */}
          <div className="bg-neutral-900/60 p-3 sm:p-4 rounded-2xl border border-neutral-800">
            <span className="text-[10px] sm:text-xs font-chakra font-semibold text-neutral-400 uppercase block mb-1">
              DISTANCE
            </span>
            <div className="font-chakra font-bold text-base sm:text-xl text-white font-mono">
              {data.distanceMeters.toLocaleString()} <span className="text-xs text-neutral-400">m</span>
            </div>
          </div>

          {/* Coins Earned */}
          <div className="bg-neutral-900/60 p-3 sm:p-4 rounded-2xl border border-neutral-800">
            <span className="text-[10px] sm:text-xs font-chakra font-semibold text-neutral-400 uppercase block mb-1">
              COINS
            </span>
            <div className="font-chakra font-bold text-base sm:text-xl text-amber-300 font-mono flex items-center justify-center gap-1">
              <Coins className="w-4 h-4" />
              <span>+{data.coinsEarned.toLocaleString()}</span>
            </div>
          </div>

          {/* Near Misses */}
          <div className="bg-neutral-900/60 p-3 sm:p-4 rounded-2xl border border-neutral-800">
            <span className="text-[10px] sm:text-xs font-chakra font-semibold text-neutral-400 uppercase block mb-1">
              NEAR MISS
            </span>
            <div className="font-chakra font-bold text-base sm:text-xl text-cyan-400 font-mono flex items-center justify-center gap-1">
              <Flame className="w-4 h-4" />
              <span>{data.nearMissCount}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Play Again */}
          <button
            id="gameover-restart-btn"
            onClick={() => {
              audioManager.playClick();
              onRestart();
            }}
            className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-chakra font-bold text-base sm:text-lg rounded-2xl shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          {/* Garage */}
          <button
            id="gameover-garage-btn"
            onClick={() => {
              audioManager.playClick();
              onOpenGarage();
            }}
            className="px-6 py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-chakra font-bold text-base rounded-2xl border border-neutral-700 hover:border-cyan-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Car className="w-5 h-5 text-cyan-400" />
            <span>GARAGE</span>
          </button>

          {/* Main Menu */}
          <button
            id="gameover-menu-btn"
            onClick={() => {
              audioManager.playClick();
              onMainMenu();
            }}
            className="p-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Main Menu"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
