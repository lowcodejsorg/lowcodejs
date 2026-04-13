---
name: maiyu:backend-sandbox
description: |
  Generates sandboxed script execution modules for backend Node.js projects.
  Use when: user asks to create sandbox, script execution, user scripts, custom logic,
  hooks, lifecycle scripts, or mentions "sandbox" for isolated code execution.
  Supports: Node VM (node:vm), isolated-vm, vm2.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **VM Engine**: `vm2` | `isolated-vm` | built-in `node:vm`
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **Validator**: `zod` | `class-validator` | `joi` | `@sinclair/typebox`
3. Scan existing sandbox/executor files to detect:
   - Sandbox location (e.g., `application/core/{feature}/`, `src/sandbox/`)
   - Existing API builder patterns
   - Existing hook/lifecycle definitions
4. If VM engine not detected, default to `node:vm` (built-in, no install needed)
5. If framework not detected, ask user:
   ```
   Which framework does your project use?
   1. Fastify (with fastify-decorators)
   2. Fastify (plain)
   3. Express
   4. NestJS
   5. AdonisJS
   6. Hono
   7. Elysia/Bun
   ```

## Conventions

### Naming
- `types.ts` — shared interfaces and enums for sandbox execution
- `sandbox.ts` — sandbox builder (context creation, global blocking)
- `executor.ts` — script compilation and execution entry point
- `handler.ts` — orchestrator for lifecycle hooks (loads script, builds APIs, runs)
- `api-builder.ts` — factory functions that create API objects exposed to user scripts

### File Placement
- `application/core/{feature}/sandbox/` (Fastify reference architecture)
- `src/sandbox/` or `src/scripting/` (NestJS, Express, generic)
- Keep all sandbox files co-located in a single directory

### Rules
- Always set a timeout on script execution — never allow infinite loops
- Always block dangerous globals (require, process, fs, child_process, net, http, https, fetch)
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains
- Named exports only — no default exports
- Freeze injected API objects to prevent user script tampering
- Log all script executions with context (hook name, user, duration)
- Never expose raw database connections or ORM instances to user scripts

## Templates

### Types (`types.ts`)

```typescript
export interface ExecutionResult {
  success: boolean;
  error?: ExecutionError;
  logs: Array<LogEntry>;
  returnValue?: unknown;
  durationMs: number;
}

export interface ExecutionError {
  type: 'syntax' | 'runtime' | 'timeout' | 'unknown';
  message: string;
  line?: number;
  column?: number;
}

export interface LogEntry {
  level: 'log' | 'warn' | 'error';
  args: unknown[];
  timestamp: number;
}

export interface SandboxAPI {
  [key: string]: unknown;
}

export interface ScriptConfig {
  code: string;
  apis?: SandboxAPI;
  timeout?: number; // ms, default 5000
  scriptId?: string; // for logging/tracking
}

export interface HookDefinition {
  name: string;
  code: string;
  enabled: boolean;
  order: number;
}

export type HookName =
  | 'beforeSave'
  | 'afterSave'
  | 'beforeDelete'
  | 'afterDelete'
  | 'onLoad'
  | 'onValidate'
  | 'beforeRender'
  | 'afterRender';
```

### Sandbox Builder (`sandbox.ts`)

