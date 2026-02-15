import { PlusIcon, TrashIcon } from 'lucide-react';
import React from 'react';

import { badgeStyleFromColor } from '@/components/common/table-row-badge-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { E_FIELD_FORMAT } from '@/lib/constant';
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
      <DialogContent className="w-[min(95vw,1400px)] max-w-[95vw] sm:max-w-[1200px] lg:max-w-[1400px] h-[85vh] overflow-hidden p-0">
        <form
          className="grid grid-cols-1 lg:grid-cols-[1fr_280px] h-full min-h-0"
          onSubmit={(event) => {
            event.preventDefault();
            createForm.handleSubmit();
          }}
        >
          <div className="overflow-y-auto min-h-0 p-6 space-y-6">
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
                  <>
                    {fields.description?.format === E_FIELD_FORMAT.RICH_TEXT ? (
                      <formField.TableRowRichTextField
                        field={fields.description}
                      />
                    ) : (
                      <formField.TableRowTextareaField
                        field={fields.description!}
                      />
                    )}
                  </>
                )}
              </createForm.AppField>
            )}

            {fields.tasks && (
              <createForm.AppField name={fields.tasks.slug}>
                {(tasksField: any) => (
                  <createForm.AppField name="__kanbanTaskDraft">
                    {(taskDraftField: any) => {
                      const tasks = Array.isArray(tasksField.state.value)
                        ? tasksField.state.value
                        : [];

                      const addTask = (): void => {
                        const title = String(
                          taskDraftField.state.value ?? '',
                        ).trim();
                        if (!title) return;

                        tasksField.handleChange([
                          ...tasks,
                          {
                            titulo: title,
                            realizado: ['nao'],
                          },
                        ]);
                        taskDraftField.handleChange('');
                      };

                      return (
                        <section className="space-y-3">
                          <h3 className="text-sm font-semibold">Tarefas</h3>
                          <div className="space-y-2">
                            {tasks.map(
                              (
                                task: Record<string, unknown>,
                                index: number,
                              ) => (
                                <div
                                  key={`${index}-${String(task.titulo ?? '')}`}
                                  className="flex items-center gap-2 rounded-lg border bg-background p-2"
                                >
                                  <Checkbox
                                    checked={
                                      Array.isArray(task.realizado) &&
                                      task.realizado.includes('sim')
                                    }
                                    onCheckedChange={(checked) => {
                                      const updated = tasks.map(
                                        (
                                          item: Record<string, unknown>,
                                          itemIndex: number,
                                        ) =>
                                          itemIndex === index
                                            ? {
                                                ...item,
                                                realizado: [
                                                  checked ? 'sim' : 'nao',
                                                ],
                                              }
                                            : item,
                                      );
                                      tasksField.handleChange(updated);
                                    }}
                                  />
                                  <span className="flex-1 text-sm">
                                    {String(task.titulo ?? '-')}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                      tasksField.handleChange(
                                        tasks.filter(
                                          (_: unknown, i: number) =>
                                            i !== index,
                                        ),
                                      );
                                    }}
                                    aria-label="Excluir tarefa"
                                  >
                                    <TrashIcon className="size-4" />
                                  </Button>
                                </div>
                              ),
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Input
                              value={String(taskDraftField.state.value ?? '')}
                              onChange={(event) =>
                                taskDraftField.handleChange(event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  addTask();
                                }
                              }}
                              placeholder="Nova tarefa"
                            />
                            <Button
                              type="button"
                              onClick={addTask}
                              className="cursor-pointer"
                            >
                              <PlusIcon className="size-4" />
                              <span>Adicionar</span>
                            </Button>
                          </div>
                        </section>
                      );
                    }}
                  </createForm.AppField>
                )}
              </createForm.AppField>
            )}

            {(fields.members || fields.startDate || fields.dueDate) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fields.members && (
                  <createForm.AppField name={fields.members.slug}>
                    {(formField: any) => (
                      <formField.TableRowUserField field={fields.members!} />
                    )}
                  </createForm.AppField>
                )}
                {fields.startDate && (
                  <createForm.AppField name={fields.startDate.slug}>
                    {(formField: any) => (
                      <formField.TableRowDateField field={fields.startDate!} />
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
              </div>
            )}
          </div>

          <aside className="border-l bg-muted/30 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
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
            </div>

            <div className="border-t bg-muted/40 p-4 flex flex-col gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer"
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
