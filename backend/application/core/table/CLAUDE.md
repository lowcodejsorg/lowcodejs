# Table Sandbox (VM de Scripts)

Sistema de sandbox para execucao segura de scripts de usuario (beforeSave, afterSave, onLoad).

## Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `handler.ts` | Ponto de entrada principal. Orquestra: monta sandbox, executa, coleta logs. Exporta `executeScript()` e `HandlerFunctionAsync()` (compatibilidade) |
| `executor.ts` | Executa codigo em Node `vm.Script` com timeout. Valida sintaxe sem executar via `validateSyntax()` |
| `sandbox.ts` | Monta ambiente isolado (SandboxGlobals) com todas as APIs e builtins permitidos |
| `field-resolver.ts` | Resolve valores de campo com normalizacao de slug (hifen/underscore). Converte tipos automaticamente |
| `types.ts` | Tipos TypeScript: ExecutionResult, ExecutionContext, FieldDefinition, APIs (Field, Context, Email, Utils) |

## Seguranca e Isolamento

- Execucao via `vm.createContext()` + `vm.Script` (Node VM isolada)
- **Timeout**: 5 segundos (DEFAULT_TIMEOUT)
- **Bloqueado**: require, fs, network, process, global - nenhum acesso a globals do Node
- **Permitido**: JSON, Date, Math, Number, String, Boolean, Array, Object, RegExp, Map, Set, Promise, Error, encode/decodeURI(Component)
- Codigo deve estar em formato IIFE: `(async () => { ... })()`
- Promises executadas com `Promise.race` contra timeout
- `breakOnSigint: true` para interrupcao via Ctrl+C

## APIs Expostas ao Script

| API | Metodos | Descricao |
|-----|---------|-----------|
| `field` | `get(slug)`, `set(slug, value)`, `getAll()` | Leitura/escrita de campos do registro |
| `context` | `action`, `moment`, `userId`, `isNew`, `table` | Contexto de execucao (read-only, Object.freeze) |
| `email` | `send(to[], subject, body)`, `sendTemplate(to[], subject, message, data?)` | Envio de email via Nodemailer |
| `utils` | `today()`, `now()`, `formatDate(date, format?)`, `sha256(text)`, `uuid()` | Utilitarios de data, crypto, UUID |
| `console` | `log()`, `warn()`, `error()` | Logs interceptados e retornados no resultado |

## Context Values

| Campo | Valores |
|-------|---------|
| `action` | `novo_registro`, `editar_registro`, `excluir_registro`, `carregamento_formulario` |
| `moment` | `carregamento_formulario`, `antes_salvar`, `depois_salvar` |

## Retorno (ExecutionResult)

```typescript
{ success: boolean, error?: ExecutionError, logs: string[] }
```

Tipos de erro: `syntax`, `runtime`, `timeout`, `unknown` (com line/column quando disponivel)

## Field Resolver

- `normalizeSlug(slug)` - converte hifens para underscores
- `resolveFieldValue(doc, slug)` - tenta slug original, normalizado e com hifens
- `convertValue(value)` - converte strings para Number, Boolean ou Date automaticamente
