"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Calendar, ListTodo, Trophy, Settings, LogOut, Menu, X, Sparkles, Timer, Brain, Swords, Users, BookOpen, ChevronLeft, ChevronRight, Network } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { signOut } from "@/lib/auth-utils"

interface DashboardNavProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

const navigation = [
  { section: "Core", items: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Schedule", href: "/dashboard/schedule", icon: Timer },
    { name: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  ]},
  { section: "Learning", items: [
    { name: "Practice", href: "/dashboard/practice", icon: BookOpen },
    { name: "System Design", href: "/dashboard/system-design", icon: Network },
    { name: "AI Mentor", href: "/dashboard/mentor", icon: Brain },
    { name: "Manager", href: "/dashboard/manager", icon: Users },
  ]},
  { section: "Compete", items: [
    { name: "Challenge", href: "/dashboard/challenge", icon: Sparkles },
    { name: "Contests", href: "/dashboard/contests", icon: Swords },
    { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  ]},
]

const bottomNav = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardNav({ isCollapsed = false, onToggle }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Use better-auth session hook for real-time auth state
  const { data: session } = authClient.useSession()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      // Still redirect even if signout had issues
      router.push("/login")
    }
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 surface-glass border-r border-border/50 transform transition-all duration-300 ease-in-out lg:translate-x-0",
          isCollapsed ? "w-20 lg:w-20" : "w-64 lg:w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with logo and collapse button */}
          <div className="flex items-center justify-between px-3 lg:px-6 py-6 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-5 h-5 text-background" />
              </div>
              {!isCollapsed && (
                <span className="text-lg font-black bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent truncate">
                  Momentum
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="hidden lg:flex h-8 w-8 flex-shrink-0 hover:bg-accent/50 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* User info */}
          {!isCollapsed && (
            <div className="px-6 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-amber-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0 shadow-md">
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.email || ""}
                  </p>
                </div>
              </div>
            </div>
          )}
          {isCollapsed && <div className="h-1 border-b border-border/40" />}

          {/* Navigation */}
          <nav className="flex-1 px-2 lg:px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin">
            {navigation.map((section) => (
              <div key={section.section}>
                {!isCollapsed && (
                  <h3 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">
                    {section.section}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 justify-center lg:justify-start relative group",
                          isActive
                            ? "text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground"
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <>
                            <div className="absolute inset-0 rounded-lg btn-gradient opacity-100 -z-10" />
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
                          </>
                        )}
                        
                        {/* Hover effect */}
                        {!isActive && (
                          <div className="absolute inset-0 rounded-lg bg-accent/0 group-hover:bg-accent/50 transition-colors duration-200 -z-10" />
                        )}
                        
                        <item.icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                        {!isCollapsed && (
                          <span className="transition-all duration-200">{item.name}</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Navigation & Sign Out */}
          <div className="space-y-2 p-2 lg:p-3 border-t border-border/40">
            {/* Settings */}
            {bottomNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 justify-center lg:justify-start relative group",
                    isActive
                      ? "text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg btn-gradient opacity-100 -z-10" />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-lg bg-accent/0 group-hover:bg-accent/50 transition-colors duration-200 -z-10" />
                  )}
                  <item.icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
            
            {/* Sign Out */}
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-3 transition-all duration-200 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg",
                isCollapsed ? "justify-center px-0" : "justify-start",
              )}
              onClick={handleSignOut}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
