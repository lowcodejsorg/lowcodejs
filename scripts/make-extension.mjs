#!/usr/bin/env node
/**
 * make:extension — gerador de boilerplate de extensões do LowCodeJS.
 *
 * Cria a estrutura de uma extensão (PLUGIN | MODULE | TOOL) nos dois lados do
 * monorepo (backend canônico + frontend UI), seguindo as convenções da skill
 * `lowcodejs-extension` e do loader (`backend/application/core/extensions`).
 *
 * Uso:
 *   npm run make:extension                       # modo interativo
 *   npm run make:extension -- --type plugin --id hello-table
 *   npm run make:extension -- --type tool --pkg core --id merge-tables --with-backend
 *
 * Flags:
 *   --type <plugin|module|tool>   tipo da extensão
 *   --pkg <slug>                  pacote (default: core)
 *   --id <slug>                   id da extensão (= nome da pasta)
 *   --name "<Nome>"               label humano (default: derivado do id)
 *   --description "<texto>"       descrição
 *   --icon <NomeLucide>           ícone lucide-react (ex: SparklesIcon)
 *   --author "<nome>"             autor (default: LowcodeJS)
 *   --slots a,b                   PLUGIN: slots (default: table.actions)
 *   --submenu <grupo>             TOOL: grupo no submenu Ferramentas
 *   --roles MASTER,ADMINISTRATOR  permissions.view (MODULE/TOOL)
 *   --with-backend                gera controller/use-case/validator/schema
 *   --no-backend                  não gera backend (mesmo em TOOL)
 *   --force                       sobrescreve arquivos existentes
 *   --yes                         não faz perguntas (usa flags + defaults)
 */

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { argv, exit, stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SLUG_REGEX = /^[a-z0-9][a-z0-9-_]*$/;
const VALID_ROLES = ['MASTER', 'ADMINISTRATOR', 'MANAGER', 'REGISTERED'];

const TYPES = {
  plugin: { folder: 'plugins', enum: 'PLUGIN' },
  module: { folder: 'modules', enum: 'MODULE' },
  tool: { folder: 'tools', enum: 'TOOL' },
};

// Slots já instalados no core (renderizam de fato). Ver a skill §3.
const INSTALLED_SLOTS = ['table.actions', 'table.filters', 'table.row.actions'];
// Slots reservados — declarados no catálogo mas ainda sem <ExtensionSlot> no JSX.
const RESERVED_SLOTS = [
  'tables-page.actions',
  'tables-page.row.actions',
  'table.bulk-actions',
  'app.header.right',
  'app.dashboard.widgets',
];

// ── helpers ──────────────────────────────────────────────────────────────

function parseArgs(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq !== -1) {
      flags[a.slice(2, eq)] = a.slice(eq + 1);
    } else {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next === undefined || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    }
  }
  return flags;
}

const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

function fail(msg) {
  console.error(c.red(`\n✖ ${msg}\n`));
  exit(1);
}

function toPascalCase(slug) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function toTitleCase(slug) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function toConstantCase(slug) {
  return slug.replace(/[-\s]/g, '_').toUpperCase();
}

/** String literal com aspas simples (estilo do projeto via Prettier). */
function singleQuote(str) {
  return `'${String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Monta uma tabela markdown com colunas alinhadas (estilo Prettier). */
function mdTable(headers, rows) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i]).length), 3),
  );
  const fmt = (cells) =>
    '| ' + cells.map((cell, i) => String(cell).padEnd(widths[i])).join(' | ') + ' |';
  const sep = '| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |';
  return [fmt(headers), sep, ...rows.map(fmt)].join('\n');
}

/** Colapsa arrays de strings curtas em uma linha, como o Prettier faz. */
function inlineStringArrays(json) {
  return json.replace(/\[\n\s*((?:"[^"]*",?\s*\n?\s*)+)\]/g, (_m, inner) => {
    const items = inner.match(/"[^"]*"/g) || [];
    return `[${items.join(', ')}]`;
  });
}

// ── template: manifest.json ──────────────────────────────────────────────

function manifestJson(cfg) {
  const m = {
    id: cfg.id,
    type: TYPES[cfg.type].enum,
    name: cfg.name,
  };
  if (cfg.description) m.description = cfg.description;
  m.version = '1.0.0';
  if (cfg.author) m.author = cfg.author;
  if (cfg.icon) m.icon = cfg.icon;

  if (cfg.type === 'plugin') {
    m.placement = { slots: cfg.slots };
  }
  if (cfg.type === 'module') {
    m.route = `/e/${cfg.pkg}/${cfg.id}`;
    m.permissions = { view: cfg.roles };
  }
  if (cfg.type === 'tool') {
    if (cfg.submenu) m.tool = { submenu: cfg.submenu };
    m.permissions = { view: cfg.roles.length ? cfg.roles : ['MASTER'] };
  }
  m.requires = { lowcodejs: '>=1.0.0' };

  return inlineStringArrays(JSON.stringify(m, null, 2)) + '\n';
}

// ── template: frontend index.tsx ───────────────────────────────────────────

function pluginActionsEntry(cfg) {
  const Comp = toPascalCase(cfg.id);
  const icon = cfg.icon || 'SparklesIcon';
  return `import { ${icon} } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toastInfo } from '@/lib/toast';