```typescript
import { createContext, type Context } from 'node:vm';

import type { LogEntry, SandboxAPI } from './types';

const BLOCKED_GLOBALS: ReadonlyArray<string> = [
  'require',
  'process',
  'fs',
  'child_process',
  'net',
  'http',
  'https',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'SharedArrayBuffer',
  'Atomics',
  'eval',
  'Function',
] as const;

interface SandboxContextOptions {
  apis?: SandboxAPI;
  logs: Array<LogEntry>;
}

export function buildConsoleAPI(logs: Array<LogEntry>): Record<string, (...args: unknown[]) => void> {
  function createLogFn(level: 'log' | 'warn' | 'error') {
    return function (...args: unknown[]): void {
      logs.push({
        level,
        args,
        timestamp: Date.now(),
      });
    };
  }

  return Object.freeze({
    log: createLogFn('log'),
    warn: createLogFn('warn'),
    error: createLogFn('error'),
  });
}

export function createSandboxContext(options: SandboxContextOptions): Context {
  const { apis, logs } = options;

  const sandbox: Record<string, unknown> = {
    console: buildConsoleAPI(logs),
    setTimeout: undefined,
    setInterval: undefined,
    setImmediate: undefined,
    clearTimeout: undefined,
    clearInterval: undefined,
    clearImmediate: undefined,
    queueMicrotask: undefined,
  };

  // Block dangerous globals
  for (const name of BLOCKED_GLOBALS) {
    sandbox[name] = undefined;
  }

  // Inject user-provided APIs (frozen to prevent tampering)
  if (apis) {
    for (const [key, value] of Object.entries(apis)) {
      if (typeof value === 'object' && value !== null) {
        sandbox[key] = Object.freeze(value);
      } else {
        sandbox[key] = value;
      }
    }
  }

  // Provide safe built-ins
  sandbox.JSON = JSON;
  sandbox.Math = Math;
  sandbox.Date = Date;
  sandbox.Number = Number;
  sandbox.String = String;
  sandbox.Boolean = Boolean;
  sandbox.Array = Array;
  sandbox.Object = Object;
  sandbox.Map = Map;
  sandbox.Set = Set;
  sandbox.RegExp = RegExp;
  sandbox.parseInt = parseInt;
  sandbox.parseFloat = parseFloat;
  sandbox.isNaN = isNaN;
  sandbox.isFinite = isFinite;
  sandbox.encodeURIComponent = encodeURIComponent;
  sandbox.decodeURIComponent = decodeURIComponent;

  const context = createContext(sandbox);
  return context;
}
```

### Executor (`executor.ts`)

```typescript
import { Script } from 'node:vm';

import { createSandboxContext } from './sandbox';
import type { ExecutionResult, LogEntry, ScriptConfig } from './types';

const DEFAULT_TIMEOUT_MS = 5000;

export async function runInSandbox(config: ScriptConfig): Promise<ExecutionResult> {
  const { code, apis, timeout, scriptId } = config;
  const effectiveTimeout = timeout || DEFAULT_TIMEOUT_MS;
  const logs: Array<LogEntry> = [];
  const startTime = Date.now();

  // Step 1: Compile the script (catch syntax errors)
  let script: Script;
  try {
    script = new Script(code, {
      filename: scriptId || 'user-script.js',
    });
  } catch (err: unknown) {
    let message = 'Unknown syntax error';
    if (err instanceof Error) {
      message = err.message;
    }
    return {
      success: false,
      error: {
        type: 'syntax',
        message,
      },
      logs,
      durationMs: Date.now() - startTime,
    };
  }

  // Step 2: Create isolated context with frozen globals
  const context = createSandboxContext({ apis, logs });

  // Step 3: Execute with timeout
  try {
    const returnValue = script.runInContext(context, {
      timeout: effectiveTimeout,
      displayErrors: true,
    });

    return {
      success: true,
      logs,
      returnValue,
      durationMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    let errorMessage = 'Unknown runtime error';
    if (err instanceof Error) {
      errorMessage = err.message;
    }

    // Check if it was a timeout
    const isTimeout = errorMessage.includes('Script execution timed out');

    if (isTimeout) {
      return {
        success: false,
        error: {
          type: 'timeout',
          message: `Script exceeded timeout of ${effectiveTimeout}ms`,
        },
        logs,
        durationMs: Date.now() - startTime,
      };
    }

    return {
      success: false,
      error: {
        type: 'runtime',
        message: errorMessage,
      },
      logs,
      durationMs: Date.now() - startTime,
    };
  }
}
```

### API Builder (`api-builder.ts`)

Factory functions that create API objects exposed to user scripts:

