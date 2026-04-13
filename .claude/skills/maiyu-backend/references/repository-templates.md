# Repository Implementation Templates

## Prisma Implementation

```typescript
import { PrismaClient } from '@prisma/client';
import {
  {Entity}ContractRepository,
  type {Entity}CreatePayload,
  type {Entity}FindByPayload,
  type {Entity}QueryPayload,
  type {Entity}UpdatePayload,
} from './{entity}-contract.repository';

@Service()
export default class {Entity}PrismaRepository implements {Entity}ContractRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(payload: {Entity}CreatePayload): Promise<I{Entity}> {
    return this.prisma.{entity}.create({
      data: {
        ...payload,
        trashed: false,
        trashedAt: null,
      },
      include: this.includeOptions,
    });
  }

  async findBy({ exact, ...payload }: {Entity}FindByPayload): Promise<I{Entity} | null> {
    if (exact) {
      return this.prisma.{entity}.findFirst({
        where: { AND: this.buildConditions(payload) },
        include: this.includeOptions,
      });
    }
    return this.prisma.{entity}.findFirst({
      where: { OR: this.buildConditions(payload) },
      include: this.includeOptions,
    });
  }

  async findMany(payload?: {Entity}QueryPayload): Promise<I{Entity}[]> {
    const where = this.buildWhereClause(payload);

    return this.prisma.{entity}.findMany({
      where,
      include: this.includeOptions,
      orderBy: payload?.sort
        ? Object.entries(payload.sort).map(([key, dir]) => ({ [key]: dir }))
        : [{ name: 'asc' }],
      skip: payload?.page && payload?.perPage
        ? (payload.page - 1) * payload.perPage
        : undefined,
      take: payload?.perPage,
    });
  }

  async update({ _id, ...payload }: {Entity}UpdatePayload): Promise<I{Entity}> {
    return this.prisma.{entity}.update({
      where: { id: _id },
      data: payload,
      include: this.includeOptions,
    });
  }

  async delete(_id: string): Promise<void> {
    await this.prisma.{entity}.update({
      where: { id: _id },
      data: { trashed: true, trashedAt: new Date() },
    });
  }

  async count(payload?: {Entity}QueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return this.prisma.{entity}.count({ where });
  }

  private buildWhereClause(payload?: {Entity}QueryPayload): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (payload?.trashed !== undefined) {
      where.trashed = payload.trashed;
    } else {
      where.trashed = false;
    }

    if (payload?.search) {
      where.OR = [
        { name: { contains: payload.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildConditions(payload: Record<string, unknown>): Record<string, unknown>[] {
    return Object.entries(payload)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => ({ [key]: value }));
  }

  private readonly includeOptions = {};
}
```

## TypeORM Implementation

```typescript
import { Repository, Like, In } from 'typeorm';
import { {Entity}Entity } from '@application/model/{entity}.model';
import {
  {Entity}ContractRepository,
  type {Entity}CreatePayload,
  type {Entity}FindByPayload,
  type {Entity}QueryPayload,
  type {Entity}UpdatePayload,
} from './{entity}-contract.repository';

@Service()
export default class {Entity}TypeORMRepository implements {Entity}ContractRepository {
  constructor(private readonly repository: Repository<{Entity}Entity>) {}

  async create(payload: {Entity}CreatePayload): Promise<I{Entity}> {
    const entity = this.repository.create({
      ...payload,
      trashed: false,
      trashedAt: null,
    });
    return this.repository.save(entity);
  }

  async findBy({ exact, ...payload }: {Entity}FindByPayload): Promise<I{Entity} | null> {
    const conditions = Object.entries(payload)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => ({ [key]: value }));

    if (conditions.length === 0) return null;

    let where: Record<string, unknown> | Record<string, unknown>[];
    if (exact) {
      where = conditions.reduce((acc, c) => ({ ...acc, ...c }), {});
    } else {
      where = conditions;
    }

    const entity = await this.repository.findOne({
      where,
      relations: this.relationOptions,
    });

    return entity ?? null;
  }

  async findMany(payload?: {Entity}QueryPayload): Promise<I{Entity}[]> {
    const where: Record<string, unknown> = {};

    if (payload?.trashed !== undefined) {
      where.trashed = payload.trashed;
    } else {
      where.trashed = false;
    }

    if (payload?.search) {
      where.name = Like(`%${payload.search}%`);
    }

    return this.repository.find({
      where,
      relations: this.relationOptions,
      order: payload?.sort ?? { name: 'ASC' },
      skip: payload?.page && payload?.perPage
        ? (payload.page - 1) * payload.perPage
        : undefined,
      take: payload?.perPage,
    });
  }

  async update({ _id, ...payload }: {Entity}UpdatePayload): Promise<I{Entity}> {
    await this.repository.update(_id, payload);
    const entity = await this.repository.findOneOrFail({
      where: { id: _id },
      relations: this.relationOptions,
    });
    return entity;
  }

  async delete(_id: string): Promise<void> {
    await this.repository.update(_id, {
      trashed: true,
      trashedAt: new Date(),
    });
  }

  async count(payload?: {Entity}QueryPayload): Promise<number> {
    const where: Record<string, unknown> = {};

    if (payload?.trashed !== undefined) {
      where.trashed = payload.trashed;
    } else {
      where.trashed = false;
    }

    if (payload?.search) {
      where.name = Like(`%${payload.search}%`);
    }

    return this.repository.count({ where });
  }

  private readonly relationOptions: string[] = [];
}
```

