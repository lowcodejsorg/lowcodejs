import { beforeEach, describe, expect, it } from 'vitest';

import {
  E_RELATIONSHIP_CARDINALITY,
  E_RELATIONSHIP_ON_DELETE,
  type IRelationshipDefinition,
} from '@application/core/entity.core';
import RelationshipLinkInMemoryRepository from '@application/repositories/relationship-link/relationship-link-in-memory.repository';

import RelationshipService from './relationship.service';

function makeDefinition(): IRelationshipDefinition {
  return {
    _id: 'rel-1',
    name: 'A ↔ B',
    source: {
      table: { _id: 'table-a', slug: 'table-a' },
      field: { _id: 'field-a', slug: 'field-a' },
      visible: true,
      label: 'B',
    },
    target: {
      table: { _id: 'table-b', slug: 'table-b' },
      field: { _id: 'field-b', slug: 'field-b' },
      visible: false,
      label: 'A',
    },
    onDelete: E_RELATIONSHIP_ON_DELETE.RESTRICT,
    createdAt: new Date(),
    updatedAt: new Date(),
    trashed: false,
    trashedAt: null,
  };
}

describe('RelationshipService', () => {
  let links: RelationshipLinkInMemoryRepository;
  let service: RelationshipService;
  let definition: IRelationshipDefinition;

  beforeEach(() => {
    links = new RelationshipLinkInMemoryRepository();
    service = new RelationshipService(links);
    definition = makeDefinition();
  });

  describe('cardinalityOf', () => {
    it('deriva 1:1 quando nenhum lado aceita multiplos', () => {
      const result = service.cardinalityOf(
        { multiple: false },
        { multiple: false },
      );
      expect(result).toBe(E_RELATIONSHIP_CARDINALITY.ONE_TO_ONE);
    });

    it('deriva 1:N quando apenas um lado aceita multiplos', () => {
      expect(
        service.cardinalityOf({ multiple: true }, { multiple: false }),
      ).toBe(E_RELATIONSHIP_CARDINALITY.ONE_TO_MANY);
      expect(
        service.cardinalityOf({ multiple: false }, { multiple: true }),
      ).toBe(E_RELATIONSHIP_CARDINALITY.ONE_TO_MANY);
    });

    it('deriva N:N quando os dois lados aceitam multiplos', () => {
      const result = service.cardinalityOf(
        { multiple: true },
        { multiple: true },
      );
      expect(result).toBe(E_RELATIONSHIP_CARDINALITY.MANY_TO_MANY);
    });
  });

  describe('canLink', () => {
    it('rejeita auto-vinculo trivial (sourceId === targetId)', async () => {
      const result = await service.canLink({
        definition,
        sourceField: { multiple: true },
        targetField: { multiple: true },
        sourceId: 'x',
        targetId: 'x',
      });
      expect(result.isLeft()).toBe(true);
      if (result.isLeft())
        expect(result.value.cause).toBe('RELATIONSHIP_SELF_LINK');
    });

    it('rejeita par duplicado', async () => {
      await links.create({
        relationshipId: 'rel-1',
        sourceId: 'a',
        targetId: 'b',
      });
      const result = await service.canLink({
        definition,
        sourceField: { multiple: true },
        targetField: { multiple: true },
        sourceId: 'a',
        targetId: 'b',
      });
      expect(result.isLeft()).toBe(true);
      if (result.isLeft())
        expect(result.value.cause).toBe('RELATIONSHIP_LINK_DUPLICATE');
    });

    it('rejeita 2o vinculo quando o lado source nao aceita multiplos', async () => {
      await links.create({
        relationshipId: 'rel-1',
        sourceId: 'a',
        targetId: 'b',
      });
      const result = await service.canLink({
        definition,
        sourceField: { multiple: false },
        targetField: { multiple: true },
        sourceId: 'a',
        targetId: 'c',
      });
      expect(result.isLeft()).toBe(true);
      if (result.isLeft())
        expect(result.value.cause).toBe('RELATIONSHIP_SOURCE_LIMIT');
    });

    it('rejeita 2o vinculo quando o lado target nao aceita multiplos', async () => {
      await links.create({
        relationshipId: 'rel-1',
        sourceId: 'a',
        targetId: 'b',
      });
      const result = await service.canLink({
        definition,
        sourceField: { multiple: true },
        targetField: { multiple: false },
        sourceId: 'c',
        targetId: 'b',
      });
      expect(result.isLeft()).toBe(true);
      if (result.isLeft())
        expect(result.value.cause).toBe('RELATIONSHIP_TARGET_LIMIT');
    });

    it('aceita vinculo valido em N:N', async () => {
      const result = await service.canLink({
        definition,
        sourceField: { multiple: true },
        targetField: { multiple: true },
        sourceId: 'a',
        targetId: 'b',
      });
      expect(result.isRight()).toBe(true);
    });
  });

  describe('link / unlink', () => {
    it('cria vinculo apendando order na lista do source', async () => {
      const first = await service.link({
        definition,
        sourceField: { multiple: true },
        targetField: { multiple: true },
        sourceId: 'a',
        targetId: 'b',
      });
      const second = await service.link({
        definition,
        sourceField: { multiple: true },
        targetField: { multiple: true },
        sourceId: 'a',
        targetId: 'c',
      });

      expect(first.isRight()).toBe(true);
      expect(second.isRight()).toBe(true);
      if (first.isRight()) expect(first.value.order).toBe(0);
      if (second.isRight()) expect(second.value.order).toBe(1);
    });

    it('remove vinculo existente', async () => {
      const created = await links.create({
        relationshipId: 'rel-1',
        sourceId: 'a',
        targetId: 'b',
      });
      const result = await service.unlink(created._id);
      expect(result.isRight()).toBe(true);
      expect(await links.findById(created._id)).toBeNull();
    });

    it('retorna erro ao desvincular id inexistente', async () => {
      const result = await service.unlink('missing');
      expect(result.isLeft()).toBe(true);
      if (result.isLeft())
        expect(result.value.cause).toBe('RELATIONSHIP_LINK_NOT_FOUND');
    });
  });

  describe('resolveLinkedIds', () => {
    beforeEach(async () => {
      await links.create({
        relationshipId: 'rel-1',
        sourceId: 'a',
        targetId: 'b',
      });
      await links.create({
        relationshipId: 'rel-1',
        sourceId: 'a',
        targetId: 'c',
      });
      await links.create({
        relationshipId: 'rel-1',
        sourceId: 'd',
        targetId: 'b',
      });
    });

    it('le pelo lado source retornando os targetIds', async () => {
      const ids = await service.resolveLinkedIds(definition, 'a', 'source');
      expect(ids).toEqual(['b', 'c']);
    });

    it('le pelo lado target retornando os sourceIds', async () => {
      const ids = await service.resolveLinkedIds(definition, 'b', 'target');
      expect(ids).toEqual(['a', 'd']);
    });
  });
});
