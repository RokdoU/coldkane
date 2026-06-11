"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="display text-7xl text-night-500">500</p>
      <h1 className="display mt-4 text-2xl tracking-tight">Appel interrompu.</h1>
      <p className="mt-3 text-sm text-foreground/45">
        Une erreur inattendue s&apos;est produite. Réessaie — si ça persiste,
        on est déjà dessus.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 cursor-pointer rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
      >
        Réessayer
      </button>
    </main>
  );
}
