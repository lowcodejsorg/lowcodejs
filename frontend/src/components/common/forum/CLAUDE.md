# Forum

Componentes de forum com canais, mensagens, compositor rich-text, mencoes,
reacoes e gerenciamento de documentos compartilhados.

## Arquivos

| Arquivo                           | Descricao                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `index.ts`                        | Barrel de exports do modulo                                                                                   |
| `forum-types.ts`                  | Tipos ForumMessage (texto, autor, anexos, mencoes, reacoes, reply) e ForumDocument                            |
| `forum-sidebar.tsx`               | Sidebar de canais com lista de rows, badge de mencoes, botoes de editar/excluir canal                         |
| `forum-header.tsx`                | Header do forum com titulo, descricao e toggle de layout do compositor (side/bottom)                          |
| `forum-messages-list.tsx`         | Lista de mensagens com scroll, reply snippets, reacoes, IntersectionObserver para mencoes e highlight animado |
| `forum-composer.tsx`              | Compositor de mensagens com rich-editor, file upload, mencoes de usuario e reply                              |
| `forum-documents.tsx`             | Grid de documentos/arquivos compartilhados nas mensagens com thumbnail                                        |
| `forum-add-channel-dialog.tsx`    | Dialog para criar canal com nome, descricao, privacidade e selecao de membros                                 |
| `forum-edit-channel-dialog.tsx`   | Dialog para editar canal (mesmo layout do add, com dados pre-preenchidos)                                     |
| `forum-delete-channel-dialog.tsx` | Dialog de confirmacao para excluir canal                                                                      |
| `forum-delete-message-dialog.tsx` | Dialog de confirmacao para excluir mensagem                                                                   |
| `forum-user-multi-select.tsx`     | Combobox multi-select de usuarios com busca debounced e cache local                                           |

## Dependencias principais

- `Editor` e `ContentViewer` de `@/components/common/rich-editor` para
  compositor e visualizacao
- `FileUploadWithStorage` de `@/components/common/file-upload` para anexos
- `useUserReadPaginated` para busca paginada de usuarios
- `@/lib/forum-helpers` (stripHtml) para preview de replies

## Padroes importantes

- Layout do compositor e configuravel: `side` (painel lateral 360px) ou `bottom`
  (embaixo, max 40vh)
- Mensagens suportam reply-to, reacoes (like/love) e mencoes com badge
- IntersectionObserver rastreia visibilidade de mensagens com mencao para marcar
  como lida
- Flash highlight animado (3.5s) ao scroll para mensagem especifica
- Canais suportam privacidade (publico/privado) com selecao de membros para
  canais privados
- ForumUserMultiSelect usa cache Map<string, IUser> para manter usuarios
  selecionados entre buscas
