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
import { useQueryClient } from '@tanstack/react-query';
import {
  ExternalLinkIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { ComboboxLoadMore } from '@/components/common/combobox-load-more';
import { RelatedRowCreateDialog } from '@/components/common/dynamic-table/table-row/table-row-relationship-field';
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
import type { IField, IRelationshipLink, IRow } from '@/lib/interfaces';
import { resolveRelationshipLabel } from '@/lib/relationship-label';

interface RelationshipManagementTableProps {
  field: IField;
  record: IRow;
  tableSlug: string;
  canEdit: boolean;
}

function otherIdOf(link: IRelationshipLink, side: 'source' | 'target'): string {
  if (side === 'source') return link.targetId;
  return link.sourceId;
}

interface LinkRowProps {
  linkId: string;
  recordId: string;
  label: string;
  href: string;
  sortable: boolean;
  canEdit: boolean;
  onRemove: (linkId: string) => void;
}

function LinkRow({
  linkId,
  recordId,
  label,
  href,
  sortable,
  canEdit,
  onRemove,
}: LinkRowProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: linkId, disabled: !sortable });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slot="relationship-management-row"
      className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5"
    >
      {sortable && (
        <button
          type="button"
          className="cursor-grab text-muted-foreground hover:text-foreground"
          aria-label="Reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 truncate text-sm hover:underline"
        title={label}
      >
        {label}
      </a>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground"
        aria-label="Abrir registro"
      >
        <ExternalLinkIcon className="size-3.5" />
      </a>

      {canEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-destructive"
          aria-label={`Desvincular ${recordId}`}
          onClick={(): void => onRemove(linkId)}
        >
          <Trash2Icon className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function RelationshipManagementTable({
  field,
  record,
  tableSlug,
  canEdit,
}: RelationshipManagementTableProps): React.JSX.Element {
  const relConfig = field.relationship;
  const relationshipId = relConfig?.relationshipId ?? '';
  const side = relConfig?.side ?? 'source';
  const recordId = String(record._id ?? '');
  const otherTableSlug = relConfig?.table?.slug ?? '';
  const isMultiple = Boolean(field.multiple);

  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [pickerValue, setPickerValue] = React.useState<IRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [extraLabels, setExtraLabels] = React.useState<Record<string, string>>(
    {},
  );
  const [orderedLinks, setOrderedLinks] = React.useState<
    Array<IRelationshipLink>
  >([]);

  const relatedTable = useReadTable({ slug: otherTableSlug });
  const relatedFields = relatedTable.data?.fields;

  const linksQuery = useRelationshipLinksList({
    tableSlug,
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

  // Mapa _id do outro lado -> label, a partir do registro projetado (read-compat)
  // somado ao cache local de itens recém-vinculados/criados.
  const labelMap = React.useMemo((): Map<string, string> => {
    const map = new Map<string, string>();
    let projected: Array<IRow> = [];
    const raw = record[field.slug];
    if (Array.isArray(raw)) projected = raw;
    for (const item of projected) {
      const id = String(item?._id ?? '');
      if (!id) continue;
      map.set(id, resolveRelationshipLabel(item, relConfig, relatedFields));
    }
    for (const [id, label] of Object.entries(extraLabels)) {
      map.set(id, label);
    }
    return map;
  }, [record, field.slug, relConfig, relatedFields, extraLabels]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const invalidateRows = React.useCallback((): void => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.rows.all(tableSlug),
    });
  }, [queryClient, tableSlug]);

  const createLink = useRelationshipLinkCreate({
    tableSlug,
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
    tableSlug,
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
    tableSlug,
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

  function rememberLabel(row: IRow): void {
    const id = String(row._id ?? '');
    if (!id) return;
    setExtraLabels((prev) => ({
      ...prev,
      [id]: resolveRelationshipLabel(row, relConfig, relatedFields),
    }));
  }

  function handlePick(row: IRow | null): void {
    setPickerValue(null);
    setSearch('');
    if (!row) return;
    rememberLabel(row);
    createLink.mutate({ otherId: String(row._id) });
  }

  function handleCreated(row: IRow): void {
    setIsCreateOpen(false);
    rememberLabel(row);
    createLink.mutate({ otherId: String(row._id) });
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
      <p className="text-sm text-muted-foreground">
        Relacionamento ainda não materializado.
      </p>
    );
  }

  const singleLocked = !isMultiple && orderedLinks.length >= 1;
  const showPicker = canEdit && !singleLocked;
  // Reordenar só com página única: a ordem é o índice absoluto. Com paginação,
  // índices página-relativos colidiriam com os vínculos das outras páginas.
  const singlePage = !meta || meta.lastPage <= 1;
  const canReorder = isMultiple && canEdit && singlePage;

  return (
    <div
      className="flex flex-col gap-3"
      data-slot="relationship-management-table"
    >
      {linksQuery.isLoading && (
        <div className="flex items-center justify-center p-4">
          <Spinner className="opacity-50" />
        </div>
      )}

      {!linksQuery.isLoading && orderedLinks.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum vínculo ainda.</p>
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
            <div className="flex flex-col gap-1.5">
              {orderedLinks.map((link): React.JSX.Element => {
                const otherId = otherIdOf(link, side);
                const label = labelMap.get(otherId) ?? otherId;
                return (
                  <LinkRow
                    key={link._id}
                    linkId={link._id}
                    recordId={otherId}
                    label={label}
                    href={`/tables/${otherTableSlug}/row?_id=${otherId}`}
                    sortable={canReorder}
                    canEdit={canEdit}
                    onRemove={handleRemove}
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
              onClick={(): void => setIsCreateOpen(true)}
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
