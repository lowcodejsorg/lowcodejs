import type { ISetting } from '@application/core/entity.core';

export type NodemailerTransportConfig = {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  auth: { user: string; pass: string };
};

/**
 * Monta a configuracao do transporter Nodemailer a partir do documento
 * Setting armazenado no banco. Retorna null se qualquer credencial essencial
 * (HOST/PORT/USER/PASSWORD) estiver ausente.
 */
export function buildNodemailerConfig(
  setting: Pick<
    ISetting,
    | 'EMAIL_PROVIDER_HOST'
    | 'EMAIL_PROVIDER_PORT'
    | 'EMAIL_PROVIDER_USER'
    | 'EMAIL_PROVIDER_PASSWORD'
  >,
): NodemailerTransportConfig | null {
  const host = setting.EMAIL_PROVIDER_HOST;
  const port = setting.EMAIL_PROVIDER_PORT;
  const user = setting.EMAIL_PROVIDER_USER;
  const pass = setting.EMAIL_PROVIDER_PASSWORD;

  if (!host) return null;
  if (!port) return null;
  if (!user) return null;
  if (!pass) return null;

  return {
    host,
    port,
    secure: port === 465,
    requireTLS: true,
    auth: { user, pass },
  };
}

/**
 * Resolve o remetente (MAIL FROM). Preferencia: EMAIL_PROVIDER_FROM,
 * fallback para EMAIL_PROVIDER_USER (necessario para provedores como AWS SES
 * onde o usuario SMTP nao e um email valido).
 */
export function resolveEmailFrom(
  setting: Pick<ISetting, 'EMAIL_PROVIDER_FROM' | 'EMAIL_PROVIDER_USER'>,
): string | null {
  if (setting.EMAIL_PROVIDER_FROM) return setting.EMAIL_PROVIDER_FROM;
  if (setting.EMAIL_PROVIDER_USER) return setting.EMAIL_PROVIDER_USER;
  return null;
}
