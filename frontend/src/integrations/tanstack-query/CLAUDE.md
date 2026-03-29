# Integracao TanStack Query

Camada minima de integracao do TanStack Query (React Query). Fornece o provider
e painel de devtools.

## Arquivos

| Arquivo             | Descricao                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `root-provider.tsx` | Componente `Provider` que envolve a aplicacao com `QueryClientProvider`                      |
| `devtools.tsx`      | Exporta configuracao do `ReactQueryDevtoolsPanel` para uso em ferramentas de desenvolvimento |

## Configuracao do QueryClient

O `QueryClient` nao e criado aqui. Ele e importado de `@/lib/query-client` e
repassado ao `QueryClientProvider`. Para alterar configuracoes de cache, retry
ou staleTime, edite o arquivo em `@/lib/query-client`.

## Hooks de Dados

Os hooks de queries e mutations nao ficam neste diretorio. Eles estao
localizados em `@/hooks/tanstack-query/`, onde sao gerados e organizados por
entidade.
