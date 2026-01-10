/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow, IStorage } from '@/lib/interfaces';

type SearchableOption = {
  value: string;
  label: string;
};

// Build default values from existing row data
export function buildDefaultValuesFromRow(
  data: IRow,
  fields: Array<IField>,
): Record<string, any> {
  const defaults: Record<string, any> = {};

  for (const field of fields) {
    if (field.trashed) continue;

    const existingValue = data[field.slug];

    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        defaults[field.slug] = existingValue ?? '';
        break;
      case E_FIELD_TYPE.DROPDOWN: {
        // Always array - convert single value to array if needed
        const values = Array.isArray(existingValue)
          ? existingValue
          : existingValue
            ? [existingValue]
            : [];
        defaults[field.slug] = values.map((v: string) => ({
          value: v,
          label: v,
        }));
        break;
      }
      case E_FIELD_TYPE.DATE:
        defaults[field.slug] = existingValue ?? '';
        break;
      case E_FIELD_TYPE.FILE:
        defaults[field.slug] = {
          files: [] as Array<File>,
          storages: (existingValue as Array<IStorage>) ?? [],
        };
        break;
      case E_FIELD_TYPE.RELATIONSHIP: {
        const relationshipFieldSlug =
          field.configuration.relationship?.field?.slug;

        if (field.configuration.multiple) {
          const values = (existingValue as Array<Record<string, any>>) ?? [];
          defaults[field.slug] = values.map((v) => ({
            value: v._id,
            label:
              relationshipFieldSlug && v[relationshipFieldSlug]
                ? String(v[relationshipFieldSlug])
                : v._id,
          }));
        } else {
          const value = existingValue as Record<string, any> | null;
          defaults[field.slug] = value
            ? [
                {
                  value: value._id,
                  label:
                    relationshipFieldSlug && value[relationshipFieldSlug]
                      ? String(value[relationshipFieldSlug])
                      : value._id,
                },
              ]
            : [];
        }
        break;
      }
      case E_FIELD_TYPE.CATEGORY: {
        // Always array - convert single value to array if needed
        const categoryValue = Array.isArray(existingValue)
          ? existingValue
          : existingValue
            ? [existingValue]
            : [];
        defaults[field.slug] = categoryValue;
        break;
      }
      case E_FIELD_TYPE.FIELD_GROUP:
        // Ensure it's always an array
        if (Array.isArray(existingValue) && existingValue.length > 0) {
          defaults[field.slug] = existingValue;
        } else if (
          existingValue &&
          typeof existingValue === 'object' &&
          !Array.isArray(existingValue)
        ) {
          // Convert old object format to array format
          defaults[field.slug] = [existingValue];
        } else {
          defaults[field.slug] = [{}];
        }
        break;
      default:
        defaults[field.slug] = existingValue ?? '';
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
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        payload[field.slug] = value || null;
        break;
      case E_FIELD_TYPE.DROPDOWN: {
        const dropdownValue = (value as Array<string>) || [];
        if (field.configuration.multiple) {
          payload[field.slug] = dropdownValue;
        } else {
          payload[field.slug] = dropdownValue.slice(0, 1);
        }
        break;
      }
      case E_FIELD_TYPE.DATE:
        payload[field.slug] = value || null;
        break;
      case E_FIELD_TYPE.FILE: {
        const fileValue = value as {
          files: Array<File>;
          storages: Array<IStorage>;
        };
        if (field.configuration.multiple) {
          payload[field.slug] = fileValue.storages.map((s) => s._id);
        } else {
          // Always array, but limit to 1 item
          payload[field.slug] = fileValue.storages
            .slice(0, 1)
            .map((s) => s._id);
        }
        break;
      }
      case E_FIELD_TYPE.RELATIONSHIP: {
        const relValue = (value as Array<SearchableOption>) || [];
        if (field.configuration.multiple) {
          payload[field.slug] = relValue.map((opt) => opt.value);
        } else {
          // Always array, but limit to 1 item
          payload[field.slug] = relValue.slice(0, 1).map((opt) => opt.value);
        }
        break;
      }
      case E_FIELD_TYPE.CATEGORY: {
        const categoryValue = Array.isArray(value)
          ? value
          : value
            ? [value]
            : [];
        if (field.configuration.multiple) {
          payload[field.slug] = categoryValue;
        } else {
          // Always array, but limit to 1 item
          payload[field.slug] = categoryValue.slice(0, 1);
        }
        break;
      }
      case E_FIELD_TYPE.FIELD_GROUP: {
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

interface UpdateRowFormFieldsProps {
  form: any;
  activeFields: Array<IField>;
  disabled: boolean;
  tableSlug: string;
}

export function UpdateRowFormFields({
  form,
  activeFields,
  disabled,
  tableSlug,
}: UpdateRowFormFieldsProps): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      {activeFields.map((field) => {
        // Skip non-editable field types
        if (
          field.type === E_FIELD_TYPE.REACTION ||
          field.type === E_FIELD_TYPE.EVALUATION
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
                case E_FIELD_TYPE.TEXT_SHORT:
                  return (
                    <formField.TableRowTextField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.TEXT_LONG:
                  if (field.configuration.format === E_FIELD_FORMAT.RICH_TEXT) {
                    return (
                      <formField.TableRowRichTextField
                        field={field}
                        disabled={disabled}
                      />
                    );
                  }

                  return (
                    <formField.TableRowTextareaField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.DROPDOWN:
                  return (
                    <formField.TableRowDropdownField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.DATE:
                  return (
                    <formField.TableRowDateField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.FILE:
                  return (
                    <formField.TableRowFileField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.RELATIONSHIP:
                  return (
                    <formField.TableRowRelationshipField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.CATEGORY:
                  return (
                    <formField.TableRowCategoryField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.FIELD_GROUP:
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