import type { ITable } from '@/lib/interfaces';

interface Props {
  /** Tabela em foco. Recebida via context do \`<ExtensionSlot id="table.actions">\`. */
  table?: ITable;
  slug?: string;
}

export default function ${Comp}({ table }: Props): React.JSX.Element {
  const label = table ? \`${cfg.name}: \${table.name}\` : '${cfg.name}';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="shadow-none p-1 h-auto"
          onClick={() => {
            // TODO: lógica do plugin
            toastInfo(label);
          }}
          data-test-id="plugin-${cfg.id}"
        >
          <${icon} className="size-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
`;
}

function pluginRowActionsEntry(cfg) {
  const Comp = toPascalCase(cfg.id);
  const icon = cfg.icon || 'SparklesIcon';
  return `import { ${icon} } from 'lucide-react';
import React from 'react';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toastInfo } from '@/lib/toast';
import type { IRow, ITable } from '@/lib/interfaces';

interface Props {
  table?: ITable;
  row: IRow;
  slug: string;
}

export default function ${Comp}({ row }: Props): React.JSX.Element {
  return (
    <DropdownMenuItem
      className="inline-flex space-x-1 w-full cursor-pointer"
      onClick={() => {
        // TODO: ação na row específica (row._id é o id do registro)
        toastInfo('${cfg.name}', row._id);
      }}
      data-test-id="plugin-${cfg.id}"
    >
      <${icon} className="size-4" />
      <span>${cfg.name}</span>
    </DropdownMenuItem>
  );
}
`;
}

function pluginFiltersEntry(cfg) {
  const Comp = toPascalCase(cfg.id);
  return `import React from 'react';

import { Field, FieldLabel } from '@/components/ui/field';
import type { IFilterField, ITable } from '@/lib/interfaces';

interface Props {
  table?: ITable;
  fields: IFilterField[];
}

export default function ${Comp}({
  table: _table,
  fields: _fields,
}: Props): React.JSX.Element {
  return (
    <Field data-test-id="plugin-${cfg.id}">
      <FieldLabel>${cfg.name}</FieldLabel>
      {/* TODO: inputs do filtro custom */}
    </Field>
  );
}
`;
}

function moduleEntry(cfg) {
  const Comp = toPascalCase(cfg.id);
  return `import React from 'react';

import { PageHeader, PageShell } from '@/components/common/page-shell';

export default function ${Comp}(): React.JSX.Element {
  return (
    <PageShell data-test-id="module-${cfg.id}">
      <PageShell.Header>
        <PageHeader title="${cfg.name}" />
      </PageShell.Header>

      <PageShell.Content className="p-4">
        <p className="text-sm text-muted-foreground">
          TODO: conteúdo do módulo ${cfg.name}.
        </p>
      </PageShell.Content>
    </PageShell>
  );
}
`;
}

