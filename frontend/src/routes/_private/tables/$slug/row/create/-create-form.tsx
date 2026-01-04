/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { ComboboxOption } from '@/components/ui/combobox';
import { FIELD_TYPE } from '@/lib/constant';
import type { IField, IStorage } from '@/lib/interfaces';

type SearchableOption = {
  value: string;
  label: string;
};

// Helper: Build default values based on table fields
export function buildDefaultValues(fields: Array<IField>): Record<string, any> {
  const defaults: Record<string, any> = {};

  for (const field of fields) {
    if (field.trashed) continue;

    switch (field.type) {
      case FIELD_TYPE.TEXT_SHORT:
      case FIELD_TYPE.TEXT_LONG:
        defaults[field.slug] = field.configuration.defaultValue ?? '';
        break;
      case FIELD_TYPE.DROPDOWN:
        defaults[field.slug] = []; // Always array
        break;
      case FIELD_TYPE.DATE:
        defaults[field.slug] = '';
        break;
      case FIELD_TYPE.FILE:
        defaults[field.slug] = {
          files: [] as Array<File>,
          storages: [] as Array<IStorage>,
        };
        break;
      case FIELD_TYPE.RELATIONSHIP:
        defaults[field.slug] = [];
        break;
      case FIELD_TYPE.CATEGORY:
        defaults[field.slug] = []; // Always array
        break;
      case FIELD_TYPE.FIELD_GROUP:
        defaults[field.slug] = [{}];
        break;
      default:
        defaults[field.slug] = '';
    }
  }

  return defaults;
}

// Helper: Build payload for API
export function buildPayload(
  values: Record<string, any>,
  fields: Array<IField>,
): Record<string, any> {
  const payload: Record<string, any> = {};

  for (const field of fields) {
    if (field.trashed) continue;

    const value = values[field.slug];

    switch (field.type) {
      case FIELD_TYPE.TEXT_SHORT:
      case FIELD_TYPE.TEXT_LONG:
        payload[field.slug] = value || null;
        break;
      case FIELD_TYPE.DROPDOWN: {
        const dropdownValue = (value as Array<ComboboxOption>) || [];
        if (field.configuration.multiple) {
          payload[field.slug] = dropdownValue.map((opt) => opt.value);
        } else {
          // Always array, but limit to 1 item
          payload[field.slug] = dropdownValue.slice(0, 1).map((opt) => opt.value);
        }
        break;
      }
      case FIELD_TYPE.DATE:
        payload[field.slug] = value || null;
        break;
      case FIELD_TYPE.FILE: {
        const fileValue = value as {
          files: Array<File>;
          storages: Array<IStorage>;
        };
        if (field.configuration.multiple) {
          payload[field.slug] = fileValue.storages.map((s) => s._id);
        } else {
          // Always array, but limit to 1 item
          payload[field.slug] = fileValue.storages.slice(0, 1).map((s) => s._id);
        }
        break;
      }
      case FIELD_TYPE.RELATIONSHIP: {
        const relValue = (value as Array<SearchableOption>) || [];
        if (field.configuration.multiple) {
          payload[field.slug] = relValue.map((opt) => opt.value);
        } else {
          // Always array, but limit to 1 item
          payload[field.slug] = relValue.slice(0, 1).map((opt) => opt.value);
        }
        break;
      }
      case FIELD_TYPE.CATEGORY: {
        const categoryValue = Array.isArray(value) ? value : value ? [value] : [];
        if (field.configuration.multiple) {
          payload[field.slug] = categoryValue;
        } else {
          // Always array, but limit to 1 item
          payload[field.slug] = categoryValue.slice(0, 1);
        }
        break;
      }
      case FIELD_TYPE.FIELD_GROUP: {
        const groupValue = value as Array<Record<string, any>>;
        // Always send as array, but limit to 1 item if multiple=false
        if (field.configuration.multiple) {
          payload[field.slug] = groupValue || [];
        } else {
          payload[field.slug] = groupValue?.slice(0, 1) || [];
        }
        break;
      }
      default:
        payload[field.slug] = value || null;
    }
  }

  return payload;
}

// Validator for required fields
export function createRequiredValidator(fieldName: string) {
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

interface CreateRowFormFieldsProps {
  form: any;
  activeFields: Array<IField>;
  disabled: boolean;
  tableSlug: string;
}

export function CreateRowFormFields({
  form,
  activeFields,
  disabled,
  tableSlug,
}: CreateRowFormFieldsProps): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      {activeFields.map((field) => {
        // Skip non-editable field types
        if (
          field.type === FIELD_TYPE.REACTION ||
          field.type === FIELD_TYPE.EVALUATION
        ) {
          return null;
        }

        const isRequired = field.configuration.required;

        return (
          <form.AppField
            key={field._id}
            name={field.slug}
            validators={
              isRequired ? createRequiredValidator(field.name) : undefined
            }
          >
            {(formField: any) => {
              switch (field.type) {
                case FIELD_TYPE.TEXT_SHORT:
                  return (
                    <formField.TableRowTextField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.TEXT_LONG:
                  return (
                    <formField.TableRowTextareaField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.DROPDOWN:
                  return (
                    <formField.TableRowDropdownField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.DATE:
                  return (
                    <formField.TableRowDateField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.FILE:
                  return (
                    <formField.TableRowFileField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.RELATIONSHIP:
                  return (
                    <formField.TableRowRelationshipField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.CATEGORY:
                  return (
                    <formField.TableRowCategoryField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.FIELD_GROUP:
                  return (
                    <formField.TableRowFieldGroupField
                      field={field}
                      disabled={disabled}
                      tableSlug={tableSlug}
                      form={form}
                    />
                  );
                default:
                  return null;
              }
            }}
          </form.AppField>
        );
      })}
    </section>
  );
}
