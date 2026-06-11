# Kanban Comment Mention Service

Detecta novas mencoes (`@user`) em comentarios de cards Kanban e dispara
notificacoes/emails para os usuarios mencionados.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `kanban-comment-mention-contract.service.ts` | Abstract class: `notifyNewMentions(params)` |
| `kanban-comment-mention.service.ts` | Implementacao default. Compara comentarios novos vs antigos, extrai mencoes, enfileira email via `EmailQueueContractService`. |
| `in-memory-kanban-comment-mention.service.ts` | Mock para testes |
| `kanban-comment-mention.service.spec.ts` | Unit tests |

## Contrato

```typescript
notifyNewMentions(params: {
  table: ITable;
  row: IRow;
  actorUserId: string;
}): Promise<{ changed: boolean; data?: Record<string, unknown> }>
```

- `changed: true` quando ha novas mencoes a notificar.
- `actorUserId` excluido das mencoes (usuario nao se notifica).

## Uso

Chamado em use-cases de `table-rows/update` quando a tabela tem visualizacao
KANBAN com campo de comentarios e o payload contem mencoes novas.

DI: `injectablesHolder.injectService(KanbanCommentMentionContractService, KanbanCommentMentionService)`
