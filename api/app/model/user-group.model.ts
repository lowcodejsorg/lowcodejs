import type { UserGroup as Core } from '@core/entity.core';
import mongoose from 'mongoose';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const UserGroup = (mongoose?.models?.UserGroup ||
  mongoose.model<Entity>(
    'UserGroup',
    Schema,
    'user-groups',
  )) as mongoose.Model<Entity>;
