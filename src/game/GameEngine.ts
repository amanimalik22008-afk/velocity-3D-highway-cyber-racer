import * as THREE from 'three';
import {
  CarData,
  GameMode,
  GameState,
  GameTelemetry,
  GameOverData,
  PlayerProfile,
  GameSettings,
  PowerUpType,
  DifficultyLevel,
} from '../types';
import { DIFFICULTY_CONFIGS } from '../utils/difficultyData';
import { PlayerCar } from './PlayerCar';
import { RoadEnvironment } from './RoadEnvironment';
import { TrafficManager } from './TrafficManager';
import { CoinManager } from './CoinManager';
import { PowerUpManager } from './PowerUpManager';
import { ParticleSystem } from './ParticleSystem';
import { audioManager } from '../audio/AudioManager';
import { savePlayerProfile } from '../utils/storage';

export interface GameEngineCallbacks {
  onTelemetry: (telemetry: GameTelemetry) => void;
  onGameOver: (data: GameOverData) => void;
  onStateChange: (state: GameState) => void;
  onNearMissPopup: (pts: number) => void;
  onProfileUpdate: (profile: PlayerProfile) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Subsystems
  public playerCar: PlayerCar;
  public roadEnv: RoadEnvironment;
  public trafficManager: TrafficManager;
  public coinManager: CoinManager;
  public powerUpManager: PowerUpManager;
  public particleSystem: ParticleSystem;

  // Game Loop
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private currentState: GameState = 'MENU';
  private currentMode: GameMode = 'endless';
  private currentDifficulty: DifficultyLevel = 'medium';

  // State Variables
  public profile: PlayerProfile;
  public settings: GameSettings;
  private score: number = 0;
  private distanceTraveled: number = 0;
  private coinsEarnedThisRun: number = 0;
  private nearMissCountThisRun: number = 0;
  private startZ: number = 0;
  private nextCoinSpawnZ: number = -40;
  private nextPowerUpSpawnZ: number = -150;
  private difficultyMultiplier: number = 1.0;

  // Time Trial Mode
  private timeRemaining: number = 35.0;
  private nextCheckpointDistance: number = 500;

  // Camera Dynamics
  private cameraOffset = new THREE.Vector3(0, 3.2, 7.5);
  private cameraLookOffset = new THREE.Vector3(0, 1.2, -6.0);
  private cameraShakeIntensity: number = 0;
  private baseFov: number = 62;

  // Showroom / Garage turntable
  private garageAngle: number = 0;

  constructor(
    container: HTMLElement,
    profile: PlayerProfile,
    settings: GameSettings,
    callbacks: GameEngineCallbacks
  ) {
    this.container = container;
    this.profile = profile;
    this.settings = settings;
    this.callbacks = callbacks;
    this.currentDifficulty = profile.selectedDifficulty || settings.defaultDifficulty || 'medium';

    // 1. Setup Three.js Scene
    this.scene = new THREE.Scene();

    // 2. Setup Camera
    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 800);
    this.camera.position.set(0, 3.2, 7.5);

    // 3. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.graphicsQuality === 'high' ? 2 : 1.5));
    this.renderer.shadowMap.enabled = settings.graphicsQuality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 4. Initialize Game Subsystems
    this.particleSystem = new ParticleSystem(this.scene);
    this.roadEnv = new RoadEnvironment(this.scene);

    const initialCarData = this.getSelectedCarData();
    const customColor = this.profile.customCarColors[this.profile.selectedCarId];
    this.playerCar = new PlayerCar(this.scene, initialCarData, this.particleSystem, customColor);

    this.trafficManager = new TrafficManager(this.scene);
    this.trafficManager.setDifficulty(DIFFICULTY_CONFIGS[this.currentDifficulty]);
    this.coinManager = new CoinManager(this.scene, this.particleSystem);
    this.powerUpManager = new PowerUpManager(this.scene, this.particleSystem);

    // 5. Setup Window Resize Observer
    window.addEventListener('resize', this.handleResize);

