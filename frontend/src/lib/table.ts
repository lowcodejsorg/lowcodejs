import { E_FIELD_TYPE } from './constant';
import type {
  ICategory,
  IDropdown,
  IField,
  IRow,
  IStorage,
  IUser,
  SearchableOption,
} from './interfaces';

export function getDropdownItem(
  items: Array<IDropdown>,
  id: string,
): IDropdown | undefined {
  return items.find((item) => item.id === id);
}

export function getCategoryItem(
  categories: Array<ICategory>,
  id: string,
): ICategory | undefined {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
    if (category.children.length > 0) {
      const found = getCategoryItem(category.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

// Build default values for creating new rows

type FileFieldValue = {
  storages: Array<IStorage>;
  files: Array<File>;
};

type RowFieldValue =
  | string
  | Array<string>
  | FileFieldValue
  | Array<{ value: string; label: string }>;

export type CreateRowDefaultValue = Record<
  string,
  RowFieldValue | Array<Record<string, RowFieldValue>>
>;
export function buildCreateRowDefaultValues(
  fields: Array<IField>,
): CreateRowDefaultValue {
  const defaults: Record<
    string,
    RowFieldValue | Array<Record<string, RowFieldValue>>
  > = {};

  for (const field of fields) {
    if (field.trashed) continue;
    // Skip system-managed fields
    if (
      field.type === E_FIELD_TYPE.REACTION ||
      field.type === E_FIELD_TYPE.EVALUATION
    ) {
      continue;
    }

    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        defaults[field.slug] = field.defaultValue ?? '';
        break;
      case E_FIELD_TYPE.DATE:
        defaults[field.slug] = '';
        break;
      case E_FIELD_TYPE.DROPDOWN:
        defaults[field.slug] = [];
        break;
      case E_FIELD_TYPE.FILE:
        defaults[field.slug] = { storages: [], files: [] };
        break;
      case E_FIELD_TYPE.RELATIONSHIP:
      case E_FIELD_TYPE.CATEGORY:
      case E_FIELD_TYPE.USER:
        defaults[field.slug] = [];
        break;
      case E_FIELD_TYPE.FIELD_GROUP:
        defaults[field.slug] = [{}];
        break;
      case E_FIELD_TYPE.EVALUATION:
        defaults[field.slug] = [];
        break;
      default:
        defaults[field.slug] = '';
    }
  }

  return defaults;
}

// Build default values from existing row data (for editing)

type UpdateRowDefaultValue =
  | RowFieldValue
  | Array<Record<string, RowFieldValue>>;

// Valor de UM campo individual (inclui FIELD_GROUP)
type FieldValue = RowFieldValue | Array<Record<string, RowFieldValue>> | null;

export function buildUpdateRowDefaultValues(
  data: IRow,
  fields: Array<IField>,
): Record<string, UpdateRowDefaultValue> {
  const defaults: Record<string, UpdateRowDefaultValue> = {};

  for (const field of fields) {
    if (field.trashed) continue;
    // Skip system-managed fields
    if (
      field.type === E_FIELD_TYPE.REACTION ||
      field.type === E_FIELD_TYPE.EVALUATION
    ) {
      continue;
    }

    const value = data[field.slug];

    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        if (value) defaults[field.slug] = value;
        else defaults[field.slug] = field.defaultValue ?? '';
        break;
      case E_FIELD_TYPE.DROPDOWN: {
        const options = Array.from<string>(value);
        defaults[field.slug] = options;
        break;
      }
      case E_FIELD_TYPE.DATE:
        defaults[field.slug] = value ?? '';
        break;
      case E_FIELD_TYPE.FILE: {
        const storages = Array.from<IStorage>(value);

        defaults[field.slug] = {
          files: [],
          storages,
        };
        break;
      }
      case E_FIELD_TYPE.RELATIONSHIP: {
        const rows = Array.from<IRow>(value);
        const relConfig = field.relationship;
        const labelField = relConfig?.field.slug ?? '_id';

        defaults[field.slug] = rows.map((row) => ({
          value: row._id,
          label: String(row[labelField] ?? row._id),
        }));
        break;
      }
      case E_FIELD_TYPE.CATEGORY: {
        const options = Array.from<string>(value);
        defaults[field.slug] = options;
        break;
      }
      case E_FIELD_TYPE.USER: {
        const users = Array.from<IUser>(value);
        defaults[field.slug] = users.map((user) => ({
          value: user._id,
          label: user.name,
        }));
        break;
      }
      case E_FIELD_TYPE.FIELD_GROUP:
        if (Array.isArray(value) && value.length > 0)
          defaults[field.slug] = value;
        else if (value && !Array.isArray(value)) defaults[field.slug] = [value];
        else defaults[field.slug] = [{}];
        break;
      default:
        defaults[field.slug] = value ?? '';
    }
  }

  return defaults;
}

type RowBasePayload = string | null | Array<string>;

type RowPayload =
  | string
  | null
  | Array<string>
  | Array<Record<string, RowBasePayload>>;

// Build payload for row create/update API
export function buildRowPayload(
  values: Record<string, FieldValue>,
  fields: Array<IField>,
): Record<string, RowPayload> {
  const payload: Record<string, RowPayload> = {};

  for (const field of fields) {
    if (field.trashed) continue;
    // Skip system-managed fields
    if (
      field.type === E_FIELD_TYPE.REACTION ||
      field.type === E_FIELD_TYPE.EVALUATION
    ) {
      continue;
    }
    const value = values[field.slug];
    payload[field.slug] = mountRowValue(value, field);
  }

  return payload;
}

export function mountRowValue(value: FieldValue, field: IField): RowPayload {
  const isMultiple = field.multiple;

  switch (field.type) {
    case E_FIELD_TYPE.EVALUATION:
    case E_FIELD_TYPE.REACTION:
      return null; // System-managed, should not be in payloads
    case E_FIELD_TYPE.TEXT_SHORT:
    case E_FIELD_TYPE.TEXT_LONG:
      if (value === '' && field.defaultValue !== null)
        return field.defaultValue;

      if (value !== '' && value !== null) {
        return value.toString();
      }

      if (value === '' || field.defaultValue === null) {
        return null;
      }

      return null;
    case E_FIELD_TYPE.DROPDOWN: {
      if (value === null) {
        return [];
      }

      const options = Array.from<string>(value as Array<string>);

      const hasItem = options.length > 0;

      if (!isMultiple && hasItem) {
        const [option] = options;
        return [option];
      }

      if (isMultiple && hasItem) return options;

      return [];
    }
    case E_FIELD_TYPE.DATE: {
      if (value !== '' && value !== null) {
        return value as string;
      }

      return null;
    }
    case E_FIELD_TYPE.FILE: {
      if (value === null) return [];

      const { storages } = value as unknown as { storages: Array<IStorage> };

      const hasItem = storages.length > 0;

      if (!isMultiple && hasItem) {
        const [storage] = storages;
        return [storage._id];
      }

      if (isMultiple && hasItem) {
        return storages.flatMap((s) => s._id);
      }

      return [];
    }
    case E_FIELD_TYPE.RELATIONSHIP: {
      if (value === null) return [];

      const options = Array.from<SearchableOption>(
        value as Array<SearchableOption>,
      );
      const hasItem = options.length > 0;

      if (!isMultiple && hasItem) {
        const [option] = options;
        return [option.value];
      }

      if (isMultiple && hasItem) {
        return options.flatMap((option) => option.value);
      }

      return [];
    }
    case E_FIELD_TYPE.CATEGORY: {
      if (value === null) return [];

      const options = Array.from<string>(value as Array<string>);

      const hasItem = options.length > 0;

      if (!isMultiple && hasItem) {
        const [option] = options;
        return [option];
      }

      if (isMultiple && hasItem) {
        return options;
      }

      return [];
    }
    case E_FIELD_TYPE.USER: {
      if (value === null) return [];

      const options = Array.from<SearchableOption>(
        value as Array<SearchableOption>,
      );
      const hasItem = options.length > 0;

      if (!isMultiple && hasItem) {
        const [option] = options;
        return [option.value];
      }

      if (isMultiple && hasItem) {
        return options.flatMap((option) => option.value);
      }

      return [];
    }
    case E_FIELD_TYPE.FIELD_GROUP: {
      if (value === null) return [];

      const options = Array.from<Record<string, RowBasePayload>>(
        value as Array<Record<string, RowBasePayload>>,
      );

      const hasItem = options.length > 0;

      if (!isMultiple && hasItem) {
        const [option] = options;
        return [option];
      }

      if (isMultiple && hasItem) {
        return options;
      }

      return [];
    }
    case E_FIELD_TYPE.EVALUATION: {
      if (value === null || value === '') return [];
      const options = Array.from<string>(value as Array<string>);
      if (options.length > 0) return options;
      return [];
    }
    default:
      return value !== null ? (value as string) : null;
  }
}

export function buildFieldValidator(
  field: IField,
  value: null | undefined | string | { storages: Array<IStorage> },
): { message: string } | undefined {
  const isRequired = field.required;

  if (!isRequired) return undefined;

  const isMultiple = field.multiple;

  const isStorage =
    field.type === E_FIELD_TYPE.FILE &&
    !!value &&
    typeof value === 'object' &&
    'storages' in value;

  const arrayInvalidValue = Array.isArray(value) && value.length === 0;
  const storageInvalidValue = isStorage && value.storages.length === 0;

  const invalidValue: boolean =
    value === null ||
    value === undefined ||
    value === '' ||
    arrayInvalidValue ||
    storageInvalidValue;

  if (!isMultiple && invalidValue) {
    return { message: field.name + ' é obrigatório' };
  }

  if (isMultiple && invalidValue) {
    return { message: 'Adicione ao menos um item a ' + field.name };
  }

  return undefined;
}
