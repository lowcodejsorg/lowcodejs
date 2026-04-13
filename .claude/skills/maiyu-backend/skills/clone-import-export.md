---
name: maiyu:backend-clone-import-export
description: |
  Generates clone, import, and export endpoints for backend Node.js projects.
  Use when: user asks to clone resource, duplicate, copy structure, import data,
  export data, or mentions "clone", "import", "export" for resource operations.
  Supports: JSON, CSV export/import. Deep clone with relationships.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **ORM**: `mongoose` | `@prisma/client` | `typeorm` | `drizzle-orm` | `knex` | `sequelize`
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **DI**: `fastify-decorators` | `tsyringe` | `inversify` | `@nestjs/common` | `awilix` | manual
   - **Validator**: `zod` | `class-validator` | `joi` | `@sinclair/typebox`
   - **File upload / multipart**: `@fastify/multipart` | `multer` | `busboy` | `formidable`
3. Scan existing use-cases/controllers to detect:
   - Location (e.g., `application/resources/{entity}/{action}/`)
   - Error handling style (Either, neverthrow Result, plain throw)
   - Import patterns and path aliases
4. If multipart library not detected, recommend `@fastify/multipart` (Fastify) or `multer` (Express/NestJS)

## Conventions

### Naming
- File: `clone.use-case.ts`, `export.use-case.ts`, `import.use-case.ts`
- Class: `{Entity}CloneUseCase`, `{Entity}ExportUseCase`, `{Entity}ImportUseCase`
- Controller: `clone.controller.ts`, `export.controller.ts`, `import.controller.ts`
- Validator: `clone.validator.ts`, `export.validator.ts`, `import.validator.ts`
- Schema: `clone.schema.ts`, `export.schema.ts`, `import.schema.ts`

### File Placement
- Feature-based: `resources/{entities}/clone/clone.use-case.ts`
- Feature-based: `resources/{entities}/export/export.use-case.ts`
- Feature-based: `resources/{entities}/import/import.use-case.ts`

### Rules
- Clone copies structure only (no row data) — fields, relationships, groups are duplicated
- Import validates every record before creating — collect errors, do not abort on first failure
- Export streams large datasets — never load entire collection into memory at once
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains
- Either pattern for error handling (default)
- Named exports only (except Fastify decorator controllers which use anonymous default export)

## Templates

### Clone Use Case (Reference — Fastify)

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import type { I{Entity} } from '@application/core/entity.core';
import {
  {Entity}ContractRepository,
} from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = { _id: string };
type Response = Either<HTTPException, I{Entity}>;

@Service()
export default class {Entity}CloneUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const original = await this.{entity}Repository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!original) {
        return left(
          HTTPException.NotFound(
            '{Entity} not found',
            '{ENTITY}_NOT_FOUND',
          ),
        );
      }

      // Deep copy structure — exclude trashed/deleted items
      const fields = await this.{entity}Repository.findRelated(
        'fields',
        payload._id,
      );

      const activeFields = fields.filter((field) => {
        if (field.trashed) {
          return false;
        }
        return true;
      });

      const groups = await this.{entity}Repository.findRelated(
        'groups',
        payload._id,
      );

      const activeGroups = groups.filter((group) => {
        if (group.trashed) {
          return false;
        }
        return true;
      });

      // Generate new slug/name
      const cloneName = `${original.name}-copy`;
      const cloneSlug = `${original.slug}-copy`;

      // Check if slug already exists, append number if needed
      const existingClone = await this.{entity}Repository.findBy({
        slug: cloneSlug,
        exact: true,
      });

      let finalSlug = cloneSlug;
      let finalName = cloneName;

      if (existingClone) {
        const timestamp = Date.now();
        finalSlug = `${original.slug}-copy-${timestamp}`;
        finalName = `${original.name}-copy-${timestamp}`;
      }

      // Build the clone payload
      const clonePayload = {
        name: finalName,
        slug: finalSlug,
        fields: activeFields.map((field) => ({
          ...field,
          _id: undefined,
        })),
        groups: activeGroups.map((group) => ({
          ...group,
          _id: undefined,
        })),
      };

      const created = await this.{entity}Repository.create(clonePayload);

      return right(created);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CLONE_{ENTITY}_ERROR',
        ),
      );
    }
  }
}
```

### Export Use Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import type { I{Entity} } from '@application/core/entity.core';
import {
  {Entity}ContractRepository,
} from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = {
  _id: string;
  format: 'json' | 'csv';
};

type ExportResult = {
  content: string;
  filename: string;
  contentType: string;
};

type Response = Either<HTTPException, ExportResult>;

@Service()
export default class {Entity}ExportUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const entity = await this.{entity}Repository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!entity) {
        return left(
          HTTPException.NotFound(
            '{Entity} not found',
            '{ENTITY}_NOT_FOUND',
          ),
        );
      }

      // Fetch all related data
      const fields = await this.{entity}Repository.findRelated(
        'fields',
        payload._id,
      );

      const rows = await this.{entity}Repository.findRelated(
        'rows',
        payload._id,
      );

      if (payload.format === 'json') {
        const exportData = {
          entity,
          fields,
          rows,
          exportedAt: new Date().toISOString(),
        };

        return right({
          content: JSON.stringify(exportData, null, 2),
          filename: `${entity.slug}-export.json`,
          contentType: 'application/json',
        });
      }

      // CSV export
      const csvContent = this.buildCsv(fields, rows);

      return right({
        content: csvContent,
        filename: `${entity.slug}-export.csv`,
        contentType: 'text/csv',
      });
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'EXPORT_{ENTITY}_ERROR',
        ),
      );
    }
  }

  private buildCsv(
    fields: Array<{ name: string; slug: string }>,
    rows: Array<Record<string, unknown>>,
  ): string {
    // Build header row from field definitions
    const headers = fields.map((field) => field.name);
    const headerLine = headers.map((h) => `"${h}"`).join(',');

    // Build data rows
    const dataLines = rows.map((row) => {
      const values = fields.map((field) => {
        const value = row[field.slug];
        if (value === null || value === undefined) {
          return '""';
        }
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      });
      return values.join(',');
    });

    return [headerLine, ...dataLines].join('\n');
  }
}
```

