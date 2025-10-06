"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Shuffle,
  Sparkles,
  Star,
  Globe,
  Thermometer,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  Sun,
  Eye,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { loadKeplerData, getStatistics, planetHost, type KeplerPlanet } from "@/lib/kepler-data"
import { PlanetaryFeaturesGlossary } from "@/components/planetary-features-glossary"
import { StellarFeaturesGuide } from "@/components/stellar-features-guide"

interface StarData {
  hostname: string
  planets: KeplerPlanet[]
  stellarTemp: number | null
  stellarRadius: number | null
  stellarGravity: number | null
  luminosity: number | null
  keplerMag: number | null
  planetCount: number
  starType: string
}

export default function RegularUserPage() {
  const [viewMode, setViewMode] = useState<"planet" | "star">("planet")

  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("")
  const [sortBy, setSortBy] = useState("")
  const [sortOption, setSortOption] = useState("")

  const [filterRadius, setFilterRadius] = useState<string>("")
  const [filterTemp, setFilterTemp] = useState<string>("")
  const [filterHabitability, setFilterHabitability] = useState<string>("")
  const [filterStarType, setFilterStarType] = useState<string>("")
  const [filterPeriod, setFilterPeriod] = useState<string>("")

  const [randomPlanets, setRandomPlanets] = useState<KeplerPlanet[]>([])
  const [displayedPlanets, setDisplayedPlanets] = useState<KeplerPlanet[]>([])
  const [displayedStars, setDisplayedStars] = useState<StarData[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const [allExoplanets, setAllExoplanets] = useState<KeplerPlanet[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPlanets: 0,
    habitablePlanets: 0,
    uniqueStarSystems: 0,
    avgHabitability: 0,
    avgDistance: 0,
    discoveryYears: [] as number[],
  })

  const itemsPerPage = 30

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const planets = await loadKeplerData()
      setAllExoplanets(planets)
      setStats(getStatistics(planets))
      setLoading(false)
    }
    fetchData()
  }, [])

  const generateRandomPlanets = () => {
    const shuffled = [...allExoplanets].sort(() => 0.5 - Math.random())
    setRandomPlanets(shuffled.slice(0, 5))
  }

  const groupPlanetsByStars = (planets: KeplerPlanet[]): StarData[] => {
    const starMap = new Map<string, KeplerPlanet[]>()

    planets.forEach((planet) => {
      const hostname = planetHost(planet)

      if (!starMap.has(hostname)) {
        starMap.set(hostname, [])
      }

      starMap.get(hostname)!.push(planet)
    })

    const stars: StarData[] = []
    starMap.forEach((planets, hostname) => {
      const representative = planets[0]
      stars.push({
        hostname,
        planets,
        stellarTemp: representative.koi_steff || null,
        stellarRadius: representative.koi_srad || null,
        stellarGravity: representative.koi_slogg || null,
        luminosity: representative.luminosity || null,
        keplerMag: representative.koi_kepmag || null,
        planetCount: planets.length,
        starType: getStarType(representative.koi_steff || null, representative.koi_slogg || null),
      })
    })

    return stars
  }

  const applyAllFiltersAndSort = () => {
    let filteredPlanets = [...allExoplanets]

    if (searchQuery.trim() && searchType) {
      const trimmedQuery = searchQuery.trim()
      const isExactMatch = trimmedQuery.startsWith('"') && trimmedQuery.endsWith('"')
      const searchTerm = isExactMatch ? trimmedQuery.slice(1, -1).toLowerCase() : trimmedQuery.toLowerCase()

      if (searchType === "planet") {
        filteredPlanets = filteredPlanets.filter((planet) => {
          const keplerName = (planet.kepler_name || "").toLowerCase()
          const plName = (planet.pl_name || "").toLowerCase()

          if (isExactMatch) {
            // Exact match: planet name must equal search term exactly
            return keplerName === searchTerm || plName === searchTerm
          } else {
            // Prefix match: planet name must start with search term
            return keplerName.startsWith(searchTerm) || plName.startsWith(searchTerm)
          }
        })
      } else if (searchType === "host") {
        filteredPlanets = filteredPlanets.filter((planet) => {
          const hostname = (planetHost(planet) || "").toLowerCase()

          if (isExactMatch) {
            // Exact match: hostname must equal search term exactly
            return hostname === searchTerm
          } else {
            // Prefix match: hostname must start with search term
            return hostname.startsWith(searchTerm)
          }
        })
      }
    }

    // Apply planet size filter
    if (filterRadius) {
      if (filterRadius === "earth-like") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_prad && p.koi_prad >= 0.5 && p.koi_prad <= 1.5)
      } else if (filterRadius === "super-earth") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_prad && p.koi_prad > 1.5 && p.koi_prad <= 4)
      } else if (filterRadius === "neptune-like") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_prad && p.koi_prad > 4 && p.koi_prad <= 10)
      } else if (filterRadius === "jupiter-like") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_prad && p.koi_prad > 10)
      }
    }

    // Apply temperature filter
    if (filterTemp) {
      if (filterTemp === "cold") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_teq && p.koi_teq < 200)
      } else if (filterTemp === "habitable") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_teq && p.koi_teq >= 200 && p.koi_teq <= 350)
      } else if (filterTemp === "hot") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_teq && p.koi_teq > 350 && p.koi_teq <= 1000)
      } else if (filterTemp === "scorching") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_teq && p.koi_teq > 1000)
      }
    }

    // Apply habitability filter
    if (filterHabitability) {
      if (filterHabitability === "high") {
        filteredPlanets = filteredPlanets.filter((p) => p.habitability_score && p.habitability_score >= 0.7)
      } else if (filterHabitability === "moderate") {
        filteredPlanets = filteredPlanets.filter(
          (p) => p.habitability_score && p.habitability_score >= 0.6 && p.habitability_score < 0.7,
        )
      } else if (filterHabitability === "low") {
        filteredPlanets = filteredPlanets.filter(
          (p) => p.habitability_score && p.habitability_score >= 0.5 && p.habitability_score < 0.6,
        )
      }
    }

    // Apply star type filter
    if (filterStarType) {
      if (filterStarType === "main-sequence") {
        filteredPlanets = filteredPlanets.filter(
          (p) => p.koi_steff && p.koi_steff >= 3000 && p.koi_steff <= 10000 && p.koi_slogg && p.koi_slogg >= 4,
        )
      } else if (filterStarType === "red-giant") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_slogg && p.koi_slogg < 3.5)
      } else if (filterStarType === "hot-star") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_steff && p.koi_steff > 7000)
      } else if (filterStarType === "cool-star") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_steff && p.koi_steff < 5000)
      } else if (filterStarType === "sun-like") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_steff && p.koi_steff >= 5000 && p.koi_steff <= 6000)
      }
    }

    // Apply period filter
    if (filterPeriod) {
      if (filterPeriod === "ultra_short") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_period && p.koi_period < 10);
      }
      else if (filterPeriod === "short") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_period && p.koi_period >= 10 && p.koi_period < 50);
      }
      else if (filterPeriod === "habitable") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_period && p.koi_period >= 50 && p.koi_period < 400);
      }
      else if (filterPeriod === "long") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_period && p.koi_period >= 400 && p.koi_period < 1000);
      }
      else if (filterPeriod === "ultra_long") {
        filteredPlanets = filteredPlanets.filter((p) => p.koi_period && p.koi_period >= 1000);
      }
    }

    // Apply sorting based on view mode
    if (viewMode === "planet") {
      // Planet view sorting
      if (sortBy === "year" && sortOption) {
        filteredPlanets = filteredPlanets.filter(
          (p) => p.disc_year !== null && p.disc_year === Number.parseInt(sortOption),
        )
      } else if (sortBy === "distance-closest") {
        filteredPlanets = filteredPlanets.sort(
          (a, b) => (a.distance_ly || Number.POSITIVE_INFINITY) - (b.distance_ly || Number.POSITIVE_INFINITY),
        )
      } else if (sortBy === "distance-farthest") {
        filteredPlanets = filteredPlanets.sort((a, b) => (b.distance_ly || 0) - (a.distance_ly || 0))
      } else if (sortBy === "name-planet") {
        filteredPlanets = filteredPlanets.sort((a, b) =>
          (a.kepler_name || a.pl_name || "").localeCompare(b.kepler_name || b.pl_name || ""),
        )
      } else if (sortBy === "name-host") {
        filteredPlanets = filteredPlanets.sort((a, b) => (a.hostname || "").localeCompare(b.hostname || ""))
      } else if (sortBy === "habitability") {
        filteredPlanets = filteredPlanets.sort((a, b) => (b.habitability_score || 0) - (a.habitability_score || 0))
      } else if (sortBy === "star-systems") {
        const systemCounts = new Map<string, number>()
        filteredPlanets.forEach((p) => {
          const hostname = p.hostname || "Unknown"
          systemCounts.set(hostname, (systemCounts.get(hostname) || 0) + 1)
        })
        filteredPlanets = filteredPlanets.sort((a, b) => {
          const hostnameA = a.hostname || "Unknown"
          const hostnameB = b.hostname || "Unknown"
          const countA = systemCounts.get(hostnameA) || 0
          const countB = systemCounts.get(hostnameB) || 0
          return countB - countA
        })
      }

      setDisplayedPlanets(filteredPlanets)
      setDisplayedStars([])
    } else {
      // Star view - group by stars first, then sort
      let stars = groupPlanetsByStars(filteredPlanets)

      if (sortBy === "name-host") {
        stars = stars.sort((a, b) => a.hostname.localeCompare(b.hostname))
      } else if (sortBy === "star-temp") {
        stars = stars.sort((a, b) => (b.stellarTemp || 0) - (a.stellarTemp || 0))
      } else if (sortBy === "star-radius") {
        stars = stars.sort((a, b) => (b.stellarRadius || 0) - (a.stellarRadius || 0))
      } else if (sortBy === "star-luminosity") {
        stars = stars.sort((a, b) => (b.luminosity || 0) - (a.luminosity || 0))
      } else if (sortBy === "planet-count") {
        stars = stars.sort((a, b) => b.planetCount - a.planetCount)
      }

      setDisplayedStars(stars)
      setDisplayedPlanets([])
    }

    setCurrentPage(1)
  }

  const handleSearch = () => {
    if (!searchQuery.trim() || !searchType) {
      return
    }
    applyAllFiltersAndSort()
  }

  const handleSort = () => {
    applyAllFiltersAndSort()
  }

  const handleFilter = () => {
    applyAllFiltersAndSort()
  }

  const clearFilters = () => {
    setFilterRadius("")
    setFilterTemp("")
    setFilterHabitability("")
    setFilterStarType("")
    setFilterPeriod("")
    setSearchQuery("")
    setSearchType("")
    setSortBy("")
    setSortOption("")
    setDisplayedPlanets([])
    setDisplayedStars([])
    setCurrentPage(1)
  }

  const totalPages =
    viewMode === "planet"
      ? Math.ceil(displayedPlanets.length / itemsPerPage)
      : Math.ceil(displayedStars.length / itemsPerPage)

  const paginatedPlanets = displayedPlanets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const paginatedStars = displayedStars.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(newPage)

    setTimeout(() => {
      const resultsElement = document.getElementById("results-section")
      if (resultsElement) {
        resultsElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }, 100)
  }

  useEffect(() => {
    if (allExoplanets.length > 0) {
      generateRandomPlanets()
    }
  }, [allExoplanets])

  useEffect(() => {
    if (displayedPlanets.length > 0 || displayedStars.length > 0) {
      applyAllFiltersAndSort()
    }
  }, [viewMode])

  const getStarType = (temp: number | null, gravity: number | null): string => {
    if (!temp) return "Unknown"

    // Classify based on temperature and surface gravity
    if (gravity && gravity >= 4.0) {
      if (temp >= 5000 && temp <= 6000) return "Sun-like (G-type)"
      if (temp > 7000) return "Hot Main Sequence"
      if (temp < 5000) return "Cool Main Sequence"
      return "Main Sequence"
    } else if (gravity && gravity < 3.5) {
      return "Red Giant"
    } else {
      // Classify by temperature only if gravity is unknown
      if (temp >= 5000 && temp <= 6000) return "Sun-like Star"
      if (temp > 7000) return "Hot Star"
      if (temp < 5000) return "Cool Star"
      return "Unknown Type"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-xl text-foreground/80">Loading habitable exoplanets from Kepler dataset...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Explore Exoplanets
          </h1>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
            Discover planets beyond our solar system using real data from NASA's Kepler mission
          </p>
          <div className="flex justify-center gap-4 items-center">
            <PlanetaryFeaturesGlossary />
            <StellarFeaturesGuide />
            <div className="flex gap-2 bg-background/50 p-1 rounded-lg border border-purple-500/30">
              <Button
                onClick={() => setViewMode("planet")}
                variant={viewMode === "planet" ? "default" : "ghost"}
                size="sm"
                className={viewMode === "planet" ? "bg-gradient-to-r from-cyan-500 to-blue-500" : ""}
              >
                <Globe className="h-4 w-4 mr-2" />
                Planet View
              </Button>
              <Button
                onClick={() => setViewMode("star")}
                variant={viewMode === "star" ? "default" : "ghost"}
                size="sm"
                className={viewMode === "star" ? "bg-gradient-to-r from-orange-500 to-yellow-500" : ""}
              >
                <Sun className="h-4 w-4 mr-2" />
                Star View
              </Button>
            </div>
            <Link href="/regular-user/visualization">
              <Button
                size="sm"
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Our Solar System
              </Button>
            </Link>
          </div>
        </div>

        <Card className="bg-card/60 backdrop-blur-md border-2 border-purple-500/30 shadow-lg shadow-purple-500/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Filter className="h-6 w-6 text-purple-400" />
              Filter by {viewMode === "planet" ? "Planetary" : "Stellar"} Features
            </CardTitle>
            <CardDescription className="text-foreground/70">
              {viewMode === "planet"
                ? "Filter exoplanets by size, temperature, habitability, and star characteristics"
                : "Filter star systems by stellar properties and their planets"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {viewMode === "planet" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/90">Planet Size</label>
                    <Select value={filterRadius} onValueChange={setFilterRadius}>
                      <SelectTrigger className="bg-background/50 border-purple-500/30">
                        <SelectValue placeholder="Select size range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earth-like">Earth-like (0.5-1.5 R⊕)</SelectItem>
                        <SelectItem value="super-earth">Super-Earth (1.5-4 R⊕)</SelectItem>
                        <SelectItem value="neptune-like">Neptune-like (4-10 R⊕)</SelectItem>
                        <SelectItem value="jupiter-like">Jupiter-like (&gt;10 R⊕)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/90">Temperature Range</label>
                    <Select value={filterTemp} onValueChange={setFilterTemp}>
                      <SelectTrigger className="bg-background/50 border-purple-500/30">
                        <SelectValue placeholder="Select temperature" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cold">Cold (&lt;200 K)</SelectItem>
                        <SelectItem value="habitable">Habitable Zone (200-350 K)</SelectItem>
                        <SelectItem value="hot">Hot (350-1000 K)</SelectItem>
                        <SelectItem value="scorching">Scorching (&gt;1000 K)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/90">Habitability Level</label>
                    <Select value={filterHabitability} onValueChange={setFilterHabitability}>
                      <SelectTrigger className="bg-background/50 border-purple-500/30">
                        <SelectValue placeholder="Select habitability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High (≥0.7)</SelectItem>
                        <SelectItem value="moderate">Moderate (0.6-0.7)</SelectItem>
                        <SelectItem value="low">Low (0.5-0.6)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/90">Star Type</label>
                <Select value={filterStarType} onValueChange={setFilterStarType}>
                  <SelectTrigger className="bg-background/50 border-purple-500/30">
                    <SelectValue placeholder="Select star type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sun-like">Sun-like (G-type)</SelectItem>
                    <SelectItem value="main-sequence">Main Sequence</SelectItem>
                    <SelectItem value="red-giant">Red Giant</SelectItem>
                    <SelectItem value="hot-star">Hot Star (&gt;7000K)</SelectItem>
                    <SelectItem value="cool-star">Cool Star (&lt;5000K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/90">Period</label>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="bg-background/50 border-purple-500/30">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="ultra_short">Ultra-short (&lt;10 days)</SelectItem>
                      <SelectItem value="short">Short (10-50 days)</SelectItem>
                      <SelectItem value="habitable">Short (50-400 days)</SelectItem>
                      <SelectItem value="long">Short (400-1000 days)</SelectItem>
                      <SelectItem value="ultra_long">Ultra-long (&gt;1000 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>


            <div className="flex gap-2">
              <Button
                onClick={handleFilter}
                disabled={!filterRadius && !filterTemp && !filterHabitability && !filterStarType && !filterPeriod}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button onClick={clearFilters} variant="outline" className="border-purple-500/30 bg-transparent">
                Clear All
              </Button>
            </div>

            {(displayedPlanets.length > 0 || displayedStars.length > 0) && (
              <div id="results-section" className="space-y-4">
                <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {viewMode === "planet"
                          ? `Found ${displayedPlanets.length} planet${displayedPlanets.length !== 1 ? "s" : ""} matching your criteria!`
                          : `Found ${displayedStars.length} star system${displayedStars.length !== 1 ? "s" : ""} matching your criteria!`}
                      </p>
                      <p className="text-sm text-foreground/70 mt-2 flex items-center justify-center gap-2">
                        <ChevronDown className="h-4 w-4 animate-bounce" />
                        Please scroll down to explore the list
                        <ChevronDown className="h-4 w-4 animate-bounce" />
                      </p>
                    </div>
                    <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search & Sort Section */}
        <Card className="bg-card/60 backdrop-blur-md border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Search className="h-6 w-6 text-cyan-400" />
              Search & Sort {viewMode === "planet" ? "Exoplanets" : "Star Systems"}
            </CardTitle>
            <CardDescription className="text-foreground/70">Search by name or sort by various criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground/90">Search by Name</h3>
              <p className="text-sm text-foreground/60">
                Tip: Use quotes for exact match (e.g., "Kepler-86") or search without quotes for prefix match (e.g.,
                Kepler-86 finds Kepler-860, Kepler-861, etc.)
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger className="bg-background/50 border-cyan-500/30">
                    <SelectValue placeholder="Select search type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planet">Name of Planet</SelectItem>
                    <SelectItem value="host">Name of Host Star</SelectItem>
                  </SelectContent>
                </Select>

                {searchType && (
                  <>
                    <Input
                      placeholder={`Enter ${searchType === "planet" ? "planet" : "host star"} name`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="bg-background/50 border-cyan-500/30 focus:border-cyan-500"
                    />
                    <Button
                      onClick={handleSearch}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground/90">Sort Options</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value)
                    setSortOption("")
                  }}
                >
                  <SelectTrigger className="bg-background/50 border-cyan-500/30">
                    <SelectValue placeholder="Select sort type" />
                  </SelectTrigger>
                  <SelectContent>
                    {viewMode === "planet" ? (
                      <>
                        <SelectItem value="year">Discovery Year</SelectItem>
                        <SelectItem value="name-planet">Name (Planet)</SelectItem>
                        <SelectItem value="name-host">Name (Host Star)</SelectItem>
                        <SelectItem value="distance-closest">Distance (Closest First)</SelectItem>
                        <SelectItem value="distance-farthest">Distance (Farthest First)</SelectItem>
                        <SelectItem value="habitability">Habitability Score</SelectItem>
                        <SelectItem value="star-systems">Star Systems (Most Planets)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="name-host">Name (Host Star)</SelectItem>
                        <SelectItem value="star-temp">Stellar Temperature</SelectItem>
                        <SelectItem value="star-radius">Stellar Radius</SelectItem>
                        <SelectItem value="star-luminosity">Stellar Luminosity</SelectItem>
                        <SelectItem value="planet-count">Planet Count</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                {sortBy === "year" && viewMode === "planet" && (
                  <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="bg-background/50 border-cyan-500/30">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {stats.discoveryYears
                        .filter((year) => year !== null)
                        .map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      {stats.discoveryYears.filter((year) => year !== null).length === 0 && (
                        <SelectItem value="none">No years available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {sortBy && (
                <Button
                  onClick={handleSort}
                  disabled={sortBy === "year" && !sortOption}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50"
                >
                  Apply Sort
                </Button>
              )}
            </div>

            {(displayedPlanets.length > 0 || displayedStars.length > 0) && (
                      <div className="text-sm text-foreground/70">
                        {viewMode === "planet"
                          ? `Found ${displayedPlanets.length} planet${displayedPlanets.length !== 1 ? "s" : ""} matching your criteria \n`
                          : `Found ${displayedStars.length} star system${displayedStars.length !== 1 ? "s" : ""} matching your criteria \n`}
                      <div>

                </div>
                <div className="grid gap-3">
                  {viewMode === "planet"
                    ? // Planet View
                      paginatedPlanets.map((planet, index) => (
                        <Link
                          
                          href={`/regular-user/visualization?mode=planet&planet=${encodeURIComponent(planet.kepler_name || planet.pl_name)}&star=${encodeURIComponent(planet.hostname)}`}
                        >
                          <Card className="bg-background/40 border-blue-500/30 hover:border-blue-500 hover:bg-background/60 transition-all cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">
                                    {planet.kepler_name || planet.pl_name}
                                  </h4>
                                  <p className="text-sm text-foreground/70">
                                    Host Star:{" "}
                                    {planetHost(planet) || "Unknown"}
                                  </p>
                                  <div className="flex gap-4 mt-2 text-xs text-foreground/60">
                                    <span>Year: {planet.disc_year || "Unknown"}</span>
                                    <span>Distance: {planet.distance_ly?.toFixed(1) || "Unknown"} ly</span>
                                    <span>Radius: {planet.koi_prad?.toFixed(2) || "Unknown"} R⊕</span>
                                    <span>Temp: {planet.koi_teq?.toFixed(0) || "Unknown"} K</span>
                                    <span>Period: {planet.koi_period?.toFixed(1) || "Unknown"} Days</span>
                                    <div className="text-sm text-green-400 font-semibold">
                                      Habitability:{" "}
                                      {planet.habitability_score != null
                                        ? (planet.habitability_score * 100).toFixed(0)
                                        : "Unknown"}
                                      %
                                    </div>
                                  </div>
                                </div>
                                <Star className="h-5 w-5 text-yellow-400" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))
                    : // Star View
                      paginatedStars.map((star, index) => (
                        <Card
                          key={star.hostname}
                          className="bg-background/40 border-orange-500/30 hover:border-orange-500 transition-all"
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                                    <Sun className="h-5 w-5 text-orange-400" />
                                    {star.hostname}
                                  </h4>
                                  <div className="flex gap-4 mt-2 text-xs text-foreground/60 flex-wrap">
                                    <span className="text-purple-400 font-semibold">Type: {star.starType}</span>
                                    <span>Temp: {star.stellarTemp?.toFixed(0) || "Unknown"} K</span>
                                    <span>Radius: {star.stellarRadius?.toFixed(2) || "Unknown"} R☉</span>
                                    <span>Luminosity: {star.luminosity?.toFixed(2) || "Unknown"} L☉</span>
                                    <span>Surface Gravity: {star.stellarGravity?.toFixed(2) || "Unknown"} log(g)</span>
                                    <span className="text-cyan-400 font-semibold">
                                      {star.planetCount} planet{star.planetCount !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </div>
                                <Link
                                  key = {star.hostname}
                                  href={`/regular-user/visualization?mode=star&star=${encodeURIComponent(star.hostname)}`}
                                  className="shrink-0"
                                >
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                                  >
                                    <Sun className="h-4 w-4 mr-1" />
                                    View System
                                  </Button>
                                </Link>
                              </div>
                              <div className="pl-7">
                                <p className="text-sm text-foreground/70 mb-1">Planets:</p>
                                <div className="flex flex-wrap gap-2">
                                  {star.planets.map((planet) => (
                                    <Link
                                      key={planet.kepoi_name || planet.pl_name || planet.kepler_name}
                                      href={`/regular-user/visualization?mode=planet&planet=${encodeURIComponent(planet.kepler_name || planet.pl_name)}&star=${encodeURIComponent(planet.hostname)}`}
                                      className="text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded px-2 py-1 transition-colors"
                                    >
                                      {planet.kepler_name || planet.pl_name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className={
                              currentPage === pageNum
                                ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                                : "border-cyan-500/30"
                            }
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/30"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Random Exploration */}
        <Card className="bg-card/60 backdrop-blur-md border-2 border-purple-500/30 shadow-lg shadow-purple-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shuffle className="h-6 w-6 text-purple-400" />
                  Random Exploration
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Discover 5 random exoplanets from the Kepler dataset
                </CardDescription>
              </div>
              <Button
                onClick={generateRandomPlanets}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Shuffle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {randomPlanets.map((planet) => (
                <Link
                  key={planet.kepoi_name || planet.pl_name || planet.kepler_name}
                  href={`/regular-user/visualization?mode=planet&planet=${encodeURIComponent(planet.kepler_name || planet.pl_name)}&star=${encodeURIComponent(planet.hostname)}`}
                >
                  <Card className="h-full bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30 hover:border-purple-500 hover:scale-105 transition-all cursor-pointer group">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-pink-400 group-hover:animate-spin" />
                        {planet.kepler_name || planet.pl_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-cyan-400" />
                        <span className="text-foreground/80">
                          Host:{" "}
                          {planetHost(planet) || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-foreground/80">
                          Radius: {planet.koi_prad?.toFixed(2) || "Unknown"} R⊕
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Thermometer className="h-4 w-4 text-orange-400" />
                        <span className="text-foreground/80">Temp: {planet.koi_teq?.toFixed(0) || "Unknown"} K</span>
                      </div>
                      <div className="text-sm text-green-400 font-semibold">
                        Habitability:{" "}
                        {planet.habitability_score != null ? (planet.habitability_score * 100).toFixed(0) : "Unknown"}%
                      </div>
                      <div className="text-sm text-foreground/70">Discovered: {planet.disc_year || "Unknown"}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-cyan-400">
                {displayedPlanets.length > 0 ? displayedPlanets.length : stats.totalPlanets}
              </CardTitle>
              <CardDescription className="text-foreground/80">
                {displayedPlanets.length > 0 ? "Planets Found" : "Total Exoplanets in Dataset"}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-green-400">{stats.habitablePlanets}</CardTitle>
              <CardDescription className="text-foreground/80">Habitable Planets (Score &gt; 0.5)</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-orange-400">
                {displayedStars.length > 0 ? displayedStars.length : stats.uniqueStarSystems}
              </CardTitle>
              <CardDescription className="text-foreground/80">
                {displayedStars.length > 0 ? "Star Systems Found" : "Unique Star Systems"}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
