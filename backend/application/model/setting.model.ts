import mongoose from 'mongoose';

import type { ISetting as Core, Merge } from '@application/core/entity.core';

type Entity = Merge<Omit<Core, '_id'>, mongoose.Document>;

const Schema = new mongoose.Schema(
  {
    SYSTEM_NAME: { type: String, default: 'LowCodeJs' },
    LOCALE: { type: String, default: 'pt-br' },
    STORAGE_DRIVER: { type: String, default: 'local', enum: ['local', 's3'] },
    FILE_UPLOAD_MAX_SIZE: { type: Number, default: 10485760 },
    FILE_UPLOAD_ACCEPTED: { type: String, default: 'jpg;jpeg;png;pdf' },
    FILE_UPLOAD_MAX_FILES_PER_UPLOAD: { type: Number, default: 10 },
    PAGINATION_PER_PAGE: { type: Number, default: 20 },
    MODEL_CLONE_TABLES: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    ],
    LOGO_SMALL_URL: { type: String },
    LOGO_LARGE_URL: { type: String },
    EMAIL_PROVIDER_HOST: { type: String },
    EMAIL_PROVIDER_PORT: { type: Number },
    EMAIL_PROVIDER_USER: { type: String },
    EMAIL_PROVIDER_PASSWORD: { type: String },
    OPENAI_API_KEY: { type: String },
    AI_ASSISTANT_ENABLED: { type: Boolean, default: false },
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  { timestamps: true, id: false },
);

export const Setting = (mongoose?.models?.Setting ||
  mongoose.model<Entity>(
    'Setting',
    Schema,
    'settings',
  )) as mongoose.Model<Entity>;
