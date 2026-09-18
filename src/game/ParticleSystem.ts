import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'smoke' | 'fire' | 'debris' | 'shockwave';
}

export class ParticleSystem {
  public scene: THREE.Scene;
  private particles: Particle[] = [];
  private maxParticles = 600;
  private pointsMesh: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(geometry, material);
    this.scene.add(this.pointsMesh);
  }

  public emitNitro(pos: THREE.Vector3, dirZ: number) {
    for (let i = 0; i < 4; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const color = Math.random() > 0.4 ? new THREE.Color(0x00f0ff) : new THREE.Color(0x9900ff);
      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.2, 0)),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.0, dirZ * 12 + Math.random() * 6),
        color,
        size: 0.35 + Math.random() * 0.4,
        alpha: 1.0,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        type: 'fire',
      });
    }
  }

  public emitTireSmoke(pos: THREE.Vector3) {
    for (let i = 0; i < 2; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.1, (Math.random() - 0.5) * 0.2)),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 2.0, 0.5 + Math.random() * 1.5, 3.0 + Math.random() * 2.0),
        color: new THREE.Color(0x777788),
        size: 0.4 + Math.random() * 0.5,
        alpha: 0.6,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        type: 'smoke',
      });
    }
  }

  public emitCoinBurst(pos: THREE.Vector3) {
    for (let i = 0; i < 25; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.0 + Math.random() * 5.0;
      this.particles.push({
        position: pos.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          1.5 + Math.random() * 4.0,
          Math.sin(angle) * speed
        ),
        color: new THREE.Color(0xffd700),
        size: 0.25 + Math.random() * 0.3,
        alpha: 1.0,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        type: 'spark',
      });
    }
  }

  public emitShieldShockwave(pos: THREE.Vector3) {
    for (let i = 0; i < 35; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 6.0 + Math.random() * 4.0;
      this.particles.push({
        position: pos.clone(),
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        ),
        color: new THREE.Color(0x00ffff),
        size: 0.4 + Math.random() * 0.3,
        alpha: 1.0,
        life: 0,
        maxLife: 0.5,
        type: 'shockwave',
      });
    }
  }

  public emitCrash(pos: THREE.Vector3) {
    // Fire & debris explosion
    for (let i = 0; i < 80; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const isFire = Math.random() > 0.4;
      const color = isFire
        ? (Math.random() > 0.5 ? new THREE.Color(0xff3300) : new THREE.Color(0xffaa00))
        : new THREE.Color(0x333333);

      const speed = 4.0 + Math.random() * 12.0;
      const angleX = (Math.random() - 0.5) * Math.PI * 2;
      const angleY = Math.random() * Math.PI;

      this.particles.push({
        position: pos.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angleX) * speed,
          2.0 + Math.sin(angleY) * speed * 1.5,
          (Math.random() - 0.5) * speed
        ),
        color,
        size: 0.4 + Math.random() * 0.8,
        alpha: 1.0,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.7,
        type: isFire ? 'fire' : 'debris',
      });
    }
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics update
      p.position.addScaledVector(p.velocity, dt);

      if (p.type === 'debris' || p.type === 'smoke') {
        p.velocity.y -= 9.8 * dt; // Gravity
      }

      // Fade out
      const progress = p.life / p.maxLife;
      p.alpha = 1.0 - progress;
      if (p.type === 'smoke') {
        p.size += dt * 0.5; // Expand smoke
      }
    }

    // Update geometry buffers
    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        this.positions[i * 3] = p.position.x;
        this.positions[i * 3 + 1] = p.position.y;
        this.positions[i * 3 + 2] = p.position.z;

        this.colors[i * 3] = p.color.r * p.alpha;
        this.colors[i * 3 + 1] = p.color.g * p.alpha;
        this.colors[i * 3 + 2] = p.color.b * p.alpha;

        this.sizes[i] = p.size;
      } else {
        this.positions[i * 3] = 0;
        this.positions[i * 3 + 1] = -1000;
        this.positions[i * 3 + 2] = 0;
        this.sizes[i] = 0;
      }
    }

    this.pointsMesh.geometry.attributes.position.needsUpdate = true;
    this.pointsMesh.geometry.attributes.color.needsUpdate = true;
    this.pointsMesh.geometry.attributes.size.needsUpdate = true;
  }

  public clear() {
    this.particles = [];
  }
}
