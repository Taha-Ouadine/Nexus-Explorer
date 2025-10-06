import * as THREE from "three";
import { CelestialBody, createCelestialBody, createFocusRing } from "./createCelestial";
import { CelestialData } from "./universe-data";

export const isVisible = (
    camera: THREE.PerspectiveCamera, frustum: THREE.Frustum, cameraViewProjectionMatrix: THREE.Matrix4,
    obj: THREE.Object3D
) => {
    camera.updateMatrixWorld();
    cameraViewProjectionMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
    return frustum.intersectsObject(obj);
};

export const worldToScreen = (
    camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, pos: THREE.Vector3
) => {
    const vector = pos.clone().project(camera);
    return new THREE.Vector2(
    (vector.x * 0.5 + 0.5) * renderer.domElement.width,
    (-vector.y * 0.5 + 0.5) * renderer.domElement.height
    );
};

function getScreenRadius(mesh: THREE.Mesh, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
  const distance = camera.position.distanceTo(mesh.position);
  const halfFovRad = THREE.MathUtils.degToRad(camera.fov / 2);

  const visibleHeightAtDist = 2 * Math.tan(halfFovRad) * distance;
  const pixelsPerUnit = renderer.domElement.height / visibleHeightAtDist;

  const radiusWorld = mesh.scale.x * 0.5;
  return radiusWorld * pixelsPerUnit; // radius in pixels on screen
}

const getParentMaxScreenSize = (parent: CelestialBody, camera: THREE.PerspectiveCamera) => {
  if (!parent.children || parent.children.length === 0) return 0;
  let maxDistance = 0;
  parent.children.forEach(child => {
    if (!child.mesh) return;
    const dist = parent.mesh!.position.distanceTo(child.mesh.position);
    if (dist > maxDistance) maxDistance = dist;
  });

  // Use angular size approximation
  const distanceToCamera = camera.position.distanceTo(parent.mesh!.position);
  return (maxDistance / distanceToCamera);
};




