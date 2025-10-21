import { Env } from '@start/env';
import { renderFile } from 'ejs';
import { join } from 'node:path';

export const EmailProviderConfig = {
  host: Env.EMAIL_PROVIDER_HOST,
  port: Env.EMAIL_PROVIDER_PORT,
  secure: Env.EMAIL_PROVIDER_PORT === 465, // true for port 465, false for other ports
  auth: {
    user: Env.EMAIL_PROVIDER_USER,
    pass: Env.EMAIL_PROVIDER_PASSWORD,
  },
};

export async function buildEmailTemplate(payload: {
  template: string;
  data: Record<string, object>;
}): Promise<string> {
  const file = join(
    process.cwd(),
    'templates',
    'email',
    payload.template.concat('.ejs'),
  );
  return await renderFile(file, payload.data);
}
