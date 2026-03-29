# Paginas Customizadas

Exibe paginas de conteudo HTML criadas a partir de itens de menu com
`type=PAGE`. Acessivel para todos os usuarios autenticados que possuam o item de
menu visivel.

## Arquivos

| Arquivo          | Tipo         | Descricao                                                    |
| ---------------- | ------------ | ------------------------------------------------------------ |
| `$slug.tsx`      | Route config | Loader carrega dados da pagina via `pageDetailOptions(slug)` |
| `$slug.lazy.tsx` | Componente   | Renderiza titulo e conteudo HTML da pagina                   |

## Como Funciona

1. No cadastro de menus, um item de menu pode ter `type=PAGE` com conteudo HTML
   (rich text)
2. O menu gera um link para `/pages/:slug`
3. O loader busca a pagina pelo `slug` via `pageDetailOptions`
4. O componente exibe o nome da pagina como titulo e o HTML via `ContentViewer`
   (editor rich text em modo leitura)

## Dependencias

| Componente/Hook     | Funcao                                           |
| ------------------- | ------------------------------------------------ |
| `useSuspenseQuery`  | Carrega dados da pagina com Suspense             |
| `useParams`         | Extrai o `slug` da URL                           |
| `pageDetailOptions` | Query option para buscar detalhes da pagina      |
| `ContentViewer`     | Componente de visualizacao de conteudo rich text |