```typescript
import { randomUUID, createHash } from 'node:crypto';

import type { SandboxAPI } from './types';

// --- Field API ---
// Provides read/write access to {entity} field values within user scripts.

interface FieldEntry {
  slug: string;
  value: unknown;
}

interface FieldAPI {
  get: (slug: string) => unknown;
  set: (slug: string, value: unknown) => void;
  getAll: () => Record<string, unknown>;
}

export function buildFieldAPI(fields: Array<FieldEntry>): FieldAPI {
  const fieldMap = new Map<string, unknown>();

  for (const field of fields) {
    fieldMap.set(field.slug, field.value);
  }

  function get(slug: string): unknown {
    return fieldMap.get(slug);
  }

  function set(slug: string, value: unknown): void {
    fieldMap.set(slug, value);
  }

  function getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, val] of fieldMap.entries()) {
      result[key] = val;
    }
    return result;
  }

  return Object.freeze({ get, set, getAll });
}

// --- Context API ---
// Provides execution context info to user scripts.

interface ExecutionContext {
  action: string;
  userId: string;
  isNew: boolean;
  resourceId?: string;
}

interface ContextAPI {
  action: string;
  userId: string;
  isNew: boolean;
  resourceId: string | undefined;
}

export function buildContextAPI(ctx: ExecutionContext): ContextAPI {
  return Object.freeze({
    action: ctx.action,
    userId: ctx.userId,
    isNew: ctx.isNew,
    resourceId: ctx.resourceId,
  });
}

// --- Utils API ---
// Provides safe utility functions to user scripts.

interface UtilsAPI {
  today: () => string;
  now: () => number;
  formatDate: (date: Date | string | number, locale?: string) => string;
  uuid: () => string;
  sha256: (input: string) => string;
}

export function buildUtilsAPI(): UtilsAPI {
  function today(): string {
    return new Date().toISOString().split('T')[0];
  }

  function now(): number {
    return Date.now();
  }

  function formatDate(date: Date | string | number, locale?: string): string {
    const d = new Date(date);
    const effectiveLocale = locale || 'en-US';
    return d.toLocaleDateString(effectiveLocale);
  }

  function uuid(): string {
    return randomUUID();
  }

  function sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  return Object.freeze({ today, now, formatDate, uuid, sha256 });
}

// --- Compose APIs ---
// Merges all API objects into a single SandboxAPI for injection.

interface ComposeAPIsParams {
  fields?: Array<FieldEntry>;
  context?: ExecutionContext;
  includeUtils?: boolean;
}

export function composeAPIs(params: ComposeAPIsParams): SandboxAPI {
  const apis: SandboxAPI = {};

  if (params.fields) {
    apis.fields = buildFieldAPI(params.fields);
  }

  if (params.context) {
    apis.ctx = buildContextAPI(params.context);
  }

  if (params.includeUtils !== false) {
    apis.utils = buildUtilsAPI();
  }

  return apis;
}
```

### Handler / Orchestrator (`handler.ts`)

Pattern for lifecycle hooks — loads script, builds APIs, executes, processes result:

