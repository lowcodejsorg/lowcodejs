import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { GripVerticalIcon, PlusIcon, TrashIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { ComboboxLoadMore } from '@/components/common/combobox-load-more';
import { RelatedRowCreateDialog } from '@/components/common/dynamic-table/table-row/table-row-relationship-field';
import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/file-upload/uploading-context';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Spinner } from '@/components/ui/spinner';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { useRelationshipLinkCreate } from '@/hooks/tanstack-query/use-relationship-link-create';
import { useRelationshipLinkDelete } from '@/hooks/tanstack-query/use-relationship-link-delete';
import { useRelationshipLinksList } from '@/hooks/tanstack-query/use-relationship-links-list';
import { useRelationshipLinksReorder } from '@/hooks/tanstack-query/use-relationship-links-reorder';
import { useRelationshipRowsReadPaginatedInfinite } from '@/hooks/tanstack-query/use-relationship-rows-read-paginated-infinite';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useReadTableRow } from '@/hooks/tanstack-query/use-table-row-read';
import { useUpdateTableRow } from '@/hooks/tanstack-query/use-table-row-update';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import { handleApiError } from '@/lib/handle-api-error';
import type { IField, IRelationshipLink, IRow, ITable } from '@/lib/interfaces';
import { isFieldShownInContext } from '@/lib/permission';
import { resolveRelationshipLabel } from '@/lib/relationship-label';
import {
  buildFieldValidator,
  buildRowPayload,
  buildUpdateRowDefaultValues,
} from '@/lib/table';
import { AutoSaveStatusIndicator } from '@/routes/_private/tables/$slug/row/-auto-save-status';

// Lado oposto do vínculo: a partir do registro atual (source) chegamos ao
// targetId; a partir do target chegamos ao sourceId.
export function otherIdOf(
  link: IRelationshipLink,
  side: 'source' | 'target',
): string {
  if (side === 'source') return link.targetId;
  return link.sourceId;
}

// Lado não-múltiplo (1:1 ou ponta "um" do 1:N) trava em um único card.
export function isSingleLocked(
  isMultiple: boolean,
  cardCount: number,
): boolean {
  if (isMultiple) return false;
  return cardCount >= 1;
}

// Campos editáveis da tabela relacionada exibidos em cada card, na ordem do
// formulário. Exclui nativos e tipos não renderáveis no sub-form inline.
export function getRelatedFormFields(table: ITable): Array<IField> {
  const order = table.fieldOrderForm;
  return table.fields
    .filter(
      (field): field is IField =>
        !field.trashed &&
        !field.native &&
        field.type !== E_FIELD_TYPE.FIELD_GROUP &&
        field.type !== E_FIELD_TYPE.REACTION &&
        field.type !== E_FIELD_TYPE.EVALUATION &&
        field.type !== E_FIELD_TYPE.IDENTIFIER &&
        field.type !== E_FIELD_TYPE.STATUS &&
        field.type !== E_FIELD_TYPE.TRASHED_AT &&
        isFieldShownInContext(field, 'form'),
    )
    .sort((a, b): number => {
      const rawA = order.indexOf(a._id);
      const rawB = order.indexOf(b._id);
      let sortA: number = rawA;
      if (rawA === -1) sortA = Infinity;
      let sortB: number = rawB;
      if (rawB === -1) sortB = Infinity;
      return sortA - sortB;
    });
}

interface RelationshipRowsInlineProps {
  field: IField;
  parentTableSlug: string;
  rowId?: string;
  canEdit: boolean;
  onEnsureParentRow?: () => Promise<string | undefined>;
  onChildAdded?: () => void;
  onLinkCountChange?: (count: number) => void;
}

