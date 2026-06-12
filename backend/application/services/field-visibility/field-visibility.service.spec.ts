import { beforeEach, describe, expect, it } from 'vitest';

import type { IField } from '@application/core/entity.core';
import {
  E_FIELD_TYPE,
  E_PERMISSION_TARGET,
  E_ROLE,
} from '@application/core/entity.core';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import UserGroupInMemoryRepository from '@application/repositories/user-group/user-group-in-memory.repository';
import GroupResolverService from '@application/services/group-resolver/group-resolver.service';

import FieldVisibilityService from './field-visibility.service';

function makeField(overrides: Partial<IField>): IField {
  const base: IField = {
    _id: 'field-id',
    name: 'Campo',
    slug: 'campo',
    type: E_FIELD_TYPE.TEXT_SHORT,
    required: false,
    multiple: false,
    format: null,
    showInFilter: false,
    showInForm: false,
    showInDetail: false,
    showInList: false,
    permissions: null,
    widthInForm: 50,
    widthInList: 10,
    widthInDetail: 50,
    defaultValue: null,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    native: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    trashed: false,
    trashedAt: null,
  };

  return { ...base, ...overrides };
}

let userRepository: UserInMemoryRepository;
let groupRepository: UserGroupInMemoryRepository;
let groupResolver: GroupResolverService;
let sut: FieldVisibilityService;

describe('Field Visibility Service', () => {
  beforeEach(() => {
    userRepository = new UserInMemoryRepository();
    groupRepository = new UserGroupInMemoryRepository();
    groupResolver = new GroupResolverService(groupRepository);
    sut = new FieldVisibilityService(userRepository, groupResolver);
  });

  it('binding PUBLIC mantém o campo visível', async () => {
    const fields = [
      makeField({
        slug: 'nome',
        permissions: {
          list: { kind: E_PERMISSION_TARGET.PUBLIC, group: null },
          form: { kind: E_PERMISSION_TARGET.PUBLIC, group: null },
          detail: { kind: E_PERMISSION_TARGET.PUBLIC, group: null },
        },
      }),
    ];

    const hidden = await sut.hiddenSlugs({ fields, context: 'list' });

    expect(hidden.has('nome')).toBe(false);
  });

  it('binding NOBODY oculta o campo', async () => {
    const fields = [
      makeField({
        slug: 'segredo',
        permissions: {
          list: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
          form: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
          detail: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
        },
      }),
    ];

    const hidden = await sut.hiddenSlugs({ fields, context: 'list' });

    expect(hidden.has('segredo')).toBe(true);
  });

  it('binding GROUP: visível para quem está no grupo, oculto para os demais', async () => {
    const group = await groupRepository.create({
      name: 'Vendas',
      slug: 'vendas',
      permissions: [],
    });

    const member = await userRepository.create({
      name: 'Membro',
      email: 'membro@x.com',
      password: 'x',
      group: group._id,
    });

    const outsider = await userRepository.create({
      name: 'Outro',
      email: 'outro@x.com',
      password: 'x',
      group: 'grupo-sem-relacao',
    });

    const fields = [
      makeField({
        slug: 'salario',
        permissions: {
          list: { kind: E_PERMISSION_TARGET.GROUP, group: group._id },
          form: { kind: E_PERMISSION_TARGET.GROUP, group: group._id },
          detail: { kind: E_PERMISSION_TARGET.GROUP, group: group._id },
        },
      }),
    ];

    const hiddenForMember = await sut.hiddenSlugs({
      fields,
      context: 'list',
      userId: member._id,
    });
    expect(hiddenForMember.has('salario')).toBe(false);

    const hiddenForOutsider = await sut.hiddenSlugs({
      fields,
      context: 'list',
      userId: outsider._id,
    });
    expect(hiddenForOutsider.has('salario')).toBe(true);
  });

  it('campo legado (sem permissions) cai no boolean showIn*', async () => {
    const fields = [
      makeField({ slug: 'visivel', showInList: true, permissions: null }),
      makeField({ slug: 'oculto', showInList: false, permissions: null }),
    ];

    const hidden = await sut.hiddenSlugs({ fields, context: 'list' });

    expect(hidden.has('visivel')).toBe(false);
    expect(hidden.has('oculto')).toBe(true);
  });

  it('campo nativo nunca é ocultado, mesmo com binding NOBODY', async () => {
    const fields = [
      makeField({
        slug: '_id',
        native: true,
        permissions: {
          list: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
          form: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
          detail: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
        },
      }),
    ];

    const hidden = await sut.hiddenSlugs({ fields, context: 'list' });

    expect(hidden.has('_id')).toBe(false);
  });

  it('usuário privilegiado (MASTER) não tem nenhum campo oculto', async () => {
    const fields = [
      makeField({
        slug: 'segredo',
        permissions: {
          list: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
          form: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
          detail: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
        },
      }),
    ];

    const hidden = await sut.hiddenSlugs({
      fields,
      context: 'list',
      userRole: E_ROLE.MASTER,
    });

    expect(hidden.size).toBe(0);
  });

  it('dono da tabela (isOwner) enxerga todos os campos', async () => {
    const fields = [
      makeField({
        slug: 'segredo',
        permissions: {
          list: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
          form: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
          detail: { kind: E_PERMISSION_TARGET.NOBODY, group: null },
        },
      }),
    ];

    const hidden = await sut.hiddenSlugs({
      fields,
      context: 'detail',
      isOwner: true,
    });

    expect(hidden.size).toBe(0);
  });

  it('project remove apenas as chaves ocultas do objeto', () => {
    const row = { _id: '1', nome: 'Ana', salario: 5000 };

    const result = sut.project(row, new Set(['salario']));

    expect(result).toEqual({ _id: '1', nome: 'Ana' });
    expect('salario' in result).toBe(false);
  });
});