    // Start rendering loop
    this.startLoop();
  }

  public getSelectedCarData(): CarData {
    // Import from catalog dynamically or retrieve
    const catalog = (window as any).__CARS_CATALOG || [];
    const found = catalog.find((c: CarData) => c.id === this.profile.selectedCarId);
    if (found) return found;
    // Fallback
    return {
      id: 'apex-gtr',
      name: 'Apex GT-R',
      tier: 'STREET',
      description: 'A finely tuned street warrior with rapid cornering response.',
      price: 0,
      unlocked: true,
      stats: { topSpeed: 210, acceleration: 6.5, handling: 7.5, nitroCapacity: 6.0 },
      primaryColor: '#00e5ff',
      availableColors: ['#00e5ff', '#ff0055', '#ffaa00', '#ffffff'],
      underglowColor: '#00e5ff',
      modelType: 'gt',
    };
  }

  public handleResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public updateSettings(settings: GameSettings) {
    this.settings = settings;
    audioManager.updateSettings(
      settings.masterVolume,
      settings.musicVolume,
      settings.sfxVolume,
      settings.soundMuted
    );
    this.renderer.shadowMap.enabled = settings.graphicsQuality === 'high';
  }

  public updateProfile(profile: PlayerProfile) {
    this.profile = profile;
    savePlayerProfile(profile);
    this.callbacks.onProfileUpdate(profile);
  }

  public setDifficulty(difficulty: DifficultyLevel) {
    this.currentDifficulty = difficulty;
    const diffConfig = DIFFICULTY_CONFIGS[difficulty];
    this.trafficManager.setDifficulty(diffConfig);
    if (this.profile.selectedDifficulty !== difficulty) {
      this.updateProfile({
        ...this.profile,
        selectedDifficulty: difficulty,
      });
    }
  }

  public selectCar(carData: CarData, customColor?: string) {
    this.playerCar.setCar(carData, customColor);
  }

  public setState(state: GameState, mode: GameMode = 'endless') {
    this.currentState = state;
    this.currentMode = mode;
    this.callbacks.onStateChange(state);

    if (state === 'PLAYING') {
      audioManager.init();
      audioManager.startEngine();
      audioManager.startMusic();
    } else if (state === 'PAUSED') {
      audioManager.stopEngine();
    } else if (state === 'MENU' || state === 'GARAGE') {
      audioManager.stopEngine();
      audioManager.stopNitroSound();
    } else if (state === 'GAMEOVER') {
      audioManager.stopEngine();
      audioManager.stopNitroSound();
    }
  }

  public startNewGame(mode: GameMode = 'endless', difficulty?: DifficultyLevel) {
    if (difficulty) {
      this.currentDifficulty = difficulty;
    }
    const diffConfig = DIFFICULTY_CONFIGS[this.currentDifficulty];

    this.currentMode = mode;
    this.score = 0;
    this.distanceTraveled = 0;
    this.coinsEarnedThisRun = 0;
    this.nearMissCountThisRun = 0;
    this.difficultyMultiplier = 1.0;
    this.startZ = 0;
    this.nextCoinSpawnZ = -40;
    this.nextPowerUpSpawnZ = -120;
    this.timeRemaining = mode === 'time_trial' ? diffConfig.timeTrialStartTime : 0;
    this.nextCheckpointDistance = 500;

    // Reset components
    this.playerCar.reset(0);
    this.roadEnv.reset(0);
    this.trafficManager.setDifficulty(diffConfig);
    this.trafficManager.reset();
    this.coinManager.reset();
    this.powerUpManager.reset();
    this.particleSystem.clear();

    this.setState('PLAYING', mode);
  }

  private startLoop() {
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (time: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((time - this.lastTime) / 1000, 0.1); // Clamp delta time to avoid large jumps
      this.lastTime = time;

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private update(dt: number) {
    if (this.currentState === 'PLAYING') {
      this.updateGameplay(dt);
    } else if (this.currentState === 'GARAGE' || this.currentState === 'MENU') {
      this.updateShowroom(dt);
    }
  }

  private updateShowroom(dt: number) {
    // Elegant rotating camera around player car for showroom presentation
    this.garageAngle += dt * 0.5;
    const radius = 6.8;
    this.camera.position.x = Math.sin(this.garageAngle) * radius;
    this.camera.position.z = Math.cos(this.garageAngle) * radius;
    this.camera.position.y = 2.4;
    this.camera.lookAt(0, 0.6, 0);

    // Subtle floating wheel spin in garage
    this.playerCar.meshContainer.wheels.forEach((w) => {
      w.rotation.x += dt * 0.6;
    });

    this.particleSystem.update(dt);
  }

  private updateGameplay(dt: number) {
    const diffConfig = DIFFICULTY_CONFIGS[this.currentDifficulty];

    // 1. Update Player Car physics
    this.playerCar.update(dt);

    // 2. Distance Traveled & Difficulty
    const distanceMeters = Math.floor(Math.abs(this.playerCar.position.z));
    this.distanceTraveled = distanceMeters;
    this.difficultyMultiplier = 1.0 + (this.distanceTraveled / 1200) * 0.65;

    // 3. Time Trial Clock
    if (this.currentMode === 'time_trial') {
      this.timeRemaining -= dt;
      if (this.distanceTraveled >= this.nextCheckpointDistance) {
        this.nextCheckpointDistance += 500;
        this.timeRemaining += diffConfig.timeTrialCheckpointBonus; // Bonus time based on difficulty
        audioManager.playPowerUp();
      }

      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.handleGameOver('time_up');
        return;
      }
    }

    // 4. Multiplier and Score Calculation
    const isMultiplierActive = this.playerCar.hasPowerUp('multiplier');
    const powerUpMultiplier = isMultiplierActive ? 2.0 : 1.0;
    const totalScoreMultiplier = powerUpMultiplier * diffConfig.scoreMultiplier;
    const speedKmh = Math.floor(this.playerCar.currentSpeed * 3.6);

    // Score gains proportional to speed & distance & difficulty multiplier
    const speedScore = (this.playerCar.currentSpeed * 0.45 * totalScoreMultiplier) * dt * 10;
    this.score += speedScore;

    // 5. Update Road & Environment
    const speedRatio = this.playerCar.currentSpeed / this.playerCar.maxSpeed;
    this.roadEnv.update(this.playerCar.position.z, speedRatio, this.playerCar.isNitroActive);

    // 6. Update Traffic
    this.trafficManager.update(
      dt,
      this.playerCar.position,
      this.playerCar.currentSpeed,
      this.difficultyMultiplier,
      (nearMissPts) => {
        const awarded = Math.round(nearMissPts * totalScoreMultiplier);
        this.score += awarded;
        this.nearMissCountThisRun++;
        this.cameraShakeIntensity = 0.3;
        this.callbacks.onNearMissPopup(awarded);
        this.checkMissionProgress('near_miss', 1);
      }
    );

    // 7. Check Traffic Collision
    const collidedCar = this.trafficManager.checkCollision(this.playerCar.position);
    if (collidedCar) {
      if (this.playerCar.hasPowerUp('shield')) {
        // Shield absorbs impact!
        this.playerCar.removePowerUp('shield');
        this.particleSystem.emitShieldShockwave(this.playerCar.position);
        audioManager.playShieldDeflect();
        this.trafficManager.despawnCar(collidedCar);
        this.cameraShakeIntensity = 0.8;
      } else {
        // Unshielded crash -> Game Over
        this.particleSystem.emitCrash(this.playerCar.position);
        audioManager.playCrash();
        this.cameraShakeIntensity = 1.5;
        this.handleGameOver('crashed');
        return;
      }
    }

    // 8. Spawning Coins
    if (this.playerCar.position.z < this.nextCoinSpawnZ) {
      this.coinManager.spawnCoinRow(this.playerCar.position.z - 60, Math.floor(3 + Math.random() * 4));
      this.nextCoinSpawnZ = this.playerCar.position.z - (45 + Math.random() * 30);
    }

    this.coinManager.update(
      dt,
      this.playerCar.position,
      this.playerCar.hasPowerUp('magnet'),
      () => {
        const coinVal = Math.round(1 * diffConfig.coinMultiplier);
        this.coinsEarnedThisRun += coinVal;
        this.score += 50 * totalScoreMultiplier;
        this.checkMissionProgress('coins', 1);
      }
    );

    // 9. Spawning Power-Ups
    if (this.playerCar.position.z < this.nextPowerUpSpawnZ) {
      this.powerUpManager.spawnPowerUp(this.playerCar.position.z - 75);
      this.nextPowerUpSpawnZ = this.playerCar.position.z - (120 + Math.random() * 80);
    }

    this.powerUpManager.update(dt, this.playerCar.position, (type: PowerUpType) => {
      this.playerCar.addPowerUp(type, 10);
    });

    // 10. Update Particles
    this.particleSystem.update(dt);

    // 11. Check missions: speed & distance
    if (speedKmh >= 240) {
      this.checkMissionProgress('speed', speedKmh);
    }
    this.checkMissionProgress('distance', this.distanceTraveled);

    // 12. Dynamic Camera Tracking with Speed FOV & Shake
    this.updateCamera(dt, speedRatio);

    // 13. Telemetry Broadcast to React UI
    this.callbacks.onTelemetry({
      speedKmh,
      distanceMeters: this.distanceTraveled,
      score: Math.floor(this.score),
      coinsEarned: this.coinsEarnedThisRun,
      nitroPercent: this.playerCar.nitroPercent,
      isNitroActive: this.playerCar.isNitroActive,
      shieldActive: this.playerCar.hasPowerUp('shield'),
      magnetActive: this.playerCar.hasPowerUp('magnet'),
      multiplierActive: isMultiplierActive,
      nearMissCount: this.nearMissCountThisRun,
      currentMultiplier: totalScoreMultiplier,
      difficulty: this.currentDifficulty,
      timeRemaining: this.currentMode === 'time_trial' ? Math.max(0, this.timeRemaining) : undefined,
      targetDistance: this.currentMode === 'time_trial' ? this.nextCheckpointDistance : undefined,
      activePowerUps: [...this.playerCar.activePowerUps],
    });
  }

  private updateCamera(dt: number, speedRatio: number) {
    const pPos = this.playerCar.position;

    // Dynamic FOV expands at extreme speeds
    const targetFov = this.baseFov + speedRatio * 14 + (this.playerCar.isNitroActive ? 12 : 0);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.1);
    this.camera.updateProjectionMatrix();

    // Camera follow position
    const targetCamX = pPos.x * 0.65;
    const targetCamY = pPos.y + this.cameraOffset.y + (this.playerCar.isNitroActive ? -0.2 : 0);
    const targetCamZ = pPos.z + this.cameraOffset.z + speedRatio * 1.5;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 0.12);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, 0.12);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, 0.18);

    // Camera Shake
    if (this.cameraShakeIntensity > 0 && this.settings.cameraShake) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 2.5);
    }

    // Camera LookAt
    const lookTarget = new THREE.Vector3(
      pPos.x * 0.4,
      pPos.y + this.cameraLookOffset.y,
      pPos.z + this.cameraLookOffset.z
    );
    this.camera.lookAt(lookTarget);
  }

  private checkMissionProgress(category: string, value: number) {
    let changed = false;
    const updatedMissions = this.profile.missions.map((m) => {
      if (m.completed || m.category !== category) return m;

      let newCurrent = m.current;
      if (category === 'speed') {
        newCurrent = Math.max(m.current, value);
      } else if (category === 'distance') {
        newCurrent = Math.max(m.current, value);
      } else {
        newCurrent = m.current + value;
      }

      const completed = newCurrent >= m.target;
      if (completed !== m.completed || newCurrent !== m.current) {
        changed = true;
        return { ...m, current: newCurrent, completed };
      }
      return m;
    });

    if (changed) {
      this.profile = { ...this.profile, missions: updatedMissions };
      this.updateProfile(this.profile);
    }
  }

  private handleGameOver(reason: 'crashed' | 'time_up' | 'mission_failed' | 'mission_complete') {
    this.setState('GAMEOVER', this.currentMode);

    const finalScore = Math.floor(this.score);
    const prevBest = this.profile.highScores[this.currentMode] || 0;
    const isNewHighScore = finalScore > prevBest;

    // Update Profile statistics
    const updatedHighScores = {
      ...this.profile.highScores,
      [this.currentMode]: Math.max(prevBest, finalScore),
    };

    const updatedBestDistances = {
      ...this.profile.bestDistances,
      [this.currentMode]: Math.max(
        this.profile.bestDistances[this.currentMode] || 0,
        this.distanceTraveled
      ),
    };

    const updatedProfile: PlayerProfile = {
      ...this.profile,
      coins: this.profile.coins + this.coinsEarnedThisRun,
      highScores: updatedHighScores,
      bestDistances: updatedBestDistances,
      totalGamesPlayed: this.profile.totalGamesPlayed + 1,
      totalDistanceTraveled: this.profile.totalDistanceTraveled + this.distanceTraveled,
      totalCoinsCollected: this.profile.totalCoinsCollected + this.coinsEarnedThisRun,
      totalNearMisses: this.profile.totalNearMisses + this.nearMissCountThisRun,
    };

    this.updateProfile(updatedProfile);

    this.callbacks.onGameOver({
      mode: this.currentMode,
      difficulty: this.currentDifficulty,
      score: finalScore,
      distanceMeters: this.distanceTraveled,
      coinsEarned: this.coinsEarnedThisRun,
      nearMissCount: this.nearMissCountThisRun,
      isNewHighScore,
      reason,
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    audioManager.stopAll();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
