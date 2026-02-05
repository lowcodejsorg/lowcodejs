/**
 * Types for the JavaScript code executor
 */

export type ExecutionErrorType = 'syntax' | 'runtime' | 'timeout' | 'unknown';

export interface ExecutionError {
  type: ExecutionErrorType;
  message: string;
  line?: number;
  column?: number;
}

export interface ExecutionResult {
  success: boolean;
  error?: ExecutionError;
  logs: string[];
}

export type UserAction =
  | 'novo_registro'
  | 'editar_registro'
  | 'excluir_registro'
  | 'carregamento_formulario';

export type ExecutionMoment =
  | 'carregamento_formulario'
  | 'antes_salvar'
  | 'depois_salvar';

export interface TableInfo {
  readonly _id: string;
  readonly name: string;
  readonly slug: string;
}

export interface ExecutionContext {
  userAction: UserAction;
  executionMoment: ExecutionMoment;
  userId?: string;
  isNew?: boolean;
  tableInfo?: TableInfo;
}

export interface FieldDefinition {
  slug: string;
  type: string;
  name: string;
  multiple?: boolean;
  // Para RELATIONSHIP
  relationship?: {
    table: { _id: string; slug: string };
    field: { _id: string; slug: string };
  };
  // Para FIELD_GROUP
  group?: {
    _id?: string;
    slug: string;
  };
  // Para DROPDOWN
  dropdown?: Array<{ id: string; label: string; color?: string | null }>;
  // Para CATEGORY
  category?: Array<{ id: string; label: string; children: unknown[] }>;
}

// ====== Related Query Types ======
export interface RelatedQueryOptions {
  where?: Record<string, any>;
  limit?: number; // max 100
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface RelatedQueryResult {
  data: Array<Record<string, any>>;
  total: number;
}

export interface EmailResult {
  success: boolean;
  message: string;
  recipients?: number;
}

/* eslint-disable no-unused-vars */
export interface FieldApi {
  get(slug: string): any;
  set(slug: string, value: any): void;
  getAll(): Record<string, any>;
  // Para campos RELATIONSHIP - busca o registro relacionado completo
  getRelated(slug: string): Promise<Record<string, any> | null>;
  // Para campos RELATIONSHIP - busca múltiplos registros na tabela relacionada
  queryRelated(
    slug: string,
    options?: RelatedQueryOptions,
  ): Promise<RelatedQueryResult>;
}

export interface ContextApi {
  readonly action: UserAction;
  readonly moment: ExecutionMoment;
  readonly userId: string;
  readonly isNew: boolean;
  readonly table: TableInfo;
}

export interface EmailApi {
  send(to: string[], subject: string, body: string): Promise<EmailResult>;
  sendTemplate(
    to: string[],
    subject: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<EmailResult>;
}

export interface UtilsApi {
  today(): Date;
  now(): Date;
  formatDate(date: Date, format?: string): string;
  sha256(text: string): string;
  uuid(): string;
}

// ====== DB API (Query related tables) ======
export interface DbQueryOptions {
  where?: Record<string, any>;
  limit?: number; // max 100
  select?: string[];
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface DbQueryResult {
  _id: string;
  [key: string]: any;
}

/* eslint-disable no-unused-vars */
export interface DbApi {
  query(tableSlug: string, options?: DbQueryOptions): Promise<DbQueryResult[]>;
  findById(tableSlug: string, id: string): Promise<DbQueryResult | null>;
  findOne(
    tableSlug: string,
    where: Record<string, any>,
  ): Promise<DbQueryResult | null>;
}
/* eslint-enable no-unused-vars */

export interface SandboxGlobals {
  field: FieldApi;
  context: ContextApi;
  email: EmailApi;
  utils: UtilsApi;
  db: DbApi;
  console: {
    // eslint-disable-next-line no-unused-vars
    log: (...args: any[]) => void;
    // eslint-disable-next-line no-unused-vars
    warn: (...args: any[]) => void;
    // eslint-disable-next-line no-unused-vars
    error: (...args: any[]) => void;
  };
  // Builtins will be added dynamically
  [key: string]: any;
}
