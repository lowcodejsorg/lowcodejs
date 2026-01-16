import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { ListItem } from '@tiptap/extension-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import {
  Dropcursor,
  Gapcursor,
  Placeholder,
  TrailingNode,
} from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import React, { useCallback } from 'react';
import { RichTextProvider } from 'reactjs-tiptap-editor';
import { Attachment } from 'reactjs-tiptap-editor/attachment';
import { Blockquote } from 'reactjs-tiptap-editor/blockquote';
import { Bold } from 'reactjs-tiptap-editor/bold';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { Clear } from 'reactjs-tiptap-editor/clear';
import { Color } from 'reactjs-tiptap-editor/color';
import {
  Column,
  ColumnNode,
  MultipleColumnNode,
} from 'reactjs-tiptap-editor/column';
import { Emoji } from 'reactjs-tiptap-editor/emoji';
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FontSize } from 'reactjs-tiptap-editor/fontsize';
import { Heading } from 'reactjs-tiptap-editor/heading';
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { History } from 'reactjs-tiptap-editor/history';
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule';
import { Iframe } from 'reactjs-tiptap-editor/iframe';
import { Image } from 'reactjs-tiptap-editor/image';
import { Indent } from 'reactjs-tiptap-editor/indent';
import { Italic } from 'reactjs-tiptap-editor/italic';
import { Katex } from 'reactjs-tiptap-editor/katex';
import { LineHeight } from 'reactjs-tiptap-editor/lineheight';
import { Link } from 'reactjs-tiptap-editor/link';
import { localeActions } from 'reactjs-tiptap-editor/locale-bundle';
import { Mention } from 'reactjs-tiptap-editor/mention';
import { Mermaid } from 'reactjs-tiptap-editor/mermaid';
import { MoreMark } from 'reactjs-tiptap-editor/moremark';
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { SearchAndReplace } from 'reactjs-tiptap-editor/searchandreplace';
import {
  SlashCommand,
  SlashCommandList,
} from 'reactjs-tiptap-editor/slashcommand';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { Table } from 'reactjs-tiptap-editor/table';
import { TaskList } from 'reactjs-tiptap-editor/tasklist';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { TextDirection } from 'reactjs-tiptap-editor/textdirection';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';
import { Video } from 'reactjs-tiptap-editor/video';

import 'katex/dist/katex.min.css';
import 'reactjs-tiptap-editor/style.css';

import { Bubble } from './buble';
import { Toolbar } from './toolbar';

function convertBase64ToBlob(base64: string): Blob {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// custom document to support columns
const DocumentColumn = /* @__PURE__ */ Document.extend({
  content: '(block|columns)+',
  // echo editor is a block editor
});

const BaseKit = [
  DocumentColumn,
  Text,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Paragraph,
  TrailingNode,
  ListItem,
  // TextStyle,
  Placeholder.configure({
    placeholder: "Press '/' for commands",
  }),
];

const extensions = [
  ...BaseKit,

  History,
  SearchAndReplace,
  Clear,
  FontFamily,
  Heading,
  FontSize,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  MoreMark,
  Emoji,
  Color,
  Highlight,
  BulletList,
  OrderedList,
  TextAlign,
  Indent,
  LineHeight,
  TaskList,
  Link,
  Image.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(URL.createObjectURL(files));
        }, 300);
      });
    },
  }),
  Video.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(URL.createObjectURL(files));
        }, 300);
      });
    },
  }),

  Blockquote,
  HorizontalRule,

  Column,
  ColumnNode,
  MultipleColumnNode,
  Table,
  Iframe,
  TextDirection,
  Attachment.configure({
    upload: (file: any) => {
      // fake upload return base 64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      return new Promise((resolve) => {
        setTimeout(() => {
          const blob = convertBase64ToBlob(reader.result as string);
          resolve(URL.createObjectURL(blob));
        }, 300);
      });
    },
  }),
  Katex,
  Mermaid.configure({
    upload: (file: any) => {
      // fake upload return base 64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      return new Promise((resolve) => {
        setTimeout(() => {
          const blob = convertBase64ToBlob(reader.result as string);
          resolve(URL.createObjectURL(blob));
        }, 300);
      });
    },
  }),
  Mention,
  SlashCommand,
];

localeActions.setLang('pt_BR');

function debounce(
  func: (...args: Array<any>) => void,
  wait: number,
): (...args: Array<any>) => void {
  let timeout: NodeJS.Timeout;
  return function (this: unknown, ...args: Array<any>): void {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

interface EditorExampleProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function EditorExample({
  value,
  onChange,
}: EditorExampleProps = {}): React.JSX.Element | null {
  const isControlled = value !== undefined && onChange !== undefined;
  const content = isControlled ? value : '<p>Escreva algo...</p>';

  const onValueChange = useCallback(
    debounce((newValue: any) => {
      if (isControlled) {
        onChange(newValue);
      }
    }, 300),
    [isControlled, onChange],
  );

  const ed = useEditor({
    textDirection: 'auto',
    extensions,
    immediatelyRender: false,
    onUpdate: ({ editor: editorInstance }) => {
      const html = editorInstance.getHTML();
      onValueChange(html);
    },
    content,
  });

  React.useEffect(() => {
    // @ts-ignore - Exposing editor instance for debugging
    window['editor'] = ed;
  }, [ed]);

  if (!ed) return null;

  return (
    <div className="p-6 flex flex-col w-full gap-6 mx-auto my-0 overflow-y-auto">
      <RichTextProvider editor={ed}>
        <div className="flex max-h-full w-full flex-col">
          <Toolbar />
          <EditorContent editor={ed} />
          <Bubble />
          <SlashCommandList />
        </div>
      </RichTextProvider>
    </div>
  );
}
