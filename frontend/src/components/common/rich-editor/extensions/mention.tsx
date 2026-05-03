import type { Editor as TiptapEditor } from '@tiptap/core';
import Mention from '@tiptap/extension-mention';
import type { SuggestionOptions } from '@tiptap/suggestion';
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';

import { MentionList } from '../bubble/mention-list';
import type { MentionItem, MentionListHandle } from '../bubble/mention-list';

export type ResolveMentionItems = (
  query: string,
) => Promise<Array<MentionItem>> | Array<MentionItem>;

export interface MentionConfig {
  enabled: boolean;
  resolveItems: ResolveMentionItems;
}

type ClientRectFn = () => DOMRect | null;

interface PopupState {
  items: Array<MentionItem>;
  command: (item: MentionItem) => void;
  clientRect: ClientRectFn;
  ref: React.RefObject<MentionListHandle | null>;
}

interface PopupController {
  rerender: (state: PopupState | null) => void;
  destroy: () => void;
}

interface MentionAttrs {
  id: string;
  label: string;
}

function getMentionAttrs(node: {
  attrs: Record<string, unknown>;
}): MentionAttrs {
  const id = node.attrs.id;
  const label = node.attrs.label;
  let safeId = '';
  if (typeof id === 'string') safeId = id;
  let safeLabel = '';
  if (typeof label === 'string') safeLabel = label;
  return { id: safeId, label: safeLabel };
}

function createPopup(): PopupController {
  const rootEl = document.createElement('div');
  rootEl.dataset.slot = 'mention-popup-root';
  rootEl.style.position = 'fixed';
  rootEl.style.top = '0';
  rootEl.style.left = '0';
  rootEl.style.zIndex = '50';
  rootEl.style.pointerEvents = 'none';
  document.body.appendChild(rootEl);

  const reactRoot: Root = createRoot(rootEl);

  const rerender = (state: PopupState | null): void => {
    if (!state) {
      reactRoot.render(<></>);
      return;
    }
    const rect = state.clientRect();
    let top = 0;
    let left = 0;
    if (rect) {
      top = rect.bottom + window.scrollY;
      left = rect.left + window.scrollX;
    }
    reactRoot.render(
      <div
        style={{
          position: 'absolute',
          top,
          left,
          pointerEvents: 'auto',
        }}
      >
        <MentionList
          ref={state.ref}
          items={state.items}
          command={state.command}
        />
      </div>,
    );
  };

  const destroy = (): void => {
    reactRoot.unmount();
    rootEl.remove();
  };

  return { rerender, destroy };
}

function isClientRectFn(value: unknown): value is ClientRectFn {
  return typeof value === 'function';
}

function pickClientRect(value: unknown): ClientRectFn | null {
  if (isClientRectFn(value)) return value;
  return null;
}

export function buildMentionExtension(
  resolveItems: ResolveMentionItems,
): ReturnType<typeof Mention.configure> {
  const suggestion: Partial<SuggestionOptions<MentionItem>> = {
    char: '@',
    items: async ({ query }): Promise<Array<MentionItem>> => {
      const items = await resolveItems(query);
      return items.slice(0, 10);
    },
    render: () => {
      let popup: PopupController | null = null;
      const ref = React.createRef<MentionListHandle | null>();
      let currentItems: Array<MentionItem> = [];
      let currentClientRect: ClientRectFn | null = null;
      const noopCommand = (_item: MentionItem): void => {};
      let currentCommand: (item: MentionItem) => void = noopCommand;

      const rerender = (): void => {
        if (!popup) return;
        if (!currentClientRect) return;
        popup.rerender({
          items: currentItems,
          command: currentCommand,
          clientRect: currentClientRect,
          ref,
        });
      };

      return {
        onStart: (props): void => {
          currentItems = props.items;
          currentCommand = (item: MentionItem): void => {
            props.command(item);
          };
          currentClientRect = pickClientRect(props.clientRect);
          popup = createPopup();
          rerender();
        },
        onUpdate: (props): void => {
          currentItems = props.items;
          currentCommand = (item: MentionItem): void => {
            props.command(item);
          };
          currentClientRect = pickClientRect(props.clientRect);
          rerender();
        },
        onKeyDown: (props): boolean => {
          if (props.event.key === 'Escape') {
            popup?.destroy();
            popup = null;
            return true;
          }
          return ref.current?.onKeyDown(props.event) ?? false;
        },
        onExit: (): void => {
          popup?.destroy();
          popup = null;
        },
      };
    },
  };

  const MentionWithMarkdown = Mention.extend({
    addStorage() {
      return {
        ...(this.parent?.() ?? {}),
        markdown: {
          serialize(
            state: { write: (text: string) => void },
            node: { attrs: Record<string, unknown> },
          ): void {
            const { id, label } = getMentionAttrs(node);
            const safeLabel = label.replace(/[\\\]]/g, '\\$&');
            state.write(
              `<span class="mention" data-id="${id}" data-label="${safeLabel}">@${safeLabel}</span>`,
            );
          },
          parse: {},
        },
      };
    },
  });

  return MentionWithMarkdown.configure({
    HTMLAttributes: {
      class: 'mention',
      'data-test-id': 'mention',
    },
    renderText: ({ node }): string => {
      const { label } = getMentionAttrs(node);
      return '@' + label;
    },
    suggestion,
  });
}

export function extractMentionIds(editor: TiptapEditor | null): Array<string> {
  if (!editor) return [];
  const ids = new Set<string>();
  editor.state.doc.descendants((node): boolean => {
    if (node.type.name === 'mention') {
      const { id } = getMentionAttrs(node);
      if (id.length > 0) ids.add(id);
    }
    return true;
  });
  return Array.from(ids);
}
