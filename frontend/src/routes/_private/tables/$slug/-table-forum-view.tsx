import { useStore } from '@tanstack/react-store';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import { toast } from 'sonner';

import {
  ForumAddChannelDialog,
  ForumComposer,
  ForumDeleteChannelDialog,
  ForumDeleteMessageDialog,
  ForumDocuments,
  ForumEditChannelDialog,
  ForumHeader,
  ForumMessagesList,
  ForumSidebar,
} from '@/components/forum';
import type { ForumDocument, ForumMessage } from '@/components/forum';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileRead } from '@/hooks/tanstack-query/use-profile-read';
import { useCreateTableRow } from '@/hooks/tanstack-query/use-table-row-create';
import { useUpdateTableRow } from '@/hooks/tanstack-query/use-table-row-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { API } from '@/lib/api';
import { E_FIELD_TYPE } from '@/lib/constant';
import {
  normalizeGroupFieldValue,
  normalizeId,
  normalizeStorageList,
  normalizeUserList,
  parseReactions,
  serializeReactions,
  stripHtml,
} from '@/lib/forum-helpers';
import type { IField, IRow, IStorage, ITable } from '@/lib/interfaces';
import { getFieldBySlug, getFirstFieldByType } from '@/lib/kanban-helpers';
import { cn } from '@/lib/utils';
import { useAuthenticationStore } from '@/stores/authentication';

interface Props {
  data: Array<IRow>;
  headers: Array<IField>;
  tableSlug: string;
  table: ITable;
}

