import mongoose from 'mongoose';

import {
  E_LOGGER_ACTION_TYPE,
  E_LOGGER_OBJECT_TYPE,
  type ILogger as Core,
  type Merge,
} from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    url: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    action: {
      type: String,
      enum: Object.values(E_LOGGER_ACTION_TYPE),
      required: true,
    },
    object: {
      type: String,
      enum: Object.values(E_LOGGER_OBJECT_TYPE),
      required: true,
      default: null,
    },
    object_id: {
      type: String,
      required: false,
      default: null,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: null,
    },
  },
  { timestamps: true },
);

export const Logger = (mongoose?.models?.Logger ||
  mongoose.model<Entity>('Logger', Schema, 'logs')) as mongoose.Model<Entity>;
