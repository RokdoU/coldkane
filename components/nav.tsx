import Link from "next/link";
import { BRAND } from "@/lib/config";
import { Phone } from "./icons";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-night-600 bg-night-900/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="display flex items-center gap-2 text-lg tracking-wide cursor-pointer">
          <span className="cut-sm flex h-8 w-8 items-center justify-center bg-ice-400 text-night-900">
            <Phone className="h-4 w-4" />
          </span>
          <span>
            <span className="text-ice-400">COLD</span>
            <span className="text-foreground">KANE</span>
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link
            href="/leaderboard"
            className="cursor-pointer px-3 py-2 text-foreground/70 transition-colors duration-200 hover:text-ice-300"
          >
            Classement
          </Link>
          <Link
            href="/missions"
            className="cursor-pointer px-3 py-2 text-foreground/70 transition-colors duration-200 hover:text-ice-300"
          >
            Missions
          </Link>
          <Link
            href="/entreprises"
            className="cursor-pointer border border-night-500 px-3 py-2 text-foreground/60 transition-colors duration-200 hover:border-ice-500/60 hover:text-foreground"
          >
            Entreprises
          </Link>
          <Link
            href="/leaderboard"
            className="cut-sm display cursor-pointer bg-ice-400 px-4 py-2 text-sm tracking-wider text-night-900 transition-colors duration-200 hover:bg-ice-300"
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
      <p className="display tracking-wider text-foreground/60">{BRAND.name}</p>
      <p className="mt-1">{BRAND.tagline}</p>
    </footer>
  );
}
