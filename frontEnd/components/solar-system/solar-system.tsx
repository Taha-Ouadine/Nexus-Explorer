// Solar System component

"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot } from 'react-dom/client';
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CelestialData, DefaultData, printCelestialDataDetailed } from "./universe-data";
import { type CelestialBody, createCelestialBody } from "./createCelestial";

import { updateRings, clickableRings, updateCameraFocus, goToBody, addStars, scaleRadius }
from "./universe-utils";

import InfoSidebar from "./info-sidebar";
import KeyboardHelp from "./keyboard-help";



interface SolarSystemProps {
  className?: string;
  celestialData?: CelestialData[];
  onPlanetClick?: (planetName: string) => void;
  resizeTrigger?: number;
  isExpanded?: boolean;
  subjectName?: string | null;
}




function scaleCelestialDataPositions(data:CelestialData[], maxDistanceThreshold:number=1e14, minDistanceThreshold:number=1e11): CelestialData[] {
  if (data.length === 0) return data;
  if (data.filter((body)=>(!body.parent)).length<=1) return data;
  
  let maxDistance = 0;
  let minDistance = Infinity;
  data.forEach(body => {
    const distance = body.position?.length() ?? 0;
    if (distance<1e-2) return;
    if (body.parent) {return} // Only star planets
    if (distance > maxDistance) { maxDistance=distance;}
    if (distance < minDistance) { minDistance=distance;}
  });

  //console.log(`Max Distance * 1e-14 = ${maxDistance*1e-14}, Min Distance * 1e-11 = ${minDistance*1e-11}`)
  
  let scaleFactor = 1;
  if (maxDistance >= maxDistanceThreshold) { scaleFactor = maxDistanceThreshold / maxDistance; }
  else if (minDistance <= minDistanceThreshold) { scaleFactor = minDistanceThreshold / minDistance; }
  //console.log(`Scale factor = ${scaleFactor}`)
  if (0.9<scaleFactor&&scaleFactor<1.1) {return data;}
  
  /*console.log(`Scaling positions by ${scaleFactor.toFixed(3)}.
               Max distance: ${maxDistance.toLocaleString()} -> ${(maxDistance * scaleFactor).toLocaleString()},
               Min distance: ${minDistance.toLocaleString()} -> ${(minDistance * scaleFactor).toLocaleString()}`);*/
  
  return data.map(body => ({
    ...body,
    position: body.position ? body.position.clone().multiplyScalar(scaleFactor) : body.position,
    trajectory: body.trajectory ? body.trajectory.clone().multiplyScalar(scaleFactor) : body.trajectory
  }));
}







