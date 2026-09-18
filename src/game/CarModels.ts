import * as THREE from 'three';
import { CarData } from '../types';

export interface CarMeshContainer {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  wheels: THREE.Group[];
  frontWheels: THREE.Group[];
  exhaustFlames: THREE.Mesh[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  underglow?: THREE.Mesh;
  shieldMesh?: THREE.Mesh;
  magnetEffectMesh?: THREE.Group;
  primaryMaterial: THREE.MeshStandardMaterial;
  bodyColor: string;
}

// Materials Cache for high performance and zero memory leak
const tireMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.85,
  metalness: 0.1,
});

const rimMaterial = new THREE.MeshStandardMaterial({
  color: 0xd8d8d8,
  roughness: 0.25,
  metalness: 0.85,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x111625,
  roughness: 0.1,
  metalness: 0.1,
  transmission: 0.6,
  transparent: true,
  opacity: 0.85,
});

const carbonMaterial = new THREE.MeshStandardMaterial({
  color: 0x111115,
  roughness: 0.4,
  metalness: 0.5,
});

const headlightMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xddf0ff,
  emissiveIntensity: 3.5,
  roughness: 0.1,
});

const taillightMaterial = new THREE.MeshStandardMaterial({
  color: 0xff0022,
  emissive: 0xff0033,
  emissiveIntensity: 4.0,
  roughness: 0.1,
});

export function createWheel(): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Tire
  const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 20);
  tireGeo.rotateZ(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, tireMaterial);
  tire.castShadow = true;
  wheelGroup.add(tire);

  // Rim Outer Ring
  const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.33, 16);
  rimGeo.rotateZ(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, rimMaterial);
  wheelGroup.add(rim);

  // Spokes
  for (let i = 0; i < 5; i++) {
    const spokeGeo = new THREE.BoxGeometry(0.04, 0.44, 0.04);
    spokeGeo.rotateX((i * Math.PI) / 5);
    const spoke = new THREE.Mesh(spokeGeo, rimMaterial);
    wheelGroup.add(spoke);
  }

  // Brake Caliper
  const caliperGeo = new THREE.BoxGeometry(0.12, 0.15, 0.08);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    metalness: 0.6,
    roughness: 0.3,
  });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0.05, 0.12, 0);
  wheelGroup.add(caliper);

  return wheelGroup;
}

