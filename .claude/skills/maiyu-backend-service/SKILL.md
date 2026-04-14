---
name: maiyu:backend-service
description: |
  Generates service pattern code (contract + implementation + in-memory) for backend Node.js projects.
  Use when: user asks to create services, external integrations, business services,
  email service, storage service, payment service, or mentions "service" for non-CRUD logic.
  Supports: fastify-decorators, tsyringe, inversify, NestJS, awilix, AdonisJS v6/v7, manual DI.
  Frameworks: Fastify, Express, NestJS, AdonisJS v6/v7, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **DI**: `fastify-decorators` | `tsyringe` | `inversify` | `@nestjs/common` | `@adonisjs/core` | `awilix` | manual
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
3. Scan existing services to detect:
   - Service directory location (e.g., `application/services/`)
   - DI registry location
   - Naming patterns
4. If DI not detected, ask user:
   ```
   Which dependency injection approach does your project use?
   1. fastify-decorators (@Service)
   2. tsyringe (@injectable)
   3. inversify (@injectable)
   4. NestJS (@Injectable)
   5. awilix
   6. Manual (no DI container)
   ```

## Conventions

### Naming
- Contract: `{service}-contract.service.ts` (e.g., `email-contract.service.ts`)
- Implementation: `{provider}-{service}.service.ts` (e.g., `nodemailer-email.service.ts`)
- In-Memory: `in-memory-{service}.service.ts`
- Contract class: `{Service}ContractService` (abstract class)
- Implementation class: `{Provider}{Service}Service`
- In-Memory class: `InMemory{Service}Service`

### File Placement
- Directory: `application/services/{service}/` or detected location
- 3 files per service: contract + implementation + in-memory

### Rules
- Use `abstract class` for contracts (required for runtime DI, not `interface`)
- Define input/output interfaces in the contract file
- Implementation gets DI decorator (`@Service()`, `@Injectable()`, etc.)
- After creating, register in DI registry
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains
- In-memory implementation for testing

## Templates

### Contract

```typescript
export interface {Service}Input {
  // Input fields for the service operation
}

export interface {Service}Result {
  success: boolean;
  message: string;
  data?: unknown;
}

export abstract class {Service}ContractService {
  abstract execute(input: {Service}Input): Promise<{Service}Result>;
}
```

### Implementation (fastify-decorators)

```typescript
import { Service } from 'fastify-decorators';
import {
  {Service}ContractService,
  type {Service}Input,
  type {Service}Result,
} from './{service}-contract.service';

@Service()
export default class {Provider}{Service}Service extends {Service}ContractService {
  constructor() {
    super();
    this.setup();
  }

  private setup(): void {
    // Initialize provider client/connection
  }

  async execute(input: {Service}Input): Promise<{Service}Result> {
    try {
      // Provider-specific logic
      return {
        success: true,
        message: 'Operation completed successfully',
      };
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('Service error:', error);
      return {
        success: false,
        message: `Operation failed: ${errorMessage}`,
      };
    }
  }
}
```

### Implementation (NestJS)

```typescript
import { Injectable } from '@nestjs/common';
import {
  {Service}ContractService,
  type {Service}Input,
  type {Service}Result,
} from './{service}-contract.service';

@Injectable()
export class {Provider}{Service}Service extends {Service}ContractService {
  async execute(input: {Service}Input): Promise<{Service}Result> {
    try {
      return {
        success: true,
        message: 'Operation completed successfully',
      };
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        success: false,
        message: `Operation failed: ${errorMessage}`,
      };
    }
  }
}
```

### Implementation (tsyringe)

```typescript
import { injectable } from 'tsyringe';
import {
  {Service}ContractService,
  type {Service}Input,
  type {Service}Result,
} from './{service}-contract.service';

@injectable()
export class {Provider}{Service}Service extends {Service}ContractService {
  async execute(input: {Service}Input): Promise<{Service}Result> {
    try {
      return {
        success: true,
        message: 'Operation completed successfully',
      };
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        success: false,
        message: `Operation failed: ${errorMessage}`,
      };
    }
  }
}
```

### In-Memory Implementation

