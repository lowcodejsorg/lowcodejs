import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  jsonSchema,
  stepCountIs,
  streamText,
  type ToolSet,
  type UIMessage,
} from 'ai';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { Env } from '@start/env';

import { callMcpTool } from './mcp-client';
import { getChatSystemPrompt } from './system-prompt';
import { mcpToolDefinitions } from './tool-definitions';

@Controller()
export default class {
  @POST({
    url: '/chat',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
    },
  })
  async handle(
    request: FastifyRequest<{ Body: { messages: UIMessage[] } }>,
    response: FastifyReply,
  ): Promise<void> {
    console.log('Received chat request with messages:', request.body.messages, {
      Env,
    });

    if (!Env.OPENAI_API_KEY || !Env.MCP_SERVER_URL) {
      return response.status(503).send({
        message: 'Chat service is not configured',
        code: 503,
        cause: 'CHAT_NOT_CONFIGURED',
      });
    }

    const { messages } = request.body;
    const user = request.user;

    // Extract access token from cookie to forward to MCP server
    const accessToken =
      request.cookies.accessToken ??
      extractCookieValue(request.headers.cookie, 'accessToken');

    if (!accessToken) {
      return response.status(401).send({
        message: 'Access token not found',
        code: 401,
        cause: 'MISSING_ACCESS_TOKEN',
      });
    }

    // Build MCP tools for the AI SDK
    const tools: ToolSet = {};

    for (const def of mcpToolDefinitions) {
      tools[def.name] = {
        description: def.description,
        inputSchema: jsonSchema(
          def.inputSchema as Parameters<typeof jsonSchema>[0],
        ),
        execute: async (args: Record<string, unknown>): Promise<unknown> => {
          try {
            return await callMcpTool(def.name, args, accessToken);
          } catch (error) {
            return {
              error: true,
              message:
                error instanceof Error
                  ? error.message
                  : 'Tool execution failed',
            };
          }
        },
      };
    }

    const result = streamText({
      model: openai('gpt-4.1-mini'),
      system: getChatSystemPrompt(
        user.email.split('@')[0], // Use email prefix as name
        user.email,
      ),
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(5),
    });

    const webResponse = result.toUIMessageStreamResponse();

    // Forward the Web Response through Fastify's raw response
    response.raw.writeHead(
      webResponse.status,
      Object.fromEntries(webResponse.headers),
    );

    if (webResponse.body) {
      const reader = (webResponse.body as ReadableStream).getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          response.raw.write(value);
        }
      } finally {
        response.raw.end();
      }
    } else {
      response.raw.end();
    }
  }
}

function extractCookieValue(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  let lastValue: string | undefined;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      lastValue = rest.join('=');
    }
  }
  return lastValue;
}
