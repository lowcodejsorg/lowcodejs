import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { IRow, ITable } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';

import TableRowShowBySlugUseCase from './show-by-slug.use-case';

describe('TableRowShowBySlugUseCase', () => {
  let useCase: TableRowShowBySlugUseCase;
  let tableRepository: any;
  let rowRepository: any;
  let rowPasswordService: any;
  let rowContextBuilder: any;

  beforeEach(() => {
    tableRepository = {
      findBySlug: vi.fn(),
    };
    rowRepository = {
      findOne: vi.fn(),
    };
    rowPasswordService = {
      mask: vi.fn(),
    };
    rowContextBuilder = {
      transform: vi.fn((row) => row),
    };

    useCase = new TableRowShowBySlugUseCase(
      tableRepository,
      rowRepository,
      rowPasswordService,
      rowContextBuilder,
    );
  });

  it('should return TABLE_NOT_FOUND when table does not exist', async () => {
    tableRepository.findBySlug.mockResolvedValue(null);

    const result = await useCase.execute({
      slug: 'nonexistent',
      rowSlug: 'test-slug',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(HTTPException);
    expect(result.value.cause).toBe('TABLE_NOT_FOUND');
  });

  it('should return TABLE_SLUG_FIELD_NOT_CONFIGURED when slugFieldId is not set', async () => {
    const table = {
      slug: 'test',
      slugFieldId: null,
      fields: [],
    } as unknown as ITable;

    tableRepository.findBySlug.mockResolvedValue(table);

    const result = await useCase.execute({
      slug: 'test',
      rowSlug: 'test-slug',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value.cause).toBe('TABLE_SLUG_FIELD_NOT_CONFIGURED');
  });

  it('should return ROW_NOT_FOUND when row does not exist', async () => {
    const table = {
      slug: 'test',
      slugFieldId: 'field-123',
      fields: [{ _id: 'field-123', slug: 'name' }],
    } as any as ITable;

    tableRepository.findBySlug.mockResolvedValue(table);
    rowRepository.findOne.mockResolvedValue(null);

    const result = await useCase.execute({
      slug: 'test',
      rowSlug: 'test-slug',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value.cause).toBe('ROW_NOT_FOUND');
  });

  it('should return row when found by slug', async () => {
    const table = {
      slug: 'test',
      slugFieldId: 'field-123',
      fields: [{ _id: 'field-123', slug: 'name' }],
    } as any as ITable;

    const row = { _id: 'row-123', name: 'test-slug' } as unknown as IRow;

    tableRepository.findBySlug.mockResolvedValue(table);
    rowRepository.findOne.mockResolvedValue(row);

    const result = await useCase.execute({
      slug: 'test',
      rowSlug: 'test-slug',
      user: 'user-123',
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual(row);
    expect(rowRepository.findOne).toHaveBeenCalledWith({
      table,
      query: { name: 'test-slug' },
    });
  });
});
