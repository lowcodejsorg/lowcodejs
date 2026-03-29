import React from 'react';

import { TableRowTextLongCell } from '@/components/common/dynamic-table/table-cells/table-row-text-long-cell';
import { Button } from '@/components/ui/button';
import type { IField, IRow } from '@/lib/interfaces';

export function KanbanRowDescriptionSection({
  row,
  descriptionField,
  editingFieldSlug,
  onStartEdit,
  onCancelEdit,
  renderEditor,
  onSubmit,
  isSaving,
}: {
  row: IRow;
  descriptionField: IField;
  editingFieldSlug: string | null;
  onStartEdit: (slug: string) => void;
  onCancelEdit: () => void;
  renderEditor: (field: IField) => React.JSX.Element;
  onSubmit: () => void;
  isSaving: boolean;
}): React.JSX.Element {
  const isEditing = editingFieldSlug === descriptionField.slug;

  return (
    <section
      data-slot="kanban-row-description"
      data-test-id="kanban-row-description"
      className="mt-6 space-y-2"
    >
      {!isEditing && <h3 className="text-sm font-semibold">Descrição</h3>}
      {((): React.ReactNode => {
        if (isEditing) {
          return (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              {renderEditor(descriptionField)}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer"
                  onClick={onCancelEdit}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={isSaving}
                >
                  Salvar
                </Button>
              </div>
            </form>
          );
        }
        return (
          <div
            role="button"
            tabIndex={0}
            className="w-full text-left rounded-md border border-transparent px-2 py-1 -ml-2 hover:border-muted-foreground/30 hover:bg-muted/30 cursor-pointer"
            onClick={() => onStartEdit(descriptionField.slug)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onStartEdit(descriptionField.slug);
              }
            }}
          >
            <TableRowTextLongCell
              row={row}
              field={descriptionField}
            />
          </div>
        );
      })()}
    </section>
  );
}