export function createPlayerCar(carData: CarData, overrideColor?: string): CarMeshContainer {
  const root = new THREE.Group();
  const hexColor = overrideColor || carData.primaryColor;

  const primaryMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hexColor),
    metalness: 0.85,
    roughness: 0.22,
    envMapIntensity: 1.5,
  });

  const wheels: THREE.Group[] = [];
  const frontWheels: THREE.Group[] = [];
  const exhaustFlames: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];

  // Main chassis base
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  let mainBodyMesh: THREE.Mesh;

  if (carData.modelType === 'prototype') {
    // Le Mans / Formula Prototype Style
    const mainBodyGeo = new THREE.BoxGeometry(1.6, 0.32, 4.4);
    mainBodyMesh = new THREE.Mesh(mainBodyGeo, primaryMaterial);
    mainBodyMesh.position.y = 0.36;
    mainBodyMesh.castShadow = true;
    bodyGroup.add(mainBodyMesh);

    // Aerodynamic Cockpit Dome
    const cockpitGeo = new THREE.ConeGeometry(0.5, 2.2, 8);
    cockpitGeo.rotateX(Math.PI / 2);
    const cockpit = new THREE.Mesh(cockpitGeo, glassMaterial);
    cockpit.position.set(0, 0.6, -0.2);
    bodyGroup.add(cockpit);

    // Giant Carbon Rear Wing & Fin
    const finGeo = new THREE.BoxGeometry(0.06, 0.5, 1.8);
    const fin = new THREE.Mesh(finGeo, carbonMaterial);
    fin.position.set(0, 0.7, 1.0);
    bodyGroup.add(fin);

    const wingGeo = new THREE.BoxGeometry(2.0, 0.05, 0.5);
    const wing = new THREE.Mesh(wingGeo, carbonMaterial);
    wing.position.set(0, 0.9, 1.8);
    bodyGroup.add(wing);

    // Front wing splitter
    const splitterGeo = new THREE.BoxGeometry(1.9, 0.04, 0.7);
    const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitter.position.set(0, 0.22, -2.0);
    bodyGroup.add(splitter);

  } else if (carData.modelType === 'roadster') {
    // Open-top Roadster
    const mainBodyGeo = new THREE.BoxGeometry(1.7, 0.42, 4.1);
    mainBodyMesh = new THREE.Mesh(mainBodyGeo, primaryMaterial);
    mainBodyMesh.position.y = 0.42;
    mainBodyMesh.castShadow = true;
    bodyGroup.add(mainBodyMesh);

    // Interior cockpit cutout + Windshield
    const shieldGeo = new THREE.BoxGeometry(1.3, 0.35, 0.05);
    shieldGeo.rotateX(-0.4);
    const windshield = new THREE.Mesh(shieldGeo, glassMaterial);
    windshield.position.set(0, 0.75, -0.4);
    bodyGroup.add(windshield);

    // Twin roll bars
    for (const x of [-0.4, 0.4]) {
      const rollBarGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16, Math.PI);
      const rollBar = new THREE.Mesh(rollBarGeo, carbonMaterial);
      rollBar.position.set(x, 0.7, 0.3);
      bodyGroup.add(rollBar);
    }
  } else if (carData.modelType === 'hypercar' || carData.modelType === 'supercar') {
    // Sleek Hypercar / Supercar with sharp angular canopy
    const mainBodyGeo = new THREE.BoxGeometry(1.75, 0.44, 4.2);
    mainBodyMesh = new THREE.Mesh(mainBodyGeo, primaryMaterial);
    mainBodyMesh.position.y = 0.42;
    mainBodyMesh.castShadow = true;
    bodyGroup.add(mainBodyMesh);

    // Wedge Cabin
    const cabinGeo = new THREE.BoxGeometry(1.3, 0.42, 1.9);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, 0.76, 0.1);
    bodyGroup.add(cabin);

    // Roof scoop
    const scoopGeo = new THREE.BoxGeometry(0.35, 0.14, 0.6);
    const scoop = new THREE.Mesh(scoopGeo, carbonMaterial);
    scoop.position.set(0, 1.0, 0.0);
    bodyGroup.add(scoop);

    // Aggressive GT Wing
    const wingGeo = new THREE.BoxGeometry(1.85, 0.06, 0.4);
    const wing = new THREE.Mesh(wingGeo, carbonMaterial);
    wing.position.set(0, 0.88, 1.7);
    bodyGroup.add(wing);

    // Wing Struts
    for (const sx of [-0.5, 0.5]) {
      const strutGeo = new THREE.BoxGeometry(0.04, 0.35, 0.1);
      const strut = new THREE.Mesh(strutGeo, carbonMaterial);
      strut.position.set(sx, 0.72, 1.7);
      bodyGroup.add(strut);
    }
  } else {
    // Coupe / GT Sport
    const mainBodyGeo = new THREE.BoxGeometry(1.7, 0.48, 4.2);
    mainBodyMesh = new THREE.Mesh(mainBodyGeo, primaryMaterial);
    mainBodyMesh.position.y = 0.45;
    mainBodyMesh.castShadow = true;
    bodyGroup.add(mainBodyMesh);

    // Sport Cabin
    const cabinGeo = new THREE.BoxGeometry(1.35, 0.48, 2.1);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, 0.82, 0.1);
    bodyGroup.add(cabin);

    // Lip Spoiler
    const lipGeo = new THREE.BoxGeometry(1.6, 0.12, 0.2);
    const lip = new THREE.Mesh(lipGeo, carbonMaterial);
    lip.position.set(0, 0.68, 2.05);
    bodyGroup.add(lip);
  }

  // Front Headlights (Twin glowing lenses)
  for (const hx of [-0.62, 0.62]) {
    const hLightGeo = new THREE.BoxGeometry(0.28, 0.12, 0.15);
    const hLight = new THREE.Mesh(hLightGeo, headlightMaterial);
    hLight.position.set(hx, 0.44, -2.05);
    bodyGroup.add(hLight);
    headlights.push(hLight);

    // Spot-like flare beam cone
    const beamGeo = new THREE.ConeGeometry(0.5, 5.0, 8, 1, true);
    beamGeo.rotateX(-Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x88ddff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(hx, 0.4, -4.5);
    bodyGroup.add(beam);
  }

  // Rear Taillights (Continuous glowing LED bar)
  const tLightGeo = new THREE.BoxGeometry(1.5, 0.1, 0.1);
  const tLight = new THREE.Mesh(tLightGeo, taillightMaterial);
  tLight.position.set(0, 0.52, 2.08);
  bodyGroup.add(tLight);
  taillights.push(tLight);

  // Four Wheels: Front-Left, Front-Right, Rear-Left, Rear-Right
  const wheelPositions = [
    { x: -0.9, y: 0.38, z: -1.3, isFront: true },
    { x: 0.9, y: 0.38, z: -1.3, isFront: true },
    { x: -0.9, y: 0.38, z: 1.3, isFront: false },
    { x: 0.9, y: 0.38, z: 1.3, isFront: false },
  ];

  wheelPositions.forEach((pos) => {
    const wheel = createWheel();
    wheel.position.set(pos.x, pos.y, pos.z);
    if (pos.x > 0) {
      wheel.rotation.y = Math.PI;
    }
    root.add(wheel);
    wheels.push(wheel);
    if (pos.isFront) {
      frontWheels.push(wheel);
    }
  });

  // Dual Exhaust Pipes & Animated Nitro Flames
  for (const ex of [-0.4, 0.4]) {
    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 12);
    pipeGeo.rotateX(Math.PI / 2);
    const pipe = new THREE.Mesh(pipeGeo, carbonMaterial);
    pipe.position.set(ex, 0.28, 2.05);
    bodyGroup.add(pipe);

    // Nitro Flame Cone
    const flameGeo = new THREE.ConeGeometry(0.12, 1.2, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(ex, 0.28, 2.7);
    bodyGroup.add(flame);
    exhaustFlames.push(flame);
  }

  // Underglow Neon Glow Plane
  const underglowGeo = new THREE.PlaneGeometry(1.8, 3.8);
  underglowGeo.rotateX(-Math.PI / 2);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(carData.underglowColor || '#00e5ff'),
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const underglow = new THREE.Mesh(underglowGeo, underglowMat);
  underglow.position.set(0, 0.06, 0);
  root.add(underglow);

  // Power-Up: Shield Energy Bubble (Hidden initially)
  const shieldGeo = new THREE.IcosahedronGeometry(2.3, 3);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00a2ff,
    emissiveIntensity: 1.5,
    wireframe: true,
    transparent: true,
    opacity: 0.0,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.set(0, 0.6, 0);
  root.add(shieldMesh);

  // Power-Up: Magnet Ring Aura (Hidden initially)
  const magnetGroup = new THREE.Group();
  for (let r = 0; r < 2; r++) {
    const ringGeo = new THREE.TorusGeometry(1.8 + r * 0.4, 0.04, 8, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffb700,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    magnetGroup.add(ring);
  }
  magnetGroup.position.set(0, 0.4, 0);
  root.add(magnetGroup);

  return {
    root,
    bodyMesh: mainBodyMesh,
    wheels,
    frontWheels,
    exhaustFlames,
    headlights,
    taillights,
    underglow,
    shieldMesh,
    magnetEffectMesh: magnetGroup,
    primaryMaterial,
    bodyColor: hexColor,
  };
}

export type TrafficType = 'sedan' | 'suv' | 'sports' | 'truck' | 'van';

export interface TrafficMeshContainer {
  root: THREE.Group;
  type: TrafficType;
  wheels: THREE.Group[];
  width: number;
  length: number;
  height: number;
}

const TRAFFIC_COLORS = [
  0xd90429, // Cherry Red
  0x118ab2, // Ocean Blue
  0x06d6a0, // Emerald
  0xffd166, // Mustard Yellow
  0x3a0ca3, // Deep Violet
  0xf8f9fa, // Pearl White
  0x2b2d42, // Shadow Grey
  0xf77f00, // Orange
];

export function createTrafficVehicle(type: TrafficType): TrafficMeshContainer {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const randomColor = TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: randomColor,
    metalness: 0.6,
    roughness: 0.35,
  });

  let width = 1.7;
  let length = 4.0;
  let height = 1.3;

  if (type === 'truck') {
    width = 2.1;
    length = 6.2;
    height = 2.4;

    // Cabin
    const cabGeo = new THREE.BoxGeometry(2.0, 1.5, 1.8);
    const cab = new THREE.Mesh(cabGeo, bodyMat);
    cab.position.set(0, 1.1, -1.9);
    cab.castShadow = true;
    root.add(cab);

    // Windshield
    const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.1), glassMaterial);
    cabGlass.position.set(0, 1.3, -2.85);
    root.add(cabGlass);

    // Cargo Container
    const cargoMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.6,
      metalness: 0.2,
    });
    const cargoGeo = new THREE.BoxGeometry(2.1, 2.0, 4.2);
    const cargo = new THREE.Mesh(cargoGeo, cargoMat);
    cargo.position.set(0, 1.35, 0.9);
    cargo.castShadow = true;
    root.add(cargo);

    // 6 Wheels for Truck
    const wheelZ = [-2.0, 1.0, 2.2];
    wheelZ.forEach((z) => {
      [-1.05, 1.05].forEach((x) => {
        const wheel = createWheel();
        wheel.scale.set(1.15, 1.15, 1.15);
        wheel.position.set(x, 0.42, z);
        if (x > 0) wheel.rotation.y = Math.PI;
        root.add(wheel);
        wheels.push(wheel);
      });
    });

  } else if (type === 'suv' || type === 'van') {
    width = 1.8;
    length = 4.4;
    height = 1.6;

    const bodyGeo = new THREE.BoxGeometry(1.8, 0.9, 4.2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.75, 0);
    body.castShadow = true;
    root.add(body);

    const roofGeo = new THREE.BoxGeometry(1.5, 0.6, 2.6);
    const roof = new THREE.Mesh(roofGeo, glassMaterial);
    roof.position.set(0, 1.25, 0.3);
    root.add(roof);

    // 4 Wheels
    [-1.0, 1.0].forEach((x) => {
      [-1.4, 1.4].forEach((z) => {
        const wheel = createWheel();
        wheel.position.set(x, 0.4, z);
        if (x > 0) wheel.rotation.y = Math.PI;
        root.add(wheel);
        wheels.push(wheel);
      });
    });

  } else {
    // Sedan or Standard Sport
    width = 1.7;
    length = 4.0;
    height = 1.3;

    const bodyGeo = new THREE.BoxGeometry(1.7, 0.45, 4.0);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.45, 0);
    body.castShadow = true;
    root.add(body);

    const cabinGeo = new THREE.BoxGeometry(1.35, 0.45, 2.0);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, 0.78, 0.1);
    root.add(cabin);

    // 4 Wheels
    [-0.9, 0.9].forEach((x) => {
      [-1.3, 1.3].forEach((z) => {
        const wheel = createWheel();
        wheel.position.set(x, 0.38, z);
        if (x > 0) wheel.rotation.y = Math.PI;
        root.add(wheel);
        wheels.push(wheel);
      });
    });
  }

  // Red Taillights for all traffic
  const tlGeo = new THREE.BoxGeometry(width * 0.75, 0.1, 0.08);
  const tl = new THREE.Mesh(tlGeo, taillightMaterial);
  tl.position.set(0, 0.55, length / 2 + 0.02);
  root.add(tl);

  // Front Headlights
  const hlGeo = new THREE.BoxGeometry(width * 0.75, 0.1, 0.08);
  const hl = new THREE.Mesh(hlGeo, headlightMaterial);
  hl.position.set(0, 0.55, -length / 2 - 0.02);
  root.add(hl);

  return {
    root,
    type,
    wheels,
    width,
    length,
    height,
  };
}
