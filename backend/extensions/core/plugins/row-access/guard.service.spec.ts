import { describe, expect, it } from 'vitest';

import type { IRow, ITable } from '@application/core/entity.core';
import type { GuardEvalContext } from '@application/core/extensions/row-access-guard.contract';

import { RowAccessControlGuard } from './guard';
import {
  DEFAULT_ROW_ACCESS_SETTINGS,
  type RowAccessSettings,
} from './settings-schema';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cria um GuardEvalContext sem precisar de GroupResolverContractService real. */
function makeCtx(
  groupIds: string[] = [],
  userId = 'u1',
  isPrivileged = false,
): GuardEvalContext {
  return {
    user: undefined,
    userId,
    groupIds: new Set(groupIds),
    isPrivileged,
  };
}

function makeVisitorCtx(): GuardEvalContext {
  return {
    user: undefined,
    userId: undefined,
    groupIds: new Set(),
    isPrivileged: false,
  };
}

/**
 * Settings com groupMatrix mapeando 'PUBLIC' e 'INTERNO' para o grupo 'g-manager',
 * 'RESTRITO' e 'SIGILOSO' para o grupo 'g-admin'.
 */
function makeGroupSettings(
  overrides?: Partial<RowAccessSettings>,
): RowAccessSettings {
  return {
    visibility: {
      enabled: true,
      fieldSlug: 'visibility',
      values: ['PUBLIC', 'INTERNO', 'RESTRITO', 'SIGILOSO'],
      groupMatrix: {
        PUBLIC: ['g-manager', 'g-admin'],
        INTERNO: ['g-manager', 'g-admin'],
        RESTRITO: ['g-admin'],
        SIGILOSO: ['g-admin'],
      },
      defaultValue: 'PUBLIC',
    },
    creatorBypass: { enabled: true },
    dateWindow: { mode: 'off' },
    ...overrides,
  };
}

const baseTable: ITable = {
  _id: 'tab1',
  name: 'Docs',
  slug: 'docs',
  _schema: {},
  fields: [],
  groups: [],
  owner: 'u-owner',
  members: [],
  permissions: null,
  fieldOrderList: [],
  fieldOrderForm: [],
  fieldOrderFilter: [],
  fieldOrderDetail: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  trashed: false,
  trashedAt: null,
  methods: {
    onLoad: { code: null },
    beforeSave: { code: null },
    afterSave: { code: null },
  },
  order: null,
  layoutFields: {
    title: null,
    description: null,
    cover: null,
    category: null,
    startDate: null,
    endDate: null,
    color: null,
    participants: null,
    reminder: null,
  },
  rowSlugFieldId: null,
  description: null,
  logo: null,
  style: 'LIST' as ITable['style'],
  type: 'TABLE' as ITable['type'],
} as unknown as ITable;

function makeRow(extra: Partial<Record<string, unknown>> = {}): IRow {
  return { _id: 'r1', ...extra } as unknown as IRow;
}

// ── shape ─────────────────────────────────────────────────────────────────────

describe('RowAccessControlGuard shape', () => {
  it('possui pluginKey, category, supportsScopeAll, defaultSettings e settingsSchema', () => {
    expect(RowAccessControlGuard.pluginKey).toBe('core:row-access');
    expect(RowAccessControlGuard.category).toBe('restrictive');
    expect(RowAccessControlGuard.supportsScopeAll).toBe(false);
    expect(RowAccessControlGuard.settingsSchema).toBeDefined();
    expect(RowAccessControlGuard.defaultSettings).toBeDefined();
  });
});

// ── adjustListQuery ───────────────────────────────────────────────────────────

