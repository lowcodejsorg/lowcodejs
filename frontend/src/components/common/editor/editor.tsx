import type { Editor as TiptapEditor } from '@tiptap/core';
import CharacterCount from '@tiptap/extension-character-count';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TiptapImage from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useCallback, useMemo, useRef } from 'react';
import { Markdown } from 'tiptap-markdown';

import { ImageBubble } from './bubble/image-bubble';
import { LinkBubble } from './bubble/link-bubble';
import { TableBubble } from './bubble/table-bubble';
import { TextBubble } from './bubble/text-bubble';
import './editor.css';
import { EditorToolbar } from './toolbar';

import { cn } from '@/lib/utils';

export interface EditorProps {
  value?: string;
  onChange?: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  showToolbar?: boolean;
  showCharCount?: boolean;
  showBubble?: boolean;
  variant?: 'default' | 'compact';
  autoFocus?: boolean;
  focusKey?: string | number;
  debounceMs?: number;
}

function debounce<T extends (...args: Array<any>) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>): void {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function Editor({
  value,
  onChange,
  placeholder = 'Escreva algo...',
  className,
  showToolbar = true,
  showCharCount = false,
  showBubble = true,
  variant = 'default',
  autoFocus = false,
  focusKey,
  debounceMs = 300,
}: EditorProps): React.JSX.Element | null {
  const isControlled = value !== undefined && onChange !== undefined;
  const onChangeRef = useRef(onChange);
  const isControlledRef = useRef(isControlled);

  React.useEffect(() => {
    onChangeRef.current = onChange;
    isControlledRef.current = isControlled;
  }, [onChange, isControlled]);

  const onValueChange = useCallback(
    debounce((editor: TiptapEditor) => {
      if (!isControlledRef.current) return;
      const md = (editor.storage as any).markdown?.getMarkdown?.();
      if (md !== undefined) {
        onChangeRef.current?.(md);
      } else {
        onChangeRef.current?.(editor.getHTML());
      }
    }, debounceMs),
    [debounceMs],
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        code: false,
        codeBlock: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
      }),
      TiptapImage,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Markdown,
    ],
    [placeholder],
  );

  const ed = useEditor(
    {
      extensions,
      immediatelyRender: false,
      content: isControlled && value ? value : '',
      onUpdate: ({ editor: editorInstance }) => {
        onValueChange(editorInstance);
      },
    },
    [],
  );

  // Sync external value
  React.useEffect(() => {
    if (!ed || !isControlled) return;
    if (ed.isFocused) return;
    const currentMd =
      (ed.storage as any).markdown?.getMarkdown?.() ?? ed.getHTML();
    if (currentMd !== value) {
      ed.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, ed, isControlled]);

  // Focus key reset
  const lastFocusKeyRef = useRef<typeof focusKey>(focusKey);
  React.useEffect(() => {
    if (!ed || !isControlled) return;
    if (focusKey === undefined) return;
    if (lastFocusKeyRef.current === focusKey) return;
    lastFocusKeyRef.current = focusKey;
    ed.commands.setContent(value || '', { emitUpdate: false });
  }, [value, ed, focusKey, isControlled]);

  // Auto focus
  React.useEffect(() => {
    if (!ed || !autoFocus) return;
    ed.commands.focus('end');
  }, [autoFocus, ed, focusKey]);

  if (!ed) return null;

  const charCount = ed.storage.characterCount?.characters() ?? 0;

  return (
    <div
      className={cn(
        'w-full',
        variant === 'compact' ? 'editor-compact' : '',
        className,
      )}
    >
      {showToolbar && <EditorToolbar editor={ed} />}
      <EditorContent
        editor={ed}
        className={cn(
          'prose prose-sm max-w-none w-full',
          variant === 'compact' ? 'rounded-md border bg-background' : '',
        )}
      />
      {showBubble && (
        <>
          <TextBubble editor={ed} />
          <LinkBubble editor={ed} />
          <ImageBubble editor={ed} />
          <TableBubble editor={ed} />
        </>
      )}
      {showCharCount && (
        <div className="flex justify-end px-3 py-1 text-xs text-muted-foreground border-t">
          {charCount} caracteres
        </div>
      )}
    </div>
  );
}