export const updateRings = (
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  frustum: THREE.Frustum,
  cameraViewProjectionMatrix: THREE.Matrix4,
  bodies: CelestialBody[]
) => {

  let planets = bodies.filter(p => p.mesh && isVisible(camera, frustum, cameraViewProjectionMatrix, p.mesh));

  // 1. Precompute ring screen positions & sizes
  type RingInfo = {
    p: CelestialBody;
    screenCenter: THREE.Vector2;
    radius: number; // screen radius
    hasParent: boolean;
  };

  const ringInfos: RingInfo[] = [];

  planets.forEach(p => {
    if (!p.mesh || !p.ring) return;

    const distance = camera.position.distanceTo(p.mesh.position);
    const screenSize = distance * 0.05;

    if (p.viewRing ?? false) {
        if (!isVisible(camera, frustum, cameraViewProjectionMatrix, p.mesh)) {
        p.ring.visible = false;
        return;
        }

        const screenRatio = 0.01;
        const minPixels = renderer.domElement.height * screenRatio;
        if (screenSize < minPixels) {
            p.ring.visible = false;
            return;
        }

        p.ring.scale.set(screenSize, screenSize, 1);
    }
    else {
        // Ring equals planet radius
        const radius = Math.log10(p.radius);
        p.ring.scale.set(radius, radius, 1);
        p.ring.visible = true;
    }

    p.ring.position.copy(p.mesh.position);
    p.ring.lookAt(camera.position);

    // Compute screen center
    const screenc = worldToScreen(camera, renderer, p.ring.position);
    ringInfos.push({ 
      p, 
      screenCenter: screenc, 
      radius: screenSize * 0.5,
      hasParent: !!p.parent 
    });
    if (p.viewRing ?? false) {
        if ('opacity' in p.ringMat!.material) p.ringMat!.material.opacity = 0.5; // base opacity
        p.ring.visible = true;
    }
    else { p.ring.visible = false; }

    // Ring disapears if parent becomes too compressed. Parent ring then becomes visible.
    if (p.parent?.mesh) {
      const parentSize = getParentMaxScreenSize(p.parent, camera);
      if (parentSize < 0.1) { // threshold
        // Ignore if this parent itself has a parent in the same situation
        if (p.parent.parent?.mesh && getParentMaxScreenSize(p.parent.parent, camera)<0.1) {}
        else {
          p.parent.children!.forEach(child => {
            if (!(child.mesh && child.ring)) return;
            child.ring.visible = false;
          });
          if (!p.parent.ring || !p.parent.ring.visible) { // parent has no ring: create it
            console.log("System Ring: " + p.parent.name);
            const systemRadius = p.parent.children!.reduce((max, child) => {
              if (!child.mesh) return max;
              return Math.max(max, p.parent!.mesh!.position.distanceTo(child.mesh.position));
            }, 0) * screenSize * 1e-5;
            createFocusRing(p.parent, true, systemRadius, true);
            p.parent.scene.add(p.parent.ring!);
          }
          p.parent.ring!.visible = true;
        }
      }
      else if (p.parent.ring) { p.parent.ring.visible = false; }
    }
  });

  // Filter out rings that we want to be invisible
  planets = bodies.filter(p => (p.viewRing??false));

  // 2. Sort ringInfos by priority: parents first, and separate parented vs non-parented
  const parentedRings = ringInfos.filter(info => info.hasParent);
  const independentRings = ringInfos.filter(info => !info.hasParent);

  // Sort parented rings by hierarchy and size
  parentedRings.sort((a, b) => {
    // If a is ancestor of b, a first
    if (isAncestor(a.p, b.p)) return -1;
    if (isAncestor(b.p, a.p)) return 1;
    // else fallback: sort by larger screen radius first
    return b.radius - a.radius;
  });

  // Helper: checks if x is ancestor of y
  function isAncestor(x: CelestialBody, y: CelestialBody): boolean {
    let cur = y.parent;
    while (cur) {
      if (cur === x) return true;
      cur = cur.parent;
    }
    return false;
  }

  // 3. Only apply overlap fading to parented rings
  for (let i = 0; i < parentedRings.length; i++) {
    const { p: pHigh, screenCenter: cHigh, radius: rHigh } = parentedRings[i];

    for (let j = i + 1; j < parentedRings.length; j++) {
      const { p: pLow, screenCenter: cLow, radius: rLow } = parentedRings[j];

      const d = cHigh.distanceTo(cLow);
      const overlap = rHigh + rLow - d;
      if (overlap > 0) {
        // Fade the lower priority ring proportionally
        const fade = overlap / Math.min(rHigh, rLow);
        if ('opacity' in pLow.ringMat!.material) pLow.ringMat!.material.opacity *= (1 - fade);
      }
    }
  }

  // 4. Hide very faint rings (only check parented rings since independent rings don't fade)
  parentedRings.forEach(({ p }) => {
    if (p.ring && ('opacity' in p.ringMat!.material) && p.ringMat!.material.opacity < 0.05) {
      p.ring.visible = false;
    }
  });
};






export const clickableRings = (
  camera: THREE.PerspectiveCamera,
  mouse: THREE.Vector2,
  renderer: THREE.WebGLRenderer,
  planets: CelestialBody[],
  onClick: (planet: CelestialBody) => void,
  raycaster = new THREE.Raycaster(),
) => {
  renderer.domElement.addEventListener("contextmenu", (event) => {
    event.preventDefault();

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.far = 1000000;
    raycaster.near = 0.1;

    // Collect visible rings and meshes
    const clickableObjects = [];
    for (const p of planets) {
      if (p.ring && (!(p.viewRing??false) || p.ring.visible) && p.ringFill) {
        p.ringFill.traverse((child) => {
          if (child instanceof THREE.Mesh) { child.frustumCulled = false; }
        });
        clickableObjects.push(p.ringFill);
      }
      if (p.mesh) {
        p.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) { child.frustumCulled = false; }
        });
        clickableObjects.push(p.mesh);
      }
    }

    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
      const clickedPlanet = intersects[0].object.userData.body;
      if (clickedPlanet) {
        onClick(clickedPlanet);
      }
    }
  });
};


