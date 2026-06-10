import Link from "next/link";
import { BRAND } from "@/lib/config";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-night-600 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          <span className="text-ice-400">COLD</span>KANE
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link href="/leaderboard" className="rounded-lg px-3 py-2 text-foreground/80 transition hover:bg-night-700 hover:text-foreground">
            Classement
          </Link>
          <Link href="/missions" className="rounded-lg px-3 py-2 text-foreground/80 transition hover:bg-night-700 hover:text-foreground">
            Missions
          </Link>
          <Link
            href="/entreprises"
            className="ml-2 rounded-lg border border-night-600 px-3 py-2 text-foreground/70 transition hover:border-ice-500/50 hover:text-foreground"
          >
            Entreprises
          </Link>
          <Link
            href="/leaderboard"
            className="ml-1 rounded-lg bg-ice-500 px-4 py-2 font-semibold text-night-800 transition hover:bg-ice-400"
          >
            Rejoindre
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-night-600 py-10 text-center text-sm text-foreground/40">
      <p className="font-semibold text-foreground/60">{BRAND.name}</p>
      <p className="mt-1">{BRAND.tagline}</p>
    </footer>
  );
}
