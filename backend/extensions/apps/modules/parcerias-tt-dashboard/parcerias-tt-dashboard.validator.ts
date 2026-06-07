import z from 'zod';

export const ParceriasTtDashboardQueryValidator = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const ParceriasTtDashboardRowsQueryValidator =
  ParceriasTtDashboardQueryValidator.extend({
    status: z.string().min(1).optional(),
    year: z.coerce.number().int().optional(),
    transfer: z.enum(['withTransfer', 'withoutTransfer']).optional(),
  });

export type ParceriasTtDashboardQuery = z.infer<
  typeof ParceriasTtDashboardQueryValidator
>;

export type ParceriasTtDashboardRowsQuery = z.infer<
  typeof ParceriasTtDashboardRowsQueryValidator
>;