export function TableForumView({
  data,
  headers,
  tableSlug,
  table,
}: Props): React.JSX.Element {
  const auth = useAuthenticationStore((s) => s.authenticated);
  const { data: profile } = useProfileRead();
  const currentUserId = auth?.sub ?? profile?._id ?? '';

  const [rowsState, setRowsState] = React.useState<Array<IRow>>(data);
  const [activeRowId, setActiveRowId] = React.useState<string | null>(
    data[0]?._id ?? null,
  );
  const [activeTab, setActiveTab] = React.useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [composerLayout, setComposerLayout] = React.useState<'side' | 'bottom'>(
    () => {
      if (typeof window === 'undefined') return 'bottom';
      const stored = window.localStorage.getItem('forum-composer-layout');
      return stored === 'side' ? 'side' : 'bottom';
    },
  );

  const [composerStorages, setComposerStorages] = React.useState<
    Array<IStorage>
  >([]);
  const [replyToId, setReplyToId] = React.useState<string | null>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [isAddChannelOpen, setIsAddChannelOpen] = React.useState(false);
  const [isEditChannelOpen, setIsEditChannelOpen] = React.useState(false);
  const [editingChannelId, setEditingChannelId] = React.useState<string | null>(
    null,
  );
  const [editingChannelRow, setEditingChannelRow] = React.useState<IRow | null>(
    null,
  );
  const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null);
  const [deleteChannelId, setDeleteChannelId] = React.useState<string | null>(
    null,
  );
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const pollingRef = React.useRef<{ inFlight: boolean; rowId: string | null }>({
    inFlight: false,
    rowId: null,
  });
  const [focusTick, setFocusTick] = React.useState(0);

  const bumpFocus = React.useCallback(() => {
    setFocusTick((value) => value + 1);
  }, []);

  React.useEffect(() => {
    setRowsState(data);
  }, [data]);

  React.useEffect(() => {
    if (!activeRowId && data[0]?._id) {
      setActiveRowId(data[0]._id);
    }
  }, [activeRowId, data]);

  React.useEffect(() => {
    if (activeRowId) bumpFocus();
  }, [activeRowId, bumpFocus]);

  React.useEffect(() => {
    if (replyToId) bumpFocus();
  }, [replyToId, bumpFocus]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('forum-composer-layout', composerLayout);
  }, [composerLayout]);

  const channelField =
    getFieldBySlug(headers, 'canal', E_FIELD_TYPE.TEXT_SHORT) ||
    getFieldBySlug(headers, 'titulo', E_FIELD_TYPE.TEXT_SHORT) ||
    getFirstFieldByType(headers, E_FIELD_TYPE.TEXT_SHORT);

  const channelDescriptionField =
    getFieldBySlug(headers, 'descricao', E_FIELD_TYPE.TEXT_LONG) ||
    getFirstFieldByType(headers, E_FIELD_TYPE.TEXT_LONG);

  const messagesField =
    getFieldBySlug(headers, 'mensagens', E_FIELD_TYPE.FIELD_GROUP) ||
    getFirstFieldByType(headers, E_FIELD_TYPE.FIELD_GROUP);

  const activeRow = rowsState.find((row) => row._id === activeRowId) ?? null;

  const messagesGroup = React.useMemo(() => {
    if (!messagesField?.group?.slug) return null;
    return table.groups.find(
      (group) => group.slug === messagesField.group?.slug,
    );
  }, [messagesField?.group?.slug, table.groups]);

  const groupFields = messagesGroup?.fields ?? [];
  const fallbackGroupFields = React.useMemo(
    () =>
      [
        { slug: 'mensagem-id', type: E_FIELD_TYPE.TEXT_SHORT, multiple: false },
        { slug: 'texto', type: E_FIELD_TYPE.TEXT_LONG, multiple: false },
        { slug: 'autor', type: E_FIELD_TYPE.USER, multiple: false },
        { slug: 'data', type: E_FIELD_TYPE.DATE, multiple: false },
        { slug: 'anexos', type: E_FIELD_TYPE.FILE, multiple: true },
        { slug: 'mencoes', type: E_FIELD_TYPE.USER, multiple: true },
        { slug: 'resposta', type: E_FIELD_TYPE.TEXT_SHORT, multiple: false },
        { slug: 'reacoes', type: E_FIELD_TYPE.TEXT_LONG, multiple: false },
      ] as Array<Pick<IField, 'slug' | 'type' | 'multiple'>>,
    [],
  );

  const resolvedGroupFields = React.useMemo(() => {
    if (
      groupFields.length > 0 &&
      typeof groupFields[0] === 'object' &&
      groupFields[0] !== null &&
      'slug' in groupFields[0]
    ) {
      return groupFields;
    }

    return fallbackGroupFields as Array<IField>;
  }, [fallbackGroupFields, groupFields]);

  const messageIdField = resolvedGroupFields.find(
    (f) => f.slug === 'mensagem-id',
  );
  const messageTextField = resolvedGroupFields.find((f) => f.slug === 'texto');
  const messageAuthorField = resolvedGroupFields.find(
    (f) => f.slug === 'autor',
  );
  const messageDateField = resolvedGroupFields.find((f) => f.slug === 'data');
  const messageAttachmentsField = resolvedGroupFields.find(
    (f) => f.slug === 'anexos',
  );
  const messageMentionsField = resolvedGroupFields.find(
    (f) => f.slug === 'mencoes',
  );
  const messageReplyField = resolvedGroupFields.find(
    (f) => f.slug === 'resposta',
  );
  const messageReactionsField = resolvedGroupFields.find(
    (f) => f.slug === 'reacoes',
  );

  const rawMessages = React.useMemo(() => {
    if (!activeRow || !messagesField) return [];
    const value = activeRow[messagesField.slug];
    return Array.isArray(value) ? value : [];
  }, [activeRow, messagesField]);

  const messages = React.useMemo<Array<ForumMessage>>(() => {
    return rawMessages.map((message: Record<string, unknown>, index) => {
      const messageRecord =
        message && typeof message === 'object' ? message : {};
      const idValue = messageIdField
        ? messageRecord[messageIdField.slug]
        : null;
      const id = normalizeId(idValue) ?? `message-${index}`;
      const text = messageTextField
        ? ((messageRecord[messageTextField.slug] as string) ?? '')
        : '';
      const authorList = messageAuthorField
        ? normalizeUserList(messageRecord[messageAuthorField.slug])
        : [];
      const author = authorList[0] ?? null;
      const authorId =
        typeof author === 'string'
          ? author
          : author && '_id' in author
            ? author._id
            : null;
      const dateRecordValue = messageDateField
        ? messageRecord[messageDateField.slug]
        : null;
      const dateLabel =
        typeof dateRecordValue === 'string' && dateRecordValue
          ? format(new Date(dateRecordValue), 'dd/MM/yyyy HH:mm', {
              locale: ptBR,
            })
          : '';
      const attachments = messageAttachmentsField
        ? normalizeStorageList(messageRecord[messageAttachmentsField.slug])
        : [];
      const mentions = messageMentionsField
        ? normalizeUserList(messageRecord[messageMentionsField.slug])
        : [];
      const replyTo = messageReplyField
        ? (messageRecord[messageReplyField.slug] as string | null)
        : null;
      const reactions = messageReactionsField
        ? parseReactions(messageRecord[messageReactionsField.slug])
        : [];

      return {
        id,
        text,
        author,
        authorId,
        dateLabel,
        dateValue: typeof dateRecordValue === 'string' ? dateRecordValue : null,
        attachments,
        mentions,
        replyTo,
        reactions,
        raw: messageRecord,
      };
    });
  }, [
    rawMessages,
    messageIdField,
    messageTextField,
    messageAuthorField,
    messageDateField,
    messageAttachmentsField,
    messageMentionsField,
    messageReplyField,
    messageReactionsField,
  ]);

  const documents = React.useMemo<Array<ForumDocument>>(() => {
    const items: Array<ForumDocument> = [];

    for (const message of messages) {
      for (const attachment of message.attachments) {
        items.push({
          messageId: message.id,
          file: attachment,
          author: message.author,
          dateLabel: message.dateLabel,
        });
      }
    }
    return items;
  }, [messages]);

  const updateRow = useUpdateTableRow({
    onSuccess(updatedRow) {
      setRowsState((prev) =>
        prev.map((row) => (row._id === updatedRow._id ? updatedRow : row)),
      );
    },
    onError() {
      toast('Erro ao atualizar mensagens', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Nao foi possivel atualizar o canal',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  const createRow = useCreateTableRow({
    onSuccess(newRow) {
      setRowsState((prev) => [...prev, newRow]);
      setActiveRowId(newRow._id);
      setIsAddChannelOpen(false);
      toast('Canal criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O canal foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
    onError() {
      toast('Erro ao criar canal', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Nao foi possivel criar o canal',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  const composerForm = useAppForm({
    defaultValues: {
      text: '',
      mentions: [] as Array<string>,
      files: [] as Array<File>,
    },
  });

  const composerText = useStore(
    composerForm.store,
    (state) => state.values.text,
  );
  const composerMentions = useStore(
    composerForm.store,
    (state) => state.values.mentions,
  );
  const composerFiles = useStore(
    composerForm.store,
    (state) => state.values.files,
  );

  const addChannelForm = useAppForm({
    defaultValues: {
      label: '',
      description: '',
    },
    onSubmit: async ({ value }) => {
      if (!channelField) return;
      const label = value.label.trim();
      if (!label || createRow.status === 'pending') return;

      const description = value.description.trim();
      const payload: Record<string, unknown> = {
        [channelField.slug]: label,
      };
      if (channelDescriptionField && description) {
        payload[channelDescriptionField.slug] = description;
      }

      await createRow.mutateAsync({
        slug: tableSlug,
        data: payload,
      });
    },
  });

  React.useEffect(() => {
    if (!isAddChannelOpen) {
      addChannelForm.reset({ label: '', description: '' });
    }
  }, [addChannelForm, isAddChannelOpen]);

  const addChannelLabel = useStore(
    addChannelForm.store,
    (state) => state.values.label,
  );

  const editChannelForm = useAppForm({
    defaultValues: {
      label: '',
      description: '',
    },
    onSubmit: async ({ value }) => {
      if (!channelField || !editingChannelId) return;
      const label = value.label.trim();
      if (!label || updateRow.status === 'pending') return;

      const description = value.description.trim();
      const payload: Record<string, unknown> = {
        [channelField.slug]: label,
      };
      if (channelDescriptionField) {
        payload[channelDescriptionField.slug] = description || '';
      }

      await updateRow.mutateAsync({
        slug: tableSlug,
        rowId: editingChannelId,
        data: payload,
      });
      setIsEditChannelOpen(false);
      setEditingChannelId(null);
      toast('Canal atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O canal foi atualizado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  React.useEffect(() => {
    if (!isEditChannelOpen) {
      editChannelForm.reset({ label: '', description: '' });
      setEditingChannelRow(null);
    }
  }, [editChannelForm, isEditChannelOpen]);

  const editChannelLabel = useStore(
    editChannelForm.store,
    (state) => state.values.label,
  );

  const resetComposer = React.useCallback(() => {
    setComposerStorages([]);
    composerForm.reset({
      text: '',
      mentions: [],
      files: [],
    });
    setReplyToId(null);
    setEditingIndex(null);
  }, [composerForm]);

  const resolveChannelLabel = React.useCallback(
    (row: IRow): string => {
      if (channelField && row[channelField.slug] !== undefined) {
        return String(row[channelField.slug] ?? '');
      }
      if (typeof row['canal'] === 'string') return String(row['canal'] ?? '');
      if (typeof row['titulo'] === 'string') return String(row['titulo'] ?? '');
      return '';
    },
    [channelField],
  );

  const resolveChannelDescription = React.useCallback(
    (row: IRow): string => {
      if (
        channelDescriptionField &&
        typeof row[channelDescriptionField.slug] === 'string'
      ) {
        return String(row[channelDescriptionField.slug] ?? '');
      }
      if (typeof row['descricao'] === 'string') {
        return String(row['descricao'] ?? '');
      }
      return '';
    },
    [channelDescriptionField],
  );

  const refreshRowById = React.useCallback(
    async (rowId: string) => {
      if (!rowId) return;
      if (pollingRef.current.inFlight && pollingRef.current.rowId === rowId) {
        return;
      }
      pollingRef.current.inFlight = true;
      pollingRef.current.rowId = rowId;
      try {
        const response = await API.get<IRow>(
          `/tables/${tableSlug}/rows/${rowId}`,
        );
        const row = response.data;
        if (!row || row._id !== rowId) return;
        setRowsState((prev) =>
          prev.map((item) => (item._id === rowId ? row : item)),
        );
      } finally {
        pollingRef.current.inFlight = false;
        pollingRef.current.rowId = null;
      }
    },
    [tableSlug],
  );

  React.useEffect(() => {
    if (!activeRowId) return;
    if (typeof window === 'undefined') return;
    refreshRowById(activeRowId);
    const interval = window.setInterval(() => {
      refreshRowById(activeRowId);
    }, 5000);
    return (): void => window.clearInterval(interval);
  }, [activeRowId, refreshRowById]);

  const handleSelectRow = React.useCallback(
    (rowId: string) => {
      setActiveRowId(rowId);
      refreshRowById(rowId);
    },
    [refreshRowById],
  );

  const handleChannelEdit = React.useCallback(
    (row: IRow) => {
      const label = resolveChannelLabel(row);
      const description = resolveChannelDescription(row);
      editChannelForm.reset({ label, description });
      editChannelForm.setFieldValue('label', label);
      editChannelForm.setFieldValue('description', description);
      setEditingChannelId(row._id);
      setEditingChannelRow(row);
      setIsEditChannelOpen(true);
    },
    [editChannelForm, resolveChannelDescription, resolveChannelLabel],
  );

  const handleChannelDelete = React.useCallback(
    async (rowId: string) => {
      await API.delete(`/tables/${tableSlug}/rows/${rowId}`);
      setRowsState((prev) => {
        const nextRows = prev.filter((row) => row._id !== rowId);
        setActiveRowId((current) => {
          if (current !== rowId) return current;
          return nextRows[0]?._id ?? null;
        });
        return nextRows;
      });
      setDeleteChannelId(null);
    },
    [tableSlug],
  );

  const buildMessagesPayload = React.useCallback(
    (messagesValue: Array<Record<string, unknown>>) => {
      if (!messagesField) return [];
      return messagesValue.map((message) => {
        const messageRecord =
          message && typeof message === 'object' ? message : {};
        const payload: Record<string, unknown> = {};
        for (const field of resolvedGroupFields) {
          if (field.slug === messageIdField?.slug) {
            const existingId = normalizeId(messageRecord[field.slug]);
            payload[field.slug] = existingId ?? crypto.randomUUID();
            continue;
          }

          if (field.slug === messageAuthorField?.slug) {
            const authorValue =
              messageRecord[field.slug] ??
              (currentUserId ? [currentUserId] : []);
            payload[field.slug] = normalizeGroupFieldValue(field, authorValue);
            continue;
          }

          if (field.slug === messageDateField?.slug) {
            const dateValue =
              messageRecord[field.slug] ?? new Date().toISOString();
            payload[field.slug] = normalizeGroupFieldValue(field, dateValue);
            continue;
          }

          payload[field.slug] = normalizeGroupFieldValue(
            field,
            messageRecord[field.slug],
          );
        }
        return payload;
      });
    },
    [
      currentUserId,
      messageAuthorField?.slug,
      messageDateField?.slug,
      messageIdField?.slug,
      messagesField,
      resolvedGroupFields,
    ],
  );

  const applyMessagesUpdate = React.useCallback(
    async (nextMessages: Array<Record<string, unknown>>) => {
      if (!activeRow || !messagesField) return;
      const payload = buildMessagesPayload(nextMessages);
      await updateRow.mutateAsync({
        slug: tableSlug,
        rowId: activeRow._id,
        data: {
          [messagesField.slug]: payload,
        },
      });
    },
    [activeRow, buildMessagesPayload, messagesField, tableSlug, updateRow],
  );

  const handleSend = React.useCallback(async () => {
    if (!activeRow || !messagesField) return;
    if (!currentUserId) {
      toast('Usuario nao identificado');
      return;
    }

    const { text: formText, mentions: formMentions } =
      composerForm.state.values;
    const hasText = stripHtml(formText).length > 0;
    const hasAttachments = composerStorages.length > 0;

    if (!hasText && !hasAttachments) {
      toast('Escreva uma mensagem ou adicione um anexo');
      return;
    }

    const nextMessages = [...rawMessages];
    const base =
      editingIndex !== null && rawMessages[editingIndex]
        ? { ...(rawMessages[editingIndex] as Record<string, unknown>) }
        : {};

    if (messageIdField) {
      const existingId = normalizeId(base[messageIdField.slug]);
      base[messageIdField.slug] = existingId ?? crypto.randomUUID();
    }

    if (messageTextField) {
      base[messageTextField.slug] = formText || '';
    }

    if (editingIndex === null && messageAuthorField) {
      base[messageAuthorField.slug] = [currentUserId];
    }

    if (editingIndex === null && messageDateField) {
      base[messageDateField.slug] =
        base[messageDateField.slug] ?? new Date().toISOString();
    }

    if (messageAttachmentsField) {
      base[messageAttachmentsField.slug] = composerStorages.map(
        (storage) => storage._id,
      );
    }

    if (messageMentionsField) {
      base[messageMentionsField.slug] = formMentions;
    }

    if (messageReplyField) {
      base[messageReplyField.slug] = replyToId ?? null;
    }

    if (messageReactionsField && !base[messageReactionsField.slug]) {
      base[messageReactionsField.slug] = serializeReactions([]);
    }

    if (editingIndex !== null) {
      nextMessages[editingIndex] = base;
    } else {
      nextMessages.push(base);
    }

    await applyMessagesUpdate(nextMessages);
    resetComposer();
    bumpFocus();
  }, [
    activeRow,
    applyMessagesUpdate,
    composerForm.state.values,
    composerStorages,
    currentUserId,
    editingIndex,
    messageAttachmentsField,
    messageAuthorField,
    messageDateField,
    messageIdField,
    messageMentionsField,
    messageReactionsField,
    messageReplyField,
    messageTextField,
    messagesField,
    rawMessages,
    replyToId,
    resetComposer,
    bumpFocus,
  ]);

  const handleDelete = React.useCallback(
    async (index: number) => {
      const nextMessages = rawMessages.filter((_, i) => i !== index);
      await applyMessagesUpdate(nextMessages);
    },
    [applyMessagesUpdate, rawMessages],
  );

  const handleStartEdit = React.useCallback(
    (index: number) => {
      const message = messages[index];
      const mentionIds = message.mentions
        .map((mention) => normalizeId(mention))
        .filter((item): item is string => Boolean(item));
      composerForm.reset({
        text: message.text || '',
        mentions: mentionIds,
        files: [],
      });
      composerForm.setFieldValue('text', message.text || '');
      setComposerStorages(message.attachments);
      setReplyToId(message.replyTo ?? null);
      setEditingIndex(index);
      bumpFocus();
    },
    [bumpFocus, composerForm, messages],
  );

  const toggleReaction = React.useCallback(
    async (messageIndex: number, emoji: string) => {
      if (!currentUserId || !messageReactionsField) return;
      const message = messages[messageIndex];
      const entries = [...message.reactions];
      const existing = entries.find((entry) => entry.emoji === emoji);
      if (!existing) {
        entries.push({ emoji, users: [currentUserId] });
      } else {
        const hasUser = existing.users.includes(currentUserId);
        existing.users = hasUser
          ? existing.users.filter((id) => id !== currentUserId)
          : [...existing.users, currentUserId];
      }

      const nextMessages = [...rawMessages];
      const base = {
        ...(rawMessages[messageIndex] as Record<string, unknown>),
        [messageReactionsField.slug]: serializeReactions(entries),
      };
      nextMessages[messageIndex] = base;
      await applyMessagesUpdate(nextMessages);
    },
    [
      applyMessagesUpdate,
      currentUserId,
      messageReactionsField,
      messages,
      rawMessages,
    ],
  );

  React.useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeRowId, messages.length]);

  const channelTitle =
    activeRow && channelField
      ? String(activeRow[channelField.slug] ?? 'Canal')
      : 'Canal';
  const channelDescription =
    activeRow && typeof activeRow['descricao'] === 'string'
      ? activeRow['descricao']
      : '';
  const replyMessage = replyToId
    ? (messages.find((message) => message.id === replyToId) ?? null)
    : null;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <ForumSidebar
        rows={rowsState}
        activeRowId={activeRowId}
        channelField={channelField}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((value) => !value)}
        onAddChannel={() => setIsAddChannelOpen(true)}
        onSelectRow={handleSelectRow}
        onEditRow={handleChannelEdit}
        onDeleteRow={(row) => setDeleteChannelId(row._id)}
      />

      <ForumAddChannelDialog
        open={isAddChannelOpen}
        onOpenChange={setIsAddChannelOpen}
        form={addChannelForm}
        isPending={createRow.status === 'pending'}
        labelValue={addChannelLabel}
        onCancel={() => setIsAddChannelOpen(false)}
      />

      <ForumEditChannelDialog
        key={editingChannelId ?? 'edit-channel'}
        open={isEditChannelOpen}
        onOpenChange={setIsEditChannelOpen}
        form={editChannelForm}
        isPending={updateRow.status === 'pending'}
        labelValue={editChannelLabel}
        onCancel={() => setIsEditChannelOpen(false)}
      />

      <ForumDeleteChannelDialog
        open={deleteChannelId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteChannelId(null);
        }}
        onConfirm={async () => {
          if (!deleteChannelId) return;
          await handleChannelDelete(deleteChannelId);
        }}
      />

      <ForumDeleteMessageDialog
        open={deleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteIndex(null);
        }}
        onConfirm={async () => {
          if (deleteIndex === null) return;
          await handleDelete(deleteIndex);
          setDeleteIndex(null);
        }}
      />

      <section className="flex-1 flex flex-col min-h-0">
        <ForumHeader
          title={channelTitle}
          description={channelDescription}
          composerLayout={composerLayout}
          onChangeLayout={setComposerLayout}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          {activeRow && (
            <TabsList className="shrink-0 mx-3 mt-3">
              <TabsTrigger
                value="chat"
                className="cursor-pointer"
              >
                Mensagens
              </TabsTrigger>
              <TabsTrigger
                value="docs"
                className="cursor-pointer"
              >
                Documentos
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent
            value="chat"
            className="flex-1 flex flex-col min-h-0"
          >
            {activeRow ? (
              <div
                className={cn(
                  'flex-1 min-h-0',
                  composerLayout === 'side' ? 'flex' : 'flex flex-col',
                )}
              >
                <ForumMessagesList
                  messages={messages}
                  currentUserId={currentUserId}
                  endRef={messagesEndRef}
                  onReply={setReplyToId}
                  onEdit={handleStartEdit}
                  onDelete={(index) => setDeleteIndex(index)}
                  onToggleReaction={toggleReaction}
                />

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
                />
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Selecione um canal para ver as mensagens.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="docs"
            className="flex-1 overflow-auto p-4"
          >
            {activeRow ? (
              <>
                <ForumDocuments documents={documents} />
                {documents.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum documento anexado.
                  </p>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Selecione um canal para ver os documentos.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
