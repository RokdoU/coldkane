"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/lib/actions/auth";

const inputCls =
  "mt-2 w-full rounded-md border border-night-500 bg-night-800 px-4 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-foreground/25 focus:border-ice-500";

export function SignupForm() {
  const [role, setRole] = useState<"caller" | "company">("caller");
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {
    error: null,
  });

  return (
    <form action={action} className="mt-8 space-y-5">
      {/* Choix du rôle */}
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-night-600 bg-night-800 p-1.5">
        {(
          [
            { value: "caller", label: "Je suis caller" },
            { value: "company", label: "Je suis une entreprise" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRole(opt.value)}
            className={`cursor-pointer rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
              role === opt.value
                ? "bg-night-500 text-foreground"
                : "text-foreground/45 hover:text-foreground/70"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="fullName" className="text-sm font-medium">
          {role === "company" ? "Nom du contact" : "Nom complet"}
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          placeholder="Prénom Nom"
          className={inputCls}
        />
      </div>

      {role === "company" && (
        <div>
          <label htmlFor="companyName" className="text-sm font-medium">
            Nom de l&apos;entreprise
          </label>
          <input
            id="companyName"
            name="companyName"
            required
            autoComplete="organization"
            placeholder="Ma Société SAS"
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label htmlFor="username" className="text-sm font-medium">
          Pseudo {role === "caller" && <span className="text-foreground/40">(public, sur le ladder)</span>}
        </label>
        <input
          id="username"
          name="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-z0-9_]{3,20}"
          title="3 à 20 caractères : minuscules, chiffres, _"
          placeholder="ton_pseudo"
          className={inputCls}
        />
      </div>

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
          Mot de passe <span className="text-foreground/40">(8 caractères min.)</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {pending ? "Création…" : role === "company" ? "Créer mon compte entreprise" : "Rejoindre le ladder"}
      </button>

      <p className="text-center text-xs leading-relaxed text-foreground/35">
        En t&apos;inscrivant tu acceptes les{" "}
        <Link href="/cgu" className="cursor-pointer underline transition-colors duration-200 hover:text-foreground/60">
          CGU
        </Link>{" "}
        et la{" "}
        <Link href="/confidentialite" className="cursor-pointer underline transition-colors duration-200 hover:text-foreground/60">
          politique de confidentialité
        </Link>
        .
      </p>

      <p className="text-center text-sm text-foreground/45">
        Déjà un compte ?{" "}
        <Link
          href="/connexion"
          className="cursor-pointer font-medium text-ice-400 transition-colors duration-200 hover:text-ice-300"
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}