```typescript
import { composeAPIs } from './api-builder';
import { runInSandbox } from './executor';
import type { ExecutionResult, HookDefinition, HookName } from './types';

interface HookExecutionParams {
  hookName: HookName;
  fields: Array<{ slug: string; value: unknown }>;
  context: {
    action: string;
    userId: string;
    isNew: boolean;
    resourceId?: string;
  };
  loadHooks: (hookName: HookName) => Promise<Array<HookDefinition>>;
}

interface HookExecutionResult {
  success: boolean;
  errors: Array<{ hookName: string; error: string }>;
  fieldChanges: Record<string, unknown>;
  logs: Array<{ hookName: string; level: string; args: unknown[] }>;
}

export async function executeLifecycleHooks(
  params: HookExecutionParams,
): Promise<HookExecutionResult> {
  const { hookName, fields, context, loadHooks } = params;

  const result: HookExecutionResult = {
    success: true,
    errors: [],
    fieldChanges: {},
    logs: [],
  };

  // Step 1: Load scripts from DB/config by hook name
  const hooks = await loadHooks(hookName);

  // Filter to enabled hooks and sort by order
  const enabledHooks = hooks
    .filter((h) => h.enabled)
    .sort((a, b) => a.order - b.order);

  if (enabledHooks.length === 0) {
    return result;
  }

  // Step 2: Build APIs to inject
  const apis = composeAPIs({
    fields,
    context,
    includeUtils: true,
  });

  // Step 3: Execute each hook in order
  for (const hook of enabledHooks) {
    const execution: ExecutionResult = await runInSandbox({
      code: hook.code,
      apis,
      timeout: 5000,
      scriptId: `${hookName}:${hook.name}`,
    });

    // Collect logs with hook name attribution
    for (const log of execution.logs) {
      result.logs.push({
        hookName: hook.name,
        level: log.level,
        args: log.args,
      });
    }

    // Step 4: Process result
    if (!execution.success) {
      result.success = false;
      result.errors.push({
        hookName: hook.name,
        error: execution.error?.message || 'Unknown error',
      });

      // Stop execution on first error (fail-fast)
      break;
    }

    // If script returned field changes, merge them
    if (execution.returnValue && typeof execution.returnValue === 'object') {
      const changes: Record<string, unknown> = execution.returnValue;
      for (const [key, value] of Object.entries(changes)) {
        result.fieldChanges[key] = value;
      }
    }
  }

  return result;
}
```

### Monaco Editor Integration (Frontend)

Pattern for custom autocomplete when editing user scripts:

```typescript
// Register sandbox API completions for Monaco editor.
// Call this once when the editor mounts.

import type { languages } from 'monaco-editor';

interface SandboxCompletionItem {
  label: string;
  kind: number; // monaco.languages.CompletionItemKind
  detail: string;
  documentation: string;
  insertText: string;
}

export function registerSandboxCompletions(
  monaco: typeof import('monaco-editor'),
): void {
  const completionItems: Array<SandboxCompletionItem> = [
    // --- fields API ---
    {
      label: 'fields.get',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '(slug: string) => unknown',
      documentation: 'Get the value of a field by its slug.',
      insertText: 'fields.get("${1:slug}")',
    },
    {
      label: 'fields.set',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '(slug: string, value: unknown) => void',
      documentation: 'Set the value of a field by its slug.',
      insertText: 'fields.set("${1:slug}", ${2:value})',
    },
    {
      label: 'fields.getAll',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '() => Record<string, unknown>',
      documentation: 'Get all field values as a key-value object.',
      insertText: 'fields.getAll()',
    },
    // --- ctx API ---
    {
      label: 'ctx.action',
      kind: monaco.languages.CompletionItemKind.Property,
      detail: 'string',
      documentation: 'Current action being performed (e.g., "create", "update").',
      insertText: 'ctx.action',
    },
    {
      label: 'ctx.userId',
      kind: monaco.languages.CompletionItemKind.Property,
      detail: 'string',
      documentation: 'ID of the user performing the action.',
      insertText: 'ctx.userId',
    },
    {
      label: 'ctx.isNew',
      kind: monaco.languages.CompletionItemKind.Property,
      detail: 'boolean',
      documentation: 'Whether this is a new resource being created.',
      insertText: 'ctx.isNew',
    },
    {
      label: 'ctx.resourceId',
      kind: monaco.languages.CompletionItemKind.Property,
      detail: 'string | undefined',
      documentation: 'ID of the resource being operated on (undefined for new resources).',
      insertText: 'ctx.resourceId',
    },
    // --- utils API ---
    {
      label: 'utils.today',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '() => string',
      documentation: 'Returns today\'s date as YYYY-MM-DD string.',
      insertText: 'utils.today()',
    },
    {
      label: 'utils.now',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '() => number',
      documentation: 'Returns current timestamp in milliseconds.',
      insertText: 'utils.now()',
    },
    {
      label: 'utils.formatDate',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '(date: Date | string | number, locale?: string) => string',
      documentation: 'Format a date value using the given locale.',
      insertText: 'utils.formatDate(${1:date}, "${2:en-US}")',
    },
    {
      label: 'utils.uuid',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '() => string',
      documentation: 'Generate a random UUID v4.',
      insertText: 'utils.uuid()',
    },
    {
      label: 'utils.sha256',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '(input: string) => string',
      documentation: 'Compute SHA-256 hash of a string.',
      insertText: 'utils.sha256("${1:input}")',
    },
    // --- console API ---
    {
      label: 'console.log',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '(...args: unknown[]) => void',
      documentation: 'Log a message (captured in execution result logs).',
      insertText: 'console.log(${1})',
    },
    {
      label: 'console.warn',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '(...args: unknown[]) => void',
      documentation: 'Log a warning (captured in execution result logs).',
      insertText: 'console.warn(${1})',
    },
    {
      label: 'console.error',
      kind: monaco.languages.CompletionItemKind.Function,
      detail: '(...args: unknown[]) => void',
      documentation: 'Log an error (captured in execution result logs).',
      insertText: 'console.error(${1})',
    },
  ];

  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems(
      model: unknown,
      position: unknown,
    ): languages.ProviderResult<languages.CompletionList> {
      const suggestions = completionItems.map((item) => ({
        label: item.label,
        kind: item.kind,
        detail: item.detail,
        documentation: item.documentation,
        insertText: item.insertText,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: undefined as unknown,
      }));

      return { suggestions } as languages.CompletionList;
    },
  });
}
```

