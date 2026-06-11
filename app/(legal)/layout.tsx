import { Nav, Footer } from "@/components/nav";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
        <article className="space-y-6 text-sm leading-relaxed text-foreground/65 [&_h1]:text-3xl [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
