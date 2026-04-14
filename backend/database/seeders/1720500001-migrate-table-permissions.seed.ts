import { E_ROLE } from '@application/core/entity.core';
import { Table } from '@application/model/table.model';
import { UserGroup } from '@application/model/user-group.model';

const VISIBILITY_ACTION_MAP: Record<
  string,
  // eslint-disable-next-line no-unused-vars
  (registeredGroupId: string) => Record<string, string>
> = {
  PUBLIC: (registeredGroupId: string): Record<string, string> => ({
    viewTable: 'PUBLIC',
    viewField: 'PUBLIC',
    viewRow: 'PUBLIC',
    createRow: registeredGroupId,
    updateRow: 'NOBODY',
    removeRow: 'NOBODY',
    createField: 'NOBODY',
    updateField: 'NOBODY',
    removeField: 'NOBODY',
    updateTable: 'NOBODY',
  }),
  FORM: (registeredGroupId: string): Record<string, string> => ({
    viewTable: 'NOBODY',
    viewField: registeredGroupId,
    viewRow: 'NOBODY',
    createRow: 'PUBLIC',
    updateRow: 'NOBODY',
    removeRow: 'NOBODY',
    createField: 'NOBODY',
    updateField: 'NOBODY',
    removeField: 'NOBODY',
    updateTable: 'NOBODY',
  }),
  OPEN: (registeredGroupId: string): Record<string, string> => ({
    viewTable: registeredGroupId,
    viewField: registeredGroupId,
    viewRow: registeredGroupId,
    createRow: registeredGroupId,
    updateRow: registeredGroupId,
    removeRow: 'NOBODY',
    createField: 'NOBODY',
    updateField: 'NOBODY',
    removeField: 'NOBODY',
    updateTable: 'NOBODY',
  }),
  RESTRICTED: (registeredGroupId: string): Record<string, string> => ({
    viewTable: registeredGroupId,
    viewField: registeredGroupId,
    viewRow: registeredGroupId,
    createRow: 'NOBODY',
    updateRow: 'NOBODY',
    removeRow: 'NOBODY',
    createField: 'NOBODY',
    updateField: 'NOBODY',
    removeField: 'NOBODY',
    updateTable: 'NOBODY',
  }),
  PRIVATE: (): Record<string, string> => ({
    viewTable: 'NOBODY',
    viewField: 'NOBODY',
    viewRow: 'NOBODY',
    createRow: 'NOBODY',
    updateRow: 'NOBODY',
    removeRow: 'NOBODY',
    createField: 'NOBODY',
    updateField: 'NOBODY',
    removeField: 'NOBODY',
    updateTable: 'NOBODY',
  }),
};

export default async function Seed(): Promise<void> {
  const registeredGroup = await UserGroup.findOne({
    slug: E_ROLE.REGISTERED,
  });

  if (!registeredGroup) {
    console.info(
      '🌱 \x1b[31m migrate-table-permissions: grupo REGISTERED nao encontrado \x1b[0m',
    );
    return;
  }

  const registeredGroupId = registeredGroup._id.toString();

  const tables = await Table.find({
    visibility: { $exists: true },
    viewTable: { $exists: false },
  });

  if (tables.length === 0) {
    console.info(
      '🌱 \x1b[33m migrate-table-permissions: nenhuma tabela para migrar \x1b[0m',
    );
    return;
  }

  let migratedCount = 0;

  function collectAdminIds(raw: Record<string, unknown>): string[] {
    if (!Array.isArray(raw.administrators)) return [];
    return raw.administrators.map(String);
  }

  for (const table of tables) {
    const raw: Record<string, unknown> = table.toObject();
    const visibility = String(raw.visibility || 'RESTRICTED');

    const mapFn = VISIBILITY_ACTION_MAP[visibility];
    if (!mapFn) continue;

    const actionValues = mapFn(registeredGroupId);
    const ownerId = raw.owner ? String(raw.owner) : null;

    const collaborators = collectAdminIds(raw)
      .filter((userId) => userId !== ownerId)
      .map((userId) => ({ user: userId, profile: 'ADMIN' }));

    await Table.updateOne(
      { _id: table._id },
      {
        $set: {
          ...actionValues,
          collaborators,
        },
        $unset: {
          visibility: '',
          collaboration: '',
          administrators: '',
        },
      },
    );

    migratedCount++;
  }

  console.info(
    `🌱 \x1b[32m migrate-table-permissions: ${migratedCount} tabelas migradas \x1b[0m`,
  );
}
