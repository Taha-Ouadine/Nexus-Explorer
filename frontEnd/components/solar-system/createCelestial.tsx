import * as THREE from "three";
import { CelestialData } from "./universe-data";
import { scaleDistance, scaleRadius } from "./universe-utils";

export interface CelestialBody {
  scene: THREE.Scene;
  isSubject?: boolean;
  
  name: string;
  type?: string;
  position?: THREE.Vector3;
  color?: number;

  radius: number;
  distance?: number;
  period?: number;

  mesh?: THREE.Mesh;
  lightSource?: THREE.Light;

  orbitLine?: THREE.LineLoop<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  orbitGroup?: THREE.Group;
  orbitNormal?: THREE.Vector3;
  _lastOrbitNormal?: THREE.Vector3;
  orbitQuat?: THREE.Quaternion;

  trajectory?: THREE.Vector3;

  parent?: CelestialBody;
  children?: CelestialBody[];

  ring?: THREE.Group;
  ringMat?: THREE.LineLoop;
  ringFill?: THREE.Mesh;
  viewRing?: boolean;
}

export function createOrbitLine(
  distance: number,
  color: number,
  centralBody: CelestialBody,
  orbitNormal: THREE.Vector3
) {
  const orbitGroup = new THREE.Group();
  const orbitCenter = centralBody.mesh?.position ?? new THREE.Vector3(0,0,0);
  orbitGroup.position.copy(orbitCenter);

  const points: THREE.Vector3[] = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    points.push(new THREE.Vector3(Math.cos(theta)*distance, Math.sin(theta)*distance, 0));
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);

  // Rotate to orbitNormal
  const defaultNormal = new THREE.Vector3(0,0,1);
  const q = new THREE.Quaternion().setFromUnitVectors(defaultNormal, orbitNormal.clone().normalize());
  geo.applyQuaternion(q);

  const mat = new THREE.LineBasicMaterial({ color, opacity: 0.5, transparent: true });
  const line = new THREE.LineLoop(geo, mat);

  orbitGroup.add(line);

  return { line, orbitGroup };
}