export const updateCameraFocus = (
  camera: THREE.PerspectiveCamera | null,
  controls: any | null,
  planet: CelestialBody,
  scrollDistance: number
) => {
  if (!camera || !controls || !planet.mesh) return;

  // Direction from planet to camera
  const dir = new THREE.Vector3()
    .subVectors(camera.position, controls.target)
    .normalize();

  // Set camera position relative to planet
  camera.position.copy(planet.mesh.position).add(dir.multiplyScalar(scrollDistance));

  // Look at planet
  camera.lookAt(planet.mesh.position);

  // Update OrbitControls target
  controls.target.copy(planet.mesh.position);
  controls.update();
}



export const goToBody = (
  camera: THREE.PerspectiveCamera | null,
  controls: any | null,
  planet: CelestialBody,
  renderer: THREE.WebGLRenderer | null,
  targetRatio: number
) => {
  if (!camera || !controls || !renderer || !planet.mesh) return;

  const radius = planet.radius;
  const fov = (camera.fov * Math.PI) / 180;

  // Compute distance so planet fills the target screen ratio
  const distance = radius / Math.tan(fov * 0.8 * targetRatio);

  const dir = new THREE.Vector3()
    .subVectors(camera.position, planet.mesh.position)
    .normalize();
  camera.position.copy(planet.mesh.position).add(dir.multiplyScalar(distance));
  camera.lookAt(planet.mesh.position);
  controls.target.copy(planet.mesh.position);
  controls.update();

  console.log("Select Body: ", planet.name);
}







export const addStars = (scene: THREE.Scene, camera: THREE.PerspectiveCamera, count=5000) => {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];

  const spread = 1e5; // large cube

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * spread;
    const y = (Math.random() - 0.5) * spread;
    const z = (Math.random() - 0.5) * spread;
    positions.push(x, y, z);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    sizeAttenuation: true,
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);

  // helper to keep stars around camera
  const updateStars = () => {
    stars.position.copy(camera.position);
  };

  return updateStars;
};




export function scaleDistance(
  realDist: number,            // actual distance, e.g. km
  opts: {
    scaleLen?: number,        // length scale that defines transition (km)
    baseScale?: number,       // multiplier controlling final "zoom"
    zoomFactor?: number       // global zoom controlled by UI
  } = {}
): number {
  const {
    scaleLen = 1e8,   // 100,000,000 km: transition scale (tweakable)
    baseScale = 40,   // overall multiplier (scene units)
    zoomFactor = 1.0, // user-controlled zoom
  } = opts;

  // asinh(realDist / scaleLen) gives smooth linear->log behaviour
  const val = Math.asinh(realDist / scaleLen); 
  return (baseScale * val) / Math.max(1e-9, zoomFactor);
}


export function scaleRadius(
  realRadius: number,  // actual radius in km
  opts: {
    radiusScale?: number,  // empirical multiplier
    minSize?: number,      // minimum size in scene units
    maxSize?: number       // optional cap
  } = {}
): number {
  const {
    radiusScale = 0.005, // tuned for visibility
    minSize = 0.15,
    maxSize = Infinity
  } = opts;

  // Use sqrt or log to compress dynamic range but keep differences visible
  const scaled = Math.max(minSize, Math.sqrt(realRadius) * radiusScale);
  return Math.min(maxSize, scaled);
}

/*export function scaleRadius(
  realRadius: number,
  opts: {
    radiusScale?: number,
    minSize?: number,
    maxSize?: number
  } = {}
): number {
  const {
    radiusScale = 0.005,
    minSize = 0.1,
    maxSize = 50
  } = opts;

  const scaled = Math.max(minSize, Math.log10(realRadius + 1) * radiusScale * 1000);
  return Math.min(maxSize, scaled);
}*/