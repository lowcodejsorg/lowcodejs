import { useNavigate, useSearch } from '@tanstack/react-router';
import React from 'react';

import { RowFormFields } from './-create-form';

import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/file-upload/uploading-context';
import { AccessDenied } from '@/components/common/route-status/access-denied';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { SaveStatusIndicator, useRowAutoSave } from '@/hooks/use-row-auto-save';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { ITable } from '@/lib/interfaces';
import { buildCreateRowDefaultValues } from '@/lib/table';

interface CreateRowFormProps {
  table: ITable;
}

export function CreateRowForm(props: CreateRowFormProps): React.JSX.Element {
  return (
    <UploadingProvider>
      <CreateRowFormContent {...props} />
    </UploadingProvider>
  );
}

function CreateRowFormContent({
  table,
}: CreateRowFormProps): React.JSX.Element {
  const permissions = useTablePermission(table);
  const isUploading = useIsUploading();

  const { categoryId, categorySlug } = useSearch({
    from: '/_private/tables/$slug/row/create/',
  });

  const sidebar = useSidebar();
  const navigate = useNavigate();

  const fields = React.useMemo(() => {
    const order = table.fieldOrderForm;
    return table.fields
      .filter((f) => !f.trashed && f.showInForm)
      .sort((a, b) => {
        const idxA = order.indexOf(a._id);
        const idxB = order.indexOf(b._id);
        return (
          (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB)
        );
      });
  }, [table.fields, table.fieldOrderForm]);

  const form = useAppForm({
    defaultValues: buildCreateRowDefaultValues(fields),
    onSubmit: async (): Promise<void> => {},
  });

  const {
    isSaving,
    isError,
    lastSavedAt,
    isDraft,
    triggerSaveImmediate,
    triggerSaveDebounced,
    cancelDebounce,
  } = useRowAutoSave({
    tableSlug: table.slug,
    fields,
    onFirstSave(rowId: string): void {
      navigate({
        to: '/tables/$slug/row/$rowId',
        params: { slug: table.slug, rowId },
        search: { mode: 'edit' },
        replace: true,
      });
    },
  });

  const handleBlurSave = React.useCallback((): void => {
    if (isUploading) return;
    void triggerSaveImmediate(form.store.state.values);
  }, [isUploading, triggerSaveImmediate, form]);

  const handleSelectionChange = React.useCallback((): void => {
    if (isUploading) return;
    triggerSaveDebounced(form.store.state.values);
  }, [isUploading, triggerSaveDebounced, form]);

  React.useEffect(() => {
    const timer = setInterval((): void => {
      if (!isUploading) {
        void triggerSaveImmediate(form.store.state.values);
      }
    }, 30_000);
    return (): void => clearInterval(timer);
  }, [isUploading, triggerSaveImmediate, form]);

  const [prefillApplied, setPrefillApplied] = React.useState(false);

  React.useEffect(() => {
    if (!categoryId || !categorySlug) return;
    if (prefillApplied) return;

    const targetField = fields.find(
      (field) =>
        field.slug === categorySlug && field.type === E_FIELD_TYPE.CATEGORY,
    );

    if (!targetField) return;

    // CATEGORY form value is always an array (single or multiple),
    // and payload normalization handles limiting when multiple=false.
    form.setFieldValue(categorySlug, [categoryId]);
    setPrefillApplied(true);
  }, [fields, categoryId, categorySlug, form, prefillApplied]);

  if (!permissions.can('CREATE_ROW')) return <AccessDenied />;

  return (
    <React.Fragment>
      <div className="shrink-0 border-b p-2">
        <div className="flex items-center justify-between gap-2">
          <SaveStatusIndicator
            isSaving={isSaving}
            isError={isError}
            lastSavedAt={lastSavedAt}
            isDraft={isDraft}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="px-2 cursor-pointer"
              data-test-id="create-row-cancel-btn"
              onClick={(): void => {
                sidebar.setOpen(false);
                navigate({
                  to: '/tables/$slug',
                  replace: true,
                  params: { slug: table.slug },
                });
              }}
            >
              <span>Cancelar</span>
            </Button>
            <Button
              type="button"
              size="sm"
              className="disabled:cursor-not-allowed px-2 cursor-pointer"
              data-test-id="create-row-save-btn"
              disabled={isSaving || isUploading}
              onClick={(): void => {
                cancelDebounce();
                void triggerSaveImmediate(form.store.state.values);
              }}
            >
              {isSaving && <Spinner />}
              <span>Salvar</span>
            </Button>
          </div>
        </div>
      </div>

      <form
        className="flex-1 flex flex-col min-h-0 overflow-auto relative"
        data-test-id="create-row-form"
        onSubmit={(e: React.FormEvent<HTMLFormElement>): void => {
          e.preventDefault();
        }}
      >
        <RowFormFields
          form={form}
          fields={fields}
          disabled={false}
          tableSlug={table.slug}
          onBlurSave={handleBlurSave}
          onSelectionChange={handleSelectionChange}
        />
      </form>
    </React.Fragment>
  );
}
