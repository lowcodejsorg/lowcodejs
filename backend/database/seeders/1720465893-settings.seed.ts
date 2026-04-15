import { Setting } from '@application/model/setting.model';

/**
 * Garante a existencia do documento Setting (singleton) com todos os
 * defaults do schema Mongoose aplicados. Idempotente: nao sobrescreve
 * configuracoes ja persistidas. Os campos EMAIL_PROVIDER_* comecam
 * como null — serao configurados via UI /settings.
 */
export default async function Seed(): Promise<void> {
  await Setting.findOneAndUpdate(
    {},
    { $setOnInsert: {} },
    { upsert: true, setDefaultsOnInsert: true, new: true },
  );
  console.info('🌱 \x1b[32m Setting (singleton) \x1b[0m');
}
