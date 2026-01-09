import type { IRow } from '@/lib/interfaces';
import type { DocSection } from '@/components/common/document-content';

export function DocumentToc({
  selectedRow,
  sections,
  getStr,
}: {
  selectedRow: IRow | undefined;
  sections: DocSection[];
  getStr: (v: unknown) => string;
}) {
  if (!selectedRow) return null;

  const visible = sections.filter((s) => {
    const t = getStr((selectedRow as any)?.[s.titleField.slug]);
    const b = s.bodyField ? getStr((selectedRow as any)?.[s.bodyField.slug]) : '';
    return t.trim() && b.trim();
  });

  if (!visible.length) return null;

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 rounded-xl border bg-background/40 p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Nesta página
        </div>

        <div className="space-y-1">
          {visible.map((s) => (
            <button
              key={s.id}
              className="w-full text-left rounded-md px-2 py-1 text-sm hover:bg-muted"
              onClick={() => {
                document.getElementById(s.id)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
            >
              {getStr((selectedRow as any)?.[s.titleField.slug]) || s.titleField.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
