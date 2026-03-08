import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        const { Env } = await import('@/env');
        const appUrl = Env.SERVER_URL || 'http://localhost:5173';

        const robotsTxt = `User-agent: *
Allow: /
Disallow: /_private/

Sitemap: ${appUrl}/sitemap.xml
`;

        return new Response(robotsTxt, {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      },
    },
  },
});
