import bcrypt from 'bcryptjs';

export async function isPasswordMatch(payload: {
  plain: string;
  hashed: string;
}): Promise<boolean> {
  const doesPasswordMatch = await bcrypt.compare(payload.plain, payload.hashed);
  return doesPasswordMatch;
}

export const PermissionSlugMapper = {
  // TABLE
  CREATE_TABLE: 'create-table',
  UPDATE_TABLE: 'update-table',
  REMOVE_TABLE: 'remove-table',
  VIEW_TABLE: 'view-table',

  // FIELD
  CREATE_FIELD: 'create-field',
  UPDATE_FIELD: 'update-field',
  REMOVE_FIELD: 'remove-field',
  VIEW_FIELD: 'view-field',

  // ROW
  CREATE_ROW: 'create-row',
  UPDATE_ROW: 'update-row',
  REMOVE_ROW: 'remove-row',
  VIEW_ROW: 'view-row',
};
