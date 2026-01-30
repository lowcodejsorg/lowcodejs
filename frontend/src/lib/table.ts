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
  storages: Array<string>;
  files: Array<string>;
};

type RowFieldValue = string | Array<string> | FileFieldValue;

export type CreateRowDefaultValue = Record<string, RowFieldValue>;
export function buildCreateRowDefaultValues(
  fields: Array<IField>,
): CreateRowDefaultValue {
  const defaults: Record<string, RowFieldValue> = {};

  for (const field of fields) {
    if (field.trashed) continue;

    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        defaults[field.slug] = field.configuration.defaultValue ?? '';
        break;
      case E_FIELD_TYPE.DROPDOWN:
        defaults[field.slug] = [];
        break;
      case E_FIELD_TYPE.DATE:
        defaults[field.slug] = '';
        break;
      case E_FIELD_TYPE.FILE:
        defaults[field.slug] = { storages: [], files: [] };
        break;
      case E_FIELD_TYPE.RELATIONSHIP:
        defaults[field.slug] = [];
        break;
      case E_FIELD_TYPE.CATEGORY:
        defaults[field.slug] = [];
        break;
      case E_FIELD_TYPE.FIELD_GROUP:
        defaults[field.slug] = [];
        break;
      case E_FIELD_TYPE.USER:
        defaults[field.slug] = [];
        break;
      default:
        defaults[field.slug] = '';
    }
  }

  return defaults;
}

// Build default values from existing row data (for editing)

export function buildUpdateRowDefaultValues(
  data: IRow,
  fields: Array<IField>,
): Record<string, any> {
  const defaults: Record<string, any> = {};

  for (const field of fields) {
    if (field.trashed) continue;

    const value = data[field.slug];

    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        if (
          (value === '' || value === null) &&
          field.configuration.defaultValue !== null
        ) {
          defaults[field.slug] = field.configuration.defaultValue;
        }

        if (value) defaults[field.slug] = value ?? '';

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
          storages: storages,
        };
        break;
      }
      case E_FIELD_TYPE.RELATIONSHIP: {
        const rows = Array.from<IRow>(value);
        const relConfig = field.configuration.relationship;
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
        // Ensure it's always an array
        if (Array.isArray(value) && value.length > 0) {
          defaults[field.slug] = value;
        } else if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          // Convert old object format to array format
          defaults[field.slug] = [value];
        } else {
          defaults[field.slug] = [{}];
        }
        break;
      default:
        defaults[field.slug] = value ?? '';
    }
  }

  return defaults;
}

// Build payload for row create/update API
export function buildRowPayload(
  values: Record<string, any>,
  fields: Array<IField>,
): Record<string, any> {
  const payload: Record<string, any> = {};

  for (const field of fields) {
    if (field.trashed) continue;

    const isMultiple = field.configuration.multiple;
    const value = values[field.slug];

    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        if (
          (value === '' || value === null) &&
          field.configuration.defaultValue !== null
        ) {
          payload[field.slug] = field.configuration.defaultValue;
        }

        if (value !== '' && value !== null) {
          payload[field.slug] = value;
        }

        if (value === '' || field.configuration.defaultValue === null) {
          payload[field.slug] = null;
        }

        break;
      case E_FIELD_TYPE.DROPDOWN: {
        const options = Array.from<IDropdown>(value);

        const hasItem = options.length > 0;

        if (!isMultiple && hasItem) {
          const [option] = options;
          payload[field.slug] = [option];
        }

        if (isMultiple && hasItem) payload[field.slug] = options;

        if (!hasItem) payload[field.slug] = [];

        break;
      }
      case E_FIELD_TYPE.DATE:
        if (value !== '' && value !== null) {
          payload[field.slug] = value;
        }

        if (value === '' || value === null) {
          payload[field.slug] = null;
        }

        break;
      case E_FIELD_TYPE.FILE: {
        const {
          storages,
        }: {
          storages: Array<IStorage>;
        } = value;

        const hasItem = storages.length > 0;

        if (!isMultiple && hasItem) {
          const [storage] = storages;
          payload[field.slug] = [storage._id];
        }

        if (isMultiple && hasItem) {
          payload[field.slug] = storages.flatMap((s) => s._id);
        }

        if (!hasItem) payload[field.slug] = [];

        break;
      }
      case E_FIELD_TYPE.RELATIONSHIP: {
        const options = Array.from<SearchableOption>(value);
        const hasItem = options.length > 0;

        if (!isMultiple && hasItem) {
          const [option] = options;
          payload[field.slug] = [option.value];
        }

        if (isMultiple && hasItem) {
          payload[field.slug] = options.flatMap((option) => option.value);
        }

        if (!hasItem) payload[field.slug] = [];

        break;
      }
      case E_FIELD_TYPE.CATEGORY: {
        const options = Array.from<ICategory>(value);

        const hasItem = options.length > 0;

        if (!isMultiple && hasItem) {
          const [option] = options;
          payload[field.slug] = [option];
        }

        if (isMultiple && hasItem) {
          payload[field.slug] = options;
        }

        if (!hasItem) payload[field.slug] = [];

        break;
      }
      case E_FIELD_TYPE.USER: {
        const options = Array.from<SearchableOption>(value);
        const hasItem = options.length > 0;

        if (!isMultiple && hasItem) {
          const [option] = options;
          payload[field.slug] = [option.value];
        }

        if (isMultiple && hasItem) {
          payload[field.slug] = options.flatMap((option) => option.value);
        }

        if (!hasItem) payload[field.slug] = [];

        break;
      }
      case E_FIELD_TYPE.FIELD_GROUP: {
        const options = Array.from<Record<string, any>>(value);

        const hasItem = options.length > 0;

        if (!isMultiple && hasItem) {
          const [option] = options;
          payload[field.slug] = [option];
        }

        if (isMultiple && hasItem) {
          payload[field.slug] = options;
        }

        if (!hasItem) payload[field.slug] = [];

        break;
      }
      default:
        payload[field.slug] = value ?? null;
    }
  }

  return payload;
}

export function buildFieldValidator(
  field: IField,
  value: null | undefined | string | { storages: Array<IStorage> },
): { message: string } | undefined {
  const isRequired = field.configuration.required;

  if (!isRequired) return undefined;

  const isMultiple = field.configuration.multiple;

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

  return { message: 'Campo obrigatório' };
}
