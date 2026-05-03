# Workshop de Extensões

Página de gestão das extensões registradas no sistema. Restrita a usuários com
role MASTER.

## Arquivos

| Arquivo                            | Tipo         | Descrição                                                                |
| ---------------------------------- | ------------ | ------------------------------------------------------------------------ |
| `index.tsx`                        | Route config | `beforeLoad` valida MASTER, loader prefetch `extensionListOptions()`     |
| `index.lazy.tsx`                   | Componente   | Listagem por pacote, toggle de ativação, sheet de escopo por tabela      |
| `-extensions-page-skeleton.tsx`    | Privado      | Skeleton exibido durante prefetch                                        |

## Fluxo

1. Loader prefetch da lista
2. `useSuspenseQuery(extensionListOptions())` no componente
3. Renderiza grupos por `pkg`, com card por extensão
4. Toggle de ativação — `useExtensionToggle` (mutation)
5. Para plugins: botão "Configurar" abre sheet com modo `all` ou `specific` +
   `TableMultiSelect` — `useExtensionConfigureTableScope`

## Controle de acesso

- `beforeLoad`: redireciona não-MASTER para `/tables`
- Backend: `RoleMiddleware([E_ROLE.MASTER])` em todas as rotas `/extensions`

## Observações

- A lista vem do backend que faz scan de `backend/extensions/` no boot
- Extensões com `available: false` (manifest sumiu do disco) ficam visíveis mas
  não podem ser ativadas — exibem alerta vermelho
- Configuração de escopo só aparece para `type === PLUGIN`
- Configuração de escopo `all` zera o array `tableIds`
