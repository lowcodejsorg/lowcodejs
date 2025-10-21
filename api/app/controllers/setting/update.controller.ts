import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, PUT } from 'fastify-decorators';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import z from 'zod';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';

@Controller({
  route: '/setting',
})
export default class {
  @PUT({
    url: '',
    // url: '/:filename',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Settings'],
        summary: 'Update system settings',
        description:
          'Updates system configuration settings in the settings properties file. Allows modification of locale, file upload configurations, and pagination settings.',
        security: [{ cookieAuth: [] }],
        body: {
          type: 'object',
          required: [
            'locale',
            'fileUploadMaxSize',
            'fileUploadMaxFilesPerUpload',
            'fileUploadAccepted',
            'fileUploadPath',
            'paginationPerPage',
          ],
          properties: {
            locale: {
              type: 'string',
              enum: ['pt-br', 'en-us'],
              description: 'System default language/locale',
              examples: ['en-us', 'pt-br'],
            },
            fileUploadMaxSize: {
              type: 'string',
              pattern: '^[0-9]+$',
              description: 'Maximum file size in bytes (numeric string)',
              examples: ['10485760', '52428800'],
            },
            fileUploadMaxFilesPerUpload: {
              type: 'string',
              pattern: '^[0-9]+$',
              description:
                'Maximum number of files per upload (numeric string)',
              examples: ['5', '10', '20'],
            },
            fileUploadAccepted: {
              type: 'string',
              minLength: 1,
              description: 'Comma-separated list of accepted file extensions',
              examples: [
                'jpg,jpeg,png,pdf',
                'jpg,jpeg,png,pdf,doc,docx,xls,xlsx,txt,zip,rar',
              ],
            },
            fileUploadPath: {
              type: 'string',
              minLength: 1,
              description: 'File storage directory path',
              examples: ['./_storage', './uploads', '/var/uploads'],
            },
            paginationPerPage: {
              type: 'string',
              pattern: '^[0-9]+$',
              description: 'Default number of items per page (numeric string)',
              examples: ['20', '50', '100'],
            },
          },
        },
        response: {
          200: {
            description: 'Settings updated successfully',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: ['Settings updated successfully'],
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Update timestamp',
              },
            },
          },
          400: {
            description:
              'Bad request - Invalid request data or validation error',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: [
                  'Invalid request data',
                  'Validation error',
                  'Invalid file size format',
                  'Invalid locale',
                ],
              },
              code: { type: 'number', enum: [400] },
              cause: {
                type: 'string',
                enum: ['INVALID_PARAMETERS', 'VALIDATION_ERROR'],
              },
            },
            examples: [
              {
                message: 'Invalid request data',
                code: 400,
                cause: 'VALIDATION_ERROR',
              },
            ],
          },
          401: {
            description: 'Unauthorized - Authentication required',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Unauthorized'] },
              code: { type: 'number', enum: [401] },
              cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
            },
          },
          404: {
            description: 'Not found - Configuration file not found',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: ['Configuration file not found'],
              },
              code: { type: 'number', enum: [404] },
              cause: { type: 'string', enum: ['SETTINGS_FILE_NOT_FOUND'] },
            },
            examples: [
              {
                message: 'Configuration file not found',
                code: 404,
                cause: 'SETTINGS_FILE_NOT_FOUND',
              },
            ],
          },
          500: {
            description:
              'Internal server error - File writing or server issues',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: [
                  'Internal server error while updating settings',
                  'File write error',
                ],
              },
              code: { type: 'number', enum: [500] },
              cause: {
                type: 'string',
                enum: ['SETTINGS_UPDATE_ERROR', 'FILE_WRITE_ERROR'],
              },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    // const paramsSchema = z.object({
    //   filename: z.string(),
    // });

    const bodySchema = z.object({
      locale: z.enum(['pt-br', 'en-us']),
      fileUploadMaxSize: z.string().min(1),
      fileUploadMaxFilesPerUpload: z.string().min(1),
      fileUploadAccepted: z.string().min(1),
      fileUploadPath: z.string().min(1),
      paginationPerPage: z.string().min(1),
    });

    try {
      // const { filename } = paramsSchema.parse(request.params);
      const {
        locale,
        fileUploadMaxSize,
        fileUploadAccepted,
        fileUploadMaxFilesPerUpload,
        fileUploadPath,
        paginationPerPage,
      } = bodySchema.parse(request.body);

      // const pathname = join(process.cwd(), '_system', `${filename}.properties`);
      const pathname = join(process.cwd(), '_system', `setting.properties`);

      // Read the current file
      let fileContent: string;
      try {
        // fileContent = readFileSync(pathname, 'utf-8');
        fileContent = await readFile(pathname, 'utf-8');
      } catch (error) {
        console.error('Error reading file:', error);
        return response.status(404).send({
          message: 'Configuration file not found',
          code: 404,
          cause: 'SETTINGS_FILE_NOT_FOUND',
        });
      }

      // Update the LOCALE if provided
      if (locale) {
        fileContent = fileContent.replace(/LOCALE=.*/, `LOCALE=${locale}`);
      }

      if (fileUploadMaxSize) {
        fileContent = fileContent.replace(
          /FILE_UPLOAD_MAX_SIZE=.*/,
          `FILE_UPLOAD_MAX_SIZE=${fileUploadMaxSize}`,
        );
      }

      if (fileUploadAccepted) {
        fileContent = fileContent.replace(
          /FILE_UPLOAD_ACCEPTED=.*/,
          `FILE_UPLOAD_ACCEPTED=${fileUploadAccepted}`,
        );
      }

      if (fileUploadMaxFilesPerUpload) {
        fileContent = fileContent.replace(
          /FILE_UPLOAD_MAX_FILES_PER_UPLOAD=.*/,
          `FILE_UPLOAD_MAX_FILES_PER_UPLOAD=${fileUploadMaxFilesPerUpload}`,
        );
      }

      if (fileUploadPath) {
        fileContent = fileContent.replace(
          /FILE_UPLOAD_PATH=.*/,
          `FILE_UPLOAD_PATH=${fileUploadPath}`,
        );
      }

      if (paginationPerPage) {
        fileContent = fileContent.replace(
          /PAGINATION_PER_PAGE=.*/,
          `PAGINATION_PER_PAGE=${paginationPerPage}`,
        );
      }

      // Save the updated file
      // writeFileSync(pathname, fileContent);
      await writeFile(pathname, fileContent);

      // Return success
      return response.status(200).send({
        message: 'Settings updated successfully',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).send({
          message: 'Invalid request data',
          code: 400,
          cause: 'VALIDATION_ERROR',
        });
      }

      console.error('Error updating system settings:', error);
      return response.status(500).send({
        message: 'Internal server error while updating settings',
        code: 500,
        cause: 'SETTINGS_UPDATE_ERROR',
      });
    }
  }
}
