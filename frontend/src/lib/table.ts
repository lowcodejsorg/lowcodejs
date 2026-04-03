/* eslint-disable @typescript-eslint/ban-ts-comment */
import { E_FIELD_FORMAT, E_FIELD_TYPE } from './constant';
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
function toDefaultArray(value: string | Array<string> | null): Array<string> {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) return [value];
  return [];
}

function toDefaultSearchableOptions(
  value: string | Array<string> | null,
): Array<{ value: string; label: string }> {
  const ids = toDefaultArray(value);
  return ids.map((id) => ({ value: id, label: '' }));
}

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
      field.type === E_FIELD_TYPE.EVALUATION ||
      field.type === E_FIELD_TYPE.FIELD_GROUP
    ) {
      continue;
    }
    if (field.native) continue;

    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        defaults[field.slug] = field.defaultValue ?? '';
        break;
      case E_FIELD_TYPE.DATE:
        if (typeof field.defaultValue === 'string' && field.defaultValue) {
          defaults[field.slug] = field.defaultValue;
        } else {
          defaults[field.slug] = '';
        }
        break;
      case E_FIELD_TYPE.DROPDOWN:
      case E_FIELD_TYPE.CATEGORY: {
        const arr = toDefaultArray(field.defaultValue);
        defaults[field.slug] = arr.length > 0 ? arr : [];
        break;
      }
      case E_FIELD_TYPE.FILE:
        defaults[field.slug] = { storages: [], files: [] };
        break;
      case E_FIELD_TYPE.RELATIONSHIP:
      case E_FIELD_TYPE.USER: {
        const opts = toDefaultSearchableOptions(field.defaultValue);
        defaults[field.slug] = opts.length > 0 ? opts : [];
        break;
      }
      // @ts-ignore
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

function toArray<T>(value: unknown): Array<T> {
  if (Array.isArray(value)) return value as Array<T>;
  if (value === null || value === undefined) return [];
  return [value as T];
}

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
      field.type === E_FIELD_TYPE.EVALUATION ||
      field.type === E_FIELD_TYPE.FIELD_GROUP
    ) {
      continue;
    }
    if (field.native) continue;

    const value = data[field.slug];

    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
        if (value) {
          defaults[field.slug] = value;
        } else if (typeof field.defaultValue === 'string') {
          defaults[field.slug] = field.defaultValue;
        } else {
          defaults[field.slug] = '';
        }
        break;
      case E_FIELD_TYPE.TEXT_LONG:
        if (value) {
          defaults[field.slug] = value;
        } else if (typeof field.defaultValue === 'string') {
          defaults[field.slug] = field.defaultValue;
        } else {
          defaults[field.slug] = '';
        }
        break;
      case E_FIELD_TYPE.DROPDOWN: {
        const options = toArray<string>(value);
        defaults[field.slug] = options;
        break;
      }
      case E_FIELD_TYPE.DATE:
        defaults[field.slug] = value ?? '';
        break;
      case E_FIELD_TYPE.FILE: {
        const storages = toArray<IStorage>(value);

        defaults[field.slug] = {
          files: [],
          storages,
        };
        break;
      }
      case E_FIELD_TYPE.RELATIONSHIP: {
        const rows = toArray<IRow>(value);
        const relConfig = field.relationship;
        const labelField = relConfig?.field?.slug ?? '_id';

        defaults[field.slug] = rows.map((row) => ({
          value: row._id,
          label: String(row[labelField] ?? row._id),
        }));
        break;
      }
      case E_FIELD_TYPE.CATEGORY: {
        const options = toArray<string>(value);
        defaults[field.slug] = options;
        break;
      }
      case E_FIELD_TYPE.USER: {
        const users = toArray<IUser>(value);
        defaults[field.slug] = users.map((user) => ({
          value:
            typeof user === 'object' && user !== null ? user._id : String(user),
          label:
            typeof user === 'object' && user !== null
              ? user.name
              : String(user),
        }));
        break;
      }
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
      field.type === E_FIELD_TYPE.EVALUATION ||
      field.type === E_FIELD_TYPE.FIELD_GROUP
    ) {
      continue;
    }
    if (field.native) continue;
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
      if (
        value === '' &&
        typeof field.defaultValue === 'string' &&
        field.defaultValue !== null
      )
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
    default:
      return value !== null ? (value as string) : null;
  }
}

export function buildFieldValidator(
  field: IField,
  value: null | undefined | string | { storages: Array<IStorage> },
): string | undefined {
  const isRequired = field.required;
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

  if (isRequired) {
    if (!isMultiple && invalidValue) {
      return field.name + ' é obrigatório';
    }

    if (isMultiple && invalidValue) {
      return 'Adicione ao menos um item a ' + field.name;
    }
  }

  // Validação de formato para TEXT_SHORT
  if (
    typeof value === 'string' &&
    value !== '' &&
    field.format &&
    field.type === E_FIELD_TYPE.TEXT_SHORT
  ) {
    const formatValidators: Record<string, { regex: RegExp; message: string }> =
      {
        [E_FIELD_FORMAT.EMAIL]: {
          regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'E-mail inválido',
        },
        [E_FIELD_FORMAT.URL]: {
          regex: /^https?:\/\/.+/,
          message: 'URL inválida. Use http:// ou https://',
        },
        [E_FIELD_FORMAT.INTEGER]: {
          regex: /^-?\d+$/,
          message: 'Deve ser um número inteiro',
        },
        [E_FIELD_FORMAT.DECIMAL]: {
          regex: /^-?\d+([.,]\d+)?$/,
          message: 'Deve ser um número decimal',
        },
        [E_FIELD_FORMAT.PHONE]: {
          regex: /^\(\d{2}\)\s?\d{4,5}-\d{4}$/,
          message: 'Telefone inválido',
        },
        [E_FIELD_FORMAT.CPF]: {
          regex: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
          message: 'CPF inválido',
        },
        [E_FIELD_FORMAT.CNPJ]: {
          regex: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
          message: 'CNPJ inválido',
        },
      };
    const validator = formatValidators[field.format];
    if (validator && !validator.regex.test(value)) {
      return validator.message;
    }
  }

  return undefined;
}
