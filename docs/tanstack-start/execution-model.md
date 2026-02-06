---
id: execution-model
title: Modelo de Execução
---

Entender onde o código é executado é fundamental para construir aplicações TanStack Start. Este guia explica o modelo de execução do TanStack Start e como controlar onde seu código é executado.

## Princípio Central: Isomórfico por Padrão

**Todo código no TanStack Start é isomórfico por padrão** - ele é executado e incluído tanto nos bundles do servidor quanto do cliente, a menos que seja explicitamente restringido.

```tsx
// ✅ Isso roda TANTO no servidor quanto no cliente
function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

// ✅ Loaders de rota são ISOMÓRFICOS
export const Route = createFileRoute("/products")({
  loader: async () => {
    // Isso roda no servidor durante SSR E no cliente durante navegação
    const response = await fetch("/api/products");
    return response.json();
  },
});
```

> **Entendimento Crítico**: Os `loader`s de rota são isomórficos - eles rodam tanto no servidor quanto no cliente, não apenas no servidor.

## O Limite de Execução

Aplicações TanStack Start rodam em dois ambientes:

### Ambiente do Servidor

- **Runtime Node.js** com acesso ao sistema de arquivos, bancos de dados, variáveis de ambiente
- **Durante SSR** - Renderização inicial da página no servidor
- **Requisições de API** - Server functions executam no lado do servidor
- **Tempo de build** - Geração estática e pré-renderização

### Ambiente do Cliente

- **Runtime do navegador** com acesso ao DOM, localStorage, interações do usuário
- **Após hidratação** - O cliente assume o controle após a renderização inicial do servidor
- **Navegação** - Loaders de rota rodam no lado do cliente durante a navegação
- **Interações do usuário** - Handlers de eventos, envio de formulários, etc.

## APIs de Controle de Execução

### Execução Exclusiva no Servidor

| API                      | Caso de Uso                  | Comportamento no Cliente     |
| ------------------------ | ---------------------------- | ---------------------------- |
| `createServerFn()`       | Chamadas RPC, mutações de dados | Requisição de rede ao servidor |
| `createServerOnlyFn(fn)` | Funções utilitárias          | Lança erro                   |

```tsx
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";

// RPC: Execução no servidor, chamável a partir do cliente
const updateUser = createServerFn({ method: "POST" })
  .inputValidator((data: UserData) => data)
  .handler(async ({ data }) => {
    // Roda apenas no servidor, mas o cliente pode chamá-lo
    return await db.users.update(data);
  });

// Utilitário: Exclusivo do servidor, o cliente falha se chamar
const getEnvVar = createServerOnlyFn(() => process.env.DATABASE_URL);
```

### Execução Exclusiva no Cliente

| API                      | Caso de Uso                       | Comportamento no Servidor |
| ------------------------ | --------------------------------- | ------------------------- |
| `createClientOnlyFn(fn)` | Utilitários do navegador          | Lança erro                |
| `<ClientOnly>`           | Componentes que precisam de APIs do navegador | Renderiza fallback        |

```tsx
import { createClientOnlyFn } from "@tanstack/react-start";
import { ClientOnly } from "@tanstack/react-router";

// Utilitário: Exclusivo do cliente, o servidor falha se chamar
const saveToStorage = createClientOnlyFn((key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
});

// Componente: Só renderiza os filhos após a hidratação
function Analytics() {
  return (
    <ClientOnly fallback={null}>
      <GoogleAnalyticsScript />
    </ClientOnly>
  );
}
```

#### Hook useHydrated

Para um controle mais granular sobre o comportamento dependente de hidratação, use o hook `useHydrated`. Ele retorna um booleano indicando se o cliente foi hidratado:

```tsx
import { useHydrated } from "@tanstack/react-router";

function TimeZoneDisplay() {
  const hydrated = useHydrated();
  const timeZone = hydrated
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

  return <div>Seu fuso horário: {timeZone}</div>;
}
```

**Comportamento:**

- **Durante SSR**: Sempre retorna `false`
- **Primeira renderização no cliente**: Retorna `false`
- **Após hidratação**: Retorna `true` (e permanece `true` para todas as renderizações subsequentes)

Isso é útil quando você precisa renderizar conteúdo condicionalmente com base em dados do lado do cliente (como fuso horário do navegador, localidade ou localStorage), enquanto fornece um fallback adequado para a renderização no servidor.

### Implementações Específicas por Ambiente

```tsx
import { createIsomorphicFn } from "@tanstack/react-start";

// Implementação diferente por ambiente
const getDeviceInfo = createIsomorphicFn()
  .server(() => ({ type: "server", platform: process.platform }))
  .client(() => ({ type: "client", userAgent: navigator.userAgent }));
```

## Padrões Arquiteturais

### Progressive Enhancement

Construa componentes que funcionam sem JavaScript e aprimoram com funcionalidade do lado do cliente:

```tsx
function SearchForm() {
  const [query, setQuery] = useState("");

  return (
    <form action="/search" method="get">
      <input
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ClientOnly fallback={<button type="submit">Search</button>}>
        <SearchButton onSearch={() => search(query)} />
      </ClientOnly>
    </form>
  );
}
```

