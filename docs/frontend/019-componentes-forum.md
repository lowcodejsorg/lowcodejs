# 019 - Componentes Forum

Documentacao dos componentes do sistema de forum localizados em `src/components/forum/`. O forum permite comunicacao em canais com mensagens ricas, anexos, mencoes, reacoes e respostas.

---

## Visao Geral

| Arquivo | Componente | Descricao |
|---------|-----------|-----------|
| `index.ts` | Re-exportacoes | Barrel file com exports publicos |
| `forum-types.ts` | `ForumMessage`, `ForumDocument` | Tipos TypeScript |
| `forum-header.tsx` | `ForumHeader` | Cabecalho do forum |
| `forum-sidebar.tsx` | `ForumSidebar` | Lista de canais lateral |
| `forum-messages-list.tsx` | `ForumMessagesList` | Lista de mensagens |
| `forum-composer.tsx` | `ForumComposer` | Area de composicao de mensagem |
| `forum-documents.tsx` | `ForumDocuments` | Lista de documentos compartilhados |
| `forum-add-channel-dialog.tsx` | `ForumAddChannelDialog` | Dialog para criar canal |
| `forum-edit-channel-dialog.tsx` | `ForumEditChannelDialog` | Dialog para editar canal |
| `forum-delete-channel-dialog.tsx` | `ForumDeleteChannelDialog` | Dialog de confirmacao para excluir canal |
| `forum-delete-message-dialog.tsx` | `ForumDeleteMessageDialog` | Dialog de confirmacao para excluir mensagem |
| `forum-user-multi-select.tsx` | `ForumUserMultiSelect` | Multi-select de usuarios para mencoes |

---

## Tipos (forum-types.ts)

```tsx
import type { IStorage, IUser } from '@/lib/interfaces';

export type ForumMessage = {
  id: string;                                    // ID unico da mensagem
  text: string;                                  // Conteudo HTML
  author: IUser | string | null;                 // Autor (objeto ou string)
  authorId: string | null;                       // ID do autor
  dateLabel: string;                             // Data formatada para exibicao
  dateValue: string | null;                      // Data ISO
  attachments: Array<IStorage>;                  // Arquivos anexados
  mentions: Array<IUser | string>;               // Usuarios mencionados
  replyTo: string | null;                        // ID da mensagem respondida
  reactions: Array<{                             // Reacoes
    emoji: string;                               // Emoji da reacao
    users: Array<string>;                        // IDs dos usuarios que reagiram
  }>;
  raw: Record<string, unknown>;                  // Dados brutos do registro
};

export type ForumDocument = {
  messageId: string;                             // ID da mensagem que contem o arquivo
  file: IStorage;                                // Dados do arquivo
  author: IUser | string | null;                 // Autor da mensagem
  dateLabel: string;                             // Data formatada
};
```

---

## ForumHeader

**Arquivo:** `src/components/forum/forum-header.tsx`

Cabecalho do forum que exibe o titulo do canal, descricao e controle de layout do compositor.

```tsx
interface ForumHeaderProps {
  title: string;                               // Nome do canal
  description: string;                         // Descricao do canal
  composerLayout: 'side' | 'bottom';          // Layout atual do compositor
  onChangeLayout: (layout: 'side' | 'bottom') => void;
}
```

**Funcionalidades:**
- Exibe titulo e descricao do canal ativo
- Toggle entre dois layouts do compositor:
  - `'bottom'` - Compositor na parte inferior (icone rotacionado 90 graus)
  - `'side'` - Compositor ao lado (360px de largura)

```tsx
<ForumHeader
  title="geral"
  description="Canal para discussoes gerais"
  composerLayout={layout}
  onChangeLayout={setLayout}
/>
```

---

## ForumSidebar

**Arquivo:** `src/components/forum/forum-sidebar.tsx`

Sidebar lateral com a lista de canais do forum. Suporta colapso, controle de acesso e gerenciamento de canais.

```tsx
interface ForumSidebarProps {
  rows: Array<IRow>;                           // Lista de canais (rows da tabela)
  activeRowId: string | null;                  // ID do canal ativo
  channelField?: IField | null;                // Campo que contem o nome do canal
  canAddChannel: boolean;                      // Permissao para criar canais
  isOpen: boolean;                             // Estado de abertura
  onToggleOpen: () => void;                    // Toggle abrir/fechar
  onAddChannel: () => void;                    // Callback para criar canal
  onSelectRow: (rowId: string) => void;        // Callback para selecionar canal
  canAccessRow: (row: IRow) => boolean;        // Verifica acesso ao canal
  canManageRow: (row: IRow) => boolean;        // Verifica permissao de gerenciamento
  onEditRow: (row: IRow) => void;              // Callback para editar canal
  onDeleteRow: (row: IRow) => void;            // Callback para excluir canal
}
```

