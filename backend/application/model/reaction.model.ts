import mongoose from 'mongoose';

import {
  E_REACTION_TYPE,
  type IReaction as Core,
} from '@application/core/entity.core';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: Object.values(E_REACTION_TYPE),
      default: E_REACTION_TYPE.LIKE,
      required: true,
    },

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
