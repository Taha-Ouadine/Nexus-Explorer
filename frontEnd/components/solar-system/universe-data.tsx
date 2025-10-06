import * as THREE from "three";

export interface CelestialData {
  name: string;
  type: "star" | "planet" | "moon" | "asteroid";
  position?: THREE.Vector3; // Optional absolute distance if no parent
  radius: number; // (km)
  color?: number;
  texture?: string;
  distance?: number; // orbit distance (km)
  period?: number;   // orbit period
  parent?: string;   // parent body name
  orbitNormal?: [number, number, number];
  trajectory?: THREE.Vector3; // Linear speed trajectory if no parent
  lightSource?: THREE.Light;
  viewOrbit?: boolean;
  viewRing?: boolean;
  materialType?: "rocky" | "gassy";
}

// Important Note : Create parent before its children !


import { KeplerPlanet, planetHost } from "@/lib/kepler-data";

export const keplerToCelestialData = (keplerData: KeplerPlanet[]): CelestialData[] => {
  const celestialData: CelestialData[] = [];
  
  const starsMap = new Map<string, KeplerPlanet[]>();
  keplerData.forEach(planet => {
    if (!starsMap.has(planetHost(planet))) {
      starsMap.set(planetHost(planet), []);
    }
    starsMap.get(planetHost(planet))!.push(planet);
  });

  starsMap.forEach((planets, starName) => {
    const firstPlanet = planets[0];
    
    const starData: CelestialData = {
      name: starName,
      type: "star",
      position: calculateStarPosition(firstPlanet.ra, firstPlanet.dec, firstPlanet.distance_ly),
      radius: (firstPlanet.koi_srad || 1) * 696340,
      color: getStarColor(firstPlanet.koi_steff),
      lightSource: new THREE.PointLight(getStarColor(firstPlanet.koi_steff), 50),
      viewRing: true
    };
    
    celestialData.push(starData);

    planets.forEach(planet => {
      
      const planetData: CelestialData = {
        name: planet.kepler_name || planet.kepoi_name,
        type: "planet",
        radius: (planet.koi_prad || 0.1) * 6371,
        color: getPlanetColor(planet.koi_teq),
        distance: calculateOrbitDistance(planet.koi_period, starData.radius),
        period: planet.koi_period || 365,
        parent: starName,
        orbitNormal: [0, 1, 0],
        viewOrbit: true,
        viewRing: true,
        materialType: (planet.koi_prad || 0) > 2 ? "gassy" : "rocky"
      };
      
      celestialData.push(planetData);
    });
  });

  // Center the first star
  if (celestialData.length > 0) {
    const firstStarPosition = celestialData[0].position?.clone() || new THREE.Vector3(0, 0, 0);
    
    celestialData.forEach(data => {
      if (data.position) {
        data.position.sub(firstStarPosition);
      }
    });
  }

  return celestialData;
}

// Helper functions
function getStarColor(temperature: number): number {
  if (temperature > 10000) return 0x9bb0ff; // Blue
  if (temperature > 6000) return 0xffffff; // White
  if (temperature > 4000) return 0xfff4ea; // Yellow-white
  if (temperature > 3000) return 0xffb347; // Orange
  return 0xff4500; // Red
}

function getPlanetColor(temperature: number): number {
  // Hot planets (>500K) - Rocky, lava-like
  if (temperature > 500) return 0xd94a3d; // Deep red-orange (lava)
  // Warm planets (300-500K) - Rocky/desert
  if (temperature > 300) return 0xc2956e; // Sandy brown
  // Temperate planets (200-300K) - Earth-like or icy
  if (temperature > 200) return 0x5a8fb5; // Ocean blue
  // Cold planets (100-200K) - Gas giants
  if (temperature > 100) return 0xa89f91; // Pale beige (Jupiter-like)
  // Very cold (<100K) - Ice giants
  return 0x6b9bd1; // Pale blue (Neptune-like)
}

function calculateOrbitDistance(periodDays: number, starRadius: number): number {
  // Using Kepler's third law: T² ∝ R³
  // Simplified: R = (T²)^(1/3) * scaleFactor
  const scaleFactor = 1e7; // Adjust this for visualization
  return Math.pow(Math.pow(periodDays, 2), 1/3) * scaleFactor;
}

function calculateStarPosition(ra: number, dec: number, distanceLy: number): THREE.Vector3 {
  // Convert astronomical coordinates to 3D position
  // RA (right ascension) to longitude, Dec (declination) to latitude
  const distanceKm = distanceLy * 9.461e12; // Convert light years to km
  
  const phi = (ra * Math.PI) / 12; // RA hours to radians
  const theta = (dec * Math.PI) / 180; // Dec degrees to radians
  
  return new THREE.Vector3(
    distanceKm * Math.cos(theta) * Math.cos(phi),
    distanceKm * Math.sin(theta),
    distanceKm * Math.cos(theta) * Math.sin(phi)
  );
}





