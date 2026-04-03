import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_authentication/forgot-password/')({
  head: createRouteHead({ title: 'RecuperarSenha' }),
});
