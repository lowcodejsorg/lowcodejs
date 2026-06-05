import mongoose from 'mongoose';

import type {
  CascadeDropdownConfig,
  CascadeDropdownFilter,
} from './cascade-dropdown.types';

const FilterSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    fieldId: { type: String, required: true },
    fieldSlug: { type: String, required: true },
    fieldType: { type: String, required: true },
    operator: {
      type: String,
      enum: [
        'equals',
        'not_equals',
        'contains',
        'is_empty',
        'is_not_empty',
        'date_between',
      ],
      required: true,
    },
    value: { type: String, default: null },
    values: { type: [String], default: [] },
    dateStart: { type: String, default: null },
    dateEnd: { type: String, default: null },
  },
  { _id: false },
);

const CascadeDropdownConfigSchema = new mongoose.Schema(
  {
    targetTableSlug: { type: String, required: true },
    targetFieldId: { type: String, required: true },
    targetFieldSlug: { type: String, required: true },
    sourceTableId: { type: String, required: true },
    sourceTableSlug: { type: String, required: true },
    parentFieldId: { type: String, required: true },
    parentFieldSlug: { type: String, required: true },
    childFieldId: { type: String, required: true },
    childFieldSlug: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    parentWidth: { type: Number, default: 30 },
    childWidth: { type: Number, default: 70 },
    filters: { type: [FilterSchema], default: [] },
  },
  { timestamps: true, id: false },
);

CascadeDropdownConfigSchema.index(
  { targetTableSlug: 1, targetFieldId: 1 },
  { unique: true },
);

export const CascadeDropdownConfigModel = (mongoose.models
  .CascadeDropdownConfig ||
  mongoose.model<CascadeDropdownConfig & mongoose.Document>(
    'CascadeDropdownConfig',
    CascadeDropdownConfigSchema,
    'cascade_dropdown_field_configs',
  )) as mongoose.Model<CascadeDropdownConfig & mongoose.Document>;

export async function findCascadeDropdownConfig(
  targetTableSlug: string,
  targetFieldId: string,
): Promise<CascadeDropdownConfig | null> {
  const doc = await CascadeDropdownConfigModel.findOne({
    targetTableSlug,
    targetFieldId,
  });

  return doc ? (doc.toJSON() as CascadeDropdownConfig) : null;
}

export async function saveCascadeDropdownConfig(
  data: CascadeDropdownConfig,
): Promise<CascadeDropdownConfig> {
  const doc = await CascadeDropdownConfigModel.findOneAndUpdate(
    {
      targetTableSlug: data.targetTableSlug,
      targetFieldId: data.targetFieldId,
    },
    { $set: data },
    { upsert: true, new: true },
  );

  return doc!.toJSON() as CascadeDropdownConfig;
}

export async function deleteCascadeDropdownConfigsForField(params: {
  tableSlug: string;
  fieldId: string;
  fieldSlug?: string;
}): Promise<number> {
  const fieldRefs = [
    { targetTableSlug: params.tableSlug, targetFieldId: params.fieldId },
    { targetTableSlug: params.tableSlug, parentFieldId: params.fieldId },
    { sourceTableSlug: params.tableSlug, childFieldId: params.fieldId },
    {
      sourceTableSlug: params.tableSlug,
      filters: { $elemMatch: { fieldId: params.fieldId } },
    },
  ];

  if (params.fieldSlug) {
    fieldRefs.push(
      { targetTableSlug: params.tableSlug, targetFieldSlug: params.fieldSlug },
      { targetTableSlug: params.tableSlug, parentFieldSlug: params.fieldSlug },
      { sourceTableSlug: params.tableSlug, childFieldSlug: params.fieldSlug },
      {
        sourceTableSlug: params.tableSlug,
        filters: { $elemMatch: { fieldSlug: params.fieldSlug } },
      },
    );
  }

  const result = await CascadeDropdownConfigModel.deleteMany({
    $or: fieldRefs,
  });

  return result.deletedCount ?? 0;
}
