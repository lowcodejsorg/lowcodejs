import type { AnyFieldMetaBase } from '@tanstack/form-core';
import { useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import React from 'react';

import { AutoSaveStatusIndicator } from './-auto-save-status';
import { RowFormFields } from './create/-create-form';

import { GroupRowsInline } from '@/components/common/dynamic-table/group-rows';
import { ExtensionSlot } from '@/components/common/extension-slot';
import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/file-upload/uploading-context';
import { AccessDenied } from '@/components/common/route-status/access-denied';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { useAutoSaveTableRow } from '@/hooks/tanstack-query/use-table-row-auto-save';
import { useDeleteTableRow } from '@/hooks/tanstack-query/use-table-row-delete';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { useApiErrorAutoClear } from '@/integrations/tanstack-form/use-api-error-auto-clear';
import { E_FIELD_TYPE } from '@/lib/constant';
import { applyApiFieldErrors } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import type { IField, IRow, ITable } from '@/lib/interfaces';
import type { CreateRowDefaultValue } from '@/lib/table';
import {
  buildCreateRowDefaultValues,
  buildRowPayload,
  buildUpdateRowDefaultValues,
} from '@/lib/table';

interface AutoSaveRowFormProps {
  table: ITable;
  rowId?: string;
  existingRow?: IRow;
  onBack?: () => void;
  backGuardRef?: React.MutableRefObject<(() => void) | null>;
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (
    typeof value === 'object' &&
    'storages' in value &&
    Array.isArray(value.storages)
  ) {
    return value.storages.length > 0;
  }
  return false;
}

export function AutoSaveRowForm(
  props: AutoSaveRowFormProps,
): React.JSX.Element {
  return (
    <UploadingProvider>
      <AutoSaveRowFormContent {...props} />
    </UploadingProvider>
  );
}

function AutoSaveRowFormContent({
  table,
  rowId: initialRowId,
  existingRow,
  onBack,
  backGuardRef,
}: AutoSaveRowFormProps): React.JSX.Element {
  const permissions = useTablePermission(table);
  const isUploading = useIsUploading();
  const queryClient = useQueryClient();

  const isNewRecord = !initialRowId;
  const rowIdRef = React.useRef<string | undefined>(initialRowId);
  // Espelha o rowId em estado para re-renderizar a seção de grupos quando o
  // registro novo é persistido pelo auto-save (refs não disparam render).
  const [persistedRowId, setPersistedRowId] = React.useState<
    string | undefined
  >(initialRowId);
  const [isTrashed, setIsTrashed] = React.useState<boolean>(
    existingRow?.trashed ?? false,
  );
  const [missingRequired, setMissingRequired] = React.useState<boolean>(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] =
    React.useState<boolean>(false);

  const slug = table.slug;

  const fields = React.useMemo((): Array<IField> => {
    const order = table.fieldOrderForm;
    return table.fields
      .filter((f) => !f.trashed && f.showInForm)
      .sort((a: IField, b: IField): number => {
        const idxA = order.indexOf(a._id);
        const idxB = order.indexOf(b._id);
        let sortA = idxA;
        let sortB = idxB;
        if (idxA === -1) sortA = Infinity;
        if (idxB === -1) sortB = Infinity;
        return sortA - sortB;
      });
  }, [table.fields, table.fieldOrderForm]);

  const requiredFields = React.useMemo((): Array<IField> => {
    return fields.filter((f) => f.required && !f.native);
  }, [fields]);

  // Grupos de campos exibidos no formulário. Salvos à parte via endpoints
  // group-rows (precisam de rowId), não no payload do registro principal.
  const formGroupFields = React.useMemo((): Array<IField> => {
    return table.fields.filter(
      (f) => f.type === E_FIELD_TYPE.FIELD_GROUP && f.showInForm && !f.trashed,
    );
  }, [table.fields]);

  const defaultValues = React.useMemo((): CreateRowDefaultValue => {
    if (existingRow) {
      return buildUpdateRowDefaultValues(existingRow, fields);
    }
    return buildCreateRowDefaultValues(fields);
  }, [existingRow, fields]);

  // O save e disparado no blur do campo. triggerSave so existe apos o form
  // (depende de performSave), entao o listener chama atraves de um ref.
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

  useApiErrorAutoClear(form);

  const isDirty = useStore(form.store, (state) => state.isDirty);

  const _autoSave = useAutoSaveTableRow({
    onSuccess(data: IRow): void {
      setIsTrashed(data.trashed);
      if (!rowIdRef.current) {
        rowIdRef.current = data._id;
      }
      setPersistedRowId(data._id);
    },
    onError(error: AxiosError | Error): void {
      handleApiError(error, {
        context: 'Erro ao salvar o registro',
        onFieldErrors: (errors: Record<string, string>): void => {
          applyApiFieldErrors(form, errors);
        },
      });
    },
  });

  const _deleteDraft = useDeleteTableRow({
    onError(error: AxiosError | Error): void {
      handleApiError(error, { context: 'Erro ao descartar o rascunho' });
    },
  });

  const performSave = React.useCallback(async (): Promise<void> => {
    if (_autoSave.isPending) return;
    if (isUploading) return;

    const payload = buildRowPayload(form.state.values, fields);

    await _autoSave.mutateAsync({
      slug,
      rowId: rowIdRef.current,
      data: payload,
    });
  }, [_autoSave, form, fields, slug, isUploading]);

  const canSaveCallback = React.useCallback((): boolean => {
    if (rowIdRef.current) return true;
    if (requiredFields.length === 0) return false;
    return requiredFields.some((field): boolean => {
      const value = form.state.values[field.slug];
      return hasValue(value);
    });
  }, [form, requiredFields]);

  const isDirtyCallback = React.useCallback((): boolean => {
    return isDirty;
  }, [isDirty]);

  const { status, lastSavedAt, triggerSave, cancelPending } = useAutoSave({
    onSave: performSave,
    isTrashed,
    canSave: canSaveCallback,
    isDirty: isDirtyCallback,
  });

  triggerSaveRef.current = triggerSave;

  // Garante que o registro pai exista antes de adicionar itens a um grupo.
  // Sem rowId, dispara o auto-save (que persiste como rascunho via backend)
  // para obter o id e habilitar os cards do grupo.
  const ensureParentRow = React.useCallback(async (): Promise<
    string | undefined
  > => {
    cancelPending();
    if (rowIdRef.current) return rowIdRef.current;
    await performSave();
    return rowIdRef.current;
  }, [cancelPending, performSave]);

  const validateAndTouch = React.useCallback((): boolean => {
    let allValid = true;
    for (const field of requiredFields) {
      const value = form.state.values[field.slug];
      const filled = hasValue(value);
      form.setFieldMeta(
        field.slug,
        (prev: AnyFieldMetaBase): AnyFieldMetaBase => ({
          ...prev,
          isTouched: true,
        }),
      );
      if (!filled) {
        allValid = false;
        form.setFieldMeta(
          field.slug,
          (prev: AnyFieldMetaBase): AnyFieldMetaBase => ({
            ...prev,
            isTouched: true,
            errorMap: {
              ...prev.errorMap,
              onChange: field.name + ' é obrigatório',
            },
          }),
        );
      }
    }
    return allValid;
  }, [form, requiredFields]);

  const isIncompleteDraft = React.useCallback((): boolean => {
    if (!isNewRecord) return false;
    if (!rowIdRef.current) return false;
    return requiredFields.some((field): boolean => {
      return !hasValue(form.state.values[field.slug]);
    });
  }, [isNewRecord, requiredFields, form]);

  const finishAndBack = React.useCallback((): void => {
    // Sincroniza o cache uma unica vez ao sair (em vez de a cada save).
    queryClient.invalidateQueries({ queryKey: queryKeys.rows.lists(slug) });
    if (rowIdRef.current) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.detail(slug, rowIdRef.current),
      });
    }
    onBack?.();
  }, [queryClient, slug, onBack]);

  const handleSaveAndBack = async (): Promise<void> => {
    cancelPending();
    // Marca campos para feedback visual, mas nao bloqueia: registro incompleto
    // e salvo como rascunho (lixeira) pelo backend.
    const isValid = validateAndTouch();
    setMissingRequired(!isValid);
    await performSave();
    finishAndBack();
  };

  const handleFillFields = React.useCallback(
    (data: Record<string, string | null>): void => {
      const fieldSlugs = new Set(fields.map((field) => field.slug));
      for (const [key, value] of Object.entries(data)) {
        if (value === null || !fieldSlugs.has(key)) continue;
        form.setFieldValue(key, value);
      }
      triggerSave();
    },
    [fields, form, triggerSave],
  );

  const requestBack = React.useCallback((): void => {
    cancelPending();
    if (isIncompleteDraft()) {
      setConfirmDiscardOpen(true);
      return;
    }
    finishAndBack();
  }, [cancelPending, isIncompleteDraft, finishAndBack]);

  // Permite que o botao Voltar do cabecalho (renderizado pelo componente pai)
  // passe pela mesma guarda de descarte do rascunho.
  if (backGuardRef) {
    backGuardRef.current = requestBack;
  }

  const confirmDiscard = async (): Promise<void> => {
    if (rowIdRef.current) {
      await _deleteDraft.mutateAsync({ slug, rowId: rowIdRef.current });
    }
    setConfirmDiscardOpen(false);
    onBack?.();
  };

  if (!initialRowId && !permissions.can('CREATE_ROW')) {
    return <AccessDenied />;
  }

  if (initialRowId && !permissions.can('UPDATE_ROW')) {
    return <AccessDenied />;
  }

  let displayStatus = status;
  if (missingRequired) {
    displayStatus = 'draft';
  }

  return (
    <React.Fragment>
      <div className="shrink-0 px-4 py-2 flex items-center justify-between gap-2 border-b">
        <AutoSaveStatusIndicator
          status={displayStatus}
          lastSavedAt={lastSavedAt}
        />
        <div className="flex items-center gap-2 shrink-0">
          {isTrashed && (
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-400"
            >
              Rascunho
            </Badge>
          )}
          <ExtensionSlot
            id="table.row.create"
            context={{
              table,
              slug,
              onFillFields: handleFillFields,
            }}
          />
        </div>
      </div>

      <form
        className="flex-1 flex flex-col min-h-0 overflow-auto relative"
        data-test-id="auto-save-row-form"
        onSubmit={(e: React.FormEvent<HTMLFormElement>): void => {
          e.preventDefault();
        }}
      >
        <RowFormFields
          form={form}
          fields={fields}
          tableSlug={slug}
          disabled={false}
        />

        {formGroupFields.length > 0 && (
          <div className="flex flex-col gap-6 px-2 pb-4 pt-2 border-t mt-2">
            {formGroupFields.map(
              (groupField): React.JSX.Element => (
                <GroupRowsInline
                  key={groupField._id}
                  tableSlug={slug}
                  rowId={persistedRowId}
                  field={groupField}
                  table={table}
                  onEnsureParentRow={ensureParentRow}
                />
              ),
            )}
          </div>
        )}
      </form>

      <div className="shrink-0 px-4 py-3 flex justify-end gap-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={_autoSave.isPending}
          onClick={requestBack}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={_autoSave.isPending || isUploading}
          onClick={(): void => {
            void handleSaveAndBack();
          }}
        >
          {_autoSave.isPending && <Spinner />}
          <span>Salvar</span>
        </Button>
      </div>

      <Dialog
        open={confirmDiscardOpen}
        onOpenChange={setConfirmDiscardOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar rascunho?</DialogTitle>
            <DialogDescription>
              Este registro ainda não tem todos os campos obrigatórios
              preenchidos e foi salvo como rascunho na lixeira. Deseja
              descartá-lo ou mantê-lo como rascunho?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={_deleteDraft.isPending}
              onClick={(): void => {
                setConfirmDiscardOpen(false);
                finishAndBack();
              }}
            >
              Manter rascunho
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={_deleteDraft.isPending}
              onClick={(): void => {
                void confirmDiscard();
              }}
            >
              {_deleteDraft.isPending && <Spinner />}
              <span>Descartar</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}