```typescript
import {
  {Service}ContractService,
  type {Service}Input,
  type {Service}Result,
} from './{service}-contract.service';

export default class InMemory{Service}Service extends {Service}ContractService {
  private calls: { input: {Service}Input; result: {Service}Result }[] = [];

  async execute(input: {Service}Input): Promise<{Service}Result> {
    const result: {Service}Result = {
      success: true,
      message: 'Operation completed successfully (in-memory)',
    };
    this.calls.push({ input, result });
    return result;
  }

  /** Test helper: get all recorded calls */
  getCalls(): { input: {Service}Input; result: {Service}Result }[] {
    return this.calls;
  }

  /** Test helper: reset recorded calls */
  reset(): void {
    this.calls = [];
  }
}
```

### DI Registration

After creating the service, register it:

**fastify-decorators:**
```typescript
injectablesHolder.injectService({Service}ContractService, {Provider}{Service}Service);
```

**NestJS:**
```typescript
@Module({
  providers: [
    { provide: {Service}ContractService, useClass: {Provider}{Service}Service },
  ],
  exports: [{Service}ContractService],
})
```

### AdonisJS v6/v7 (IoC Container)

**Contract:**
```typescript
// app/services/{name}_contract.ts
export abstract class {Name}ContractService {
  abstract execute(input: {Name}Input): Promise<{Name}Output>
}
```

**Implementation:**
```typescript
// app/services/{name}_service.ts
import { inject } from '@adonisjs/core'
import { {Name}ContractService } from './{name}_contract.js'

@inject()
export default class {Name}Service extends {Name}ContractService {
  async execute(input: {Name}Input): Promise<{Name}Output> {
    // implementation
  }
}
```

**DI Registration (AdonisJS v6/v7):**
```typescript
// providers/app_provider.ts
import type { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  async register() {
    const { default: {Name}Service } = await import('#services/{name}_service')
    this.app.container.singleton({Name}ContractService, () => new {Name}Service())
  }
}
```

**In-Memory (Testing):**
```typescript
// tests/mocks/{name}_in_memory.ts
import { {Name}ContractService } from '#services/{name}_contract'

export class InMemory{Name}Service extends {Name}ContractService {
  private calls: {Name}Input[] = []

  async execute(input: {Name}Input): Promise<{Name}Output> {
    this.calls.push(input)
    return { /* mock result */ }
  }

  getCalls(): {Name}Input[] { return this.calls }
  reset(): void { this.calls = [] }
}
```

## Examples

### Email Service (Reference)

```typescript
// email-contract.service.ts
export interface EmailOptions {
  to: string[];
  subject: string;
  body: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
  testUrl?: string | boolean;
}

export abstract class EmailContractService {
  abstract sendEmail(options: EmailOptions): Promise<EmailResult>;
  abstract buildTemplate(payload: {
    template: string;
    data: Record<string, unknown>;
  }): Promise<string>;
}

// nodemailer-email.service.ts
@Service()
export default class NodemailerEmailService extends EmailContractService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    super();
    this.setupTransporter();
  }

  private setupTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport(config);
    } catch (error) {
      console.error('Error configuring email transporter:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.transporter) {
      return { success: false, message: 'Email transporter not configured' };
    }

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmails = options.to.filter((email) => emailRegex.test(email));

      if (validEmails.length === 0) {
        return { success: false, message: 'No valid email provided' };
      }

      const result = await this.transporter.sendMail({
        from: options.from,
        to: validEmails.join(', '),
        subject: options.subject,
        html: options.body,
        text: options.body.replace(/<[^>]*>/g, ''),
      });

      let testUrl: string | boolean | undefined;
      if (process.env.NODE_ENV !== 'production') {
        const url = nodemailer.getTestMessageUrl(result);
        if (url) {
          testUrl = url;
        }
      }

      return { success: true, message: 'Email sent successfully', testUrl };
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('Error sending email:', error);
      return { success: false, message: `Error sending email: ${errorMessage}` };
    }
  }

  async buildTemplate(payload: {
    template: string;
    data: Record<string, unknown>;
  }): Promise<string> {
    const file = join(process.cwd(), 'templates', 'email', payload.template.concat('.ejs'));
    return await renderFile(file, payload.data);
  }
}

// in-memory-email.service.ts
export default class InMemoryEmailService extends EmailContractService {
  private sentEmails: { options: EmailOptions; result: EmailResult }[] = [];

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const result: EmailResult = {
      success: true,
      message: 'Email sent successfully (in-memory)',
    };
    this.sentEmails.push({ options, result });
    return result;
  }

  async buildTemplate(payload: {
    template: string;
    data: Record<string, unknown>;
  }): Promise<string> {
    return `<html><body>Template: ${payload.template}</body></html>`;
  }

  getSentEmails(): { options: EmailOptions; result: EmailResult }[] {
    return this.sentEmails;
  }

  reset(): void {
    this.sentEmails = [];
  }
}
```

