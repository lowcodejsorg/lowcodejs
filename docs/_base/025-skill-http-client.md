# Skill: HTTP Client (Axios)

O HTTP Client e a camada de comunicacao entre o frontend e a API backend. Ele encapsula uma instancia singleton do Axios configurada com `baseURL` via variavel de ambiente, `withCredentials: true` para envio automatico de cookies HTTP-only e interceptors para tratamento centralizado de erros de request e response. Toda comunicacao HTTP do frontend passa obrigatoriamente por essa instancia, garantindo consistencia na autenticacao, tratamento de erros e configuracao de headers.

---

## Estrutura do Arquivo

O HTTP client deve estar localizado em:

```
frontend/src/lib/api.ts
```

Existe uma unica instancia exportada (`API`) que e reutilizada por todos os hooks de query e mutation do projeto. Nao existem multiplas instancias ou clientes alternativos.

Dependencias tipicas:

- **axios** - biblioteca HTTP client
- **Env** - objeto de variaveis de ambiente tipadas (`@/env`)

---

## Template

```typescript
import axios from 'axios';
import { Env } from '@/env';

const API = axios.create({
  baseURL: Env.VITE_API_BASE_URL,
  withCredentials: true,
});

API.interceptors.request.use(
  function (config) {
    // Modificacoes no config antes do envio (ex: headers dinamicos)
    return config;
  },
  function (error) {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  },
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Tratamento centralizado de erros HTTP
    // Ex: redirect para login em caso de 401
    // if (error.response?.status === 401) {
    //   localStorage.clear();
    //   await API.post('/authentication/sign-out');
    //   window.location.href = '/';
    // }
    return Promise.reject(error);
  },
);

export { API };
```

---

## Exemplo Real

```typescript
import axios from 'axios';
import { Env } from '@/env';

const API = axios.create({
  baseURL: Env.VITE_API_BASE_URL,
  withCredentials: true,
});

API.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  },
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Interceptor de 401 para refresh/logout:
    // if (error.response?.status === 401) {
    //   localStorage.clear();
    //   await API.post('/authentication/sign-out');
    //   window.location.href = '/';
    // }
    return Promise.reject(error);
  },
);

export { API };
```

Leitura do exemplo:

1. `axios.create()` cria uma instancia isolada com `baseURL` vindo de `Env.VITE_API_BASE_URL` e `withCredentials: true` para que cookies HTTP-only sejam enviados automaticamente em todas as requests.
2. O interceptor de request repassa o `config` sem modificacao no caminho de sucesso e loga erros de configuracao no console antes de rejeitar.
3. O interceptor de response repassa a response no caminho de sucesso. No caminho de erro, o pattern de 401 (comentado mas presente como referencia) limpa o `localStorage`, faz sign-out na API e redireciona para a raiz.
4. A instancia `API` e exportada como named export e consumida diretamente pelos hooks de query e mutation.

---

## Regras e Convencoes

1. **Singleton pattern** -- existe uma unica instancia `API` criada com `axios.create()`. Nunca crie instancias adicionais do Axios. Todos os modulos do frontend importam e utilizam essa mesma instancia.

2. **`withCredentials: true` e obrigatorio** -- a autenticacao do projeto utiliza cookies HTTP-only. Sem essa flag, os cookies nao sao enviados nas requests cross-origin e a autenticacao falha silenciosamente.

3. **`baseURL` via variavel de ambiente** -- a URL base da API vem exclusivamente de `Env.VITE_API_BASE_URL`. Nunca hardcode URLs no client. Isso permite ambientes diferentes (development, staging, production) sem alteracao de codigo.

4. **Interceptors sao o ponto centralizado de tratamento** -- toda logica transversal de request (adicionar headers, tokens) e response (tratar 401, refresh token, logging) deve ficar nos interceptors, nunca dispersa em hooks ou componentes individuais.

5. **O interceptor de response deve sempre retornar `Promise.reject(error)`** no caminho de erro. Engolir erros silenciosamente impede que os hooks de query/mutation tratem falhas corretamente.

6. **O interceptor de request deve sempre retornar `config`** no caminho de sucesso. Esquecer o `return config` faz com que todas as requests falhem com `undefined`.

7. **Nunca importe `axios` diretamente nos hooks ou componentes.** Sempre importe `API` de `@/lib/api`. Usar `axios` diretamente ignora o `baseURL`, `withCredentials` e os interceptors configurados.

8. **O export e named (`export { API }`)** -- nao use default export. Isso garante consistencia nos imports em todo o projeto.

---

## Checklist

- [ ] Arquivo localizado em `frontend/src/lib/api.ts`
- [ ] Instancia criada com `axios.create()` (nao `axios` global)
- [ ] `baseURL` configurado via `Env.VITE_API_BASE_URL`
- [ ] `withCredentials: true` presente na configuracao
- [ ] Interceptor de request configurado com retorno de `config` e tratamento de erro
- [ ] Interceptor de response configurado com retorno de `response` e tratamento de erro
- [ ] Interceptor de response rejeita erros com `Promise.reject(error)` (nao engole erros)
- [ ] Pattern de tratamento de 401 presente (ativo ou preparado como referencia)
- [ ] Export como named export: `export { API }`
- [ ] Nenhum outro modulo cria instancias Axios adicionais
- [ ] Nenhum hook ou componente importa `axios` diretamente

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Cookies nao enviados nas requests | Faltou `withCredentials: true` no `axios.create()` | Adicionar `withCredentials: true` na configuracao da instancia |
| Request falha com URL errada em producao | `baseURL` hardcoded em vez de usar variavel de ambiente | Usar `Env.VITE_API_BASE_URL` como `baseURL` |
| Hook de mutation nao recebe erro do backend | Interceptor de response engoliu o erro (faltou `Promise.reject`) | Garantir que o interceptor de response sempre retorna `Promise.reject(error)` no caminho de erro |
| Todas as requests retornam `undefined` | Interceptor de request nao retorna `config` no caminho de sucesso | Adicionar `return config` no callback de sucesso do interceptor de request |
| Interceptors nao aplicados em certas requests | Componente importou `axios` diretamente em vez de `API` | Substituir `import axios from 'axios'` por `import { API } from '@/lib/api'` |
| Multiplas instancias com configuracoes divergentes | Criacao de `axios.create()` em mais de um lugar | Centralizar em `frontend/src/lib/api.ts` e reutilizar a instancia `API` |
| Usuario nao redirecionado apos sessao expirar | Interceptor de 401 nao ativado ou mal implementado | Implementar o pattern de 401 no interceptor de response: limpar storage, sign-out e redirect |

---

> **Cross-references:** ver [017-skill-hook-query.md](./017-skill-hook-query.md) | [018-skill-hook-mutation.md](./018-skill-hook-mutation.md)
