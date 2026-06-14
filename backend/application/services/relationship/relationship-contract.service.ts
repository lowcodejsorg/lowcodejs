/* eslint-disable no-unused-vars */
import type { Either } from '@application/core/either.core';
import type {
  E_RELATIONSHIP_CARDINALITY,
  IField,
  IRelationshipDefinition,
  IRelationshipLink,
  ValueOf,
} from '@application/core/entity.core';
import type HTTPException from '@application/core/exception.core';
import type { RelationshipLinkSide } from '@application/repositories/relationship-link/relationship-link-contract.repository';

export type RelationshipCanLinkParams = {
  definition: IRelationshipDefinition;
  sourceField: Pick<IField, 'multiple'>;
  targetField: Pick<IField, 'multiple'>;
  sourceId: string;
  targetId: string;
};

export type RelationshipLinkParams = RelationshipCanLinkParams & {
  metadata?: Record<string, unknown> | null;
};

// Reconcilia os vinculos de um registro (lado `side`) para o conjunto desejado:
// adiciona os ids novos (via canLink) e remove os ausentes. Usado na escrita de
// row, onde `row[slug]` carrega o conjunto completo desejado.
export type RelationshipReplaceParams = {
  definition: IRelationshipDefinition;
  recordId: string;
  side: RelationshipLinkSide;
  desiredIds: string[];
  sourceField: Pick<IField, 'multiple'>;
  targetField: Pick<IField, 'multiple'>;
};

export abstract class RelationshipContractService {
  // Cardinalidade derivada dos dois `field.multiple` (nao persistida, §5.2).
  abstract cardinalityOf(
    sourceField: Pick<IField, 'multiple'>,
    targetField: Pick<IField, 'multiple'>,
  ): ValueOf<typeof E_RELATIONSHIP_CARDINALITY>;
  // Valida regras de cardinalidade/duplicidade/auto-vinculo antes de vincular.
  abstract canLink(
    params: RelationshipCanLinkParams,
  ): Promise<Either<HTTPException, true>>;
  // Cria o vinculo (apos canLink), apendando na lista do lado source.
  abstract link(
    params: RelationshipLinkParams,
  ): Promise<Either<HTTPException, IRelationshipLink>>;
  // Remove um vinculo pelo seu _id.
  abstract unlink(linkId: string): Promise<Either<HTTPException, true>>;
  // Ids dos registros relacionados a `recordId` lendo pelo lado informado.
  abstract resolveLinkedIds(
    definition: IRelationshipDefinition,
    recordId: string,
    side: RelationshipLinkSide,
  ): Promise<string[]>;
  // Reconcilia os vinculos de um registro para o conjunto `desiredIds`.
  abstract replaceLinks(
    params: RelationshipReplaceParams,
  ): Promise<Either<HTTPException, true>>;
}