### Storage Service

```typescript
// storage-contract.service.ts
export interface StorageResult {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export abstract class StorageServiceContract {
  abstract upload(
    file: { buffer: Buffer; mimetype: string; filename: string },
    options?: { staticName?: string; resize?: { width: number; height: number } },
  ): Promise<StorageResult>;
  abstract delete(filename: string): Promise<void>;
  abstract exists(filename: string): Promise<boolean>;
  abstract getUrl(filename: string): string;
}
```

```typescript
// local-storage.service.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import { StorageServiceContract, type StorageResult } from './storage-contract.service';

export class LocalStorageService extends StorageServiceContract {
  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor(basePath: string, baseUrl: string) {
    super();
    this.basePath = basePath;
    this.baseUrl = baseUrl;
  }

  async upload(
    file: { buffer: Buffer; mimetype: string; filename: string },
    options?: { staticName?: string; resize?: { width: number; height: number } },
  ): Promise<StorageResult> {
    await fs.mkdir(this.basePath, { recursive: true });

    const ext = path.extname(file.filename);
    const name = options?.staticName ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const filename = `${name}${ext}`;
    const filePath = path.join(this.basePath, filename);

    let buffer = file.buffer;

    // Optional image processing
    if (options?.resize && file.mimetype.startsWith('image/')) {
      buffer = await sharp(buffer)
        .resize(options.resize.width, options.resize.height, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    }

    await fs.writeFile(filePath, buffer);

    return {
      filename,
      url: this.getUrl(filename),
      size: buffer.length,
      mimeType: file.mimetype,
    };
  }

  async delete(filename: string): Promise<void> {
    const filePath = path.join(this.basePath, filename);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist
    }
  }

  async exists(filename: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.basePath, filename));
      return true;
    } catch {
      return false;
    }
  }

  getUrl(filename: string): string {
    return `${this.baseUrl}/storage/${filename}`;
  }
}
```

```typescript
// s3-storage.service.ts — using Flydrive or AWS SDK
import { StorageServiceContract, type StorageResult } from './storage-contract.service';

export class S3StorageService extends StorageServiceContract {
  private readonly bucket: string;
  private readonly region: string;

  constructor(bucket: string, region: string) {
    super();
    this.bucket = bucket;
    this.region = region;
  }

  async upload(
    file: { buffer: Buffer; mimetype: string; filename: string },
    options?: { staticName?: string },
  ): Promise<StorageResult> {
    const key = options?.staticName ?? `${Date.now()}-${file.filename}`;

    // Using Flydrive or AWS SDK
    // await storage.put(key, file.buffer, { contentType: file.mimetype });

    return {
      filename: key,
      url: this.getUrl(key),
      size: file.buffer.length,
      mimeType: file.mimetype,
    };
  }

  async delete(filename: string): Promise<void> {
    // await storage.delete(filename);
  }

  async exists(filename: string): Promise<boolean> {
    // return await storage.exists(filename);
    return false;
  }

  getUrl(filename: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filename}`;
  }
}
```

### Notification Service

```typescript
// notification-contract.service.ts
export interface NotificationPayload {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
}

export abstract class NotificationServiceContract {
  abstract send(payload: NotificationPayload): Promise<NotificationResult>;
  abstract renderTemplate(template: string, data: Record<string, unknown>): Promise<string>;
}
```

```typescript
// email-notification.service.ts
import ejs from 'ejs';
import path from 'node:path';
import nodemailer from 'nodemailer';

import { NotificationServiceContract, type NotificationPayload, type NotificationResult } from './notification-contract.service';

export class EmailNotificationService extends NotificationServiceContract {
  private transporter: nodemailer.Transporter;
  private templateDir: string;

  constructor(smtpConfig: nodemailer.TransportOptions, templateDir: string) {
    super();
    this.transporter = nodemailer.createTransport(smtpConfig);
    this.templateDir = templateDir;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const html = await this.renderTemplate(payload.template, payload.data);
      const result = await this.transporter.sendMail({
        to: payload.to,
        subject: payload.subject,
        html,
      });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false };
    }
  }

  async renderTemplate(template: string, data: Record<string, unknown>): Promise<string> {
    const templatePath = path.join(this.templateDir, `${template}.ejs`);
    return ejs.renderFile(templatePath, data);
  }
}
```