### Export Use Case — Streaming Variant (Large Datasets)

```typescript
import { Service } from 'fastify-decorators';
import { Readable } from 'node:stream';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import {
  {Entity}ContractRepository,
} from '@application/repositories/{entity}/{entity}-contract.repository';

type Payload = {
  _id: string;
  format: 'json' | 'csv';
};

type StreamExportResult = {
  stream: Readable;
  filename: string;
  contentType: string;
};

type Response = Either<HTTPException, StreamExportResult>;

@Service()
export default class {Entity}ExportStreamUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const entity = await this.{entity}Repository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!entity) {
        return left(
          HTTPException.NotFound(
            '{Entity} not found',
            '{ENTITY}_NOT_FOUND',
          ),
        );
      }

      const fields = await this.{entity}Repository.findRelated(
        'fields',
        payload._id,
      );

      const batchSize = 500;
      let offset = 0;
      let isFirstBatch = true;

      const stream = new Readable({
        async read() {
          try {
            const batch = await {entity}Repository.findRelatedPaginated(
              'rows',
              payload._id,
              { limit: batchSize, offset },
            );

            if (batch.length === 0) {
              if (payload.format === 'json') {
                this.push(']}');
              }
              this.push(null);
              return;
            }

            if (payload.format === 'csv') {
              if (isFirstBatch) {
                const headerLine = fields
                  .map((f) => `"${f.name}"`)
                  .join(',');
                this.push(headerLine + '\n');
              }

              for (const row of batch) {
                const values = fields.map((field) => {
                  const value = row[field.slug];
                  if (value === null || value === undefined) {
                    return '""';
                  }
                  const stringValue = String(value).replace(/"/g, '""');
                  return `"${stringValue}"`;
                });
                this.push(values.join(',') + '\n');
              }
            }

            if (payload.format === 'json') {
              if (isFirstBatch) {
                this.push('{"rows":[');
              }

              for (let i = 0; i < batch.length; i++) {
                if (!isFirstBatch || i > 0) {
                  this.push(',');
                }
                this.push(JSON.stringify(batch[i]));
              }
            }

            isFirstBatch = false;
            offset += batchSize;
          } catch (_error) {
            this.destroy(new Error('Stream read failed'));
          }
        },
      });

      const FORMAT_CONFIG = {
        json: { extension: 'json', contentType: 'application/json' },
        csv: { extension: 'csv', contentType: 'text/csv' },
      } as const;

      const formatConfig = FORMAT_CONFIG[payload.format];
      const extension = formatConfig.extension;
      const contentType = formatConfig.contentType;

      return right({
        stream,
        filename: `${entity.slug}-export.${extension}`,
        contentType,
      });
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'EXPORT_STREAM_{ENTITY}_ERROR',
        ),
      );
    }
  }
}
```

