/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IRow } from '@application/core/entity.core';
import { E_ROW_STATUS } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { RowPayloadValidator } from '@application/core/row-payload-validator.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { KanbanCommentMentionContractService } from '@application/services/kanban-comment-mention/kanban-comment-mention-contract.service';
import { RowMemberNotificationContractService } from '@application/services/row-member-notification/row-member-notification-contract.service';
import { RowPasswordContractService } from '@application/services/row-password/row-password-contract.service';
import { ScriptExecutionContractService } from '@application/services/script-execution/script-execution-contract.service';
import { generateSlug } from '@application/utils/slug.util';

type Response = Either<HTTPException, IRow>;

type Payload = Record<string, unknown> & {
  slug: string;
  _id: string;
  __actorUserId?: string;
};

@Service()
export default class TableRowUpdateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
    private readonly userRepository: UserContractRepository,
    private readonly rowPasswordService: RowPasswordContractService,
    private readonly scriptExecutionService: ScriptExecutionContractService,
    private readonly kanbanCommentMentionService: KanbanCommentMentionContractService,
    private readonly rowMemberNotificationService: RowMemberNotificationContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

      const errors = RowPayloadValidator.validate(
        payload,
        table.fields,
        table.groups,
        {
          skipMissing: true,
        },
      );

      if (errors) {
        return left(
          HTTPException.BadRequest(
            'Requisição inválida',
            'INVALID_PAYLOAD_FORMAT',
            errors,
          ),
        );
      }

      if (table.slugFieldId) {
        const slugField = table.fields.find((f) => f._id === table.slugFieldId);
        if (slugField && payload[slugField.slug]) {
          const slugValue = String(payload[slugField.slug]);
          payload._slug = generateSlug(slugValue);
        }
      }

      this.rowPasswordService.stripMasked(payload, table.fields);
      await this.rowPasswordService.hash(payload, table.fields);

      const beforeSaveCode = table.methods?.beforeSave?.code;
      if (beforeSaveCode) {
        const existing = await this.rowRepository.findOne({
          table,
          query: { _id: payload._id },
        });

        if (!existing) {
          return left(
            HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
          );
        }

        const fieldDefs = table.fields.map((f) => ({
          slug: f.slug,
          type: f.type,
          name: f.name,
          dropdown: f.dropdown,
        }));

        const userFieldList = table.fields
          .filter((f) => f.type === 'USER')
          .map((f) => f.slug);
        const userFieldSlugs = new Set(userFieldList);

        const mergedData: Record<string, any> = {
          ...existing,
          ...payload,
        };

        // Resolve os campos USER para os valores NOVOS (objetos com email),
        // espelhando o create. Assim o script enxerga os responsáveis atuais
        // (e não os anteriores). Os campos USER não são gravados de volta no
        // payload (loop abaixo), então isso afeta apenas a visão do script.
        const scriptDoc: Record<string, any> = { ...mergedData };
        if (userFieldList.length > 0) {
          const extractId = (value: any): string => {
            if (!value) return '';
            if (typeof value === 'string') return value;
            if (typeof value === 'object') return String(value._id ?? '');
            return String(value);
          };

          const allUserIds: string[] = [];
          for (const slug of userFieldList) {
            const val = mergedData[slug];
            const items = Array.isArray(val) ? val : [val];
            for (const item of items) {
              const id = extractId(item);
              if (id) allUserIds.push(id);
            }
          }

          if (allUserIds.length > 0) {
            const usersList = await this.userRepository.findMany({
              _ids: allUserIds,
            });
            const userMap = new Map(
              usersList.map((u) => [u._id.toString(), u]),
            );

            for (const slug of userFieldList) {
              const val = mergedData[slug];
              if (Array.isArray(val)) {
                scriptDoc[slug] = val.map(
                  (item: any) => userMap.get(extractId(item)) ?? item,
                );
              } else {
                const id = extractId(val);
                if (id && userMap.has(id)) scriptDoc[slug] = userMap.get(id);
              }
            }
          }
        }

        const result = await this.scriptExecutionService.execute({
          code: beforeSaveCode,
          doc: scriptDoc,
          tableSlug: table.slug,
          fields: fieldDefs,
          context: {
            userAction: 'editar_registro',
            executionMoment: 'antes_salvar',
            userId:
              typeof payload.creator === 'string' ? payload.creator : undefined,
            isNew: false,
            viaSaveHook: false,
            previous: existing,
            tableInfo: {
              _id: table._id?.toString() ?? '',
              name: table.name,
              slug: table.slug,
            },
          },
        });

        if (result.logs.length > 0) {
          console.info(
            `[beforeSave][${table.slug}] logs:`,
            result.logs.join('\n'),
          );
        }

        if (!result.success) {
          console.error(
            `[beforeSave][${table.slug}] error:`,
            result.error?.message,
          );
        }

        for (const key of Object.keys(scriptDoc)) {
          if (!userFieldSlugs.has(key)) {
            payload[key] = scriptDoc[key];
          }
        }
      }

      const actorUserId =
        typeof payload.__actorUserId === 'string'
          ? payload.__actorUserId
          : undefined;
      delete payload.__actorUserId;

      // O ato de salvar via update publica o registro (rascunho -> publicado).
      // Nao mexe em trashedAt: lixeira e controlada pelos endpoints de trash.
      payload.status = E_ROW_STATUS.PUBLISHED;
      payload.draftAt = null;

      const previousRow = await this.rowRepository.findOne({
        table,
        query: { _id: payload._id },
      });

      const row = await this.rowRepository.update({
        table,
        _id: payload._id,
        data: payload,
      });

      if (!row) {
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );
      }

      await this.rowMemberNotificationService.notifyNewMembers({
        table,
        previousRow,
        nextRow: row,
        actorUserId: actorUserId ?? '',
      });

      const mentionResult =
        await this.kanbanCommentMentionService.notifyNewMentions({
          table,
          row,
          actorUserId: actorUserId ?? '',
        });

      let finalRow = row;
      if (mentionResult.changed && mentionResult.data) {
        const updatedRow = await this.rowRepository.update({
          table,
          _id: payload._id,
          data: mentionResult.data,
        });
        if (updatedRow) finalRow = updatedRow;
      }

      this.rowPasswordService.mask(finalRow, table.fields);

      return right(finalRow);
    } catch (error) {
      console.error('[table-rows > update][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UPDATE_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
