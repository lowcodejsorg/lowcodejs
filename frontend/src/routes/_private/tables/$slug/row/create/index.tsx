import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

export const Route = createFileRoute('/_private/tables/$slug/row/create/')({
  validateSearch: z.object({
    categoryId: z.string().optional(),
    categorySlug: z.string().optional(),
  }),
});