export function createFocusRing(body: CelestialBody, viewRing: boolean, radius: number=0, absolute: boolean=false) {
  if (radius==0) { radius=body.radius; }
  if (!absolute) { radius = 0.05*(radius + Math.sqrt(radius)); }
  const innerRadius = radius;
  const outerRadius = radius + 0.01;
  const segments = 64;

  // Visual outline (thin ring look)
  const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, segments);
  const ringMat = new THREE.LineBasicMaterial({ 
    color: body.color ?? 0xffffff, 
    opacity: 0.01, 
    transparent: true 
  });
  const ringOutline = new THREE.LineLoop(ringGeo, ringMat);

  // Invisible fill for clicks
  const ringFillGeo = new THREE.RingGeometry(0, outerRadius, segments); 
  const ringFillMat = new THREE.MeshBasicMaterial({ 
    transparent: true, 
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const ringFill = new THREE.Mesh(ringFillGeo, ringFillMat);
  ringFill.userData.body = body;

  // Group
  const ringGroup = new THREE.Group();
  ringGroup.add(ringOutline);
  ringGroup.add(ringFill);

  if (!viewRing) {ringGroup.visible = false;}

  body.ring = ringGroup;
  body.ringMat = ringOutline;
  body.ringFill = ringFill;
  body.viewRing = viewRing;
}




function tryLoadTexture(mat: THREE.MeshStandardMaterial, paths: string[]) {
  if (paths.length === 0) return;
  const loader = new THREE.TextureLoader();
  loader.load(
    paths[0],
    tex => { mat.map = tex; mat.needsUpdate = true; },
    undefined,
    () => tryLoadTexture(mat, paths.slice(1))
  );
}

function loadTexture(data: CelestialData): THREE.MeshStandardMaterial {
  let mat = new THREE.MeshStandardMaterial({ color: data.color ?? 0xffffff });
  if (data.texture) {
    const paths: string[] = [];
    paths.push(data.texture);
    paths.push(`/planet-textures/${data.name.toLowerCase()}.jpg`);
    tryLoadTexture(mat, paths);
    return mat;
  }
  if (data.type=="planet"||data.type=="moon") return generatePlanetTexture(data);
  return mat
}

function generatePlanetTexture(data: CelestialData): THREE.MeshStandardMaterial {
  const color = data.color ?? 0xffffff;
  
  if (data.materialType === "gassy") {
    // Create gas giant with turbulent pattern
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Gas giant bands
    for (let i = 0; i < 10; i++) {
      const bandHeight = 20 + Math.random() * 10;
      const y = i * 25;
      const bandColor = new THREE.Color(color)
        .offsetHSL(Math.random() * 0.1 - 0.05, Math.random() * 0.2, Math.random() * 0.1 - 0.05);
      
      ctx.fillStyle = `#${bandColor.getHexString()}`;
      ctx.fillRect(0, y, canvas.width, bandHeight);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1,
    });
    
  } else {
    // Rocky planet with crater-like noise
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base color
    ctx.fillStyle = `#${new THREE.Color(color).getHexString()}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some crater-like spots
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 5 + Math.random() * 15;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.3,
      bumpScale: 0.1,
    });
  }
}




export function createCelestialBody(
  scene: THREE.Scene,
  data: CelestialData,
  bodyMap: Map<string, CelestialBody>,
  viewOrbit: boolean = false, viewRing: boolean = false
): CelestialBody {
    // Distance scale softening
    let radius_3D, distance_3D : number;
    if (!data.distance) {data.distance=0;}
    switch (data.type) {
      case "planet":
        radius_3D=scaleRadius(data.radius, { radiusScale: 0.05, minSize: 0.12 });
        distance_3D=scaleDistance(data.distance, { scaleLen: 1e8, baseScale: 100 });
        break;
      case "moon":
        radius_3D=scaleRadius(data.radius, { radiusScale: 0.05, minSize: 0.12 });
        distance_3D=scaleDistance(data.distance, { scaleLen: 2.5e6, baseScale: 40 });
        break;
      case "star":
        radius_3D=scaleRadius(data.radius, { radiusScale: 0.03, minSize: 0.12 });
        distance_3D=scaleDistance(data.distance, { scaleLen: 1e8, baseScale: 400 });
        break;
      default:
        radius_3D=scaleRadius(data.radius, { radiusScale: 0.05, minSize: 0.12 });
        distance_3D=scaleDistance(data.distance, { scaleLen: 1e8, baseScale: 100 });
    }

    const parentBody = data.parent ? bodyMap.get(data.parent) : undefined;
    if (parentBody) { distance_3D+=parentBody.radius; }

    const geo = new THREE.SphereGeometry(radius_3D, 64, 64);

    // Material
    const mat = loadTexture(data);

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const orbitalCenter = parentBody?.mesh?.position.clone() ?? new THREE.Vector3(0,0,0);

    const orbitNormal = data.orbitNormal ? new THREE.Vector3(...data.orbitNormal) : (parentBody?.orbitNormal ? new THREE.Vector3(...parentBody?.orbitNormal) : new THREE.Vector3(0,1,0));
    const orbitQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), orbitNormal.clone().normalize());

    const body: CelestialBody = {
        scene: scene,
        name: data.name,
        type: data.type,
        radius: radius_3D,
        color: data.color,
        distance: distance_3D,
        period: data.period,
        orbitNormal: orbitNormal,
        _lastOrbitNormal: orbitNormal.clone(),
        orbitQuat: orbitQuat,
        mesh: mesh,
        parent: parentBody,
        children: [],
    };
    
    const pos_scale = 1e-10;
    if (data.position) { body.position = data.position.clone().multiplyScalar(pos_scale); }

    if (data.lightSource) { body.lightSource = data.lightSource; }
    if (data.trajectory) { body.trajectory = data.trajectory; }

    if (parentBody) { parentBody.children?.push(body); }
    else if (body.position) { // Position in 3D space if there is no parent
      body.mesh!.position.copy(body.position);
    }

    // Orbit line
    if (viewOrbit) {
        if (body.distance && body.period && parentBody) {
            const { line, orbitGroup } = createOrbitLine(body.distance, body.color ?? 0xffffff, parentBody, orbitNormal);
            body.orbitLine = line;
            body.orbitGroup = orbitGroup;
            scene.add(orbitGroup);
        }
    }
    // Focus Ring
    createFocusRing(body, viewRing);
    scene.add(body.ring!);

    // To make meshes clickable
    body.mesh!.userData.body = body;
    if (body.ringFill) body.ringFill.userData.body = body;

    // Light Source
    if (body.lightSource) {
        body.lightSource.position.copy(body.mesh!.position);
        scene.add(body.lightSource);
    }

    return body;
}
