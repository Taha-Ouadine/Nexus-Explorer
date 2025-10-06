"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Keyboard, X } from "lucide-react"

interface KeyboardHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardHelp({ isOpen, onClose }: KeyboardHelpProps) {
  if (!isOpen) return null

  const shortcuts = [
    {
      category: "Movement",
      items: [
        { keys: ["W", "↑"], description: "Move forward" },
        { keys: ["S", "↓"], description: "Move backward" },
        { keys: ["A", "←"], description: "Move left" },
        { keys: ["D", "→"], description: "Move right" },
        { keys: ["Space"], description: "Move up" },
        { keys: ["Shift"], description: "Move down" },
        { keys: ["Ctrl"], description: "Fast movement" },
      ]
    },
    {
      category: "Camera",
      items: [
        { keys: ["Left Click + Drag"], description: "Rotate camera" },
        { keys: ["Right Click"], description: "Select celestial body" },
      ]
    },
    {
      category: "Navigation",
      items: [
        { keys: ["Tab"], description: "Toggle sidebar" },
        { keys: ["Backspace"], description: "UNFOCUS celestial body" },
        { keys: ["Esc"], description: "Minimize window" },
        { keys: ["T"], description: "Teleport to nearest" }
      ]
    },
    {
      category: "Simulation",
      items: [
        { keys: ["Pause/Play"], description: "Toggle simulation" },
        { keys: ["Speed Slider"], description: "Adjust simulation speed" },
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-200 flex items-center justify-center p-4">
      <Card className="bg-black/90 backdrop-blur-xl border-cyan-500/30 shadow-[0_0_50px_rgba(0,255,255,0.5)] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-cyan-500/20">
          <CardTitle className="flex items-center gap-2 text-cyan-300">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
            <p className="text-cyan-300 text-sm text-center">
              💡 <strong>Tip:</strong> When you focus a celestial body (Right Click), Keyboard controls are disabled, but you can (Left Click + Drag) to move the camera, and scroll to Zoom. Press BACKSPACE to unfocus the body.</p>
          </div>
          
          <div className="mt-5 grid md:grid-cols-2 gap-6">
            {shortcuts.map((category) => (
              <div key={category.category} className="space-y-3">
                <h3 className="text-lg font-semibold text-cyan-400 border-b border-cyan-500/30 pb-2">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="px-2 py-1 bg-cyan-900/50 border border-cyan-500/30 rounded text-cyan-300 text-xs font-mono"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                      <span className="text-cyan-200 ml-4">{shortcut.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
        </CardContent>
      </Card>
    </div>
  )
}