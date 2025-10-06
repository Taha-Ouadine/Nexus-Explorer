// Regular user sidebar component

"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Telescope, Gamepad2, Menu, X, PersonStandingIcon, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

function RegularUserSidebarContent() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFullscreen = searchParams.get('fullscreen') === 'true'

  const navItems = [
    {
      title: "Home",
      href: "/",
      icon: Home,
      description: "Back to main page",
    },
    {
      title: "Explore",
      href: "/regular-user",
      icon: Telescope,
      description: "Discover exoplanets",
    },
    {
      title: "Games",
      href: "/regular-user/games",
      icon: Gamepad2,
      description: "Interactive learning",
    },
    
  ]

  if (isFullscreen) {
    return null
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-card/80 backdrop-blur-md border border-cyan-500/30"
        size="icon"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-card/80 backdrop-blur-xl border-r border-cyan-500/30 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo/Title */}
          <div className="mb-8 mt-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Nexus Explorers
            </h2>
            <p className="text-sm text-foreground/60 mt-1">Regular User Mode</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50"
                        : "hover:bg-card/60 border border-transparent hover:border-cyan-500/30",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-cyan-400" : "text-foreground/60 group-hover:text-cyan-400",
                      )}
                    />
                    <div className="flex-1">
                      <div
                        className={cn(
                          "font-medium transition-colors",
                          isActive ? "text-foreground" : "text-foreground/80 group-hover:text-foreground",
                        )}
                      >
                        {item.title}
                      </div>
                      <div className="text-xs text-foreground/50">{item.description}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="pt-6 border-t border-border/50">
            <p className="text-xs text-foreground/50 text-center">NASA Space Apps Challenge 2025</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}

export function RegularUserSidebar() {
  return (
    <Suspense fallback={
      <div className="w-64 h-screen bg-card/50 border-r border-border/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
          <p className="mt-2 text-sm text-foreground/70">Loading...</p>
        </div>
      </div>
    }>
      <RegularUserSidebarContent />
    </Suspense>
  )
}
