import slugify from 'slugify';
import z from 'zod';

import {
  GroupConfigurationSchema,
  TableAdministratorsSchema,
  TableCollaborationSchema,
  TableFieldOrderDetailSchema,
  TableFieldOrderFilterSchema,
  TableFieldOrderFormSchema,
  TableFieldOrderListSchema,
  TableLayoutFieldsSchema,
  TableMethodSchema,
  TableOrderSchema,
  TableStyleSchema,
  TableVisibilitySchema,
} from '../table-base.schema';

export const TableUpdateBodyValidator = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(40, 'Name must be at most 40 characters')
      .regex(
        /^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/,
        'Name can only contain letters, numbers, spaces, hyphen, underscore and ç',
      ),
    slug: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable(),
    logo: z.string().trim().nullable(),
    style: TableStyleSchema,
    visibility: TableVisibilitySchema,
    collaboration: TableCollaborationSchema,
    administrators: TableAdministratorsSchema,
    fieldOrderList: TableFieldOrderListSchema,
    fieldOrderForm: TableFieldOrderFormSchema,
    fieldOrderFilter: TableFieldOrderFilterSchema,
    fieldOrderDetail: TableFieldOrderDetailSchema,
    methods: TableMethodSchema,
    order: TableOrderSchema,
    layoutFields: TableLayoutFieldsSchema.optional(),
    groups: z.array(GroupConfigurationSchema).optional(),
  })
  .transform((data) => {
    let slug = slugify(data.name, { lower: true, strict: true, trim: true });
    if (data.slug) {
      slug = slugify(data.slug, { lower: true, strict: true, trim: true });
    }
    return { ...data, slug };
  });

export const TableUpdateParamsValidator = z.object({
  slug: z.string().trim(),
});

export type TableUpdatePayload = z.infer<typeof TableUpdateBodyValidator> & {
  routeSlug: string;
};
