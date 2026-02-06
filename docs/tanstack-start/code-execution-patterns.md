---
id: code-execution-patterns
title: Padrões de Execução de Código
---

Este guia aborda padrões para controlar onde o código é executado na sua aplicação TanStack Start — apenas no servidor, apenas no cliente ou de forma isomórfica (em ambos os ambientes). Para conceitos fundamentais, consulte o guia [Modelo de Execução](./execution-model.md).

## Início Rápido

Configure os limites de execução na sua aplicação TanStack Start:

```tsx
import {
  createServerFn,
  createServerOnlyFn,
  createClientOnlyFn,
  createIsomorphicFn,
} from "@tanstack/react-start";

// Server function (chamada RPC)
const getUsers = createServerFn().handler(async () => {
  return await db.users.findMany();
});

// Utilitário exclusivo do servidor (falha no cliente)
const getSecret = createServerOnlyFn(() => process.env.API_SECRET);

// Utilitário exclusivo do cliente (falha no servidor)
const saveToStorage = createClientOnlyFn((data: any) => {
  localStorage.setItem("data", JSON.stringify(data));
});

// Implementações diferentes por ambiente
const logger = createIsomorphicFn()
  .server((msg) => console.log(`[SERVER]: ${msg}`))
  .client((msg) => console.log(`[CLIENT]: ${msg}`));
```

## Padrões de Implementação

### Aprimoramento Progressivo

```tsx
// Componente funciona sem JS, aprimorado com JS
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
    // Servidor: cache baseado em arquivo
    const fs = require("node:fs");
    return JSON.parse(fs.readFileSync(".cache", "utf-8"))[key];
  })
  .client((key: string) => {
    // Cliente: localStorage
    return JSON.parse(localStorage.getItem(key) || "null");
  });
```

## Problemas Comuns

### Exposição de Variáveis de Ambiente

```tsx
// ❌ Expõe no bundle do cliente
const apiKey = process.env.SECRET_KEY;

// ✅ Acesso exclusivo do servidor
const apiKey = createServerOnlyFn(() => process.env.SECRET_KEY);
```

### Suposições Incorretas sobre Loaders

```tsx
// ❌ Assumindo que o loader é exclusivo do servidor
export const Route = createFileRoute("/users")({
  loader: () => {
    // Isso executa TANTO no servidor quanto no cliente!
    const secret = process.env.SECRET; // Exposto ao cliente
    return fetch(`/api/users?key=${secret}`);
  },
});

// ✅ Use server function para operações exclusivas do servidor
const getUsersSecurely = createServerFn().handler(() => {
  const secret = process.env.SECRET; // Apenas no servidor
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

## Checklist de Produção

- [ ] **Análise de Bundle**: Verifique se o código exclusivo do servidor não está no bundle do cliente
- [ ] **Variáveis de Ambiente**: Certifique-se de que segredos usam `createServerOnlyFn()` ou `createServerFn()`
- [ ] **Lógica de Loaders**: Lembre-se de que loaders são isomórficos, não exclusivos do servidor
- [ ] **Fallbacks de ClientOnly**: Forneça fallbacks apropriados para evitar mudanças de layout
- [ ] **Error Boundaries**: Trate erros de execução no servidor/cliente de forma adequada

## Recursos Relacionados

- [Modelo de Execução](./execution-model.md) - Conceitos fundamentais e padrões arquiteturais
- [Server Functions](./server-functions.md) - Aprofundamento em padrões de server functions
- [Variáveis de Ambiente](./environment-variables.md) - Tratamento seguro de variáveis de ambiente
- [Middleware](./middleware.md) - Padrões de middleware para server functions
