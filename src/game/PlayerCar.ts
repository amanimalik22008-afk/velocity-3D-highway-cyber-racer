import * as THREE from 'three';
import { CarData, ActivePowerUp, PowerUpType } from '../types';
import { CarMeshContainer, createPlayerCar } from './CarModels';
import { ROAD_WIDTH, LANE_X_POSITIONS } from './RoadEnvironment';
import { ParticleSystem } from './ParticleSystem';
import { audioManager } from '../audio/AudioManager';

export class PlayerCar {
  public scene: THREE.Scene;
  public carData: CarData;
  public meshContainer: CarMeshContainer;
  public position: THREE.Vector3;
  public particleSystem: ParticleSystem;

  // Speed & Physics
  public currentSpeed: number = 0; // units/sec (e.g. 0 to 85)
  public maxSpeed: number = 65; // base top speed in units/sec
  public accelerationRate: number = 24;
  public brakingRate: number = 42;
  public steerSpeed: number = 14;
  public targetX: number = 0;
  public currentX: number = 0;
  public currentLane: number = 1; // 0: Left (-3.5), 1: Center (0), 2: Right (+3.5)

  // Nitro
  public nitroPercent: number = 100;
  public isNitroActive: boolean = false;
  public nitroMultiplier: number = 1.45;

  // Controls input state
  public inputSteer: number = 0; // -1 (left) to +1 (right)
  public inputThrottle: boolean = true; // manual throttle press
  public isAutoThrottle: boolean = false; // toggle for auto-cruise vs pure manual throttle
  public inputBrake: boolean = false;
  public inputNitro: boolean = false;

  // Visual effects state
  private steeringAngle: number = 0;
  private rollAngle: number = 0;
  private pitchAngle: number = 0;

  // Active Power-ups
  public activePowerUps: ActivePowerUp[] = [];

  constructor(scene: THREE.Scene, carData: CarData, particleSystem: ParticleSystem, customColor?: string) {
    this.scene = scene;
    this.carData = carData;
    this.particleSystem = particleSystem;
    this.position = new THREE.Vector3(0, 0, 0);

    // Apply car specs
    this.applyCarStats(carData);

    this.meshContainer = createPlayerCar(carData, customColor);
    this.scene.add(this.meshContainer.root);
  }

  public applyCarStats(data: CarData) {
    this.carData = data;
    // Map stats (e.g. 210-340 km/h) to units/sec (~55 to ~95)
    this.maxSpeed = (data.stats.topSpeed / 3.6) * 0.95;
    this.accelerationRate = 18 + data.stats.acceleration * 1.8;
    this.steerSpeed = 11 + data.stats.handling * 1.4;
  }

  public setCar(carData: CarData, customColor?: string) {
    if (this.meshContainer) {
      this.scene.remove(this.meshContainer.root);
    }
    this.applyCarStats(carData);
    this.meshContainer = createPlayerCar(carData, customColor);
    this.meshContainer.root.position.copy(this.position);
    this.scene.add(this.meshContainer.root);
  }

  public update(dt: number) {
    // 1. Update Power-Up Timers
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const p = this.activePowerUps[i];
      p.remaining -= dt;
      if (p.remaining <= 0) {
        this.activePowerUps.splice(i, 1);
      }
    }

    const hasBoostPowerUp = this.hasPowerUp('boost');
    const hasShield = this.hasPowerUp('shield');
    const hasMagnet = this.hasPowerUp('magnet');

    // 2. Nitro Management
    if (this.inputNitro && this.nitroPercent > 0 && this.currentSpeed > 10) {
      this.isNitroActive = true;
      this.nitroPercent = Math.max(0, this.nitroPercent - dt * 25);
    } else if (hasBoostPowerUp) {
      this.isNitroActive = true;
      this.nitroPercent = Math.min(100, this.nitroPercent + dt * 20);
    } else {
      this.isNitroActive = false;
      // Passive nitro refill
      this.nitroPercent = Math.min(100, this.nitroPercent + dt * (4 + this.carData.stats.nitroCapacity * 0.8));
    }

    audioManager.setNitroActive(this.isNitroActive);

    // 3. Speed & Acceleration Physics
    let targetTopSpeed = this.maxSpeed;
    if (this.isNitroActive) {
      targetTopSpeed *= this.nitroMultiplier;
    }

    if (this.inputBrake) {
      // Powerful responsive brakes
      this.currentSpeed = Math.max(0, this.currentSpeed - this.brakingRate * dt);
    } else if (this.inputThrottle) {
      // Dynamic acceleration under throttle
      const accel = this.isNitroActive ? this.accelerationRate * 1.65 : this.accelerationRate;
      this.currentSpeed = Math.min(targetTopSpeed, this.currentSpeed + accel * dt);
    } else if (this.isAutoThrottle) {
      // Auto-cruise mode keeps car at comfortable cruising speed
      const cruiseSpeed = this.maxSpeed * 0.7;
      if (this.currentSpeed < cruiseSpeed) {
        this.currentSpeed = Math.min(cruiseSpeed, this.currentSpeed + this.accelerationRate * 0.6 * dt);
      } else if (this.currentSpeed > cruiseSpeed) {
        this.currentSpeed = Math.max(cruiseSpeed, this.currentSpeed - 12 * dt);
      }
    } else {
      // Pure manual mode: natural drag deceleration down to gentle rolling speed
      if (this.currentSpeed > 10) {
        this.currentSpeed = Math.max(10, this.currentSpeed - 14 * dt);
      } else if (this.currentSpeed > 0 && this.currentSpeed <= 10) {
        this.currentSpeed = Math.max(5, this.currentSpeed - 4 * dt);
      }
    }

