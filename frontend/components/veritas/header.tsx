"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Github } from "lucide-react"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/results", label: "Results" },
  { href: "/compare", label: "Compare" },
  { href: "/architecture", label: "Architecture" },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass py-3" : "py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className={`transition-transform duration-500 ${isHovered ? "rotate-180" : ""}`}
            >
              <path
                d="M16 2L6 28H12L16 18L20 28H26L16 2Z"
                fill="url(#gradient)"
                className="drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]"
              />
              <defs>
                <linearGradient id="gradient" x1="16" y1="2" x2="16" y2="28">
                  <stop stopColor="#00F0FF" />
                  <stop offset="1" stopColor="#2AC78A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            Veritas
          </span>
        </Link>

        {/* Navigation - Right Side */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "text-cyan bg-cyan/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://github.com/Jaiminp007/Veritas"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors ml-2"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  )
}
