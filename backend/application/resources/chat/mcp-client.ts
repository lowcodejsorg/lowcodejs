import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import { Env } from '@start/env';

/**
 * Calls a tool on the MCP server, forwarding the user's access token
 * via X-Access-Token header for per-user session isolation.
 */
export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>,
  accessToken: string,
): Promise<unknown> {
  const mcpUrl = Env.MCP_SERVER_URL;
  if (!mcpUrl) {
    throw new Error('MCP_SERVER_URL is not configured');
  }

  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
    requestInit: {
      headers: {
        'X-Access-Token': accessToken,
      },
    },
  });

  const client = new Client({
    name: 'lowcodejs-backend-chat',
    version: '1.0.0',
  });

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    return result;
  } finally {
    try {
      await client.close();
    } catch {
      // ignore close errors
    }
  }
}
