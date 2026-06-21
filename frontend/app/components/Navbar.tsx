"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Identify", icon: WaveformIcon },
    { href: "/batch", label: "Batch", icon: BatchIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-card-strong border-b border-border px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center shadow-lg shadow-accent-glow transition-shadow group-hover:shadow-xl group-hover:shadow-accent-glow">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 2v20M8 6v12M4 10v4M16 6v12M20 10v4" />
              </svg>
            </div>
          </div>
          <span className="text-xl font-bold gradient-text tracking-tight">
            Zapp
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface/50">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 
                  ${
                    isActive
                      ? "bg-accent/15 text-accent shadow-sm"
                      : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }
                `}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function WaveformIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 3v18M8 7v10M4 11v2M16 7v10M20 11v2" />
    </svg>
  );
}

function BatchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
