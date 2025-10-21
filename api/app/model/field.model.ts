import { Field as Core, FIELD_FORMAT, FIELD_TYPE } from '@core/entity.core';
import mongoose from 'mongoose';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const Relationship = new mongoose.Schema(
  {
    collection: {
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

function validateCategory(Category: any[] | null): boolean {
  // null é válido
  if (Category === null) return true;

  // Array vazio é válido
  if (Category.length === 0) return true;

  // Verificar se todos os elementos têm a estrutura correta
  return Category.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.label === 'string' &&
      Array.isArray(item.children),
  );
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

const Configuration = new mongoose.Schema(
  {
    required: {
      type: Boolean,
      default: false,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    format: {
      type: String,
      enum: Object.values(FIELD_FORMAT),
      default: null,
    },
    listing: {
      type: Boolean,
      default: false,
    },
    filtering: {
      type: Boolean,
      default: false,
    },
    defaultValue: {
      type: String,
      default: null,
    },
    relationship: {
      type: Relationship,
      default: null,
    },
    dropdown: {
      type: [String],
      default: function () {
        return null;
      },
    },
    category: {
      type: [Category],
      default: function () {
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
      enum: Object.values(FIELD_TYPE),
      required: true,
    },
    configuration: { type: Configuration, required: true },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        if (ret.configuration) {
          if (ret.configuration.dropdown === undefined) {
            ret.configuration.dropdown = null;
          }
          if (ret.configuration.category === undefined) {
            ret.configuration.category = null;
          }
        }
        return ret;
      },
    },
  },
);

export const Field = (mongoose?.models?.Field ||
  mongoose.model<Entity>('Field', Schema, 'fields')) as mongoose.Model<Entity>;
