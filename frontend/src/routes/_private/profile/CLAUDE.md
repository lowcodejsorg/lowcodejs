# Perfil do Usuario

Pagina de visualizacao e edicao do perfil do usuario logado. Acessivel para
todos os usuarios autenticados.

## Arquivos

| Arquivo                     | Tipo         | Descricao                                                          |
| --------------------------- | ------------ | ------------------------------------------------------------------ |
| `index.tsx`                 | Route config | Loader carrega `profileDetailOptions()`, define head e skeleton    |
| `index.lazy.tsx`            | Componente   | Alterna entre modo visualizacao e edicao do perfil                 |
| `-view.tsx`                 | Privado      | Exibe dados do perfil em modo somente leitura (nome, email, grupo) |
| `-update-form.tsx`          | Privado      | Campos do formulario de edicao e schema de validacao               |
| `-update-form-skeleton.tsx` | Privado      | Skeleton exibido durante carregamento                              |

## Campos Editaveis

- **Nome** e **Email**: sempre editaveis
- **Senha**: edicao condicional via toggle `allowPasswordChange` -- exige senha
  atual, nova senha e confirmacao

## Hooks Utilizados

| Hook               | Origem                    | Funcao                                                      |
| ------------------ | ------------------------- | ----------------------------------------------------------- |
| `useSuspenseQuery` | TanStack Query            | Carrega dados do perfil com Suspense                        |
| `useUpdateProfile` | `use-profile-update`      | Mutation para atualizar o perfil                            |
| `useAppForm`       | `tanstack-form/form-hook` | Gerencia formulario com validacao via `ProfileUpdateSchema` |
| `useRouter`        | TanStack Router           | Navegacao e invalidacao de cache apos salvar                |

## Fluxo

- Modo `show`: exibe `ProfileView` com botao "Editar"
- Modo `edit`: exibe formulario com botoes "Cancelar" e "Salvar"
- Apos salvar com sucesso: reseta formulario, volta para modo `show`, invalida o
  router
