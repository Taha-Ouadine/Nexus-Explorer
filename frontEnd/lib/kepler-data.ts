// Utility functions for loading and processing Kepler exoplanet data

export interface KeplerPlanet {
  kepid: number
  kepoi_name: string
  kepler_name: string
  koi_disposition: string
  koi_pdisposition: string
  koi_score: number
  koi_period: number
  koi_time0bk: number
  koi_impact: number
  koi_duration: number
  koi_depth: number
  koi_prad: number
  koi_teq: number
  koi_insol: number
  koi_model_snr: number
  koi_tce_plnt_num: number
  koi_tce_delivname: string
  koi_steff: number
  koi_slogg: number
  koi_srad: number
  ra: number
  dec: number
  koi_kepmag: number
  pl_name: string
  disc_year: number
  disc_refname: string
  hostname: string
  habitability_score: number
  luminosity: number
  M_abs: number
  distance_pc: number
  distance_ly: number
  proximity_score: number
  earth_likeness_score: number
}

const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kepler_data_with_scores-AusHlm3jS3x2xrAJ1yVmpQXVdmlPjj.csv"

let cachedData: KeplerPlanet[] | null = null

export async function loadKeplerData(): Promise<KeplerPlanet[]> {
  if (cachedData) {
    return cachedData
  }

  try {
    const response = await fetch(CSV_URL)
    const csvText = await response.text()

    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())

    const planets: KeplerPlanet[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = parseCSVLine(line)
      if (values.length !== headers.length) continue

      const planet: any = {}
      headers.forEach((header, index) => {
        const value = values[index]
        planet[header] = parseValue(value)
      })

      planets.push(planet as KeplerPlanet)
    }

    cachedData = planets
    return planets
  } catch (error) {
    console.error("[v0] Error loading Kepler data:", error)
    return []
  }
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      values.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

function parseValue(value: string): any {
  if (value === "" || value === "null" || value === "undefined") {
    return null
  }

  const num = Number(value)
  if (!isNaN(num)) {
    return num
  }

  return value
}

export function getStatistics(planets: KeplerPlanet[]) {
  const totalPlanets = planets.length
  const habitablePlanets = planets.filter((p) => p.habitability_score > 0.4).length
  const uniqueStarSystems = new Set(planets.map((p) => p.hostname)).size
  const avgHabitability = planets.reduce((sum, p) => sum + p.habitability_score, 0) / totalPlanets
  const avgDistance = planets.reduce((sum, p) => sum + (p.distance_ly || 0), 0) / totalPlanets

  return {
    totalPlanets,
    habitablePlanets,
    uniqueStarSystems,
    avgHabitability,
    avgDistance,
    discoveryYears: Array.from(new Set(planets.map((p) => p.disc_year))).sort((a, b) => a - b),
  }
}



export const extractHostnameFromPlanetName = (planetName: string | null): string => {
  if (!planetName) return "Unknown"

  // Pattern: "Kepler-123 b" -> "Kepler-123"
  // Remove the planet letter suffix (space + letter at the end)
  const match = planetName.match(/^(.+?)\s+[a-z]$/i)
  if (match) {
    return match[1].trim()
  }

  // If no match, return the planet name as-is
  return planetName.trim()
}

export const planetHost = (planet: KeplerPlanet) => {
  if (planet.hostname) {return planet.hostname}
  return extractHostnameFromPlanetName(planet.kepler_name || planet.pl_name)
}