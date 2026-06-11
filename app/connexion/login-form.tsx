"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, type AuthState } from "@/lib/actions/auth";

const inputCls =
  "mt-2 w-full rounded-md border border-night-500 bg-night-800 px-4 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-foreground/25 focus:border-ice-500";

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {
    error: null,
  });

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={params.get("next") ?? ""} />

      {params.get("confirm") && (
        <p className="rounded-md border border-ice-500/30 bg-ice-500/5 px-4 py-3 text-sm text-ice-300">
          Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis
          connecte-toi.
        </p>
      )}

      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="toi@exemple.fr"
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputCls}
        />
      </div>

      {state.error && (
        <p className="rounded-md border border-ember-500/30 bg-ember-500/5 px-4 py-3 text-sm text-ember-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85 disabled:cursor-default disabled:opacity-50"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center text-sm text-foreground/45">
        Pas encore de compte ?{" "}
        <Link
          href="/inscription"
          className="cursor-pointer font-medium text-ice-400 transition-colors duration-200 hover:text-ice-300"
        >
          S&apos;inscrire
        </Link>
      </p>
    </form>
  );
}
