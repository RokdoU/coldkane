import Link from "next/link";
import { Nav, Footer } from "@/components/nav";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="display text-7xl text-night-500">404</p>
        <h1 className="display mt-4 text-2xl tracking-tight">
          Ce numéro n&apos;est pas attribué.
        </h1>
        <p className="mt-3 text-sm text-foreground/45">
          La page que tu cherches n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="cursor-pointer rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/missions"
            className="cursor-pointer rounded-md border border-night-500 px-6 py-3 text-sm font-medium text-ice-300 transition-colors duration-200 hover:border-night-400 hover:text-ice-400"
          >
            Voir les missions
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
