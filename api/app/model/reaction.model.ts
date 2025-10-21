import type { Reaction as Core } from '@core/entity.core';
import mongoose from 'mongoose';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['like', 'unlike'] },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const Reaction = (mongoose?.models?.Reaction ||
  mongoose.model<Entity>(
    'Reaction',
    Schema,
    'reactions',
  )) as mongoose.Model<Entity>;
