import { PlusIcon, TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IStorage } from '@/lib/interfaces';

interface TableRowFieldGroupFieldProps {
  field: IField;
  disabled?: boolean;
  tableSlug?: string;
  form: any; // TanStack Form instance
}

// Validator for required fields inside groups
function createNestedRequiredValidator(fieldName: string): {
  onBlur: ({ value }: { value: any }) => { message: string } | undefined;
} {
  return {
    onBlur: ({ value }: { value: any }): { message: string } | undefined => {
      if (value === null || value === undefined || value === '') {
        return { message: `${fieldName} é obrigatório` };
      }
      if (Array.isArray(value) && value.length === 0) {
        return { message: `${fieldName} é obrigatório` };
      }
      if (typeof value === 'object' && 'storages' in value) {
        const storageValue = value as { storages: Array<IStorage> };
        if (storageValue.storages.length === 0) {
          return { message: `${fieldName} é obrigatório` };
        }
      }
      return undefined;
    },
  };
}

export function TableRowFieldGroupField({
  field,
  disabled,
  form,
}: TableRowFieldGroupFieldProps): React.JSX.Element {
  const formField = useFieldContext<Array<Record<string, any>>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;
  const isMultiple = field.configuration.multiple;

  const groupConfig = field.configuration.group;

  const groupTable = useReadTable({ slug: groupConfig?.slug ?? '' });

  const items = formField.state.value ?? [{}];

  const addItem = (): void => {
    formField.handleChange([...items, {}]);
  };

  const removeItem = (index: number): void => {
    formField.handleChange(items.filter((_, i) => i !== index));
  };

  // Control based on multiple config
  const canAdd = isMultiple;
  const canRemove = isMultiple && items.length > 1;

  if (!groupConfig) {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <p className="text-muted-foreground text-sm">
          Grupo de campos não configurado
        </p>
      </Field>
    );
  }

  if (groupTable.status === 'pending') {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <div className="flex items-center justify-center py-4">
          <Spinner />
        </div>
      </Field>
    );
  }

  if (groupTable.status === 'error') {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <p className="text-destructive text-sm">
          Erro ao carregar grupo de campos
        </p>
      </Field>
    );
  }

  const groupFields = groupTable.data.fields.filter((f) => !f.trashed);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <div className="space-y-4">
        {items.map((_, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-4 bg-muted/30"
          >
            <div className="flex justify-between items-center">
              {/* <span className="text-sm font-medium">Item {index + 1}</span> */}
              {canRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() => removeItem(index)}
                >
                  <TrashIcon className="size-4" />
                </Button>
              )}
            </div>
            {groupFields.map((groupField) => (
              <NestedGroupField
                key={groupField._id}
                form={form}
                parentSlug={field.slug}
                index={index}
                groupField={groupField}
                disabled={disabled}
              />
            ))}
          </div>
        ))}
        {canAdd && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={addItem}
          >
            <PlusIcon className="size-4" />
            <span>Adicionar item</span>
          </Button>
        )}
      </div>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}

// Nested field with REAL validation
function NestedGroupField({
  form,
  parentSlug,
  index,
  groupField,
  disabled,
}: {
  form: any;
  parentSlug: string;
  index: number;
  groupField: IField;
  disabled?: boolean;
}): React.JSX.Element | null {
  // Skip non-editable field types
  if (
    groupField.type === E_FIELD_TYPE.REACTION ||
    groupField.type === E_FIELD_TYPE.EVALUATION ||
    groupField.type === E_FIELD_TYPE.FIELD_GROUP
  ) {
    return null;
  }

  // Field name in format: "addresses[0].street"
  const fieldName = `${parentSlug}[${index}].${groupField.slug}`;
  const isRequired = groupField.configuration.required;

  return (
    <form.AppField
      name={fieldName}
      validators={
        isRequired ? createNestedRequiredValidator(groupField.name) : undefined
      }
    >
      {(formField: any) => {
        switch (groupField.type) {
          case E_FIELD_TYPE.TEXT_SHORT:
            return (
              <formField.TableRowTextField
                field={groupField}
                disabled={disabled}
              />
            );
          case E_FIELD_TYPE.TEXT_LONG:
            return (
              <formField.TableRowTextareaField
                field={groupField}
                disabled={disabled}
              />
            );
          case E_FIELD_TYPE.DROPDOWN:
            return (
              <formField.TableRowDropdownField
                field={groupField}
                disabled={disabled}
              />
            );
          case E_FIELD_TYPE.DATE:
            return (
              <formField.TableRowDateField
                field={groupField}
                disabled={disabled}
              />
            );
          case E_FIELD_TYPE.FILE:
            return (
              <formField.TableRowFileField
                field={groupField}
                disabled={disabled}
              />
            );
          case E_FIELD_TYPE.RELATIONSHIP:
            return (
              <formField.TableRowRelationshipField
                field={groupField}
                disabled={disabled}
              />
            );
          case E_FIELD_TYPE.CATEGORY:
            return (
              <formField.TableRowCategoryField
                field={groupField}
                disabled={disabled}
              />
            );
          default:
            return null;
        }
      }}
    </form.AppField>
  );
}
