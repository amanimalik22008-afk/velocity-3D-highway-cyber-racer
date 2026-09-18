import React from 'react';
import { GameSettings } from '../types';
import { audioManager } from '../audio/AudioManager';
import {
  Play,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Sliders,
} from 'lucide-react';

interface PauseModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  settings,
  onUpdateSettings,
  onResume,
  onRestart,
  onMainMenu,
}) => {
  const handleVolumeChange = (type: 'master' | 'music' | 'sfx', val: number) => {
    const updated = {
      ...settings,
      [`${type}Volume`]: val,
    };
    onUpdateSettings(updated);
  };

  const handleToggleMute = () => {
    audioManager.playClick();
    const updated = {
      ...settings,
      soundMuted: !settings.soundMuted,
    };
    onUpdateSettings(updated);
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 z-30 select-none">
      <div className="w-full max-w-md bg-neutral-950/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-center">
        <div>
          <h2 className="font-chakra font-black text-3xl text-white tracking-widest uppercase">
            RACE PAUSED
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Take a breather or tune your settings
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Resume */}
          <button
            id="pause-resume-btn"
            onClick={() => {
              audioManager.playClick();
              onResume();
            }}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-chakra font-bold text-lg rounded-2xl shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME RACE</span>
          </button>

          {/* Restart */}
          <button
            id="pause-restart-btn"
            onClick={() => {
              audioManager.playClick();
              onRestart();
            }}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-chakra font-semibold text-base rounded-2xl border border-neutral-700 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-cyan-400" />
            <span>RESTART RUN</span>
          </button>

          {/* Main Menu */}
          <button
            id="pause-menu-btn"
            onClick={() => {
              audioManager.playClick();
              onMainMenu();
            }}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-chakra font-semibold text-base rounded-2xl border border-neutral-700 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>MAIN MENU</span>
          </button>
        </div>

        {/* Audio Quick Sliders */}
        <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 flex flex-col gap-3 text-left">
          <div className="flex items-center justify-between">
            <span className="font-chakra font-bold text-xs text-neutral-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" /> Audio Settings
            </span>
            <button
              id="pause-mute-btn"
              onClick={handleToggleMute}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
            >
              {settings.soundMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
              <span>Master Volume</span>
              <span>{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
              <span>SFX Volume</span>
              <span>{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Speed & Steering Controls Cheat Sheet */}
        <div className="bg-neutral-900/40 p-3 rounded-2xl border border-neutral-800/80 text-left">
          <div className="text-[10px] font-chakra font-bold uppercase text-neutral-400 mb-1.5 tracking-wider">
            SPEED & DRIVING CONTROLS:
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-neutral-300">
            <div><strong className="text-emerald-400">[W / ↑ / GAS]</strong> Speed Up</div>
            <div><strong className="text-rose-400">[S / ↓ / BRAKE]</strong> Slow Down</div>
            <div><strong className="text-cyan-400">[SPACE / NITRO]</strong> Nitro Boost</div>
            <div><strong className="text-amber-400">[A / D / ← / →]</strong> Steer Left / Right</div>
          </div>
        </div>
      </div>
    </div>
  );
};
