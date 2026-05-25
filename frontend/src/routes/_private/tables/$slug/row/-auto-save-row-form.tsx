import type { AxiosError } from 'axios';
import React from 'react';

import { AutoSaveStatusIndicator } from './-auto-save-status';
import { RowFormFields } from './create/-create-form';

import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/file-upload/uploading-context';
import { AccessDenied } from '@/components/common/route-status/access-denied';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAutoSaveTableRow } from '@/hooks/tanstack-query/use-table-row-auto-save';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { useApiErrorAutoClear } from '@/integrations/tanstack-form/use-api-error-auto-clear';
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
  onRowCreated?: (rowId: string) => void;
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
  onRowCreated,
}: AutoSaveRowFormProps): React.JSX.Element {
  const permissions = useTablePermission(table);
  const isUploading = useIsUploading();

  const rowIdRef = React.useRef<string | undefined>(initialRowId);
  const [isTrashed, setIsTrashed] = React.useState<boolean>(
    existingRow?.trashed ?? false,
  );

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

  const defaultValues = React.useMemo((): CreateRowDefaultValue => {
    if (existingRow) {
      return buildUpdateRowDefaultValues(existingRow, fields);
    }
    return buildCreateRowDefaultValues(fields);
  }, [existingRow, fields]);

  const form = useAppForm({
    defaultValues,
    onSubmit: async (): Promise<void> => {},
  });

  useApiErrorAutoClear(form);

  const _autoSave = useAutoSaveTableRow({
    onSuccess(data: IRow): void {
      setIsTrashed(data.trashed);
      if (!rowIdRef.current) {
        rowIdRef.current = data._id;
        onRowCreated?.(data._id);
      }
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

  const { status, lastSavedAt, triggerSave } = useAutoSave({
    onSave: performSave,
    isTrashed,
  });

  const handleFormBlur = (): void => {
    triggerSave();
  };

  const handleSaveAndBack = async (): Promise<void> => {
    await performSave();
    onBack?.();
  };

  if (!initialRowId && !permissions.can('CREATE_ROW')) {
    return <AccessDenied />;
  }

  if (initialRowId && !permissions.can('UPDATE_ROW')) {
    return <AccessDenied />;
  }

  return (
    <React.Fragment>
      <div className="shrink-0 px-4 py-2 flex items-center justify-between border-b">
        <AutoSaveStatusIndicator
          status={status}
          lastSavedAt={lastSavedAt}
        />
        {isTrashed && (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-400"
          >
            Rascunho
          </Badge>
        )}
      </div>

      <form
        className="flex-1 flex flex-col min-h-0 overflow-auto relative"
        data-test-id="auto-save-row-form"
        onBlur={handleFormBlur}
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
      </form>

      <div className="shrink-0 px-4 py-3 flex justify-end gap-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={_autoSave.isPending}
          onClick={onBack}
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
    </React.Fragment>
  );
}
