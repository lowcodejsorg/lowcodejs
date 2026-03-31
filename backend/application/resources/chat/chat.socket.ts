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
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Server as HttpServer } from 'node:http';
import OpenAI from 'openai';
import { Server as SocketIOServer } from 'socket.io';

import {
  E_CHAT_EVENT,
  E_JWT_TYPE,
  type IJWTPayload,
} from '@application/core/entity.core';
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

    // --- Validar configuração ---
    const aiEnabled = process.env.AI_ASSISTANT_ENABLED === 'true';
    const openaiKey = process.env.OPENAI_API_KEY || Env.OPENAI_API_KEY;
    const mcpUrl = Env.MCP_SERVER_URL;

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
      // --- Conectar ao MCP (igual agent L150-153) ---
      socket.emit(E_CHAT_EVENT.STATUS, {
        message: 'Conectando ao servidor MCP...',
      });

      const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
        requestInit: {
          headers: {
            'X-Access-Token': accessToken,
          },
        },
      });

      mcpClient = new Client({
        name: 'lowcodejs-chat',
        version: '1.0.0',
      });

      await mcpClient.connect(transport);

      // --- Descoberta dinâmica de tools (igual agent L156-169) ---
      const toolsResult = await mcpClient.listTools();
      const mcpTools = toolsResult.tools;

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

      // --- Histórico de mensagens in-memory (igual agent L171-173) ---
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: getChatSystemPrompt(user.email.split('@')[0], user.email),
        },
      ];

      // --- Agente pronto (igual agent L175-179) ---
      socket.emit(E_CHAT_EVENT.READY, {
        message: 'Agente pronto! Você pode enviar mensagens.',
        tools_count: mcpTools.length,
      });

      // --- Loop de mensagens (igual agent L181-293) ---
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
              model: 'gpt-5-mini',
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

                  socket.emit(E_CHAT_EVENT.TOOL_RESULT, {
                    name: toolName,
                    preview:
                      contentStr.length > 150
                        ? contentStr.slice(0, 150) + '...'
                        : contentStr,
                  });
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
          const errorMsg = err instanceof Error ? err.message : String(err);
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
      const errorMsg = err instanceof Error ? err.message : String(err);
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