    // Audio Engine Sound update
    const speedRatio = this.currentSpeed / (this.maxSpeed * this.nitroMultiplier);
    audioManager.updateEnginePitch(speedRatio, this.inputThrottle || this.isNitroActive);

    // 4. Forward Movement (Along -Z)
    this.position.z -= this.currentSpeed * dt;

    // 5. Lateral Steering & Lane Mechanics
    if (Math.abs(this.inputSteer) > 0.05) {
      this.currentX += this.inputSteer * this.steerSpeed * dt;
    }

    // Clamp to road boundaries
    const maxRoadBound = (ROAD_WIDTH / 2) - 1.1;
    this.currentX = THREE.MathUtils.clamp(this.currentX, -maxRoadBound, maxRoadBound);
    this.position.x = this.currentX;

    // 6. Smooth Mesh Rotations & Dynamics (Tilt, Yaw, Pitch)
    const targetSteerAngle = -this.inputSteer * 0.28; // Front wheels and chassis yaw
    const targetRoll = -this.inputSteer * 0.12; // Body roll during turn
    const targetPitch = this.inputBrake ? 0.04 : (this.isNitroActive ? -0.05 : -0.01);

    this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, targetSteerAngle, 0.15);
    this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, 0.15);
    this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, targetPitch, 0.15);

    // Apply to Root Mesh
    this.meshContainer.root.position.copy(this.position);
    this.meshContainer.root.rotation.set(this.pitchAngle, this.steeringAngle * 0.4, this.rollAngle);

    // Wheel Spin animation
    const wheelAngularSpeed = (this.currentSpeed / 0.38) * dt;
    this.meshContainer.wheels.forEach((w) => {
      w.rotation.x += wheelAngularSpeed;
    });

    // Front Wheel Steering Turn
    this.meshContainer.frontWheels.forEach((fw) => {
      fw.rotation.y = (fw.position.x > 0 ? Math.PI : 0) + this.steeringAngle * 1.5;
    });

    // 7. Nitro Exhaust Flames & Particle Effects
    this.meshContainer.exhaustFlames.forEach((flame) => {
      const mat = flame.material as THREE.MeshBasicMaterial;
      if (this.isNitroActive) {
        mat.opacity = 0.85 + Math.random() * 0.15;
        flame.scale.set(1.0 + Math.random() * 0.3, 1.0 + Math.random() * 0.6, 1.0 + Math.random() * 0.3);
        
        // Emit nitro fire particles
        const worldPos = new THREE.Vector3();
        flame.getWorldPosition(worldPos);
        this.particleSystem.emitNitro(worldPos, 1);
      } else {
        mat.opacity = 0.0;
      }
    });

    // Tire smoke on sharp hard turns
    if (Math.abs(this.inputSteer) > 0.75 && this.currentSpeed > 30) {
      const smokePos = this.position.clone().add(new THREE.Vector3(0, 0.2, 1.2));
      this.particleSystem.emitTireSmoke(smokePos);
    }

    // 8. Shield Visual Energy Bubble
    if (this.meshContainer.shieldMesh) {
      const shieldMat = this.meshContainer.shieldMesh.material as THREE.MeshStandardMaterial;
      if (hasShield) {
        shieldMat.opacity = 0.4 + Math.sin(Date.now() * 0.008) * 0.25;
        this.meshContainer.shieldMesh.rotation.y += dt * 2.0;
        this.meshContainer.shieldMesh.rotation.x += dt * 1.2;
      } else {
        shieldMat.opacity = 0.0;
      }
    }

    // 9. Magnet Effect Ring
    if (this.meshContainer.magnetEffectMesh) {
      this.meshContainer.magnetEffectMesh.visible = hasMagnet;
      if (hasMagnet) {
        this.meshContainer.magnetEffectMesh.rotation.y += dt * 4.0;
      }
    }
  }

  public shiftLane(direction: 'left' | 'right') {
    if (direction === 'left' && this.currentLane > 0) {
      this.currentLane--;
    } else if (direction === 'right' && this.currentLane < LANE_X_POSITIONS.length - 1) {
      this.currentLane++;
    }
    this.targetX = LANE_X_POSITIONS[this.currentLane];
  }

  public addPowerUp(type: PowerUpType, duration: number = 10) {
    const existing = this.activePowerUps.find((p) => p.type === type);
    if (existing) {
      existing.remaining = duration;
      existing.duration = duration;
    } else {
      this.activePowerUps.push({
        type,
        duration,
        remaining: duration,
      });
    }
  }

  public hasPowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.some((p) => p.type === type && p.remaining > 0);
  }

  public removePowerUp(type: PowerUpType) {
    this.activePowerUps = this.activePowerUps.filter((p) => p.type !== type);
  }

  public reset(startZ: number = 0) {
    this.position.set(0, 0, startZ);
    this.currentX = 0;
    this.targetX = 0;
    this.currentLane = 1;
    this.currentSpeed = 0;
    this.nitroPercent = 100;
    this.isNitroActive = false;
    this.activePowerUps = [];
    this.meshContainer.root.position.copy(this.position);
    this.meshContainer.root.rotation.set(0, 0, 0);
  }
}
