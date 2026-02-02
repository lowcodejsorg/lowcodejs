import React from 'react';

import { badgeStyleFromColor } from '@/components/common/table-row-badge-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FieldMap } from '@/lib/kanban-types';

export function KanbanCreateCardDialog({
  open,
  onOpenChange,
  createForm,
  fields,
  createColumnOption,
  isSubmitting,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createForm: any;
  fields: FieldMap;
  createColumnOption?: { id: string; label: string; color?: string | null };
  isSubmitting: boolean;
  onCancel: () => void;
}): React.JSX.Element {
  return (
    <Dialog
      modal={false}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="w-[min(95vw,1400px)] max-w-[95vw] sm:max-w-[1200px] lg:max-w-[1400px] h-[80vh] overflow-hidden p-0">
        <form
          className="grid grid-cols-1 lg:grid-cols-[1fr_260px] h-full"
          onSubmit={(event) => {
            event.preventDefault();
            createForm.handleSubmit();
          }}
        >
          <div className="overflow-y-auto p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                Novo card
              </DialogTitle>
              <DialogDescription>
                {createColumnOption?.label
                  ? `Adicionar em ${createColumnOption.label}`
                  : 'Preencha os dados do card.'}
              </DialogDescription>
            </DialogHeader>

            {fields.title && (
              <createForm.AppField name={fields.title.slug}>
                {(formField: any) => (
                  <formField.TableRowTextField field={fields.title!} />
                )}
              </createForm.AppField>
            )}

            {fields.description && (
              <createForm.AppField name={fields.description.slug}>
                {(formField: any) => (
                  <formField.TableRowTextareaField
                    field={fields.description!}
                  />
                )}
              </createForm.AppField>
            )}

            {(fields.members || fields.dueDate || fields.labels) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fields.members && (
                  <createForm.AppField name={fields.members.slug}>
                    {(formField: any) => (
                      <formField.TableRowUserField field={fields.members!} />
                    )}
                  </createForm.AppField>
                )}
                {fields.dueDate && (
                  <createForm.AppField name={fields.dueDate.slug}>
                    {(formField: any) => (
                      <formField.TableRowDateField field={fields.dueDate!} />
                    )}
                  </createForm.AppField>
                )}
                {fields.labels && (
                  <createForm.AppField name={fields.labels.slug}>
                    {(formField: any) => (
                      <formField.TableRowDropdownField field={fields.labels!} />
                    )}
                  </createForm.AppField>
                )}
              </div>
            )}
          </div>

          <aside className="border-l bg-muted/30 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="space-y-2">
              <p className="text-xs uppercase text-muted-foreground">Lista</p>
              {createColumnOption ? (
                <Badge
                  variant="outline"
                  style={badgeStyleFromColor(createColumnOption.color)}
                >
                  {createColumnOption.label}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                Criar card
              </Button>
            </div>
          </aside>
        </form>
      </DialogContent>
    </Dialog>
  );
}
