import mongoose from 'mongoose';

import {
  E_RELATIONSHIP_ON_DELETE,
  Merge,
  type IRelationshipDefinition as Core,
} from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

// Um lado do relacionamento: tabela + campo RELATIONSHIP daquele lado +
// controles exclusivos do endpoint (visibilidade e rotulo).
const Endpoint = new mongoose.Schema(
  {
    table: {
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      slug: { type: String, required: true },
    },
    field: {
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      slug: { type: String, required: true },
    },
    visible: { type: Boolean, default: true },
    label: { type: String, default: '' },
  },
  { _id: false },
);

export const Schema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    source: { type: Endpoint, required: true },
    target: { type: Endpoint, required: true },
    onDelete: {
      type: String,
      enum: Object.values(E_RELATIONSHIP_ON_DELETE),
      default: E_RELATIONSHIP_ON_DELETE.RESTRICT,
    },
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    id: false,
  },
);

// Achar definicoes que tocam uma tabela (delete de tabela §9, read-compat §6,
// montar tabs do detalhe §10.2).
Schema.index({ 'source.table._id': 1 });
Schema.index({ 'target.table._id': 1 });

export const RelationshipDefinition = (mongoose?.models
  ?.RelationshipDefinition ||
  mongoose.model<Entity>(
    'RelationshipDefinition',
    Schema,
    'relationship-definitions',
  )) as mongoose.Model<Entity>;
