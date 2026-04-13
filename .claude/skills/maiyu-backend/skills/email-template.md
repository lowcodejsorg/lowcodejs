---
name: maiyu:backend-email-template
description: |
  Generates email service abstractions with EJS templates for backend projects.
  Use when: user asks to create email sending, email templates, transactional email,
  or mentions "email", "mail", "nodemailer", "SMTP" for email functionality.
  Supports: Nodemailer, EJS templates, service abstraction with DI.
  Frameworks: Fastify, Express, NestJS, AdonisJS.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating, detect:

1. From `dependencies`: `nodemailer` | `@nestjs-modules/mailer` | `@sendgrid/mail` | `resend`
2. Check for existing email service: `services/email/`
3. Check for EJS templates: `templates/email/`
4. Detect env vars: `EMAIL_PROVIDER_HOST`, `SMTP_HOST`, etc.

## Conventions

### Rules
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains

## Components

| Component | File | Purpose |
|-----------|------|---------|
| Contract | `services/email/email-contract.service.ts` | Interface for DI |
| Nodemailer impl | `services/email/nodemailer-email.service.ts` | Real email sending |
| InMemory impl | `services/email/in-memory-email.service.ts` | Test double |
| Config | `config/email.config.ts` | SMTP configuration |
| Templates | `templates/email/*.ejs` | EJS HTML templates |

## Templates

### Email Contract (Interface)

```typescript
// services/email/email-contract.service.ts

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface BuildTemplateOptions {
  template: string;
  data: Record<string, unknown>;
}

export abstract class EmailContractService {
  abstract sendEmail(options: EmailOptions): Promise<void>;
  abstract buildTemplate(options: BuildTemplateOptions): Promise<string>;
}
```

### Nodemailer Implementation

```typescript
// services/email/nodemailer-email.service.ts
import { Service } from 'fastify-decorators';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'node:path';

import { NodemailerEmailProviderConfig } from '@config/email.config';
import { Env } from '@start/env';
import { EmailContractService } from './email-contract.service';
import type { EmailOptions, BuildTemplateOptions } from './email-contract.service';

@Service()
export default class NodemailerEmailService extends EmailContractService {
  private transporter = nodemailer.createTransport(NodemailerEmailProviderConfig);

  async sendEmail(options: EmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: `"${Env.APP_NAME ?? 'App'}" <${Env.EMAIL_PROVIDER_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  async buildTemplate(options: BuildTemplateOptions): Promise<string> {
    const templatePath = path.resolve(
      process.cwd(),
      'templates',
      'email',
      `${options.template}.ejs`,
    );

    return ejs.renderFile(templatePath, {
      ...options.data,
      year: new Date().getFullYear(),
      appName: Env.APP_NAME ?? 'App',
      appUrl: Env.APP_CLIENT_URL,
      logoUrl: Env.LOGO_SMALL_URL,
    });
  }
}
```

### InMemory Implementation (for tests)

```typescript
// services/email/in-memory-email.service.ts
import { Service } from 'fastify-decorators';

import { EmailContractService } from './email-contract.service';
import type { EmailOptions, BuildTemplateOptions } from './email-contract.service';

@Service()
export default class InMemoryEmailService extends EmailContractService {
  public sentEmails: Array<EmailOptions> = [];

  async sendEmail(options: EmailOptions): Promise<void> {
    this.sentEmails.push(options);
  }

  async buildTemplate(options: BuildTemplateOptions): Promise<string> {
    return `<html><body>Template: ${options.template}, Data: ${JSON.stringify(options.data)}</body></html>`;
  }
}
```

### Email Config

```typescript
// config/email.config.ts
import { Env } from '@start/env';

export const NodemailerEmailProviderConfig = {
  host: Env.EMAIL_PROVIDER_HOST,
  port: Env.EMAIL_PROVIDER_PORT,
  secure: Env.EMAIL_PROVIDER_PORT === 465,
  requireTLS: true,
  auth: {
    user: Env.EMAIL_PROVIDER_USER,
    pass: Env.EMAIL_PROVIDER_PASSWORD,
  },
};
```

### EJS Template — Notification

```html
<!-- templates/email/notification.ejs -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="background:#6366f1;padding:24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:20px;"><%= title %></h1>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px 24px;">
        <p style="color:#374151;font-size:15px;line-height:1.6;"><%= message %></p>
        <% if (typeof data !== 'undefined' && data) { %>
          <table style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin:16px 0;">
            <% for (const [key, value] of Object.entries(data)) { %>
              <tr>
                <td style="padding:8px 12px;color:#6b7280;font-size:13px;"><%= key %></td>
                <td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:600;"><%= value %></td>
              </tr>
            <% } %>
          </table>
        <% } %>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;">&copy; <%= year %> <%= appName %></p>
      </td>
    </tr>
  </table>
</body>
</html>
```

### EJS Template — Welcome

```html
<!-- templates/email/sign-up.ejs -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="background:#6366f1;padding:24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;">Welcome!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px;">
        <p style="color:#374151;font-size:15px;">Hello <strong><%= name %></strong>,</p>
        <p style="color:#374151;font-size:15px;">Your account has been created.</p>
        <a href="<%= appUrl %>" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;margin:16px 0;">
          Get Started
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;">&copy; <%= year %> <%= appName %></p>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Usage in Use Cases

```typescript
const html = await this.emailService.buildTemplate({
  template: 'sign-up',
  data: { name: user.name },
});

await this.emailService.sendEmail({
  to: user.email,
  subject: 'Welcome!',
  html,
});
```

## Checklist

- [ ] Abstract contract class for DI
- [ ] Nodemailer implementation with transporter
- [ ] InMemory implementation for tests
- [ ] Email config from env vars
- [ ] EJS templates (responsive, table-based)
- [ ] Year and app name injected in all templates
- [ ] Usage pattern in use-cases
