---
id: client-entry-point
title: Ponto de Entrada do Cliente
---

# Ponto de Entrada do Cliente

> [!NOTE]
> O ponto de entrada do cliente é **opcional** por padrão. Se não for fornecido, o TanStack Start cuidará automaticamente do ponto de entrada do cliente para você, utilizando o exemplo abaixo como padrão.

Entregar nosso HTML ao cliente é apenas metade da batalha. Uma vez lá, precisamos hidratar nosso JavaScript do lado do cliente assim que a rota for resolvida no cliente. Fazemos isso hidratando a raiz da nossa aplicação com o componente `StartClient`:

```tsx
// src/client.tsx
import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
);
```

Isso nos permite iniciar o roteamento do lado do cliente assim que a requisição inicial do usuário ao servidor for concluída.

## Tratamento de Erros

Você pode envolver seu ponto de entrada do cliente com error boundaries para lidar com erros do lado do cliente de forma elegante:

```tsx
// src/client.tsx
import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";

hydrateRoot(
  document,
  <StrictMode>
    <ErrorBoundary>
      <StartClient />
    </ErrorBoundary>
  </StrictMode>,
);
```

## Desenvolvimento vs Produção

Você pode querer comportamentos diferentes em desenvolvimento vs produção:

```tsx
// src/client.tsx
import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

const App = (
  <>
    {import.meta.env.DEV && <div>Development Mode</div>}
    <StartClient />
  </>
);

hydrateRoot(
  document,
  import.meta.env.DEV ? <StrictMode>{App}</StrictMode> : App,
);
```

O ponto de entrada do cliente oferece controle total sobre como sua aplicação é inicializada no lado do cliente, funcionando perfeitamente com a renderização do lado do servidor do TanStack Start.
