# DI Bug: RowMemberNotificationService — notificationService undefined em produção

## Erro

```
[table-rows > create][error]: TypeError: Cannot read properties of undefined (reading 'notify')
at RowMemberNotificationService.notifyNewMembers (file:///app/chunk-I4HGEDSB.js:91:36)
at TableRowCreateUseCase.execute (file:///app/chunk-WAZU42XL.js:153:47)
```

`this.notificationService` é `undefined` dentro de `RowMemberNotificationService.notifyNewMembers`.

---

## Causa Raiz

### Dev vs Produção

| Ambiente | Transpilador | `decoratorMetadata` |
|----------|-------------|---------------------|
| Dev (`npm run dev`) | `@swc-node/register` lê `.swcrc` | ✅ `true` |
| Produção (`npm run build`) | `tsup` usa SWC interno (ignora `.swcrc`) | ❌ não habilitado |

### Por que a injeção falha

`fastify-decorators` v3 usa `Reflect.getMetadata('design:paramtypes', RowMemberNotificationService)` para descobrir as dependências do construtor. Essa metadata é emitida por `emitDecoratorMetadata` (TypeScript) ou `decoratorMetadata` (SWC).

**O problema**: `tsup` v7+ detecta `@swc/core` instalado e usa SWC automaticamente — mas com configuração interna própria, **não** com `.swcrc`. Como o `.swcrc` não é lido em produção, `decoratorMetadata: true` é ignorado. Sem a metadata, o DI não sabe quais dependências injetar e chama `new RowMemberNotificationService()` sem argumentos → `notificationService = undefined`.

### Por que `unplugin-swc` está no `package.json` mas não funciona

```json
"unplugin-swc": "^1.5.9"  // instalado, mas NÃO configurado em tsup.config.ts
```

O `unplugin-swc` força o `tsup`/esbuild a usar o SWC **respeitando o `.swcrc`** (com `decoratorMetadata: true`). Está instalado mas esquecido de ser wired.

### Por que outros serviços funcionam

- **Repositórios** (`TableMongooseRepository`, `RowMongooseRepository`, etc.): têm 0 parâmetros no construtor — não precisam de metadata para ser instanciados.
- **`KanbanCommentMentionService`**: tem o **mesmo bug latente** (`notificationService = undefined`), mas provavelmente não está sendo exercitado em produção ou a falha é silenciosa.

---

## Arquivos Envolvidos

| Arquivo | Papel |
|---------|-------|
| `backend/tsup.config.ts` | Falta o plugin `unplugin-swc` |
| `backend/.swcrc` | Configuração correta (`decoratorMetadata: true`) — ignorada em prod |
| `backend/application/services/row-member-notification/row-member-notification.service.ts` | Serviço afetado |
| `backend/application/services/kanban-comment-mention/kanban-comment-mention.service.ts` | Mesmo bug latente |
| `backend/application/core/di-registry.ts` | Registro DI correto (não é o problema) |

---

## Fix

### 1. Wiring `unplugin-swc` no `tsup.config.ts`

```typescript
// backend/tsup.config.ts
import { swc } from 'unplugin-swc';   // ← adicionar import
import { glob } from 'glob';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'application/**/*.ts',
    'bin/**/*.ts',
    'config/**/*.ts',
    'database/**/*.ts',
    'start/**/*.ts',
    'extensions/**/*.ts',
    'hooks/**/*.ts',
  ],
  ignoreWatch: ['node_modules'],
  outDir: 'build',
  target: 'es2024',
  format: ['esm'],
  banner: {
    js: "import 'reflect-metadata';",
  },
  esbuildPlugins: [swc.esbuild()],    // ← adicionar esta linha
  async onSuccess(): Promise<void> {
    // ... sem alteração
  },
});
```

### 2. Guard defensivo em `RowMemberNotificationService`

```typescript
// backend/application/services/row-member-notification/row-member-notification.service.ts
async notifyNewMembers(params: NotifyRowMembersParams): Promise<void> {
  if (!this.notificationService) {
    console.error('[RowMemberNotificationService] notificationService não injetado — notificação ignorada');
    return;
  }
  // ... resto sem alteração
```

### 3. Verificar `KanbanCommentMentionService`

Checar se o método que chama `this.notificationService.notify(...)` tem guard similar. Se não tiver, adicionar.

---

## Verificação

```bash
# Build
cd backend && npm run build

# Verificar no log de boot que o serviço foi instanciado com a dependência correta:
# [RowMemberNotificationService] instanciado: NotificationService { ... }
# (não deve aparecer "undefined")

# Testar funcional: criar row em tabela Kanban/Calendar com campo USER preenchido
# → notificação deve ser criada sem erro
```

---

## Observação adicional

O `.swcrc` tem `paths` incompleto (falta `@extensions/*` e `@hooks/*` presentes no `tsconfig.json`). Não é causa deste bug, mas vale alinhar futuramente.