describe('RowAccessControlGuard.adjustListQuery', () => {
  it('visitante (sem userId) retorna query bloqueante para evitar list-leak', () => {
    const settings = makeGroupSettings();
    const q = RowAccessControlGuard.adjustListQuery(
      {},
      makeVisitorCtx(),
      baseTable,
      settings as unknown as Record<string, unknown>,
    );
    // FIX 1: quando visibility está habilitada e não há userId,
    // deve bloquear (não vazar a lista inteira para visitantes)
    expect(q).toEqual({
      [settings.visibility.fieldSlug]: { $in: ['__BLOCKED__'] },
    });
  });

  it('usuario no grupo g-manager com defaults: $or [visibility $in PUBLIC,INTERNO + creator]', () => {
    const settings = makeGroupSettings();
    const q = RowAccessControlGuard.adjustListQuery(
      {},
      makeCtx(['g-manager']),
      baseTable,
      settings as unknown as Record<string, unknown>,
    );
    expect(q).toHaveProperty('$or');
    const or = (q as { $or: Array<Record<string, unknown>> }).$or;
    expect(or).toHaveLength(2);
    expect(or[1]).toEqual({ creator: 'u1' });
    const vis = or[0] as { visibility: { $in: string[] } };
    expect(vis.visibility.$in).toContain('PUBLIC');
    expect(vis.visibility.$in).toContain('INTERNO');
    expect(vis.visibility.$in).not.toContain('RESTRITO');
    expect(vis.visibility.$in).not.toContain('SIGILOSO');
  });

  it('usuario sem grupo nenhum: visibility bloqueada para __BLOCKED__ + creator escape', () => {
    const settings = makeGroupSettings();
    const q = RowAccessControlGuard.adjustListQuery(
      {},
      makeCtx([]),
      baseTable,
      settings as unknown as Record<string, unknown>,
    );
    const or = (q as { $or: Array<Record<string, unknown>> }).$or;
    expect(or[0]).toEqual({ visibility: { $in: ['__BLOCKED__'] } });
    expect(or[1]).toEqual({ creator: 'u1' });
  });

  it('creator-bypass off + visibility on: retorna restritivo direto (sem $or)', () => {
    const settings = makeGroupSettings({
      creatorBypass: { enabled: false },
    });
    const q = RowAccessControlGuard.adjustListQuery(
      {},
      makeCtx(['g-manager']),
      baseTable,
      settings as unknown as Record<string, unknown>,
    );
    expect(q).toHaveProperty('visibility');
    expect(q).not.toHaveProperty('$or');
  });

  it('date-window sliding adiciona createdAt $gte no restrictivo', () => {
    const settings = makeGroupSettings({
      dateWindow: { mode: 'createdAt-sliding', slidingDays: 7 },
    });
    const q = RowAccessControlGuard.adjustListQuery(
      {},
      makeCtx(['g-manager']),
      baseTable,
      settings as unknown as Record<string, unknown>,
    );
    const or = (q as { $or: Array<Record<string, unknown>> }).$or;
    const restritivo = or[0] as { $and?: Array<Record<string, unknown>> };
    expect(restritivo.$and).toBeDefined();
    const hasCreated = restritivo.$and?.some((f) => 'createdAt' in f);
    expect(hasCreated).toBe(true);
  });

  it('visibility desabilitada + date-window off = {} (nada a contribuir)', () => {
    const settings: RowAccessSettings = {
      ...DEFAULT_ROW_ACCESS_SETTINGS,
      visibility: { ...DEFAULT_ROW_ACCESS_SETTINGS.visibility, enabled: false },
      creatorBypass: { enabled: false },
    };
    const q = RowAccessControlGuard.adjustListQuery(
      {},
      makeCtx(['g-manager']),
      baseTable,
      settings as unknown as Record<string, unknown>,
    );
    expect(q).toEqual({});
  });
});

// ── canRead ───────────────────────────────────────────────────────────────────