import {CelestialBody} from "./createCelestial";

export const printCelestialDataDetailed = (data: CelestialData | CelestialBody) => {
  console.log("=== Celestial Object ===");
  console.log("Name:", data.name);
  console.log("Type:", data.type || "unknown");
  console.log("Radius:", data.radius, "km");
  console.log("Color:", data.color ? `0x${data.color.toString(16)}` : "undefined");
  
  if (data.position) {
    console.log("Position:", `x: ${data.position.x}, y: ${data.position.y}, z: ${data.position.z}`);
  }
  
  if (data.distance) {
    console.log("Orbit Distance:", data.distance.toLocaleString(), "km");
  }
  
  if (data.period) {
    console.log("Orbital Period:", data.period, "days");
  }
  
  // Handle parent differently for CelestialData vs CelestialBody
  if ('parent' in data) {
    if (typeof data.parent === 'string') {
      // CelestialData case
      console.log("Parent:", data.parent || "none");
    } else if (data.parent) {
      // CelestialBody case
      console.log("Parent:", data.parent.name || "unnamed parent");
    } else {
      console.log("Parent:", "none");
    }
  }
  
  console.log("View Ring:", data.viewRing ?? false);
  
  // CelestialBody specific properties
  if ('scene' in data) {
    console.log("Has Mesh:", !!data.mesh);
    console.log("Has Light Source:", !!data.lightSource);
    console.log("Has Orbit Line:", !!data.orbitLine);
    console.log("Has Orbit Group:", !!data.orbitGroup);
    console.log("Has Ring:", !!data.ring);
    console.log("Has Ring Fill:", !!data.ringFill);
    console.log("Children Count:", data.children?.length || 0);
    
    if (data.trajectory) {
      console.log("Trajectory:", `x: ${data.trajectory.x}, y: ${data.trajectory.y}, z: ${data.trajectory.z}`);
    }
    
    if (data.orbitNormal) {
      console.log("Orbit Normal:", `x: ${data.orbitNormal.x}, y: ${data.orbitNormal.y}, z: ${data.orbitNormal.z}`);
    }
  }
  
  console.log("=====================");
}







