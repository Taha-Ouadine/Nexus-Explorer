"use client"

import { useEffect, useRef, memo, useMemo, lazy, Suspense, useId } from "react"
import * as THREE from "three"

interface GalaxySceneProps {
  scrollProgress?: number
}

export function GalaxyScene({ scrollProgress }: GalaxySceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const galaxyRef = useRef<THREE.Group>()
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Galaxy group
    const galaxy = new THREE.Group()
    galaxyRef.current = galaxy
    scene.add(galaxy)

    // Create stars
    const starGeometry = new THREE.BufferGeometry()
    const starCount = 2000
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
      // Position stars in a spiral galaxy pattern
      const radius = Math.random() * 15
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 2

      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius

      // Color variation for stars
      const colorChoice = Math.random()
      if (colorChoice < 0.3) {
        // Blue stars
        colors[i * 3] = 0.4
        colors[i * 3 + 1] = 0.6
        colors[i * 3 + 2] = 1
      } else if (colorChoice < 0.6) {
        // White stars
        colors[i * 3] = 1
        colors[i * 3 + 1] = 1
        colors[i * 3 + 2] = 1
      } else {
        // Pink/purple stars
        colors[i * 3] = 1
        colors[i * 3 + 1] = 0.4
        colors[i * 3 + 2] = 0.8
      }
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    const starMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    })

    const stars = new THREE.Points(starGeometry, starMaterial)
    galaxy.add(stars)

    // Create nebula clouds
    const nebulaGeometry = new THREE.BufferGeometry()
    const nebulaCount = 500
    const nebulaPositions = new Float32Array(nebulaCount * 3)
    const nebulaColors = new Float32Array(nebulaCount * 3)

    for (let i = 0; i < nebulaCount; i++) {
      const radius = Math.random() * 12
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 1.5

      nebulaPositions[i * 3] = Math.cos(angle) * radius
      nebulaPositions[i * 3 + 1] = height
      nebulaPositions[i * 3 + 2] = Math.sin(angle) * radius

      // Nebula colors (purple and pink)
      const colorChoice = Math.random()
      if (colorChoice < 0.5) {
        nebulaColors[i * 3] = 0.8
        nebulaColors[i * 3 + 1] = 0.2
        nebulaColors[i * 3 + 2] = 1
      } else {
        nebulaColors[i * 3] = 1
        nebulaColors[i * 3 + 1] = 0.2
        nebulaColors[i * 3 + 2] = 0.6
      }
    }

    nebulaGeometry.setAttribute("position", new THREE.BufferAttribute(nebulaPositions, 3))
    nebulaGeometry.setAttribute("color", new THREE.BufferAttribute(nebulaColors, 3))

    const nebulaMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    })

    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial)
    galaxy.add(nebula)

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)

      if (galaxyRef.current) {
        const constantSpeed = 0.002
        galaxyRef.current.rotation.y += constantSpeed
        galaxyRef.current.rotation.x += constantSpeed * 0.3
      }

      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return

      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, []) // Removed scrollProgress dependency since we're not using it for rotation

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-10"
      style={{
        background: "radial-gradient(ellipse at center, rgba(66, 41, 108, 0.3) 0%, rgba(13, 13, 35, 0.8) 100%)",
      }}
    />
  )
}

// Memoized particle system for better performance
export const OptimizedParticles = memo(({ count = 100, speed = 0.5 }: { count?: number; speed?: number }) => {
  const uniqueId = useId() // Generate a unique ID for this component instance
  
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: `${uniqueId}-particle-${i}`, // Use unique ID to ensure keys are unique across components
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * speed + 0.1,
      })),
    [count, speed, uniqueId], // Add uniqueId to dependency array
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary/30 animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDuration: `${20 / particle.speed}s`,
            animationDelay: `${particle.id * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
})

OptimizedParticles.displayName = "OptimizedParticles"

// Lazy load the galaxy scene for better performance
const LazyGalaxyScene = lazy(() => Promise.resolve({ default: GalaxyScene }))

// Optimized Galaxy Scene with lazy loading
export const OptimizedGalaxyScene = memo(({ scrollProgress }: { scrollProgress?: number }) => {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-gradient-to-b from-background via-background/80 to-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <LazyGalaxyScene scrollProgress={scrollProgress} />
    </Suspense>
  )
})

OptimizedGalaxyScene.displayName = "OptimizedGalaxyScene"