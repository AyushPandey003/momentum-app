import type React from "react"
import type { Metadata } from "next"
import { Manrope, Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin"
import { extractRouterConfig } from "uploadthing/server"
import { ourFileRouter } from "@/app/api/uploadthing/core"
import "./globals.css"

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body-family",
})

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display-family",
})

export const metadata: Metadata = {
  title: "Momentum - AI Time Management Coach",
  description: "Your AI-powered anti-procrastination coach that helps you build unstoppable momentum",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={null}>{children}</Suspense>
          </main>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
