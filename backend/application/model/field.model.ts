/* eslint-disable @typescript-eslint/explicit-function-return-type */
import mongoose from 'mongoose';

import type { IField as Core, Merge } from '@application/core/entity.core';
import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

const Relationship = new mongoose.Schema(
  {
    table: {
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      slug: { type: String, required: true },
    },
    field: {
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      slug: { type: String, required: true },
    },
    order: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'asc',
    },
  },
  {
    _id: false,
  },
);

const Group = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, default: null },
    slug: { type: String, default: null },
  },
  {
    _id: false,
  },
);

function isFieldVisibilityValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value === 'HIDDEN') return true;
  return mongoose.Types.ObjectId.isValid(value);
}

function isCategoryNode(
  item: unknown,
): item is { id: string; label: string; children: unknown[] } {
  if (!item || typeof item !== 'object') return false;
  if (!('id' in item) || typeof item.id !== 'string') return false;
  if (!('label' in item) || typeof item.label !== 'string') return false;
  if (!('children' in item) || !Array.isArray(item.children)) return false;
  return true;
}

function validateCategory(Category: unknown[] | null): boolean {
  if (Category === null) return true;
  if (Category.length === 0) return true;
  return Category.every(isCategoryNode);
}

const Category = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    children: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
      validate: {
        validator: validateCategory,
        message: 'children must be an array of {id, label, children}',
      },
    },
  },
  {
    _id: false,
  },
);

const Dropdown = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  },
);

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    slug: { type: String },
    type: {
      type: String,
      enum: Object.values(E_FIELD_TYPE),
      default: E_FIELD_TYPE.TEXT_SHORT,
      required: true,
    },

    required: {
      type: Boolean,
      default: false,
    },
    multiple: {
      type: Boolean,
      default: false,
      required: true,
    },
    format: {
      type: String,
      enum: Object.values(E_FIELD_FORMAT),
      default: null,
    },
    visibilityList: {
      type: String,
      default: 'HIDDEN',
      validate: {
        validator: isFieldVisibilityValue,
        message:
          'Field.visibilityList deve ser "HIDDEN" ou um ObjectId de grupo valido',
      },
    },
    visibilityForm: {
      type: String,
      default: 'HIDDEN',
      validate: {
        validator: isFieldVisibilityValue,
        message:
          'Field.visibilityForm deve ser "HIDDEN" ou um ObjectId de grupo valido',
      },
    },
    visibilityDetail: {
      type: String,
      default: 'HIDDEN',
      validate: {
        validator: isFieldVisibilityValue,
        message:
          'Field.visibilityDetail deve ser "HIDDEN" ou um ObjectId de grupo valido',
      },
    },
    widthInForm: {
      type: Number,
      default: 50,
    },
    widthInList: {
      type: Number,
      default: 10,
    },
    widthInDetail: {
      type: Number,
      default: 50,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    native: {
      type: Boolean,
      default: false,
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    relationship: {
      type: Relationship,
      default: null,
    },
    dropdown: {
      type: [Dropdown],
      default: function (): null {
        return null;
      },
    },
    category: {
      type: [Category],
      default: function (): null {
        return null;
      },
      validate: {
        validator: validateCategory,
        message:
          'children deve ser um array de objetos com estrutura {id, label, children}',
      },
    },
    group: {
      type: Group,
      default: null,
    },
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      transform: function (_doc, ret: any) {
        // Garantir valores padrão para dropdown e category
        if (ret.dropdown === undefined) {
          ret.dropdown = null;
        }
        if (ret.category === undefined) {
          ret.category = null;
        }
        return ret;
      },
    },
  },
);

export const Field = (mongoose?.models?.Field ||
  mongoose.model<Entity>('Field', Schema, 'fields')) as mongoose.Model<Entity>;