### Import Use Case

```typescript
import { Service } from 'fastify-decorators';
import { type Either, left, right } from '@application/core/either.core';
import { HTTPException } from '@application/core/exception.core';
import type { I{Entity} } from '@application/core/entity.core';
import {
  {Entity}ContractRepository,
} from '@application/repositories/{entity}/{entity}-contract.repository';
import { {Entity}ImportFileValidator } from './import.validator';

type ImportError = {
  line: number;
  message: string;
};

type ImportReport = {
  created: number;
  errors: ImportError[];
};

type Payload = {
  _id: string;
  fileBuffer: Buffer;
  mimetype: string;
};

type Response = Either<HTTPException, ImportReport>;

@Service()
export default class {Entity}ImportUseCase {
  constructor(
    private readonly {entity}Repository: {Entity}ContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const entity = await this.{entity}Repository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!entity) {
        return left(
          HTTPException.NotFound(
            '{Entity} not found',
            '{ENTITY}_NOT_FOUND',
          ),
        );
      }

      // Determine format from mimetype
      const isJson = payload.mimetype === 'application/json';
      const isCsv =
        payload.mimetype === 'text/csv' ||
        payload.mimetype === 'application/vnd.ms-excel';

      if (!isJson && !isCsv) {
        return left(
          HTTPException.BadRequest(
            'Unsupported file format. Use JSON or CSV.',
            'IMPORT_{ENTITY}_INVALID_FORMAT',
          ),
        );
      }

      const fileContent = payload.fileBuffer.toString('utf-8');

      if (isJson) {
        return await this.importJson(fileContent, payload._id);
      }

      return await this.importCsv(fileContent, payload._id);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'IMPORT_{ENTITY}_ERROR',
        ),
      );
    }
  }

  private async importJson(
    content: string,
    entityId: string,
  ): Promise<Either<HTTPException, ImportReport>> {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch (_error) {
      return left(
        HTTPException.BadRequest(
          'Invalid JSON file',
          'IMPORT_{ENTITY}_INVALID_JSON',
        ),
      );
    }

    // Validate structure with Zod
    const validation = {Entity}ImportFileValidator.safeParse(parsed);

    if (!validation.success) {
      return left(
        HTTPException.BadRequest(
          'Invalid file structure',
          'IMPORT_{ENTITY}_INVALID_STRUCTURE',
        ),
      );
    }

    const data = validation.data;
    const errors: ImportError[] = [];
    let created = 0;

    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i];
      const lineNumber = i + 1;

      try {
        await this.{entity}Repository.createRelated(
          'rows',
          entityId,
          row,
        );
        created += 1;
      } catch (error) {
        let message = 'Unknown error';
        if (error instanceof Error) {
          message = error.message;
        }
        errors.push({ line: lineNumber, message });
      }
    }

    return right({ created, errors });
  }

  private async importCsv(
    content: string,
    entityId: string,
  ): Promise<Either<HTTPException, ImportReport>> {
    const lines = content.split('\n').filter((line) => line.trim() !== '');

    if (lines.length < 2) {
      return left(
        HTTPException.BadRequest(
          'CSV file must have a header row and at least one data row',
          'IMPORT_{ENTITY}_EMPTY_CSV',
        ),
      );
    }

    const headers = this.parseCsvLine(lines[0]);
    const errors: ImportError[] = [];
    let created = 0;

    for (let i = 1; i < lines.length; i++) {
      const lineNumber = i + 1;
      const values = this.parseCsvLine(lines[i]);

      if (values.length !== headers.length) {
        errors.push({
          line: lineNumber,
          message: `Expected ${headers.length} columns, got ${values.length}`,
        });
        continue;
      }

      const rowData: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        rowData[headers[j]] = values[j];
      }

      try {
        await this.{entity}Repository.createRelated(
          'rows',
          entityId,
          rowData,
        );
        created += 1;
      } catch (error) {
        let message = 'Unknown error';
        if (error instanceof Error) {
          message = error.message;
        }
        errors.push({ line: lineNumber, message });
      }
    }

    return right({ created, errors });
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }

    result.push(current.trim());
    return result;
  }
}
```

### Import Validator

```typescript
import { z } from 'zod';

export const {Entity}ImportFileValidator = z.object({
  rows: z.array(z.record(z.string(), z.unknown())),
});

export const {Entity}ImportParamsValidator = z.object({
  _id: z.string().min(1, '_id is required'),
});

export type {Entity}ImportFilePayload = z.infer<typeof {Entity}ImportFileValidator>;
```

