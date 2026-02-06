---
id: environment-functions
title: Funções de Ambiente
---

## O Que São Funções de Ambiente?

Funções de ambiente são utilitários projetados para definir e controlar a execução de funções com base no ambiente de execução — seja no client ou no server. Esses utilitários ajudam a garantir que a lógica específica de cada ambiente seja executada de forma segura e intencional, prevenindo erros em runtime e melhorando a manutenibilidade em aplicações fullstack ou isomórficas.

O Start fornece três funções de ambiente principais:

- `createIsomorphicFn`: Compõe uma única função que se adapta tanto ao ambiente do client quanto ao do server.
- `createServerOnlyFn`: Cria uma função que só pode ser executada no server.
- `createClientOnlyFn`: Cria uma função que só pode ser executada no client.

---

## Funções Isomórficas

Use `createIsomorphicFn()` para definir funções que se comportam de maneira diferente dependendo de serem chamadas no client ou no server. Isso é útil para compartilhar lógica entre ambientes de forma segura, delegando o comportamento específico de cada ambiente para os handlers apropriados.

### Implementação Completa

```tsx
import { createIsomorphicFn } from "@tanstack/react-start";

const getEnv = createIsomorphicFn()
  .server(() => "server")
  .client(() => "client");

const env = getEnv();
// ℹ️ No **server**, retorna `'server'`.
// ℹ️ No **client**, retorna `'client'`.
```

### Implementação Parcial (Server)

Aqui está um exemplo de `createIsomorphicFn()` com apenas a implementação para o server:

```tsx
import { createIsomorphicFn } from "@tanstack/react-start";

const serverImplementationOnly = createIsomorphicFn().server(() => "server");

const server = serverImplementationOnly();
// ℹ️ No **server**, retorna `'server'`.
// ℹ️ No **client**, é no-op (retorna `undefined`)
```

### Implementação Parcial (Client)

Aqui está um exemplo de `createIsomorphicFn()` com apenas a implementação para o client:

```tsx
import { createIsomorphicFn } from "@tanstack/react-start";

const clientImplementationOnly = createIsomorphicFn().client(() => "client");

const client = clientImplementationOnly();
// ℹ️ No **server**, é no-op (retorna `undefined`)
// ℹ️ No **client**, retorna `'client'`.
```

### Sem Implementação

Aqui está um exemplo de `createIsomorphicFn()` sem nenhuma implementação específica de ambiente:

```tsx
import { createIsomorphicFn } from "@tanstack/react-start";

const noImplementation = createIsomorphicFn();

const noop = noImplementation();
// ℹ️ Tanto no **client** quanto no **server**, é no-op (retorna `undefined`)
```

#### O que é um no-op?

Um no-op (abreviação de "no operation", ou "nenhuma operação") é uma função que não faz nada quando executada — simplesmente retorna `undefined` sem realizar nenhuma operação.

```tsx
// implementação básica de no-op
function noop() {}
```

---

## Funções `env`Only

Os helpers `createServerOnlyFn` e `createClientOnlyFn` impõem execução estritamente vinculada ao ambiente. Eles garantem que a função retornada só possa ser chamada no contexto de runtime correto. Se usados incorretamente, lançam erros descritivos em runtime para evitar execução não intencional de lógica.

### `createServerOnlyFn`

```tsx
import { createServerOnlyFn } from "@tanstack/react-start";

const foo = createServerOnlyFn(() => "bar");

foo(); // ✅ No server: retorna "bar"
// ❌ No client: lança "createServerOnlyFn() functions can only be called on the server!"
```

### `createClientOnlyFn`

```tsx
import { createClientOnlyFn } from "@tanstack/react-start";

const foo = createClientOnlyFn(() => "bar");

foo(); // ✅ No client: retorna "bar"
// ❌ No server: lança "createClientOnlyFn() functions can only be called on the client!"
```

> [!NOTE]
> Essas funções são úteis para acesso a APIs, leitura do sistema de arquivos, uso de APIs do navegador ou outras operações que são inválidas ou inseguras fora do ambiente pretendido.

## Tree Shaking

As funções de ambiente passam por tree shaking com base no ambiente para cada bundle produzido.

Funções criadas usando `createIsomorphicFn()` passam por tree shaking. Todo o código dentro de `.client()` não é incluído no bundle do server, e vice-versa.

No server, funções criadas usando `createClientOnlyFn()` são substituídas por uma função que lança um `Error` no server. O inverso é verdadeiro para funções `createServerOnlyFn` no client.
