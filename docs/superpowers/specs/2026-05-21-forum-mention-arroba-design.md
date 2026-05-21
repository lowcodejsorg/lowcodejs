# Forum — Mention via @arroba no Editor

**Data:** 2026-05-21  
**Status:** Aprovado

## Contexto

O Forum já suporta menções de usuário via `ForumUserMultiSelect` (dropdown separado abaixo do editor). O backend implementa o fluxo completo: persistência, email, notificação WebSocket e mark-as-read. O rich-editor já tem a extension de `@` pronta (`buildMentionExtension`, `extractMentionIds`, `MentionList`), usada no Kanban.

O gap é apenas wiring: o `Editor` no `forum-composer.tsx` não recebe a prop `mentions`, então não ativa o autocomplete de `@`. A decisão do usuário foi **manter o `ForumUserMultiSelect` e adicionar o `@` inline no editor** como mecanismo complementar.

## Design

### Fluxo após a mudança

1. Usuário digita `@` no editor → autocomplete aparece (igual ao Kanban)
2. Usuário seleciona → `@nome` inserido como mention node no texto
3. Usuário pode também selecionar via `ForumUserMultiSelect` (dropdown separado)
4. No envio: `extractMentionIds(editorRef)` extrai IDs do editor + `formMentions` do dropdown → merge com `Array.from(new Set([...]))`
5. Backend recebe `mentions: string[]` e processa normalmente (sem mudança)

### Edição de mensagem existente

- `handleStartEdit` não muda: editor carrega `message.text` (HTML com mention nodes já embutidos), `ForumUserMultiSelect` recebe todos os `mentionIds` do registro
- Possível duplicação de IDs (mesmo usuário no texto E no dropdown) → resolvida pela deduplicação no `handleSend`

## Arquivos a modificar

### `frontend/src/components/common/forum/forum-composer.tsx`

**Mudanças:**
1. Adicionar prop `onEditorReady?: (editor: TiptapEditor) => void`
2. Importar `useUserMentionSearch` de `@/hooks/use-user-mention-search`
3. Instanciar o hook dentro do componente: `const mentionSearch = useUserMentionSearch()`
4. Passar `mentions={{ enabled: true, resolveItems: mentionSearch.resolveItems }}` pro `Editor`
5. Passar `onEditorReady={onEditorReady}` pro `Editor`

**Imports necessários:**
```ts
import type { Editor as TiptapEditor } from '@tiptap/core';
import { useUserMentionSearch } from '@/hooks/use-user-mention-search';
```

### `frontend/src/components/common/table-views/table-forum-view.tsx`

**Mudanças:**
1. Importar `extractMentionIds` de `@/components/common/rich-editor`
2. Importar `type { Editor as TiptapEditor }` de `@tiptap/core`
3. Criar `const composerEditorRef = React.useRef<TiptapEditor | null>(null)`
4. Passar `onEditorReady={(editor) => { composerEditorRef.current = editor }}` ao `ForumComposer`
5. Em `handleSend`: substituir `mentions: formMentions` por:
   ```ts
   const editorMentionIds = extractMentionIds(composerEditorRef.current);
   const mentions = Array.from(new Set([...editorMentionIds, ...formMentions]));
   ```

## Componentes reutilizados (sem modificação)

| Arquivo | Papel |
|---|---|
| `rich-editor/extensions/mention.tsx` | `buildMentionExtension`, `extractMentionIds` |
| `rich-editor/bubble/mention-list.tsx` | Popup de autocomplete |
| `hooks/use-user-mention-search.tsx` | `resolveItems` — busca `/users/paginated` |
| `editor.tsx` prop `mentions?: MentionConfig` | Ativa a extension se `enabled: true` |
| `editor.tsx` prop `onEditorReady` | Expõe instância Tiptap ao pai |

## Backend (sem alteração)

`forum-message.use-case.ts` já processa `mentions: string[]` no payload POST/PUT, envia email e notificação WebSocket, e atualiza `mencoes-notificadas`. Nenhuma mudança necessária.

## Verificação

1. Abrir um Forum (tabela com estilo FORUM)
2. Digitar `@` no editor do compositor → dropdown de autocomplete deve aparecer
3. Selecionar usuário → `@nome` embutido no texto
4. Enviar mensagem → usuário mencionado recebe notificação
5. Selecionar usuário via `ForumUserMultiSelect` E via `@` no editor → no payload, IDs sem duplicatas
6. Editar mensagem com mention existente → editor carrega com mention node, dropdown carrega com mentionIds
7. Testar em resposta (reply) — mesmo compositor, mesmo comportamento
