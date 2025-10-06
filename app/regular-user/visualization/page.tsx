// Visualisation Page

"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Globe, Star, Calendar, Sun, Maximize2, Minimize2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useRef, Suspense } from "react"
import { loadKeplerData, planetHost, type KeplerPlanet } from "@/lib/kepler-data"
import SolarSystem from "@/components/solar-system/solar-system"
import { CelestialData, keplerToCelestialData, DefaultData } from "@/components/solar-system/universe-data";





function VisualizationContent() {
  const searchParams = useSearchParams()
  console.log(searchParams)
  const planetName = searchParams.get("planet")
  //const planetName = "Kepler-616 d"
  const starName = searchParams.get("star")
  //const starName = "Kepler-967"
  console.log(`planetName=${planetName}, starName=${starName}`)

  const [starPlanets, setStarPlanets] = useState<KeplerPlanet[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null)
  const [resizeTrigger, setResizeTrigger] = useState(0)

  const [celestialData, setCelestialData] = useState<CelestialData[]>([])
  const [dataLoaded, setDataLoaded] = useState(false);

  function getStarChildren(planetList:KeplerPlanet[], star:string) {
        const filteredList = planetList.filter((p) => {
          const match = (planetHost(p) === star)
          return match;
        });
        return filteredList
  }

  const router = useRouter()



  // Celestial Data
  useEffect(() => {
    async function fetchAndProcessData() {
      setLoading(true);
      const allPlanets = await loadKeplerData();
      let planetsToUse: KeplerPlanet[] = [];
      let subjectBody: string | null = null;

      console.log("All planets loaded:", allPlanets.length);
      console.log("Searching for star:", starName);

      if (starName) {
        console.log("Load Star: " + starName);
        planetsToUse = getStarChildren(allPlanets, starName)
        subjectBody = starName;
        console.log(`Found ${planetsToUse.length} planets for hostname: ${starName}`);



        const uniqueHostnames = [...new Set(allPlanets.map(p => planetHost(p)).filter(Boolean))];
        console.log("Available hostnames sample:", uniqueHostnames.slice(0, 10));

        // ADD NEIGHBORING SYSTEMS
        const currentStarIndex = uniqueHostnames.indexOf(starName);
        if (currentStarIndex !== -1) { // Get 2-3 neighboring stars
          const neighborStars = uniqueHostnames.slice(
            Math.max(0, currentStarIndex - 1),
            Math.min(uniqueHostnames.length, currentStarIndex + 2)
          );
          neighborStars.forEach(neighborStar => { // Add planets from neighboring systems
            if (neighborStar !== starName) {
              const neighborPlanets = getStarChildren(allPlanets, neighborStar);
              planetsToUse.push(...neighborPlanets);
            }
          });
        }
      }
      
      else if (planetName) {
          console.log("Load Planet: " + planetName);
          const planet = allPlanets.find((p) => 
            p.kepler_name === planetName || p.kepoi_name === planetName
          );
          if (planet) {
            const hostStar = planetHost(planet);
            planetsToUse = getStarChildren(allPlanets, hostStar);
            subjectBody = planetName;
            
            // ADD NEIGHBORING SYSTEMS for planet view too
            const allStars = [...new Set(allPlanets.map(p => planetHost(p)).filter(Boolean))];
            const currentStarIndex = allStars.indexOf(hostStar);
            if (currentStarIndex !== -1) {
              const neighborStars = allStars.slice(
                Math.max(0, currentStarIndex - 1),
                Math.min(allStars.length, currentStarIndex + 2)
              );
              
              neighborStars.forEach(neighborStar => {
                if (neighborStar !== hostStar) {
                  const neighborPlanets = getStarChildren(allPlanets, neighborStar).slice(0, 2);
                  planetsToUse.push(...neighborPlanets);
                }
              });
            }
          }
        }

      // Convert to celestial data
      if (planetsToUse.length > 0) {
        const convertedData = keplerToCelestialData(planetsToUse);
        console.log(`Converted ${convertedData.length} planets to celestial data`);
        setCelestialData(convertedData);
      } else {
        console.log("No specific data found, using default fallback");
        setCelestialData(DefaultData);
      }
      
      setDataLoaded(true);
      setLoading(false);
    }

    fetchAndProcessData();
  }, [starName, planetName]);

  // Debug effect to monitor celestialData changes
  useEffect(() => {
    console.log("Celestial data updated:", celestialData.length, "objects");
  }, [celestialData]);

  useEffect(() => {
    if (starPlanets.length > 0) {
      const convertedData = keplerToCelestialData(starPlanets)
      setCelestialData(convertedData)
    } else { // fallback
      console.log("No Data, using default fallback")
      setCelestialData(DefaultData)
    }
  }, [starPlanets])




  // Handle Escape key to minimize
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isExpanded) {
        setIsExpanded(false)
        const params = new URLSearchParams(searchParams.toString())
        params.delete('fullscreen')
        router.push(`?${params.toString()}`)
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isExpanded, searchParams, router])

  // Apply 80% zoom when component mounts
  useEffect(() => {
    document.body.style.zoom = "100%"
    
    // Cleanup: reset zoom when leaving the page
    return () => {
      document.body.style.zoom = "100%"
    }
  }, [])

  // Trigger resize when expanding/collapsing
  useEffect(() => {
    const timer = setTimeout(() => {
      setResizeTrigger(prev => prev + 1)
    }, 100)
    return () => clearTimeout(timer)
  }, [isExpanded])

  const handlePlanetClick = (planetName: string) => {
    setSelectedPlanet(planetName)
  }

  // Right click
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);





  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/regular-user">
            <Button variant="outline" className="bg-card/60 backdrop-blur-md border-cyan-500/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exploration
            </Button>
          </Link>

        <div className="text-center w-full">
          <p className="text-cyan-300 text-sm font-medium bg-gradient-to-r from-cyan-900/20 to-purple-900/20 px-4 py-2 rounded-lg border border-cyan-500/20 inline-block">
            ⌨️ Press <span className="text-cyan-400 font-semibold">F1</span> for controls
          </p>
        </div>
          
          <div className="text-right">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {starName ? `${starName} System` : "Solar System"}
            </h1>
          </div>
        </div>

        <div className={isExpanded ? "fixed inset-0 z-50 bg-black flex flex-col" : ""}>

          <Card
            className={
              isExpanded ? "flex-1 rounded-none border-0" : "bg-card/60 backdrop-blur-md border-2 border-purple-500/30"
            }
          >
            {!isExpanded && (
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="flex items-center gap-2">
                  {starName ? (
                    <Sun className="h-5 w-5 text-orange-400" />
                  ) : (
                    <Globe className="h-5 w-5 text-purple-400" />
                  )}
                  {selectedPlanet ? `Selected: ${selectedPlanet}` : "Right Click on celestial bodies to select them"}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(true)
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('fullscreen', 'true')
                    router.push(`?${params.toString()}`)
                  }}
                  className="bg-background/60 border-purple-500/30"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Full Screen
                </Button>
              </CardHeader>
            )}
            <CardContent className={isExpanded ? "p-0 h-full" : "p-0"}>
              <div
                className={
                  isExpanded
                    ? "h-full"
                    : "h-110 w-full bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-t border-purple-500/30 relative"
                }
              >
              {loading ? (
                // Show loading state
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-cyan-400 text-lg">Loading star system data...</div>
                </div>
              ) : (
                // ---- SIMULATION ----
                <SolarSystem
                  className="w-full h-full"
                  celestialData={celestialData}
                  onPlanetClick={handlePlanetClick} 
                  resizeTrigger={resizeTrigger}
                  isExpanded={isExpanded}
                  subjectName={planetName || starName || null}
                />
              )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Other UI content (only shown when not expanded) */}
        {!isExpanded && (
          <>
            {starName && starPlanets.length > 0 && (
              <div className="space-y-6">
                <Card className="bg-card/60 backdrop-blur-md border-orange-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-orange-400" />
                      Star System: {starName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Number of Planets:</span>
                        <span className="font-semibold">{starPlanets.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Stellar Temperature:</span>
                        <span className="font-semibold">{starPlanets[0].koi_steff?.toFixed(0) || "Unknown"} K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Stellar Radius:</span>
                        <span className="font-semibold">{starPlanets[0].koi_srad?.toFixed(2) || "Unknown"} R☉</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Surface Gravity:</span>
                        <span className="font-semibold">
                          {starPlanets[0].koi_slogg?.toFixed(2) || "Unknown"} log(g)
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-foreground/10">
                      <h3 className="text-lg font-semibold mb-3">Planets in this System:</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {starPlanets.map((planet) => (
                          <Card key={planet.kepoi_name || planet.pl_name || planet.kepler_name} className="bg-background/40 border-blue-500/30">
                            <CardContent className="p-3">
                              <h4 className="font-semibold text-sm mb-2">{planet.kepler_name || planet.pl_name}</h4>
                              <div className="space-y-1 text-xs text-foreground/70">
                                <div className="flex justify-between">
                                  <span>Radius:</span>
                                  <span>{planet.koi_prad?.toFixed(2) || "Unknown"} R⊕</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Temperature:</span>
                                  <span>{planet.koi_teq?.toFixed(0) || "Unknown"} K</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Orbital Period:</span>
                                  <span>{planet.koi_period?.toFixed(2) || "Unknown"} days</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {planetName && !starName && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card/60 backdrop-blur-md border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      Planet Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Radius:</span>
                      <span className="font-semibold">1.41 Earth radii</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Orbital Period:</span>
                      <span className="font-semibold">267.29 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Temperature:</span>
                      <span className="font-semibold">208 K</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-md border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-400" />
                      Discovery Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Discovered:</span>
                      <span className="font-semibold">2013</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Host Star:</span>
                      <span className="font-semibold">Kepler-62</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Status:</span>
                      <span className="font-semibold text-green-400">Confirmed</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function VisualizationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
          <p className="mt-4 text-foreground/70">Loading visualization...</p>
        </div>
      </div>
    }>
      <VisualizationContent />
    </Suspense>
  )
}