### Clone Controller (Fastify)

```typescript
import { Controller, POST } from 'fastify-decorators';
import { getInstanceByToken } from 'fastify-decorators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { {Entity}CloneParamsValidator } from './clone.validator';
import { {Entity}CloneSchema } from './clone.schema';
import {Entity}CloneUseCase from './clone.use-case';

@Controller()
export default class {
  constructor(
    private readonly useCase: {Entity}CloneUseCase = getInstanceByToken(
      {Entity}CloneUseCase,
    ),
  ) {}

  @POST({
    url: '/{entities}/:_id/clone',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
      ],
      schema: {Entity}CloneSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = {Entity}CloneParamsValidator.parse(request.params);

    const result = await this.useCase.execute(params);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(201).send(result.value);
  }
}
```

### Export Controller (Fastify)

```typescript
import { Controller, GET } from 'fastify-decorators';
import { getInstanceByToken } from 'fastify-decorators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { {Entity}ExportParamsValidator, {Entity}ExportQueryValidator } from './export.validator';
import { {Entity}ExportSchema } from './export.schema';
import {Entity}ExportUseCase from './export.use-case';

@Controller()
export default class {
  constructor(
    private readonly useCase: {Entity}ExportUseCase = getInstanceByToken(
      {Entity}ExportUseCase,
    ),
  ) {}

  @GET({
    url: '/{entities}/:_id/export',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
      ],
      schema: {Entity}ExportSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = {Entity}ExportParamsValidator.parse(request.params);
    const query = {Entity}ExportQueryValidator.parse(request.query);

    const result = await this.useCase.execute({
      _id: params._id,
      format: query.format,
    });

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    const exportData = result.value;

    return response
      .header('Content-Disposition', `attachment; filename="${exportData.filename}"`)
      .header('Content-Type', exportData.contentType)
      .status(200)
      .send(exportData.content);
  }
}
```

### Export Controller — Streaming Variant (Fastify)

```typescript
import { Controller, GET } from 'fastify-decorators';
import { getInstanceByToken } from 'fastify-decorators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { {Entity}ExportParamsValidator, {Entity}ExportQueryValidator } from './export.validator';
import { {Entity}ExportSchema } from './export.schema';
import {Entity}ExportStreamUseCase from './export.use-case';

@Controller()
export default class {
  constructor(
    private readonly useCase: {Entity}ExportStreamUseCase = getInstanceByToken(
      {Entity}ExportStreamUseCase,
    ),
  ) {}

  @GET({
    url: '/{entities}/:_id/export',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
      ],
      schema: {Entity}ExportSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = {Entity}ExportParamsValidator.parse(request.params);
    const query = {Entity}ExportQueryValidator.parse(request.query);

    const result = await this.useCase.execute({
      _id: params._id,
      format: query.format,
    });

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    const exportData = result.value;

    return response
      .header('Content-Disposition', `attachment; filename="${exportData.filename}"`)
      .header('Content-Type', exportData.contentType)
      .status(200)
      .send(exportData.stream);
  }
}
```

### Import Controller (Fastify)

```typescript
import { Controller, POST } from 'fastify-decorators';
import { getInstanceByToken } from 'fastify-decorators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { {Entity}ImportParamsValidator } from './import.validator';
import { {Entity}ImportSchema } from './import.schema';
import {Entity}ImportUseCase from './import.use-case';

@Controller()
export default class {
  constructor(
    private readonly useCase: {Entity}ImportUseCase = getInstanceByToken(
      {Entity}ImportUseCase,
    ),
  ) {}

  @POST({
    url: '/{entities}/:_id/import',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
      ],
      schema: {Entity}ImportSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = {Entity}ImportParamsValidator.parse(request.params);

    const file = await request.file();

    if (!file) {
      return response.status(400).send({
        message: 'File is required',
        code: 400,
        cause: 'IMPORT_{ENTITY}_NO_FILE',
      });
    }

    const fileBuffer = await file.toBuffer();

    const result = await this.useCase.execute({
      _id: params._id,
      fileBuffer,
      mimetype: file.mimetype,
    });

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result.value);
  }
}
```

### Express Alternative

#### Clone Controller (Express)

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';

const router = Router();

