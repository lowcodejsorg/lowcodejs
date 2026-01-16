import React from 'react';
import {
  RichTextBubbleColumns,
  RichTextBubbleIframe,
  RichTextBubbleImage,
  RichTextBubbleKatex,
  RichTextBubbleLink,
  RichTextBubbleMermaid,
  RichTextBubbleTable,
  RichTextBubbleText,
  RichTextBubbleVideo,
} from 'reactjs-tiptap-editor/bubble';

export function Bubble(): React.JSX.Element {
  return (
    <React.Fragment>
      <RichTextBubbleColumns />
      <RichTextBubbleIframe />
      <RichTextBubbleKatex />
      <RichTextBubbleLink />

      <RichTextBubbleImage />
      <RichTextBubbleVideo />

      <RichTextBubbleMermaid />
      <RichTextBubbleTable />
      <RichTextBubbleText />
    </React.Fragment>
  );
}