function toolEntry(cfg) {
  const Comp = toPascalCase(cfg.id);
  return `import React from 'react';

import { PageHeader, PageShell } from '@/components/common/page-shell';
import { AccessDenied } from '@/components/common/route-status/access-denied';
import { usePermission } from '@/hooks/use-table-permission';

export default function ${Comp}(): React.JSX.Element {
  const permission = usePermission();

  if (!permission.can('CREATE_TABLE')) {
    return <AccessDenied />;
  }

  return (
    <PageShell data-test-id="tool-${cfg.id}">
      <PageShell.Header>
        <PageHeader title="${cfg.name}" />
      </PageShell.Header>

      <PageShell.Content className="p-4">
        <p className="text-sm text-muted-foreground">
          TODO: form / interface da ferramenta ${cfg.name}.
        </p>
      </PageShell.Content>
    </PageShell>
  );
}
`;
}

function frontendEntry(cfg) {
  if (cfg.type === 'module') return moduleEntry(cfg);
  if (cfg.type === 'tool') return toolEntry(cfg);
  // plugin — escolhe o template pelo primeiro slot
  const slot = cfg.slots[0];
  if (slot === 'table.row.actions') return pluginRowActionsEntry(cfg);
  if (slot === 'table.filters') return pluginFiltersEntry(cfg);
  return pluginActionsEntry(cfg);
}

// ── template: backend (controller/use-case/validator/schema) ───────────────

function controllerTs(cfg) {
  const Comp = toPascalCase(cfg.id);
  const route = cfg.type === 'tool' ? '/tools' : `/${cfg.pkg}`;
  return `/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { E_EXTENSION_TYPE } from '@application/core/entity.core';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { ExtensionActiveMiddleware } from '@application/middlewares/extension-active.middleware';

import { ${Comp}Schema } from './${cfg.id}.schema';
import ${Comp}UseCase from './${cfg.id}.use-case';
import { ${Comp}Validator } from './${cfg.id}.validator';

@Controller({
  // TODO: ajuste a rota se necessário
  route: '${route}',
})
export default class {
  constructor(
    private readonly useCase: ${Comp}UseCase = getInstanceByToken(
      ${Comp}UseCase,
    ),
  ) {}

  @POST({
    url: '/${cfg.id}',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        ExtensionActiveMiddleware({
          pkg: '${cfg.pkg}',
          type: E_EXTENSION_TYPE.${TYPES[cfg.type].enum},
          extensionId: '${cfg.id}',
        }),
      ],
      schema: ${Comp}Schema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = ${Comp}Validator.parse(request.body);

    const result = await this.useCase.execute({
      payload: body,
      ownerId: request.user.sub,
    });

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
        ...(error.errors && { errors: error.errors }),
      });
    }

    return response.status(200).send(result.value);
  }
}
`;
}

function useCaseTs(cfg) {
  const Comp = toPascalCase(cfg.id);
  const CONST = toConstantCase(cfg.id);
  return `import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';

import type { ${Comp}Payload } from './${cfg.id}.validator';

interface Input {
  ownerId: string;
  payload: ${Comp}Payload;
}

interface Output {
  // TODO: formato do resultado
  ok: boolean;
}

type Response = Either<HTTPException, Output>;

@Service()
export default class ${Comp}UseCase {
  // TODO: injete repositórios/serviços via constructor. Ao injetar, adicione
  // \`/* eslint-disable no-unused-vars */\` no topo (padrão dos use-cases do core).

  async execute(input: Input): Promise<Response> {
    try {
      // TODO: lógica de negócio (use input.ownerId e input.payload)
      void input;
      return right({ ok: true });
    } catch (error) {
      console.error('[${cfg.pkg}/${cfg.id}][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro ao executar a extensão',
          '${CONST}_ERROR',
        ),
      );
    }
  }
}
`;
}

function validatorTs(cfg) {
  const Comp = toPascalCase(cfg.id);
  return `import z from 'zod';

export const ${Comp}Validator = z.object({
  // TODO: campos esperados no body
});

export type ${Comp}Payload = z.infer<typeof ${Comp}Validator>;
`;
}

function schemaTs(cfg) {
  const Comp = toPascalCase(cfg.id);
  const CONST = toConstantCase(cfg.id);
  return `import type { FastifySchema } from 'fastify';

export const ${Comp}Schema: FastifySchema = {
  tags: ['Extensions'],
  summary: '${cfg.name}',
  description: ${singleQuote(cfg.description || cfg.name)},
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    properties: {
      // TODO: campos do body
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
      },
    },
    500: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['${CONST}_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
`;
}

// ── template: CLAUDE.md da extensão ────────────────────────────────────────

