---
name: maiyu:frontend-rich-editor
description: |
  Generates rich text editor setup with TipTap for frontend projects.
  Use when: user asks to create a rich text editor, WYSIWYG editor, text editor,
  content editor, or mentions "editor", "TipTap", "rich text".
  Supports: TipTap, toolbar, bubble menus, image upload, markdown.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Editor**: `@tiptap/react` | `@tiptap/core` | `@tiptap/starter-kit`
   - **Extensions**: `@tiptap/extension-*` (underline, color, highlight, link, image, table, placeholder, character-count)
   - **Markdown**: `tiptap-markdown`
3. Scan existing editor to detect component location and extensions used

## Conventions

### File Structure
```
src/components/common/editor/
├── editor.tsx               ← Main editor component
├── editor-toolbar.tsx       ← Toolbar with format buttons
├── editor-text-bubble.tsx   ← Text selection bubble menu
├── editor-link-bubble.tsx   ← Link editing bubble
├── editor-image-bubble.tsx  ← Image editing bubble
├── editor-table-bubble.tsx  ← Table editing bubble
├── image-upload.tsx         ← Image upload dialog
└── utils.ts                ← Debounce, helpers
```

### Rules
- Lazy load the editor (it's heavy: ~100KB+)
- Debounce onChange (300ms default)
- Support both controlled and uncontrolled modes
- Return markdown or HTML based on configuration
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Editor Component (Reference Implementation)

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Markdown } from 'tiptap-markdown';
import { useEffect, useRef, useCallback } from 'react';

import { EditorToolbar } from './editor-toolbar';
import { cn } from '@/lib/utils';

function debounce<T extends (...args: Array<unknown>) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>): void => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  variant?: 'default' | 'compact';
  outputFormat?: 'html' | 'markdown';
  debounceMs?: number;
  readOnly?: boolean;
  className?: string;
}

export function Editor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  maxLength,
  variant = 'default',
  outputFormat = 'html',
  debounceMs = 300,
  readOnly = false,
  className,
}: EditorProps): React.JSX.Element {
  const isControlled = useRef(value !== undefined && onChange !== undefined);

  const debouncedOnChange = useCallback(
    debounce((content: string) => {
      onChange?.(content);
    }, debounceMs),
    [onChange, debounceMs],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
      Markdown,
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      let content: string;
      if (outputFormat === 'markdown') {
        content = ed.storage.markdown.getMarkdown();
      } else {
        content = ed.getHTML();
      }
      debouncedOnChange(content);
    },
  });

  // Sync external value changes (controlled mode)
  useEffect(() => {
    if (!editor || !isControlled.current) return;
    const currentContent = editor.getHTML();
    if (value !== currentContent) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  if (!editor) return <div />;

  return (
    <div
      data-slot="editor"
      className={cn(
        'rounded-md border',
        variant === 'compact' && 'text-sm',
        className,
      )}
    >
      {!readOnly && <EditorToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 focus:outline-none"
      />
      {maxLength && (
        <div className="border-t px-4 py-1 text-xs text-muted-foreground text-right">
          {editor.storage.characterCount.characters()} / {maxLength}
        </div>
      )}
    </div>
  );
}
```

### Editor Toolbar

```tsx
import type { Editor } from '@tiptap/react';
import {
  BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon,
  AlignLeftIcon, AlignCenterIcon, AlignRightIcon,
  ListIcon, ListOrderedIcon, Heading1Icon, Heading2Icon,
  LinkIcon, ImageIcon, TableIcon, Undo2Icon, Redo2Icon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({
  editor,
}: EditorToolbarProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
      <Button
        variant="ghost"
        size="icon-sm"
        data-active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        data-active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        data-active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="icon-sm"
        data-active={editor.isActive('heading', { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1Icon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        data-active={editor.isActive('heading', { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2Icon className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="icon-sm"
        data-active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        data-active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2Icon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2Icon className="size-4" />
      </Button>
    </div>
  );
}
```

### Lazy Loading Wrapper

```tsx
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const Editor = lazy(() =>
  import('@/components/common/editor/editor').then((m) => ({
    default: m.Editor,
  })),
);

function EditorSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function LazyEditor(props: EditorProps): React.JSX.Element {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <Editor {...props} />
    </Suspense>
  );
}
```

## Checklist

- [ ] TipTap with essential extensions
- [ ] Toolbar with format buttons
- [ ] Debounced onChange (300ms)
- [ ] Controlled and uncontrolled modes
- [ ] HTML and markdown output formats
- [ ] Character count with optional limit
- [ ] Lazy loading wrapper with skeleton
- [ ] Read-only mode support
- [ ] No ternary operators