export const DefaultData: CelestialData[] = [
  // Nearest Star Systems
  {
    name: "Proxima Centauri",
    type: "star",
    position: new THREE.Vector3(-9.468e12, -6.109e12, -1.198e12),
    radius: 100_000, // approximate radius
    color: 0xffaaaa,
    orbitNormal: [0, 1, 0],
    trajectory: new THREE.Vector3(1, 0, 0),
    lightSource: new THREE.PointLight(0xffaaaa, 50),
    viewRing: true
  },
  { name: "Proxima b", type: "planet", color: 0x33ff33, radius: 6371, distance: 7.2e6, period: 11, parent: "Proxima Centauri", viewOrbit: true, viewRing: true },
  { name: "Proxima c", type: "planet", color: 0x3399ff, radius: 8000, distance: 2.2e7, period: 5, parent: "Proxima Centauri", viewOrbit: true, viewRing: true },

  // Alpha Centauri A and B
  {
    name: "Alpha Centauri A",
    type: "star",
    position: new THREE.Vector3(-2.140e13, -9.783e12, -4.586e12),
    radius: 834_000,
    color: 0xffffcc,
    orbitNormal: [0, 1, 0],
    trajectory: new THREE.Vector3(1, 0, 0),
    lightSource: new THREE.PointLight(0xffffcc, 50),
    viewRing: true
  },
  { name: "Alpha Centauri Ab", type: "planet", color: 0xccccff, radius: 7000, distance: 6.0e7, period: 12, parent: "Alpha Centauri A", viewOrbit: true, viewRing: true },
  {
    name: "Alpha Centauri B",
    type: "star",
    position: new THREE.Vector3(-2.243e13, -9.886e12, -4.689e12),
    radius: 600000,
    color: 0xffcc88,
    orbitNormal: [0,1,0],
    trajectory: new THREE.Vector3(0,0,0),
    lightSource: new THREE.PointLight(0xffddcc, 50),
    viewRing: true
  },
  { name: "Alpha Centauri Bb", type: "planet", color: 0xff9966, radius: 8000, distance: 4e6, period: 3.2, parent: "Alpha Centauri B", viewOrbit: true, viewRing: true },

  // Barnard's Star
  {
    name: "Barnard's Star",
    type: "star",
    position: new THREE.Vector3(-2.982e13, 6.381e12, 4.347e12),
    radius: 130_000,
    color: 0xffccaa,
    orbitNormal: [0, 1, 0],
    trajectory: new THREE.Vector3(1, 0, 0),
    lightSource: new THREE.PointLight(0xffccaa, 50),
    viewRing: true
  },
  { name: "Barnard b", type: "planet", color: 0x66ff66, radius: 6000, distance: 3.0e6, period: 0.5, parent: "Barnard's Star", viewOrbit: true, viewRing: true },

  // Teegarden's Star
  {
    name: "Teegarden's Star",
    type: "star",
    position: new THREE.Vector3(-2.394e13, 3.812e13, -2.075e12),
    radius: 80_000,
    color: 0xaaffff,
    orbitNormal: [0, 1, 0],
    trajectory: new THREE.Vector3(1, 0, 0),
    lightSource: new THREE.PointLight(0xaaffff, 50),
    viewRing: true
  },
  { name: "Teegarden b", type: "planet", color: 0x66ccff, radius: 6500, distance: 5e6, period: 0.6, parent: "Teegarden's Star", viewOrbit: true, viewRing: true },
  { name: "Teegarden c", type: "planet", color: 0x9966ff, radius: 7000, distance: 7e6, period: 0.8, parent: "Teegarden's Star", viewOrbit: true, viewRing: true },
  
  // Wolf 359
  {
    name: "Wolf 359",
    type: "star",
    position: new THREE.Vector3(5.564e12, 6.321e12, 2.486e13),
    radius: 150000,
    color: 0xff8888,
    orbitNormal: [0,1,0],
    trajectory: new THREE.Vector3(0,0,0),
    lightSource: new THREE.PointLight(0xff9999, 50),
    viewRing: true
  },
  { name: "Wolf 359 b", type: "planet", color: 0xcc3333, radius: 5500, distance: 2e6, period: 2.7, parent: "Wolf 359", viewOrbit: true, viewRing: true },
  { name: "Wolf 359 c", type: "planet", color: 0x993333, radius: 6000, distance: 5e6, period: 8.9, parent: "Wolf 359", viewOrbit: true, viewRing: true },
  
  // Lalande 21185
  {
    name: "Lalande 21185",
    type: "star",
    position: new THREE.Vector3(4.939e12, 7.796e13, 2.070e12),
    radius: 290000,
    color: 0x88ff88,
    orbitNormal: [0,1,0],
    trajectory: new THREE.Vector3(0,0,0),
    lightSource: new THREE.PointLight(0x88ff88, 50),
    viewRing: true
  },
  { name: "Lalande 21185 b", type: "planet", color: 0x33aa33, radius: 8500, distance: 3e7, period: 12.9, parent: "Lalande 21185", viewOrbit: true, viewRing: true },
  { name: "Lalande 21185 c", type: "planet", color: 0x66cc66, radius: 7500, distance: 8e7, period: 28.5, parent: "Lalande 21185", viewOrbit: true, viewRing: true },



  // Solar System
  {
    name: "Sun",
    type: "star",
    position: new THREE.Vector3(0, 0, 0),
    radius: 695700,
    color: 0xffff00,
    orbitNormal: [0,1,0],
    trajectory: new THREE.Vector3(1, 0, 0),
    lightSource: new THREE.PointLight(0xffffff, 50)
  },

  { name: "Mercury", type: "planet", color: 0xaaaaaa, radius: 2439, distance: 57_910_000, period: 88, parent: "Sun", viewOrbit: true, viewRing: true },
  { name: "Venus", type: "planet", color: 0xffcc66, radius: 6052, distance: 108_200_000, period: 225, parent: "Sun", viewOrbit: true, viewRing: true },
  { name: "Earth", type: "planet", color: 0x3366ff, radius: 6371, distance: 149_600_000, period: 365, parent: "Sun", viewOrbit: true, viewRing: true },
  { name: "Mars", type: "planet", color: 0xff3300, radius: 3390, distance: 227_900_000, period: 687, parent: "Sun", viewOrbit: true, viewRing: true },
  { name: "Jupiter", type: "planet", color: 0xff9933, radius: 69911, distance: 778_500_000, period: 4333, parent: "Sun", viewOrbit: true, viewRing: true },
  { name: "Saturn", type: "planet", color: 0xffcc99, radius: 58232, distance: 1_433_000_000, period: 10759, parent: "Sun", viewOrbit: true, viewRing: true },
  { name: "Uranus", type: "planet", color: 0x66ccff, radius: 25362, distance: 2_871_000_000, period: 30687, parent: "Sun", viewOrbit: true, viewRing: true },
  { name: "Neptune", type: "planet", color: 0x3366ff, radius: 24622, distance: 4_495_000_000, period: 60190, parent: "Sun", viewOrbit: true, viewRing: true },

  {
    name: "Moon",
    type: "moon",
    radius: 1737,
    distance: 384400,
    period: 27,
    parent: "Earth",
    viewOrbit: false,
    viewRing: true
  },

];