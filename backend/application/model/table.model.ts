import mongoose from 'mongoose';

import type { ITable as Core } from '@application/core/entity.core';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

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
      enum: ['gallery', 'list'],
      default: 'list',
    },
    visibility: {
      type: String,
      enum: ['public', 'restricted', 'open', 'form', 'private'],
      default: 'restricted',
    },
    collaboration: {
      type: String,
      enum: ['open', 'restricted'],
      default: 'restricted',
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
      enum: ['table', 'field-group'],
      default: 'table',
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
