import React from 'react';

import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/file-upload/uploading-context';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { useCreateGroupRow } from '@/hooks/tanstack-query/use-group-row-create';
import { useUpdateGroupRow } from '@/hooks/tanstack-query/use-group-row-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import { handleApiError } from '@/lib/handle-api-error';
import type { IField, IRow, IStorage, IUser } from '@/lib/interfaces';
import { buildFieldValidator } from '@/lib/table';
import { toastSuccess } from '@/lib/toast';

interface GroupRowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableSlug: string;
  rowId: string;
  groupSlug: string;
  groupFields: Array<IField>;
  editItem?: IRow | null;
}

export function GroupRowFormDialog(
  props: GroupRowFormDialogProps,
): React.JSX.Element {
  return (
    <Sheet
      data-slot="group-row-form-dialog"
      data-test-id="group-row-form-dialog"
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full overflow-y-auto px-4"
      >
        <UploadingProvider>
          <GroupRowFormDialogContent {...props} />
        </UploadingProvider>
      </SheetContent>
    </Sheet>
  );
}

function GroupRowFormDialogContent({
  onOpenChange,
  tableSlug,
  rowId,
  groupSlug,
  groupFields,
  editItem,
}: GroupRowFormDialogProps): React.JSX.Element {
  const isEdit = Boolean(editItem);
  const isUploading = useIsUploading();

  const visibleFields = React.useMemo(
    () => groupFields.filter((f) => f.showInForm),
    [groupFields],
  );

  const defaultValues = React.useMemo(() => {
    const defaults: Record<string, any> = {};
    for (const field of visibleFields) {
      if (isEdit && editItem) {
        defaults[field.slug] = transformFieldValueForEdit(
          editItem[field.slug],
          field,
        );
      } else {
        defaults[field.slug] = getFieldDefault(field);
      }
    }
    return defaults;
  }, [visibleFields, editItem, isEdit]);

  const _create = useCreateGroupRow({
    onSuccess() {
      toastSuccess('Item criado', 'O item foi criado com sucesso');
      onOpenChange(false);
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao criar item' });
    },
  });

  const _update = useUpdateGroupRow({
    onSuccess() {
      toastSuccess('Item atualizado', 'O item foi atualizado com sucesso');
      onOpenChange(false);
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao atualizar item' });
    },
  });

  const isPending =
    _create.status === 'pending' || _update.status === 'pending';

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (isPending) return;
      const payload = buildGroupRowPayload(value, visibleFields);

      if (isEdit && editItem) {
        await _update.mutateAsync({
          tableSlug,
          rowId,
          groupSlug,
          itemId: editItem._id,
          data: payload,
        });
      } else {
        await _create.mutateAsync({
          tableSlug,
          rowId,
          groupSlug,
          data: payload,
        });
      }
    },
  });

  return (
    <React.Fragment>
      <SheetHeader className="px-0">
        <SheetTitle>
          {isEdit && 'Editar item'}
          {!isEdit && 'Adicionar item'}
        </SheetTitle>
      </SheetHeader>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {visibleFields.map((field) => (
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
      </form>

      <SheetFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit]}
          children={([canSubmit]) => (
            <Button
              type="button"
              data-test-id="group-row-submit-btn"
              disabled={!canSubmit || isPending || isUploading}
              onClick={() => form.handleSubmit()}
            >
              {isPending && <Spinner />}
              <span>
                {isEdit && 'Salvar'}
                {!isEdit && 'Criar'}
              </span>
            </Button>
          )}
        />
      </SheetFooter>
    </React.Fragment>
  );
}

function toArray<T>(value: unknown): Array<T> {
  if (Array.isArray(value)) return value as Array<T>;
  if (value !== null && value !== undefined) return [value] as Array<T>;
  return [];
}

