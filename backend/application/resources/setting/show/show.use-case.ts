/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { ISetting } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { SettingContractRepository } from '@application/repositories/setting/setting-contract.repository';

type Response = Either<HTTPException, ISetting | Record<string, unknown>>;

const KANBAN_TEMPLATE_ID = 'KANBAN_TEMPLATE';
const CARDS_TEMPLATE_ID = 'CARDS_TEMPLATE';
const MOSAIC_TEMPLATE_ID = 'MOSAIC_TEMPLATE';
const DOCUMENT_TEMPLATE_ID = 'DOCUMENT_TEMPLATE';
const FORUM_TEMPLATE_ID = 'FORUM_TEMPLATE';
const CALENDAR_TEMPLATE_ID = 'CALENDAR_TEMPLATE';

function getKanbanTemplateEntry(): Pick<
  ISetting['MODEL_CLONE_TABLES'][number],
  '_id' | 'name' | 'slug' | 'description'
> {
  return {
    _id: KANBAN_TEMPLATE_ID,
    name: 'Kanban',
    slug: 'kanban-tarefas',
    description: 'Modelo predefinido de tarefas em Kanban',
  };
}

function getCardsTemplateEntry(): Pick<
  ISetting['MODEL_CLONE_TABLES'][number],
  '_id' | 'name' | 'slug' | 'description'
> {
  return {
    _id: CARDS_TEMPLATE_ID,
    name: 'Cards',
    slug: 'cards',
    description: 'Modelo predefinido para Cards',
  };
}

function getMosaicTemplateEntry(): Pick<
  ISetting['MODEL_CLONE_TABLES'][number],
  '_id' | 'name' | 'slug' | 'description'
> {
  return {
    _id: MOSAIC_TEMPLATE_ID,
    name: 'Mosaico',
    slug: 'mosaico',
    description: 'Modelo predefinido para Mosaico',
  };
}

function getDocumentTemplateEntry(): Pick<
  ISetting['MODEL_CLONE_TABLES'][number],
  '_id' | 'name' | 'slug' | 'description'
> {
  return {
    _id: DOCUMENT_TEMPLATE_ID,
    name: 'Documento',
    slug: 'documento',
    description: 'Modelo predefinido para documento por índice',
  };
}

function getForumTemplateEntry(): Pick<
  ISetting['MODEL_CLONE_TABLES'][number],
  '_id' | 'name' | 'slug' | 'description'
> {
  return {
    _id: FORUM_TEMPLATE_ID,
    name: 'Forum',
    slug: 'chat-forum',
    description: 'Modelo predefinido para canais e mensagens em forum',
  };
}

function getCalendarTemplateEntry(): Pick<
  ISetting['MODEL_CLONE_TABLES'][number],
  '_id' | 'name' | 'slug' | 'description'
> {
  return {
    _id: CALENDAR_TEMPLATE_ID,
    name: 'Calendario',
    slug: 'calendario',
    description: 'Modelo predefinido para agenda/calendário',
  };
}

@Service()
export default class SettingShowUseCase {
  constructor(private readonly settingRepository: SettingContractRepository) {}

  async execute(): Promise<Response> {
    try {
      const setting = await this.settingRepository.get();

      if (!setting) {
        return right({
          ...process.env,
          FILE_UPLOAD_ACCEPTED:
            process.env.FILE_UPLOAD_ACCEPTED?.split(';') ?? [],
          MODEL_CLONE_TABLES: [
            getKanbanTemplateEntry(),
            getCardsTemplateEntry(),
            getMosaicTemplateEntry(),
            getDocumentTemplateEntry(),
            getForumTemplateEntry(),
            getCalendarTemplateEntry(),
          ],
        });
      }

      return right({
        ...setting,
        FILE_UPLOAD_ACCEPTED: setting.FILE_UPLOAD_ACCEPTED?.split(';') ?? [],
        MODEL_CLONE_TABLES: [
          getKanbanTemplateEntry(),
          getCardsTemplateEntry(),
          getMosaicTemplateEntry(),
          getDocumentTemplateEntry(),
          getForumTemplateEntry(),
          getCalendarTemplateEntry(),
          ...(Array.isArray(setting.MODEL_CLONE_TABLES)
            ? setting.MODEL_CLONE_TABLES
            : []),
        ],
      });
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Erro ao buscar configurações',
          'SETTINGS_READ_ERROR',
        ),
      );
    }
  }
}
