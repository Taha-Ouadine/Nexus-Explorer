"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Rocket, Brain, Zap, Home, Users, Search, Sparkles, Eye, List } from "lucide-react"
import { loadKeplerData, type KeplerPlanet } from "@/lib/kepler-data"
import Link from "next/link"
import { PlanetaryFeaturesGlossary } from "@/components/planetary-features-glossary"
import { StellarFeaturesGuide } from "@/components/stellar-features-guide"

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

const allQuizQuestions: QuizQuestion[] = [
  {
    question: "What is an exoplanet?",
    options: [
      "A planet in our solar system",
      "A planet outside our solar system",
      "A moon orbiting Jupiter",
      "A type of asteroid",
    ],
    correctAnswer: 1,
    explanation: "An exoplanet is a planet that orbits a star outside our solar system!",
  },
  {
    question: "Which method does Kepler primarily use to detect exoplanets?",
    options: ["Direct imaging", "Transit method", "Radial velocity", "Gravitational lensing"],
    correctAnswer: 1,
    explanation:
      "The transit method detects planets by measuring the slight dimming of a star's light when a planet passes in front of it.",
  },
  {
    question: "How many exoplanets has Kepler discovered?",
    options: ["Less than 100", "Around 500", "Over 2,700", "Over 10,000"],
    correctAnswer: 2,
    explanation: "NASA's Kepler mission has discovered over 2,700 confirmed exoplanets!",
  },
  {
    question: "What is the 'habitable zone'?",
    options: [
      "The area around a star where liquid water could exist",
      "The center of a galaxy",
      "A region with no asteroids",
      "The edge of the universe",
    ],
    correctAnswer: 0,
    explanation:
      "The habitable zone, also called the 'Goldilocks zone', is the region around a star where conditions might be just right for liquid water to exist on a planet's surface.",
  },
  {
    question: "What does the transit method measure?",
    options: [
      "The color of a star",
      "The dimming of a star's light",
      "The speed of a planet",
      "The temperature of a planet",
    ],
    correctAnswer: 1,
    explanation:
      "The transit method measures the slight dimming of a star's brightness when a planet passes in front of it from our perspective.",
  },
  {
    question: "Which space telescope was specifically designed to find exoplanets?",
    options: ["Hubble", "James Webb", "Kepler", "Chandra"],
    correctAnswer: 2,
    explanation: "NASA's Kepler Space Telescope was specifically designed to discover Earth-sized exoplanets.",
  },
  {
    question: "What is a 'Hot Jupiter'?",
    options: [
      "Jupiter during summer",
      "A gas giant very close to its star",
      "A planet made of lava",
      "A red dwarf star",
    ],
    correctAnswer: 1,
    explanation:
      "A Hot Jupiter is a gas giant exoplanet that orbits very close to its host star, resulting in extremely high temperatures.",
  },
  {
    question: "How long did the Kepler mission operate?",
    options: ["2 years", "5 years", "9 years", "15 years"],
    correctAnswer: 2,
    explanation: "The Kepler mission operated from 2009 to 2018, discovering thousands of exoplanets over 9 years.",
  },
  {
    question: "What is a super-Earth?",
    options: [
      "Earth with superpowers",
      "A planet larger than Earth but smaller than Neptune",
      "The largest planet ever found",
      "A planet made of diamonds",
    ],
    correctAnswer: 1,
    explanation:
      "A super-Earth is an exoplanet with a mass higher than Earth's but substantially below the masses of ice giants like Neptune.",
  },
  {
    question: "Which mission succeeded Kepler?",
    options: ["TESS", "Voyager", "Cassini", "New Horizons"],
    correctAnswer: 0,
    explanation:
      "TESS (Transiting Exoplanet Survey Satellite) launched in 2018 to continue the search for exoplanets after Kepler.",
  },

  // --------- NEW QUESTIONS BELOW --------- //

  {
    question: "Which of these is NOT a method used to detect exoplanets?",
    options: ["Transit method", "Radial velocity", "Magnetic resonance", "Direct imaging"],
    correctAnswer: 2,
    explanation: "Magnetic resonance is not used to detect exoplanets.",
  },
  {
    question: "What does 'radial velocity' measure?",
    options: [
      "The wobble of a star due to a planet’s gravity",
      "The brightness of a star",
      "The distance between stars",
      "The speed of light",
    ],
    correctAnswer: 0,
    explanation:
      "Radial velocity detects small shifts in a star’s spectrum caused by the gravitational pull of an orbiting planet.",
  },
  {
    question: "Which planet is often used as an example when talking about 'Hot Jupiters'?",
    options: ["51 Pegasi b", "Proxima b", "Kepler-22b", "TRAPPIST-1e"],
    correctAnswer: 0,
    explanation: "51 Pegasi b was the first Hot Jupiter discovered orbiting a Sun-like star.",
  },
  {
    question: "What is the main goal of the TESS mission?",
    options: [
      "Explore the outer solar system",
      "Survey the entire sky for nearby exoplanets",
      "Study black holes",
      "Measure cosmic microwave background",
    ],
    correctAnswer: 1,
    explanation: "TESS surveys nearly the entire sky to detect exoplanets around bright, nearby stars.",
  },
  {
    question: "What is the TRAPPIST-1 system famous for?",
    options: [
      "Having seven Earth-sized planets",
      "Being the closest star to Earth",
      "Hosting the largest exoplanet",
      "Having no planets at all",
    ],
    correctAnswer: 0,
    explanation: "The TRAPPIST-1 system has seven Earth-sized planets, three of which are in the habitable zone.",
  },
  {
    question: "What does 'exoplanet atmosphere study' often use?",
    options: ["Infrared spectroscopy", "X-ray imaging", "Microwaves", "Radio signals"],
    correctAnswer: 0,
    explanation:
      "Infrared spectroscopy is used to detect molecules in exoplanet atmospheres when starlight passes through them.",
  },
  {
    question: "Which of these is considered potentially habitable?",
    options: ["Kepler-452b", "51 Pegasi b", "Jupiter", "Mercury"],
    correctAnswer: 0,
    explanation: "Kepler-452b is a super-Earth in the habitable zone and considered potentially habitable.",
  },
  {
    question: "Which star is closest to Earth with a known exoplanet?",
    options: ["Proxima Centauri", "Sirius", "Vega", "Betelgeuse"],
    correctAnswer: 0,
    explanation: "Proxima Centauri hosts an exoplanet called Proxima b, just over 4 light-years away.",
  },
  {
    question: "What does 'light curve' refer to in exoplanet science?",
    options: [
      "A graph of brightness of a star over time",
      "The bending of light in space",
      "The path of a comet",
      "The wavelength of starlight",
    ],
    correctAnswer: 0,
    explanation:
      "A light curve shows how the brightness of a star changes, which helps detect planets via the transit method.",
  },
  {
    question: "What is an exomoon?",
    options: [
      "A moon orbiting Earth",
      "A moon orbiting an exoplanet",
      "A moon inside our solar system",
      "A dwarf planet",
    ],
    correctAnswer: 1,
    explanation: "An exomoon is a moon that orbits a planet outside our solar system.",
  },
  {
    question: "Which planet type is most common in our galaxy according to Kepler?",
    options: ["Gas giants", "Super-Earths", "Brown dwarfs", "Neutron planets"],
    correctAnswer: 1,
    explanation:
      "Super-Earths (planets larger than Earth but smaller than Neptune) are the most common type found by Kepler.",
  },
  {
    question: "Which exoplanet detection method can find planets even if they don’t transit?",
    options: ["Transit method", "Radial velocity", "Light curve", "Astrometry"],
    correctAnswer: 1,
    explanation: "Radial velocity can detect planets by their gravitational effect on stars, even without transits.",
  },
  {
    question: "What is Kepler-186f famous for?",
    options: [
      "Being Earth-sized in the habitable zone",
      "Being the largest exoplanet",
      "Orbiting the hottest star",
      "Having the most moons",
    ],
    correctAnswer: 0,
    explanation:
      "Kepler-186f is an Earth-sized planet in the habitable zone of its star, making it especially interesting.",
  },
  {
    question: "What is the main limitation of the transit method?",
    options: [
      "It only works if the planet passes in front of the star from our perspective",
      "It cannot detect small planets",
      "It requires radio signals",
      "It only works for nearby stars",
    ],
    correctAnswer: 0,
    explanation:
      "The transit method requires a perfect alignment where the planet passes in front of its star as seen from Earth.",
  },
  {
    question: "What is gravitational microlensing?",
    options: [
      "The bending of light by a massive object to reveal planets",
      "The wobbling of a star",
      "The dimming of a star",
      "The splitting of light into colors",
    ],
    correctAnswer: 0,
    explanation:
      "Microlensing uses the bending of light from a distant star by a foreground star (with planets) to reveal the planets.",
  },
  {
    question: "Which of these telescopes is planned to help study exoplanet atmospheres?",
    options: ["James Webb Space Telescope", "Chandra", "Spitzer", "Gaia"],
    correctAnswer: 0,
    explanation:
      "The James Webb Space Telescope (JWST) will analyze exoplanet atmospheres with advanced infrared instruments.",
  },
  {
    question: "What is the Roche limit in planetary science?",
    options: [
      "The distance within which a planet would be torn apart by tidal forces",
      "The edge of the habitable zone",
      "The maximum size of a gas giant",
      "The farthest orbit from a star",
    ],
    correctAnswer: 0,
    explanation:
      "The Roche limit is the closest distance a planet or moon can approach a larger body before being torn apart by tidal forces.",
  },
  {
    question: "Which exoplanet detection method helped discover 51 Pegasi b?",
    options: ["Transit method", "Radial velocity", "Direct imaging", "Astrometry"],
    correctAnswer: 1,
    explanation: "51 Pegasi b was discovered in 1995 using the radial velocity method.",
  },
  {
    question: "What are 'rogue planets'?",
    options: [
      "Planets that orbit multiple stars",
      "Planets not bound to any star",
      "Planets orbiting black holes",
      "Artificial planets",
    ],
    correctAnswer: 1,
    explanation: "Rogue planets are free-floating planets that don’t orbit a star and drift through space.",
  },
]
function HabitableOrNotGame() {
  const [planets, setPlanets] = useState<KeplerPlanet[]>([])
  const [balancedPlanets, setBalancedPlanets] = useState<KeplerPlanet[]>([])
  const [currentPlanet, setCurrentPlanet] = useState<KeplerPlanet | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [gameCompleted, setGameCompleted] = useState(false)

  useEffect(() => {
    loadKeplerData().then((data) => {
      const filteredPlanets = data.filter(
        (p) =>
          p.habitability_score !== null &&
          p.koi_period !== null &&
          p.koi_prad !== null &&
          p.koi_steff !== null &&
          p.koi_srad !== null &&
          p.koi_insol !== null,
      )
      setPlanets(filteredPlanets)

      // Create balanced dataset
      const habitablePlanets = filteredPlanets.filter((p) => p.habitability_score > 0.4)
      const nonHabitablePlanets = filteredPlanets.filter((p) => p.habitability_score <= 0.4)

      const neededNonHabitable = Math.min(100 - habitablePlanets.length, nonHabitablePlanets.length)
      const sampledNonHabitable = [...nonHabitablePlanets].sort(() => 0.5 - Math.random()).slice(0, neededNonHabitable)

      const balanced = [...habitablePlanets, ...sampledNonHabitable]
      setBalancedPlanets(balanced)
      setLoading(false)
      selectRandomPlanet(balanced)
    })
  }, [])

  const selectRandomPlanet = (planetList: KeplerPlanet[]) => {
    const randomIndex = Math.floor(Math.random() * planetList.length)
    setCurrentPlanet(planetList[randomIndex])
    setShowResult(false)
  }

  const getStarType = (temp: number | null): string => {
    if (!temp) return "Unknown"
    if (temp > 7000) return "Hot Star (A/B-type)"
    if (temp >= 5000 && temp <= 6000) return "Sun-like (G-type)"
    if (temp >= 3500 && temp < 5000) return "Orange Dwarf (K-type)"
    return "Red Dwarf (M-type)"
  }

  const getOrbitalPeriodDescription = (period: number): string => {
    if (period < 10) return "Very Short Orbit ⚡"
    if (period < 50) return "Short Orbit 🪐"
    if (period < 200) return "Moderate Orbit 🌍"
    if (period < 400) return "Long Orbit 🚀"
    return "Very Long Orbit ⏳"
  }

  const getPlanetSizeDescription = (radius: number): string => {
    if (radius < 0.8) return "Sub-Earth Size 🔴"
    if (radius <= 1.2) return "Earth-like Size 🌍"
    if (radius <= 2.0) return "Super-Earth Size 🔵"
    if (radius <= 6.0) return "Mini-Neptune Size 💧"
    return "Gas Giant Size 🪐"
  }

  const getInsolationDescription = (insol: number): string => {
    if (insol < 0.25) return "Very Low ☀️"
    if (insol < 0.75) return "Low 🌤️"
    if (insol <= 1.5) return "Earth-like ☀️"
    if (insol < 5) return "High 🔆"
    return "Very High 🔥"
  }

  const explainHabitability = (planet: KeplerPlanet) => {
    const factors = []

    // Orbital period analysis
    if (planet.koi_period) {
      if (planet.koi_period < 10) {
        factors.push("very short orbital period suggests tidal locking and extreme temperature differences")
      } else if (planet.koi_period > 400) {
        factors.push("long orbital period results in extreme seasonal variations")
      } else if (planet.koi_period >= 50 && planet.koi_period <= 400) {
        factors.push("moderate orbital period provides stable seasonal cycles")
      }
    }

    // Stellar temperature analysis
    if (planet.koi_steff) {
      const starType = getStarType(planet.koi_steff)
      if (starType.includes("Hot Star")) {
        factors.push("hot star emits intense UV radiation and has shorter lifespan")
      } else if (starType.includes("Red Dwarf")) {
        factors.push("red dwarf stars frequently flare and could strip planetary atmospheres")
      } else if (starType.includes("Sun-like")) {
        factors.push("Sun-like star provides stable energy for billions of years")
      } else if (starType.includes("Orange Dwarf")) {
        factors.push("orange dwarf star is stable with very long lifespan")
      }
    }

    // Planet size analysis
    if (planet.koi_prad) {
      const sizeDesc = getPlanetSizeDescription(planet.koi_prad)
      if (sizeDesc.includes("Gas Giant")) {
        factors.push("gas giant lacks solid surface necessary for life as we know it")
      } else if (sizeDesc.includes("Mini-Neptune")) {
        factors.push("likely has thick gaseous envelope without solid surface")
      } else if (sizeDesc.includes("Earth-like")) {
        factors.push("Earth-like size is optimal for geological activity and atmosphere retention")
      } else if (sizeDesc.includes("Super-Earth")) {
        factors.push("super-Earth size could support life but strong gravity may be challenging")
      } else if (sizeDesc.includes("Sub-Earth")) {
        factors.push("small size may not retain substantial atmosphere")
      }
    }

    // Insolation analysis (energy received from star)
    if (planet.koi_insol) {
      if (planet.koi_insol <= 0.25) {
        factors.push("receives very little stellar energy, making surface extremely cold")
      } else if (planet.koi_insol >= 5) {
        factors.push("receives intense stellar energy, likely making surface too hot")
      } else if (planet.koi_insol >= 0.75 && planet.koi_insol <= 1.5) {
        factors.push("receives Earth-like stellar energy levels")
      }
    }

    // Stellar radius analysis
    if (planet.koi_srad) {
      if (planet.koi_srad > 2) {
        factors.push("large host star has shorter lifespan and different energy output")
      } else if (planet.koi_srad < 0.5) {
        factors.push("small host star may have different spectral energy distribution")
      }
    }

    return factors
  }

  const handleGuess = (isHabitable: boolean) => {
    if (!currentPlanet) return

    const actuallyHabitable = currentPlanet.habitability_score > 0.4
    const correct = isHabitable === actuallyHabitable

    setIsCorrect(correct)
    setShowResult(true)
    setTotal(total + 1)
    if (correct) {
      setScore(score + 1)
    }

    if (total + 1 >= 12) {
      setTimeout(() => setGameCompleted(true), 1500)
    }
  }

  const restartGame = () => {
    setScore(0)
    setTotal(0)
    setGameCompleted(false)
    setShowResult(false)
    selectRandomPlanet(balancedPlanets)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
        <p className="mt-4 text-foreground/70">Loading planet data...</p>
      </div>
    )
  }

  if (gameCompleted) {
    const percentage = (score / 12) * 100
    return (
      <div className="text-center space-y-6 py-8">
        <h3 className="text-3xl font-bold">Game Complete! 🎯</h3>
        <div className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          {score}/12 Correct ({percentage.toFixed(0)}%)
        </div>

        {percentage < 50 && (
          <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 p-6 rounded-lg border border-red-500/30">
            <h4 className="text-xl font-bold mb-2">Want to improve? 🌟</h4>
            <p className="mb-4">Explore the planets database to learn more about their characteristics!</p>
            <Button
              onClick={() => (window.location.href = "/regular-user")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Explore Planets Database
            </Button>
          </div>
        )}

        <Button
          onClick={restartGame}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          Play Again
        </Button>
      </div>
    )
  }

  if (!currentPlanet) {
    return <div>No planet data available</div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Habitable or Not? 🪐</h3>
        <p className="text-foreground/70">Guess if this planet could support life based on its characteristics</p>
        <div className="mt-2 text-sm text-foreground/60">Question {total + 1} of 12</div>
      </div>

      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-6 rounded-lg border border-purple-500/30">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">
                {currentPlanet.kepler_name || currentPlanet.pl_name }
              </h4>
              <Link href={`/regular-user/visualization?mode=planet&planet=${encodeURIComponent(currentPlanet.kepler_name || currentPlanet.pl_name)}&star=${encodeURIComponent(currentPlanet.hostname)}`}>
                <Button size="sm" variant="outline" className="border-cyan-500/30 hover:border-cyan-500 bg-transparent">
                  <Eye className="h-4 w-4 mr-1" />
                  3D View
                </Button>
              </Link>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Planet Size:</span>
                <span>
                  {getPlanetSizeDescription(currentPlanet.koi_prad || 0)} ({(currentPlanet.koi_prad || 0).toFixed(2)}{" "}
                  R⊕)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Orbital Period:</span>
                <span>
                  {getOrbitalPeriodDescription(currentPlanet.koi_period || 0)} (
                  {(currentPlanet.koi_period || 0).toFixed(1)} days)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Stellar Insolation:</span>
                <span>
                  {getInsolationDescription(currentPlanet.koi_insol || 0)} ({(currentPlanet.koi_insol || 0).toFixed(2)}{" "}
                  Earth flux)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Host Star Type:</span>
                <span>{getStarType(currentPlanet.koi_steff)}</span>
              </div>
              <div className="flex justify-between">
                <span>Stellar Radius:</span>
                <span>{(currentPlanet.koi_srad || 0).toFixed(2)} R☉</span>
              </div>
              <div className="flex justify-between">
                <span>Stellar Temp:</span>
                <span>{currentPlanet.koi_steff ? Math.round(currentPlanet.koi_steff) : "Unknown"} K</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!showResult ? (
              <div className="space-y-3">
                <Button
                  onClick={() => handleGuess(true)}
                  className="w-full bg-green-500/30 hover:bg-green-500/40 border-2 border-green-500 h-12"
                >
                  ✅ Potentially Habitable
                </Button>
                <Button
                  onClick={() => handleGuess(false)}
                  className="w-full bg-red-500/30 hover:bg-red-500/40 border-2 border-red-500 h-12"
                >
                  ❌ Not Habitable
                </Button>
              </div>
            ) : (
              <div
                className={`p-4 rounded-lg border-2 ${isCorrect ? "bg-green-500/20 border-green-500" : "bg-red-500/20 border-red-500"}`}
              >
                <h5 className="font-bold text-lg mb-2">{isCorrect ? "Correct! 🎉" : "Incorrect! 💫"}</h5>
                <p className="text-sm mb-3">
                  This planet is{" "}
                  <strong>{currentPlanet.habitability_score > 0.4 ? "potentially habitable" : "not habitable"}</strong>.
                  Habitability score: {((currentPlanet.habitability_score || 0) * 100).toFixed(1)}%
                </p>
                <div className="text-sm mb-4">
                  <strong>Why?</strong> {explainHabitability(currentPlanet).join(", ")}.
                </div>
                <Button
                  onClick={() => selectRandomPlanet(balancedPlanets)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {total < 11 ? "Next Planet" : "See Results"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full">
          <Trophy className="h-5 w-5 text-white" />
          <span className="font-bold text-white">Score: {score}/12</span>
        </div>
        <Button
          onClick={restartGame}
          variant="outline"
          className="border-pink-500/30 hover:border-pink-500 bg-transparent"
        >
          Restart Game
        </Button>
      </div>
    </div>
  )
}

// 2. Updated Build Your Colony Game
function BuildYourColonyGame() {
  const [planets, setPlanets] = useState<KeplerPlanet[]>([])
  const [balancedPlanets, setBalancedPlanets] = useState<KeplerPlanet[]>([])
  const [candidates, setCandidates] = useState<KeplerPlanet[]>([])
  const [selectedPlanet, setSelectedPlanet] = useState<KeplerPlanet | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadKeplerData().then((data) => {
      const filteredPlanets = data.filter(
        (p) =>
          p.habitability_score !== null &&
          p.koi_period !== null &&
          p.koi_prad !== null &&
          p.koi_steff !== null &&
          p.koi_insol !== null,
      )
      setPlanets(filteredPlanets)

      // Create balanced dataset
      const habitablePlanets = filteredPlanets.filter((p) => p.habitability_score > 0.4)
      const nonHabitablePlanets = filteredPlanets.filter((p) => p.habitability_score <= 0.4)

      const neededNonHabitable = Math.min(100 - habitablePlanets.length, nonHabitablePlanets.length)
      const sampledNonHabitable = [...nonHabitablePlanets].sort(() => 0.5 - Math.random()).slice(0, neededNonHabitable)

      const balanced = [...habitablePlanets, ...sampledNonHabitable]
      setBalancedPlanets(balanced)
      setLoading(false)
      selectNewCandidates(balanced)
    })
  }, [])

  const selectNewCandidates = (planetList: KeplerPlanet[]) => {
    const habitablePlanets = planetList.filter((p) => p.habitability_score > 0.4)
    const nonHabitablePlanets = planetList.filter((p) => p.habitability_score <= 0.4)

    const numHabitable = Math.floor(Math.random() * 2) + 1
    const numNonHabitable = 3 - numHabitable

    const selectedHabitable = [...habitablePlanets].sort(() => 0.5 - Math.random()).slice(0, numHabitable)

    const selectedNonHabitable = [...nonHabitablePlanets].sort(() => 0.5 - Math.random()).slice(0, numNonHabitable)

    const selected = [...selectedHabitable, ...selectedNonHabitable].sort(() => 0.5 - Math.random())

    setCandidates(selected)
    setSelectedPlanet(null)
    setShowResult(false)
  }

  const getStarType = (temp: number | null): string => {
    if (!temp) return "Unknown"
    if (temp > 7000) return "Hot Star (A/B-type)"
    if (temp >= 5000 && temp <= 6000) return "Sun-like (G-type)"
    if (temp >= 3500 && temp < 5000) return "Orange Dwarf (K-type)"
    return "Red Dwarf (M-type)"
  }

  const getOrbitalPeriodDescription = (period: number): string => {
    if (period < 10) return "Very Short"
    if (period < 50) return "Short"
    if (period < 200) return "Moderate"
    if (period < 400) return "Long"
    return "Very Long"
  }

  const getInsolationDescription = (insol: number): string => {
    if (insol < 0.25) return "Very Low"
    if (insol < 0.75) return "Low"
    if (insol <= 1.5) return "Earth-like"
    if (insol < 5) return "High"
    return "Very High"
  }

  const calculateColonyScore = (planet: KeplerPlanet) => {
    const habitability = (planet.habitability_score || 0) * 100

    // Insolation score (Earth-like is best)
    const insolationScore = planet.koi_insol ? Math.max(0, 100 - Math.abs((planet.koi_insol - 1) * 40)) : 50

    // Star stability score
    const starStabilityScore = planet.koi_steff
      ? planet.koi_steff >= 5000 && planet.koi_steff <= 6000
        ? 100
        : planet.koi_steff >= 4000 && planet.koi_steff <= 7000
          ? 70
          : 30
      : 50

    // Planet size score
    const sizeScore = planet.koi_prad ? Math.min(100, Math.max(0, 100 - Math.abs(planet.koi_prad - 1) * 30)) : 50

    // Orbital period stability
    const periodStabilityScore = planet.koi_period
      ? planet.koi_period >= 50 && planet.koi_period <= 400
        ? 100
        : planet.koi_period >= 20 && planet.koi_period <= 500
          ? 70
          : 30
      : 50

    return (
      habitability * 0.4 +
      insolationScore * 0.25 +
      starStabilityScore * 0.2 +
      sizeScore * 0.1 +
      periodStabilityScore * 0.05
    )
  }

  const getColonyFactors = (planet: KeplerPlanet) => {
    const factors = []

    if (planet.koi_insol) {
      if (planet.koi_insol >= 0.75 && planet.koi_insol <= 1.5) {
        factors.push("receives Earth-like stellar energy levels")
      } else if (planet.koi_insol < 0.75) {
        factors.push("low stellar energy may require advanced heating systems")
      } else {
        factors.push("high stellar energy requires extensive cooling and radiation protection")
      }
    }

    if (planet.koi_steff) {
      if (planet.koi_steff >= 5000 && planet.koi_steff <= 6000) {
        factors.push("Sun-like star provides stable, long-lasting energy")
      } else if (planet.koi_steff < 4000) {
        factors.push("red dwarf may have frequent flare activity that could damage equipment")
      } else if (planet.koi_steff > 7000) {
        factors.push("hot star has shorter lifespan and emits more UV radiation")
      } else {
        factors.push("star type offers moderate stability for colonization")
      }
    }

    if (planet.koi_prad) {
      if (planet.koi_prad >= 0.8 && planet.koi_prad <= 1.2) {
        factors.push("Earth-like gravity and size suitable for human adaptation")
      } else if (planet.koi_prad > 1.5) {
        factors.push("higher gravity may challenge human adaptation and increase structural demands")
      } else if (planet.koi_prad < 0.8) {
        factors.push("lower gravity may not retain atmosphere effectively long-term")
      }
    }

    if (planet.koi_period) {
      if (planet.koi_period < 10) {
        factors.push("very short orbital year may cause extreme climate patterns")
      } else if (planet.koi_period > 400) {
        factors.push("long orbital period results in extreme seasonal variations")
      } else {
        factors.push("moderate orbital period provides stable seasonal cycles")
      }
    }

    return factors
  }

  const getColonyFeedback = (planet: KeplerPlanet) => {
    const scores = candidates.map((p) => calculateColonyScore(p))
    const maxScore = Math.max(...scores)
    const chosenScore = calculateColonyScore(planet)
    const habitabilityPercent = ((planet.habitability_score || 0) * 100).toFixed(1)

    if (chosenScore >= maxScore * 0.9) {
      return {
        title: "Excellent Choice! 🎉",
        message: `This planet has ideal conditions for colonization with a habitability score of ${habitabilityPercent}%!`,
        points: 10,
      }
    } else if (chosenScore >= maxScore * 0.7) {
      return {
        title: "Good Choice! 👍",
        message: `This planet is suitable for colonization with a ${habitabilityPercent}% habitability score, though it has some challenges.`,
        points: 5,
      }
    } else {
      return {
        title: "Risky Choice! ⚠️",
        message: `Colonization here will face significant challenges with only a ${habitabilityPercent}% habitability score.`,
        points: 0,
      }
    }
  }

  const handleColonyChoice = (planet: KeplerPlanet) => {
    setSelectedPlanet(planet)
    setShowResult(true)

    const scores = candidates.map((p) => calculateColonyScore(p))
    const maxScore = Math.max(...scores)
    const chosenScore = calculateColonyScore(planet)

    if (chosenScore >= maxScore * 0.9) {
      setScore(score + 10)
    } else if (chosenScore >= maxScore * 0.7) {
      setScore(score + 5)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
        <p className="mt-4 text-foreground/70">Loading colony candidates...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Build Your Colony 🚀</h3>
        <p className="text-foreground/70">
          Choose the best planet to establish your space colony based on scientific factors
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {candidates.map((planet, index) => (
          <Card
            key={planet.kepid}
            className={`cursor-pointer transition-all hover:scale-105 ${
              selectedPlanet?.kepid === planet.kepid
                ? "border-2 border-yellow-500 bg-yellow-500/10"
                : "border-2 border-purple-500/30"
            }`}
            onClick={() => !showResult && handleColonyChoice(planet)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {planet.kepler_name || planet.pl_name }
                </CardTitle>
                <Link href={`/regular-user/visualization?mode=planet&planet=${encodeURIComponent(planet.kepler_name || planet.pl_name)}&star=${encodeURIComponent(planet.hostname)}`}>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4 text-cyan-400" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-xs">Colonization Candidate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-foreground/60">Period:</span>
                  <span className="font-medium">{(planet.koi_period || 0).toFixed(0)}d</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-foreground/60">Insolation:</span>
                  <span className="font-medium">{(planet.koi_insol || 0).toFixed(2)}×</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-foreground/60">Size:</span>
                  <span className="font-medium">{(planet.koi_prad || 0).toFixed(2)} R⊕</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-foreground/60">Temperature:</span>
                  <span className="font-medium">{planet.koi_steff ? Math.round(planet.koi_steff) : "?"}K</span>
                </div>
              </div>
              <div className="pt-1 border-t border-foreground/10">
                <span className="text-foreground/60">Star: </span>
                <span className="font-medium text-purple-400">{getStarType(planet.koi_steff)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showResult && selectedPlanet && (
        <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 p-6 rounded-lg border border-cyan-500/30">
          <div className="text-center">
            <h4 className="text-xl font-bold mb-2">{getColonyFeedback(selectedPlanet).title}</h4>
            <p className="mb-4">{getColonyFeedback(selectedPlanet).message}</p>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-background/30 p-3 rounded">
                <div>Colony Score</div>
                <div className="font-bold text-lg">{calculateColonyScore(selectedPlanet).toFixed(1)}/100</div>
              </div>
              <div className="bg-background/30 p-3 rounded">
                <div>Habitability</div>
                <div className="font-bold text-lg">{((selectedPlanet.habitability_score || 0) * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="mb-4 text-left">
              <strong className="text-cyan-400">Key Factors:</strong>
              <ul className="text-sm mt-2 space-y-1">
                {getColonyFactors(selectedPlanet).map((factor, idx) => (
                  <li key={idx}>• {factor}</li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => selectNewCandidates(balancedPlanets)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              Next Mission
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full">
          <Trophy className="h-5 w-5 text-white" />
          <span className="font-bold text-white">Colony Score: {score}</span>
        </div>
        <Button
          onClick={() => {
            setScore(0)
            selectNewCandidates(balancedPlanets)
          }}
          variant="outline"
          className="border-pink-500/30 hover:border-pink-500"
        >
          New Mission
        </Button>
      </div>
    </div>
  )
}

// 3. Planet Guessing Game (keeping your existing implementation)
function PlanetGuessingGame() {
  const [planets, setPlanets] = useState<KeplerPlanet[]>([])
  const [currentPlanet, setCurrentPlanet] = useState<KeplerPlanet | null>(null)
  const [choices, setChoices] = useState<KeplerPlanet[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadKeplerData().then((data) => {
      const filteredPlanets = data.filter(
        (p) => p.kepler_name && p.koi_teq !== null && p.koi_prad !== null && p.distance_ly !== null,
      )
      setPlanets(filteredPlanets)
      setLoading(false)
      selectNewQuestion(filteredPlanets)
    })
  }, [])

  const selectNewQuestion = (planetList: KeplerPlanet[]) => {
    const shuffled = [...planetList].sort(() => 0.5 - Math.random())
    const questionPlanet = shuffled[0]
    const wrongChoices = shuffled.slice(1, 3)

    const allChoices = [questionPlanet, ...wrongChoices]
    const shuffledChoices = allChoices.sort(() => 0.5 - Math.random())

    setCurrentPlanet(questionPlanet)
    setChoices(shuffledChoices)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  const handleGuess = (index: number) => {
    setSelectedAnswer(index)
    setShowResult(true)
    setTotal(total + 1)

    if (choices[index].kepid === currentPlanet?.kepid) {
      setScore(score + 1)
    }

    if (total + 1 >= 12) {
      setTimeout(() => setGameCompleted(true), 1500)
    }
  }

  const restartGame = () => {
    setScore(0)
    setTotal(0)
    setGameCompleted(false)
    selectNewQuestion(planets)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
        <p className="mt-4 text-foreground/70">Loading planetary data...</p>
      </div>
    )
  }

  if (gameCompleted) {
    const percentage = (score / total) * 100
    return (
      <div className="text-center space-y-6 py-8">
        <h3 className="text-3xl font-bold">Game Complete! 🎯</h3>
        <div className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          {score}/{total} Correct ({percentage.toFixed(0)}%)
        </div>

        {percentage < 50 && (
          <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 p-6 rounded-lg border border-red-500/30">
            <h4 className="text-xl font-bold mb-2">Want to improve? 🌟</h4>
            <p className="mb-4">Explore the planets database to learn more about their characteristics!</p>
            <Button
              onClick={() => (window.location.href = "/regular-user")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Explore Planets Database
            </Button>
          </div>
        )}

        <Button
          onClick={restartGame}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          Play Again
        </Button>
      </div>
    )
  }

  if (!currentPlanet) return null

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Planet Guessing Game 🔍</h3>
        <p className="text-foreground/70">Guess the planet based on its characteristics</p>
        <div className="mt-2 text-sm text-foreground/60">Question {total + 1} of 12</div>
      </div>

      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-6 rounded-lg border border-purple-500/30">
        <h4 className="text-lg font-semibold mb-4">Which planet has these characteristics?</h4>

        <div className="grid gap-3 mb-6">
          <div className="flex justify-between p-3 bg-background/30 rounded">
            <span>Surface Temperature:</span>
            <span className="font-semibold">{Math.round(currentPlanet.koi_teq || 0)} K</span>
          </div>
          <div className="flex justify-between p-3 bg-background/30 rounded">
            <span>Planet Radius:</span>
            <span className="font-semibold">{(currentPlanet.koi_prad || 0).toFixed(2)} Earth radii</span>
          </div>
          <div className="flex justify-between p-3 bg-background/30 rounded">
            <span>Distance from Earth:</span>
            <span className="font-semibold">{Math.round(currentPlanet.distance_ly || 0)} light years</span>
          </div>
          <div className="flex justify-between p-3 bg-background/30 rounded">
            <span>Discovery Year:</span>
            <span className="font-semibold">{currentPlanet.disc_year || "Unknown"}</span>
          </div>
        </div>

        <div className="space-y-3">
          {choices.map((planet, index) => {
            const isCorrect = planet.kepid === currentPlanet.kepid
            const isSelected = index === selectedAnswer
            let buttonClass = "bg-background/50 hover:bg-background/70 border-2 border-purple-500/30"

            if (showResult) {
              if (isCorrect) {
                buttonClass = "bg-green-500/30 border-2 border-green-500"
              } else if (isSelected && !isCorrect) {
                buttonClass = "bg-red-500/30 border-2 border-red-500"
              }
            }

            return (
              <Button
                key={planet.kepid}
                onClick={() => !showResult && handleGuess(index)}
                className={`${buttonClass} w-full h-auto py-3 justify-start text-left`}
                disabled={showResult}
              >
                {planet.kepler_name || planet.kepoi_name}
              </Button>
            )
          })}
        </div>

        {showResult && (
          <div className="mt-4 p-4 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 rounded-lg border border-cyan-500/30">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-cyan-400 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-cyan-400">
                  {selectedAnswer !== null && choices[selectedAnswer].kepid === currentPlanet.kepid
                    ? "Correct! 🎉"
                    : "Not quite! 💫"}
                </h5>
                <p className="text-sm mt-1">
                  This is {currentPlanet.kepler_name}. Habitability score:{" "}
                  {((currentPlanet.habitability_score || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <Button
              onClick={() => selectNewQuestion(planets)}
              className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {total < 11 ? "Next Question" : "See Results"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full">
          <Trophy className="h-5 w-5 text-white" />
          <span className="font-bold text-white">
            Score: {score}/{12}
          </span>
        </div>
        <Button
          onClick={restartGame}
          variant="outline"
          className="border-pink-500/30 hover:border-pink-500 bg-transparent"
        >
          Restart Game
        </Button>
      </div>
    </div>
  )
}

// 4. New Make Your Own Planet Game
interface CustomPlanet {
  id: string
  name: string
  radius: number
  orbitalPeriod: number
  stellarTemp: number
  stellarRadius: number
  stellarType: string
  insolation: number
  atmosphere: string
  habitabilityScore: number
  explanation: string
}

function MakeYourOwnPlanetGame() {
  const [customPlanets, setCustomPlanets] = useState<CustomPlanet[]>([])
  const [currentPlanet, setCurrentPlanet] = useState<Omit<CustomPlanet, "id" | "habitabilityScore" | "explanation">>({
    name: "My New Planet",
    radius: 1.0,
    orbitalPeriod: 365,
    stellarTemp: 5778,
    stellarRadius: 1.0,
    stellarType: "Sun-like (G-type)",
    insolation: 1.0,
    atmosphere: "earth-like",
  })

  const calculateHabitability = (planet: Omit<CustomPlanet, "id" | "habitabilityScore" | "explanation">) => {
    let score = 0
    const factors = []

    // 1. Planet size (Earth-like is best)
    const sizeScore = Math.max(0, 1 - Math.abs(planet.radius - 1) * 0.5)
    score += sizeScore * 0.3
    if (planet.radius >= 0.8 && planet.radius <= 1.2) {
      factors.push("Earth-like size is ideal for gravity and geological activity")
    } else if (planet.radius < 0.8) {
      factors.push("Small size may not retain atmosphere well")
    } else {
      factors.push("Large size creates strong gravity that may be challenging for life")
    }

    // 2. Orbital period (Earth-like is best)
    const periodScore = Math.max(0, 1 - (Math.abs(planet.orbitalPeriod - 365) / 365) * 0.3)
    score += periodScore * 0.2
    if (planet.orbitalPeriod >= 200 && planet.orbitalPeriod <= 500) {
      factors.push("Moderate orbital period provides stable seasonal cycles")
    } else if (planet.orbitalPeriod < 50) {
      factors.push("Very short orbital period may lead to tidal locking")
    } else if (planet.orbitalPeriod > 800) {
      factors.push("Very long orbital period creates extreme seasonal variations")
    }

    // 3. Insolation (Earth-like is best)
    const insolationScore = Math.max(0, 1 - Math.abs(planet.insolation - 1) * 0.5)
    score += insolationScore * 0.3
    if (planet.insolation >= 0.75 && planet.insolation <= 1.5) {
      factors.push("Earth-like stellar energy levels support liquid water")
    } else if (planet.insolation < 0.25) {
      factors.push("Very low stellar energy makes surface extremely cold")
    } else if (planet.insolation > 5) {
      factors.push("Very high stellar energy makes surface extremely hot")
    }

    // 4. Star type (G-type is best)
    let starScore = 0
    if (planet.stellarTemp >= 5000 && planet.stellarTemp <= 6000) {
      starScore = 1
      factors.push("G-type star provides stable, long-lasting energy (10+ billion years)")
    } else if (planet.stellarTemp >= 4000 && planet.stellarTemp < 5000) {
      starScore = 0.7
      factors.push("K-type star is stable but cooler with longer lifespan")
    } else if (planet.stellarTemp >= 3000 && planet.stellarTemp < 4000) {
      starScore = 0.4
      factors.push("M-type red dwarf may have frequent flare activity")
    } else if (planet.stellarTemp > 6000 && planet.stellarTemp <= 7500) {
      starScore = 0.6
      factors.push("F-type star is hot with shorter lifespan (~3 billion years)")
    } else if (planet.stellarTemp > 7500) {
      starScore = 0.3
      factors.push("A/B-type hot star has very short lifespan and intense UV radiation")
    }
    score += starScore * 0.1

    // 5. Atmosphere
    const atmosphereScores = {
      "earth-like": 1,
      "co2-rich": 0.6,
      "h2-rich": 0.3,
      none: 0,
    }
    const atmosphereScore = atmosphereScores[planet.atmosphere as keyof typeof atmosphereScores] || 0
    score += atmosphereScore * 0.1

    if (planet.atmosphere === "earth-like") {
      factors.push("Earth-like atmosphere (N2/O2) supports complex life")
    } else if (planet.atmosphere === "co2-rich") {
      factors.push("CO2-rich atmosphere could support some microbial life")
    } else if (planet.atmosphere === "h2-rich") {
      factors.push("Hydrogen-rich atmosphere is not breathable for humans")
    } else {
      factors.push("No atmosphere makes surface conditions extreme")
    }

    return {
      score: Math.min(1, Math.max(0, score)),
      factors,
    }
  }

  const updateStellarType = (temp: number) => {
    if (temp > 7500) return "Hot Star (A/B-type)"
    if (temp > 6000) return "F-type Star"
    if (temp >= 5000 && temp <= 6000) return "Sun-like (G-type)"
    if (temp >= 4000 && temp < 5000) return "Orange Dwarf (K-type)"
    return "Red Dwarf (M-type)"
  }

  const calculateInsolation = (period: number, stellarRadius: number, stellarTemp: number) => {
    // Simplified insolation calculation based on orbital period and stellar properties
    const luminosity = stellarRadius ** 2 * (stellarTemp / 5778) ** 4
    const semiMajorAxis = Math.cbrt(period ** 2 * luminosity)
    return luminosity / semiMajorAxis ** 2
  }

  const handleCreatePlanet = () => {
    const result = calculateHabitability(currentPlanet)
    const newPlanet: CustomPlanet = {
      ...currentPlanet,
      id: Date.now().toString(),
      habitabilityScore: result.score,
      explanation: result.factors.join(". ") + ".",
    }

    setCustomPlanets((prev) => [newPlanet, ...prev])
  }

  const handleInputChange = (field: string, value: any) => {
    setCurrentPlanet((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "stellarTemp") {
        updated.stellarType = updateStellarType(value)
        // Recalculate insolation when stellar properties change
        updated.insolation = calculateInsolation(updated.orbitalPeriod, updated.stellarRadius, value)
      } else if (field === "stellarRadius") {
        updated.insolation = calculateInsolation(updated.orbitalPeriod, value, updated.stellarTemp)
      } else if (field === "orbitalPeriod") {
        updated.insolation = calculateInsolation(value, updated.stellarRadius, updated.stellarTemp)
      }
      return updated
    })
  }

  const result = calculateHabitability(currentPlanet)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Create Your Own Planet 🪐</h3>
        <p className="text-foreground/70">Design a planet and see how habitable it would be</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Creation Form */}
        <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Planet Designer
            </CardTitle>
            <CardDescription>Adjust the parameters to create your ideal planet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Planet Name</label>
              <Input
                value={currentPlanet.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Name your planet"
                className="bg-background/50 border-purple-500/30"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Planet Radius: {currentPlanet.radius.toFixed(2)} Earth radii
                <span className="text-xs text-foreground/60 ml-2">
                  {currentPlanet.radius < 0.8
                    ? "Sub-Earth"
                    : currentPlanet.radius <= 1.2
                      ? "Earth-like"
                      : currentPlanet.radius <= 2.0
                        ? "Super-Earth"
                        : currentPlanet.radius <= 6.0
                          ? "Mini-Neptune"
                          : "Gas Giant"}
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={currentPlanet.radius}
                onChange={(e) => handleInputChange("radius", Number.parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Orbital Period: {currentPlanet.orbitalPeriod} Earth days
                <span className="text-xs text-foreground/60 ml-2">
                  {currentPlanet.orbitalPeriod < 10
                    ? "Very Short"
                    : currentPlanet.orbitalPeriod < 50
                      ? "Short"
                      : currentPlanet.orbitalPeriod <= 400
                        ? "Moderate"
                        : currentPlanet.orbitalPeriod <= 800
                          ? "Long"
                          : "Very Long"}
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="2000"
                step="1"
                value={currentPlanet.orbitalPeriod}
                onChange={(e) => handleInputChange("orbitalPeriod", Number.parseInt(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Stellar Temperature: {currentPlanet.stellarTemp} K
                <span className="text-xs text-foreground/60 ml-2">{currentPlanet.stellarType}</span>
              </label>
              <input
                type="range"
                min="2500"
                max="10000"
                step="100"
                value={currentPlanet.stellarTemp}
                onChange={(e) => handleInputChange("stellarTemp", Number.parseInt(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Stellar Radius: {currentPlanet.stellarRadius.toFixed(2)} Solar radii
                <span className="text-xs text-foreground/60 ml-2">
                  {currentPlanet.stellarRadius < 0.5
                    ? "Dwarf"
                    : currentPlanet.stellarRadius <= 1.2
                      ? "Sun-like"
                      : currentPlanet.stellarRadius <= 5.0
                        ? "Giant"
                        : "Supergiant"}
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={currentPlanet.stellarRadius}
                onChange={(e) => handleInputChange("stellarRadius", Number.parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Stellar Insolation: {currentPlanet.insolation.toFixed(2)} Earth flux
                <span className="text-xs text-foreground/60 ml-2">
                  {currentPlanet.insolation < 0.25
                    ? "Very Low"
                    : currentPlanet.insolation < 0.75
                      ? "Low"
                      : currentPlanet.insolation <= 1.5
                        ? "Earth-like"
                        : currentPlanet.insolation < 5
                          ? "High"
                          : "Very High"}
                </span>
              </label>
              <div className="text-xs text-foreground/60 mt-1">
                (Calculated from orbital period and stellar properties)
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Atmosphere Type</label>
              <Select
                value={currentPlanet.atmosphere}
                onValueChange={(value) => handleInputChange("atmosphere", value)}
              >
                <SelectTrigger className="bg-background/50 border-purple-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earth-like">Earth-like (N2/O2) - Best for complex life</SelectItem>
                  <SelectItem value="co2-rich">CO2-rich - Could support microbial life</SelectItem>
                  <SelectItem value="h2-rich">Hydrogen-rich - Not breathable</SelectItem>
                  <SelectItem value="none">No Atmosphere - Extreme conditions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreatePlanet}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create Planet
            </Button>
          </CardContent>
        </Card>

        {/* Preview & Created Planets */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-cyan-400" />
                Planet Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Habitability Score:</span>
                  <div
                    className={`text-2xl font-bold ${
                      result.score > 0.7 ? "text-green-400" : result.score > 0.4 ? "text-yellow-400" : "text-red-400"
                    }`}
                  >
                    {(result.score * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      result.score > 0.7 ? "bg-green-500" : result.score > 0.4 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${result.score * 100}%` }}
                  ></div>
                </div>

                <div className="text-sm space-y-2 mt-4">
                  <div className="font-semibold text-cyan-400">Key Factors:</div>
                  {result.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-foreground/80">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {customPlanets.length > 0 && (
            <Card className="border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5 text-purple-400" />
                  Your Created Planets ({customPlanets.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {customPlanets.map((planet) => (
                  <div
                    key={planet.id}
                    className="p-3 bg-background/30 rounded border border-purple-500/20 hover:border-purple-500/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{planet.name}</h4>
                        <div className="text-xs text-foreground/60">
                          {planet.stellarType} • {planet.radius.toFixed(2)} R⊕ • {planet.orbitalPeriod} days
                        </div>
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          planet.habitabilityScore > 0.7
                            ? "text-green-400"
                            : planet.habitabilityScore > 0.4
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {(planet.habitabilityScore * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-xs text-foreground/70">{planet.explanation}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Games Page Component
export default function GamesPage() {
  const [currentQuiz, setCurrentQuiz] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([])
  const [activeGame, setActiveGame] = useState<"quiz" | "habitable" | "colony" | "guessing" | "create">("quiz")

  useEffect(() => {
    selectRandomQuestions()
  }, [])

  const selectRandomQuestions = () => {
    const shuffled = [...allQuizQuestions].sort(() => 0.5 - Math.random())
    setQuizzes(shuffled.slice(0, 4))
    setCurrentQuiz(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setScore(0)
  }

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return
    setSelectedAnswer(index)
    setShowExplanation(true)
    if (index === quizzes[currentQuiz].correctAnswer) {
      setScore(score + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuiz < quizzes.length - 1) {
      setCurrentQuiz(currentQuiz + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      const finalScore = selectedAnswer === quizzes[currentQuiz].correctAnswer ? score + 1 : score
      setTimeout(() => {
        if (
          confirm(
            `Quiz completed! Your score: ${finalScore}/${quizzes.length}\n\nWould you like to try again with new questions?`,
          )
        ) {
          selectRandomQuestions()
        }
      }, 100)
    }
  }

  if (quizzes.length === 0 && activeGame === "quiz") {
    return (
      <div className="min-h-screen p-6 lg:p-12 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-pink-400 animate-pulse mx-auto mb-4" />
          <p className="text-foreground/70">Loading quiz questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Exoplanet Games
          </h1>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
            Learn about exoplanets through interactive quizzes and fun challenges
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <PlanetaryFeaturesGlossary />
            <StellarFeaturesGuide />
          </div>
        </div>

        {/* Game Navigation */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => setActiveGame("quiz")}
            variant={activeGame === "quiz" ? "default" : "outline"}
            className={`flex items-center gap-2 ${activeGame === "quiz" ? "bg-pink-500 hover:bg-pink-600" : ""}`}
          >
            <Brain className="h-4 w-4" />
            Interactive Quiz
          </Button>
          <Button
            onClick={() => setActiveGame("habitable")}
            variant={activeGame === "habitable" ? "default" : "outline"}
            className={`flex items-center gap-2 ${activeGame === "habitable" ? "bg-green-500 hover:bg-green-600" : ""}`}
          >
            <Home className="h-4 w-4" />
            Habitable or Not?
          </Button>
          <Button
            onClick={() => setActiveGame("colony")}
            variant={activeGame === "colony" ? "default" : "outline"}
            className={`flex items-center gap-2 ${activeGame === "colony" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
          >
            <Users className="h-4 w-4" />
            Build Your Colony
          </Button>
          <Button
            onClick={() => setActiveGame("guessing")}
            variant={activeGame === "guessing" ? "default" : "outline"}
            className={`flex items-center gap-2 ${activeGame === "guessing" ? "bg-purple-500 hover:bg-purple-600" : ""}`}
          >
            <Search className="h-4 w-4" />
            Planet Guessing
          </Button>
          <Button
            onClick={() => setActiveGame("create")}
            variant={activeGame === "create" ? "default" : "outline"}
            className={`flex items-center gap-2 ${activeGame === "create" ? "bg-indigo-500 hover:bg-indigo-600" : ""}`}
          >
            <Sparkles className="h-4 w-4" />
            Create Your Planet
          </Button>
        </div>

        {/* Active Game Content */}
        <Card className="bg-card/60 backdrop-blur-md border-2 border-pink-500/30 shadow-lg shadow-pink-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {activeGame === "quiz" && <Brain className="h-6 w-6 text-pink-400" />}
                  {activeGame === "habitable" && <Home className="h-6 w-6 text-green-400" />}
                  {activeGame === "colony" && <Users className="h-6 w-6 text-blue-400" />}
                  {activeGame === "guessing" && <Search className="h-6 w-6 text-purple-400" />}
                  {activeGame === "create" && <Sparkles className="h-6 w-6 text-indigo-400" />}
                  {activeGame === "quiz" && "Interactive Quiz"}
                  {activeGame === "habitable" && "Habitable or Not?"}
                  {activeGame === "colony" && "Build Your Colony"}
                  {activeGame === "guessing" && "Planet Guessing Game"}
                  {activeGame === "create" && "Create Your Planet"}
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  {activeGame === "quiz" && `Question ${currentQuiz + 1} of ${quizzes.length}`}
                  {activeGame === "habitable" && "Guess if planets could support life"}
                  {activeGame === "colony" && "Choose the best planet for colonization"}
                  {activeGame === "guessing" && "Identify planets from their characteristics"}
                  {activeGame === "create" && "Design your own planet and test its habitability"}
                </CardDescription>
              </div>
              {activeGame === "quiz" && (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={selectRandomQuestions}
                    variant="outline"
                    size="sm"
                    className="border-pink-500/30 hover:border-pink-500 bg-transparent"
                  >
                    New Quiz
                  </Button>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full">
                    <Trophy className="h-5 w-5 text-white" />
                    <span className="font-bold text-white">Score: {score}</span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeGame === "quiz" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-6 rounded-lg border border-purple-500/30">
                  <h3 className="text-xl font-semibold text-foreground mb-4">{quizzes[currentQuiz].question}</h3>
                  <div className="grid gap-3">
                    {quizzes[currentQuiz].options.map((option, index) => {
                      const isCorrect = index === quizzes[currentQuiz].correctAnswer
                      const isSelected = index === selectedAnswer
                      let buttonClass = "bg-background/50 hover:bg-background/70 border-2 border-purple-500/30"

                      if (showExplanation) {
                        if (isCorrect) {
                          buttonClass = "bg-green-500/30 border-2 border-green-500"
                        } else if (isSelected && !isCorrect) {
                          buttonClass = "bg-red-500/30 border-2 border-red-500"
                        }
                      }

                      return (
                        <Button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`${buttonClass} h-auto py-4 px-6 text-left justify-start transition-all`}
                          disabled={showExplanation}
                        >
                          <span className="text-base">{option}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {showExplanation && (
                  <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 p-6 rounded-lg border border-cyan-500/30 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-cyan-400 mb-2">Explanation</h4>
                        <p className="text-foreground/80">{quizzes[currentQuiz].explanation}</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleNextQuestion}
                      className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                    >
                      {currentQuiz < quizzes.length - 1 ? "Next Question" : "Finish Quiz"}
                      <Rocket className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeGame === "habitable" && <HabitableOrNotGame />}
            {activeGame === "colony" && <BuildYourColonyGame />}
            {activeGame === "guessing" && <PlanetGuessingGame />}
            {activeGame === "create" && <MakeYourOwnPlanetGame />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
