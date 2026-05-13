/* eslint-disable no-unused-vars */
/**
 * Socket.IO handler para o chat com IA.
 * Segue estritamente a mesma lógica do agent/web_app.py:
 * - Uma sessão MCP persistente por conexão
 * - Descoberta dinâmica de tools via MCP
 * - OpenAI API direta (chat.completions.create)
 * - Protocolo de eventos: status, ready, thinking, tool_call, tool_result, tool_error, message, error
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import * as http from 'node:http';
import type { Server as HttpServer } from 'node:http';
import * as https from 'node:https';
import OpenAI from 'openai';
import { Server as SocketIOServer } from 'socket.io';

import {
  E_CHAT_EVENT,
  E_JWT_TYPE,
  E_LOGGER_ACTION_TYPE,
  E_LOGGER_OBJECT_TYPE,
  type IJWTPayload,
} from '@application/core/entity.core';
import { Logger } from '@application/model/logger.model';
import { Setting } from '@application/model/setting.model';
import { Env } from '@start/env';

import { getChatSystemPrompt } from './system-prompt';

interface FileData {
  type: 'image' | 'pdf';
  filename: string;
  content_type?: string;
  data_uri?: string;
  extracted_text?: string;
  page_count?: number;
}

interface ClientMessage {
  message?: string;
  file?: FileData;
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

function getErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const cause = (err as Error & { cause?: unknown }).cause;
  const causeMsg = cause instanceof Error ? ` — causa: ${cause.message}` : '';
  return err.message + causeMsg;
}

// Custom transport using node:http to bypass WHATWG "bad port" restriction
class NodeHttpTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  private readonly url: URL;
  private readonly headers: Record<string, string>;

  constructor(url: URL, headers: Record<string, string> = {}) {
    this.url = url;
    this.headers = headers;
  }

  async start(): Promise<void> {}

  async send(message: JSONRPCMessage): Promise<void> {
    // Notifications have no id — fire-and-forget, server sends no response
    const isNotification = !('id' in message);
    if (isNotification) {
      this.post(message).catch((err: unknown) => this.onerror?.(err instanceof Error ? err : new Error(String(err))));
      return;
    }
    const response = await this.post(message);
    if (response !== null && this.onmessage) {
      this.onmessage(response as JSONRPCMessage);
    }
  }

  async close(): Promise<void> {
    this.onclose?.();
  }

  private post(body: object, timeoutMs = 15000): Promise<JSONRPCMessage | null> {
    return new Promise((resolve, reject) => {
      const mod = this.url.protocol === 'https:' ? https : http;
      const data = JSON.stringify(body);
      const port = this.url.port || (this.url.protocol === 'https:' ? '443' : '80');

      const req = mod.request(
        {
          hostname: this.url.hostname,
          port,
          path: this.url.pathname + this.url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            Accept: 'application/json, text/event-stream',
            ...this.headers,
          },
        },
        (res) => {
          const ct = res.headers['content-type'] ?? '';

          // SSE response — parse events, call onmessage per event
          if (ct.includes('text/event-stream')) {
            let buf = '';
            res.setEncoding('utf8');
            res.on('data', (chunk: string) => {
              buf += chunk;
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';
              let eventData = '';
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  eventData += line.slice(6);
                } else if (line.trim() === '' && eventData) {
                  try {
                    const msg = JSON.parse(eventData) as JSONRPCMessage;
                    this.onmessage?.(msg);
                  } catch { /* ignore */ }
                  eventData = '';
                }
              }
            });
            res.on('end', () => resolve(null));
            return;
          }

          // Regular JSON response
          let chunks = '';
          res.setEncoding('utf8');
          res.on('data', (chunk: string) => { chunks += chunk; });
          res.on('end', () => {
            if (!chunks) { resolve(null); return; }
            try {
              resolve(JSON.parse(chunks) as JSONRPCMessage);
            } catch {
              reject(new Error(`Resposta inválida do MCP: ${chunks.slice(0, 200)}`));
            }
          });
        },
      );

      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`MCP request timeout (${timeoutMs}ms)`));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

async function connectMcpClient(mcpUrl: string, mcpAuthToken: string | null, accessToken: string): Promise<{ client: Client; tools: Awaited<ReturnType<Client['listTools']>>['tools'] }> {
  const headers: Record<string, string> = {
    'X-Access-Token': accessToken,
  };
  if (mcpAuthToken) {
    headers['Authorization'] = `Bearer ${mcpAuthToken}`;
  }

  const transport = new NodeHttpTransport(new URL(mcpUrl), headers);
  const client = new Client({ name: 'lowcodejs-chat', version: '1.0.0' });
  await client.connect(transport);
  const { tools } = await client.listTools();
  return { client, tools };
}

