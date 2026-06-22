/**
 * Tipos do módulo Senhas (apps/modules/senhas).
 *
 * Modelado a partir do Forum (canais + mensagens), porém:
 * - "mensagens" viram "entradas de senha" (PasswordEntry) cifradas em repouso;
 * - canais são privados por padrão (passbolt-like).
 */

export interface IPasswordUserRef {
  _id: string;
  name: string;
  email: string;
}

/** Canal (vault) — agrupa entradas de senha e controla quem acessa. */
export interface IPasswordChannel {
  _id: string;
  name: string;
  description: string | null;
  private: boolean;
  owner: IPasswordUserRef | string;
  members: Array<IPasswordUserRef | string>;
  entriesCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entrada de senha. `secret` e `notes` são devolvidos JÁ DECIFRADOS para
 * membros autorizados; no banco vivem apenas como ciphertext.
 */
export interface IPasswordEntry {
  _id: string;
  channel: string;
  title: string;
  username: string | null;
  url: string | null;
  secret: string;
  notes: string | null;
  author: IPasswordUserRef | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelInput {
  name: string;
  description?: string | null;
  private?: boolean;
  members?: Array<string>;
}

export interface UpdateChannelInput {
  name?: string;
  description?: string | null;
  private?: boolean;
  members?: Array<string>;
}

export interface CreateEntryInput {
  title: string;
  username?: string | null;
  url?: string | null;
  secret: string;
  notes?: string | null;
}

export interface UpdateEntryInput {
  title?: string;
  username?: string | null;
  url?: string | null;
  secret?: string;
  notes?: string | null;
}
