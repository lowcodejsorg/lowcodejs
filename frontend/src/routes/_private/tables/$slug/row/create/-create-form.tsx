import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IStorage } from '@/lib/interfaces';
import { buildFieldValidator } from '@/lib/table';

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
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        defaults[field.slug] = field.defaultValue ?? '';
        break;
      case E_FIELD_TYPE.DROPDOWN:
        defaults[field.slug] = []; // Always array
        break;
      case E_FIELD_TYPE.DATE:
        defaults[field.slug] = '';
        break;
      case E_FIELD_TYPE.FILE:
        defaults[field.slug] = {
          files: [] as Array<File>,
          storages: [] as Array<IStorage>,
        };
        break;
      case E_FIELD_TYPE.RELATIONSHIP:
        defaults[field.slug] = [];
        break;
      case E_FIELD_TYPE.CATEGORY:
        defaults[field.slug] = []; // Always array
        break;
      case E_FIELD_TYPE.FIELD_GROUP:
        defaults[field.slug] = [];
        break;
      case E_FIELD_TYPE.USER:
        defaults[field.slug] = []; // Always array of {value, label}
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
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        payload[field.slug] = value || null;
        break;
      case E_FIELD_TYPE.DROPDOWN: {
        const existing = values[field.slug];
        if (field.multiple) {
          const ids = Array.isArray(existing)
            ? existing
            : existing
              ? [existing]
              : [];
          payload[field.slug] = ids as Array<string>;
        } else {
          const id = Array.isArray(existing)
            ? (existing[0] ?? null)
            : (existing ?? null);
          payload[field.slug] = id as string | null;
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
        if (field.multiple) {
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
        const relValue = Array.from<SearchableOption>(value ?? []);
        if (field.multiple) {
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
        if (field.multiple) {
          payload[field.slug] = categoryValue;
        } else {
          // Always array, but limit to 1 item
          payload[field.slug] = categoryValue.slice(0, 1);
        }
        break;
      }
      case E_FIELD_TYPE.FIELD_GROUP: {
        // const groupValue = value as Array<Record<string, any>>;
        const groupValue = Array.from<Record<string, any>>(value ?? []);
        // Always send as array, but limit to 1 item if multiple=false
        if (field.multiple) {
          payload[field.slug] = groupValue;
        } else {
          payload[field.slug] = groupValue.slice(0, 1);
        }
        break;
      }
      case E_FIELD_TYPE.USER: {
        const userValue = Array.from<SearchableOption>(value ?? []);
        if (field.multiple) {
          payload[field.slug] = userValue.map((opt) => opt.value);
        } else {
          // Always array, but limit to 1 item
          payload[field.slug] = userValue.slice(0, 1).map((opt) => opt.value);
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
type RequiredValidator = {
  onChange: ({ value }: { value: any }) => { message: string } | undefined;
};

export function createRequiredValidator(fieldName: string): RequiredValidator {
  const validate = ({
    value,
  }: {
    value: any;
  }): { message: string } | undefined => {
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
  };

  return {
    onChange: validate,
  };
}

interface RowFormFieldsProps {
  form: any;
  fields: Array<IField>;
  disabled: boolean;
  tableSlug: string;
}

// Helper to convert width percentage to grid column span
function getWidthClass(width: number | null | undefined): string {
  switch (width) {
    case 25:
      return 'col-span-1';
    case 50:
      return 'col-span-2';
    case 75:
      return 'col-span-3';
    case 100:
      return 'col-span-4';
    default:
      return 'col-span-2'; // default 50%
  }
}

export function RowFormFields({
  form,
  fields,
  disabled,
  tableSlug,
}: RowFormFieldsProps): React.JSX.Element {
  return (
    <section className="grid grid-cols-4 gap-4 p-2">
      {fields.map((field) => {
        // Skip non-editable field types
        if (
          field.type === E_FIELD_TYPE.REACTION ||
          field.type === E_FIELD_TYPE.EVALUATION
        ) {
          return null;
        }

        return (
          <div
            key={field._id}
            className={getWidthClass(field.widthInForm)}
          >
            <form.AppField
              name={field.slug}
              validators={{
                onChange: ({ value }: { value: any }) => {
                  return buildFieldValidator(field, value);
                },
              }}
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
                    if (field.format === E_FIELD_FORMAT.RICH_TEXT) {
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
                  case E_FIELD_TYPE.USER:
                    return (
                      <formField.TableRowUserField
                        field={field}
                        disabled={disabled}
                      />
                    );
                  default:
                    return null;
                }
              }}
            </form.AppField>
          </div>
        );
      })}
    </section>
  );
}
