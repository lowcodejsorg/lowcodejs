import type { CatNode } from "@/lib/document-helpers";

type TocItem = { id: string; label: string; level: number };

function flatten(nodes: CatNode[], level = 1): TocItem[] {
  const out: TocItem[] = [];
  for (const n of nodes) {
    out.push({ id: n.id, label: n.label, level });
    if (n.children?.length) out.push(...flatten(n.children, level + 1));
  }
  return out;
}

export function DocumentToc({ nodes, title }: { nodes: CatNode[]; title: string }) {
  const items = flatten(nodes);
  if (!items.length) return null;

  return (
    <section className="print-only p-4">
      <h2 className="text-2xl font-bold mb-3">{title}</h2>

      <nav aria-label="Sumário">
        <ol className="m-0 p-0 list-none">
          {items.map((it) => (
            <li key={it.id} style={{ paddingLeft: (it.level - 1) * 12 }}>
              <a
                href={`#sec-${it.id}`}
                className="toc-link flex items-baseline gap-2 no-underline font-semibold"
              >
                <span className="toc-title">{it.label}</span>
                <span className="toc-dots flex-1 border-b border-dotted border-gray-400 translate-y-[-2px]" />
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
