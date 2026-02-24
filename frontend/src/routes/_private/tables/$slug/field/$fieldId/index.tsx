import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

export const Route = createFileRoute('/_private/tables/$slug/field/$fieldId/')({
  validateSearch: z.object({
    group: z.string().optional(),
  }),
});
