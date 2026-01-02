/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { Option } from '@/components/common/-multi-selector';
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
        defaults[field.slug] = field.configuration.multiple ? [] : '';
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
        defaults[field.slug] = field.configuration.multiple ? [] : '';
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
                    <formField.RowTextField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.TEXT_LONG:
                  return (
                    <formField.RowTextareaField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.DROPDOWN:
                  return (
                    <formField.RowDropdownField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.DATE:
                  return (
                    <formField.RowDateField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.FILE:
                  return (
                    <formField.RowFileField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.RELATIONSHIP:
                  return (
                    <formField.RowRelationshipField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.CATEGORY:
                  return (
                    <formField.RowCategoryField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case FIELD_TYPE.FIELD_GROUP:
                  return (
                    <formField.RowFieldGroupField
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
