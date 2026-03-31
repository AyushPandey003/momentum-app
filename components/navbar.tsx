"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MenuIcon, MountainIcon, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { signOut } from "@/lib/auth-utils"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = authClient.useSession()
  
  // Hide navbar in dashboard routes
  if (pathname?.startsWith('/dashboard')) {
    return null
  }
  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/schedule", label: "Schedule" },
    { href: "/dashboard/tasks", label: "Tasks" },
    { href: "/dashboard/leaderboard", label: "Leaderboard" },
  ]
  
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
    <header className="sticky top-0 z-50 w-full px-4 pt-4 md:px-6">
      <div className="surface-glass mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <MountainIcon className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Momentum</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4">
          {session?.user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {session.user.name || session.user.email}
              </span>
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="grid gap-4 p-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  prefetch={false}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-4 pt-4 border-t">
                {session?.user ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Signed in as {session.user.name || session.user.email}
                    </div>
                    <Button variant="outline" onClick={handleSignOut} className="w-full gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
