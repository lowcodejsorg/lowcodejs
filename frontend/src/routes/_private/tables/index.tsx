import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

export const Route = createFileRoute('/_private/tables/')({
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    name: z.string().optional(),
    trashed: z.coerce.boolean().optional(),
  }),
});
