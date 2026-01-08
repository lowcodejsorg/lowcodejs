import mongoose from 'mongoose';

import type { IStorage as Core, Merge } from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

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
