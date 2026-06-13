/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IRow, ITable } from '@application/core/entity.core';
import { E_ROW_STATUS } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldSlug } from '@application/core/field-slug.core';
import { resolveCreatorId } from '@application/core/row-ownership.core';
import { RowPayloadValidator } from '@application/core/row-payload-validator.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { FieldVisibilityContractService } from '@application/services/field-visibility/field-visibility-contract.service';
import { KanbanCommentMentionContractService } from '@application/services/kanban-comment-mention/kanban-comment-mention-contract.service';
import { RowMemberNotificationContractService } from '@application/services/row-member-notification/row-member-notification-contract.service';
import { RowPasswordContractService } from '@application/services/row-password/row-password-contract.service';
import { ScriptExecutionContractService } from '@application/services/script-execution/script-execution-contract.service';

type Response = Either<HTTPException, IRow>;

type Payload = Record<string, unknown> & {
  slug: string;
  _id: string;
  __actorUserId?: string;
  // Convidado contributor: só pode editar os próprios registros.
  __ownOnly?: boolean;
  // Sinais do solicitante para a visibilidade de campo no formulario.
  __role?: string;
  __isOwner?: boolean;
  __isAdministrator?: boolean;
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
    private readonly fieldVisibility: FieldVisibilityContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

      const ownGuard = await this.enforceOwnRow(payload, table);
      if (ownGuard) return left(ownGuard);

      // Descarta escritas em campos ocultos no formulario para o solicitante.
      const hidden = await this.fieldVisibility.hiddenSlugs({
        fields: table.fields,
        context: 'form',
        userId: payload.__actorUserId,
        userRole: payload.__role,
        isOwner: payload.__isOwner,
        isAdministrator: payload.__isAdministrator,
      });
      this.fieldVisibility.project(payload, hidden);
      delete payload.__role;
      delete payload.__isOwner;
      delete payload.__isAdministrator;

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

      if (table.rowSlugFieldId) {
        const slugField = table.fields.find(
          (f) => f._id === table.rowSlugFieldId,
        );
        if (slugField && payload[slugField.slug]) {
          const existing = await this.rowRepository.listSlugs(
            table,
            payload._id,
          );
          payload.sharedRowSlug = FieldSlug.suggestUnique(
            String(payload[slugField.slug]),
            existing,
          );
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

      // Auditoria nativa: registra quem fez a ultima alteracao (UPDATER).
      // updatedAt e gerenciado automaticamente pelo Mongoose (timestamps).
      // Espelha o comportamento de `creator` (CREATOR) no create.
      payload.updater = actorUserId ?? null;

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

  /**
   * Quando o acesso veio de um convidado contributor (__ownOnly), o registro só
   * pode ser editado pelo seu próprio criador. Retorna a exceção a propagar ou
   * null quando liberado.
   */
  private async enforceOwnRow(
    payload: Payload,
    table: ITable,
  ): Promise<HTTPException | null> {
    if (!payload.__ownOnly) return null;

    const current = await this.rowRepository.findOne({
      table,
      query: { _id: payload._id },
    });

    if (!current) {
      return HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND');
    }

    const creatorId = resolveCreatorId(current.creator);
    if (!payload.__actorUserId || creatorId !== payload.__actorUserId) {
      return HTTPException.Forbidden(
        'Você só pode editar os seus próprios registros',
        'OWN_ROW_ONLY',
      );
    }

    return null;
  }
}