function extensionDoc(cfg) {
  const typeLabel = TYPES[cfg.type].enum;
  const lines = [];
  lines.push(`# ${cfg.name} (extensão \`${cfg.pkg}/${TYPES[cfg.type].folder}/${cfg.id}\`)`);
  lines.push('');
  lines.push(cfg.description || `Extensão do tipo ${typeLabel}.`);
  lines.push('');
  lines.push('## Identidade');
  lines.push('');
  const idRows = [
    ['pkg', `\`${cfg.pkg}\``],
    ['type', `\`${typeLabel}\``],
    ['id', `\`${cfg.id}\``],
  ];
  if (cfg.type === 'plugin') {
    idRows.push(['slots', cfg.slots.map((s) => `\`${s}\``).join(', ')]);
  }
  if (cfg.type === 'module') {
    idRows.push(['rota', `\`/e/${cfg.pkg}/${cfg.id}\``]);
  }
  if (cfg.type === 'tool') {
    idRows.push(['rota UI', `\`/tools/${cfg.pkg}/${cfg.id}\``]);
    if (cfg.hasBackend) idRows.push(['endpoint', `\`POST /tools/${cfg.id}\``]);
  }
  lines.push(mdTable(['Campo', 'Valor'], idRows));
  lines.push('');
  lines.push('## Arquivos');
  lines.push('');
  lines.push('```');
  lines.push(`backend/extensions/${cfg.pkg}/${TYPES[cfg.type].folder}/${cfg.id}/`);
  lines.push('  manifest.json        # registro canônico (loader → DB)');
  lines.push('  CLAUDE.md            # este arquivo');
  if (cfg.hasBackend) {
    lines.push(`  ${cfg.id}.controller.ts   # rota + ExtensionActiveMiddleware`);
    lines.push(`  ${cfg.id}.use-case.ts     # lógica (Either<HTTPException, T>)`);
    lines.push(`  ${cfg.id}.validator.ts    # Zod`);
    lines.push(`  ${cfg.id}.schema.ts       # Fastify/OpenAPI`);
  }
  lines.push('');
  lines.push(`frontend/extensions/${cfg.pkg}/${TYPES[cfg.type].folder}/${cfg.id}/`);
  lines.push('  index.tsx            # entry React (export default)');
  lines.push('```');
  lines.push('');
  lines.push('## Convenções');
  lines.push('');
  lines.push('- `id` deve bater com o nome da pasta (o loader rejeita se não bater)');
  lines.push('- UI usa **apenas** o design system: `@/components/ui/*` e');
  lines.push('  `@/components/common/*` (não importe Radix direto)');
  if (cfg.hasBackend) {
    lines.push('- Backend usa Either pattern e `ExtensionActiveMiddleware` (404 se desativada)');
  }
  lines.push('- Mensagens em PT-BR');
  lines.push('');
  lines.push('## Smoke test');
  lines.push('');
  lines.push('1. Restart do backend → o log do loader deve listar a extensão');
  if (cfg.pkg !== 'core') {
    lines.push('2. `/extensions` (MASTER) → ativar (pacotes ≠ `core` começam desativados)');
  } else {
    lines.push('2. Pacote `core` já vem ativado no primeiro boot');
  }
  if (cfg.type === 'plugin') {
    lines.push(`3. Abrir uma tabela → o slot \`${cfg.slots[0]}\` deve renderizar o plugin`);
  } else if (cfg.type === 'module') {
    lines.push(`3. Acessar \`/e/${cfg.pkg}/${cfg.id}\` → a página deve renderizar`);
  } else {
    lines.push(`3. Sidebar Ferramentas → abrir \`/tools/${cfg.pkg}/${cfg.id}\``);
  }
  lines.push('');
  return lines.join('\n');
}

// ── main ───────────────────────────────────────────────────────────────────

