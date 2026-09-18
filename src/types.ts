export type GameState = 
  | 'LOADING'
  | 'MENU'
  | 'GARAGE'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAMEOVER'
  | 'SETTINGS'
  | 'MISSIONS';

export type GameMode = 'endless' | 'time_trial' | 'missions';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  badge: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  scoreMultiplier: number;
  coinMultiplier: number;
  spawnInterval: number;
  trafficBaseSpeedMin: number;
  trafficBaseSpeedMax: number;
  laneChangeProbability: number;
  collisionForgiveness: number;
  timeTrialStartTime: number;
  timeTrialCheckpointBonus: number;
  description: string;
}

export type PowerUpType = 'magnet' | 'shield' | 'boost' | 'multiplier';

export interface CarStats {
  topSpeed: number; // in km/h (e.g., 200 - 320)
  acceleration: number; // 1-10
  handling: number; // 1-10 (lane change speed & responsiveness)
  nitroCapacity: number; // 1-10 (duration & refill speed)
}

export interface CarData {
  id: string;
  name: string;
  tier: 'STREET' | 'SPORT' | 'HYPER' | 'PROTOTYPE';
  description: string;
  price: number;
  unlocked: boolean;
  stats: CarStats;
  primaryColor: string;
  availableColors: string[];
  underglowColor: string;
  modelType: 'coupe' | 'supercar' | 'hypercar' | 'roadster' | 'gt' | 'prototype';
}

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number; // initial duration in seconds
  remaining: number; // remaining in seconds
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: 'distance' | 'coins' | 'near_miss' | 'speed' | 'survive';
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
}

export interface PlayerProfile {
  coins: number;
  selectedCarId: string;
  selectedDifficulty: DifficultyLevel;
  customCarColors: Record<string, string>; // carId -> hex color
  unlockedCarIds: string[];
  highScores: {
    endless: number;
    time_trial: number;
    missions: number;
  };
  bestDistances: {
    endless: number;
    time_trial: number;
    missions: number;
  };
  totalGamesPlayed: number;
  totalDistanceTraveled: number;
  totalCoinsCollected: number;
  totalNearMisses: number;
  missions: Mission[];
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  soundMuted: boolean;
  graphicsQuality: 'high' | 'medium' | 'low';
  cameraShake: boolean;
  motionBlur: boolean;
  controlType: 'touch_buttons' | 'tilt' | 'keyboard_arrows' | 'keyboard_wasd';
  cameraView: 'chase' | 'far' | 'hood';
  defaultDifficulty: DifficultyLevel;
}

export interface GameTelemetry {
  speedKmh: number;
  distanceMeters: number;
  score: number;
  coinsEarned: number;
  nitroPercent: number;
  isNitroActive: boolean;
  shieldActive: boolean;
  magnetActive: boolean;
  multiplierActive: boolean;
  nearMissCount: number;
  currentMultiplier: number;
  difficulty: DifficultyLevel;
  timeRemaining?: number; // for time_trial mode
  targetDistance?: number;
  activePowerUps: ActivePowerUp[];
}

export interface GameOverData {
  mode: GameMode;
  difficulty: DifficultyLevel;
  score: number;
  distanceMeters: number;
  coinsEarned: number;
  nearMissCount: number;
  isNewHighScore: boolean;
  reason: 'crashed' | 'time_up' | 'mission_failed' | 'mission_complete';
}
