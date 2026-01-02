/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { Option } from '@/components/common/-multi-selector';
import { FIELD_TYPE } from '@/lib/constant';
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
      case FIELD_TYPE.TEXT_SHORT:
      case FIELD_TYPE.TEXT_LONG:
        defaults[field.slug] = existingValue ?? '';
        break;
      case FIELD_TYPE.DROPDOWN:
        if (field.configuration.multiple) {
          const values = (existingValue as Array<string>) ?? [];
          defaults[field.slug] = values.map((v) => ({ value: v, label: v }));
        } else {
          defaults[field.slug] = existingValue ?? '';
        }
        break;
      case FIELD_TYPE.DATE:
        defaults[field.slug] = existingValue ?? '';
        break;
      case FIELD_TYPE.FILE:
        defaults[field.slug] = {
          files: [] as Array<File>,
          storages: (existingValue as Array<IStorage>) ?? [],
        };
        break;
      case FIELD_TYPE.RELATIONSHIP:
        if (field.configuration.multiple) {
          const values = (existingValue as Array<{ _id: string }>) ?? [];
          defaults[field.slug] = values.map((v) => ({
            value: v._id,
            label: v._id,
          }));
        } else {
          const value = existingValue as { _id: string } | null;
          defaults[field.slug] = value
            ? [{ value: value._id, label: value._id }]
            : [];
        }
        break;
      case FIELD_TYPE.CATEGORY:
        defaults[field.slug] =
          existingValue ?? (field.configuration.multiple ? [] : '');
        break;
      case FIELD_TYPE.FIELD_GROUP:
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
      case FIELD_TYPE.TEXT_SHORT:
      case FIELD_TYPE.TEXT_LONG:
        payload[field.slug] = value || null;
        break;
      case FIELD_TYPE.DROPDOWN:
        if (field.configuration.multiple) {
          payload[field.slug] = (value as Array<Option>).map(
            (opt) => opt.value,
          );
        } else {
          payload[field.slug] = value || null;
        }
        break;
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
          payload[field.slug] = fileValue.storages[0]?._id ?? null;
        }
        break;
      }
      case FIELD_TYPE.RELATIONSHIP: {
        const relValue = value as Array<SearchableOption>;
        if (field.configuration.multiple) {
          payload[field.slug] = relValue.map((opt) => opt.value);
        } else {
          payload[field.slug] = relValue[0]?.value ?? null;
        }
        break;
      }
      case FIELD_TYPE.CATEGORY:
        if (field.configuration.multiple) {
          payload[field.slug] = value;
        } else {
          payload[field.slug] = value || null;
        }
        break;
      case FIELD_TYPE.FIELD_GROUP:
        payload[field.slug] = value || null;
        break;
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
