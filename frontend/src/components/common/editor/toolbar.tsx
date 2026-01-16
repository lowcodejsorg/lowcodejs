// Base Kit
// import { TextStyle } from '@tiptap/extension-text-style';

// build extensions
import { RichTextAttachment } from 'reactjs-tiptap-editor/attachment';
import { RichTextBlockquote } from 'reactjs-tiptap-editor/blockquote';
import { RichTextBold } from 'reactjs-tiptap-editor/bold';
import { RichTextBulletList } from 'reactjs-tiptap-editor/bulletlist';
import { RichTextClear } from 'reactjs-tiptap-editor/clear';
import { RichTextColor } from 'reactjs-tiptap-editor/color';
import { RichTextColumn } from 'reactjs-tiptap-editor/column';
import { RichTextEmoji } from 'reactjs-tiptap-editor/emoji';
import { RichTextExportPdf } from 'reactjs-tiptap-editor/exportpdf';
import { RichTextFontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { RichTextFontSize } from 'reactjs-tiptap-editor/fontsize';
import { RichTextHeading } from 'reactjs-tiptap-editor/heading';
import { RichTextHighlight } from 'reactjs-tiptap-editor/highlight';
import { RichTextRedo, RichTextUndo } from 'reactjs-tiptap-editor/history';
import { RichTextHorizontalRule } from 'reactjs-tiptap-editor/horizontalrule';
import { RichTextIframe } from 'reactjs-tiptap-editor/iframe';
import { RichTextImage } from 'reactjs-tiptap-editor/image';
import { RichTextIndent } from 'reactjs-tiptap-editor/indent';
import { RichTextItalic } from 'reactjs-tiptap-editor/italic';
import { RichTextKatex } from 'reactjs-tiptap-editor/katex';
import { RichTextLineHeight } from 'reactjs-tiptap-editor/lineheight';
import { RichTextLink } from 'reactjs-tiptap-editor/link';
import { RichTextMermaid } from 'reactjs-tiptap-editor/mermaid';
import { RichTextMoreMark } from 'reactjs-tiptap-editor/moremark';
import { RichTextOrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { RichTextSearchAndReplace } from 'reactjs-tiptap-editor/searchandreplace';
import { RichTextStrike } from 'reactjs-tiptap-editor/strike';
import { RichTextTable } from 'reactjs-tiptap-editor/table';
import { RichTextTaskList } from 'reactjs-tiptap-editor/tasklist';
import { RichTextAlign } from 'reactjs-tiptap-editor/textalign';
import { RichTextTextDirection } from 'reactjs-tiptap-editor/textdirection';
import { RichTextUnderline } from 'reactjs-tiptap-editor/textunderline';
import { RichTextVideo } from 'reactjs-tiptap-editor/video';

// Slash Command

// Bubble

import 'katex/dist/katex.min.css';
import 'reactjs-tiptap-editor/style.css';

export function Toolbar(): React.JSX.Element {
  return (
    <div className="flex items-center p-1! gap-2 flex-wrap border-b! border-solid! border-[#a5a4a4]!">
      <RichTextUndo />
      <RichTextRedo />
      <RichTextSearchAndReplace />
      <RichTextClear />
      <RichTextFontFamily />
      <RichTextHeading />
      <RichTextFontSize />
      <RichTextBold />
      <RichTextItalic />
      <RichTextUnderline />
      <RichTextStrike />
      <RichTextMoreMark />
      <RichTextEmoji />
      <RichTextColor />
      <RichTextHighlight />
      <RichTextBulletList />
      <RichTextOrderedList />
      <RichTextAlign />
      <RichTextIndent />
      <RichTextLineHeight />
      <RichTextTaskList />
      <RichTextLink />
      <RichTextImage />
      <RichTextVideo />
      <RichTextBlockquote />
      <RichTextHorizontalRule />
      <RichTextColumn />
      <RichTextTable />
      <RichTextIframe />
      <RichTextExportPdf />
      <RichTextTextDirection />
      <RichTextAttachment />
      <RichTextKatex />
      <RichTextMermaid />
    </div>
  );
}
