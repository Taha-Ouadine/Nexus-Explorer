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
import { Info, BookOpen, Sun, Flame, Snowflake, Zap, Sparkles, Gauge } from "lucide-react"

interface StellarFeature {
  name: string
  key: string
  icon: React.ReactNode
  description: string
  unit: string
  interpretation: string
  category: "type" | "property"
}

const stellarFeatures: StellarFeature[] = [
  // Star Types
  {
    name: "Main Sequence Stars",
    key: "main-sequence",
    icon: <Sun className="h-5 w-5 text-yellow-400" />,
    description:
      "Stars in the prime of their life, fusing hydrogen into helium in their cores. These are stable, long-lived stars.",
    unit: "Temperature: 3,000-10,000K, Surface Gravity: ≥4.0 log(g)",
    interpretation:
      "Main sequence stars are the most common and stable. Our Sun is a main sequence star. They have high surface gravity (compact) and moderate to high temperatures. Most exoplanets orbit main sequence stars because they're stable for billions of years.",
    category: "type",
  },
  {
    name: "Red Giant Stars",
    key: "red-giant",
    icon: <Flame className="h-5 w-5 text-red-400" />,
    description:
      "Evolved stars that have exhausted hydrogen in their cores and expanded dramatically. They have low surface gravity.",
    unit: "Surface Gravity: <3.5 log(g)",
    interpretation:
      "Red giants are old, bloated stars near the end of their lives. They've expanded to many times their original size, making them less dense (low surface gravity). Planets around red giants may have been engulfed as the star expanded, or experienced dramatic climate changes.",
    category: "type",
  },
  {
    name: "Hot Stars (Blue/White)",
    key: "hot-star",
    icon: <Zap className="h-5 w-5 text-blue-400" />,
    description: "High-temperature stars that emit intense ultraviolet radiation. Often massive and short-lived.",
    unit: "Temperature: >7,000K",
    interpretation:
      "Hot stars burn bright and fast. They emit strong UV radiation that can strip away planetary atmospheres. While spectacular, they're less ideal for life because they're short-lived (millions vs billions of years) and their intense radiation is harsh on planets.",
    category: "type",
  },
  {
    name: "Cool Stars (Red Dwarfs)",
    key: "cool-star",
    icon: <Snowflake className="h-5 w-5 text-orange-400" />,
    description: "Low-temperature stars that are small, dim, and extremely long-lived. The most common type of star.",
    unit: "Temperature: <5,000K",
    interpretation:
      "Cool stars are the most abundant in the galaxy and live for trillions of years. However, their habitable zones are very close to the star, meaning planets may be tidally locked (one side always faces the star). They also produce frequent flares that can harm planetary atmospheres.",
    category: "type",
  },
  {
    name: "Sun-like Stars (G-type)",
    key: "sun-like",
    icon: <Sun className="h-5 w-5 text-yellow-300" />,
    description: "Stars similar to our Sun in temperature and size. Considered ideal for hosting habitable planets.",
    unit: "Temperature: 5,000-6,000K",
    interpretation:
      "Sun-like stars are the 'Goldilocks' of stellar types - not too hot, not too cold, and stable for billions of years. They provide steady energy output and have habitable zones at comfortable distances. Earth-like life is most likely around Sun-like stars because we know it works!",
    category: "type",
  },
  // Stellar Properties
  {
    name: "Stellar Effective Temperature",
    key: "koi_steff",
    icon: <Flame className="h-5 w-5 text-orange-400" />,
    description: "The surface temperature of the star, determining its color and energy output.",
    unit: "Kelvin (K)",
    interpretation:
      "Temperature determines a star's color: <3,500K = red, 3,500-5,000K = orange, 5,000-6,000K = yellow (Sun-like), 6,000-7,500K = white, >7,500K = blue. Hotter stars emit more energy and UV radiation. Our Sun is ~5,778K.",
    category: "property",
  },
  {
    name: "Stellar Radius",
    key: "koi_srad",
    icon: <Sparkles className="h-5 w-5 text-cyan-400" />,
    description: "The physical size of the star measured in solar radii (R☉).",
    unit: "Solar radii (R☉)",
    interpretation:
      "1 R☉ = Sun-sized. Main sequence stars: 0.1-20 R☉. Red giants: 10-100+ R☉. Larger stars have more surface area and emit more total energy. A star's radius affects the location of its habitable zone - larger stars push it farther out.",
    category: "property",
  },
  {
    name: "Stellar Surface Gravity",
    key: "koi_slogg",
    icon: <Gauge className="h-5 w-5 text-purple-400" />,
    description: "The gravitational acceleration at the star's surface, indicating how compact or bloated the star is.",
    unit: "log(g) in cm/s²",
    interpretation:
      "Higher values = more compact/dense stars. Main sequence: 4.0-5.0 log(g). Red giants: <3.5 log(g). Surface gravity tells us the star's evolutionary stage. Low gravity means the star has expanded (evolved), high gravity means it's compact (main sequence or dwarf).",
    category: "property",
  },
  {
    name: "Stellar Luminosity",
    key: "luminosity",
    icon: <Zap className="h-5 w-5 text-yellow-400" />,
    description: "The total energy output of the star compared to the Sun.",
    unit: "Solar luminosities (L☉)",
    interpretation:
      "1 L☉ = Sun's brightness. Luminosity determines how much energy planets receive. More luminous stars have habitable zones farther out. A star 4x more luminous than the Sun would have its habitable zone at 2x the distance (since energy spreads by distance²).",
    category: "property",
  },
]

export function StellarFeaturesGuide() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-card/80 backdrop-blur-md border border-orange-500/30 hover:bg-card/90 hover:border-orange-500/50 transition-all duration-300 group"
        >
          <Info className="h-4 w-4 mr-2 group-hover:animate-pulse" />
          Stellar Features Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-card/95 backdrop-blur-md border-orange-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-orange-400" />
            Stellar Features Guide
          </DialogTitle>
          <DialogDescription>
            Learn about different types of stars and their properties that affect planetary habitability
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Features</TabsTrigger>
            <TabsTrigger value="types">Star Types</TabsTrigger>
            <TabsTrigger value="properties">Stellar Properties</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                {stellarFeatures.map((feature) => (
                  <Card
                    key={feature.key}
                    className="bg-background/50 border-orange-500/20 hover:border-orange-500/40 transition-all"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {feature.icon}
                        {feature.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">{feature.unit}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-foreground/80">{feature.description}</p>
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mt-2">
                        <p className="text-xs font-semibold text-orange-400 mb-1">How to interpret:</p>
                        <p className="text-xs text-foreground/70">{feature.interpretation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="types" className="mt-4">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                {stellarFeatures
                  .filter((f) => f.category === "type")
                  .map((feature) => (
                    <Card
                      key={feature.key}
                      className="bg-background/50 border-yellow-500/20 hover:border-yellow-500/40 transition-all"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {feature.icon}
                          {feature.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">{feature.unit}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-foreground/80">{feature.description}</p>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
                          <p className="text-xs font-semibold text-yellow-400 mb-1">How to interpret:</p>
                          <p className="text-xs text-foreground/70">{feature.interpretation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="properties" className="mt-4">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                {stellarFeatures
                  .filter((f) => f.category === "property")
                  .map((feature) => (
                    <Card
                      key={feature.key}
                      className="bg-background/50 border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {feature.icon}
                          {feature.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">{feature.unit}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-foreground/80">{feature.description}</p>
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mt-2">
                          <p className="text-xs font-semibold text-cyan-400 mb-1">How to interpret:</p>
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