export default function SolarSystem({ className, celestialData, onPlanetClick, resizeTrigger, isExpanded, subjectName }: SolarSystemProps) {
  // ------ EXTERNAL REFS ------
  const mountRef = useRef<HTMLDivElement>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(20);
  const [running, setRunning] = useState(true);

  const simulationSpeedRef = useRef(simulationSpeed);
  const runningRef = useRef(running);

  useEffect(() => { simulationSpeedRef.current = simulationSpeed }, [simulationSpeed]);
  useEffect(() => { runningRef.current = running }, [running]);

  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const focusedBodyRef = useRef<CelestialBody | null>(null);
  const targetScreenRatio = 0.1;
  const [isFocused, setIsFocused] = useState(false);
  const isFocusedRef = useRef(isFocused);

  const [keyboardLayout, setKeyboardLayout] = useState<'QWERTY' | 'AZERTY' | 'QWERTZ'>('AZERTY');
  const keyboardLayoutRef = useRef(keyboardLayout);

  const animationIdRef = useRef<number>();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarOpenRef = useRef(sidebarOpen);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false)
  const [selectedBody, setSelectedBody] = useState<CelestialBody | null>(null)


  // resize trigger
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<any>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    if (mountRef.current && rendererRef.current && cameraRef.current) {
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }
  }, [resizeTrigger])


  

  const sceneRef = useRef<THREE.Scene | null>(null);
  const bodyMapRef = useRef<Map<string, CelestialBody>>(new Map());
  const [allBodies, setAllBodies] = useState<CelestialBody[]>([]);
  const allBodiesRef = useRef<CelestialBody[]>([]);



  const TargetOrbitPeriod = 3.5; // days

  const onBodyClick = (body:CelestialBody) => {
    console.log('Planet clicked!', body.name, 'Mode:', isFocusedRef.current ? 'focused' : 'free');
    goToBody(cameraRef.current, controlsRef.current, body, rendererRef.current, targetScreenRatio);
    focusedBodyRef.current = body;
    setIsFocused(true);
    isFocusedRef.current = true;
    setSelectedBody(body);
    setSidebarOpen(true);
    if (onPlanetClick) { onPlanetClick(body.name); }

    if (body.period && body.period>0 && body.period*simulationSpeedRef.current>TargetOrbitPeriod) {
      setSimulationSpeed(TargetOrbitPeriod/body.period)
    }
  }




  // ----------- MAIN -----------

  useEffect(() => {
    if (!mountRef.current) return;
    
    // Scene - Camera - Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000000
    );
    camera.position.set(0, 300, 800);
    cameraRef.current = camera;

    // renderer and canvas wrapper
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    rendererRef.current = renderer;

    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.width = '100%';
    canvasWrapper.style.height = '100%';
    canvasWrapper.style.position = 'absolute';
    canvasWrapper.style.top = '0';
    canvasWrapper.style.left = '0';
    canvasWrapper.style.pointerEvents = 'auto';
    canvasWrapper.style.zIndex = '1';

    canvasWrapper.appendChild(renderer.domElement);
    mountRef.current?.appendChild(canvasWrapper);

    // Camera projection
    const frustum = new THREE.Frustum();
    const cameraViewProjectionMatrix = new THREE.Matrix4();

    // Camera Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = isFocusedRef.current;
    controlsRef.current = controls;
    controls.zoomSpeed = 3;
    controls.enablePan = true;
    controls.panSpeed = 2;

    let scrollDistance = 10;
    controls.addEventListener('change', () => {
      scrollDistance = camera.position.distanceTo(controls.target);
    });



    // ---------- Keyboard Controls ----------

    const moveSpeed = 5e2
    const fastMultiplier = 2
    const rotationSpeed = 2

    // Keyboard Configuration Mapping
    let keyMappings = {
      QWERTY: { forward: ['KeyW', 'ArrowUp'], backward: ['KeyS', 'ArrowDown'],  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
                up: ['Space'], down: ['ShiftLeft', 'ShiftRight'], ctrl: ['ControlLeft', 'ControlRight'],
                rotateUp: [], rotateDown: [], rotateLeft: [], rotateRight: []
              },
      AZERTY: { forward: ['KeyW', 'ArrowUp'], backward: ['KeyS', 'ArrowDown'],  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
                up: ['Space'], down: ['ShiftLeft', 'ShiftRight'], ctrl: ['ControlLeft', 'ControlRight'],
                rotateUp: [], rotateDown: [], rotateLeft: [], rotateRight: []
              },
      QWERTZ: { forward: ['KeyW', 'ArrowUp'], backward: ['KeyS', 'ArrowDown'],  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
                up: ['Space'], down: ['ShiftLeft', 'ShiftRight'], ctrl: ['ControlLeft', 'ControlRight'],
                rotateUp: [], rotateDown: [], rotateLeft: [], rotateRight: []
              }
    };

    /*
    (NOTE: Layout is QWERTY no matter your keyboard. Letter A is equal to KeyQ on AZERTY.)
    - Letters: Key<Letter> in Cap (Ex: KeyK for 'k' and 'K')
    - Digits: Digit<digit> from 0 to 9
    - Arrow<direction> with direction being Up, Down, Left, Right
    - ShiftLeft/ShiftRight, ControlLeft/ControlRight, AltLeft/AltRight,
    - Space, Enter, Escape, Tab, CapsLock, Backspace
    */

    const moveState = {
      forward: false, back: false, left: false, right: false, up: false, down: false,
      ctrl: false,
      // rotateLeft: false, rotateRight: false, rotateUp: false, rotateDown: false, anyRotation: false
    };
    const keyState = new Map<string, boolean>();

    const stopKeyEvent = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }


    const handleKeyDown = (event: KeyboardEvent) => {
      const code=event.code;
      const key=event.key;

      const keyMapping = keyMappings[keyboardLayoutRef.current] ?? keyMappings["AZERTY"];
      const allMappedKeys = [...keyMapping.forward, ...keyMapping.backward, ...keyMapping.left, ...keyMapping.right,
                             ...keyMapping.up, ...keyMapping.down, ...keyMapping.ctrl];
      if (allMappedKeys.includes(code)) { event.preventDefault(); }

      if (!keyState.get(code)) {
        keyState.set(code, true);
      }

      if (code === "Backspace") {
        if (isFocusedRef.current) {
          stopKeyEvent(event);
          focusedBodyRef.current = null;
          setIsFocused(false);
          isFocusedRef.current = false;
          return;
        } else {}
      }
      if (code === "Tab") {
        stopKeyEvent(event);
        setSidebarOpen(prev => !prev);
      }
      if (code === "F1") {
        stopKeyEvent(event);
        setKeyboardHelpOpen(prev => !prev);
      }
      if (code === "F3") {
        stopKeyEvent(event);
        allBodiesRef.current.forEach(printCelestialDataDetailed)
      }
      if (code === "F7") {
        stopKeyEvent(event);
        console.log("Bodies currently in the simulation:\n")
        allBodiesRef.current.forEach((body)=>{console.log(body.name+" ")})
        console.log("\n")
      }
      if (code === "KeyT") { // T for Teleport
        event.preventDefault();
        
        // Find nearest object to camera
        let nearestBody: CelestialBody | null = null;
        let minDistance = Infinity;
        
        allBodies.forEach(body => {
          if (body.mesh) {
            const distance = camera.position.distanceTo(body.mesh.position);
            if (distance < minDistance) {
              minDistance = distance;
              nearestBody = body;
            }
          }
          else { console.log("During teleport, Body had no mesh") }
        });
        
        // Teleport to nearest object
        if (nearestBody) {
          console.log(`Teleporting (${minDistance.toLocaleString()} units away)`);
          goToBody(camera, controls, nearestBody, renderer, targetScreenRatio);
          focusedBodyRef.current = nearestBody;
          setIsFocused(true);
          isFocusedRef.current = true;
          setSelectedBody(nearestBody);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const code=event.code;
      keyState.set(code, false);
      const pressedKeys = Array.from(keyState.entries()).filter(([_, pressed]) => pressed);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    const resetKeyStates = () => {
      const keyMapping = keyMappings[keyboardLayoutRef.current] ?? keyMappings["AZERTY"];
      keyMapping.forward.forEach(key => keyState.set(key, false));
      keyMapping.backward.forEach(key => keyState.set(key, false));
      keyMapping.left.forEach(key => keyState.set(key, false));
      keyMapping.right.forEach(key => keyState.set(key, false));
      keyMapping.up.forEach(key => keyState.set(key, false));
      keyMapping.down.forEach(key => keyState.set(key, false));
      keyMapping.ctrl.forEach(key => keyState.set(key, false));
    }

    const resetMoveStates = () => {
      moveState.forward = false;
      moveState.back = false;
      moveState.left = false;
      moveState.right = false;
      moveState.up = false;
      moveState.down = false;
      moveState.ctrl = false;
    }

    const updateKeys = () => {
      const keyMapping = keyMappings[keyboardLayoutRef.current] ?? keyMappings["AZERTY"];

      moveState.forward = keyMapping.forward.some(key => keyState.get(key) === true);
      moveState.back = keyMapping.backward.some(key => keyState.get(key) === true);

      moveState.left = keyMapping.left.some(key => keyState.get(key) === true);
      moveState.right = keyMapping.right.some(key => keyState.get(key) === true);

      moveState.up = keyMapping.up.some(key => keyState.get(key) === true);
      moveState.down = keyMapping.down.some(key => keyState.get(key) === true);

      moveState.ctrl = keyMapping.ctrl.some(key => keyState.get(key) === true);
    }




    // ---------------------------



    // ---------- Mouse ----------
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const mouseState = {isMouseDown: false, lastX: 0, lastY: 0};
    const mouseSensitivity = 0.002;

    const handleMouseDown = (event: MouseEvent) => {
      if (!isFocusedRef.current && event.button === 0) { // Left click only
        mouseState.isMouseDown = true;
        mouseState.lastX = event.clientX;
        mouseState.lastY = event.clientY;
        renderer.domElement.requestPointerLock();
      }
      if (event.button === 2) {
        event.preventDefault();
        //console.log('Right click at:', event.clientX, event.clientY);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        mouseState.isMouseDown = false;
        document.exitPointerLock();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isFocusedRef.current && mouseState.isMouseDown) {
        const deltaX = event.movementX || event.clientX - mouseState.lastX;
        const deltaY = event.movementY || event.clientY - mouseState.lastY;
        
        // Rotate camera based on mouse movement
        updateKeys();
        camera.rotateY(-deltaX * mouseSensitivity);
        camera.rotateX(-deltaY * mouseSensitivity);
        updateKeys();
        
        // Keep camera rotation within reasonable limits
        const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x)); // Limit vertical look
        camera.quaternion.setFromEuler(euler);
        updateKeys();
        
        mouseState.lastX = event.clientX;
        mouseState.lastY = event.clientY;
      }
    };

    /*const handleWheel = (event: WheelEvent) => {
      if (!isFocusedRef.current) {
        event.preventDefault();
        const zoomSpeed = 50;
        const zoomDirection = event.deltaY > 0 ? 1 : -1;
        
        // Move camera forward/backward based on scroll
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        camera.position.addScaledVector(direction, zoomDirection * zoomSpeed);
        
        // Also update controls target to maintain orbit controls consistency
        controls.target.copy(camera.position).add(direction);
      }
    };*/

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    // ---------------------------




    // Ambient Light
    scene.add(new THREE.AmbientLight(0xffffff, 5));

    // Star Background
    const updateStars = addStars(scene, camera);

    // -------------- LOAD BODIES --------------
    const bodyMap = new Map<string, CelestialBody>();
    const allBodies: CelestialBody[] = [];
    bodyMapRef.current = bodyMap;
    allBodiesRef.current = allBodies;

    // Reloading Data
    const updateBodies = () => {
      // Clear existing bodies
      allBodies.forEach(body => {
        if (body.mesh) scene.remove(body.mesh);
        if (body.orbitGroup) scene.remove(body.orbitGroup);
        if (body.ring) scene.remove(body.ring);
      });
      allBodies.length = 0;
      bodyMap.clear();
      
      // Load data
      let universeData = celestialData || DefaultData;
      universeData = scaleCelestialDataPositions(universeData);
      console.log(`Simulating ${universeData.length} Objects`)
      //universeData.forEach(printCelestialDataDetailed);
      
      universeData.forEach(data => {
        const viewRing = data.viewRing ?? false;
          const viewOrbit = data.viewOrbit ?? false;
          if (!data.name) {console.log(`NO NAME:\n`); printCelestialDataDetailed(data);}
          const body = createCelestialBody(scene, data, bodyMap, viewOrbit, viewRing);
          // Highlight Subject
          if (subjectName && data.name === subjectName && body.mesh) {
            const glowGeometry = new THREE.SphereGeometry(body.radius * 1.3, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
              color: 0x00ffff,
              transparent: true,
              opacity: 0.3,
              side: THREE.BackSide
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            body.mesh.add(glowMesh);
            onBodyClick(body);
          }
          
          bodyMap.set(data.name, body);
          allBodies.push(body);
      });

      setAllBodies([...allBodiesRef.current]);
    };

    updateBodies();
    // -----------------------------------------

    // ---- Click trigger ----
    clickableRings(camera, mouse, renderer, allBodies, onBodyClick);

    const XY_Normal = new THREE.Vector3(0, 0, 1);
    const worldPos = new THREE.Vector3();
    const localPos = new THREE.Vector3();

    // Animation
    clockRef.current = new THREE.Clock();
    let simTime = 0;

    let lastUpdate = 0;
    const UPDATE_INTERVAL = 16;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      updateKeys();
      const now = Date.now();
      const delta = clockRef.current!.getDelta();

      if (runningRef.current) {
        // ---------- Simulation Running ----------

        simTime += delta * simulationSpeedRef.current;

        allBodies.forEach(p => {
          if (!p.mesh) return;

          if ((!p.parent) && p.trajectory) {
            const distance_vector = p.trajectory.clone().multiplyScalar(delta);
            p.mesh.position.add(distance_vector);
          }

          if (p.orbitGroup && p.parent?.mesh) p.orbitGroup.position.copy(p.parent.mesh.position);

          if (p.distance && p.period && p.parent) {
            const angle = (simTime / p.period) * 2 * Math.PI;
            localPos.set(Math.cos(angle)*p.distance, Math.sin(angle)*p.distance, 0);
            localPos.applyQuaternion(p.orbitQuat!);
            worldPos.copy(p.parent.mesh!.position).add(localPos);
            p.mesh.position.copy(worldPos);
          }
        });
      }

      if (!isFocusedRef.current) {
        if (controls.enabled) {controls.enabled = false;}
        // Free movement mode
        const speed = moveSpeed * (moveState.ctrl ? fastMultiplier : 1) * delta;
        const direction = new THREE.Vector3();
        updateKeys();
        
        // Movement keys
        if (moveState.forward) direction.z -= speed;
        if (moveState.back) direction.z += speed;
        if (moveState.left) direction.x -= speed;
        if (moveState.right) direction.x += speed;
        if (moveState.up) direction.y += speed;
        if (moveState.down) direction.y -= speed;
        
        // Apply movement in camera direction
        direction.applyQuaternion(camera.quaternion);
        camera.position.add(direction);
        controls.target.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));

        // Rotation keys (DISABLED)
        /*if (moveState.anyRotation) {
          const rotation = rotationSpeed * delta;
          if (moveState.rotateLeft) {camera.rotateY(rotation);}
          if (moveState.rotateRight) {camera.rotateY(-rotation);}
          if (moveState.rotateUp) {camera.rotateX(rotation);}
          if (moveState.rotateDown) {camera.rotateX(-rotation);}
          controls.target.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));
        }*/
      }
      else { // Orbit controls mode
        if (!controls.enabled) {controls.enabled = true;}
        if (focusedBodyRef.current) {
          updateCameraFocus(camera, controls, focusedBodyRef.current, scrollDistance);
        }
      }
      
      if (now - lastUpdate >= UPDATE_INTERVAL) { // Heavy computation is throttled
        updateRings(camera, renderer, frustum, cameraViewProjectionMatrix, allBodies);
        updateStars();
        lastUpdate = now;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();



    // Resize
    const handleResize = () => {
      if (mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }


    // Reset all movement states when window loses focus
    const handleBlur = () => {
      resetMoveStates();
      mouseState.isMouseDown = false;
      document.exitPointerLock();
    };
    const handleVisibilityChange = () => { if (document.hidden) {handleBlur();} }

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);






    return () => {
      // Stop animation frame
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      // Keyboard cleanup
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      // Mouse cleanup
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      // renderer.domElement.removeEventListener('wheel', handleWheel); // Uncomment if using wheel
      // General cleanup
      if (canvasWrapper && mountRef.current?.contains(canvasWrapper)) {
        mountRef.current.removeChild(canvasWrapper);
      }
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resizeObserver.disconnect();
      cameraRef.current = null
      rendererRef.current = null
      // Dispose Three.js resources
      renderer.dispose();
      scene.clear();
    };


  }, []);




  // RELOAD ON DATA CHANGE
  useEffect(() => {
    if (sceneRef.current && bodyMapRef.current && allBodiesRef.current) {
      const scene = sceneRef.current;
      const bodyMap = bodyMapRef.current;
      const allBodies = allBodiesRef.current;
      
      // Clear existing bodies
      allBodies.forEach(body => {
        if (body.mesh) scene.remove(body.mesh);
        if (body.orbitGroup) scene.remove(body.orbitGroup);
        if (body.ring) scene.remove(body.ring);
      });
      allBodies.length = 0;
      bodyMap.clear();
      
      // Load new data
      let universeData = celestialData || DefaultData;
      universeData = scaleCelestialDataPositions(universeData);
      console.log(`Updated Simulation to ${universeData.length} Objects`);
      
      universeData.forEach(data => {
        const viewRing = data.viewRing ?? false;
          const viewOrbit = data.viewOrbit ?? false;
          if (!data.name) {console.log(`NO NAME:\n`); printCelestialDataDetailed(data);}
          const body = createCelestialBody(scene, data, bodyMap, viewOrbit, viewRing);
          // Highlight Subject
          if (subjectName && data.name === subjectName && body.mesh) {
            const glowGeometry = new THREE.SphereGeometry(body.radius * 3, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
              color: 0x00ffff,
              transparent: true,
              opacity: 0.3,
              side: THREE.BackSide
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            body.mesh.add(glowMesh);
            onBodyClick(body);
          }
          
          bodyMap.set(data.name, body);
          allBodies.push(body);
      });

      // Update sidebar state
      setAllBodies([...allBodies]);
    }
  }, [celestialData, subjectName]);






  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }} ref={mountRef} className={className}>
      {/* UI controls */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 10000,
          pointerEvents: "auto",
        }}
      >
        {/* Speed slider */}
        <input
          type="range"
          min="0.1"
          max="100"
          step="0.1"
          value={simulationSpeed}
          onChange={(e) => setSimulationSpeed(Number.parseFloat(e.target.value))}
          style={{ width: "150px" }}
        />

        {/* Pause/Play button */}
        <button
          onClick={() => {
            setRunning((running) => {
              clockRef.current?.getDelta()
              return !running
            })
          }}
          style={{
            width: "150px",
            padding: "5px",
            background: running ? "#ff4444" : "#44ff44",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          {running ? "Pause ❚❚" : "Play ▶"}
        </button>

        {/* ESC message - only show when expanded */}
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            padding: "8px",
            borderRadius: "5px",
            width: "150px",
            color: "white",
            fontSize: "12px",
            textAlign: "center",
            display: isExpanded ? "block" : "none",
          }}
        >
          Press ESC to exit fullscreen
        </div>
      </div>

      {/* Help Button */}
      <button
        onClick={() => setKeyboardHelpOpen(true)}
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          color: "#22d3ee",
          border: "1px solid rgba(34, 211, 238, 0.3)",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          pointerEvents: "auto",
          zIndex: 10000,
        }}
      >
        Controls
      </button>

      {/* Sidebar*/}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 9999,
        }}
      >
        <InfoSidebar
          isOpen={sidebarOpen}
          selectedBody={selectedBody}
          inputBodies={allBodies}
          onClose={() => setSidebarOpen(false)}
          onBodySelect={(body) => {
            setSelectedBody(body)
            if (cameraRef.current && controlsRef.current && rendererRef.current) {
              goToBody(cameraRef.current, controlsRef.current, body, rendererRef.current, targetScreenRatio)
            }
            focusedBodyRef.current = body
            setIsFocused(true)
            isFocusedRef.current = true
          }}
          simulationSpeed={simulationSpeed}
          onSpeedChange={setSimulationSpeed}
        />
      </div>

      {/* Keyboard Help */}
      <KeyboardHelp isOpen={keyboardHelpOpen} onClose={() => setKeyboardHelpOpen(false)} />
    </div>
  )
}
