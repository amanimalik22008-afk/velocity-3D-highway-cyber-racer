import * as THREE from 'three';

export const ROAD_WIDTH = 12.0; // 3 full lanes (-3.5, 0, +3.5)
export const LANE_X_POSITIONS = [-3.5, 0, 3.5];
export const CHUNK_LENGTH = 100;
export const NUM_CHUNKS = 5;

export class RoadEnvironment {
  public scene: THREE.Scene;
  private roadChunks: THREE.Group[] = [];
  private speedLines!: THREE.Points;
  private speedLinePositions!: Float32Array;
  private speedLineCount = 300;
  private cityBuildings: THREE.Group[] = [];
  
  // Materials
  private asphaltMat: THREE.MeshStandardMaterial;
  private curbMat: THREE.MeshStandardMaterial;
  private markingMat: THREE.MeshBasicMaterial;
  private barrierMat: THREE.MeshStandardMaterial;
  private reflectorMat: THREE.MeshStandardMaterial;
  private streetLightMat: THREE.MeshStandardMaterial;
  private lightBulbMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Materials
    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x14161d,
      roughness: 0.85,
      metalness: 0.15,
    });

    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0x333742,
      roughness: 0.7,
      metalness: 0.2,
    });

    this.markingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    this.barrierMat = new THREE.MeshStandardMaterial({
      color: 0x8892a0,
      roughness: 0.4,
      metalness: 0.8,
    });

    this.reflectorMat = new THREE.MeshStandardMaterial({
      color: 0xff3b00,
      emissive: 0xff3b00,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    });

    this.streetLightMat = new THREE.MeshStandardMaterial({
      color: 0x222630,
      roughness: 0.5,
      metalness: 0.7,
    });

    this.lightBulbMat = new THREE.MeshBasicMaterial({
      color: 0xffeaad,
    });

    this.initSkyAndLighting();
    this.initRoadChunks();
    this.initCitySkyline();
    this.initSpeedLines();
  }

  private initSkyAndLighting() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x1a2436, 1.4);
    this.scene.add(ambientLight);

    // Directional Sun / Moon Light
    const dirLight = new THREE.DirectionalLight(0xddeeff, 2.2);
    dirLight.position.set(30, 60, -50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 160;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    this.scene.add(dirLight);

    // Atmospheric Fog
    this.scene.fog = new THREE.FogExp2(0x0a0d18, 0.007);
    this.scene.background = new THREE.Color(0x060810);
  }

  private createRoadChunk(): THREE.Group {
    const chunk = new THREE.Group();

    // 1. Asphalt Ground
    const asphaltGeo = new THREE.PlaneGeometry(ROAD_WIDTH, CHUNK_LENGTH);
    asphaltGeo.rotateX(-Math.PI / 2);
    const asphalt = new THREE.Mesh(asphaltGeo, this.asphaltMat);
    asphalt.receiveShadow = true;
    chunk.add(asphalt);

    // 2. Road Shoulder / Grass Terrains (Left & Right)
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0x0a1018,
      roughness: 0.95,
      metalness: 0.05,
    });

    for (const side of [-1, 1]) {
      const shoulderGeo = new THREE.PlaneGeometry(60, CHUNK_LENGTH);
      shoulderGeo.rotateX(-Math.PI / 2);
      const shoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
      shoulder.position.set(side * (ROAD_WIDTH / 2 + 30), -0.05, 0);
      shoulder.receiveShadow = true;
      chunk.add(shoulder);

      // Curbs / Rumble Strips
      const curbGeo = new THREE.BoxGeometry(0.8, 0.15, CHUNK_LENGTH);
      const curb = new THREE.Mesh(curbGeo, this.curbMat);
      curb.position.set(side * (ROAD_WIDTH / 2 + 0.4), 0.05, 0);
      chunk.add(curb);

      // Guardrails
      const railGeo = new THREE.BoxGeometry(0.2, 0.6, CHUNK_LENGTH);
      const rail = new THREE.Mesh(railGeo, this.barrierMat);
      rail.position.set(side * (ROAD_WIDTH / 2 + 1.2), 0.45, 0);
      chunk.add(rail);

      // Guardrail posts & Reflectors along the length
      for (let z = -CHUNK_LENGTH / 2 + 5; z < CHUNK_LENGTH / 2; z += 10) {
        const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
        const post = new THREE.Mesh(postGeo, this.barrierMat);
        post.position.set(side * (ROAD_WIDTH / 2 + 1.2), 0.25, z);
        chunk.add(post);

        const reflGeo = new THREE.BoxGeometry(0.08, 0.12, 0.25);
        const refl = new THREE.Mesh(reflGeo, this.reflectorMat);
        refl.position.set(side * (ROAD_WIDTH / 2 + 1.05), 0.5, z);
        chunk.add(refl);
      }

      // Street Light Poles every 30 meters
      for (let z = -CHUNK_LENGTH / 2 + 15; z < CHUNK_LENGTH / 2; z += 35) {
        const poleGroup = new THREE.Group();
        poleGroup.position.set(side * (ROAD_WIDTH / 2 + 2.5), 0, z);

        // Vertical pole
        const verticalGeo = new THREE.CylinderGeometry(0.12, 0.18, 6.5, 8);
        const vertical = new THREE.Mesh(verticalGeo, this.streetLightMat);
        vertical.position.y = 3.25;
        poleGroup.add(vertical);

        // Horizontal overhang arm
        const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
        armGeo.rotateZ((side * Math.PI) / 3);
        const arm = new THREE.Mesh(armGeo, this.streetLightMat);
        arm.position.set(-side * 0.9, 6.2, 0);
        poleGroup.add(arm);

        // Light Fixture & Glowing bulb
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), this.lightBulbMat);
        bulb.position.set(-side * 2.1, 5.8, 0);
        poleGroup.add(bulb);

        chunk.add(poleGroup);
      }
    }

    // 3. Lane Dash Markings (Lanes dividers at x = -1.75 and x = 1.75)
    const dashXPositions = [-1.75, 1.75];
    dashXPositions.forEach((dashX) => {
      for (let z = -CHUNK_LENGTH / 2 + 3; z < CHUNK_LENGTH / 2; z += 8) {
        const dashGeo = new THREE.PlaneGeometry(0.2, 4.0);
        dashGeo.rotateX(-Math.PI / 2);
        const dash = new THREE.Mesh(dashGeo, this.markingMat);
        dash.position.set(dashX, 0.02, z);
        chunk.add(dash);
      }
    });

    // Outer Solid White Road Lines
    for (const side of [-1, 1]) {
      const solidLineGeo = new THREE.PlaneGeometry(0.25, CHUNK_LENGTH);
      solidLineGeo.rotateX(-Math.PI / 2);
      const solidLine = new THREE.Mesh(solidLineGeo, this.markingMat);
      solidLine.position.set(side * (ROAD_WIDTH / 2 - 0.3), 0.02, 0);
      chunk.add(solidLine);
    }

    // Overhead highway gantry on some chunks
    const gantry = new THREE.Group();
    const gantryBarGeo = new THREE.BoxGeometry(ROAD_WIDTH + 4, 0.5, 0.5);
    const gantryBar = new THREE.Mesh(gantryBarGeo, this.barrierMat);
    gantryBar.position.y = 5.2;
    gantry.add(gantryBar);

    for (const side of [-1, 1]) {
      const legGeo = new THREE.CylinderGeometry(0.2, 0.25, 5.2, 8);
      const leg = new THREE.Mesh(legGeo, this.barrierMat);
      leg.position.set(side * (ROAD_WIDTH / 2 + 1.8), 2.6, 0);
      gantry.add(leg);
    }

    // Digital Signboard on Gantry
    const signGeo = new THREE.BoxGeometry(7.0, 1.4, 0.1);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0x00152b,
      emissive: 0x003366,
      emissiveIntensity: 1.2,
      roughness: 0.3,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 5.2, -0.28);
    gantry.add(sign);
    gantry.position.z = -CHUNK_LENGTH / 4;
    chunk.add(gantry);

    return chunk;
  }

  private initRoadChunks() {
    for (let i = 0; i < NUM_CHUNKS; i++) {
      const chunk = this.createRoadChunk();
      chunk.position.z = -i * CHUNK_LENGTH;
      this.scene.add(chunk);
      this.roadChunks.push(chunk);
    }
  }

  private initCitySkyline() {
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0d1322,
      roughness: 0.6,
      metalness: 0.5,
    });

    const windowColors = [0x00e5ff, 0xffaa00, 0xff0055, 0x88ccff];

    // Generate distant futuristic skyscrapers along left and right sides
    for (let i = 0; i < 40; i++) {
      const group = new THREE.Group();
      const height = 30 + Math.random() * 70;
      const width = 12 + Math.random() * 18;
      const depth = 12 + Math.random() * 18;

      const buildingMesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        buildingMat
      );
      buildingMesh.position.y = height / 2;
      group.add(buildingMesh);

      // Glowing Neon Roof Antenna / Spire
      if (Math.random() > 0.5) {
        const spire = new THREE.Mesh(
          new THREE.ConeGeometry(0.6, 12, 6),
          new THREE.MeshBasicMaterial({ color: windowColors[i % windowColors.length] })
        );
        spire.position.y = height + 6;
        group.add(spire);
      }

      // Lit Window Bands
      for (let w = 6; w < height - 6; w += 8) {
        if (Math.random() > 0.3) {
          const winBand = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.2, 1.2, depth + 0.2),
            new THREE.MeshBasicMaterial({
              color: windowColors[(i + w) % windowColors.length],
            })
          );
          winBand.position.y = w;
          group.add(winBand);
        }
      }

      const side = i % 2 === 0 ? 1 : -1;
      const distFromRoad = 55 + Math.random() * 80;
      group.position.set(side * distFromRoad, -1, -i * 18);

      this.scene.add(group);
      this.cityBuildings.push(group);
    }
  }

  private initSpeedLines() {
    const geometry = new THREE.BufferGeometry();
    this.speedLinePositions = new Float32Array(this.speedLineCount * 3);

    for (let i = 0; i < this.speedLineCount; i++) {
      this.speedLinePositions[i * 3] = (Math.random() - 0.5) * ROAD_WIDTH * 1.5;
      this.speedLinePositions[i * 3 + 1] = 0.5 + Math.random() * 4.0;
      this.speedLinePositions[i * 3 + 2] = -Math.random() * 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.speedLinePositions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x88e5ff,
      size: 0.35,
      transparent: true,
      opacity: 0.0, // Fades in with high speed
      blending: THREE.AdditiveBlending,
    });

    this.speedLines = new THREE.Points(geometry, material);
    this.scene.add(this.speedLines);
  }

  public update(playerZ: number, speedRatio: number, isNitro: boolean) {
    // 1. Recycle road chunks ahead of player
    this.roadChunks.forEach((chunk) => {
      if (chunk.position.z > playerZ + CHUNK_LENGTH) {
        // Find furthest chunk ahead
        let minZ = 0;
        this.roadChunks.forEach((c) => {
          if (c.position.z < minZ) minZ = c.position.z;
        });
        chunk.position.z = minZ - CHUNK_LENGTH;
      }
    });

    // 2. Recycle distant city buildings
    this.cityBuildings.forEach((b) => {
      if (b.position.z > playerZ + 40) {
        b.position.z -= 40 * 18;
      }
    });

    // 3. Update speed lines / wind warp particles
    if (this.speedLines) {
      const positions = this.speedLines.geometry.attributes.position.array as Float32Array;
      const mat = this.speedLines.material as THREE.PointsMaterial;

      // Higher opacity at fast speeds / nitro
      const targetOpacity = isNitro ? 0.85 : Math.max(0, (speedRatio - 0.6) * 1.8);
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
      mat.color.setHex(isNitro ? 0x00f0ff : 0xffffff);

      const moveSpeed = 120 * speedRatio + (isNitro ? 60 : 0);

      for (let i = 0; i < this.speedLineCount; i++) {
        positions[i * 3 + 2] += moveSpeed * 0.016;
        if (positions[i * 3 + 2] > playerZ + 15) {
          positions[i * 3 + 2] = playerZ - 80 - Math.random() * 40;
          positions[i * 3] = (Math.random() - 0.5) * ROAD_WIDTH * 1.4;
          positions[i * 3 + 1] = 0.4 + Math.random() * 4.5;
        }
      }
      this.speedLines.geometry.attributes.position.needsUpdate = true;
    }
  }

  public reset(startZ: number = 0) {
    for (let i = 0; i < NUM_CHUNKS; i++) {
      this.roadChunks[i].position.z = startZ - i * CHUNK_LENGTH;
    }
  }
}
