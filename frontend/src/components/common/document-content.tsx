import type { IRow } from '@/lib/interfaces';
import { TableRowTextLongCell } from '@/components/common/table-row-text-long-cell';
import { TableRowTextShortCell } from '@/components/common/table-row-text-short-cell';

export type DocSection = {
  id: string;
  titleField: any;
  bodyField?: any;
};

export function DocumentContent({
  selectedRow,
  title,
  sections,
  getStr,
}: {
  selectedRow: IRow | undefined;
  title: string;
  sections: DocSection[];
  getStr: (v: unknown) => string;
}) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>{title}</h1>

      {selectedRow && sections.length ? (
        sections.map((s) => {
          const titleRaw = getStr((selectedRow as any)?.[s.titleField.slug]);
          if (!titleRaw.trim()) return null;

          const bodyRaw = s.bodyField
            ? getStr((selectedRow as any)?.[s.bodyField.slug])
            : '';
          if (!bodyRaw.trim()) return null;

          return (
            <section key={s.id}>
              <h2 id={s.id}>
                <TableRowTextShortCell
                  field={s.titleField}
                  row={selectedRow}
                />
              </h2>

              <div className="not-prose">
                <TableRowTextLongCell
                  field={s.bodyField}
                  row={selectedRow}
                />
              </div>
            </section>
          );
        })
      ) : (
        <p className="opacity-70">Nenhum parágrafo configurado.</p>
      )}
    </div>
  );
}
