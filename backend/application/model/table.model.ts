import mongoose from 'mongoose';

import {
  E_COLLABORATION_PROFILE,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  Merge,
  type ITable as Core,
} from '@application/core/entity.core';

const LayoutFields = new mongoose.Schema(
  {
    title: { type: String, default: null },
    description: { type: String, default: null },
    cover: { type: String, default: null },
    category: { type: String, default: null },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    color: { type: String, default: null },
    participants: { type: String, default: null },
    reminder: { type: String, default: null },
  },
  { _id: false },
);

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

const GroupConfiguration = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    fields: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Field' }],
    _schema: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true, timestamps: true, id: false },
);

const Methods = new mongoose.Schema(
  {
    onLoad: {
      code: {
        type: String,
        default: null,
      },
    },
    beforeSave: {
      code: {
        type: String,
        default: null,
      },
    },
    afterSave: {
      code: {
        type: String,
        default: null,
      },
    },
  },
  {
    _id: false,
  },
);

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    _schema: { type: mongoose.Schema.Types.Mixed },
    name: { type: String, required: true },
    description: { type: String, default: null },
    logo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Storage',
      default: null,
    },
    slug: { type: String, required: true },
    fields: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field',
      },
    ],
    type: {
      type: String,
      enum: Object.values(E_TABLE_TYPE),
      default: E_TABLE_TYPE.TABLE,
    },
    style: {
      type: String,
      enum: Object.values(E_TABLE_STYLE),
      default: E_TABLE_STYLE.LIST,
    },
    viewTable: { type: String, default: 'NOBODY' },
    updateTable: { type: String, default: 'NOBODY' },
    createField: { type: String, default: 'NOBODY' },
    updateField: { type: String, default: 'NOBODY' },
    removeField: { type: String, default: 'NOBODY' },
    viewField: { type: String, default: 'NOBODY' },
    createRow: { type: String, default: 'NOBODY' },
    updateRow: { type: String, default: 'NOBODY' },
    removeRow: { type: String, default: 'NOBODY' },
    viewRow: { type: String, default: 'NOBODY' },
    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        profile: {
          type: String,
          enum: Object.values(E_COLLABORATION_PROFILE),
        },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fieldOrderList: {
      type: [String],
      default: [],
    },
    fieldOrderForm: {
      type: [String],
      default: [],
    },
    fieldOrderFilter: {
      type: [String],
      default: [],
    },
    fieldOrderDetail: {
      type: [String],
      default: [],
    },
    methods: {
      type: Methods,
      default: {
        onLoad: { code: null },
        beforeSave: { code: null },
        afterSave: { code: null },
      },
    },
    groups: {
      type: [GroupConfiguration],
      default: [],
    },
    order: {
      field: { type: String, default: null },
      direction: { type: String, enum: ['asc', 'desc'], default: null },
    },
    layoutFields: {
      type: LayoutFields,
      default: {
        title: null,
        description: null,
        cover: null,
        category: null,
        startDate: null,
        endDate: null,
        color: null,
        participants: null,
        reminder: null,
      },
    },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
  },
);

export const Table = (mongoose?.models?.Table ||
  mongoose.model<Entity>('Table', Schema, 'tables')) as mongoose.Model<Entity>;
