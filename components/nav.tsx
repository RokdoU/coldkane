import Link from "next/link";
import { BRAND } from "@/lib/config";
import { Phone } from "./icons";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-night-600 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="display flex cursor-pointer items-center gap-2.5 text-[17px]">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ice-400/10 text-ice-400">
            <Phone className="h-3.5 w-3.5" />
          </span>
          <span>
            Cold<span className="text-foreground/50">Kane</span>
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium sm:gap-1.5">
          <Link
            href="/leaderboard"
            className="cursor-pointer rounded-md px-3 py-2 text-foreground/60 transition-colors duration-200 hover:text-foreground"
          >
            Classement
          </Link>
          <Link
            href="/missions"
            className="cursor-pointer rounded-md px-3 py-2 text-foreground/60 transition-colors duration-200 hover:text-foreground"
          >
            Missions
          </Link>
          <Link
            href="/entreprises"
            className="cursor-pointer rounded-md px-3 py-2 text-foreground/60 transition-colors duration-200 hover:text-foreground"
          >
            Entreprises
          </Link>
          <Link
            href="/leaderboard"
            className="ml-2 cursor-pointer rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
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
    <footer className="border-t border-night-600 py-10 text-center text-sm text-foreground/35">
      <p className="display text-foreground/55">{BRAND.name}</p>
      <p className="mt-1">{BRAND.tagline}</p>
    </footer>
  );
}
