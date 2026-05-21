# Forum — Mention via @arroba Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ativar autocomplete de menção via `@` no editor do Forum, complementando o `ForumUserMultiSelect` já existente.

**Architecture:** Passar `mentions` e `onEditorReady` ao `Editor` dentro do `ForumComposer`; no `table-forum-view.tsx`, capturar a instância Tiptap via ref e, no envio, fazer merge deduplicado dos IDs do editor com os IDs do dropdown.

**Tech Stack:** React 19, Tiptap 3, `extractMentionIds` (já exportado de `rich-editor`), `useUserMentionSearch` (hook existente), TypeScript 5.

---

## Arquivos modificados

| Arquivo | O que muda |
|---|---|
| `frontend/src/components/common/forum/forum-composer.tsx` | Adicionar prop `onEditorReady`, instanciar `useUserMentionSearch`, passar `mentions` e `onEditorReady` ao `Editor` |
| `frontend/src/components/common/table-views/table-forum-view.tsx` | Criar `composerEditorRef`, passar `onEditorReady` ao `ForumComposer`, merge de IDs em `handleSend` |

## Componentes reutilizados (zero modificação)

- `rich-editor/extensions/mention.tsx` — `buildMentionExtension`, `extractMentionIds`
- `rich-editor/bubble/mention-list.tsx` — popup de autocomplete
- `hooks/use-user-mention-search.tsx` — `resolveItems` busca `/users/paginated`
- `editor.tsx` props `mentions?: MentionConfig` e `onEditorReady?: (editor: TiptapEditor) => void` — já implementados

---

## Task 1: Atualizar `forum-composer.tsx`

**Files:**
- Modify: `frontend/src/components/common/forum/forum-composer.tsx`

- [ ] **Step 1: Adicionar import do `useUserMentionSearch` e tipo `TiptapEditor`**

Adicionar no topo do arquivo, após os imports existentes:

```tsx
import type { Editor as TiptapEditor } from '@tiptap/core';
import { useUserMentionSearch } from '@/hooks/use-user-mention-search';
```

- [ ] **Step 2: Adicionar prop `onEditorReady` na interface `ForumComposerProps`**

Localizar a interface (linha 12) e adicionar a prop opcional:

```tsx
interface ForumComposerProps {
  composerLayout: 'side' | 'bottom';
  composerText: string;
  onTextChange: (value: string) => void;
  focusKey?: string | number;
  replyMessage: { author?: IUser | string | null } | null;
  onCancelReply: () => void;
  composerStorages: Array<IStorage>;
  onRemoveStorage: (storageId: string) => void;
  composerMentions: Array<string>;
  onMentionsChange: (value: Array<string>) => void;
  onMentionUsersChange?: (users: Array<IUser>) => void;
  composerFiles: Array<File>;
  onFilesChange: (value: Array<File>) => void;
  onStoragesChange: (storages: Array<IStorage>) => void;
  onSend: () => void;
  isEditing: boolean;
  onCancelEdit: () => void;
  onUploadingChange?: (isUploading: boolean) => void;
  onEditorReady?: (editor: TiptapEditor) => void;
}
```

- [ ] **Step 3: Desestruturar `onEditorReady` na assinatura da função**

Localizar a desestruturação de props na função `ForumComposer` e adicionar `onEditorReady`:

```tsx
export function ForumComposer({
  composerLayout,
  composerText,
  onTextChange,
  focusKey,
  replyMessage,
  onCancelReply,
  composerStorages,
  onRemoveStorage,
  composerMentions,
  onMentionsChange,
  onMentionUsersChange,
  composerFiles,
  onFilesChange,
  onStoragesChange,
  onSend,
  isEditing,
  onCancelEdit,
  onUploadingChange,
  onEditorReady,
}: ForumComposerProps): React.JSX.Element {
```

- [ ] **Step 4: Instanciar `useUserMentionSearch` no corpo da função**

Logo após a linha `const [isFileUploading, setIsFileUploading] = React.useState(false);`, adicionar:

```tsx
const mentionSearch = useUserMentionSearch();
```

- [ ] **Step 5: Passar `mentions` e `onEditorReady` ao componente `Editor`**

Localizar o uso de `<Editor` (por volta da linha 97) e adicionar as duas props:

