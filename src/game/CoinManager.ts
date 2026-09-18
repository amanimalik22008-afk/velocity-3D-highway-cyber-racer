import * as THREE from 'three';
import { LANE_X_POSITIONS } from './RoadEnvironment';
import { ParticleSystem } from './ParticleSystem';
import { audioManager } from '../audio/AudioManager';

export interface CoinItem {
  mesh: THREE.Group;
  lane: number;
  z: number;
  active: boolean;
  collected: boolean;
}

export class CoinManager {
  public scene: THREE.Scene;
  private coins: CoinItem[] = [];
  private poolSize = 30;
  private coinGeometry: THREE.CylinderGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;
  private particleSystem: ParticleSystem;

  constructor(scene: THREE.Scene, particleSystem: ParticleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;

    this.coinGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 16);
    this.coinGeometry.rotateX(Math.PI / 2);

    this.coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
    });

    this.initPool();
  }

  private initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      const group = new THREE.Group();
      
      const coinMesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
      group.add(coinMesh);

      // Star / inner diamond detail
      const starGeo = new THREE.BoxGeometry(0.3, 0.3, 0.16);
      starGeo.rotateZ(Math.PI / 4);
      const starMesh = new THREE.Mesh(
        starGeo,
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      group.add(starMesh);

      group.position.set(0, -500, 0);
      group.visible = false;
      this.scene.add(group);

      this.coins.push({
        mesh: group,
        lane: 0,
        z: 0,
        active: false,
        collected: false,
      });
    }
  }

  public spawnCoinRow(startZ: number, count: number = 4) {
    const laneIndex = Math.floor(Math.random() * LANE_X_POSITIONS.length);
    const laneX = LANE_X_POSITIONS[laneIndex];

    for (let i = 0; i < count; i++) {
      const coin = this.coins.find((c) => !c.active);
      if (!coin) break;

      coin.active = true;
      coin.collected = false;
      coin.lane = laneIndex;
      coin.z = startZ - i * 3.5;
      coin.mesh.position.set(laneX, 0.7, coin.z);
      coin.mesh.visible = true;
      coin.mesh.scale.set(1, 1, 1);
    }
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    isMagnetActive: boolean,
    onCollect: () => void
  ) {
    const magnetRadius = isMagnetActive ? 18.0 : 0;
    const playerBoundingDist = 1.4;

    this.coins.forEach((coin) => {
      if (!coin.active) return;

      // Spin coin
      coin.mesh.rotation.y += dt * 3.5;
      coin.mesh.position.y = 0.7 + Math.sin(Date.now() * 0.005 + coin.z) * 0.15;

      // Magnet attraction physics
      if (isMagnetActive) {
        const distToPlayer = coin.mesh.position.distanceTo(playerPos);
        if (distToPlayer < magnetRadius) {
          const dir = new THREE.Vector3().subVectors(playerPos, coin.mesh.position).normalize();
          coin.mesh.position.addScaledVector(dir, Math.min(28.0 * dt, distToPlayer));
        }
      }

      // Check collision with player
      const dx = Math.abs(coin.mesh.position.x - playerPos.x);
      const dz = Math.abs(coin.mesh.position.z - playerPos.z);

      if (dx < playerBoundingDist && dz < playerBoundingDist + 0.8 && !coin.collected) {
        coin.collected = true;
        coin.active = false;
        coin.mesh.visible = false;
        coin.mesh.position.y = -500;

        // Burst & Audio
        this.particleSystem.emitCoinBurst(playerPos);
        audioManager.playCoin();
        onCollect();
        return;
      }

      // Despawn behind player
      if (coin.mesh.position.z > playerPos.z + 15) {
        coin.active = false;
        coin.mesh.visible = false;
        coin.mesh.position.y = -500;
      }
    });
  }

  public reset() {
    this.coins.forEach((coin) => {
      coin.active = false;
      coin.collected = false;
      coin.mesh.visible = false;
      coin.mesh.position.set(0, -500, 0);
    });
  }
}
