import { useStore } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { PlusIcon, TrashIcon } from 'lucide-react';
import React from 'react';

import {
  buildGroupRowPayload,
  getFieldDefault,
  renderGroupFormField,
  transformFieldValueForEdit,
} from './group-row-form-helpers';

import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/file-upload/uploading-context';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { groupRowListOptions } from '@/hooks/tanstack-query/_query-options';
import { useAutoSaveGroupRow } from '@/hooks/tanstack-query/use-group-row-auto-save';
import { useDeleteGroupRow } from '@/hooks/tanstack-query/use-group-row-delete';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_TYPE } from '@/lib/constant';
import { handleApiError } from '@/lib/handle-api-error';
import type {
  IField,
  IGroupConfiguration,
  IRow,
  ITable,
} from '@/lib/interfaces';
import { buildFieldValidator } from '@/lib/table';
import { AutoSaveStatusIndicator } from '@/routes/_private/tables/$slug/row/-auto-save-status';

interface GroupRowsInlineProps {
  tableSlug: string;
  rowId?: string;
  field: IField;
  table: ITable;
  // Garante que o registro pai exista (auto-save como rascunho) e devolve o
  // rowId. Usado ao adicionar o primeiro item antes de salvar o pai.
  onEnsureParentRow: () => Promise<string | undefined>;
}

type Card = {
  key: string;
  item: IRow | null;
};

export function GroupRowsInline(
  props: GroupRowsInlineProps,
): React.JSX.Element {
  const { tableSlug, rowId, field, table, onEnsureParentRow } = props;

  const groupSlug = field.group?.slug;

  const group: IGroupConfiguration | undefined = table.groups?.find(
    (g) => g?.slug === groupSlug,
  );

  const formFields = React.useMemo(
    (): Array<IField> =>
      (group?.fields ?? []).filter(
        (f): f is IField =>
          !!f &&
          f.type !== E_FIELD_TYPE.FIELD_GROUP &&
          f.type !== E_FIELD_TYPE.IDENTIFIER &&
          f.type !== E_FIELD_TYPE.STATUS &&
          f.type !== E_FIELD_TYPE.TRASHED_AT &&
          !f.trashed &&
          f.showInForm,
      ),
    [group],
  );

  const { data, status } = useQuery(
    groupRowListOptions(tableSlug, rowId ?? '', groupSlug ?? ''),
  );

  const [cards, setCards] = React.useState<Array<Card>>([]);
  const seededRef = React.useRef<boolean>(false);
  const tempKeyRef = React.useRef<number>(0);
  const [adding, setAdding] = React.useState<boolean>(false);

  // Semeia os cards a partir dos itens persistidos uma unica vez, preservando
  // os cards novos (item===null) adicionados localmente nesta sessao.
  React.useEffect((): void => {
    if (seededRef.current) return;
    if (status !== 'success') return;
    seededRef.current = true;
    setCards((prev) => {
      const existing: Array<Card> = (data ?? []).map((item) => ({
        key: String(item._id),
        item,
      }));
      const localNew = prev.filter((c) => c.item === null);
      return [...existing, ...localNew];
    });
  }, [status, data]);

  const removeCard = React.useCallback((key: string): void => {
    setCards((prev) => prev.filter((c) => c.key !== key));
  }, []);

  const isSingle = field.multiple === false;
  const addDisabled = (isSingle && cards.length >= 1) || adding;

  const handleAdd = React.useCallback(async (): Promise<void> => {
    if (addDisabled) return;
    setAdding(true);
    try {
      let ensuredRowId = rowId;
      if (!ensuredRowId) {
        ensuredRowId = await onEnsureParentRow();
      }
      if (!ensuredRowId) return;
      tempKeyRef.current += 1;
      const key = `new-${tempKeyRef.current.toString()}`;
      setCards((prev) => [...prev, { key, item: null }]);
    } finally {
      setAdding(false);
    }
  }, [addDisabled, rowId, onEnsureParentRow]);

  if (!groupSlug || !group) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <div
      data-slot="group-rows-inline"
      data-test-id="group-rows-inline"
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium ml-2">{field.name}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(): void => {
            void handleAdd();
          }}
          disabled={addDisabled}
        >
          {adding && <Spinner />}
          {!adding && <PlusIcon className="size-4" />}
          <span>Adicionar item</span>
        </Button>
      </div>

      {cards.length === 0 && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Nenhum item adicionado.
        </p>
      )}

      <div className="space-y-3">
        {cards.map((card, index) => (
          <GroupItemCard
            key={card.key}
            index={index}
            tableSlug={tableSlug}
            rowId={rowId ?? ''}
            groupSlug={groupSlug}
            fields={formFields}
            item={card.item}
            onRemove={(): void => removeCard(card.key)}
          />
        ))}
      </div>
    </div>
  );
}

