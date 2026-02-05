/**
 * Static TypeScript type declarations for the sandbox API
 * These provide IntelliSense support in the Monaco editor
 */
export const STATIC_SANDBOX_TYPES = `
// ====== RELATED QUERY TYPES ======
interface RelatedQueryOptions {
  /** Filtros de busca */
  where?: Record<string, any>;
  /** Limite máximo de registros (max: 100) */
  limit?: number;
  /** Ordenação */
  orderBy?: Record<string, 'asc' | 'desc'>;
}

interface RelatedQueryResult {
  /** Array de registros encontrados */
  data: Array<Record<string, any>>;
  /** Total de registros que correspondem aos filtros */
  total: number;
}

// ====== FIELD API ======
interface FieldApi {
  /**
   * Gets the value of a field by its slug
   * @param slug - The field slug (e.g., 'titulo', 'data-nascimento')
   * @returns The field value
   */
  get(slug: string): any;

  /**
   * Sets the value of a field
   * @param slug - The field slug
   * @param value - The new value (will be auto-converted)
   */
  set(slug: string, value: any): void;

  /**
   * Gets all fields as an object
   * @returns Object with all field slugs and values
   */
  getAll(): Record<string, any>;

  /**
   * Gets the related record for a RELATIONSHIP field
   * @param slug - The slug of a RELATIONSHIP field
   * @returns Promise with the related record or null if not found
   * @example
   * // Get the client data for a 'cliente' relationship field
   * const cliente = await field.getRelated('cliente');
   * if (cliente) {
   *   console.log(cliente.nome, cliente.email);
   * }
   */
  getRelated(slug: string): Promise<Record<string, any> | null>;

  /**
   * Queries records from the table related to a RELATIONSHIP field
   * @param slug - The slug of a RELATIONSHIP field
   * @param options - Query options (where, limit, orderBy)
   * @returns Promise with data array and total count
   * @example
   * // Query all active clients from the related table
   * const result = await field.queryRelated('cliente', {
   *   where: { ativo: true },
   *   limit: 10,
   *   orderBy: { nome: 'asc' }
   * });
   * console.log(result.data, result.total);
   */
  queryRelated(slug: string, options?: RelatedQueryOptions): Promise<RelatedQueryResult>;
}

// ====== CONTEXT API ======
type UserAction = 'novo_registro' | 'editar_registro' | 'excluir_registro' | 'carregamento_formulario';
type ExecutionMoment = 'carregamento_formulario' | 'antes_salvar' | 'depois_salvar';

// ====== TABLE INFO ======
interface TableInfo {
  /** ID da tabela */
  readonly _id: string;
  /** Nome da tabela */
  readonly name: string;
  /** Slug da tabela */
  readonly slug: string;
}

interface ContextApi {
  /** The current user action */
  readonly action: UserAction;
  /** The execution moment (hook type) */
  readonly moment: ExecutionMoment;
  /** The current user ID */
  readonly userId: string;
  /** Whether this is a new record */
  readonly isNew: boolean;
  /** Information about the current table */
  readonly table: TableInfo;
}

// ====== EMAIL API ======
interface EmailResult {
  success: boolean;
  message: string;
  recipients?: number;
}

interface EmailApi {
  /**
   * Sends a plain email
   * @param to - Array of recipient email addresses
   * @param subject - Email subject
   * @param body - Email body (plain text or HTML)
   * @returns Promise with the result
   */
  send(to: string[], subject: string, body: string): Promise<EmailResult>;

  /**
   * Sends an email using a template
   * @param to - Array of recipient email addresses
   * @param subject - Email subject
   * @param message - Template message
   * @param data - Optional data to inject into template
   * @returns Promise with the result
   */
  sendTemplate(to: string[], subject: string, message: string, data?: Record<string, any>): Promise<EmailResult>;
}

// ====== UTILS API ======
interface UtilsApi {
  /**
   * Returns today's date at midnight
   * @returns Date object for today at 00:00:00
   */
  today(): Date;

  /**
   * Returns the current date and time
   * @returns Current Date object
   */
  now(): Date;

  /**
   * Formats a date according to the specified format
   * @param date - The date to format
   * @param format - Format string (default: 'dd/MM/yyyy')
   * @returns Formatted date string
   */
  formatDate(date: Date, format?: string): string;

  /**
   * Generates SHA256 hash of a string
   * @param text - The text to hash
   * @returns Hexadecimal hash string
   */
  sha256(text: string): string;

  /**
   * Generates a random UUID
   * @returns UUID string
   */
  uuid(): string;
}

// ====== DB API ======
interface DbQueryOptions {
  /** Filtros de busca */
  where?: Record<string, any>;
  /** Limite máximo de registros (max: 100) */
  limit?: number;
  /** Campos a retornar */
  select?: string[];
  /** Ordenação */
  orderBy?: Record<string, 'asc' | 'desc'>;
}

interface DbQueryResult {
  _id: string;
  [key: string]: any;
}

interface DbApi {
  /**
   * Busca registros de uma tabela relacionada
   * @param tableSlug - Slug da tabela (deve ter relacionamento definido)
   * @param options - Opções de filtro, limite, seleção
   * @returns Array de registros
   */
  query(tableSlug: string, options?: DbQueryOptions): Promise<DbQueryResult[]>;

  /**
   * Busca um registro por ID
   * @param tableSlug - Slug da tabela relacionada
   * @param id - ID do registro
   */
  findById(tableSlug: string, id: string): Promise<DbQueryResult | null>;

  /**
   * Busca um registro por condição
   * @param tableSlug - Slug da tabela relacionada
   * @param where - Condições de busca
   */
  findOne(tableSlug: string, where: Record<string, any>): Promise<DbQueryResult | null>;
}

// ====== GLOBAL DECLARATIONS ======
declare const field: FieldApi;
declare const context: ContextApi;
declare const email: EmailApi;
declare const utils: UtilsApi;
declare const db: DbApi;

// ====== BUILTINS ======
// These are available in the sandbox
declare const console: Console;
declare const JSON: JSON;
declare const Date: DateConstructor;
declare const Math: Math;
declare const parseInt: typeof globalThis.parseInt;
declare const parseFloat: typeof globalThis.parseFloat;
declare const isNaN: typeof globalThis.isNaN;
declare const isFinite: typeof globalThis.isFinite;
declare const Number: NumberConstructor;
declare const String: StringConstructor;
declare const Boolean: BooleanConstructor;
declare const Array: ArrayConstructor;
declare const Object: ObjectConstructor;
declare const RegExp: RegExpConstructor;
declare const Map: MapConstructor;
declare const Set: SetConstructor;
declare const Promise: PromiseConstructor;
declare const Error: ErrorConstructor;
declare const TypeError: TypeErrorConstructor;
declare const RangeError: RangeErrorConstructor;
declare const SyntaxError: SyntaxErrorConstructor;
declare const encodeURIComponent: typeof globalThis.encodeURIComponent;
declare const decodeURIComponent: typeof globalThis.decodeURIComponent;
declare const encodeURI: typeof globalThis.encodeURI;
declare const decodeURI: typeof globalThis.decodeURI;
`;