const HELP = `${c.bold('make:extension')} — gera o boilerplate de uma extensão LowCodeJS.

${c.bold('Uso')}
  npm run make:extension                       # interativo
  npm run make:extension -- --type plugin --id hello-table
  npm run make:extension -- --type tool --pkg core --id merge --with-backend

${c.bold('Flags')}
  --type <plugin|module|tool>   tipo da extensão
  --pkg <slug>                  pacote (default: core)
  --id <slug>                   id da extensão (= nome da pasta)
  --name "<Nome>"               label humano (default: derivado do id)
  --description "<texto>"       descrição
  --icon <NomeLucide>           ícone lucide-react (ex: SparklesIcon)
  --author "<nome>"             autor (default: LowcodeJS)
  --slots a,b                   PLUGIN: slots (${INSTALLED_SLOTS.join(', ')})
  --submenu <grupo>             TOOL: grupo no submenu Ferramentas
  --roles MASTER,ADMINISTRATOR  permissions.view (MODULE/TOOL)
  --with-backend                gera controller/use-case/validator/schema
  --no-backend                  não gera backend (mesmo em TOOL)
  --force                       sobrescreve arquivos existentes
  --yes                         não faz perguntas (usa flags + defaults)
  --help, -h                    mostra esta ajuda
`;

