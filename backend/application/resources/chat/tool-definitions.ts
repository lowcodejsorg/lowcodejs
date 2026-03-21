/**
 * MCP tool definitions for use with the Vercel AI SDK.
 * These mirror the tools exposed by the MCP server (mcp-lowcode).
 * Auth tools (login, logout, signup, recovery) are excluded since
 * the user is already authenticated in the platform.
 */

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const mcpToolDefinitions: McpToolDefinition[] = [
  // Auth - only check (read-only)
  {
    name: 'auth_check',
    description: 'Check if currently authenticated.',
    inputSchema: { type: 'object', properties: {} },
  },

  // Tables
  {
    name: 'tables_create',
    description: 'Create a new table in the system.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Table name' },
        logo: { type: 'string', description: 'Table logo URL (optional)' },
        style: {
          type: 'string',
          enum: ['GALLERY', 'LIST', 'DOCUMENT', 'CARD', 'MOSAIC', 'KANBAN'],
          description: 'Table display style',
        },
        visibility: {
          type: 'string',
          enum: ['PUBLIC', 'RESTRICTED', 'OPEN', 'FORM', 'PRIVATE'],
          description: 'Table visibility setting',
        },
        collaboration: {
          type: 'string',
          enum: ['open', 'restricted'],
          description: 'Collaboration mode',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'tables_list',
    description: 'List tables with pagination and filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', default: 1 },
        perPage: { type: 'number', default: 50 },
        search: { type: 'string', description: 'Search by name or slug' },
        name: { type: 'string', description: 'Filter by exact table name' },
        trashed: { type: 'boolean', description: 'Filter by trash status' },
        orderName: { type: 'string', enum: ['asc', 'desc'] },
        orderCreatedAt: { type: 'string', enum: ['asc', 'desc'] },
      },
    },
  },
  {
    name: 'tables_find',
    description:
      'Get a specific table by its slug, including its fields and schema.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Table slug identifier' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'tables_update',
    description: 'Update a table metadata and configuration.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Table slug to update' },
        name: { type: 'string' },
        description: { type: 'string' },
        style: {
          type: 'string',
          enum: ['GALLERY', 'LIST', 'DOCUMENT', 'CARD', 'MOSAIC', 'KANBAN'],
        },
        visibility: {
          type: 'string',
          enum: ['PUBLIC', 'RESTRICTED', 'OPEN', 'FORM', 'PRIVATE'],
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'tables_delete',
    description: 'Permanently delete a table and all its data.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
  },
  {
    name: 'tables_trash',
    description: 'Move a table to trash (soft delete).',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
  },
  {
    name: 'tables_restore',
    description: 'Restore a table from trash.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
  },

  // Fields
  {
    name: 'fields_create',
    description: 'Create a new field in a table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string', description: 'Slug of the table' },
        name: { type: 'string' },
        type: {
          type: 'string',
          enum: [
            'TEXT_SHORT',
            'TEXT_LONG',
            'DROPDOWN',
            'DATE',
            'RELATIONSHIP',
            'FILE',
            'FIELD_GROUP',
            'REACTION',
            'EVALUATION',
            'CATEGORY',
          ],
        },
        format: {
          type: 'string',
          description: 'Format for the field type',
          enum: [
            'ALPHA_NUMERIC',
            'INTEGER',
            'DECIMAL',
            'URL',
            'EMAIL',
            'TEXTAREA',
            'RICH_TEXT',
            'DD/MM/YYYY',
            'MM/DD/YYYY',
            'YYYY/MM/DD',
            'DD/MM/YYYY HH:mm:ss',
            'YYYY-MM-DD',
          ],
        },
        required: { type: 'boolean' },
        multiple: { type: 'boolean' },
        listing: { type: 'boolean' },
        filtering: { type: 'boolean' },
        dropdown: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dropdown options (for DROPDOWN fields)',
        },
      },
      required: ['tableSlug', 'name', 'type', 'format'],
    },
  },
  {
    name: 'fields_edit',
    description: 'Update an existing field.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        fieldIdOrName: {
          type: 'string',
          description: 'ID or Name of the field',
        },
        updates: { type: 'object', description: 'Properties to update' },
      },
      required: ['tableSlug', 'fieldIdOrName', 'updates'],
    },
  },
  {
    name: 'fields_delete',
    description: 'Delete a field from a table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        fieldIdOrName: { type: 'string' },
      },
      required: ['tableSlug', 'fieldIdOrName'],
    },
  },
  {
    name: 'fields_list',
    description: 'List all fields of a table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string', description: 'Slug of the table' },
        includeTable: { type: 'boolean', default: false },
      },
      required: ['tableSlug'],
    },
  },
  {
    name: 'fields_find',
    description: 'Get a specific field by its ID, slug, or name.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        field: { type: 'string', description: 'Field _id, slug, or name' },
      },
      required: ['tableSlug'],
    },
  },
  {
    name: 'fields_trash',
    description: 'Move a field to trash.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        fieldId: { type: 'string' },
      },
      required: ['tableSlug', 'fieldId'],
    },
  },
  {
    name: 'fields_restore',
    description: 'Restore a field from trash.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        fieldId: { type: 'string' },
      },
      required: ['tableSlug', 'fieldId'],
    },
  },
  {
    name: 'fields_add_category',
    description: 'Add a category to a field.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        fieldId: { type: 'string' },
        name: { type: 'string', description: 'Category name' },
        color: { type: 'string', description: 'Category color' },
      },
      required: ['tableSlug', 'fieldId', 'name'],
    },
  },

  // Rows
  {
    name: 'rows_create',
    description:
      'Create a new row in a table. Send data with field slugs as keys.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        data: { type: 'object', description: 'Field slugs as keys and values' },
      },
      required: ['tableSlug', 'data'],
    },
  },
  {
    name: 'rows_find',
    description: 'Find a specific row by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        rowId: { type: 'string' },
      },
      required: ['tableSlug', 'rowId'],
    },
  },
  {
    name: 'rows_update',
    description: 'Update an existing row.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        rowId: { type: 'string' },
        data: { type: 'object', description: 'Field slugs and new values' },
      },
      required: ['tableSlug', 'rowId', 'data'],
    },
  },
  {
    name: 'rows_delete',
    description: 'Delete a row.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        rowId: { type: 'string' },
      },
      required: ['tableSlug', 'rowId'],
    },
  },
  {
    name: 'rows_list',
    description: 'List rows from a table with pagination and filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        page: { type: 'number', default: 1 },
        perPage: { type: 'number', default: 50 },
        search: { type: 'string' },
        orderBy: { type: 'string' },
        orderDir: { type: 'string', enum: ['asc', 'desc'] },
      },
      required: ['tableSlug'],
    },
  },
  {
    name: 'files_list',
    description:
      'List all file items stored in FILE fields for a table by scanning its rows.',
    inputSchema: {
      type: 'object',
      properties: {
        tableSlug: { type: 'string' },
        page: { type: 'number', default: 1 },
        perPage: { type: 'number', default: 50 },
        fetchAll: { type: 'boolean', default: false },
      },
      required: ['tableSlug'],
    },
  },

  // Profile
  {
    name: 'profile_get',
    description: 'Get the current authenticated user profile.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'profile_update',
    description: 'Update the current user profile.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        group: { type: 'string' },
      },
      required: ['name', 'email', 'group'],
    },
  },
];
