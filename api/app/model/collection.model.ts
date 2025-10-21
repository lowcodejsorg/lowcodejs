import type { Collection as Core } from '@core/entity.core';
import mongoose from 'mongoose';

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
      enum: ['public', 'restricted'],
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
      enum: ['collection', 'field-group'],
      default: 'collection',
    },
    configuration: {
      type: Configuration,
      default: {},
    },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const Collection = (mongoose?.models?.Collection ||
  mongoose.model<Entity>(
    'Collection',
    Schema,
    'collections',
  )) as mongoose.Model<Entity>;
