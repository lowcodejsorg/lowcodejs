import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { buildDefaultValues, buildPayload } from './row/create/-create-form';

import {
  KanbanAddListDialog,
  KanbanCard,
  KanbanColumn,
  KanbanCreateCardDialog,
  KanbanRowDialog,
  KanbanSortableCard,
  KanbanUnassignedColumn,
} from '@/components/kanban';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { useCreateTableRow } from '@/hooks/tanstack-query/use-table-row-create';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { API } from '@/lib/api';
import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow, ITable } from '@/lib/interfaces';
import {
  ORDER_FIELD_NAME,
  ORDER_FIELD_SLUG,
  getFieldBySlug,
  getFirstFieldByType,
  normalizeRowValue,
  parseOrderValue,
} from '@/lib/kanban-helpers';
import type { FieldMap } from '@/lib/kanban-types';

interface Props {
  data: Array<IRow>;
  headers: Array<IField>;
  tableSlug: string;
  table: ITable;
}

export function TableKanbanView({
  data,
  headers,
  tableSlug,
  table,
}: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const [activeRow, setActiveRow] = React.useState<IRow | null>(null);
  const activeRowId = activeRow?._id ?? null;
  const [isAddListOpen, setIsAddListOpen] = React.useState(false);
  const [rowsState, setRowsState] = React.useState<Array<IRow>>(data);
  const [isCreateCardOpen, setIsCreateCardOpen] = React.useState(false);
  const [createColumnId, setCreateColumnId] = React.useState<string | null>(
    null,
  );
  const [activeDragCardId, setActiveDragCardId] = React.useState<string | null>(
    null,
  );
  const [editingColumnId, setEditingColumnId] = React.useState<string | null>(
    null,
  );
  const [editingColumnLabel, setEditingColumnLabel] = React.useState('');
  const [editingColumnColor, setEditingColumnColor] = React.useState<
    string | null
  >(null);

  const fields = React.useMemo<FieldMap>(() => {
    const listField =
      getFieldBySlug(headers, 'lista', E_FIELD_TYPE.DROPDOWN) ||
      getFirstFieldByType(headers, E_FIELD_TYPE.DROPDOWN);

    return {
      title:
        getFieldBySlug(headers, 'titulo', E_FIELD_TYPE.TEXT_SHORT) ||
        getFirstFieldByType(headers, E_FIELD_TYPE.TEXT_SHORT),
      description: getFieldBySlug(headers, 'descricao', E_FIELD_TYPE.TEXT_LONG),
      members: getFieldBySlug(headers, 'membros', E_FIELD_TYPE.USER),
      startDate: getFieldBySlug(headers, 'data-de-inicio', E_FIELD_TYPE.DATE),
      dueDate: getFieldBySlug(headers, 'data-de-vencimento', E_FIELD_TYPE.DATE),
      progress: getFieldBySlug(
        headers,
        'porcentagem-concluida',
        E_FIELD_TYPE.TEXT_SHORT,
      ),
      list: listField,
      // Hide labels until dedicated "etiqueta" field type is available.
      labels: undefined,
      attachments:
        getFieldBySlug(headers, 'anexos', E_FIELD_TYPE.FIELD_GROUP) ||
        getFieldBySlug(headers, 'anexo', E_FIELD_TYPE.FILE),
      tasks: getFieldBySlug(headers, 'tarefas', E_FIELD_TYPE.FIELD_GROUP),
      comments: getFieldBySlug(
        headers,
        'comentarios',
        E_FIELD_TYPE.FIELD_GROUP,
      ),
    };
  }, [headers]);

  const listOptions = fields.list?.dropdown ?? [];
  const orderField = React.useMemo(
    () =>
      headers.find(
        (field) => !field.trashed && field.slug === ORDER_FIELD_SLUG,
      ),
    [headers],
  );
  const [orderFieldSlug, setOrderFieldSlug] = React.useState<string | null>(
    orderField?.slug ?? null,
  );

  const [columnOrder, setColumnOrder] = React.useState<Array<string>>(
    listOptions.map((opt) => opt.id),
  );

  React.useEffect(() => {
    setRowsState(data);
  }, [data]);

  React.useEffect(() => {
    setColumnOrder((prev) => {
      const ids = listOptions.map((opt) => opt.id);
      if (prev.length === 0) return ids;
      const next = prev.filter((id) => ids.includes(id));
      ids.forEach((id) => {
        if (!next.includes(id)) next.push(id);
      });
      return next;
    });
  }, [listOptions]);

  React.useEffect(() => {
    setOrderFieldSlug(orderField?.slug ?? null);
  }, [orderField?.slug]);

  const orderedListOptions = React.useMemo(() => {
    const byId = new Map(listOptions.map((opt) => [opt.id, opt] as const));
    return columnOrder.map((id) => byId.get(id)).filter(Boolean) as Array<
      (typeof listOptions)[number]
    >;
  }, [columnOrder, listOptions]);

  const activeFields = React.useMemo(
    () => headers.filter((field) => !field.trashed && !field.native),
    [headers],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const addListOption = useMutation({
    mutationFn: async (payload: { label: string; color?: string | null }) => {
      if (!fields.list) {
        throw new Error('Campo de lista não encontrado');
      }
      const route = '/tables/'
        .concat(tableSlug)
        .concat('/fields/')
        .concat(fields.list._id);
      const dropdown = [
        ...fields.list.dropdown,
        {
          id: crypto.randomUUID(),
          label: payload.label,
          color: payload.color ?? null,
        },
      ];
      const response = await API.put<IField>(route, {
        ...fields.list,
        dropdown,
      });
      return response.data;
    },
    onSuccess(updatedField) {
      queryClient.setQueryData<ITable>(
        queryKeys.tables.detail(tableSlug),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: old.fields.map((field) =>
              field._id === updatedField._id ? updatedField : field,
            ),
          };
        },
      );
      toast('Lista adicionada', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A nova coluna foi criada com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
      setIsAddListOpen(false);
    },
    onError() {
      toast('Erro ao adicionar lista', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Nao foi possivel criar a coluna',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  const addListForm = useAppForm({
    defaultValues: {
      label: '',
      color: '#a3a3a3',
    },
    onSubmit: async ({ value }) => {
      const label = value.label.trim();
      if (!label || addListOption.status === 'pending') return;
      await addListOption.mutateAsync({
        label,
        color: value.color,
      });
    },
  });

  React.useEffect(() => {
    if (isAddListOpen) return;
    addListForm.reset({
      label: '',
      color: '#a3a3a3',
    });
  }, [addListForm, isAddListOpen]);

  const updateListOption = useMutation({
    mutationFn: async (payload: {
      optionId: string;
      label: string;
      color: string | null;
    }) => {
      if (!fields.list) {
        throw new Error('Campo de lista não encontrado');
      }
      const dropdown = fields.list.dropdown.map((opt) =>
        opt.id === payload.optionId
          ? { ...opt, label: payload.label, color: payload.color }
          : opt,
      );
      const response = await API.put<IField>(
        '/tables/'.concat(tableSlug).concat('/fields/').concat(fields.list._id),
        {
          ...fields.list,
          dropdown,
        },
      );
      return response.data;
    },
    onSuccess(updatedField) {
      queryClient.setQueryData<ITable>(
        queryKeys.tables.detail(tableSlug),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: old.fields.map((field) =>
              field._id === updatedField._id ? updatedField : field,
            ),
          };
        },
      );
      setEditingColumnId(null);
      setEditingColumnLabel('');
      setEditingColumnColor(null);
      toast('Lista atualizada', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A lista foi atualizada',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
    onError() {
      toast('Erro ao atualizar lista', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Nao foi possivel atualizar o nome',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  const columns = React.useMemo(() => {
    const byStatus: Record<string, Array<IRow>> = {};
    orderedListOptions.forEach((opt) => {
      byStatus[opt.id] = [];
    });
    const unassigned: Array<IRow> = [];

    const rowOrderIndex = new Map(
      rowsState.map((row, index) => [row._id, index]),
    );

    rowsState.forEach((row) => {
      const raw = fields.list ? row[fields.list.slug] : null;
      const values = normalizeRowValue(raw);
      const value = values[0];
      if (value && value in byStatus) {
        byStatus[value].push(row);
      } else {
        unassigned.push(row);
      }
    });

    if (orderFieldSlug) {
      Object.keys(byStatus).forEach((key) => {
        byStatus[key].sort((a, b) => {
          const aOrder = parseOrderValue(a[orderFieldSlug]);
          const bOrder = parseOrderValue(b[orderFieldSlug]);
          if (aOrder === null && bOrder === null) {
            return (
              (rowOrderIndex.get(a._id) ?? 0) - (rowOrderIndex.get(b._id) ?? 0)
            );
          }
          if (aOrder === null) return 1;
          if (bOrder === null) return -1;
          return aOrder - bOrder;
        });
      });
    }

    return {
      byStatus,
      unassigned,
    };
  }, [fields.list, orderedListOptions, orderFieldSlug, rowsState]);

  React.useEffect(() => {
    if (!activeRowId) return;
    const updated = rowsState.find((row) => row._id === activeRowId);
    if (updated) setActiveRow(updated);
  }, [rowsState, activeRowId]);

  const createRow = useCreateTableRow({
    onSuccess(createdRow) {
      setRowsState((prev) => [...prev, createdRow]);
      toast('Card criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O card foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
      setIsCreateCardOpen(false);
      setCreateColumnId(null);
    },
    onError() {
      toast('Erro ao criar card', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Nao foi possivel criar o card',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  const createForm = useAppForm({
    defaultValues: buildDefaultValues(activeFields),
    onSubmit: async ({ value }) => {
      if (!fields.list || !createColumnId) return;
      if (createRow.status === 'pending') return;

      const payload = buildPayload(value, activeFields);
      payload[fields.list.slug] = [createColumnId];

      if (orderFieldSlug) {
        const columnCount = columns.byStatus[createColumnId].length;
        payload[orderFieldSlug] = String(columnCount + 1);
      }

      await createRow.mutateAsync({
        slug: tableSlug,
        data: payload,
      });
    },
  });

  const createColumnOption = orderedListOptions.find(
    (option) => option.id === createColumnId,
  );
  const activeDragCard = rowsState.find((row) => row._id === activeDragCardId);

  const handleRowDuplicated = React.useCallback(
    (createdRow: IRow) => {
      setRowsState((prev) => [...prev, createdRow]);
      setActiveRow(createdRow);
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(tableSlug),
      });
    },
    [queryClient, tableSlug],
  );

  const handleRowDeleted = React.useCallback(
    (rowId: string) => {
      setRowsState((prev) => prev.filter((row) => row._id !== rowId));
      setActiveRow((prev) => (prev && prev._id === rowId ? null : prev));
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(tableSlug),
      });
    },
    [queryClient, tableSlug],
  );

  React.useEffect(() => {
    if (!isCreateCardOpen) return;
    createForm.reset(buildDefaultValues(activeFields));
    if (fields.list && createColumnId) {
      createForm.setFieldValue(fields.list.slug, [createColumnId]);
    }
  }, [activeFields, createColumnId, createForm, fields.list, isCreateCardOpen]);

  const ensureOrderField = React.useCallback(async (): Promise<
    string | null
  > => {
    if (orderField?.slug) {
      if (!orderField.locked) {
        try {
          const response = await API.put<IField>(
            '/tables/'
              .concat(tableSlug)
              .concat('/fields/')
              .concat(orderField._id),
            {
              ...orderField,
              locked: true,
            },
          );
          const updatedField = response.data;
          queryClient.setQueryData<ITable>(
            queryKeys.tables.detail(tableSlug),
            (old) => {
              if (!old) return old;
              return {
                ...old,
                fields: old.fields.map((field) =>
                  field._id === updatedField._id ? updatedField : field,
                ),
              };
            },
          );
        } catch (error) {
          toast('Erro ao travar o campo de ordem', {
            className: '!bg-destructive !text-white !border-destructive',
            description: 'Nao foi possivel travar o campo de ordem',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
        }
      }
      return orderField.slug;
    }
    if (orderFieldSlug) return orderFieldSlug;
    try {
      const response = await API.post<IField>(
        '/tables/'.concat(tableSlug).concat('/fields'),
        {
          name: ORDER_FIELD_NAME,
          type: E_FIELD_TYPE.TEXT_SHORT,
          required: false,
          multiple: false,
          format: E_FIELD_FORMAT.INTEGER,
          showInFilter: false,
          showInForm: false,
          showInDetail: false,
          showInList: false,
          defaultValue: null,
          locked: true,
          relationship: null,
          dropdown: [],
          category: [],
          group: null,
        },
      );

      const createdField = response.data;
      setOrderFieldSlug(createdField.slug);
      queryClient.setQueryData<ITable>(
        queryKeys.tables.detail(tableSlug),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: [...old.fields, createdField],
          };
        },
      );

      setRowsState((prev) =>
        prev.map((row) => ({ ...row, [createdField.slug]: null })),
      );

      return createdField.slug;
    } catch (error) {
      toast('Erro ao preparar ordenação', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Nao foi possivel criar o campo de ordem',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
      return null;
    }
  }, [orderField, orderFieldSlug, queryClient, tableSlug]);

  const updateListDropdownOrder = React.useCallback(
    async (nextOrder: Array<string>) => {
      if (!fields.list) return;
      const byId = new Map(
        fields.list.dropdown.map((opt) => [opt.id, opt] as const),
      );
      const nextDropdown = nextOrder.map((id) => byId.get(id)).filter(Boolean);
      try {
        const response = await API.put<IField>(
          '/tables/'
            .concat(tableSlug)
            .concat('/fields/')
            .concat(fields.list._id),
          {
            ...fields.list,
            dropdown: nextDropdown,
          },
        );
        const updatedField = response.data;
        queryClient.setQueryData<ITable>(
          queryKeys.tables.detail(tableSlug),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              fields: old.fields.map((field) =>
                field._id === updatedField._id ? updatedField : field,
              ),
            };
          },
        );
      } catch (error) {
        toast('Erro ao ordenar colunas', {
          className: '!bg-destructive !text-white !border-destructive',
          description: 'Nao foi possivel salvar a nova ordem',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
    },
    [fields.list, queryClient, tableSlug],
  );

  const updateRowsOrder = React.useCallback(
    async (
      updates: Array<{ rowId: string; data: Record<string, unknown> }>,
    ) => {
      try {
        await Promise.all(
          updates.map((update) =>
            API.put(
              '/tables/'
                .concat(tableSlug)
                .concat('/rows/')
                .concat(update.rowId),
              update.data,
            ),
          ),
        );
        queryClient.invalidateQueries({
          queryKey: queryKeys.rows.lists(tableSlug),
        });
      } catch (error) {
        toast('Erro ao reordenar cards', {
          className: '!bg-destructive !text-white !border-destructive',
          description: 'Nao foi possivel salvar a nova ordem',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
    },
    [queryClient, tableSlug],
  );

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragCardId(null);
      if (!over) return;
      const activeType = active.data.current?.type;
      const overType = over.data.current?.type;

      if (activeType === 'column') {
        const activeId = String(active.id);
        const overId = String(over.id);
        if (activeId === overId) return;
        setColumnOrder((prev) => {
          const from = prev.indexOf(activeId);
          const to = prev.indexOf(overId);
          if (from === -1 || to === -1) return prev;
          const next = arrayMove(prev, from, to);
          updateListDropdownOrder(next);
          return next;
        });
        return;
      }

      if (activeType !== 'card') return;

      const activeId = String(active.id);
      const sourceColumn = active.data.current?.columnId as string;
      const overColumnId = over.data.current?.columnId;

      const targetColumn =
        overType === 'card'
          ? (overColumnId as string)
          : (overColumnId ?? String(over.id));

      if (!fields.list) return;

      const orderSlug = await ensureOrderField();

      const sourceRows = columns.byStatus[sourceColumn] ?? [];
      const targetRows =
        sourceColumn === targetColumn
          ? sourceRows
          : (columns.byStatus[targetColumn] ?? []);

      const sourceIds = sourceRows.map((row) => row._id);
      const targetIds = targetRows.map((row) => row._id);

      const fromIndex = sourceIds.indexOf(activeId);
      if (fromIndex === -1) return;

      let nextSourceIds = [...sourceIds];
      let nextTargetIds = [...targetIds];

      if (sourceColumn === targetColumn) {
        if (overType === 'column') {
          nextSourceIds = arrayMove(sourceIds, fromIndex, targetIds.length - 1);
        } else {
          const overId = String(over.id);
          const toIndex = targetIds.indexOf(overId);
          if (toIndex === -1) return;
          nextSourceIds = arrayMove(sourceIds, fromIndex, toIndex);
        }
        nextTargetIds = nextSourceIds;
      } else {
        nextSourceIds.splice(fromIndex, 1);
        const insertAt =
          overType === 'card'
            ? targetIds.indexOf(String(over.id))
            : targetIds.length;
        const index =
          insertAt === -1 || insertAt > nextTargetIds.length
            ? nextTargetIds.length
            : insertAt;
        nextTargetIds.splice(index, 0, activeId);
      }

      const rowById = new Map(rowsState.map((row) => [row._id, row] as const));

      const updates: Array<{ rowId: string; data: Record<string, unknown> }> =
        [];

      const applyOrder = (ids: Array<string>, columnId: string): void => {
        ids.forEach((id, index) => {
          const row = rowById.get(id);
          if (!row) return;
          const patchData: Record<string, unknown> = {};
          if (sourceColumn !== targetColumn && id === activeId) {
            patchData[fields.list!.slug] = [columnId];
          }
          if (orderSlug) {
            patchData[orderSlug] = String(index + 1);
          }
          if (Object.keys(patchData).length > 0) {
            updates.push({ rowId: id, data: patchData });
          }
          rowById.set(id, {
            ...row,
            ...(sourceColumn !== targetColumn && id === activeId
              ? { [fields.list!.slug]: [columnId] }
              : {}),
            ...(orderSlug ? { [orderSlug]: String(index + 1) } : {}),
          });
        });
      };

      applyOrder(nextSourceIds, sourceColumn);
      if (sourceColumn !== targetColumn) {
        applyOrder(nextTargetIds, targetColumn);
      }

      setRowsState((prev) => prev.map((row) => rowById.get(row._id) ?? row));

      if (updates.length > 0) {
        await updateRowsOrder(updates);
      }
    },
    [
      columns.byStatus,
      ensureOrderField,
      fields.list,
      rowsState,
      updateListDropdownOrder,
      updateRowsOrder,
    ],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => {
        const activeType = event.active.data.current?.type;
        if (activeType !== 'card') return;
        setActiveDragCardId(String(event.active.id));
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveDragCardId(null);
      }}
    >
      <SortableContext
        items={orderedListOptions.map((opt) => opt.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex gap-4 h-full overflow-x-auto p-2">
          {orderedListOptions.map((option) => (
            <KanbanColumn
              key={option.id}
              option={option}
              count={columns.byStatus[option.id].length}
              editingColumnId={editingColumnId}
              editingColumnLabel={editingColumnLabel}
              editingColumnColor={editingColumnColor}
              onEditStart={(opt) => {
                setEditingColumnId(opt.id);
                setEditingColumnLabel(opt.label);
                setEditingColumnColor(opt.color ?? '#64748b');
              }}
              onEditChange={(value) => setEditingColumnLabel(value)}
              onEditColorChange={(value) => setEditingColumnColor(value)}
              onEditCancel={() => {
                setEditingColumnId(null);
                setEditingColumnLabel('');
                setEditingColumnColor(null);
              }}
              onEditCommit={(optionId, nextLabel, nextColor) => {
                updateListOption.mutate({
                  optionId,
                  label: nextLabel,
                  color: nextColor,
                });
              }}
            >
              <SortableContext
                items={columns.byStatus[option.id].map((row) => row._id)}
                strategy={verticalListSortingStrategy}
              >
                {columns.byStatus[option.id].map((row) => (
                  <KanbanSortableCard
                    key={row._id}
                    row={row}
                    fields={fields}
                    columnId={option.id}
                    onClick={() => setActiveRow(row)}
                  />
                ))}
              </SortableContext>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-muted-foreground cursor-pointer"
                onClick={() => {
                  setCreateColumnId(option.id);
                  setIsCreateCardOpen(true);
                }}
              >
                <PlusIcon className="size-4" />
                <span>Adicionar card</span>
              </Button>
            </KanbanColumn>
          ))}

          <KanbanUnassignedColumn
            rows={columns.unassigned}
            fields={fields}
            onSelectRow={setActiveRow}
          />

          <section className="w-72 shrink-0 rounded-xl border border-dashed bg-muted/10 p-4 flex items-center justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddListOpen(true)}
              disabled={!fields.list}
              className="cursor-pointer"
            >
              <PlusIcon className="size-4" />
              <span>Adicionar outra lista</span>
            </Button>
          </section>

          <KanbanRowDialog
            row={activeRow}
            onClose={() => setActiveRow(null)}
            onRowUpdated={(row) => setActiveRow(row)}
            onRowDuplicated={handleRowDuplicated}
            onRowDeleted={handleRowDeleted}
            tableSlug={tableSlug}
            table={table}
            fields={fields}
          />

          <KanbanAddListDialog
            open={isAddListOpen}
            onOpenChange={(open) => {
              setIsAddListOpen(open);
              if (!open) {
                addListForm.reset({
                  label: '',
                  color: '#a3a3a3',
                });
              }
            }}
            form={addListForm}
            isSubmitting={addListOption.status === 'pending'}
          />

          <KanbanCreateCardDialog
            open={isCreateCardOpen}
            onOpenChange={(open) => {
              setIsCreateCardOpen(open);
              if (!open) setCreateColumnId(null);
            }}
            createForm={createForm}
            fields={fields}
            createColumnOption={createColumnOption}
            isSubmitting={createRow.status === 'pending'}
            onCancel={() => setIsCreateCardOpen(false)}
          />
        </div>
      </SortableContext>
      <DragOverlay>
        {activeDragCard ? (
          <div className="w-[17rem]">
            <KanbanCard
              row={activeDragCard}
              fields={fields}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
