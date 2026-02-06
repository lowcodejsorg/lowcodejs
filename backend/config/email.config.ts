import { Env } from '@start/env';

export const NodemailerEmailProviderConfig = {
  host: Env.EMAIL_PROVIDER_HOST,
  port: Env.EMAIL_PROVIDER_PORT,
  secure: Env.EMAIL_PROVIDER_PORT === 465, // true for port 465, false for other ports
  // requireTLS: true,
  auth: {
    user: Env.EMAIL_PROVIDER_USER,
    pass: Env.EMAIL_PROVIDER_PASSWORD,
  },
};
