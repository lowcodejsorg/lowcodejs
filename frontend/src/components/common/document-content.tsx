import { TableRowTextLongCell } from '@/components/common/table-row-text-long-cell';
import { TableRowTextShortCell } from '@/components/common/table-row-text-short-cell';
import type { IField, IRow } from '@/lib/interfaces';

export type DocSection = {
  id: string;
  titleField: IField;
  bodyField: IField;
};

export function DocumentContent({
  selectedRow,
  title,
  sections,
  getStr,
}: {
  selectedRow: IRow;
  title: string;
  sections: Array<DocSection>;
  getStr: (v: unknown) => string;
}): React.JSX.Element {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>{title}</h1>

      {sections.length ? (
        sections.map((s) => {
          const titleRaw = getStr(selectedRow[s.titleField.slug]);
          if (!titleRaw.trim()) return null;

          const bodyRaw = getStr(selectedRow[s.bodyField.slug]);
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
