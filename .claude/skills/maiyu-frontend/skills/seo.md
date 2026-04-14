---
name: maiyu:frontend-seo
description: |
  Generates SEO configuration for frontend projects.
  Use when: user asks about SEO, meta tags, Open Graph, robots.txt,
  sitemap, structured data, or mentions "seo" for search engine optimization.
  Supports: Meta tags, OG/Twitter cards, Schema.org JSON-LD, robots.txt.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Framework**: `@tanstack/react-start` | `next` | `@remix-run/react`
3. Scan existing SEO code to detect:
   - SEO utility location (`lib/seo.ts`)
   - Root layout meta tags (`routes/__root.tsx`)
   - Robots.txt handler

## Conventions

### Rules
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### TanStack Start (Reference Implementation)

**createRouteHead utility — `lib/seo.ts`:**
```typescript
type MetaTag = Record<string, string>;
type HeadResult = { meta: Array<MetaTag> };

export function createRouteHead(options: {
  title: string;
  description?: string;
}): (ctx: { matches: Array<{ loaderData?: unknown }> }) => HeadResult {
  return ({ matches }): HeadResult => {
    const root = matches[0]?.loaderData as
      | { systemName?: string; appUrl?: string; systemDescription?: string }
      | undefined;
    const systemName = root?.systemName || 'MyApp';
    const fullTitle = `${options.title} - ${systemName}`;
    const desc = options.description;

    const meta: Array<MetaTag> = [{ title: fullTitle }];

    if (desc) {
      meta.push(
        { name: 'description', content: desc },
        { property: 'og:title', content: fullTitle },
        { property: 'og:description', content: desc },
        { name: 'twitter:title', content: fullTitle },
        { name: 'twitter:description', content: desc },
      );
    } else {
      meta.push(
        { property: 'og:title', content: fullTitle },
        { name: 'twitter:title', content: fullTitle },
      );
    }

    return { meta };
  };
}
```

**Usage in routes:**
```typescript
import { createFileRoute } from '@tanstack/react-router';
import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_private/users/')({
  head: createRouteHead({ title: 'Users', description: 'Manage users' }),
  // ...
});
```

**Root layout with full SEO — `routes/__root.tsx`:**
```tsx
import { createRootRouteWithContext, Outlet, HeadContent } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

const getSystemSettings = createServerFn().handler(async () => {
  return {
    systemName: 'MyApp',
    systemDescription: 'Application description',
    baseUrl: process.env.SERVER_URL ?? 'http://localhost:3000',
    appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  };
});

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: async () => getSystemSettings(),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.systemName },
      { name: 'description', content: loaderData.systemDescription },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: loaderData.systemName },
      { property: 'og:url', content: loaderData.appUrl },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'canonical', href: loaderData.appUrl },
      { rel: 'icon', href: '/favicon.ico' },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: loaderData.systemName,
          description: loaderData.systemDescription,
          url: loaderData.appUrl,
        }),
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent(): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
      </body>
    </html>
  );
}
```

**Robots.txt — `routes/robots[.]txt.ts`:**
```typescript
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

const getRobotsTxt = createServerFn().handler(async () => {
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173';

  return [
    'User-agent: *',
    'Disallow: /_private/',
    'Allow: /',
    '',
    `Sitemap: ${appUrl}/sitemap.xml`,
  ].join('\n');
});

export const Route = createFileRoute('/robots.txt')({
  loader: () => getRobotsTxt(),
});
```

**Private routes noindex:**
```typescript
// In _private/layout.tsx
export const Route = createFileRoute('/_private')({
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  }),
  // ...
});
```

### Next.js App Router

**Metadata — `app/layout.tsx`:**
```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'MyApp', template: '%s - MyApp' },
  description: 'Application description',
  openGraph: {
    type: 'website',
    siteName: 'MyApp',
  },
  twitter: { card: 'summary_large_image' },
};
```

**Per-page metadata — `app/users/page.tsx`:**
```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users',
  description: 'Manage users',
};
```

**Dynamic metadata — `app/tables/[slug]/page.tsx`:**
```tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Table: ${slug}` };
}
```

**robots.ts — `app/robots.ts`:**
```typescript
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/_private/' },
    ],
    sitemap: 'https://myapp.com/sitemap.xml',
  };
}
```

### Remix

**Meta function:**
```tsx
import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'Users - MyApp' },
    { name: 'description', content: 'Manage users' },
    { property: 'og:title', content: 'Users - MyApp' },
  ];
};
```

## Checklist

- [ ] Route-level meta tag factory (`createRouteHead` or `generateMetadata`)
- [ ] OG tags (title, description, image, url)
- [ ] Twitter card tags
- [ ] Schema.org JSON-LD structured data
- [ ] robots.txt blocking private routes
- [ ] Private routes with `noindex, nofollow`
- [ ] Canonical URLs
