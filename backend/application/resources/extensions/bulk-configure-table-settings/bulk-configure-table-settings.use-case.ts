/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import { E_EXTENSION_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { ExtensionContractRepository } from '@application/repositories/extension/extension-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import { rowAccessSettingsSchema } from '../../../../extensions/core/plugins/row-access/settings-schema';
import { RowAccessControlGuard } from '../../../../extensions/core/plugins/row-access/guard';

type Input = {
  _id: string;
  tableSettings: Record<string, Record<string, unknown>>;
};

type Output = {
  applied: number;
  skipped: number;
  errors: string[];
};

type Response = Either<HTTPException, Output>;

@Service()
export default class BulkConfigureTableSettingsUseCase {
  constructor(
    private readonly extensionRepository: ExtensionContractRepository,
    private readonly tableRepository: TableContractRepository,
  ) {}

  async execute({ _id, tableSettings }: Input): Promise<Response> {
    try {
      const existing = await this.extensionRepository.findById(_id);

      if (!existing) {
        return left(
          HTTPException.NotFound(
            'Extensão não encontrada',
            'EXTENSION_NOT_FOUND',
          ),
        );
      }

      if (existing.type !== E_EXTENSION_TYPE.PLUGIN) {
        return left(
          HTTPException.BadRequest(
            'Configuração de tabelas só se aplica a plugins',
            'TABLE_SCOPE_NOT_APPLICABLE',
          ),
        );
      }

      // Detecta se o plugin é um row-access-guard pelo manifest placement.
      const manifestSnapshot = existing.manifestSnapshot as Record<string, unknown>;
      const placement = manifestSnapshot?.placement as Record<string, unknown> | undefined;
      if (placement?.kind !== 'row-access-guard') {
        return left(
          HTTPException.BadRequest(
            'Configuração em lote só é suportada por plugins row-access-guard',
            'TABLE_SCOPE_NOT_APPLICABLE',
          ),
        );
      }

      let applied = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const [tableId, rawSettings] of Object.entries(tableSettings)) {
        // Valida settings com o schema do guard.
        const parsed = rowAccessSettingsSchema.safeParse(rawSettings);
        if (!parsed.success) {
          const msgs = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
          errors.push(`tableId=${tableId}: ${msgs.join('; ')}`);
          skipped++;
          continue;
        }

        // Persiste.
        await this.extensionRepository.updateTableSettings({
          _id,
          tableId,
          settings: parsed.data as Record<string, unknown>,
        });

        // onTableBound.
        const table = await this.tableRepository.findById(tableId);
        if (table) {
          const bindResult = await RowAccessControlGuard.onTableBound(
            table,
            parsed.data as Record<string, unknown>,
          );
          if (bindResult.isLeft()) {
            errors.push(`tableId=${tableId}: ${bindResult.value.message}`);
            skipped++;
            continue;
          }
        }

        applied++;
      }

      return right({ applied, skipped, errors });
    } catch (error) {
      console.error('[extensions > bulk-configure-table-settings][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro ao configurar settings em lote',
          'BULK_CONFIGURE_TABLE_SETTINGS_ERROR',
        ),
      );
    }
  }
}
