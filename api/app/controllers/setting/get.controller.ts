import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET } from 'fastify-decorators';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Controller({
  route: '/setting',
})
export default class {
  @GET({
    url: '',
    // url: '/:filename',
    options: {
      // onRequest: [AuthenticationMiddleware],

      schema: {
        tags: ['Settings'],
        summary: 'Get system settings',
        description:
          'Retrieves all system configuration settings from the settings properties file. Includes locale, file upload, and pagination configurations.',
        // security: [{ cookieAuth: [] }],
        response: {
          200: {
            description: 'System settings retrieved successfully',
            type: 'object',
            additionalProperties: {
              oneOf: [
                { type: 'string', description: 'Single setting value' },
                {
                  type: 'array',
                  items: { type: 'string' },
                  description:
                    'Array of setting values (comma-separated in properties)',
                },
              ],
            },
            properties: {
              LOCALE: {
                type: 'string',
                enum: ['pt-br', 'en-us'],
                description: 'System default language',
              },
              FILE_UPLOAD_MAX_SIZE: {
                type: 'string',
                description: 'Maximum file size in bytes',
                examples: ['10485760'],
              },
              FILE_UPLOAD_ACCEPTED: {
                type: 'array',
                items: { type: 'string' },
                description: 'Accepted file extensions',
                examples: [['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']],
              },
              FILE_UPLOAD_MAX_FILES_PER_UPLOAD: {
                type: 'string',
                description: 'Maximum files per upload',
                examples: ['5'],
              },
              FILE_UPLOAD_PATH: {
                type: 'string',
                description: 'File storage path',
                examples: ['./_storage'],
              },
              PAGINATION_PER_PAGE: {
                type: 'string',
                description: 'Default items per page',
                examples: ['20'],
              },
            },
            examples: [
              {
                LOCALE: 'en-us',
                FILE_UPLOAD_MAX_SIZE: '10485760',
                FILE_UPLOAD_ACCEPTED:
                  'jpg,jpeg,png,pdf,doc,docx,xls,xlsx,txt,zip,rar',
                FILE_UPLOAD_MAX_FILES_PER_UPLOAD: '5',
                FILE_UPLOAD_PATH: './_storage',
                PAGINATION_PER_PAGE: '20',
              },
            ],
          },
          // 401: {
          //   description: 'Unauthorized - Authentication required',
          //   type: 'object',
          //   properties: {
          //     message: { type: 'string', enum: ['Unauthorized'] },
          //     code: { type: 'number', enum: [401] },
          //     cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
          //   },
          // },
          404: {
            description: 'Not found - Settings file does not exist',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['File not found'] },
              code: { type: 'number', enum: [404] },
              cause: { type: 'string', enum: ['SETTINGS_FILE_NOT_FOUND'] },
            },
            examples: [
              {
                message: 'File not found',
                code: 404,
                cause: 'SETTINGS_FILE_NOT_FOUND',
              },
            ],
          },
          500: {
            description:
              'Internal server error - File reading or parsing issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['SETTINGS_READ_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    // const schema = z.object({
    //   filename: z.string(),
    // });
    // const { filename } = schema.parse(request.params);
    // const pathname = join(process.cwd(), '_system', `${filename}.properties`);
    const pathname = join(process.cwd(), '_system', `setting.properties`);

    const file = await readFile(pathname, 'utf-8');

    if (!file) {
      return response.status(404).send({
        message: 'File not found',
        code: 404,
        cause: 'SETTINGS_FILE_NOT_FOUND',
      });
    }

    const settings: Record<string, string | string[]> = {};

    for (const line of file.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && valueParts.length > 0 && value.includes(','))
          settings[key.trim()] = value
            .split(',')
            .filter(Boolean)
            .map((item) => item.trim());
        else settings[key.trim()] = value;
      }
    }

    return response.send(settings);
  }
}
