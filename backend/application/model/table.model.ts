import mongoose from 'mongoose';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  Merge,
  type ITable as Core,
} from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

const FieldConfiguration = new mongoose.Schema(
  {
    orderList: {
      type: [String],
      default: [],
    },
    orderForm: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const Configuration = new mongoose.Schema(
  {
    style: {
      type: String,
      enum: Object.values(E_TABLE_STYLE),
      default: E_TABLE_STYLE.LIST,
    },
    visibility: {
      type: String,
      enum: Object.values(E_TABLE_VISIBILITY),
      default: E_TABLE_VISIBILITY.RESTRICTED,
    },
    collaboration: {
      type: String,
      enum: Object.values(E_TABLE_COLLABORATION),
      default: E_TABLE_COLLABORATION.RESTRICTED,
    },
    administrators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fields: {
      type: FieldConfiguration,
      default: { orderList: [], orderForm: [] },
    },
  },
  {
    _id: false,
  },
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
    configuration: {
      type: Configuration,
      default: {},
    },
    methods: {
      type: Methods,
      default: {
        onLoad: { code: null },
        beforeSave: { code: null },
        afterSave: { code: null },
      },
    },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const Table = (mongoose?.models?.Table ||
  mongoose.model<Entity>('Table', Schema, 'tables')) as mongoose.Model<Entity>;
