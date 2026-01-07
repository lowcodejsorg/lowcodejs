import mongoose from 'mongoose';

import type { IPermission as Core } from '@application/core/entity.core';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: null },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const Permission = (mongoose?.models?.Permission ||
  mongoose.model<Entity>(
    'Permission',
    Schema,
    'permissions',
  )) as mongoose.Model<Entity>;
