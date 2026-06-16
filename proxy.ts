// Proxy Next 16 (ex-middleware) : rafraîchit la session Supabase et protège
// les espaces connectés. En mode démo (Supabase non configuré), les dashboards
// restent accessibles avec des données fictives.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/entreprises/dashboard"];

const REF_RE = /^[a-z0-9_]{3,20}$/;
const REF_COOKIE = "ck_ref";

export async function proxy(request: NextRequest) {
  // Attribution affiliation : un visiteur arrivé via ?ref=<pseudo> est rattaché
  // au parrain/apporteur via un cookie 30j (survit à la navigation jusqu'au
  // signup). Posé une seule fois par visiteur (premier ?ref vu).
  const refParam = request.nextUrl.searchParams.get("ref");
  const validRef = refParam && REF_RE.test(refParam) ? refParam : null;
  const needsRefCookie = validRef && !request.cookies.get(REF_COOKIE);
  const setRefCookie = (res: NextResponse) => {
    if (needsRefCookie) {
      res.cookies.set(REF_COOKIE, validRef!, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
        httpOnly: true,
      });
    }
    return res;
  };

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  if (!configured) return setRefCookie(NextResponse.next());

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() rafraîchit le token si besoin — à garder avant toute décision
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", pathname);
    return setRefCookie(NextResponse.redirect(url));
  }

  // Trace le clic d'affiliation (une fois par visiteur) — non bloquant
  if (needsRefCookie) {
    try {
      await supabase.rpc("track_referral_click", { p_ref: validRef, p_path: pathname });
    } catch {
      // analytics best-effort : ne jamais bloquer la requête
    }
  }

  return setRefCookie(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/og|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