interface GroupItemCardProps {
  index: number;
  tableSlug: string;
  rowId: string;
  groupSlug: string;
  fields: Array<IField>;
  item: IRow | null;
  onRemove: () => void;
}

function GroupItemCard(props: GroupItemCardProps): React.JSX.Element {
  return (
    <UploadingProvider>
      <GroupItemCardContent {...props} />
    </UploadingProvider>
  );
}

function GroupItemCardContent({
  index,
  tableSlug,
  rowId,
  groupSlug,
  fields,
  item,
  onRemove,
}: GroupItemCardProps): React.JSX.Element {
  const isUploading = useIsUploading();

  const itemIdRef = React.useRef<string | undefined>(item?._id);
  const [isDraft, setIsDraft] = React.useState<boolean>(
    item?.status === 'draft',
  );

  const defaultValues = React.useMemo((): Record<string, unknown> => {
    const defaults: Record<string, unknown> = {};
    for (const field of fields) {
      if (item) {
        defaults[field.slug] = transformFieldValueForEdit(
          item[field.slug],
          field,
        );
      } else {
        defaults[field.slug] = getFieldDefault(field);
      }
    }
    return defaults;
  }, [fields, item]);

  const triggerSaveRef = React.useRef<() => void>((): void => {});

  const form = useAppForm({
    defaultValues,
    onSubmit: async (): Promise<void> => {},
    listeners: {
      onBlur: (): void => {
        triggerSaveRef.current();
      },
    },
  });

  const isDirty = useStore(form.store, (state) => state.isDirty);

  const _autoSave = useAutoSaveGroupRow({
    onSuccess(data: IRow): void {
      if (!itemIdRef.current) {
        itemIdRef.current = data._id;
      }
      setIsDraft(data.status === 'draft');
    },
    onError(error: AxiosError | Error): void {
      handleApiError(error, { context: 'Erro ao salvar o item' });
    },
  });

  const _delete = useDeleteGroupRow({
    onError(error: AxiosError | Error): void {
      handleApiError(error, { context: 'Erro ao remover o item' });
    },
  });

  const performSave = React.useCallback(async (): Promise<void> => {
    if (_autoSave.isPending) return;
    if (isUploading) return;
    const payload = buildGroupRowPayload(form.state.values, fields);
    await _autoSave.mutateAsync({
      tableSlug,
      rowId,
      groupSlug,
      itemId: itemIdRef.current,
      data: payload,
    });
  }, [_autoSave, isUploading, form, fields, tableSlug, rowId, groupSlug]);

  const isDirtyCallback = React.useCallback((): boolean => {
    return isDirty;
  }, [isDirty]);

  const { status, lastSavedAt, triggerSave, cancelPending } = useAutoSave({
    onSave: performSave,
    isDraft,
    canSave: isDirtyCallback,
    isDirty: isDirtyCallback,
  });

  triggerSaveRef.current = triggerSave;

  const handleRemove = React.useCallback(async (): Promise<void> => {
    cancelPending();
    if (itemIdRef.current) {
      await _delete.mutateAsync({
        tableSlug,
        rowId,
        groupSlug,
        itemId: itemIdRef.current,
      });
    }
    onRemove();
  }, [cancelPending, _delete, tableSlug, rowId, groupSlug, onRemove]);

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {`Item ${(index + 1).toString()}`}
          </span>
          <AutoSaveStatusIndicator
            status={status}
            lastSavedAt={lastSavedAt}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={_delete.isPending}
          onClick={(): void => {
            void handleRemove();
          }}
        >
          {_delete.isPending && <Spinner />}
          {!_delete.isPending && <TrashIcon className="size-3.5" />}
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <form.AppField
            key={field._id}
            name={field.slug}
            validators={{
              onChange: ({ value }: { value: any }) =>
                buildFieldValidator(field, value),
            }}
          >
            {(formField: any) =>
              renderGroupFormField(formField, field, tableSlug, groupSlug)
            }
          </form.AppField>
        ))}
      </div>
    </div>
  );
}
