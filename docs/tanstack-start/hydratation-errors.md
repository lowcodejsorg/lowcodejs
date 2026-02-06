---
id: hydration-errors
title: Erros de Hidratação
---

### Por que isso acontece

- **Divergência**: O HTML do servidor difere da renderização do cliente durante a hidratação
- **Causas comuns**: `Intl` (locale/fuso horário), `Date.now()`, IDs aleatórios, lógica exclusiva de responsividade, feature flags, preferências do usuário

### Estratégia 1 — Fazer servidor e cliente coincidirem

- **Escolha um locale/fuso horário determinístico no servidor** e use o mesmo no cliente
- **Fonte da verdade**: cookie (preferível) ou header `Accept-Language`
- **Compute uma vez no servidor** e hidrate como estado inicial

```tsx
// src/start.ts
import { createStart, createMiddleware } from "@tanstack/react-start";
import {
  getRequestHeader,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

const localeTzMiddleware = createMiddleware().server(async ({ next }) => {
  const header = getRequestHeader("accept-language");
  const headerLocale = header?.split(",")[0] || "en-US";
  const cookieLocale = getCookie("locale");
  const cookieTz = getCookie("tz"); // definido pelo cliente posteriormente (veja Estratégia 2)

  const locale = cookieLocale || headerLocale;
  const timeZone = cookieTz || "UTC"; // determinístico até o cliente enviar o tz

  // Persiste o locale para requisições subsequentes (opcional)
  setCookie("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  return next({ context: { locale, timeZone } });
});

export const startInstance = createStart(() => ({
  requestMiddleware: [localeTzMiddleware],
}));
```

```tsx
// src/routes/index.tsx (exemplo)
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

export const getServerNow = createServerFn().handler(async () => {
  const locale = getCookie("locale") || "en-US";
  const timeZone = getCookie("tz") || "UTC";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date());
});

export const Route = createFileRoute("/")({
  loader: () => getServerNow(),
  component: () => {
    const serverNow = Route.useLoaderData() as string;
    return <time dateTime={serverNow}>{serverNow}</time>;
  },
});
```

### Estratégia 2 — Deixar o cliente informar seu ambiente

- Na primeira visita, defina um cookie com o fuso horário do cliente; o SSR usa `UTC` até então
- Faça isso sem arriscar divergências

```tsx
import * as React from "react";
import { ClientOnly } from "@tanstack/react-router";

function SetTimeZoneCookie() {
  React.useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `tz=${tz}; path=/; max-age=31536000`;
  }, []);
  return null;
}

export function AppBoot() {
  return (
    <ClientOnly fallback={null}>
      <SetTimeZoneCookie />
    </ClientOnly>
  );
}
```

### Estratégia 3 — Torná-lo exclusivo do cliente

- Envolva UI instável em `<ClientOnly>` para evitar SSR e divergências

```tsx
import { ClientOnly } from "@tanstack/react-router";
<ClientOnly fallback={<span>—</span>}>
  <RelativeTime ts={someTs} />
</ClientOnly>;
```

### Estratégia 4 — Desabilitar ou limitar o SSR para a rota

- Use SSR Seletivo para evitar renderizar o componente no servidor

```tsx
export const Route = createFileRoute("/unstable")({
  ssr: "data-only", // ou false
  component: () => <ExpensiveViz />,
});
```

### Estratégia 5 — Supressão como último recurso

- Para nós pequenos e com diferenças conhecidas, você pode usar o `suppressHydrationWarning` do React

```tsx
<time suppressHydrationWarning>{new Date().toLocaleString()}</time>
```

### Checklist

- **Entradas determinísticas**: locale, fuso horário, feature flags
- **Prefira cookies** para contexto do cliente; fallback para `Accept-Language`
- **Use `<ClientOnly>`** para UI inerentemente dinâmica
- **Use SSR Seletivo** quando o HTML do servidor não puder ser estável
- **Evite supressão cega**; use `suppressHydrationWarning` com moderação

Veja também: [Modelo de Execução](./execution-model.md), [Padrões de Execução de Código](./code-execution-patterns.md), [SSR Seletivo](./selective-ssr.md), [Server Functions](./server-functions.md)