describe('RowAccessControlGuard.canRead', () => {
  it('creator-bypass: criador da row sempre allow', () => {
    const row = makeRow({ creator: 'u1', visibility: ['SIGILOSO'] });
    const decision = RowAccessControlGuard.canRead(
      row,
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(decision).toBe('allow');
  });

  it('usuario no g-manager lendo SIGILOSO de outro: deny', () => {
    const row = makeRow({ creator: 'other', visibility: ['SIGILOSO'] });
    const decision = RowAccessControlGuard.canRead(
      row,
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(decision).toBe('deny');
  });

  it('usuario no g-manager lendo PUBLIC: abstain', () => {
    const row = makeRow({ creator: 'other', visibility: ['PUBLIC'] });
    const decision = RowAccessControlGuard.canRead(
      row,
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(decision).toBe('abstain');
  });

  it('usuario no g-admin lendo SIGILOSO: abstain', () => {
    const row = makeRow({ creator: 'other', visibility: ['SIGILOSO'] });
    const decision = RowAccessControlGuard.canRead(
      row,
      makeCtx(['g-admin'], 'u1'),
      baseTable,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(decision).toBe('abstain');
  });

  it('visitante: deny quando visibility habilitada', () => {
    const row = makeRow({ creator: 'other', visibility: ['PUBLIC'] });
    const decision = RowAccessControlGuard.canRead(
      row,
      makeVisitorCtx(),
      baseTable,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(decision).toBe('deny');
  });

  it('date-window fora da janela: deny mesmo PUBLIC', () => {
    const settings = makeGroupSettings({
      creatorBypass: { enabled: false },
      dateWindow: { mode: 'createdAt-sliding', slidingDays: 1 },
    });
    const row = makeRow({
      creator: 'other',
      visibility: ['PUBLIC'],
      createdAt: new Date(Date.now() - 10 * 86400000),
    });
    const decision = RowAccessControlGuard.canRead(
      row,
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      settings as unknown as Record<string, unknown>,
    );
    expect(decision).toBe('deny');
  });

  it('date-window createdAt-fixed: dentro do intervalo = abstain', () => {
    const settings = makeGroupSettings({
      creatorBypass: { enabled: false },
      dateWindow: {
        mode: 'createdAt-fixed',
        fixedFrom: new Date(Date.now() - 10 * 86400000).toISOString(),
        fixedTo: new Date(Date.now() + 10 * 86400000).toISOString(),
      },
    });
    const row = makeRow({
      creator: 'other',
      visibility: ['PUBLIC'],
      createdAt: new Date(),
    });
    const decision = RowAccessControlGuard.canRead(
      row,
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      settings as unknown as Record<string, unknown>,
    );
    expect(decision).toBe('abstain');
  });
});

// ── canWrite ──────────────────────────────────────────────────────────────────

describe('RowAccessControlGuard.canWrite', () => {
  it('creator update: allow (criador edita propria row)', () => {
    const row = makeRow({ creator: 'u1', visibility: ['PUBLIC'] });
    const decision = RowAccessControlGuard.canWrite(
      row,
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      null,
      'update',
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(decision).toEqual({ decision: 'allow' });
  });

  it('g-manager tentando setar SIGILOSO no payload: deny', () => {
    const decision = RowAccessControlGuard.canWrite(
      null,
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      { visibility: ['SIGILOSO'] },
      'create',
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(decision).toEqual({
      decision: 'deny',
      reason: 'ROW_WRITE_RESTRICTED',
    });
  });

  it('g-manager setando PUBLIC: abstain', () => {
    const decision = RowAccessControlGuard.canWrite(
      null,
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      { visibility: ['PUBLIC'] },
      'create',
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(decision).toEqual({ decision: 'abstain' });
  });

  it('g-admin setando SIGILOSO: abstain (grupo tem acesso)', () => {
    const decision = RowAccessControlGuard.canWrite(
      null,
      makeCtx(['g-admin'], 'u1'),
      baseTable,
      { visibility: ['SIGILOSO'] },
      'create',
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(decision).toEqual({ decision: 'abstain' });
  });
});

// ── sanitizeWritePayload ──────────────────────────────────────────────────────

describe('RowAccessControlGuard.sanitizeWritePayload', () => {
  it('g-manager create com PUBLIC: normaliza para array', () => {
    const out = RowAccessControlGuard.sanitizeWritePayload(
      { nome: 'x', visibility: 'PUBLIC' },
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      'create',
      null,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(out['visibility']).toEqual(['PUBLIC']);
  });

  it('g-manager create sem visibility: aplica defaultValue como array', () => {
    const out = RowAccessControlGuard.sanitizeWritePayload(
      { nome: 'x' },
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      'create',
      null,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(out['visibility']).toEqual(['PUBLIC']);
  });

  it('g-manager update tentando SIGILOSO: preserva valor atual', () => {
    const current = makeRow({ visibility: ['INTERNO'] });
    const out = RowAccessControlGuard.sanitizeWritePayload(
      { visibility: ['SIGILOSO'] },
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      'update',
      current,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(out['visibility']).toEqual(['INTERNO']);
  });

  it('g-admin update com SIGILOSO: permite (grupo tem acesso)', () => {
    const current = makeRow({ visibility: ['RESTRITO'] });
    const out = RowAccessControlGuard.sanitizeWritePayload(
      { visibility: ['SIGILOSO'] },
      makeCtx(['g-admin'], 'u1'),
      baseTable,
      'update',
      current,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(out['visibility']).toEqual(['SIGILOSO']);
  });

  it('visibility off: identity', () => {
    const settings: RowAccessSettings = {
      ...DEFAULT_ROW_ACCESS_SETTINGS,
      visibility: { ...DEFAULT_ROW_ACCESS_SETTINGS.visibility, enabled: false },
    };
    const out = RowAccessControlGuard.sanitizeWritePayload(
      { nome: 'x', visibility: 'PUBLIC' },
      makeCtx(['g-manager'], 'u1'),
      baseTable,
      'create',
      null,
      settings as unknown as Record<string, unknown>,
    );
    expect(out).toEqual({ nome: 'x', visibility: 'PUBLIC' });
  });

  it('visitante: identity (sem userId nao sanitiza)', () => {
    const out = RowAccessControlGuard.sanitizeWritePayload(
      { nome: 'x' },
      makeVisitorCtx(),
      baseTable,
      'create',
      null,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    expect(out).toEqual({ nome: 'x' });
  });

  it('bypass de privilegiado — service nao chama sanitize; guard retorna identity independentemente', () => {
    // guard.sanitizeWritePayload recebe ctx.isPrivileged=true mas não tem bypass próprio
    // O bypass ocorre no service (antes de chamar o guard)
    // Aqui testamos apenas que o guard retorna o payload inalterado se o valor for permitido
    const out = RowAccessControlGuard.sanitizeWritePayload(
      { nome: 'x', visibility: 'SIGILOSO' },
      makeCtx(['g-admin'], 'u1', true),
      baseTable,
      'create',
      null,
      makeGroupSettings() as unknown as Record<string, unknown>,
    );
    // g-admin pode ver SIGILOSO, então normaliza
    expect(out['visibility']).toEqual(['SIGILOSO']);
  });
});
