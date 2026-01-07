import mongoose from 'mongoose';

import type { IValidationToken as Core } from '@application/core/entity.core';
import { E_TOKEN_STATUS } from '@application/core/entity.core';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(E_TOKEN_STATUS),
      default: E_TOKEN_STATUS.REQUESTED,
      required: true,
    },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const ValidationToken = (mongoose?.models?.ValidationToken ||
  mongoose.model<Entity>(
    'ValidationToken',
    Schema,
    'validation-tokens',
  )) as mongoose.Model<Entity>;