**Funcionalidades:**

- **Colapso** - Sidebar colapsavel de 256px para 40px com botoes `PanelLeftCloseIcon`/`PanelLeftOpenIcon`
- **Icones de acesso:**
  - `#` (hash) - Canal acessivel ao usuario
  - `LockIcon` - Canal sem acesso (privado)
- **Gerenciamento** (visivel no hover se `canManageRow` retorna `true`):
  - `PencilIcon` - Botao de editar canal
  - `TrashIcon` - Botao de excluir canal
- **Botao de adicionar** - Icone `PlusIcon` visivel se `canAddChannel` e `true`
- **Estado vazio** - Texto "Nenhum canal criado." quando a lista esta vazia

```tsx
<ForumSidebar
  rows={channels}
  activeRowId={selectedChannelId}
  channelField={channelNameField}
  canAddChannel={hasCreatePermission}
  isOpen={sidebarOpen}
  onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
  onAddChannel={() => setAddDialogOpen(true)}
  onSelectRow={handleSelectChannel}
  canAccessRow={(row) => checkAccess(row)}
  canManageRow={(row) => checkManage(row)}
  onEditRow={(row) => openEditDialog(row)}
  onDeleteRow={(row) => openDeleteDialog(row)}
/>
```

---

## ForumMessagesList

**Arquivo:** `src/components/forum/forum-messages-list.tsx`

Lista scrollavel de mensagens do canal com suporte a respostas, reacoes, anexos e mencoes.

```tsx
interface ForumMessagesListProps {
  messages: Array<ForumMessage>;               // Lista de mensagens
  currentUserId: string;                       // ID do usuario atual
  endRef: React.RefObject<HTMLDivElement | null>; // Ref para scroll automatico
  onReply: (messageId: string) => void;        // Callback para responder
  onEdit: (index: number) => void;             // Callback para editar
  onDelete: (index: number) => void;           // Callback para excluir
  onToggleReaction: (index: number, emoji: string) => void; // Toggle de reacao
}
```

**Estrutura de cada mensagem:**

| Elemento | Descricao |
|----------|-----------|
| Avatar | `AvatarFallback` com iniciais do autor via `getUserInitials` |
| Nome do autor | Extraido de `message.author` (objeto ou string) |
| Data | `message.dateLabel` |
| Botoes editar/excluir | Visiveis apenas para o autor da mensagem (`canManage`) |
| Quote de resposta | Exibido se `message.replyTo` aponta para outra mensagem |
| Conteudo HTML | Renderizado via `dangerouslySetInnerHTML` com classe `prose prose-sm` |
| Anexos | Grid de arquivos com preview de imagens (48x48px) ou icone `FileIcon` |
| Mencoes | Badges `@nomeDoUsuario` |
| Reacoes | Botoes de responder, like e love com contadores |

**Reacoes suportadas:**

| Emoji | Estilo quando ativo |
|-------|-------------------|
| `👍` (like) | `bg-primary/10 text-primary` |
| `❤️` (love) | `bg-primary/10 text-primary` |

```tsx
<ForumMessagesList
  messages={channelMessages}
  currentUserId={userId}
  endRef={messagesEndRef}
  onReply={handleReply}
  onEdit={handleEditMessage}
  onDelete={handleDeleteMessage}
  onToggleReaction={handleToggleReaction}
/>
```

---

## ForumComposer

**Arquivo:** `src/components/forum/forum-composer.tsx`

Area de composicao de mensagens com editor de texto rico, upload de arquivos e mencoes.

```tsx
interface ForumComposerProps {
  composerLayout: 'side' | 'bottom';          // Layout do compositor
  composerText: string;                        // Conteudo HTML do editor
  onTextChange: (value: string) => void;       // Callback de mudanca de texto
  focusKey?: string | number;                  // Key para forcar re-focus
  replyMessage: { author?: IUser | string | null } | null; // Mensagem sendo respondida
  onCancelReply: () => void;                   // Cancelar resposta
  composerStorages: Array<IStorage>;           // Arquivos ja enviados ao storage
  onRemoveStorage: (storageId: string) => void; // Remover arquivo
  composerMentions: Array<string>;             // IDs dos usuarios mencionados
  onMentionsChange: (value: Array<string>) => void;
  onMentionUsersChange?: (users: Array<IUser>) => void;
  composerFiles: Array<File>;                  // Arquivos locais
  onFilesChange: (value: Array<File>) => void;
  onStoragesChange: (storages: Array<IStorage>) => void;
  onSend: () => void;                         // Callback para enviar
  isEditing: boolean;                          // Modo edicao
  onCancelEdit: () => void;                    // Cancelar edicao
  onUploadingChange?: (isUploading: boolean) => void;
}
```

