import * as THREE from 'three';
import { PowerUpType } from '../types';
import { LANE_X_POSITIONS } from './RoadEnvironment';
import { ParticleSystem } from './ParticleSystem';
import { audioManager } from '../audio/AudioManager';

export interface PowerUpItem {
  mesh: THREE.Group;
  type: PowerUpType;
  lane: number;
  z: number;
  active: boolean;
}

export class PowerUpManager {
  public scene: THREE.Scene;
  private powerUps: PowerUpItem[] = [];
  private particleSystem: ParticleSystem;

  constructor(scene: THREE.Scene, particleSystem: ParticleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.initPool();
  }

  private createPowerUpMesh(type: PowerUpType): THREE.Group {
    const group = new THREE.Group();

    let mainColor = 0x00f0ff;
    if (type === 'magnet') mainColor = 0xffb700;
    if (type === 'boost') mainColor = 0xff0055;
    if (type === 'shield') mainColor = 0x00e5ff;
    if (type === 'multiplier') mainColor = 0x9d00ff;

    // Glowing Core Mesh
    let coreGeo: THREE.BufferGeometry;
    if (type === 'shield') {
      coreGeo = new THREE.IcosahedronGeometry(0.55, 1);
    } else if (type === 'magnet') {
      coreGeo = new THREE.TorusGeometry(0.45, 0.16, 8, 16, Math.PI * 1.5);
    } else if (type === 'boost') {
      coreGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12);
    } else {
      coreGeo = new THREE.OctahedronGeometry(0.55, 0);
    }

    const coreMat = new THREE.MeshStandardMaterial({
      color: mainColor,
      emissive: mainColor,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.8,
    });

    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Orbiting Glowing Ring
    const ringGeo = new THREE.TorusGeometry(0.85, 0.05, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: mainColor,
      wireframe: true,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    // Vertical Beacon light column
    const columnGeo = new THREE.CylinderGeometry(0.1, 0.6, 6.0, 8, 1, true);
    const columnMat = new THREE.MeshBasicMaterial({
      color: mainColor,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const column = new THREE.Mesh(columnGeo, columnMat);
    column.position.y = 3.0;
    group.add(column);

    return group;
  }

  private initPool() {
    const types: PowerUpType[] = ['shield', 'magnet', 'boost', 'multiplier'];
    types.forEach((type) => {
      for (let i = 0; i < 2; i++) {
        const mesh = this.createPowerUpMesh(type);
        mesh.visible = false;
        mesh.position.set(0, -500, 0);
        this.scene.add(mesh);

        this.powerUps.push({
          mesh,
          type,
          lane: 0,
          z: 0,
          active: false,
        });
      }
    });
  }

  public spawnPowerUp(spawnZ: number, forcedType?: PowerUpType) {
    const available = this.powerUps.filter((p) => !p.active);
    if (available.length === 0) return;

    const types: PowerUpType[] = ['shield', 'magnet', 'boost', 'multiplier'];
    const selectedType = forcedType || types[Math.floor(Math.random() * types.length)];
    
    const powerUp = available.find((p) => p.type === selectedType) || available[0];
    const laneIdx = Math.floor(Math.random() * LANE_X_POSITIONS.length);
    const laneX = LANE_X_POSITIONS[laneIdx];

    powerUp.active = true;
    powerUp.lane = laneIdx;
    powerUp.z = spawnZ;
    powerUp.mesh.position.set(laneX, 1.2, spawnZ);
    powerUp.mesh.visible = true;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    onCollect: (type: PowerUpType) => void
  ) {
    this.powerUps.forEach((p) => {
      if (!p.active) return;

      // Spin & Bob
      p.mesh.rotation.y += dt * 2.8;
      p.mesh.position.y = 1.1 + Math.sin(Date.now() * 0.004 + p.z) * 0.25;

      // Check Collision with player
      const dx = Math.abs(p.mesh.position.x - playerPos.x);
      const dz = Math.abs(p.mesh.position.z - playerPos.z);

      if (dx < 1.6 && dz < 1.8) {
        p.active = false;
        p.mesh.visible = false;
        p.mesh.position.y = -500;

        // Sound and Particles
        this.particleSystem.emitCoinBurst(playerPos);
        this.particleSystem.emitShieldShockwave(playerPos);
        audioManager.playPowerUp();
        onCollect(p.type);
        return;
      }

      // Despawn if passed
      if (p.mesh.position.z > playerPos.z + 15) {
        p.active = false;
        p.mesh.visible = false;
        p.mesh.position.y = -500;
      }
    });
  }

  public reset() {
    this.powerUps.forEach((p) => {
      p.active = false;
      p.mesh.visible = false;
      p.mesh.position.set(0, -500, 0);
    });
  }
}
