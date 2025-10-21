import { User as Core } from '@core/entity.core';

import mongoose from 'mongoose';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },

    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup' },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const User = (mongoose?.models?.User ||
  mongoose.model<Entity>('User', Schema, 'users')) as mongoose.Model<Entity>;
