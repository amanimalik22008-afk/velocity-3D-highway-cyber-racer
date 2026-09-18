import * as THREE from 'three';
import { TrafficMeshContainer, TrafficType, createTrafficVehicle } from './CarModels';
import { LANE_X_POSITIONS } from './RoadEnvironment';
import { audioManager } from '../audio/AudioManager';
import { DifficultyConfig } from '../types';
import { DIFFICULTY_CONFIGS } from '../utils/difficultyData';

export interface TrafficCar {
  container: TrafficMeshContainer;
  currentLane: number;
  targetLane: number;
  laneChangeProgress: number;
  isChangingLane: boolean;
  speed: number; // units per second (e.g. 20-35)
  z: number;
  active: boolean;
  nearMissAwarded: boolean;
  laneChangeTimer: number;
}

export class TrafficManager {
  public scene: THREE.Scene;
  private pool: TrafficCar[] = [];
  private poolSize = 24;
  private spawnTimer = 0;
  private difficultyConfig: DifficultyConfig = DIFFICULTY_CONFIGS.medium;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initPool();
  }

  public setDifficulty(config: DifficultyConfig) {
    this.difficultyConfig = config;
  }

  private initPool() {
    const types: TrafficType[] = ['sedan', 'suv', 'sports', 'truck', 'van'];
    for (let i = 0; i < this.poolSize; i++) {
      const type = types[i % types.length];
      const container = createTrafficVehicle(type);
      container.root.visible = false;
      container.root.position.set(0, -500, 0);
      this.scene.add(container.root);

      this.pool.push({
        container,
        currentLane: 1,
        targetLane: 1,
        laneChangeProgress: 1,
        isChangingLane: false,
        speed: 25,
        z: -500,
        active: false,
        nearMissAwarded: false,
        laneChangeTimer: Math.random() * 6 + 4,
      });
    }
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerSpeed: number,
    difficultyMultiplier: number,
    onNearMiss: (pts: number) => void
  ) {
    // 1. Spawning Logic based on chosen difficulty
    this.spawnTimer += dt;
    const baseInterval = this.difficultyConfig.spawnInterval;
    const adjustedInterval = Math.max(0.5, baseInterval / difficultyMultiplier);

    if (this.spawnTimer >= adjustedInterval) {
      this.spawnTimer = 0;
      this.attemptSpawnTraffic(playerPos.z, difficultyMultiplier);
    }

    // 2. Update all active traffic cars
    this.pool.forEach((car) => {
      if (!car.active) return;

      // Move forward along Z (in racing, traffic moves in same direction but slower than player)
      // Negative Z is forward
      car.z -= car.speed * dt;
      car.container.root.position.z = car.z;

      // Wheel spin
      const wheelAngularSpeed = (car.speed / 0.38) * dt;
      car.container.wheels.forEach((w) => {
        w.rotation.x += wheelAngularSpeed;
      });

      // Lane change AI scaled by difficulty
      car.laneChangeTimer -= dt;
      if (car.laneChangeTimer <= 0 && !car.isChangingLane) {
        car.laneChangeTimer = Math.random() * 6 + 3;
        // Chance to change lane if adjacent lane is safe
        if (Math.random() < this.difficultyConfig.laneChangeProbability) {
          const possibleLanes: number[] = [];
          if (car.currentLane > 0) possibleLanes.push(car.currentLane - 1);
          if (car.currentLane < LANE_X_POSITIONS.length - 1) possibleLanes.push(car.currentLane + 1);

          if (possibleLanes.length > 0) {
            const nextLane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
            // Check if lane is clear around this car
            const isClear = !this.pool.some(
              (other) =>
                other.active &&
                other !== car &&
                (other.currentLane === nextLane || other.targetLane === nextLane) &&
                Math.abs(other.z - car.z) < 14
            );

            if (isClear) {
              car.targetLane = nextLane;
              car.isChangingLane = true;
              car.laneChangeProgress = 0;
            }
          }
        }
      }

      // Smooth lane transition
      if (car.isChangingLane) {
        const laneSpeed = this.difficultyConfig.id === 'hard' ? 1.8 : 1.4;
        car.laneChangeProgress += dt * laneSpeed;
        const startX = LANE_X_POSITIONS[car.currentLane];
        const endX = LANE_X_POSITIONS[car.targetLane];
        const currentX = THREE.MathUtils.lerp(startX, endX, Math.min(1, car.laneChangeProgress));
        car.container.root.position.x = currentX;

        // Slight body roll during lane shift
        const rollDir = endX > startX ? -0.06 : 0.06;
        car.container.root.rotation.z = Math.sin(car.laneChangeProgress * Math.PI) * rollDir;

        if (car.laneChangeProgress >= 1) {
          car.currentLane = car.targetLane;
          car.isChangingLane = false;
          car.container.root.rotation.z = 0;
        }
      } else {
        car.container.root.position.x = LANE_X_POSITIONS[car.currentLane];
      }

      // Near-Miss detection
      // Player is overtaking this car
      const dz = car.z - playerPos.z; // dz is negative when car is ahead, positive when behind
      const dx = Math.abs(car.container.root.position.x - playerPos.x);

      // Car is just behind or adjacent to player
      if (!car.nearMissAwarded && dz > -1.0 && dz < 3.5 && dx < 2.3 && dx > 1.2 && playerSpeed > 35) {
        car.nearMissAwarded = true;
        audioManager.playNearMiss();
        onNearMiss(150);
      }

      // Despawn when far behind or far ahead
      if (car.z > playerPos.z + 25 || car.z < playerPos.z - 220) {
        this.despawnCar(car);
      }
    });
  }

  private attemptSpawnTraffic(playerZ: number, difficultyMultiplier: number) {
    const available = this.pool.filter((c) => !c.active);
    if (available.length === 0) return;

    // Pick 1 or 2 lanes to spawn, NEVER block all 3 lanes at the same Z
    const spawnZ = playerZ - 90 - Math.random() * 30;
    const occupiedLanesAtZ = this.pool
      .filter((c) => c.active && Math.abs(c.z - spawnZ) < 16)
      .map((c) => c.currentLane);

    const openLanes = [0, 1, 2].filter((l) => !occupiedLanesAtZ.includes(l));
    if (openLanes.length === 0) return;

    // Pick lane
    const chosenLane = openLanes[Math.floor(Math.random() * openLanes.length)];
    const car = available[0];

    // Speed scales with difficulty settings
    const minSpeed = this.difficultyConfig.trafficBaseSpeedMin;
    const maxSpeed = this.difficultyConfig.trafficBaseSpeedMax;
    const baseSpeed = minSpeed + Math.random() * (maxSpeed - minSpeed) + Math.min(6, (difficultyMultiplier - 1.0) * 8);

    car.active = true;
    car.currentLane = chosenLane;
    car.targetLane = chosenLane;
    car.isChangingLane = false;
    car.laneChangeProgress = 1;
    car.speed = baseSpeed;
    car.z = spawnZ;
    car.nearMissAwarded = false;
    car.laneChangeTimer = Math.random() * 5 + 3;

    car.container.root.position.set(LANE_X_POSITIONS[chosenLane], 0, spawnZ);
    car.container.root.rotation.set(0, 0, 0);
    car.container.root.visible = true;
  }

  public checkCollision(playerPos: THREE.Vector3, playerWidth: number = 1.7, playerLength: number = 4.2): TrafficCar | null {
    const forgiveness = this.difficultyConfig.collisionForgiveness;

    for (const car of this.pool) {
      if (!car.active) continue;

      const halfW = (playerWidth + car.container.width) / 2 * forgiveness;
      const halfL = (playerLength + car.container.length) / 2 * forgiveness;

      const dx = Math.abs(car.container.root.position.x - playerPos.x);
      const dz = Math.abs(car.z - playerPos.z);

      if (dx < halfW && dz < halfL) {
        return car;
      }
    }
    return null;
  }

  public despawnCar(car: TrafficCar) {
    car.active = false;
    car.container.root.visible = false;
    car.container.root.position.set(0, -500, 0);
  }

  public reset() {
    this.spawnTimer = 0;
    this.pool.forEach((c) => this.despawnCar(c));
  }
}
