// Injecte un (ou plusieurs) bloc(s) JSON-LD. Server Component : le script est
// rendu côté serveur, donc lisible par tous les crawlers (IA inclus) sans JS.

export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Données contrôlées (builders internes) — pas d'entrée utilisateur brute.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
