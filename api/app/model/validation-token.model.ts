import { ValidationToken as Core, TOKEN_STATUS } from '@core/entity.core';
import mongoose from 'mongoose';

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
      enum: Object.values(TOKEN_STATUS),
      default: TOKEN_STATUS.REQUESTED,
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