## Security Considerations

### Globals to Block
All of these must be set to `undefined` in the sandbox context:

| Global | Risk |
|--------|------|
| `require` | Arbitrary module loading |
| `process` | Environment variables, exit, signals |
| `fs` / `child_process` / `net` | File system, shell execution, networking |
| `http` / `https` / `fetch` | Outbound HTTP requests |
| `XMLHttpRequest` / `WebSocket` | Browser-style networking |
| `Worker` / `SharedArrayBuffer` / `Atomics` | Thread spawning, shared memory |
| `eval` / `Function` | Dynamic code generation to escape sandbox |
| `setTimeout` / `setInterval` / `setImmediate` | Async scheduling that escapes timeout |
| `queueMicrotask` | Microtask scheduling that escapes timeout |

### Memory Limits
- `node:vm` does not enforce memory limits natively
- For memory-constrained environments, use `isolated-vm` which supports `memoryLimit` in MB
- As a fallback, monitor process memory externally and kill long-running scripts

### Timeout Best Practices
- Default timeout: 5000ms for standard hooks
- Short timeout (1000ms): field validation, computed fields
- Medium timeout (5000ms): lifecycle hooks (beforeSave, afterSave)
- Long timeout (15000ms): batch processing, data migration scripts
- Never allow user-configurable timeouts above 30000ms

### Input Sanitization
- Validate script `code` is a non-empty string before compilation
- Strip or reject scripts containing known escape patterns (e.g., `this.constructor`)
- Limit script size (recommended max: 64KB)
- Sanitize any values returned from user scripts before persisting to database

## Checklist

Before delivering sandbox code, verify:

- [ ] All code is proper TypeScript with explicit type annotations
- [ ] No ternary operators — if/else or early returns only
- [ ] Named exports only — no default exports
- [ ] Timeout is always set on `script.runInContext` or equivalent
- [ ] All dangerous globals from the security table are blocked
- [ ] Injected API objects are frozen with `Object.freeze()`
- [ ] Console output is captured into the `logs` array
- [ ] Syntax errors are caught during `new Script()` compilation
- [ ] Runtime errors are caught and returned in `ExecutionResult`
- [ ] Timeout errors are detected and returned with `type: 'timeout'`
- [ ] `durationMs` is always measured and returned
- [ ] Handler loads hooks from DB/config, not hardcoded
- [ ] Handler executes hooks in defined `order`
- [ ] Handler stops on first error (fail-fast pattern)
- [ ] API builder functions are pure factories (no side effects)
- [ ] Monaco completions cover all exposed API surfaces
- [ ] No LowcodeJS-specific references — uses `{Entity}`/`{entity}` placeholders
