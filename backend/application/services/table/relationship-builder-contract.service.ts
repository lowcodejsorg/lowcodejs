/* eslint-disable no-unused-vars */
import type { IField } from '@application/core/entity.core';

// Documento Mongoose minimo necessario para hidratar o path embedded a partir
// dos links (sem depender do tipo concreto do model dinamico).
export interface RelationshipHydratableDoc {
  _id: { toString(): string };
  set(path: string, value: unknown): void;
}

// Um campo RELATIONSHIP do payload de escrita ja separado da row, com o
// conjunto de ids desejado (fonte da reconciliacao de links).
export type PendingRelationship = {
  field: IField;
  ids: string[];
};

export type RelationshipExtractResult = {
  // Payload da row sem os campos RELATIONSHIP geridos por links.
  data: Record<string, unknown>;
  pending: PendingRelationship[];
};

export abstract class RelationshipBuilderContractService {
  // Read-compat: hidrata `doc[field.slug]` com os ids vindos dos links, para que
  // o populate padrao resolva como antes. Atua em TODO campo RELATIONSHIP (links
  // sao a unica fonte de verdade); campo sem `relationshipId` tem o path zerado e
  // logado — nunca serve o array embedded legado (zero legado).
  abstract hydrate(
    fields: IField[],
    docs: RelationshipHydratableDoc[],
  ): Promise<void>;

  // Separa do payload de escrita os campos RELATIONSHIP por role: OWNS_FK fica no
  // payload como FK single (escrita nativa); REVERSE/PIVOT viram `pending`.
  abstract extract(
    fields: IField[],
    data: Record<string, unknown>,
  ): RelationshipExtractResult;

  // Read-compat: embrulha em array os campos OWNS_FK (FK single -> [obj]/[]) na
  // projecao final, para a UI continuar consumindo `row[slug]` como lista.
  abstract normalizeReadProjection(
    fields: IField[],
    row: Record<string, unknown>,
  ): void;

  // Filtro role-aware: traduz `otherIds` (ids selecionados na sidebar) num
  // fragmento de query por papel. OWNS_FK -> null (caller filtra `{[slug]:{$in}}`
  // direto, FK na row); REVERSE -> `{ _id: { $in } }` via colecao do dono;
  // PIVOT/legado -> `{ _id: { $in } }` via links na ponta oposta.
  abstract resolveRelationshipFilter(
    field: IField,
    otherIds: string[],
  ): Promise<Record<string, unknown> | null>;

  // Persiste (reconcilia) os links de um registro. Lanca HTTPException quando a
  // cardinalidade/duplicidade e violada.
  abstract persist(
    fields: IField[],
    recordId: string,
    pending: PendingRelationship[],
  ): Promise<void>;

  // True quando ha pelo menos um campo RELATIONSHIP gerido por links (pivo).
  abstract hasManagedRelationships(fields: IField[]): boolean;
}
