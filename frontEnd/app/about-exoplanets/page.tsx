"use client"
import { OptimizedGalaxyScene, OptimizedParticles } from "@/components/galaxy-scene"
import { ParallaxStars } from "@/components/parallax-stars"
import { AnimatedSection } from "@/components/animated-section"
import { SectionTransition } from "@/components/section-transition"
import { CosmicCursor } from "@/components/cosmic-cursor"
import { useScrollProgress } from "@/components/scroll-animations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Telescope,
  Globe,
  TrendingDown,
  Satellite,
  Lightbulb,
  Laugh,
  Rocket,
  Star,
  Activity,
  Database,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"

export default function AboutExoplanetsPage() {
  const { scrollProgress } = useScrollProgress()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollDown = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
  }

  const missions = [
    {
      name: "Kepler Space Telescope",
      description: "Discovered over 2,600 confirmed exoplanets using the transit method",
      icon: Telescope,
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "TESS",
      description: "Transiting Exoplanet Survey Satellite, surveying the entire sky for nearby exoplanets",
      icon: Satellite,
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "James Webb Space Telescope",
      description: "Analyzing exoplanet atmospheres to search for signs of habitability",
      icon: Star,
      color: "from-orange-500 to-red-500",
    },
  ]

  const funFacts = [
    {
      icon: Laugh,
      fact: "There's a planet called HD 189733b where it rains glass sideways at 5,400 mph!",
    },
    {
      icon: Globe,
      fact: "Some exoplanets are so dark they absorb almost all light, making them darker than coal!",
    },
    {
      icon: Activity,
      fact: "PSR J1719-1438 b is a planet made entirely of diamond, orbiting a pulsar!",
    },
    {
      icon: TrendingDown,
      fact: "On planet WASP-76b, it's so hot that iron vaporizes and rains down as liquid metal!",
    },
  ]

  return (
    <div className="min-h-screen">
      <CosmicCursor />
      <OptimizedGalaxyScene scrollProgress={scrollProgress} />
      <OptimizedParticles count={40} speed={0.25} />
      <ParallaxStars />

      {/* Back Button */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="bg-card/80 backdrop-blur-md border border-border/50 hover:bg-card/90 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Scroll to Top Button */}
      {scrollProgress > 0.2 && (
        <Button
          size="icon"
          className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-card/80 backdrop-blur-md border border-border/50 hover:bg-card/90 transition-all duration-300 animate-in slide-in-from-bottom-2"
          onClick={scrollToTop}
        >
          <ChevronUp className="h-5 w-5 text-primary" />
        </Button>
      )}

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <AnimatedSection animation="scale-up">
              <h1 className="text-5xl md:text-7xl font-bold text-balance">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  What Are Exoplanets?
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mt-6 leading-relaxed">
                Exoplanets are planets that orbit stars outside our solar system. They represent some of the most
                exciting discoveries in modern astronomy, offering glimpses into the diversity of planetary systems
                across the universe.
              </p>
            </AnimatedSection>
          </div>

          {scrollProgress < 0.1 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-in fade-in duration-1000">
              <p className="text-sm text-foreground/60 animate-pulse">Scroll down to explore more exoplanets!</p>
              <Button
                size="icon"
                variant="ghost"
                onClick={scrollDown}
                className="w-12 h-12 rounded-full bg-card/60 backdrop-blur-md border border-primary/30 hover:bg-card/80 hover:border-primary/50 animate-bounce"
              >
                <ChevronDown className="h-6 w-6 text-primary" />
              </Button>
            </div>
          )}
        </section>

        {/* Our Project Section */}
        <SectionTransition gradientFrom="transparent" gradientTo="background/60">
          <section className="min-h-screen flex items-center justify-center px-6 py-20">
            <div className="max-w-5xl mx-auto">
              <AnimatedSection animation="fade-down" className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-bold mb-6">
                  Our{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Project</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Nexus Explorers is developing an AI-powered platform to detect and classify exoplanets using machine
                  learning algorithms trained on transit photometry data from space telescopes.
                </p>
              </AnimatedSection>

              <div className="grid md:grid-cols-2 gap-8">
                <AnimatedSection animation="fade-right" delay={200}>
                  <Card className="bg-card/40 backdrop-blur-sm border-border/50 h-full">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                        <Database className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl">The Challenge</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed text-foreground/80">
                        Traditional exoplanet detection requires extensive manual analysis of light curves. Our AI
                        solution automates this process, making it faster and more accurate while handling vast amounts
                        of astronomical data from missions like Kepler and TESS.
                      </CardDescription>
                    </CardContent>
                  </Card>
                </AnimatedSection>

                <AnimatedSection animation="fade-left" delay={400}>
                  <Card className="bg-card/40 backdrop-blur-sm border-border/50 h-full">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mb-4">
                        <Lightbulb className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl">Our Solution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed text-foreground/80">
                        We use machine learning algorithms trained on Kepler's extensive database to analyze stellar
                        brightness variations and identify the characteristic dips caused by planetary transits. Our
                        model can distinguish true exoplanet signals from false positives with high accuracy.
                      </CardDescription>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </div>
            </div>
          </section>
        </SectionTransition>

        {/* Transit Method Section */}
        <SectionTransition gradientFrom="background/40" gradientTo="background/80">
          <section className="min-h-screen flex items-center justify-center px-6 py-20">
            <div className="max-w-5xl mx-auto">
              <AnimatedSection animation="fade-down" className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-bold mb-6">
                  The{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Transit Method
                  </span>
                </h2>
                <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                  The transit method is the most successful technique for discovering exoplanets, responsible for
                  finding thousands of distant worlds.
                </p>
              </AnimatedSection>

              <AnimatedSection animation="fade-up" delay={200}>
                <Card className="bg-card/40 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingDown className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl text-center">How It Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-primary font-bold">1</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Continuous Monitoring</h4>
                          <p className="text-foreground/70 leading-relaxed">
                            Space telescopes continuously monitor the brightness of thousands of stars simultaneously.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-primary font-bold">2</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Detecting the Dip</h4>
                          <p className="text-foreground/70 leading-relaxed">
                            When a planet passes in front of its star (transits), it blocks a tiny fraction of the
                            star's light, causing a measurable dip in brightness.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-primary font-bold">3</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Pattern Recognition</h4>
                          <p className="text-foreground/70 leading-relaxed">
                            These dips occur periodically as the planet orbits its star. By analyzing the pattern, we
                            can determine the planet's size, orbital period, and distance from its star.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-primary font-bold">4</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">AI Analysis</h4>
                          <p className="text-foreground/70 leading-relaxed">
                            Our machine learning models analyze these light curves to distinguish genuine planetary
                            transits from instrumental noise, stellar activity, and other false positives.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>
          </section>
        </SectionTransition>

        {/* Statistics Section */}
        <SectionTransition gradientFrom="background/70" gradientTo="background/90">
          <section className="min-h-screen flex items-center justify-center px-6 py-20">
            <div className="max-w-5xl mx-auto">
              <AnimatedSection animation="fade-down" className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-bold mb-6">
                  By The{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Numbers</span>
                </h2>
              </AnimatedSection>

              <div className="grid md:grid-cols-3 gap-8">
                <AnimatedSection animation="fade-up" delay={200}>
                  <Card className="bg-card/40 backdrop-blur-sm border-border/50 text-center">
                    <CardHeader>
                      <CardTitle className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        5,500+
                      </CardTitle>
                      <CardDescription className="text-lg mt-4">Confirmed Exoplanets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/70">
                        Discovered across our galaxy as of 2024, with thousands more candidates awaiting confirmation
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedSection>

                <AnimatedSection animation="fade-up" delay={400}>
                  <Card className="bg-card/40 backdrop-blur-sm border-border/50 text-center">
                    <CardHeader>
                      <CardTitle className="text-6xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                        4,000+
                      </CardTitle>
                      <CardDescription className="text-lg mt-4">Planetary Systems</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/70">
                        Star systems hosting one or more confirmed exoplanets, revealing diverse architectures
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedSection>

                <AnimatedSection animation="fade-up" delay={600}>
                  <Card className="bg-card/40 backdrop-blur-sm border-border/50 text-center">
                    <CardHeader>
                      <CardTitle className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        60+
                      </CardTitle>
                      <CardDescription className="text-lg mt-4">Potentially Habitable</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/70">
                        Exoplanets located in the habitable zone where liquid water could exist on the surface
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </div>
            </div>
          </section>
        </SectionTransition>

        {/* Missions Section */}
        <SectionTransition gradientFrom="background/80" gradientTo="background">
          <section className="min-h-screen flex items-center justify-center px-6 py-20">
            <div className="max-w-5xl mx-auto">
              <AnimatedSection animation="fade-down" className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-bold mb-6">
                  Space{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Missions
                  </span>
                </h2>
                <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                  These groundbreaking missions have revolutionized our understanding of exoplanets and continue to
                  expand our cosmic horizons.
                </p>
              </AnimatedSection>

              <div className="space-y-6">
                {missions.map((mission, index) => {
                  const IconComponent = mission.icon
                  return (
                    <AnimatedSection key={mission.name} animation="fade-up" delay={index * 200}>
                      <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 hover:scale-105">
                        <CardHeader>
                          <div className="flex items-center gap-6">
                            <div
                              className={`w-16 h-16 bg-gradient-to-r ${mission.color} rounded-full flex items-center justify-center flex-shrink-0`}
                            >
                              <IconComponent className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-2xl mb-2">{mission.name}</CardTitle>
                              <CardDescription className="text-base">{mission.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </AnimatedSection>
                  )
                })}
              </div>
            </div>
          </section>
        </SectionTransition>

        {/* Fun Facts Section */}
        <section className="min-h-screen flex items-center justify-center px-6 py-20 bg-background">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection animation="fade-down" className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Surprising Facts
                </span>
              </h2>
              <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                The universe of exoplanets is full of bizarre and fascinating worlds that challenge our imagination!
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-6">
              {funFacts.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <AnimatedSection key={index} animation="fade-up" delay={index * 150}>
                    <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-foreground/70 leading-relaxed pt-2">{item.fact}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedSection>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="min-h-screen flex items-center justify-center px-6 py-20 bg-background">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedSection animation="scale-up">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-6xl font-bold text-balance">
                  Ready to{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Explore</span>
                  ?
                </h2>
                <p className="text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
                  Choose your user type and start your personalized journey through the world of exoplanet discovery
                  with AI-powered tools.
                </p>
                <Link href="/user-types">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-primary-foreground px-12 py-6 text-lg rounded-full group"
                  >
                    <Rocket className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                    Start Your Exploration Journey Now
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
    </div>
  )
}
