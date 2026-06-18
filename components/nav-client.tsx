"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "./icons";
import type { SessionProfile } from "@/lib/supabase-server";

const LINKS = [
  { href: "/leaderboard", label: "Classement" },
  { href: "/missions", label: "Missions" },
  { href: "/entreprises", label: "Entreprises" },
];

export function NavClient({
  profile,
  signOutAction,
}: {
  profile: SessionProfile | null;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const dashboardHref =
    profile?.role === "company" ? "/entreprises/dashboard" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-night-600 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="display flex cursor-pointer items-center gap-2.5 text-[17px]"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ice-400/10 text-ice-400">
            <Phone className="h-3.5 w-3.5" />
          </span>
          <span>
            Cold<span className="text-foreground/50">Kane</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1.5 text-sm font-medium md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`cursor-pointer rounded-md px-3 py-2 transition-colors duration-200 ${
                isActive(l.href)
                  ? "bg-night-700 text-foreground"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {profile ? (
            <>
              <Link
                href={dashboardHref}
                className="ml-2 cursor-pointer rounded-md border border-night-500 px-4 py-2 text-sm font-medium transition-colors duration-200 hover:border-ice-500/50"
              >
                Dashboard
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="cursor-pointer rounded-md px-3 py-2 text-foreground/45 transition-colors duration-200 hover:text-foreground"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="ml-2 cursor-pointer rounded-md px-3 py-2 text-foreground/60 transition-colors duration-200 hover:text-foreground"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="cursor-pointer rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
              >
                Rejoindre
              </Link>
            </>
          )}
        </div>

        {/* Burger mobile */}
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer rounded-md p-2 text-foreground/70 transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-400 md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden
          >
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Menu mobile */}
      {open && (
        <div id="mobile-menu" className="border-t border-night-600 bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1 text-sm font-medium">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`cursor-pointer rounded-md px-3 py-3 transition-colors duration-200 hover:bg-night-700 ${
                  isActive(l.href) ? "bg-night-700 text-foreground" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {profile ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-md px-3 py-3 text-foreground transition-colors duration-200 hover:bg-night-700"
                >
                  Dashboard
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full cursor-pointer rounded-md px-3 py-3 text-left text-foreground/45 transition-colors duration-200 hover:bg-night-700"
                  >
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/connexion"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-md px-3 py-3 text-foreground/70 transition-colors duration-200 hover:bg-night-700"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  onClick={() => setOpen(false)}
                  className="mt-1 cursor-pointer rounded-md bg-foreground px-3 py-3 text-center font-semibold text-background transition-opacity duration-200 hover:opacity-85"
                >
                  Rejoindre
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