**Componentes internos:**

| Componente | Descricao |
|-----------|-----------|
| Banner de resposta | Mostra "Respondendo a [autor]" com botao cancelar |
| `EditorExample` | Editor TipTap no modo `compact` com toolbar `minimal` |
| Lista de storages | Chips com nome do arquivo e botao de remocao |
| `ForumUserMultiSelect` | Multi-select de usuarios para mencoes |
| `FileUploadWithStorage` | Upload de arquivos (max 5) |
| Botao "Enviar"/"Salvar" | Desabilitado durante upload |
| Botao "Cancelar" | Visivel apenas no modo edicao |

**Layout:**
- `'bottom'` - Compositor na parte inferior com `max-h-[40vh]` e scroll vertical
- `'side'` - Compositor lateral com `w-[360px]`, borda esquerda e mais espacamento

```tsx
<ForumComposer
  composerLayout="bottom"
  composerText={text}
  onTextChange={setText}
  replyMessage={replyingTo}
  onCancelReply={() => setReplyingTo(null)}
  composerStorages={uploadedStorages}
  onRemoveStorage={handleRemoveStorage}
  composerMentions={mentions}
  onMentionsChange={setMentions}
  composerFiles={files}
  onFilesChange={setFiles}
  onStoragesChange={setUploadedStorages}
  onSend={handleSendMessage}
  isEditing={isEditing}
  onCancelEdit={handleCancelEdit}
/>
```

---

## Dialogs de Canal

### ForumAddChannelDialog

Dialog para criar um novo canal no forum. Renderiza um formulario com os campos necessarios para o canal.

### ForumEditChannelDialog

Dialog para editar um canal existente. Pre-preenche os campos com os dados do canal selecionado.

### ForumDeleteChannelDialog

Dialog de confirmacao para excluir um canal. Exibe uma mensagem de confirmacao antes de prosseguir.

---

## ForumDeleteMessageDialog

Dialog de confirmacao para excluir uma mensagem. Solicita confirmacao do usuario antes de remover a mensagem permanentemente.

---

## ForumUserMultiSelect

**Arquivo:** `src/components/forum/forum-user-multi-select.tsx`

Multi-select de usuarios para mencoes em mensagens. Permite buscar e selecionar multiplos usuarios do sistema.

```tsx
// Uso tipico dentro do ForumComposer
<ForumUserMultiSelect
  value={composerMentions}
  onChange={onMentionsChange}
  onSelectedUsersChange={onMentionUsersChange}
/>
```

---

## ForumDocuments

**Arquivo:** `src/components/forum/forum-documents.tsx`

Componente que lista todos os documentos/arquivos compartilhados nas mensagens do canal. Utiliza o tipo `ForumDocument` para exibir arquivo, autor e data.

---

## Fluxo Completo de Mensagem

```
1. Usuario digita no EditorExample (TipTap compact)
2. Opcionalmente:
   a. Seleciona usuarios para mencao via ForumUserMultiSelect
   b. Anexa arquivos via FileUploadWithStorage
   c. Responde a mensagem existente (banner de resposta)
3. Clica em "Enviar"
4. onSend callback:
   a. Coleta texto HTML do editor
   b. Coleta IDs dos storages (arquivos)
   c. Coleta IDs dos usuarios mencionados
   d. Coleta ID da mensagem sendo respondida (replyTo)
   e. Monta payload e envia via API
5. Mensagem aparece na ForumMessagesList
6. Scroll automatico para o final via endRef
```

---

## Fluxo de Reacao

```
1. Usuario clica no botao de reacao (👍 ou ❤️)
2. onToggleReaction(index, emoji) e chamado
3. Se usuario ja reagiu com esse emoji: remove a reacao
4. Se usuario nao reagiu: adiciona a reacao
5. API e chamada para persistir
6. Contadores sao atualizados na interface
```

---

## Controle de Acesso

O sistema de forum possui dois niveis de permissao por canal:

| Funcao | Descricao | Indicador Visual |
|--------|-----------|-----------------|
| `canAccessRow(row)` | Verifica se o usuario pode ver o canal | `#` (acessivel) ou `LockIcon` (bloqueado) |
| `canManageRow(row)` | Verifica se o usuario pode editar/excluir o canal | Botoes de editar/excluir no hover |
| `canAddChannel` | Verifica se o usuario pode criar novos canais | Botao `+` no header da sidebar |

Para mensagens, o controle e baseado na autoria:
- Apenas o autor da mensagem (`message.authorId === currentUserId`) pode editar ou excluir
- Qualquer usuario pode reagir ou responder
