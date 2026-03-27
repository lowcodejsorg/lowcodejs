import { CopyIcon, FileTextIcon, TrashIcon } from 'lucide-react';
import React from 'react';

import { KanbanFieldGroupEditor } from './kanban-field-group-editor';
import { KanbanRowCommentsSection } from './kanban-row-comments';
import { KanbanRowDescriptionSection } from './kanban-row-description';
import { KanbanRowExtraFieldsSection } from './kanban-row-extra-fields';
import { KanbanRowQuickActions } from './kanban-row-quick-actions';
import { KanbanRowTasksSection } from './kanban-row-tasks';

import { TableRowCategoryCell } from '@/components/common/dynamic-table/table-cells/table-row-category-cell';
import { TableRowDateCell } from '@/components/common/dynamic-table/table-cells/table-row-date-cell';
import { TableRowDropdownCell } from '@/components/common/dynamic-table/table-cells/table-row-dropdown-cell';
import { TableRowEvaluationCell } from '@/components/common/dynamic-table/table-cells/table-row-evaluation-cell';
import { TableRowFieldGroupCell } from '@/components/common/dynamic-table/table-cells/table-row-field-group-cell';
import { TableRowFileCell } from '@/components/common/dynamic-table/table-cells/table-row-file-cell';
import { TableRowReactionCell } from '@/components/common/dynamic-table/table-cells/table-row-reaction-cell';
import { TableRowRelationshipCell } from '@/components/common/dynamic-table/table-cells/table-row-relationship-cell';
import { TableRowTextLongCell } from '@/components/common/dynamic-table/table-cells/table-row-text-long-cell';
import { TableRowTextShortCell } from '@/components/common/dynamic-table/table-cells/table-row-text-short-cell';
import { TableRowUserCell } from '@/components/common/dynamic-table/table-cells/table-row-user-cell';
import { FileUploadWithStorage } from '@/components/common/file-upload/file-upload-with-storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProfileRead } from '@/hooks/tanstack-query/use-profile-read';
import { useRowUpdateTrash } from '@/hooks/tanstack-query/use-row-update-trash';
import { useCreateTableRow } from '@/hooks/tanstack-query/use-table-row-create';
import { useUpdateTableRow } from '@/hooks/tanstack-query/use-table-row-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow, IStorage, ITable } from '@/lib/interfaces';
import {
  ORDER_FIELD_SLUG,
  TEMPLATE_FIELD_SLUGS,
  buildDefaultValuesFromRow,
  buildPayloadFromRow,
  getMembersFromRow,
  getProgressValue,
  getTaskCompletionPercent,
  getTitleValue,
  normalizeIdList,
  normalizeRowValue,
} from '@/lib/kanban-helpers';
import type { FieldMap } from '@/lib/kanban-types';
import { buildRowPayload, buildUpdateRowDefaultValues } from '@/lib/table';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast';
import { useAuthStore } from '@/stores/authentication';

