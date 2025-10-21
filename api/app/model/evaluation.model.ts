import type { Evaluation as Core } from '@core/entity.core';
import mongoose from 'mongoose';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    value: { type: Number, default: 0 },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const Evaluation = (mongoose?.models?.Evaluation ||
  mongoose.model<Entity>(
    'Evaluation',
    Schema,
    'evaluations',
  )) as mongoose.Model<Entity>;