## Drizzle Implementation

```typescript
import { eq, like, and, or, sql, asc, desc } from 'drizzle-orm';
import { db } from '@config/database.config';
import { {entities} } from '@application/model/{entity}.model';
import {
  {Entity}ContractRepository,
  type {Entity}CreatePayload,
  type {Entity}FindByPayload,
  type {Entity}QueryPayload,
  type {Entity}UpdatePayload,
} from './{entity}-contract.repository';

@Service()
export default class {Entity}DrizzleRepository implements {Entity}ContractRepository {
  async create(payload: {Entity}CreatePayload): Promise<I{Entity}> {
    const [entity] = await db.insert({entities}).values({
      ...payload,
      trashed: false,
      trashedAt: null,
    }).returning();
    return entity;
  }

  async findBy({ exact, ...payload }: {Entity}FindByPayload): Promise<I{Entity} | null> {
    const conditions = [];
    if (payload._id) conditions.push(eq({entities}.id, payload._id));

    if (conditions.length === 0) return null;

    let whereClause;
    if (exact) {
      whereClause = and(...conditions);
    } else {
      whereClause = or(...conditions);
    }
    const [entity] = await db.select().from({entities}).where(whereClause).limit(1);
    return entity ?? null;
  }

  async findMany(payload?: {Entity}QueryPayload): Promise<I{Entity}[]> {
    const conditions = [];

    if (payload?.trashed !== undefined) {
      conditions.push(eq({entities}.trashed, payload.trashed));
    } else {
      conditions.push(eq({entities}.trashed, false));
    }

    if (payload?.search) {
      conditions.push(like({entities}.name, `%${payload.search}%`));
    }

    let query = db.select().from({entities}).where(and(...conditions));

    if (payload?.sort) {
      const [key, direction] = Object.entries(payload.sort)[0];
      const column = {entities}[key as keyof typeof {entities}];
      if (column) {
        if (direction === 'asc') {
          query = query.orderBy(asc(column));
        } else {
          query = query.orderBy(desc(column));
        }
      }
    }

    if (payload?.page && payload?.perPage) {
      const offset = (payload.page - 1) * payload.perPage;
      query = query.offset(offset).limit(payload.perPage);
    }

    return query;
  }

  async update({ _id, ...payload }: {Entity}UpdatePayload): Promise<I{Entity}> {
    const [entity] = await db.update({entities})
      .set({ ...payload, updatedAt: new Date() })
      .where(eq({entities}.id, _id))
      .returning();
    return entity;
  }

  async delete(_id: string): Promise<void> {
    await db.update({entities})
      .set({ trashed: true, trashedAt: new Date() })
      .where(eq({entities}.id, _id));
  }

  async count(payload?: {Entity}QueryPayload): Promise<number> {
    const conditions = [];

    if (payload?.trashed !== undefined) {
      conditions.push(eq({entities}.trashed, payload.trashed));
    } else {
      conditions.push(eq({entities}.trashed, false));
    }

    if (payload?.search) {
      conditions.push(like({entities}.name, `%${payload.search}%`));
    }

    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from({entities})
      .where(and(...conditions));
    return result.count;
  }
}
```

## Mongoose Advanced: Aggregation for Nested Sorting

When sorting by a field in a related collection (e.g., `group.name`):

```typescript
async findMany(payload?: {Entity}QueryPayload): Promise<I{Entity}[]> {
  const where = await this.buildWhereClause(payload);
  const sortOption = payload?.sort ?? { name: 'asc' as const };

  const hasNestedSort = Object.keys(sortOption).some((key) => key.includes('.'));

  if (hasNestedSort) {
    const aggregationSort: Record<string, 1 | -1> = {};
    for (const [key, dir] of Object.entries(sortOption)) {
      if (key.includes('.')) {
        const fieldName = `_${key.replace('.', '_')}`;
        if (dir === 'asc') {
          aggregationSort[fieldName] = 1;
        } else {
          aggregationSort[fieldName] = -1;
        }
      } else {
        if (dir === 'asc') {
          aggregationSort[key] = 1;
        } else {
          aggregationSort[key] = -1;
        }
      }
    }

    const pipeline: Record<string, unknown>[] = [
      { $match: where },
      {
        $lookup: {
          from: 'relatedcollection',
          localField: 'relatedField',
          foreignField: '_id',
          as: '_relatedDoc',
        },
      },
      {
        $addFields: {
          _related_name: { $arrayElemAt: ['$_relatedDoc.name', 0] },
        },
      },
      { $sort: aggregationSort },
      { $skip: skip ?? 0 },
    ];

    if (take) {
      pipeline.push({ $limit: take });
    }

    pipeline.push({ $project: { _relatedDoc: 0, _related_name: 0 } });

    const docs = await Model.aggregate(pipeline);

    const populated = await Model.populate(docs, this.populateOptions);
    return populated.map((doc: Record<string, unknown>) => ({
      ...doc,
      _id: String(doc._id),
    }));
  }

  // Standard query (no nested sort)
  const entities = await Model.find(where)
    .populate(this.populateOptions)
    .sort(sortOption)
    .skip(skip ?? 0)
    .limit(take ?? 0);

  return entities.map((e) => this.transform(e));
}
```
