"use client"

import { useEffect, useState } from "react"
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ThemeToggleProps {
  className?: string
}

type ColorPalette = "default" | "ocean" | "forest" | "sunset" | "mono"

const COLOR_PALETTE_STORAGE_KEY = "momentum-color-palette"

const PALETTE_OPTIONS: {
  key: ColorPalette
  label: string
  swatch: string
}[] = [
  { key: "default", label: "Momentum", swatch: "bg-gradient-to-r from-cyan-500 via-amber-300 to-sky-400" },
  { key: "ocean", label: "Ocean", swatch: "bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-400" },
  { key: "forest", label: "Forest", swatch: "bg-gradient-to-r from-emerald-600 via-lime-400 to-green-500" },
  { key: "sunset", label: "Sunset", swatch: "bg-gradient-to-r from-orange-500 via-rose-400 to-fuchsia-500" },
  { key: "mono", label: "Mono", swatch: "bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-400" },
]

function applyColorPalette(palette: ColorPalette) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  if (palette === "default") {
    root.removeAttribute("data-color-palette")
    return
  }
  root.setAttribute("data-color-palette", palette)
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [colorPalette, setColorPalette] = useState<ColorPalette>("default")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPalette = window.localStorage.getItem(COLOR_PALETTE_STORAGE_KEY) as ColorPalette | null
      if (savedPalette && PALETTE_OPTIONS.some((palette) => palette.key === savedPalette)) {
        setColorPalette(savedPalette)
        applyColorPalette(savedPalette)
      } else {
        applyColorPalette("default")
      }
    }
    setMounted(true)
  }, [])

  const handlePaletteChange = (palette: ColorPalette) => {
    setColorPalette(palette)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COLOR_PALETTE_STORAGE_KEY, palette)
    }
    applyColorPalette(palette)
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className={className} aria-label="Theme palette" disabled>
        <Palette className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"
  const activeTheme = theme ?? "system"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={className}
          aria-label="Open theme palette"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme palette</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {activeTheme === "light" ? <Check className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {activeTheme === "dark" ? <Check className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {activeTheme === "system" ? <Check className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Accent Colors</DropdownMenuLabel>
        {PALETTE_OPTIONS.map((palette) => (
          <DropdownMenuItem key={palette.key} onClick={() => handlePaletteChange(palette.key)}>
            <span className={`h-3 w-3 rounded-full border border-border ${palette.swatch}`} />
            <span>{palette.label}</span>
            {colorPalette === palette.key ? <Check className="ml-auto h-4 w-4" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="text-muted-foreground px-2 py-1 text-xs">
          Active: {isDark ? "Dark" : "Light"} · {PALETTE_OPTIONS.find((p) => p.key === colorPalette)?.label}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