### Armazenamento Consciente do Ambiente

```tsx
const storage = createIsomorphicFn()
  .server((key: string) => {
    // Servidor: Cache baseado em arquivo
    const fs = require("node:fs");
    return JSON.parse(fs.readFileSync(".cache", "utf-8"))[key];
  })
  .client((key: string) => {
    // Cliente: localStorage
    return JSON.parse(localStorage.getItem(key) || "null");
  });
```

### RPC vs Chamadas Diretas de Função

Entendendo quando usar server functions vs funções exclusivas do servidor:

```tsx
// createServerFn: Padrão RPC - execução no servidor, chamável pelo cliente
const fetchUser = createServerFn().handler(async () => await db.users.find());

// Uso a partir de um componente cliente:
const user = await fetchUser(); // ✅ Requisição de rede

// createServerOnlyFn: Falha se chamado a partir do cliente
const getSecret = createServerOnlyFn(() => process.env.SECRET);

// Uso a partir do cliente:
const secret = getSecret(); // ❌ Lança erro
```

## Anti-Padrões Comuns

### Exposição de Variáveis de Ambiente

```tsx
// ❌ Expõe ao bundle do cliente
const apiKey = process.env.SECRET_KEY;

// ✅ Acesso exclusivo do servidor
const apiKey = createServerOnlyFn(() => process.env.SECRET_KEY);
```

### Suposições Incorretas sobre Loader

```tsx
// ❌ Assumindo que o loader é exclusivo do servidor
export const Route = createFileRoute("/users")({
  loader: () => {
    // Isso roda TANTO no servidor quanto no cliente!
    const secret = process.env.SECRET; // Exposto ao cliente
    return fetch(`/api/users?key=${secret}`);
  },
});

// ✅ Use server function para operações exclusivas do servidor
const getUsersSecurely = createServerFn().handler(() => {
  const secret = process.env.SECRET; // Exclusivo do servidor
  return fetch(`/api/users?key=${secret}`);
});

export const Route = createFileRoute("/users")({
  loader: () => getUsersSecurely(), // Chamada isomórfica para server function
});
```

### Incompatibilidades de Hidratação

```tsx
// ❌ Conteúdo diferente entre servidor e cliente
function CurrentTime() {
  return <div>{new Date().toLocaleString()}</div>;
}

// ✅ Renderização consistente
function CurrentTime() {
  const [time, setTime] = useState<string>();

  useEffect(() => {
    setTime(new Date().toLocaleString());
  }, []);

  return <div>{time || "Loading..."}</div>;
}
```

## Detecção Manual vs Baseada em API do Ambiente

```tsx
// Manual: Você lida com a lógica
function logMessage(msg: string) {
  if (typeof window === "undefined") {
    console.log(`[SERVER]: ${msg}`);
  } else {
    console.log(`[CLIENT]: ${msg}`);
  }
}

// API: O framework cuida disso
const logMessage = createIsomorphicFn()
  .server((msg) => console.log(`[SERVER]: ${msg}`))
  .client((msg) => console.log(`[CLIENT]: ${msg}`));
```

## Framework de Decisão Arquitetural

**Escolha Exclusivo do Servidor quando:**

- Acessar dados sensíveis (variáveis de ambiente, segredos)
- Operações de sistema de arquivos
- Conexões com banco de dados
- Chaves de API externas

**Escolha Exclusivo do Cliente quando:**

- Manipulação do DOM
- APIs do navegador (localStorage, geolocalização)
- Tratamento de interação do usuário
- Analytics/rastreamento

**Escolha Isomórfico quando:**

- Formatação/transformação de dados
- Lógica de negócios
- Utilitários compartilhados
- Loaders de rota (eles são isomórficos por natureza)

## Considerações de Segurança

### Análise de Bundle

Sempre verifique se código exclusivo do servidor não está incluído nos bundles do cliente:

```bash
# Analise o bundle do cliente
npm run build
# Verifique dist/client para quaisquer imports exclusivos do servidor
```

### Estratégia de Variáveis de Ambiente

- **Expostas ao cliente**: Use o prefixo `VITE_` para variáveis acessíveis ao cliente
- **Exclusivas do servidor**: Acesse via `createServerOnlyFn()` ou `createServerFn()`
- **Nunca exponha**: URLs de banco de dados, chaves de API, segredos

### Error Boundaries

Trate erros de execução servidor/cliente de forma elegante:

```tsx
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={<div>Algo deu errado</div>}
      onError={(error) => {
        if (typeof window === "undefined") {
          console.error("[SERVER ERROR]:", error);
        } else {
          console.error("[CLIENT ERROR]:", error);
        }
      }}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

Entender o modelo de execução do TanStack Start é crucial para construir aplicações seguras, performáticas e de fácil manutenção. A abordagem isomórfica por padrão oferece flexibilidade, enquanto as APIs de controle de execução proporcionam controle preciso quando necessário.