export function RelationshipRowsInline(
  props: RelationshipRowsInlineProps,
): React.JSX.Element {
  const {
    field,
    parentTableSlug,
    rowId,
    canEdit,
    onEnsureParentRow,
    onChildAdded,
    onLinkCountChange,
  } = props;

  const relConfig = field.relationship;
  const relationshipId = relConfig?.relationshipId ?? '';
  const side: 'source' | 'target' = relConfig?.side ?? 'source';
  const otherTableSlug = relConfig?.table?.slug ?? '';
  const isMultiple = Boolean(field.multiple);
  const recordId = rowId ?? '';

  const queryClient = useQueryClient();
  const [page, setPage] = React.useState<number>(1);
  const [search, setSearch] = React.useState<string>('');
  const [pickerValue, setPickerValue] = React.useState<IRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState<boolean>(false);
  const [ensuring, setEnsuring] = React.useState<boolean>(false);
  const [orderedLinks, setOrderedLinks] = React.useState<
    Array<IRelationshipLink>
  >([]);

  const relatedTable = useReadTable({ slug: otherTableSlug });
  const relatedFields = relatedTable.data?.fields;

  const relatedFormFields = React.useMemo((): Array<IField> => {
    if (!relatedTable.data) return [];
    return getRelatedFormFields(relatedTable.data);
  }, [relatedTable.data]);

  const linksQuery = useRelationshipLinksList({
    tableSlug: parentTableSlug,
    relationshipId,
    side,
    recordId,
    page,
    perPage: 10,
  });

  const meta = linksQuery.data?.meta;
  const links = React.useMemo(
    (): Array<IRelationshipLink> => linksQuery.data?.data ?? [],
    [linksQuery.data?.data],
  );

  React.useEffect((): void => {
    setOrderedLinks(links);
  }, [links]);

  React.useEffect((): void => {
    onLinkCountChange?.(links.length);
  }, [links.length, onLinkCountChange]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const invalidateRows = React.useCallback((): void => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.rows.all(parentTableSlug),
    });
  }, [queryClient, parentTableSlug]);

  const createLink = useRelationshipLinkCreate({
    tableSlug: parentTableSlug,
    relationshipId,
    side,
    recordId,
    onSuccess(): void {
      invalidateRows();
    },
    onError(): void {
      toast.error('Não foi possível vincular o registro');
    },
  });

  const deleteLink = useRelationshipLinkDelete({
    tableSlug: parentTableSlug,
    relationshipId,
    side,
    recordId,
    onSuccess(): void {
      invalidateRows();
    },
    onError(): void {
      toast.error('Não foi possível desvincular o registro');
    },
  });

  const reorderLinks = useRelationshipLinksReorder({
    tableSlug: parentTableSlug,
    relationshipId,
    side,
    recordId,
    onError(): void {
      toast.error('Não foi possível reordenar os vínculos');
    },
  });

  const linkedIds = React.useMemo((): Set<string> => {
    const set = new Set<string>();
    for (const link of links) set.add(otherIdOf(link, side));
    return set;
  }, [links, side]);

  const pickerQuery = useRelationshipRowsReadPaginatedInfinite({
    tableSlug: otherTableSlug,
    fieldSlug: field.slug,
    search,
  });

  const pickerItems = React.useMemo((): Array<IRow> => {
    const rows = pickerQuery.data?.pages.flatMap((p) => p.data) ?? [];
    return rows.filter((row) => !linkedIds.has(String(row._id)));
  }, [pickerQuery.data?.pages, linkedIds]);

  const ensureParent = React.useCallback(async (): Promise<boolean> => {
    if (recordId) return true;
    if (!onEnsureParentRow) return false;
    setEnsuring(true);
    try {
      const ensured = await onEnsureParentRow();
      if (!ensured) return false;
      onChildAdded?.();
      return true;
    } finally {
      setEnsuring(false);
    }
  }, [recordId, onEnsureParentRow, onChildAdded]);

  function handlePick(row: IRow | null): void {
    setPickerValue(null);
    setSearch('');
    if (!row) return;
    onChildAdded?.();
    createLink.mutate({ otherId: String(row._id) });
  }

  function handleCreated(row: IRow): void {
    setIsCreateOpen(false);
    onChildAdded?.();
    createLink.mutate({ otherId: String(row._id) });
  }

  async function handleOpenCreate(): Promise<void> {
    const ok = await ensureParent();
    if (!ok) return;
    setIsCreateOpen(true);
  }

  function handleRemove(linkId: string): void {
    deleteLink.mutate({ linkId });
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedLinks.findIndex((l) => l._id === active.id);
    const newIndex = orderedLinks.findIndex((l) => l._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(orderedLinks, oldIndex, newIndex);
    setOrderedLinks(next);
    reorderLinks.mutate({
      items: next.map((l, index) => ({ linkId: l._id, order: index })),
    });
  }

  if (!relationshipId) {
    return (
      <div
        data-slot="relationship-rows-inline"
        className="space-y-2"
      >
        <span className="text-sm font-medium ml-2">{field.name}</span>
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Relacionamento ainda não materializado.
        </p>
      </div>
    );
  }

  // Form público anônimo: sem registro pai e sem como criar rascunho. Não há
  // como gerenciar vínculos antes de o registro existir.
  if (!recordId && !onEnsureParentRow) {
    return (
      <div
        data-slot="relationship-rows-inline"
        className="space-y-2"
      >
        <span className="text-sm font-medium ml-2">{field.name}</span>
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Salve o registro para vincular {field.name.toLowerCase()}.
        </p>
      </div>
    );
  }

  const singleLocked = isSingleLocked(isMultiple, orderedLinks.length);
  const showPicker = canEdit && !singleLocked && Boolean(recordId);
  const showEnsureButton =
    canEdit && !singleLocked && !recordId && Boolean(onEnsureParentRow);
  // Reordenar só com página única: a ordem é o índice absoluto.
  const singlePage = !meta || meta.lastPage <= 1;
  const canReorder = isMultiple && canEdit && singlePage;

  return (
    <div
      data-slot="relationship-rows-inline"
      data-test-id="relationship-rows-inline"
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium ml-2">{field.name}</span>
        {showEnsureButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={ensuring}
            onClick={(): void => {
              void ensureParent();
            }}
          >
            {ensuring && <Spinner />}
            {!ensuring && <PlusIcon className="size-4" />}
            <span>Adicionar item</span>
          </Button>
        )}
      </div>

      {linksQuery.isLoading && (
        <div className="flex items-center justify-center p-4">
          <Spinner className="opacity-50" />
        </div>
      )}

      {!linksQuery.isLoading && orderedLinks.length === 0 && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Nenhum item adicionado.
        </p>
      )}

      {orderedLinks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedLinks.map((l) => l._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {orderedLinks.map((link, index): React.JSX.Element => {
                const otherId = otherIdOf(link, side);
                return (
                  <SortableRelationshipCard
                    key={link._id}
                    linkId={link._id}
                    index={index}
                    sortable={canReorder}
                    otherTableSlug={otherTableSlug}
                    otherId={otherId}
                    fields={relatedFormFields}
                    canEdit={canEdit}
                    isRemoving={deleteLink.isPending}
                    onRemove={(): void => handleRemove(link._id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={(): void => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-muted-foreground">
            {meta.page} / {meta.lastPage}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= meta.lastPage}
            onClick={(): void => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      {showPicker && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <Combobox
            items={pickerItems}
            value={pickerValue}
            onValueChange={handlePick}
            inputValue={search}
            onInputValueChange={setSearch}
            itemToStringLabel={(row: IRow): string =>
              resolveRelationshipLabel(row, relConfig, relatedFields)
            }
            disabled={createLink.status === 'pending'}
          >
            <ComboboxInput
              placeholder={`Vincular ${field.name.toLowerCase()}`}
            />
            <ComboboxContent>
              <ComboboxEmpty>Nenhum resultado encontrado</ComboboxEmpty>
              {pickerQuery.isLoading && (
                <div className="flex items-center justify-center p-3">
                  <Spinner className="opacity-50" />
                </div>
              )}
              {!pickerQuery.isLoading && (
                <React.Fragment>
                  <ComboboxList>
                    {(row: IRow): React.ReactNode => (
                      <ComboboxItem
                        key={row._id}
                        value={row}
                      >
                        {resolveRelationshipLabel(
                          row,
                          relConfig,
                          relatedFields,
                        )}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                  <ComboboxLoadMore
                    hasNextPage={pickerQuery.hasNextPage}
                    isFetchingNextPage={pickerQuery.isFetchingNextPage}
                    onLoadMore={(): void => {
                      void pickerQuery.fetchNextPage();
                    }}
                  />
                </React.Fragment>
              )}
            </ComboboxContent>
          </Combobox>

          {field.allowCreateRelationshipRecords && relatedTable.data && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={(): void => {
                void handleOpenCreate();
              }}
            >
              <PlusIcon className="size-4" />
              <span>Novo registro</span>
            </Button>
          )}
        </div>
      )}

      {singleLocked && canEdit && (
        <p className="text-xs text-muted-foreground">
          Este lado aceita apenas um vínculo. Remova o atual para trocar.
        </p>
      )}

      {relatedTable.data && (
        <RelatedRowCreateDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          table={relatedTable.data}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

interface SortableRelationshipCardProps {
  linkId: string;
  index: number;
  sortable: boolean;
  otherTableSlug: string;
  otherId: string;
  fields: Array<IField>;
  canEdit: boolean;
  isRemoving: boolean;
  onRemove: () => void;
}

function SortableRelationshipCard({
  linkId,
  index,
  sortable,
  otherTableSlug,
  otherId,
  fields,
  canEdit,
  isRemoving,
  onRemove,
}: SortableRelationshipCardProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: linkId, disabled: !sortable });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  let dragHandle: React.ReactNode = null;
  if (sortable) {
    dragHandle = (
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        aria-label="Reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <RelationshipItemCard
        index={index}
        otherTableSlug={otherTableSlug}
        otherId={otherId}
        fields={fields}
        canEdit={canEdit}
        isRemoving={isRemoving}
        onRemove={onRemove}
        dragHandle={dragHandle}
      />
    </div>
  );
}

interface RelationshipItemCardProps {
  index: number;
  otherTableSlug: string;
  otherId: string;
  fields: Array<IField>;
  canEdit: boolean;
  isRemoving: boolean;
  onRemove: () => void;
  dragHandle: React.ReactNode;
}

export function RelationshipItemCard(
  props: RelationshipItemCardProps,
): React.JSX.Element {
  return (
    <UploadingProvider>
      <RelationshipItemCardLoader {...props} />
    </UploadingProvider>
  );
}

function RelationshipItemCardLoader(
  props: RelationshipItemCardProps,
): React.JSX.Element {
  const related = useReadTableRow({
    slug: props.otherTableSlug,
    rowId: props.otherId,
  });

  if (related.isLoading || !related.data) {
    return (
      <div className="flex items-center justify-center rounded-md border p-4">
        <Spinner className="opacity-50" />
      </div>
    );
  }

  return (
    <RelationshipItemCardForm
      row={related.data}
      index={props.index}
      otherTableSlug={props.otherTableSlug}
      otherId={props.otherId}
      fields={props.fields}
      canEdit={props.canEdit}
      isRemoving={props.isRemoving}
      onRemove={props.onRemove}
      dragHandle={props.dragHandle}
    />
  );
}

interface RelationshipItemCardFormProps extends RelationshipItemCardProps {
  row: IRow;
}

function RelationshipItemCardForm({
  row,
  index,
  otherTableSlug,
  otherId,
  fields,
  canEdit,
  isRemoving,
  onRemove,
  dragHandle,
}: RelationshipItemCardFormProps): React.JSX.Element {
  const isUploading = useIsUploading();

  const defaultValues = React.useMemo((): ReturnType<
    typeof buildUpdateRowDefaultValues
  > => {
    return buildUpdateRowDefaultValues(row, fields);
  }, [row, fields]);

  const triggerSaveRef = React.useRef<() => void>((): void => {});

  const form = useAppForm({
    defaultValues,
    onSubmit: async (): Promise<void> => {},
    listeners: {
      onBlur: (): void => {
        triggerSaveRef.current();
      },
      onChange: (): void => {
        triggerSaveRef.current();
      },
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  const update = useUpdateTableRow({
    onError(error: AxiosError | Error): void {
      handleApiError(error, {
        context: 'Erro ao salvar o registro relacionado',
      });
    },
  });

  const performSave = React.useCallback(async (): Promise<void> => {
    if (update.isPending) return;
    if (isUploading) return;
    const payload = buildRowPayload(form.state.values, fields);
    await update.mutateAsync({
      slug: otherTableSlug,
      rowId: otherId,
      data: payload,
    });
  }, [update, isUploading, form, fields, otherTableSlug, otherId]);

  const canSaveCallback = React.useCallback((): boolean => isDirty, [isDirty]);
  const isDirtyCallback = React.useCallback((): boolean => isDirty, [isDirty]);

  const { status, lastSavedAt, triggerSave, cancelPending } = useAutoSave({
    onSave: performSave,
    isDraft: false,
    canSave: canSaveCallback,
    isDirty: isDirtyCallback,
  });

  triggerSaveRef.current = triggerSave;

  const handleRemove = React.useCallback((): void => {
    cancelPending();
    onRemove();
  }, [cancelPending, onRemove]);

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {dragHandle}
          <span className="text-xs font-medium text-muted-foreground">
            {`Item ${(index + 1).toString()}`}
          </span>
          <AutoSaveStatusIndicator
            status={status}
            lastSavedAt={lastSavedAt}
          />
        </div>
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isRemoving}
            onClick={handleRemove}
          >
            {isRemoving && <Spinner />}
            {!isRemoving && <TrashIcon className="size-3.5" />}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {fields.map((field) => (
          <div
            key={field._id}
            className="min-w-[200px]"
            style={{ width: `calc(${field.widthInForm ?? 50}% - 1rem)` }}
          >
            <form.AppField
              name={field.slug}
              validators={{
                onChange: ({ value }: { value: any }): string | undefined =>
                  buildFieldValidator(field, value),
              }}
            >
              {(formField: any): React.JSX.Element | null =>
                renderRelationshipCardField(formField, field, otherTableSlug)
              }
            </form.AppField>
          </div>
        ))}
      </div>
    </div>
  );
}

export function renderRelationshipCardField(
  formField: any,
  field: IField,
  tableSlug: string,
): React.JSX.Element | null {
  switch (field.type) {
    case E_FIELD_TYPE.TEXT_SHORT:
      return (
        <formField.TableRowTextField
          field={field}
          disabled={false}
        />
      );
    case E_FIELD_TYPE.TEXT_LONG:
      if (field.format === E_FIELD_FORMAT.RICH_TEXT) {
        return (
          <formField.TableRowRichTextField
            field={field}
            disabled={false}
          />
        );
      }
      return (
        <formField.TableRowTextareaField
          field={field}
          disabled={false}
        />
      );
    case E_FIELD_TYPE.DROPDOWN:
      return (
        <formField.TableRowDropdownField
          field={field}
          disabled={false}
          tableSlug={tableSlug}
        />
      );
    case E_FIELD_TYPE.DATE:
      return (
        <formField.TableRowDateField
          field={field}
          disabled={false}
        />
      );
    case E_FIELD_TYPE.FILE:
      return (
        <formField.TableRowFileField
          field={field}
          disabled={false}
        />
      );
    case E_FIELD_TYPE.RELATIONSHIP:
      return (
        <formField.TableRowRelationshipField
          field={field}
          disabled={false}
          tableSlug={tableSlug}
        />
      );
    case E_FIELD_TYPE.CATEGORY:
      return (
        <formField.TableRowCategoryField
          field={field}
          disabled={false}
        />
      );
    case E_FIELD_TYPE.USER:
      return (
        <formField.TableRowUserField
          field={field}
          disabled={false}
        />
      );
    default:
      return null;
  }
}