function transformFieldValueForEdit(value: unknown, field: IField): any {
  if (value === null || value === undefined) {
    return getFieldDefault(field);
  }

  switch (field.type) {
    case E_FIELD_TYPE.TEXT_SHORT:
    case E_FIELD_TYPE.TEXT_LONG:
      return value || '';

    case E_FIELD_TYPE.DATE:
      return value ?? '';

    case E_FIELD_TYPE.DROPDOWN:
    case E_FIELD_TYPE.CATEGORY: {
      return toArray<string>(value);
    }

    case E_FIELD_TYPE.FILE: {
      const storages = toArray<IStorage>(value);
      return { files: [], storages };
    }

    case E_FIELD_TYPE.RELATIONSHIP: {
      const rows = toArray<IRow>(value);
      const relConfig = field.relationship;
      const labelField = relConfig?.field.slug ?? '_id';

      return rows.map((row) => ({
        value: row._id,
        label: String(row[labelField] ?? row._id),
      }));
    }

    case E_FIELD_TYPE.USER: {
      const users = toArray<IUser>(value);
      return users.map((user) => {
        if (typeof user === 'object' && user !== null) {
          return { value: user._id, label: user.name };
        }
        return { value: String(user), label: String(user) };
      });
    }

    default:
      return value ?? '';
  }
}

function getFieldDefault(field: IField): any {
  switch (field.type) {
    case E_FIELD_TYPE.TEXT_SHORT:
    case E_FIELD_TYPE.TEXT_LONG:
      return field.defaultValue ?? '';
    case E_FIELD_TYPE.DATE:
      if (typeof field.defaultValue === 'string' && field.defaultValue) {
        return field.defaultValue;
      }
      return '';
    case E_FIELD_TYPE.DROPDOWN:
      if (Array.isArray(field.defaultValue) && field.defaultValue.length > 0) {
        return field.defaultValue;
      }
      return [];
    case E_FIELD_TYPE.CATEGORY:
      if (Array.isArray(field.defaultValue) && field.defaultValue.length > 0) {
        return field.defaultValue;
      }
      return [];
    case E_FIELD_TYPE.RELATIONSHIP:
    case E_FIELD_TYPE.USER:
      if (Array.isArray(field.defaultValue) && field.defaultValue.length > 0) {
        return field.defaultValue.map((id: string) => ({
          value: id,
          label: '',
        }));
      }
      return [];
    case E_FIELD_TYPE.FILE:
      return { storages: [], files: [] };
    default:
      return '';
  }
}

function buildGroupRowPayload(
  values: Record<string, any>,
  fields: Array<IField>,
): Record<string, any> {
  const payload: Record<string, any> = {};

  for (const field of fields) {
    const value = values[field.slug];

    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        payload[field.slug] = value || null;
        break;
      case E_FIELD_TYPE.DROPDOWN:
      case E_FIELD_TYPE.CATEGORY: {
        let arr: Array<unknown> = [];
        if (Array.isArray(value)) {
          arr = value;
        } else if (value) {
          arr = [value];
        }
        if (field.multiple) {
          payload[field.slug] = arr;
        } else {
          payload[field.slug] = arr.slice(0, 1);
        }
        break;
      }
      case E_FIELD_TYPE.DATE:
        payload[field.slug] = value || null;
        break;
      case E_FIELD_TYPE.FILE: {
        const fileVal = value as { storages: Array<IStorage> } | null;
        if (fileVal && fileVal.storages) {
          const ids = fileVal.storages.map((s) => s._id);
          if (field.multiple) {
            payload[field.slug] = ids;
          } else {
            payload[field.slug] = ids.slice(0, 1);
          }
        } else {
          payload[field.slug] = [];
        }
        break;
      }
      case E_FIELD_TYPE.RELATIONSHIP:
      case E_FIELD_TYPE.USER: {
        let opts: Array<any> = [];
        if (Array.isArray(value)) {
          opts = value;
        }
        const ids = opts.map((o: any) => {
          if (typeof o === 'object' && o !== null) {
            return o.value ?? o._id;
          }
          return o;
        });
        if (field.multiple) {
          payload[field.slug] = ids;
        } else {
          payload[field.slug] = ids.slice(0, 1);
        }
        break;
      }
      default:
        payload[field.slug] = value || null;
    }
  }

  return payload;
}

function renderGroupFormField(
  formField: any,
  field: IField,
  tableSlug: string,
  groupSlug: string,
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
          groupSlug={groupSlug}
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
