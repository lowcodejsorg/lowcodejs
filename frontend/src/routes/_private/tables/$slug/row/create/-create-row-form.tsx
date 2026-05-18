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
import {
  SaveStatusIndicator,
  useAutoSaveController,
  useRowAutoSave,
} from '@/hooks/use-row-auto-save';
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

  const { isSaving, isError, lastSavedAt, save } = useRowAutoSave({
    tableSlug: table.slug,
    fields,
    onFirstSave(rowId) {
      navigate({
        to: '/tables/$slug/row/$rowId',
        params: { slug: table.slug, rowId },
      });
    },
  });

  useAutoSaveController({ form, save, isUploading, fields });

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
          disabled={isSaving}
          tableSlug={table.slug}
        />
      </form>

      <div className="shrink-0 border-t p-2">
        <div className="flex items-center justify-between">
          <SaveStatusIndicator
            isSaving={isSaving}
            isError={isError}
            lastSavedAt={lastSavedAt}
          />
          <Button
            type="button"
            variant="outline"
            className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
            data-test-id="create-row-cancel-btn"
            disabled={isSaving}
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
        </div>
      </div>
    </React.Fragment>
  );
}
