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
  // o populate padrao resolva como antes. So atua em campos com `relationshipId`
  // (pivo); campos legados (sem definition) ficam intocados (embedded).
  abstract hydrate(
    fields: IField[],
    docs: RelationshipHydratableDoc[],
  ): Promise<void>;

  // Separa do payload de escrita os campos RELATIONSHIP geridos por links.
  abstract extract(
    fields: IField[],
    data: Record<string, unknown>,
  ): RelationshipExtractResult;

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
