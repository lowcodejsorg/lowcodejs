# Prompt — Sistema de Modos de Edição

Tenho um editor de texto rico baseado em TipTap (React + Vite + TypeScript +
Tailwind + shadcn/ui).

## Contexto dos arquivos existentes

- `editor.tsx` — componente principal com `useEditor`, `EditorContent`, toolbar,
  bubble menus
- `toolbar.tsx` — barra de ferramentas completa (bold, italic, heading, link,
  image, table, etc.)
- `viewer.tsx` — `ContentViewer` que renderiza markdown com
  `react-markdown + remark-gfm + rehype-raw`
- `editor.css` — estilos do ProseMirror e bubble menu

---

## Casos de uso

O sistema precisa atender **3 perfis de usuário**:

| Perfil                    | Necessidade                                                                     |
| ------------------------- | ------------------------------------------------------------------------------- |
| Usuário comum             | Quer formatar texto sem saber código (WYSIWYG)                                  |
| Usuário que sabe Markdown | Quer escrever `.md` na mão, especialmente para textos longos e páginas inteiras |
| Usuário técnico           | Quer ver/editar o HTML gerado e alternar com a visualização formatada           |

---

## Os 4 modos do editor

### 1. `rich` — Editor de Texto Rico (padrão)

- Exibe a toolbar do TipTap + `EditorContent` normalmente
- Usuário formata com botões (negrito, heading, tabela, etc.)
- Internamente armazena como markdown via `tiptap-markdown`
- Ideal para: formulários, descrições curtas, conteúdo com muita formatação
  visual

### 2. `markdown` — Editor Markdown Simples

- Substitui o `EditorContent` por um `<textarea>` simples (sem syntax highlight)
- Conteúdo do textarea é o markdown bruto
- Estilizar o textarea igual ao ProseMirror (mesmo padding, min-height,
  font-size, bg)
- Mostrar rodapé: `Markdown is supported` com ícone
- **Sem toolbar** — usuário digita markdown na mão
- Ideal para: textos longos, documentações, páginas inteiras de conteúdo

### 3. `html` — Editor de Código HTML

- Substitui o `EditorContent` por um `<textarea>` mostrando o HTML gerado pelo
  TipTap
- Usuário pode editar o HTML diretamente
- Ao sair do modo, importa o HTML de volta para o editor via `setContent(html)`
- Estilo igual ao textarea do modo markdown, mas com `font-family: monospace`
- **Sem toolbar**
- Ideal para: ajustes finos de formatação, usuários técnicos

### 4. `preview` — Visualização

- Substitui o `EditorContent` pelo `ContentViewer` passando o markdown atual
- Se não houver conteúdo, exibe `Nothing to preview` com texto muted
- **Sem toolbar**
- Disponível em todos os modos como aba de prévia

---

## Interface de alternância

- Abas simples no topo do editor (NÃO usar shadcn `Tabs`): `Write` | `Markdown`
  | `HTML` | `Preview`
- A aba ativa tem `border-bottom` destacado com cor `primary`
- No modo `rich`, as abas ficam **acima** da toolbar
- Nos demais modos, as abas substituem a toolbar

---

## Comportamento de sincronização entre modos

```
rich → markdown   : pegar editor.storage.markdown.getMarkdown() → jogar no textarea
rich → html       : pegar editor.getHTML() → jogar no textarea
rich → preview    : usar markdown atual sem modificar nada

markdown → rich   : pegar textarea value → ed.commands.setContent(markdownText)
markdown → html   : converter markdown para HTML via editor interno → jogar no textarea
markdown → preview: usar textarea value diretamente no ContentViewer

html → rich       : pegar textarea value → ed.commands.setContent(htmlText)
html → markdown   : pegar textarea value → ed.commands.setContent(html) → getMarkdown()
html → preview    : renderizar o HTML do textarea no ContentViewer via rehype-raw

preview → qualquer: restaurar sem side effects, sem modificar conteúdo
```

---

## Props do componente

Adicionar ao `EditorProps` existente:

```ts
showModeToggle?: boolean
// default: true

defaultMode?: 'rich' | 'markdown' | 'html' | 'preview'
// default: 'rich'

availableModes?: Array<'rich' | 'markdown' | 'html' | 'preview'>
// default: ['rich', 'markdown', 'html', 'preview']
// permite limitar os modos disponíveis por contexto de uso
```

---

## Estrutura do JSX

```tsx
<div data-slot="editor">

  {/* Abas de modo */}
  {showModeToggle && (
    <EditorModeTabs
      mode={mode}
      availableModes={availableModes}
      onChange={setMode}
    />
  )}

  {/* Toolbar — só no modo rich */}
  {mode === 'rich' && showToolbar && <EditorToolbar editor={ed} />}

  {/* Conteúdo — condicional por modo */}
  {mode === 'rich'     && <EditorContent ... />}
  {mode === 'markdown' && <MarkdownTextarea value={rawMd} onChange={setRawMd} />}
  {mode === 'html'     && <HtmlTextarea value={rawHtml} onChange={setRawHtml} />}
  {mode === 'preview'  && <ContentViewer content={rawMd} />}

  {/* Bubble menus — só no modo rich */}
  {mode === 'rich' && showBubble && <EditorBubble editor={ed} />}

  {/* Char count — só no modo rich */}
  {mode === 'rich' && showCharCount && <EditorCharCount editor={ed} />}

  {/* Rodapé contextual */}
  {mode === 'markdown' && <MarkdownFooter />}
  {mode === 'html'     && <HtmlFooter />}

</div>
```

---

## Componentes internos

### `MarkdownTextarea`

```tsx
<textarea
  className="w-full resize-none outline-none bg-background font-sans
             text-sm leading-relaxed p-4 min-h-[200px]"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder="Escreva em Markdown..."
  spellCheck
/>
```

### `HtmlTextarea`

```tsx
<textarea
  className="w-full resize-none outline-none bg-background font-mono
             text-xs leading-relaxed p-4 min-h-[200px]"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder="<p>HTML aqui...</p>"
  spellCheck={false}
/>
```

### `MarkdownFooter`

```tsx
<div className="flex items-center gap-1.5 px-3 py-1.5 border-t text-xs text-muted-foreground">
  <MarkdownIcon className="size-3.5" />
  Markdown is supported
</div>
```

### `HtmlFooter`

```tsx
<div className="flex items-center gap-1.5 px-3 py-1.5 border-t text-xs text-muted-foreground">
  <CodeIcon className="size-3.5" />
  Editing raw HTML
</div>
```

---

## Restrições

- Não criar novos arquivos — modificar apenas `editor.tsx`
- Não quebrar nenhuma prop existente (`value`, `onChange`, `placeholder`, etc.)
- Não usar library externa de editor de código (CodeMirror, Monaco, etc.)
- Não alterar `toolbar.tsx`, `viewer.tsx`, `editor.css`

---

## Arquivos de contexto

[colar o conteúdo de `editor.tsx`, `viewer.tsx` e `editor.css`]
