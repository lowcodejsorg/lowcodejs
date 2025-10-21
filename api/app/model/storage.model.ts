import mongoose from 'mongoose';

import type { Storage as Core } from '@core/entity.core';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    originalName: { type: String, required: true },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const Storage = (mongoose?.models?.Storage ||
  mongoose.model<Entity>(
    'Storage',
    Schema,
    'storage',
  )) as mongoose.Model<Entity>;
