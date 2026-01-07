import mongoose from 'mongoose';

import type { ISetting as Core } from '@application/core/entity.core';

interface Entity extends Omit<Core, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const Schema = new mongoose.Schema(
  {
    LOCALE: { type: String, default: 'pt-br' },
    FILE_UPLOAD_MAX_SIZE: { type: Number, default: 10485760 },
    FILE_UPLOAD_ACCEPTED: { type: String, default: 'jpg;jpeg;png;pdf' },
    FILE_UPLOAD_MAX_FILES_PER_UPLOAD: { type: Number, default: 10 },
    PAGINATION_PER_PAGE: { type: Number, default: 20 },
    LOGO_SMALL_URL: { type: String },
    LOGO_LARGE_URL: { type: String },
    EMAIL_PROVIDER_HOST: { type: String },
    EMAIL_PROVIDER_PORT: { type: Number },
    EMAIL_PROVIDER_USER: { type: String },
    EMAIL_PROVIDER_PASSWORD: { type: String },
  },
  { timestamps: true },
);

export const Setting = (mongoose?.models?.Setting ||
  mongoose.model<Entity>(
    'Setting',
    Schema,
    'settings',
  )) as mongoose.Model<Entity>;
