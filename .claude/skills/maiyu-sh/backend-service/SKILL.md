---
name: backend-service
description: |
  Generates service pattern code (contract + implementation + in-memory) for backend Node.js projects.
  Use when: user asks to create services, external integrations, business services,
  email service, storage service, payment service, or mentions "service" for non-CRUD logic.
  Supports: fastify-decorators, tsyringe, inversify, NestJS, awilix, manual DI.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **DI**: `fastify-decorators` | `tsyringe` | `inversify` | `@nestjs/common` | `awilix` | manual
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
- No ternary operators — use if/else
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
