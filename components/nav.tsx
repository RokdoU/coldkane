import { BRAND } from "@/lib/config";
import { getSessionProfile } from "@/lib/supabase-server";
import { signOut } from "@/lib/actions/auth";
import { NavClient } from "./nav-client";

export async function Nav() {
  const profile = await getSessionProfile();
  return <NavClient profile={profile} signOutAction={signOut} />;
}

export function Footer() {
  return (
    <footer className="border-t border-night-600 py-10 text-center text-sm text-foreground/35">
      <p className="display text-foreground/55">{BRAND.name}</p>
      <p className="mt-1">{BRAND.tagline}</p>
      <p className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-foreground/30">
        <a href="/cgu" className="cursor-pointer transition-colors duration-200 hover:text-foreground/60">
          CGU
        </a>
        <a href="/confidentialite" className="cursor-pointer transition-colors duration-200 hover:text-foreground/60">
          Confidentialité
        </a>
        <a href="/charte-contenu" className="cursor-pointer transition-colors duration-200 hover:text-foreground/60">
          Charte de contenu
        </a>
        <a href="/mentions-legales" className="cursor-pointer transition-colors duration-200 hover:text-foreground/60">
          Mentions légales
        </a>
      </p>
    </footer>
  );
}
