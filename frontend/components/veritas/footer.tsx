"use client"

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M16 2L6 28H12L16 18L20 28H26L16 2Z"
                fill="url(#footerGradient)"
              />
              <defs>
                <linearGradient id="footerGradient" x1="16" y1="2" x2="16" y2="28">
                  <stop stopColor="#00F0FF" />
                  <stop offset="1" stopColor="#2AC78A" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-display text-sm font-semibold text-foreground">
              Veritas
            </span>
          </div>

          {/* Info */}
          <div className="text-sm text-muted-foreground text-center sm:text-right">
            <div>
              Built with{" "}
              <span className="text-cyan">precision</span> for{" "}
              <span className="text-emerald">Senso.ai</span>
            </div>
            <div className="text-xs mt-1">
              © 2024 Jaimin Kamal Patel. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