export function KanbanRowDialog({
  row,
  onClose,
  onRowUpdated,
  onRowDuplicated,
  onRowDeleted,
  tableSlug,
  table,
  fields,
}: {
  row: IRow | null;
  onClose: () => void;
  onRowUpdated?: (row: IRow) => void;
  onRowDuplicated?: (row: IRow) => void;
  onRowDeleted?: (rowId: string) => void;
  tableSlug: string;
  table: ITable;
  fields: FieldMap;
}): React.JSX.Element | null {
  const auth = useAuthStore((s) => s.user);
  const { data: profile } = useProfileRead();
  const currentUserId = auth?._id ?? '';
  const [editTarget, setEditTarget] = React.useState<
    'members' | 'start' | 'due' | null
  >(null);
  const [taskTitle, setTaskTitle] = React.useState('');
  const [editingTaskIndex, setEditingTaskIndex] = React.useState<number | null>(
    null,
  );
  const [editingTaskTitle, setEditingTaskTitle] = React.useState('');
  const [commentText, setCommentText] = React.useState('');
  const [editingCommentIndex, setEditingCommentIndex] = React.useState<
    number | null
  >(null);
  const [editingCommentText, setEditingCommentText] = React.useState('');
  const [editingFieldSlug, setEditingFieldSlug] = React.useState<string | null>(
    null,
  );
  const [isAddingAttachments, setIsAddingAttachments] = React.useState(false);
  const [attachmentUploadFiles, setAttachmentUploadFiles] = React.useState<
    Array<File>
  >([]);
  const [attachmentUploadStorages, setAttachmentUploadStorages] =
    React.useState<Array<IStorage>>([]);
  const [isAttachmentUploading, setIsAttachmentUploading] =
    React.useState(false);

  const descriptionField = fields.description;
  const allExtraFields = table.fields.filter(
    (field) =>
      !field.trashed &&
      !field.native &&
      !TEMPLATE_FIELD_SLUGS.has(field.slug) &&
      field.slug !== fields.attachments?.slug &&
      field.slug !== ORDER_FIELD_SLUG,
  );
  const extraFields = allExtraFields.filter(
    (field) => field.type !== E_FIELD_TYPE.FIELD_GROUP,
  );
  const extraFieldGroups = allExtraFields.filter(
    (field) => field.type === E_FIELD_TYPE.FIELD_GROUP,
  );
  const editableFields = [
    fields.title,
    descriptionField,
    fields.attachments,
    ...extraFields,
  ].filter(Boolean) as Array<IField>;

  const quickFields = [fields.members, fields.startDate, fields.dueDate].filter(
    Boolean,
  ) as Array<IField>;

  const updateRow = useUpdateTableRow({
    onSuccess(data) {
      toastSuccess('Registro atualizado', 'O card foi atualizado com sucesso');
      onRowUpdated?.(data);
      setTaskTitle('');
      setCommentText('');
      setEditingTaskIndex(null);
      setEditingTaskTitle('');
    },
    onError() {
      toastError('Erro ao atualizar', 'Nao foi possivel atualizar o card');
    },
  });

  const createRow = useCreateTableRow({
    onSuccess(data) {
      toastSuccess('Card duplicado', 'O card foi duplicado com sucesso');
      onRowDuplicated?.(data);
    },
    onError() {
      toastError('Erro ao duplicar', 'Nao foi possivel duplicar o card');
    },
  });

  const trashRow = useRowUpdateTrash({
    onSuccess() {
      toastWarning('Card excluido', 'O card foi enviado para a lixeira');
      if (row) onRowDeleted?.(row._id);
      onClose();
    },
    onError() {
      toastError('Erro ao excluir', 'Nao foi possivel excluir o card');
    },
  });

  const quickForm = useAppForm({
    defaultValues: ((): Record<string, any> => {
      if (row) {
        return buildDefaultValuesFromRow(row, quickFields);
      }
      return {};
    })(),
    onSubmit: async ({ value }) => {
      if (!row || updateRow.status === 'pending') return;
      const payload: Record<string, any> = {};
      for (const field of quickFields) {
        const v = value[field.slug];
        if (field.type === E_FIELD_TYPE.USER) {
          let userValue: Array<any> = [];
          if (Array.isArray(v)) {
            userValue = v.map((opt: any) => opt.value ?? opt._id ?? opt);
          }
          payload[field.slug] = userValue;
          continue;
        }

        if (field.type === E_FIELD_TYPE.DROPDOWN) {
          if (field.multiple) {
            let dropdownValue: Array<any> = [];
            if (Array.isArray(v)) {
              dropdownValue = v;
            } else if (v) {
              dropdownValue = [v];
            }
            payload[field.slug] = dropdownValue;
          } else {
            let singleValue: any = v ?? null;
            if (typeof v === 'string' && v) {
              singleValue = v;
            }
            payload[field.slug] = singleValue;
          }
          continue;
        }

        payload[field.slug] = v || null;
      }
      await updateRow.mutateAsync({
        slug: tableSlug,
        rowId: row._id,
        data: payload,
      });
      setEditTarget(null);
    },
  });

  const rowId = row?._id ?? '';

  React.useEffect(() => {
    if (!row) return;
    quickForm.reset(buildDefaultValuesFromRow(row, quickFields));
    setEditingTaskIndex(null);
    setEditingTaskTitle('');
  }, [rowId, quickFields.length]);

  const extraForm = useAppForm({
    defaultValues: ((): Record<string, any> => {
      if (row) {
        return buildUpdateRowDefaultValues(row, editableFields);
      }
      return {};
    })(),
    onSubmit: async ({ value }) => {
      if (!row || updateRow.status === 'pending' || !editingFieldSlug) {
        return;
      }
      const field = editableFields.find(
        (editableField) => editableField.slug === editingFieldSlug,
      );
      if (!field) return;
      const payload = buildRowPayload({ [field.slug]: value[field.slug] }, [
        field,
      ]);
      await updateRow.mutateAsync({
        slug: tableSlug,
        rowId: row._id,
        data: payload,
      });
      setEditingFieldSlug(null);
    },
  });

  React.useEffect(() => {
    if (!row) return;
    extraForm.reset(buildUpdateRowDefaultValues(row, editableFields));
    setEditingFieldSlug(null);
  }, [rowId, editableFields.length]);

  React.useEffect(() => {
    setIsAddingAttachments(false);
    setAttachmentUploadFiles([]);
    setAttachmentUploadStorages([]);
    setIsAttachmentUploading(false);
  }, [rowId]);

  const normalizeCommentPayload = React.useCallback(
    (comment: Record<string, any>) => ({
      ...comment,
      autor: normalizeIdList(comment.autor),
    }),
    [],
  );

  const handleStartEditingField = React.useCallback(
    (slug: string) => {
      if (!row) return;
      extraForm.reset(buildUpdateRowDefaultValues(row, editableFields));
      setEditingFieldSlug(slug);
    },
    [editableFields, extraForm, row],
  );

  if (!row) return null;

  const title = getTitleValue(row, fields.title);
  const members = getMembersFromRow(row, fields.members);
  const progress = getProgressValue(row, fields.progress);
  const creatorName =
    (typeof row.creator === 'object' && row.creator !== null
      ? (row.creator as any).name || (row.creator as any).email
      : null) || 'Sem criador';
  const tasks = Array.isArray(row[fields.tasks?.slug ?? ''])
    ? (row[fields.tasks?.slug ?? ''] as Array<Record<string, any>>)
    : [];
  const comments = Array.isArray(row[fields.comments?.slug ?? ''])
    ? (row[fields.comments?.slug ?? ''] as Array<Record<string, any>>)
    : [];
  const attachmentStorages =
    fields.attachments?.type === E_FIELD_TYPE.FILE &&
    Array.isArray(row[fields.attachments.slug])
      ? (row[fields.attachments.slug] as Array<unknown>).filter(
          (value): value is IStorage =>
            typeof value === 'object' &&
            value !== null &&
            '_id' in value &&
            'url' in value &&
            'originalName' in value,
        )
      : [];
  const attachmentGroupRows =
    fields.attachments?.type === E_FIELD_TYPE.FIELD_GROUP &&
    Array.isArray(row[fields.attachments.slug])
      ? (row[fields.attachments.slug] as Array<Record<string, any>>)
      : [];
  const attachmentGroupFileFieldSlug =
    fields.attachments?.type === E_FIELD_TYPE.FIELD_GROUP
      ? (fields.attachments.group?.fields ?? []).find(
          (groupField: IField) => groupField.type === E_FIELD_TYPE.FILE,
        )?.slug
      : null;
  const attachmentItems =
    fields.attachments?.type === E_FIELD_TYPE.FILE
      ? attachmentStorages.map((storage) => ({ storage }))
      : fields.attachments?.type === E_FIELD_TYPE.FIELD_GROUP &&
          attachmentGroupFileFieldSlug
        ? attachmentGroupRows.flatMap((groupRow) => {
            const rawFiles = groupRow[attachmentGroupFileFieldSlug];
            const files = Array.isArray(rawFiles)
              ? rawFiles
              : rawFiles
                ? [rawFiles]
                : [];
            return files
              .filter(
                (value): value is IStorage =>
                  typeof value === 'object' &&
                  value !== null &&
                  '_id' in value &&
                  'url' in value &&
                  'originalName' in value,
              )
              .map((storage) => ({ storage }));
          })
        : [];
  const supportsInlineAttachmentManager =
    fields.attachments?.type === E_FIELD_TYPE.FILE ||
    (fields.attachments?.type === E_FIELD_TYPE.FIELD_GROUP &&
      Boolean(attachmentGroupFileFieldSlug));

  const isMember = members.some((member) => {
    if (typeof member === 'string') return member === currentUserId;
    return member._id === currentUserId;
  });

  const canDelete = row.creator._id === currentUserId;

  const handleTaskToggle = async (index: number): Promise<void> => {
    if (!fields.tasks) return;
    const updated = tasks.map((task, i) => {
      if (i !== index) return task;
      let realizadoValue = ['sim'];
      if (normalizeRowValue(task.realizado).includes('sim')) {
        realizadoValue = ['nao'];
      }
      return {
        ...task,
        realizado: realizadoValue,
      };
    });
    const nextProgress = getTaskCompletionPercent(updated);
    const progressData: Record<string, any> = {};
    if (fields.progress) {
      progressData[fields.progress.slug] = String(nextProgress);
    }
    await updateRow.mutateAsync({
      slug: tableSlug,
      rowId: row._id,
      data: {
        [fields.tasks.slug]: updated,
        ...progressData,
      },
    });
  };

  const handleTaskAdd = async (): Promise<void> => {
    if (!fields.tasks || !taskTitle.trim()) return;
    const updated = [
      ...tasks,
      {
        titulo: taskTitle.trim(),
        realizado: ['nao'],
      },
    ];
    const nextProgress = getTaskCompletionPercent(updated);
    const progressData: Record<string, any> = {};
    if (fields.progress) {
      progressData[fields.progress.slug] = String(nextProgress);
    }
    await updateRow.mutateAsync({
      slug: tableSlug,
      rowId: row._id,
      data: {
        [fields.tasks.slug]: updated,
        ...progressData,
      },
    });
    setTaskTitle('');
  };

  const handleTaskEditStart = (index: number, taskTitleValue: string): void => {
    setEditingTaskIndex(index);
    setEditingTaskTitle(taskTitleValue);
  };

  const handleTaskEditCancel = (): void => {
    setEditingTaskIndex(null);
    setEditingTaskTitle('');
  };

  const handleTaskEditSave = async (index: number): Promise<void> => {
    if (!fields.tasks) return;
    const nextTitle = editingTaskTitle.trim();
    if (!nextTitle) {
      handleTaskEditCancel();
      return;
    }
    const updated = tasks.map((task, i) => {
      if (i !== index) return task;
      return {
        ...task,
        titulo: nextTitle,
      };
    });
    const nextProgress = getTaskCompletionPercent(updated);
    const progressData: Record<string, any> = {};
    if (fields.progress) {
      progressData[fields.progress.slug] = String(nextProgress);
    }
    await updateRow.mutateAsync({
      slug: tableSlug,
      rowId: row._id,
      data: {
        [fields.tasks.slug]: updated,
        ...progressData,
      },
    });
    handleTaskEditCancel();
  };

  const handleTaskDelete = async (index: number): Promise<void> => {
    if (!fields.tasks) return;
    const updated = tasks.filter((_, i) => i !== index);
    const nextProgress = getTaskCompletionPercent(updated);
    const progressData: Record<string, any> = {};
    if (fields.progress) {
      progressData[fields.progress.slug] = String(nextProgress);
    }
    await updateRow.mutateAsync({
      slug: tableSlug,
      rowId: row._id,
      data: {
        [fields.tasks.slug]: updated,
        ...progressData,
      },
    });
  };

  const handleCommentAdd = async (): Promise<void> => {
    if (!fields.comments || !commentText.trim()) return;
    const authorId = currentUserId || profile?._id || '';
    const updated = [
      ...comments.map(normalizeCommentPayload),
      {
        comentario: commentText.trim(),
        autor: normalizeIdList(authorId),
        data: new Date().toISOString(),
      },
    ];
    await updateRow.mutateAsync({
      slug: tableSlug,
      rowId: row._id,
      data: {
        [fields.comments.slug]: updated,
      },
    });
    setCommentText('');
  };

  const handleCommentSave = async (): Promise<void> => {
    if (editingCommentIndex === null || !fields.comments) return;
    const updated = comments.map((comment, index) =>
      index === editingCommentIndex
        ? {
            ...normalizeCommentPayload(comment),
            comentario: editingCommentText.trim(),
          }
        : normalizeCommentPayload(comment),
    );
    await updateRow.mutateAsync({
      slug: tableSlug,
      rowId: row._id,
      data: {
        [fields.comments.slug]: updated,
      },
    });
    setEditingCommentIndex(null);
    setEditingCommentText('');
  };

  const handleCommentDelete = async (index: number): Promise<void> => {
    if (!fields.comments) return;
    const updated = comments
      .filter((_, i) => i !== index)
      .map(normalizeCommentPayload);
    await updateRow.mutateAsync({
      slug: tableSlug,
      rowId: row._id,
      data: {
        [fields.comments.slug]: updated,
      },
    });
  };

  const handleCancelSubscription = async (): Promise<void> => {
    if (!fields.members) return;
    const updated = members
      .filter((member) => {
        if (typeof member === 'string') return member !== currentUserId;
        return member._id !== currentUserId;
      })
      .map((member) => {
        if (typeof member === 'string') return member;
        return member._id;
      });

    await updateRow.mutateAsync({
      slug: tableSlug,
      rowId: row._id,
      data: {
        [fields.members.slug]: updated,
      },
    });
  };

  const handleDuplicate = async (): Promise<void> => {
    const payload = buildPayloadFromRow(
      row,
      table.fields.filter((f) => !f.trashed),
    );
    await createRow.mutateAsync({
      slug: tableSlug,
      data: payload,
    });
  };

  const handleAttachmentDelete = async (storageId: string): Promise<void> => {
    if (!fields.attachments) {
      return;
    }
    if (fields.attachments.type === E_FIELD_TYPE.FILE) {
      const nextAttachmentIds = attachmentStorages
        .filter((storage) => storage._id !== storageId)
        .map((storage) => storage._id);
      await updateRow.mutateAsync({
        slug: tableSlug,
        rowId: row._id,
        data: {
          [fields.attachments.slug]: nextAttachmentIds,
        },
      });
      return;
    }
    if (
      fields.attachments.type === E_FIELD_TYPE.FIELD_GROUP &&
      attachmentGroupFileFieldSlug
    ) {
      const nextAttachmentGroups = attachmentGroupRows
        .map((groupRow) => {
          const currentIds = normalizeIdList(
            groupRow[attachmentGroupFileFieldSlug],
          ).filter((id) => id !== storageId);
          if (currentIds.length === 0) return null;
          return {
            ...groupRow,
            [attachmentGroupFileFieldSlug]: currentIds,
          };
        })
        .filter(Boolean);
      await updateRow.mutateAsync({
        slug: tableSlug,
        rowId: row._id,
        data: {
          [fields.attachments.slug]: nextAttachmentGroups,
        },
      });
    }
  };

  const handleAttachmentAddCancel = (): void => {
    setIsAddingAttachments(false);
    setAttachmentUploadFiles([]);
    setAttachmentUploadStorages([]);
    setIsAttachmentUploading(false);
  };

  const handleAttachmentAddSave = async (): Promise<void> => {
    if (!fields.attachments) {
      return;
    }
    if (attachmentUploadStorages.length === 0 || updateRow.status === 'pending')
      return;
    if (fields.attachments.type === E_FIELD_TYPE.FILE) {
      const nextAttachmentIds = Array.from(
        new Set([
          ...attachmentStorages.map((storage) => storage._id),
          ...attachmentUploadStorages.map((storage) => storage._id),
        ]),
      );
      await updateRow.mutateAsync({
        slug: tableSlug,
        rowId: row._id,
        data: {
          [fields.attachments.slug]: nextAttachmentIds,
        },
      });
      handleAttachmentAddCancel();
      return;
    }
    if (
      fields.attachments.type === E_FIELD_TYPE.FIELD_GROUP &&
      attachmentGroupFileFieldSlug
    ) {
      const normalizedGroups = attachmentGroupRows
        .map((groupRow) => {
          const currentIds = normalizeIdList(
            groupRow[attachmentGroupFileFieldSlug],
          );
          if (currentIds.length === 0) return null;
          return {
            ...groupRow,
            [attachmentGroupFileFieldSlug]: currentIds,
          };
        })
        .filter(Boolean);
      const nextAttachmentGroups = [
        ...normalizedGroups,
        {
          [attachmentGroupFileFieldSlug]: attachmentUploadStorages.map(
            (storage) => storage._id,
          ),
        },
      ];
      await updateRow.mutateAsync({
        slug: tableSlug,
        rowId: row._id,
        data: {
          [fields.attachments.slug]: nextAttachmentGroups,
        },
      });
      handleAttachmentAddCancel();
      return;
    }

    handleAttachmentAddCancel();
  };

  const isExtraFieldEditable = (field: IField): boolean =>
    field.type !== E_FIELD_TYPE.REACTION &&
    field.type !== E_FIELD_TYPE.EVALUATION;

  const renderExtraField = (field: IField): React.JSX.Element => {
    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
        return (
          <TableRowTextShortCell
            row={row}
            field={field}
          />
        );
      case E_FIELD_TYPE.TEXT_LONG:
        return (
          <TableRowTextLongCell
            row={row}
            field={field}
          />
        );
      case E_FIELD_TYPE.DATE:
        return (
          <TableRowDateCell
            row={row}
            field={field}
          />
        );
      case E_FIELD_TYPE.DROPDOWN:
        return (
          <TableRowDropdownCell
            row={row}
            field={field}
          />
        );
      case E_FIELD_TYPE.FILE:
        return (
          <TableRowFileCell
            row={row}
            field={field}
          />
        );
      case E_FIELD_TYPE.RELATIONSHIP:
        return (
          <TableRowRelationshipCell
            row={row}
            field={field}
          />
        );
      case E_FIELD_TYPE.CATEGORY:
        return (
          <TableRowCategoryCell
            row={row}
            field={field}
          />
        );
      case E_FIELD_TYPE.EVALUATION:
        return (
          <TableRowEvaluationCell
            row={row}
            field={field}
            tableSlug={tableSlug}
          />
        );
      case E_FIELD_TYPE.REACTION:
        return (
          <TableRowReactionCell
            row={row}
            field={field}
            tableSlug={tableSlug}
          />
        );
      case E_FIELD_TYPE.FIELD_GROUP:
        return (
          <TableRowFieldGroupCell
            row={row}
            field={field}
            tableSlug={tableSlug}
          />
        );
      case E_FIELD_TYPE.USER:
        return (
          <TableRowUserCell
            row={row}
            field={field}
          />
        );
      default:
        return <span className="text-muted-foreground text-sm">-</span>;
    }
  };

  const renderExtraFieldEditor = (field: IField): React.JSX.Element => {
    return (
      <extraForm.AppField name={field.slug}>
        {(formField: any) => {
          switch (field.type) {
            case E_FIELD_TYPE.TEXT_SHORT:
              return <formField.TableRowTextField field={field} />;
            case E_FIELD_TYPE.TEXT_LONG:
              if (field.format === E_FIELD_FORMAT.RICH_TEXT) {
                return <formField.TableRowRichTextField field={field} />;
              }
              return <formField.TableRowTextareaField field={field} />;
            case E_FIELD_TYPE.DROPDOWN:
              return <formField.TableRowDropdownField field={field} />;
            case E_FIELD_TYPE.DATE:
              return <formField.TableRowDateField field={field} />;
            case E_FIELD_TYPE.FILE:
              return <formField.TableRowFileField field={field} />;
            case E_FIELD_TYPE.RELATIONSHIP:
              return <formField.TableRowRelationshipField field={field} />;
            case E_FIELD_TYPE.CATEGORY:
              return <formField.TableRowCategoryField field={field} />;
            case E_FIELD_TYPE.FIELD_GROUP:
              return (
                <formField.TableRowFieldGroupField
                  field={field}
                  tableSlug={tableSlug}
                  form={extraForm}
                />
              );
            case E_FIELD_TYPE.USER:
              return <formField.TableRowUserField field={field} />;
            default:
              return <span className="text-muted-foreground text-sm">-</span>;
          }
        }}
      </extraForm.AppField>
    );
  };
  return (
    <Dialog
      modal={false}
      open={!!row}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        data-slot="kanban-row-dialog"
        className="w-[min(75vw,1000px)] max-w-[95vw] sm:max-w-[1200px] lg:max-w-[1400px] h-[85vh] overflow-hidden p-0"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] h-full min-h-0">
          <div className="overflow-y-auto p-6 h-full min-h-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                {((): React.ReactNode => {
                  if (fields.title) {
                    return (
                      <button
                        type="button"
                        className="text-left hover:underline cursor-pointer"
                        onClick={() =>
                          handleStartEditingField(fields.title!.slug)
                        }
                      >
                        {title}
                      </button>
                    );
                  }
                  return title;
                })()}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detalhes do cartao do kanban
              </DialogDescription>
            </DialogHeader>

            {fields.title && editingFieldSlug === fields.title.slug && (
              <form
                className="mt-4 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  extraForm.handleSubmit();
                }}
              >
                {renderExtraFieldEditor(fields.title)}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => setEditingFieldSlug(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="cursor-pointer"
                    disabled={updateRow.status === 'pending'}
                  >
                    Salvar
                  </Button>
                </div>
              </form>
            )}

            <KanbanRowQuickActions
              members={members}
              fields={{
                members: fields.members,
                startDate: fields.startDate,
                dueDate: fields.dueDate,
              }}
              editTarget={editTarget}
              setEditTarget={setEditTarget}
              quickForm={quickForm}
            />

            {(fields.members || fields.startDate || fields.dueDate) && (
              <section className="mt-4 grid gap-3 md:grid-cols-4">
                {fields.members && editTarget !== 'members' && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs uppercase text-muted-foreground">
                      Membros
                    </p>
                    <TableRowUserCell
                      row={row}
                      field={fields.members}
                    />
                  </div>
                )}
                {fields.startDate && editTarget !== 'start' && (
                  <div className="space-y-1 md:col-span-1">
                    <p className="text-xs uppercase text-muted-foreground">
                      Data de início
                    </p>
                    <TableRowDateCell
                      row={row}
                      field={fields.startDate}
                    />
                  </div>
                )}
                {fields.dueDate && editTarget !== 'due' && (
                  <div className="space-y-1 md:col-span-1">
                    <p className="text-xs uppercase text-muted-foreground">
                      Data de vencimento
                    </p>
                    <TableRowDateCell
                      row={row}
                      field={fields.dueDate}
                    />
                  </div>
                )}
              </section>
            )}

            {descriptionField && (
              <KanbanRowDescriptionSection
                row={row}
                descriptionField={descriptionField}
                editingFieldSlug={editingFieldSlug}
                onStartEdit={handleStartEditingField}
                onCancelEdit={() => setEditingFieldSlug(null)}
                renderEditor={renderExtraFieldEditor}
                onSubmit={extraForm.handleSubmit}
                isSaving={updateRow.status === 'pending'}
              />
            )}

            {fields.tasks && (
              <KanbanRowTasksSection
                tasks={tasks}
                taskTitle={taskTitle}
                onTaskTitleChange={setTaskTitle}
                onTaskToggle={handleTaskToggle}
                onTaskDelete={handleTaskDelete}
                editingTaskIndex={editingTaskIndex}
                editingTaskTitle={editingTaskTitle}
                onTaskEditStart={handleTaskEditStart}
                onTaskEditChange={setEditingTaskTitle}
                onTaskEditCancel={handleTaskEditCancel}
                onTaskEditSave={handleTaskEditSave}
                onTaskAdd={handleTaskAdd}
              />
            )}

            {fields.attachments && (
              <section className="mt-4 space-y-2">
                {((): React.ReactNode => {
                  if (fields.attachments.type === E_FIELD_TYPE.FIELD_GROUP) {
                    return (
                      <KanbanFieldGroupEditor
                        row={row}
                        field={fields.attachments}
                        table={table}
                        tableSlug={tableSlug}
                        currentUserId={currentUserId}
                        updateRow={updateRow}
                      />
                    );
                  }
                  if (supportsInlineAttachmentManager) {
                    return (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold">Anexos</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => setIsAddingAttachments(true)}
                            disabled={updateRow.status === 'pending'}
                          >
                            Adicionar
                          </Button>
                        </div>
                        <div className="space-y-2 rounded-md border px-3 py-2">
                          {((): React.ReactNode => {
                            if (attachmentItems.length > 0) {
                              return (
                                <ul className="space-y-1">
                                  {attachmentItems.map(
                                    ({ storage: attachment }) => {
                                      let attachmentThumbnail: React.JSX.Element | null =
                                        null;
                                      if (
                                        attachment.mimetype?.includes('image')
                                      ) {
                                        attachmentThumbnail = (
                                          <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="shrink-0"
                                          >
                                            <img
                                              src={attachment.url}
                                              alt={attachment.originalName}
                                              className="size-9 rounded object-cover border"
                                            />
                                          </a>
                                        );
                                      } else if (
                                        attachment.mimetype ===
                                        'application/pdf'
                                      ) {
                                        attachmentThumbnail = (
                                          <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="shrink-0"
                                          >
                                            <div className="size-9 rounded border bg-muted flex items-center justify-center">
                                              <FileTextIcon className="size-4 text-muted-foreground" />
                                            </div>
                                          </a>
                                        );
                                      }
                                      return (
                                        <li
                                          key={attachment._id}
                                          className="flex items-center justify-between gap-2"
                                        >
                                          <div className="flex min-w-0 items-center gap-2">
                                            {attachmentThumbnail}
                                            <a
                                              href={attachment.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-sm text-primary underline underline-offset-2 truncate"
                                            >
                                              {attachment.originalName}
                                            </a>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="cursor-pointer text-destructive"
                                            disabled={
                                              updateRow.status === 'pending'
                                            }
                                            onClick={() =>
                                              handleAttachmentDelete(
                                                attachment._id,
                                              )
                                            }
                                          >
                                            <TrashIcon className="size-3.5" />
                                          </Button>
                                        </li>
                                      );
                                    },
                                  )}
                                </ul>
                              );
                            }
                            return (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            );
                          })()}

                          {isAddingAttachments && (
                            <div className="space-y-2 border-t pt-2">
                              <FileUploadWithStorage
                                value={attachmentUploadFiles}
                                onValueChange={setAttachmentUploadFiles}
                                onStorageChange={setAttachmentUploadStorages}
                                maxFiles={10}
                                onUploadingChange={setIsAttachmentUploading}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="cursor-pointer"
                                  onClick={handleAttachmentAddCancel}
                                  disabled={updateRow.status === 'pending'}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  className="cursor-pointer"
                                  onClick={handleAttachmentAddSave}
                                  disabled={
                                    updateRow.status === 'pending' ||
                                    isAttachmentUploading ||
                                    attachmentUploadStorages.length === 0
                                  }
                                >
                                  Adicionar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  }
                  return (
                    <>
                      <h3 className="text-sm font-semibold">Anexos</h3>
                      <div
                        role="button"
                        tabIndex={0}
                        className="w-full text-left rounded-md border border-transparent px-2 py-1 -ml-2 hover:border-muted-foreground/30 hover:bg-muted/30 cursor-pointer"
                        onClick={() =>
                          handleStartEditingField(fields.attachments!.slug)
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleStartEditingField(fields.attachments!.slug);
                          }
                        }}
                      >
                        {renderExtraField(fields.attachments)}
                      </div>
                      {editingFieldSlug === fields.attachments.slug && (
                        <form
                          className="space-y-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            extraForm.handleSubmit();
                          }}
                        >
                          {renderExtraFieldEditor(fields.attachments)}
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="cursor-pointer"
                              onClick={() => setEditingFieldSlug(null)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              className="cursor-pointer"
                              disabled={updateRow.status === 'pending'}
                            >
                              Salvar
                            </Button>
                          </div>
                        </form>
                      )}
                    </>
                  );
                })()}
              </section>
            )}

            {fields.comments && (
              <KanbanRowCommentsSection
                comments={comments}
                profile={profile ?? undefined}
                currentUserId={currentUserId}
                rowCreatorId={row.creator._id}
                editingCommentIndex={editingCommentIndex}
                editingCommentText={editingCommentText}
                onEditStart={(index, comment) => {
                  setEditingCommentIndex(index);
                  setEditingCommentText(String(comment.comentario ?? ''));
                }}
                onEditCancel={() => setEditingCommentIndex(null)}
                onEditChange={setEditingCommentText}
                onSave={handleCommentSave}
                onDelete={handleCommentDelete}
                commentText={commentText}
                onCommentTextChange={setCommentText}
                onAddComment={handleCommentAdd}
              />
            )}

            <KanbanRowExtraFieldsSection
              extraFields={extraFields}
              editingFieldSlug={editingFieldSlug}
              isExtraFieldEditable={isExtraFieldEditable}
              onStartEdit={handleStartEditingField}
              onCancelEdit={() => setEditingFieldSlug(null)}
              onSubmit={extraForm.handleSubmit}
              renderExtraField={renderExtraField}
              renderExtraFieldEditor={renderExtraFieldEditor}
              isSaving={updateRow.status === 'pending'}
            />

            {extraFieldGroups.map((groupField) => (
              <section
                key={groupField._id}
                className="mt-4"
              >
                <KanbanFieldGroupEditor
                  row={row}
                  field={groupField}
                  table={table}
                  tableSlug={tableSlug}
                  currentUserId={currentUserId}
                  updateRow={updateRow}
                />
              </section>
            ))}
          </div>

          <aside className="border-l bg-muted/30 p-4 flex flex-col gap-6 overflow-hidden">
            <div className="space-y-2 flex flex-col gap-1">
              <p className="text-xs uppercase text-muted-foreground">
                Adicionar ao card
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget('members')}
                className="cursor-pointer"
              >
                Membros
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget('start')}
                className="cursor-pointer"
              >
                Data de início
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget('due')}
                className="cursor-pointer"
              >
                Data do vencimento
              </Button>
            </div>

            <div className="space-y-2 flex flex-col gap-1">
              <p className="text-xs uppercase text-muted-foreground">Ações</p>
              {isMember && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelSubscription}
                  className="cursor-pointer"
                >
                  Cancelar inscrição
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleDuplicate}
                className="cursor-pointer"
              >
                <CopyIcon className="size-4" />
                <span>Duplicar</span>
              </Button>
              {canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() =>
                    trashRow.mutate({ slug: tableSlug, rowId: row._id })
                  }
                >
                  <TrashIcon className="size-4" />
                  <span>Excluir</span>
                </Button>
              )}
            </div>

            {fields.list && (
              <div className="space-y-2">
                <p className="text-xs uppercase text-muted-foreground">Lista</p>
                <TableRowDropdownCell
                  row={row}
                  field={fields.list}
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs uppercase text-muted-foreground">
                Progresso
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{progress ?? 0}%</Badge>
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${progress ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase text-muted-foreground">Criador</p>
              <Badge variant="outline">{creatorName}</Badge>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
