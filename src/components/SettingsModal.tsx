import React from 'react';
import { GameSettings, DifficultyLevel } from '../types';
import { DIFFICULTY_CONFIGS } from '../utils/difficultyData';
import { audioManager } from '../audio/AudioManager';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Tv,
  Eye,
  Keyboard,
  Smartphone,
  Sparkles,
  Gauge,
} from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleVolumeChange = (type: 'master' | 'music' | 'sfx', val: number) => {
    onUpdateSettings({
      ...settings,
      [`${type}Volume`]: val,
    });
  };

  const handleMuteToggle = () => {
    audioManager.playClick();
    onUpdateSettings({
      ...settings,
      soundMuted: !settings.soundMuted,
    });
  };

  const handleQualityChange = (quality: 'high' | 'medium' | 'low') => {
    audioManager.playClick();
    onUpdateSettings({
      ...settings,
      graphicsQuality: quality,
    });
  };

  const handleDifficultyChange = (diff: DifficultyLevel) => {
    audioManager.playClick();
    onUpdateSettings({
      ...settings,
      defaultDifficulty: diff,
    });
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-30 select-none">
      <div className="w-full max-w-lg bg-neutral-950/95 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-chakra font-bold text-2xl text-white tracking-wider">
                SETTINGS & TUNING
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Graphics, difficulty defaults, audio & controls
              </p>
            </div>
          </div>

          <button
            id="settings-close-btn"
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl border border-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Default Difficulty Section */}
        <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-chakra font-bold text-sm text-neutral-200 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" /> Default Difficulty
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              Traffic & Speed Aggression
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as const).map((d) => {
              const cfg = DIFFICULTY_CONFIGS[d];
              const isSelected = (settings.defaultDifficulty || 'medium') === d;
              return (
                <button
                  key={d}
                  onClick={() => handleDifficultyChange(d)}
                  className={`py-2.5 px-2 rounded-xl font-chakra font-bold text-xs uppercase border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.textColor} shadow-[0_0_12px_rgba(0,229,255,0.3)] ring-1 ring-white/20`
                      : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>{cfg.label}</span>
                  <span className="text-[10px] font-mono opacity-80">{cfg.badge} Bonus</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Section */}
        <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-chakra font-bold text-sm text-neutral-200 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" /> Sound & Volumes
            </span>
            <button
              onClick={handleMuteToggle}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              {settings.soundMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Active</span>
                </>
              )}
            </button>
          </div>

          {/* Master */}
          <div>
            <div className="flex justify-between text-xs font-mono text-neutral-400 mb-1">
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
              className="w-full accent-cyan-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* SFX */}
          <div>
            <div className="flex justify-between text-xs font-mono text-neutral-400 mb-1">
              <span>Sound Effects</span>
              <span>{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Music */}
          <div>
            <div className="flex justify-between text-xs font-mono text-neutral-400 mb-1">
              <span>Synthwave Soundtrack</span>
              <span>{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Graphics Quality */}
        <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 flex flex-col gap-3">
          <span className="font-chakra font-bold text-sm text-neutral-200 flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" /> Graphics Fidelity
          </span>

          <div className="grid grid-cols-3 gap-2">
            {(['high', 'medium', 'low'] as const).map((q) => (
              <button
                key={q}
                onClick={() => handleQualityChange(q)}
                className={`py-2.5 rounded-xl font-chakra font-bold text-xs uppercase border transition-all ${
                  settings.graphicsQuality === q
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                    : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                {q} {q === 'high' ? '• 60 FPS' : ''}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
            <span className="text-neutral-300">Camera Dynamic Shake</span>
            <input
              type="checkbox"
              checked={settings.cameraShake}
              onChange={(e) =>
                onUpdateSettings({ ...settings, cameraShake: e.target.checked })
              }
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Controls Reference */}
        <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 flex flex-col gap-2.5">
          <span className="font-chakra font-bold text-sm text-neutral-200 flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-cyan-400" /> Control Schemes
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-neutral-300 pt-1">
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-cyan-400 font-bold block mb-1">DESKTOP:</span>
              <div>• <strong>A / D</strong> or <strong>← / →</strong> : Steer</div>
              <div>• <strong>W / ↑</strong> : Accelerate</div>
              <div>• <strong>S / ↓</strong> : Brake</div>
              <div>• <strong>SPACE</strong> : Nitro Boost</div>
              <div>• <strong>ESC</strong> : Pause</div>
            </div>

            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
              <span className="text-cyan-400 font-bold block mb-1">MOBILE:</span>
              <div>• <strong>Left / Right Buttons</strong></div>
              <div>• <strong>Brake Pedal</strong></div>
              <div>• <strong>Big Nitro Button</strong></div>
              <div>• <strong>Pause Top-Right</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
