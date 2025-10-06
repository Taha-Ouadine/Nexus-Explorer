"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info, BookOpen, Sparkles, Thermometer, Ruler, Clock, Sun, Target, Earth } from "lucide-react"

interface Feature {
  name: string
  key: string
  icon: React.ReactNode
  description: string
  unit: string
  interpretation: string
}

const planetaryFeatures: Feature[] = [
  {
    name: "Habitability Score",
    key: "habitability_score",
    icon: <Earth className="h-5 w-5 text-green-400" />,
    description: "A composite score indicating the potential for a planet to support life as we know it.",
    unit: "0-1 scale",
    interpretation:
      "Scores > 0.6 indicate high habitability potential. Considers temperature, size, and stellar conditions.",
  },
  {
    name: "Earth Likeness Score",
    key: "earth_likeness_score",
    icon: <Target className="h-5 w-5 text-blue-400" />,
    description:
      "Measures how similar a planet is to Earth in terms of size, temperature, and orbital characteristics.",
    unit: "0-1 scale",
    interpretation: "Higher scores indicate planets more similar to Earth. Scores > 0.7 are considered Earth-like.",
  },
  {
    name: "Proximity Score",
    key: "proximity_score",
    icon: <Ruler className="h-5 w-5 text-purple-400" />,
    description: "Indicates how close the planet is to Earth, affecting our ability to study it.",
    unit: "0-1 scale",
    interpretation: "Higher scores mean closer planets. Closer planets are easier to observe and study in detail.",
  },
  {
    name: "Planet Radius (koi_prad)",
    key: "koi_prad",
    icon: <Sparkles className="h-5 w-5 text-cyan-400" />,
    description: "The radius of the planet measured in Earth radii (R⊕).",
    unit: "Earth radii (R⊕)",
    interpretation: "1 R⊕ = Earth-sized. 0.5-1.5 R⊕ are rocky planets. 2-4 R⊕ are super-Earths. >4 R⊕ are gas giants.",
  },
  {
    name: "Equilibrium Temperature (koi_teq)",
    key: "koi_teq",
    icon: <Thermometer className="h-5 w-5 text-orange-400" />,
    description: "The estimated temperature of the planet assuming no atmosphere.",
    unit: "Kelvin (K)",
    interpretation: "Earth's temp is ~255K. Habitable zone: 200-350K. Water can exist as liquid in this range.",
  },
  {
    name: "Orbital Period (koi_period)",
    key: "koi_period",
    icon: <Clock className="h-5 w-5 text-pink-400" />,
    description: "The time it takes for the planet to complete one orbit around its star.",
    unit: "Earth days",
    interpretation: "Earth's period is 365 days. Shorter periods mean closer orbits and typically hotter planets.",
  },
  {
    name: "Stellar Insolation (koi_insol)",
    key: "koi_insol",
    icon: <Sun className="h-5 w-5 text-yellow-400" />,
    description: "The amount of stellar energy received by the planet compared to Earth.",
    unit: "Earth flux units",
    interpretation: "1 = Earth's insolation. 0.25-4 is potentially habitable. Higher values mean more stellar energy.",
  },
  {
    name: "Distance",
    key: "distance_ly",
    icon: <Ruler className="h-5 w-5 text-indigo-400" />,
    description: "The distance from Earth to the exoplanet system.",
    unit: "Light years (ly)",
    interpretation: "1 ly = 9.46 trillion km. Closer planets are easier to study. Nearest is ~4 ly (Proxima Centauri).",
  },
]

export function PlanetaryFeaturesGlossary() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-card/80 backdrop-blur-md border border-primary/30 hover:bg-card/90 hover:border-primary/50 transition-all duration-300 group"
        >
          <Info className="h-4 w-4 mr-2 group-hover:animate-pulse" />
          Planetary Features Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-card/95 backdrop-blur-md border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Planetary Features Glossary
          </DialogTitle>
          <DialogDescription>
            Learn about the key characteristics used to identify and classify exoplanets
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Features</TabsTrigger>
            <TabsTrigger value="habitability">Habitability</TabsTrigger>
            <TabsTrigger value="physical">Physical Properties</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                {planetaryFeatures.map((feature) => (
                  <Card
                    key={feature.key}
                    className="bg-background/50 border-primary/20 hover:border-primary/40 transition-all"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {feature.icon}
                        {feature.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">Unit: {feature.unit}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-foreground/80">{feature.description}</p>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-2">
                        <p className="text-xs font-semibold text-primary mb-1">How to interpret:</p>
                        <p className="text-xs text-foreground/70">{feature.interpretation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="habitability" className="mt-4">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                {planetaryFeatures
                  .filter((f) => ["habitability_score", "earth_likeness_score", "koi_teq", "koi_insol"].includes(f.key))
                  .map((feature) => (
                    <Card
                      key={feature.key}
                      className="bg-background/50 border-green-500/20 hover:border-green-500/40 transition-all"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {feature.icon}
                          {feature.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Unit: {feature.unit}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-foreground/80">{feature.description}</p>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-2">
                          <p className="text-xs font-semibold text-green-400 mb-1">How to interpret:</p>
                          <p className="text-xs text-foreground/70">{feature.interpretation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="physical" className="mt-4">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                {planetaryFeatures
                  .filter((f) => ["koi_prad", "koi_period", "distance_ly", "proximity_score"].includes(f.key))
                  .map((feature) => (
                    <Card
                      key={feature.key}
                      className="bg-background/50 border-blue-500/20 hover:border-blue-500/40 transition-all"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {feature.icon}
                          {feature.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Unit: {feature.unit}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-foreground/80">{feature.description}</p>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
                          <p className="text-xs font-semibold text-blue-400 mb-1">How to interpret:</p>
                          <p className="text-xs text-foreground/70">{feature.interpretation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