export function initChatSocket(
  httpServer: HttpServer,
  jwtDecode: (value: string) => IJWTPayload | null,
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: [Env.APP_CLIENT_URL, Env.APP_SERVER_URL, ...Env.ALLOWED_ORIGINS],
      credentials: true,
    },
  });

  io.on('connection', async (socket) => {
    // --- Autenticação via cookie (igual AuthenticationMiddleware) ---
    const cookieHeader = socket.handshake.headers.cookie;
    const accessToken = extractCookieValue(cookieHeader, 'accessToken');

    if (!accessToken) {
      socket.emit(E_CHAT_EVENT.ERROR, { message: 'Autenticação necessária.' });
      socket.disconnect();
      return;
    }

    const decoded = jwtDecode(accessToken);
    if (!decoded || decoded.type !== E_JWT_TYPE.ACCESS) {
      socket.emit(E_CHAT_EVENT.ERROR, {
        message: 'Token inválido ou expirado.',
      });
      socket.disconnect();
      return;
    }

    const user = decoded;

    // --- Validar configuração (lendo do Setting singleton) ---
    const setting = await Setting.findOne().lean();
    const aiEnabled = Boolean(setting?.AI_ASSISTANT_ENABLED);
    const openaiKey = setting?.OPENAI_API_KEY ?? null;
    const mcpUrl = setting?.MCP_SERVER_URL ?? null;
    const mcpAuthToken = setting?.MCP_SERVER_TOKEN ?? null;
    const openaiModel = setting?.OPENAI_MODEL ?? 'gpt-4.1-nano';

    if (!aiEnabled || !openaiKey || !mcpUrl) {
      socket.emit(E_CHAT_EVENT.ERROR, {
        message: 'Assistente IA não está habilitado ou não está configurado.',
      });
      socket.disconnect();
      return;
    }

    const openaiClient = new OpenAI({ apiKey: openaiKey });

    let mcpClient: Client | null = null;

    try {
      // --- Conectar ao MCP (tenta StreamableHTTP, fallback SSE) ---
      socket.emit(E_CHAT_EVENT.STATUS, {
        message: 'Conectando ao servidor MCP...',
      });

      const { client, tools: mcpTools } = await connectMcpClient(mcpUrl, mcpAuthToken, accessToken);
      mcpClient = client;

      let openaiTools: OpenAI.ChatCompletionTool[] | undefined;
      if (mcpTools.length > 0) {
        openaiTools = mcpTools.map((tool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description || '',
            parameters: (tool.inputSchema as Record<string, unknown>) || {},
          },
        }));
      }

      // --- Histórico de mensagens in-memory ---
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: getChatSystemPrompt(user.email.split('@')[0], user.email),
        },
      ];

      // --- Recebe histórico do frontend (persistência entre reloads) ---
      socket.on(
        E_CHAT_EVENT.HISTORY,
        (data: { messages: Array<{ role: 'user' | 'assistant'; content: string }> }) => {
          if (!Array.isArray(data?.messages)) return;
          for (const msg of data.messages) {
            if ((msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
              messages.push({ role: msg.role, content: msg.content });
            }
          }
        },
      );

      // --- Agente pronto ---
      socket.emit(E_CHAT_EVENT.READY, {
        message: 'Agente pronto! Você pode enviar mensagens.',
        tools_count: mcpTools.length,
      });

      // --- Loop de mensagens ---
      socket.on(E_CHAT_EVENT.MESSAGE, async (data: ClientMessage) => {
        try {
          const userInput = (data.message || '').trim();

          if (!userInput && !data.file) return;

          // Construir conteúdo da mensagem (multimodal se houver arquivo)
          // Igual agent L196-225
          const fileData = data.file;
          if (fileData) {
            const filename = fileData.filename || 'arquivo';

            if (fileData.type === 'image') {
              // GPT-4o Vision: enviar imagem como content multimodal (igual agent L202-213)
              const contentParts: OpenAI.ChatCompletionContentPart[] = [];
              if (userInput) {
                contentParts.push({ type: 'text', text: userInput });
              } else {
                contentParts.push({
                  type: 'text',
                  text: `Transcreva e descreva detalhadamente o conteúdo desta imagem (${filename}):`,
                });
              }
              contentParts.push({
                type: 'image_url',
                image_url: { url: fileData.data_uri! },
              });
              messages.push({ role: 'user', content: contentParts });
            } else if (fileData.type === 'pdf') {
              // PDF: incluir texto extraído na mensagem (igual agent L215-221)
              const extracted = fileData.extracted_text || '';
              const pageCount = fileData.page_count || 0;
              const prompt =
                userInput || 'Transcreva e analise o conteúdo deste PDF:';
              const fullContent = `${prompt}\n\nPDF: ${filename} (${pageCount} página(s))\n\n${extracted}`;
              messages.push({ role: 'user', content: fullContent });
            } else {
              messages.push({ role: 'user', content: userInput });
            }
          } else {
            messages.push({ role: 'user', content: userInput });
          }

          // Loop de processamento (igual agent L228-293)
          while (true) {
            socket.emit(E_CHAT_EVENT.THINKING);

            const response = await openaiClient.chat.completions.create({
              model: openaiModel,
              messages,
              tools: openaiTools,
            });

            const msg = response.choices[0].message;
            messages.push(msg);

            if (msg.tool_calls && msg.tool_calls.length > 0) {
              for (const toolCall of msg.tool_calls) {
                if (toolCall.type !== 'function') continue;
                const toolName = toolCall.function.name;
                let toolArgs: Record<string, unknown> = {};
                try {
                  toolArgs = JSON.parse(toolCall.function.arguments || '{}');
                } catch {
                  toolArgs = {};
                }
                const toolCallId = toolCall.id;

                socket.emit(E_CHAT_EVENT.TOOL_CALL, {
                  name: toolName,
                  args: toolArgs,
                });

                console.log('[MCP Log] tool_call:', toolName, toolArgs);
                Logger.create({
                  url: `mcp://${toolName}`,
                  user: user.sub,
                  action: E_LOGGER_ACTION_TYPE.AI_CALL,
                  object: E_LOGGER_OBJECT_TYPE.AI_TOOL,
                  object_id: toolName,
                  content: toolArgs,
                }).catch((err: unknown) => console.error('[MCP Log] create error:', err));

                try {
                  const result = await mcpClient!.callTool({
                    name: toolName,
                    arguments: toolArgs,
                  });

                  // Extrair content_str (igual agent L255-261)
                  let contentStr = '';
                  if (result.content && Array.isArray(result.content)) {
                    for (const content of result.content as Array<{
                      type: string;
                      text?: string;
                    }>) {
                      if (content.type === 'text') {
                        contentStr += content.text || '';
                      } else {
                        contentStr += `[${content.type}]`;
                      }
                    }
                  } else {
                    contentStr = String(result);
                  }

                  messages.push({
                    role: 'tool',
                    tool_call_id: toolCallId,
                    content: contentStr,
                  });

                  const preview = contentStr.length > 150
                    ? contentStr.slice(0, 150) + '...'
                    : contentStr;

                  socket.emit(E_CHAT_EVENT.TOOL_RESULT, {
                    name: toolName,
                    preview,
                  });

                  console.log('[MCP Log] tool_result:', toolName, '|', preview);
                  Logger.create({
                    url: `mcp://${toolName}/result`,
                    user: user.sub,
                    action: E_LOGGER_ACTION_TYPE.AI_RESPONSE,
                    object: E_LOGGER_OBJECT_TYPE.AI_TOOL,
                    object_id: toolName,
                    content: { preview, length: contentStr.length },
                  }).catch((err: unknown) => console.error('[MCP Log] create error:', err));
                } catch (err) {
                  const errorMsg =
                    err instanceof Error ? err.message : String(err);

                  messages.push({
                    role: 'tool',
                    tool_call_id: toolCallId,
                    content: errorMsg,
                  });

                  socket.emit(E_CHAT_EVENT.TOOL_ERROR, {
                    name: toolName,
                    message: errorMsg,
                  });

                  console.error('[MCP Log] tool_error:', toolName, errorMsg);
                  Logger.create({
                    url: `mcp://${toolName}/error`,
                    user: user.sub,
                    action: E_LOGGER_ACTION_TYPE.AI_RESPONSE,
                    object: E_LOGGER_OBJECT_TYPE.AI_TOOL,
                    object_id: toolName,
                    content: { error: errorMsg },
                  }).catch((err: unknown) => console.error('[MCP Log] create error:', err));
                }
              }
              // Continua o loop para enviar resultados de volta ao modelo (igual agent L287)
              continue;
            } else {
              // Resposta final (igual agent L288-293)
              socket.emit(E_CHAT_EVENT.MESSAGE, {
                content: msg.content || '',
              });
              break;
            }
          }
        } catch (err) {
          // Error handling (igual agent L297-308)
          console.error('Erro no processamento:', err);
          const errorMsg = getErrorMessage(err);
          try {
            socket.emit(E_CHAT_EVENT.ERROR, {
              message: `Erro no servidor: ${errorMsg}`,
            });
          } catch {
            // ignore emit errors
          }
        }
      });

      // --- Cleanup na desconexão (igual agent L309-313) ---
      socket.on('disconnect', async () => {
        try {
          if (mcpClient) {
            await mcpClient.close();
          }
        } catch {
          // ignore close errors
        }
      });
    } catch (err) {
      // Erro na inicialização (igual agent L297-308)
      console.error('Erro ao inicializar chat socket:', err);
      const errorMsg = getErrorMessage(err);
      try {
        socket.emit(E_CHAT_EVENT.ERROR, {
          message: `Erro no servidor: ${errorMsg}`,
        });
      } catch {
        // ignore emit errors
      }
      try {
        if (mcpClient) {
          await mcpClient.close();
        }
      } catch {
        // ignore close errors
      }
      socket.disconnect();
    }
  });

  return io;
}