async function main() {
  const flags = parseArgs(argv.slice(2));

  if (flags.help || flags.h || argv.includes('-h')) {
    console.log(HELP);
    return;
  }

  const interactive = !flags.yes && stdin.isTTY;

  const rl = interactive
    ? createInterface({ input: stdin, output: stdout })
    : null;

  const ask = async (question, def) => {
    if (!rl) return def ?? '';
    const suffix = def ? c.dim(` (${def})`) : '';
    const answer = (await rl.question(`${question}${suffix}: `)).trim();
    return answer || def || '';
  };
  const askYesNo = async (question, def) => {
    if (!rl) return def;
    const hint = def ? 'S/n' : 's/N';
    const answer = (await rl.question(`${question} ${c.dim(`(${hint})`)}: `))
      .trim()
      .toLowerCase();
    if (!answer) return def;
    return ['s', 'sim', 'y', 'yes'].includes(answer);
  };

  try {
    // type
    let type = (flags.type || '').toLowerCase();
    if (!type && rl) {
      type = (await ask('Tipo da extensão [plugin|module|tool]', 'plugin')).toLowerCase();
    }
    if (!TYPES[type]) {
      fail(`Tipo inválido: "${type || '(vazio)'}". Use plugin, module ou tool.`);
    }

    // pkg
    const pkg = (flags.pkg || (await ask('Pacote (pkg)', 'core'))).trim();
    if (!SLUG_REGEX.test(pkg)) {
      fail(`pkg inválido: "${pkg}". Use ${SLUG_REGEX}.`);
    }

    // id
    const id = (flags.id || (await ask('ID da extensão (= nome da pasta)', ''))).trim();
    if (!id) fail('id é obrigatório.');
    if (!SLUG_REGEX.test(id)) {
      fail(`id inválido: "${id}". Use ${SLUG_REGEX} (ex: hello-table).`);
    }

    // name / description / icon / author
    const name = (flags.name || (await ask('Nome (label)', toTitleCase(id)))).trim();
    const description = (flags.description || (await ask('Descrição', ''))).trim();
    const icon = (flags.icon || (await ask('Ícone lucide-react', type === 'plugin' ? 'SparklesIcon' : ''))).trim();
    const author = (flags.author || (await ask('Autor', 'LowcodeJS'))).trim();

    // type-specific
    let slots = [];
    let submenu = '';
    let roles = [];

    if (type === 'plugin') {
      const raw =
        flags.slots ||
        (await ask(
          `Slots [${INSTALLED_SLOTS.join(', ')}]`,
          'table.actions',
        ));
      slots = String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (slots.length === 0) fail('PLUGIN precisa de ao menos um slot.');
      for (const s of slots) {
        if (RESERVED_SLOTS.includes(s)) {
          console.warn(
            c.yellow(
              `⚠ Slot "${s}" é reservado (sem <ExtensionSlot> no core ainda) — não vai renderizar até ser instalado.`,
            ),
          );
        } else if (!INSTALLED_SLOTS.includes(s)) {
          fail(
            `Slot desconhecido: "${s}". Instalados: ${INSTALLED_SLOTS.join(', ')}.`,
          );
        }
      }
    }

    if (type === 'tool') {
      submenu = (flags.submenu || (await ask('Submenu (grupo em Ferramentas)', 'tables'))).trim();
    }

    if (type === 'module' || type === 'tool') {
      const rawRoles =
        flags.roles !== undefined
          ? String(flags.roles)
          : await ask(
              'Roles que enxergam (permissions.view, vazio = todos)',
              type === 'tool' ? 'MASTER' : '',
            );
      roles = String(rawRoles)
        .split(',')
        .map((r) => r.trim().toUpperCase())
        .filter(Boolean);
      for (const r of roles) {
        if (!VALID_ROLES.includes(r)) {
          fail(`Role inválida: "${r}". Use ${VALID_ROLES.join(', ')}.`);
        }
      }
    }

    // backend?
    let hasBackend;
    if (flags['with-backend']) hasBackend = true;
    else if (flags['no-backend']) hasBackend = false;
    else if (type === 'tool')
      hasBackend = await askYesNo('Gerar backend (controller/use-case/...)?', true);
    else hasBackend = await askYesNo('Gerar backend (controller/use-case/...)?', false);

    const force = Boolean(flags.force);

    const cfg = {
      type,
      pkg,
      id,
      name,
      description,
      icon,
      author,
      slots,
      submenu,
      roles,
      hasBackend,
    };

    // ── caminhos e arquivos ──
    const folder = TYPES[type].folder;
    const beDir = join(ROOT, 'backend', 'extensions', pkg, folder, id);
    const feDir = join(ROOT, 'frontend', 'extensions', pkg, folder, id);

    const files = [
      [join(beDir, 'manifest.json'), manifestJson(cfg)],
      [join(beDir, 'CLAUDE.md'), extensionDoc(cfg)],
      [join(feDir, 'index.tsx'), frontendEntry(cfg)],
    ];
    if (hasBackend) {
      files.push(
        [join(beDir, `${id}.controller.ts`), controllerTs(cfg)],
        [join(beDir, `${id}.use-case.ts`), useCaseTs(cfg)],
        [join(beDir, `${id}.validator.ts`), validatorTs(cfg)],
        [join(beDir, `${id}.schema.ts`), schemaTs(cfg)],
      );
    }

    // checagem de colisão
    const collisions = files
      .filter(([p]) => existsSync(p))
      .map(([p]) => relative(ROOT, p));
    if (collisions.length && !force) {
      fail(
        `Já existem arquivos (use --force para sobrescrever):\n  ${collisions.join('\n  ')}`,
      );
    }

    // escreve
    for (const [p, content] of files) {
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, content, 'utf-8');
      console.log(c.green(`  + ${relative(ROOT, p)}`));
    }

    // ── resumo + lembretes ──
    console.log('');
    console.log(c.bold(c.green(`✔ Extensão "${id}" (${TYPES[type].enum}) criada.`)));
    console.log('');
    console.log(c.bold('Cole nas tabelas dos CLAUDE.md do pacote:'));
    console.log(c.dim(`  backend/extensions/${pkg}/CLAUDE.md  e  frontend/extensions/${pkg}/CLAUDE.md`));
    if (type === 'plugin') {
      console.log(`  ${c.cyan(`| \`${id}\` | \`${slots.join(', ')}\` | ${name} |`)}`);
    } else if (type === 'module') {
      console.log(`  ${c.cyan(`| \`${id}\` | \`/e/${pkg}/${id}\` | ${name} |`)}`);
    } else {
      const endpoint = hasBackend ? `\`POST /tools/${id}\`` : '—';
      console.log(`  ${c.cyan(`| \`${id}\` | ${endpoint} | ${name} |`)}`);
    }
    console.log('');
    console.log(c.bold('Próximos passos:'));
    console.log('  1. Restart do backend → confira o log do loader');
    if (pkg !== 'core') {
      console.log(`  2. ${c.yellow('/extensions')} (MASTER) → ativar (pacote "${pkg}" começa desativado)`);
    } else {
      console.log('  2. Pacote core já vem ativado no primeiro boot');
    }
    if (type === 'plugin') {
      console.log(`  3. Abrir uma tabela → o slot "${slots[0]}" renderiza o plugin`);
    } else if (type === 'module') {
      console.log(`  3. Acessar /e/${pkg}/${id}`);
    } else {
      console.log(`  3. Sidebar Ferramentas → /tools/${pkg}/${id}`);
    }
    console.log('');
  } finally {
    rl?.close();
  }
}

main().catch((err) => {
  console.error(c.red(err?.stack || String(err)));
  exit(1);
});
