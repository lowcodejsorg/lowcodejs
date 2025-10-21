import bcrypt from 'bcryptjs';

export async function isPasswordMatch(payload: {
  plain: string;
  hashed: string;
}): Promise<boolean> {
  const doesPasswordMatch = await bcrypt.compare(payload.hashed, payload.plain);
  return doesPasswordMatch;
}
