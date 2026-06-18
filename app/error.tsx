"use client";

// Frontière d'erreur de segment : design de la marque (sombre, accent ice).
// Client Component obligatoire ({ error, reset }).

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Journalise l'erreur côté client pour le suivi.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="display text-7xl text-night-500">500</p>
      <h1 className="display mt-4 text-2xl tracking-tight">Appel interrompu.</h1>
      <p className="mt-3 text-sm text-foreground/45">
        Une erreur inattendue s&apos;est produite. Réessaie — si ça persiste,
        on est déjà dessus.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="cursor-pointer rounded-md border border-night-500 px-6 py-3 text-sm font-medium text-foreground/75 transition-colors duration-200 hover:border-night-400 hover:text-foreground"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
