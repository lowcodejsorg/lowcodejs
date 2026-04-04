import { createFileRoute, redirect } from '@tanstack/react-router';
import * as z from 'zod';

import { createRouteHead } from '@/lib/seo';

const SearchSchema = z.object({
  email: z.string().email(),
});

export const Route = createFileRoute(
  '/_authentication/forgot-password/validate-code/',
)({
  head: createRouteHead({ title: 'Validar Código' }),
  validateSearch: SearchSchema,
  beforeLoad: ({ search }) => {
    if (!search.email) {
      throw redirect({ to: '/forgot-password' });
    }
  },
});
