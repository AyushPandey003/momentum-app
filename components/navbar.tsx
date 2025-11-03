"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MenuIcon, MountainIcon, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export function Navbar() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  
  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <header className="flex h-16 w-full items-center justify-between px-4 md:px-6 bg-white dark:bg-gray-950 shadow-sm">
      <Link href="/" className="flex items-center gap-2" prefetch={false}>
        <MountainIcon className="h-6 w-6" />
        <span className="font-semibold text-lg">Momentum</span>
      </Link>
      <nav className="hidden md:flex items-center gap-6">
        <Link href="/dashboard" className="font-medium text-sm hover:underline" prefetch={false}>
          Dashboard
        </Link>
        <Link href="/dashboard/schedule" className="font-medium text-sm hover:underline" prefetch={false}>
          Schedule
        </Link>
        <Link href="/dashboard/tasks" className="font-medium text-sm hover:underline" prefetch={false}>
          Tasks
        </Link>
        <Link href="/dashboard/leaderboard" className="font-medium text-sm hover:underline" prefetch={false}>
          Leaderboard
        </Link>
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
            <Link
              href="/dashboard"
              className="font-medium text-sm hover:underline"
              prefetch={false}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/schedule"
              className="font-medium text-sm hover:underline"
              prefetch={false}
            >
              Schedule
            </Link>
            <Link href="/dashboard/tasks" className="font-medium text-sm hover:underline" prefetch={false}>
              Tasks
            </Link>
            <Link
              href="/dashboard/leaderboard"
              className="font-medium text-sm hover:underline"
              prefetch={false}
            >
              Leaderboard
            </Link>
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
    </header>
  )
}