router.post(
  '/{entities}/:_id/clone',
  authMiddleware,
  async (req: Request, res: Response) => {
    const params = {Entity}CloneParamsValidator.parse(req.params);

    const result = await cloneUseCase.execute(params);

    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.code).json({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return res.status(201).json(result.value);
  },
);

export default router;
```

#### Export Controller (Express)

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';

const router = Router();

router.get(
  '/{entities}/:_id/export',
  authMiddleware,
  async (req: Request, res: Response) => {
    const params = {Entity}ExportParamsValidator.parse(req.params);
    const query = {Entity}ExportQueryValidator.parse(req.query);

    const result = await exportUseCase.execute({
      _id: params._id,
      format: query.format,
    });

    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.code).json({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    const exportData = result.value;

    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.setHeader('Content-Type', exportData.contentType);
    return res.status(200).send(exportData.content);
  },
);

export default router;
```

#### Import Controller (Express with Multer)

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '@middlewares/auth.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter(_req, file, cb) {
    const allowedMimes = [
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Use JSON or CSV.'));
    }
  },
});

const router = Router();

router.post(
  '/{entities}/:_id/import',
  authMiddleware,
  upload.single('file'),
  async (req: Request, res: Response) => {
    const params = {Entity}ImportParamsValidator.parse(req.params);

    if (!req.file) {
      return res.status(400).json({
        message: 'File is required',
        code: 400,
        cause: 'IMPORT_{ENTITY}_NO_FILE',
      });
    }

    const result = await importUseCase.execute({
      _id: params._id,
      fileBuffer: req.file.buffer,
      mimetype: req.file.mimetype,
    });

    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.code).json({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return res.status(200).json(result.value);
  },
);

export default router;
```

### NestJS Alternative

```typescript
import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@guards/auth.guard';

@Controller('{entities}')
@UseGuards(AuthGuard)
export class {Entity}CloneImportExportController {
  constructor(
    private readonly cloneUseCase: {Entity}CloneUseCase,
    private readonly exportUseCase: {Entity}ExportUseCase,
    private readonly importUseCase: {Entity}ImportUseCase,
  ) {}

  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  async clone(@Param('id') id: string) {
    const result = await this.cloneUseCase.execute({ _id: id });

    if (result.isLeft()) {
      const error = result.value;
      throw error;
    }

    return result.value;
  }

  @Get(':id/export')
  async export(
    @Param('id') id: string,
    @Query('format') format: 'json' | 'csv',
    @Res() res: Response,
  ) {
    const result = await this.exportUseCase.execute({ _id: id, format });

    if (result.isLeft()) {
      const error = result.value;
      throw error;
    }

    const exportData = result.value;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exportData.filename}"`,
    );
    res.setHeader('Content-Type', exportData.contentType);
    res.status(HttpStatus.OK).send(exportData.content);
  }

  @Post(':id/import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async import(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.importUseCase.execute({
      _id: id,
      fileBuffer: file.buffer,
      mimetype: file.mimetype,
    });

    if (result.isLeft()) {
      const error = result.value;
      throw error;
    }

    return result.value;
  }
}
```

## Generated Structure

For each entity, this skill generates files under:

```
application/resources/{entities}/
├── clone/
│   ├── clone.validator.ts
│   ├── clone.schema.ts
│   ├── clone.controller.ts
│   └── clone.use-case.ts
├── export/
│   ├── export.validator.ts
│   ├── export.schema.ts
│   ├── export.controller.ts
│   └── export.use-case.ts
└── import/
    ├── import.validator.ts
    ├── import.schema.ts
    ├── import.controller.ts
    └── import.use-case.ts
```

## Checklist

After generation, verify:

1. All code is proper TypeScript with correct type annotations
2. No ternary operators anywhere — only if/else
3. Named exports only (except Fastify decorator controllers which use anonymous default export)
4. Either pattern used for error handling (left for errors, right for success)
5. Outer try/catch wraps entire execute() returning InternalServerError on unexpected errors
6. Clone excludes trashed/deleted items from the copy
7. Clone generates unique slug/name (appends "-copy" or "-copy-{timestamp}")
8. Export sets Content-Disposition header for file download
9. Export supports both JSON and CSV formats
10. Export uses streaming for large datasets (streaming variant)
11. Import accepts multipart file upload (JSON or CSV)
12. Import validates file format/schema with Zod before processing
13. Import returns a report: `{ created: number, errors: Array<{ line: number, message: string }> }`
14. Import does not abort on first error — collects all errors and continues
15. Import path aliases use project conventions (`@application/`, `@start/`, etc.)
16. Multipart library detected or recommended (`@fastify/multipart`, `multer`)
17. DI decorator matches project convention (`@Service()`, `@Injectable()`, etc.)
