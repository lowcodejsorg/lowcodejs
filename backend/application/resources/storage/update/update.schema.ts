import type { FastifySchema } from 'fastify';

export const StorageUploadSchema: FastifySchema = {
  tags: ['Armazenamento'],
  summary: 'Fazer upload de arquivos',
  description:
    'Faz upload de um ou mais arquivos para o sistema de armazenamento. Os arquivos são salvos no diretório configurado e os metadados são armazenados no banco de dados',
  security: [{ cookieAuth: [] }],
  consumes: ['multipart/form-data'],
  response: {
    201: {
      description: 'Arquivos enviados com sucesso',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'ID do registro de armazenamento',
          },
          filename: {
            type: 'string',
            description: 'Nome do arquivo gerado com extensão',
            examples: ['12345678.jpg', '87654321.pdf'],
          },
          url: {
            type: 'string',
            format: 'uri',
            description: 'URL completa para acessar o arquivo',
            examples: ['http://localhost:3000/storage/12345678.jpg'],
          },
          type: {
            type: 'string',
            description: 'Tipo MIME do arquivo',
            examples: ['image/jpeg', 'application/pdf', 'text/plain'],
          },
          size: {
            type: 'number',
            description: 'Tamanho do arquivo em bytes',
            examples: [12345678],
          },
          originalName: {
            type: 'string',
            description: 'Nome original do arquivo com extensão',
            examples: ['foto.jpg', 'documento.pdf'],
          },
          trashed: {
            type: 'boolean',
            enum: [false],
            description: 'Arquivo não está na lixeira',
          },
          trashedAt: {
            type: 'string',
            nullable: true,
            description:
              'Quando o arquivo foi enviado para lixeira (null para novos arquivos)',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data do upload',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data da última atualização',
          },
        },
      },
    },
    400: {
      description:
        'Requisição inválida - Formato ou tamanho de arquivo inválido',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: [
            'Tipo de arquivo não permitido',
            'Tamanho de arquivo excedido',
            'Nenhum arquivo fornecido',
            'Formato de arquivo inválido',
          ],
        },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: [
            'INVALID_FILE_TYPE',
            'FILE_SIZE_EXCEEDED',
            'NO_FILES_PROVIDED',
          ],
        },
      },
    },
    401: {
      description: 'Não autorizado - Autenticação necessária',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Não autorizado'] },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
    },
    413: {
      description:
        'Payload muito grande - Tamanho do arquivo excede os limites',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Arquivo muito grande'] },
        code: { type: 'number', enum: [413] },
        cause: { type: 'string', enum: ['PAYLOAD_TOO_LARGE'] },
      },
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Erro interno do servidor'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['STORAGE_UPLOAD_ERROR'] },
      },
    },
  },
};
