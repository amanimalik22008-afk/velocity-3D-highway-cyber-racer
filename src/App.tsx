import React, { useEffect, useRef, useState } from 'react';
import {
  GameState,
  GameMode,
  GameTelemetry,
  GameOverData,
  PlayerProfile,
  GameSettings,
  CarData,
  DifficultyLevel,
} from './types';
import { CARS_CATALOG } from './utils/carsData';
import {
  loadPlayerProfile,
  savePlayerProfile,
  loadGameSettings,
  saveGameSettings,
} from './utils/storage';
import { GameEngine } from './game/GameEngine';
import { audioManager } from './audio/AudioManager';

// UI Components
import { MainMenu } from './components/MainMenu';
import { Garage } from './components/Garage';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { MissionsModal } from './components/MissionsModal';
import { SettingsModal } from './components/SettingsModal';

// Expose catalog to window for engine helper
(window as any).__CARS_CATALOG = CARS_CATALOG;

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Core App State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedMode, setSelectedMode] = useState<GameMode>('endless');
  const [profile, setProfile] = useState<PlayerProfile>(loadPlayerProfile);
  const [settings, setSettings] = useState<GameSettings>(loadGameSettings);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(
    () => profile.selectedDifficulty || settings.defaultDifficulty || 'medium'
  );

  // In-Game Telemetry State
  const [telemetry, setTelemetry] = useState<GameTelemetry>({
    speedKmh: 0,
    distanceMeters: 0,
    score: 0,
    coinsEarned: 0,
    nitroPercent: 100,
    isNitroActive: false,
    shieldActive: false,
    magnetActive: false,
    multiplierActive: false,
    nearMissCount: 0,
    currentMultiplier: 1.0,
    difficulty: 'medium',
    activePowerUps: [],
  });

  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const [nearMissPopups, setNearMissPopups] = useState<{ id: number; text: string }[]>([]);

  // 1. Initialize GameEngine once
  useEffect(() => {
    if (!containerRef.current || engineRef.current) return;

    const engine = new GameEngine(containerRef.current, profile, settings, {
      onTelemetry: (t) => setTelemetry(t),
      onGameOver: (data) => {
        setGameOverData(data);
        setGameState('GAMEOVER');
      },
      onStateChange: (s) => setGameState(s),
      onNearMissPopup: (pts) => {
        const id = Date.now() + Math.random();
        setNearMissPopups((prev) => [...prev, { id, text: `NEAR MISS! +${pts} PTS` }]);
        setTimeout(() => {
          setNearMissPopups((prev) => prev.filter((p) => p.id !== id));
        }, 1200);
      },
      onProfileUpdate: (p) => setProfile({ ...p }),
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // 2. Sync Settings Changes
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveGameSettings(newSettings);
    if (engineRef.current) {
      engineRef.current.updateSettings(newSettings);
    }
  };

  // 3. Sync Profile Changes
  const handleUpdateProfile = (newProfile: PlayerProfile) => {
    setProfile(newProfile);
    savePlayerProfile(newProfile);
    if (engineRef.current) {
      engineRef.current.updateProfile(newProfile);
    }
  };

  // 4. Keyboard Controls Handler (Desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent page scrolling on arrow keys / space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          handlePause();
        } else if (gameState === 'PAUSED') {
          handleResume();
        }
        return;
      }

      if (!engineRef.current || gameState !== 'PLAYING') return;
      const player = engineRef.current.playerCar;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        player.inputSteer = -1;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        player.inputSteer = 1;
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        player.inputThrottle = true;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        player.inputBrake = true;
      } else if (e.code === 'Space') {
        player.inputNitro = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current || gameState !== 'PLAYING') return;
      const player = engineRef.current.playerCar;

      if (
        (e.code === 'ArrowLeft' || e.code === 'KeyA') &&
        player.inputSteer < 0
      ) {
        player.inputSteer = 0;
      } else if (
        (e.code === 'ArrowRight' || e.code === 'KeyD') &&
        player.inputSteer > 0
      ) {
        player.inputSteer = 0;
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        player.inputThrottle = false;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        player.inputBrake = false;
      } else if (e.code === 'Space') {
        player.inputNitro = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Game Flow Actions
  const handleSelectDifficulty = (diff: DifficultyLevel) => {
    setSelectedDifficulty(diff);
    const updated = { ...profile, selectedDifficulty: diff };
    setProfile(updated);
    savePlayerProfile(updated);
    if (engineRef.current) {
      engineRef.current.setDifficulty(diff);
    }
  };

  const handleStartGame = (mode: GameMode, difficulty?: DifficultyLevel) => {
    const diff = difficulty || selectedDifficulty;
    setSelectedMode(mode);
    setSelectedDifficulty(diff);
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.startNewGame(mode, diff);
    }
  };

  const handlePause = () => {
    setGameState('PAUSED');
    if (engineRef.current) {
      engineRef.current.setState('PAUSED');
    }
  };

  const handleResume = () => {
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.setState('PLAYING', selectedMode);
    }
  };

  const handleRestart = () => {
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.startNewGame(selectedMode, selectedDifficulty);
    }
  };

  const handleMainMenu = () => {
    setGameState('MENU');
    if (engineRef.current) {
      engineRef.current.setState('MENU');
    }
  };

  const handleOpenGarage = () => {
    setGameState('GARAGE');
    if (engineRef.current) {
      engineRef.current.setState('GARAGE');
    }
  };

  const handleSelectCarInEngine = (car: CarData, customColor?: string) => {
    if (engineRef.current) {
      engineRef.current.selectCar(car, customColor);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none">
      {/* 3D WebGL Canvas Layer */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Speed Lines Vignette Overlay when at high speeds */}
      {telemetry.isNitroActive && gameState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none z-[5] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-cyan-950/20 to-cyan-500/25 animate-pulse" />
      )}

      {/* UI States Overlay */}
      {gameState === 'MENU' && (
        <MainMenu
          profile={profile}
          selectedMode={selectedMode}
          selectedDifficulty={selectedDifficulty}
          onSelectMode={setSelectedMode}
          onSelectDifficulty={handleSelectDifficulty}
          onStartGame={handleStartGame}
          onOpenGarage={handleOpenGarage}
          onOpenMissions={() => setGameState('MISSIONS')}
          onOpenSettings={() => setGameState('SETTINGS')}
        />
      )}

      {gameState === 'GARAGE' && (
        <Garage
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onSelectCarInEngine={handleSelectCarInEngine}
          onClose={handleMainMenu}
        />
      )}

      {gameState === 'PLAYING' && (
        <GameHUD
          telemetry={telemetry}
          mode={selectedMode}
          nearMissPopups={nearMissPopups}
          onPause={handlePause}
          onSteer={(dir) => {
            if (engineRef.current) {
              engineRef.current.playerCar.inputSteer = dir;
            }
          }}
          onThrottle={(active) => {
            if (engineRef.current) {
              engineRef.current.playerCar.inputThrottle = active;
            }
          }}
          onBrake={(active) => {
            if (engineRef.current) {
              engineRef.current.playerCar.inputBrake = active;
            }
          }}
          onNitro={(active) => {
            if (engineRef.current) {
              engineRef.current.playerCar.inputNitro = active;
            }
          }}
          onShiftLane={(dir) => {
            if (engineRef.current) {
              engineRef.current.playerCar.shiftLane(dir);
            }
          }}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {gameState === 'GAMEOVER' && gameOverData && (
        <GameOverModal
          data={gameOverData}
          profile={profile}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          onOpenGarage={handleOpenGarage}
        />
      )}

      {gameState === 'MISSIONS' && (
        <MissionsModal
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setGameState('MENU')}
        />
      )}

      {gameState === 'SETTINGS' && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setGameState('MENU')}
        />
      )}
    </div>
  );
}