```tsx
<Editor
  value={composerText}
  onChange={onTextChange}
  debounceMs={0}
  variant="compact"
  showToolbar={true}
  showBubble={false}
  showModeToggle={false}
  autoFocus
  focusKey={focusKey}
  className={cn(
    composerLayout === 'side' && 'max-h-none',
    composerLayout !== 'side' && 'max-h-[200px] min-h-[120px] p-0 gap-2',
  )}
  mentions={{ enabled: true, resolveItems: mentionSearch.resolveItems }}
  onEditorReady={onEditorReady}
/>
```

- [ ] **Step 6: Verificar TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "forum-composer"
```

Esperado: nenhuma linha de erro.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/common/forum/forum-composer.tsx
git commit -m "feat(forum): ativar autocomplete @mention no editor do compositor"
```

---

## Task 2: Atualizar `table-forum-view.tsx`

**Files:**
- Modify: `frontend/src/components/common/table-views/table-forum-view.tsx`

- [ ] **Step 1: Adicionar imports de `extractMentionIds` e `TiptapEditor`**

No topo do arquivo, após os imports existentes do `rich-editor` (ou adicionar novo import):

```tsx
import type { Editor as TiptapEditor } from '@tiptap/core';
import { extractMentionIds } from '@/components/common/rich-editor';
```

- [ ] **Step 2: Criar `composerEditorRef`**

Após a linha onde `messagesEndRef` é criado (linha ~140), adicionar:

```tsx
const composerEditorRef = React.useRef<TiptapEditor | null>(null);
```

- [ ] **Step 3: Atualizar `handleSend` para fazer merge de IDs**

Localizar `handleSend` (linha ~1076). Substituir:

```tsx
const { text: formText, mentions: formMentions } =
  composerForm.state.values;
```

por:

```tsx
const { text: formText, mentions: formMentions } =
  composerForm.state.values;
const editorMentionIds = extractMentionIds(composerEditorRef.current);
const mentions = Array.from(new Set([...editorMentionIds, ...formMentions]));
```

E no payload (linha ~1099), substituir `mentions: formMentions` por `mentions`:

```tsx
const payload = {
  text: formText || '',
  mentions,
  attachments,
  replyTo: replyToId ?? null,
};
```

- [ ] **Step 4: Passar `onEditorReady` ao `ForumComposer`**

Localizar o uso de `<ForumComposer` (linha ~1463) e adicionar a prop:

```tsx
<ForumComposer
  composerLayout={composerLayout}
  composerText={composerText}
  onTextChange={(value) =>
    composerForm.setFieldValue('text', value)
  }
  focusKey={focusTick}
  replyMessage={replyMessage}
  onCancelReply={() => setReplyToId(null)}
  composerStorages={composerStorages}
  onRemoveStorage={(storageId) =>
    setComposerStorages((prev) =>
      prev.filter((item) => item._id !== storageId),
    )
  }
  composerMentions={composerMentions}
  onMentionsChange={(value) =>
    composerForm.setFieldValue('mentions', value)
  }
  composerFiles={composerFiles}
  onFilesChange={(value) =>
    composerForm.setFieldValue('files', value)
  }
  onStoragesChange={(storages) =>
    setComposerStorages((prev) => {
      const map = new Map(prev.map((item) => [item._id, item]));
      storages.forEach((item) => map.set(item._id, item));
      return Array.from(map.values());
    })
  }
  onSend={handleSend}
  isEditing={editingIndex !== null}
  onCancelEdit={resetComposer}
  onEditorReady={(editor) => {
    composerEditorRef.current = editor;
  }}
/>
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "table-forum-view"
```

Esperado: nenhuma linha de erro.

- [ ] **Step 6: Verificar TypeScript completo**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

Esperado: nenhum erro.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/common/table-views/table-forum-view.tsx
git commit -m "feat(forum): capturar editor ref e mesclar mention IDs no envio"
```

---

## Verificação end-to-end

1. Subir o stack: `docker compose up -d`
2. Abrir tabela com estilo FORUM no navegador
3. Clicar no compositor de mensagens
4. Digitar `@` → dropdown de autocomplete deve aparecer com usuários ativos
5. Selecionar usuário → `@nome` inserido no texto como mention node
6. Enviar mensagem → usuário mencionado recebe notificação por WebSocket e email
7. Selecionar outro usuário via `ForumUserMultiSelect` E via `@` → enviar → verificar no payload (DevTools Network) que `mentions` não tem IDs duplicados
8. Editar mensagem com mention existente → editor deve carregar com mention node preservado, dropdown com mentionIds
9. Testar em reply → mesmo compositor, mesmo comportamento
