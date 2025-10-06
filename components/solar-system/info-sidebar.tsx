"use client"

import { useState, useEffect, useRef } from "react"
import { CelestialBody } from "./createCelestial"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Sun, Globe, Star, Settings, Home, Search, Bookmark, BookmarkCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DefaultData } from "./universe-data"

interface InfoSidebarProps {
  isOpen: boolean
  selectedBody: CelestialBody | null
  inputBodies: CelestialBody[]
  onClose: () => void
  onBodySelect: (body: CelestialBody) => void
  simulationSpeed: number
  onSpeedChange: (speed: number) => void
}

type TabType = "home" | "bodies" | "settings"

export default function InfoSidebar({ 
  isOpen, 
  selectedBody,
  inputBodies,
  onClose, 
  onBodySelect,
  simulationSpeed,
  onSpeedChange 
}: InfoSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["home-stats"]))
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const bodyRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const contentRef = useRef<HTMLDivElement>(null)

  const allBodies = inputBodies || DefaultData

  // Auto-switch to bodies tab and scroll to selected body
  useEffect(() => {
    if (selectedBody && isOpen) {
      setActiveTab("bodies")
      
      // Expand the selected body section
      setExpandedSections(prev => new Set([...prev, `body-${selectedBody.name}`]))
      
      // Scroll to the selected body after a short delay to allow rendering
      setTimeout(() => {
        const bodyElement = bodyRefs.current.get(selectedBody.name)
        if (bodyElement && contentRef.current) {
          bodyElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }
      }, 100)
    }
  }, [selectedBody, isOpen])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const toggleBookmark = (bodyName: string, event?: React.MouseEvent) => {
    event?.stopPropagation()
    setBookmarks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bodyName)) {
        newSet.delete(bodyName)
      } else {
        newSet.add(bodyName)
      }
      return newSet
    })
  }

  const isBookmarked = (bodyName: string) => bookmarks.has(bodyName)

  const filteredBodies = allBodies.filter(body =>
    body.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const bookmarkedBodies = allBodies.filter(body => isBookmarked(body.name))

  const getBodyIcon = (body: CelestialBody) => {
    if (body.type === 'star') return Sun
    if (body.type === 'planet') return Globe
    return Star
  }

  const setBodyRef = (bodyName: string, element: HTMLDivElement | null) => {
    if (element) {
      bodyRefs.current.set(bodyName, element)
    } else {
      bodyRefs.current.delete(bodyName)
    }
  }


  function checkDefined(object:any, allowZero:boolean=true) {
    return object!==undefined && object!==null && (allowZero || object!==0)
  }


  return (
    <div className={`
    absolute right-0 top-0 h-full w-80 bg-black/80 backdrop-blur-xl border-l border-cyan-500/30
    shadow-[0_0_30px_rgba(0,255,255,0.3)] z-50 transition-transform duration-300 ease-in-out
    overflow-y-auto pointer-events-auto
    sidebar-container sidebar-backdrop
    ${isOpen ? "translate-x-0" : "translate-x-full"}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/30">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Space Navigator
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
          >
            ✕
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-4 space-x-1">
          {[
            { id: "home" as TabType, label: "Home", icon: Home },
            { id: "bodies" as TabType, label: "Bodies", icon: Globe },
            { id: "settings" as TabType, label: "Settings", icon: Settings }
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-xs ${
                activeTab === tab.id 
                  ? "bg-cyan-600 text-white" 
                  : "text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20"
              }`}
            >
              <tab.icon className="h-3 w-3 mr-1" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="p-4 overflow-y-auto h-[calc(100%-80px)]">
        {/* HOME */}
        {activeTab === "home" && (
          <div className="space-y-4">
            <Collapsible
              open={expandedSections.has("home-stats")}
              onOpenChange={() => toggleSection("home-stats")}
            >
              <CollapsibleTrigger className="flex items-center w-full p-2 text-left text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 rounded-lg">
                {expandedSections.has("home-stats") ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                System Statistics
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                <Card className="bg-black/40 border-cyan-500/20">
                  <CardContent className="p-3 text-sm">
                    <div className="flex justify-between">
                      <span>Total Bodies:</span>
                      <span className="text-cyan-400">{allBodies.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Simulation Speed:</span>
                      <span className="text-cyan-400">{simulationSpeed}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Focus:</span>
                      <span className="text-cyan-400">{selectedBody?.name || "None"}</span>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible
              open={expandedSections.has("quick-jump")}
              onOpenChange={() => toggleSection("quick-jump")}
            >
              <CollapsibleTrigger className="flex items-center w-full p-2 text-left text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 rounded-lg">
                {expandedSections.has("quick-jump") ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                Quick Jump
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    const star = allBodies.find(b => b.type === 'star');
                    // Largest planets
                    const largestPlanets = allBodies
                      .filter(b => b.type === 'planet')
                      .sort((a, b) => (b.radius || 0) - (a.radius || 0))
                    
                    const importantBodies = star ? [star, ...largestPlanets] : largestPlanets;
                    
                    return importantBodies.map((body) => {
                      const IconComponent = getBodyIcon(body);
                      
                      return (
                        <Button
                          key={body.name}
                          variant="outline"
                          size="sm"
                          onClick={() => onBodySelect(body)}
                          className="text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                        >
                          <IconComponent className="h-3 w-3 mr-1" />
                          {body.name}
                        </Button>
                      );
                    });
                  })()}
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Bookmarks Section */}
            <Collapsible
              open={expandedSections.has("bookmarks")}
              onOpenChange={() => toggleSection("bookmarks")}
            >
              <CollapsibleTrigger className="flex items-center w-full p-2 text-left text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 rounded-lg">
                {expandedSections.has("bookmarks") ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmarks ({bookmarkedBodies.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {bookmarkedBodies.length > 0 ? (
                  bookmarkedBodies.map((body) => {
                    const IconComponent = getBodyIcon(body);
                    return (
                      <div
                        key={body.name}
                        className="flex items-center justify-between p-2 bg-black/40 border border-cyan-500/20 rounded-lg"
                      >
                        <div className="flex items-center">
                          <IconComponent className="h-4 w-4 mr-2 text-cyan-400" />
                          <span className="text-cyan-200 text-sm">{body.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onBodySelect(body)}
                            className="h-6 w-6 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30"
                          >
                            <Search className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBookmark(body.name)}
                            className="h-6 w-6 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30"
                          >
                            <BookmarkCheck className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <Card className="bg-black/40 border-cyan-500/20">
                    <CardContent className="p-3 text-sm text-cyan-300">
                      No bookmarks yet. Click the bookmark icon on any body to save it.
                    </CardContent>
                  </Card>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {activeTab === "bodies" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyan-400" />
              <Input
                placeholder="Search bodies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-black/40 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50"
              />
            </div>

            <div className="space-y-2">
              {filteredBodies.map((body) => {
                console.log(`Body: ${body.name}`, {
                  type: body.type,
                  radius: body.radius,
                  distance: body.distance,
                  period: body.period,
                  fullBody: body
                });
                return (
                <div
                  key={body.name}
                  ref={(el) => setBodyRef(body.name, el)}
                  className={`
                    transition-all duration-200
                    ${selectedBody?.name === body.name ? 'ring-2 ring-cyan-400 rounded-lg' : ''}
                  `}
                >
                  <Collapsible
                    open={expandedSections.has(`body-${body.name}`)}
                    onOpenChange={() => toggleSection(`body-${body.name}`)}
                  >
                    <div className="flex items-center w-full p-3 text-left bg-black/40 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition-colors">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center flex-1 text-left">
                          {expandedSections.has(`body-${body.name}`) ? (
                            <ChevronDown className="h-4 w-4 mr-2 text-cyan-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-2 text-cyan-400" />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-cyan-100">{body.name}</div>
                            <div className="text-xs text-cyan-300/70 capitalize">{body.type}</div>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBookmark(body.name)}
                          className="h-6 w-6 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30"
                        >
                          {isBookmarked(body.name) ? (
                            <BookmarkCheck className="h-3 w-3 fill-cyan-400" />
                          ) : (
                            <Bookmark className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onBodySelect(body)}
                          className="h-6 w-6 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30"
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CollapsibleContent className="mt-2 p-3 bg-black/60 border border-cyan-500/10 rounded-lg">
                      <div className="space-y-2 text-sm text-cyan-200">
                        {checkDefined(body.type) && (
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="text-cyan-400 capitalize">{body.type}</span>
                          </div>
                        )}
                        {checkDefined(body.radius) && (
                          <div className="flex justify-between">
                            <span>Radius:</span>
                            <span className="text-cyan-400">{body.radius.toFixed(2)} km</span>
                          </div>
                        )}
                        {checkDefined(body.distance) && (
                          <div className="flex justify-between">
                            <span>Orbital Distance:</span>
                            <span className="text-cyan-400">{body.distance!.toFixed(2)} km</span>
                          </div>
                        )}
                        {checkDefined(body.period) && (
                          <div className="flex justify-between">
                            <span>Orbital Period:</span>
                            <span className="text-cyan-400">{body.period!.toFixed(2)} days</span>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )})}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-300 text-sm">Simulation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-cyan-300">Simulation Speed: {simulationSpeed}x</label>
                  <input
                    type="range"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={simulationSpeed}
                    onChange={(e) => onSpeedChange(Number.parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}