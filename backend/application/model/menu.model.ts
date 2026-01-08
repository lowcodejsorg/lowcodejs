import mongoose from 'mongoose';

import {
  E_MENU_ITEM_TYPE,
  type IMenu as Core,
} from '@application/core/entity.core';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },

    name: { type: String, required: true },
    slug: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(E_MENU_ITEM_TYPE),
      default: E_MENU_ITEM_TYPE.SEPARATOR,
      required: true,
    },

    /** Tabela associada (para tipos 'table' e 'form') */
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
    },

    /** Item pai para hierarquia (auto-referência) */
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      default: null,
    },

    /** Conteúdo HTML para tipo 'page' */
    html: {
      type: String,
      default: null,
    },

    /** URL para tipo 'external-link' */
    url: {
      type: String,
      default: null,
    },

    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

// Índices para otimização de consultas
// Schema.index({ parent: 1, order: 1 });
// Schema.index({ slug: 1 }, { unique: true });
// Schema.index({ trashed: 1 });

export const Menu = (mongoose?.models?.Menu ||
  mongoose.model<Entity>('Menu', Schema, 'menus')) as mongoose.Model<Entity>;
