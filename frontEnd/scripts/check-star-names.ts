import { loadKeplerData } from "../lib/kepler-data"

async function checkStarNames() {
  console.log("[v0] Loading Kepler data...")
  const planets = await loadKeplerData()

  // Get all unique hostnames
  const hostnames = new Set<string>()
  const planetsWithMissingHost: any[] = []

  planets.forEach((planet) => {
    if (planet.hostname && planet.hostname.trim() !== "") {
      hostnames.add(planet.hostname.trim())
    } else {
      planetsWithMissingHost.push({
        kepid: planet.kepid,
        kepler_name: planet.kepler_name,
        pl_name: planet.pl_name,
      })
    }
  })

  console.log(`[v0] Total unique hostnames: ${hostnames.size}`)
  console.log(`[v0] Planets with missing hostname: ${planetsWithMissingHost.length}`)

  // Check for patterns like Kepler-86 vs Kepler-860
  const hostnameArray = Array.from(hostnames).sort()
  const potentialConflicts: string[] = []

  for (let i = 0; i < hostnameArray.length; i++) {
    const current = hostnameArray[i]

    // Check if adding a '0' would match another hostname
    const withZero = current + "0"
    if (hostnames.has(withZero)) {
      potentialConflicts.push(`${current} vs ${withZero}`)
    }
  }

  console.log(`[v0] Potential conflicts (XX vs XX0):`)
  potentialConflicts.forEach((conflict) => console.log(`  - ${conflict}`))

  // Check specific examples
  console.log("\n[v0] Checking specific examples:")
  console.log(`  - Kepler-86 exists: ${hostnames.has("Kepler-86")}`)
  console.log(`  - Kepler-860 exists: ${hostnames.has("Kepler-860")}`)

  // Show sample of planets with missing hostnames
  console.log("\n[v0] Sample planets with missing hostname:")
  planetsWithMissingHost.slice(0, 10).forEach((p) => {
    console.log(`  - ${p.kepler_name || p.pl_name} (kepid: ${p.kepid})`)
  })
}

checkStarNames()
