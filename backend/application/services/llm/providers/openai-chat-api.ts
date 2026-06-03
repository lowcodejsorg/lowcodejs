import type {
  LlmChatCompletionResult,
  LlmChatMessage,
  LlmChatProvider,
  LlmChatTool,
} from '../llm-chat.types';

type OpenAiCompatConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  extraHeaders?: Record<string, string>;
};

async function postChatCompletions(
  config: OpenAiCompatConfig,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const base = config.baseUrl.replace(/\/$/, '');
  const url = `${base}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
    ...config.extraHeaders,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(`Resposta inválida da API: ${text.slice(0, 200)}`);
    }
  }

  if (!response.ok) {
    const err = data.error as { message?: string } | undefined;
    const msg = err?.message ?? text.slice(0, 300) ?? response.statusText;
    throw new Error(`API retornou ${response.status}: ${msg}`);
  }

  return data;
}

function parseOpenAiResponse(
  data: Record<string, unknown>,
): LlmChatCompletionResult {
  const choices = data.choices as Array<Record<string, unknown>> | undefined;
  const choice = choices?.[0];
  if (!choice) {
    throw new Error('Resposta da API sem choices');
  }

  const msg = choice.message as Record<string, unknown>;
  const role = msg.role as string;
  if (role !== 'assistant') {
    throw new Error('Resposta inesperada: role não é assistant');
  }

  const finish = (choice.finish_reason as string) ?? 'stop';
  const toolCallsRaw = msg.tool_calls as
    | Array<Record<string, unknown>>
    | undefined;

  const assistantMessage: LlmChatMessage = {
    role: 'assistant',
    content: (msg.content as string | null) ?? null,
  };

  if (toolCallsRaw && toolCallsRaw.length > 0) {
    assistantMessage.tool_calls = toolCallsRaw.map((tc) => {
      const fn = tc.function as Record<string, unknown>;
      return {
        id: String(tc.id ?? ''),
        type: 'function' as const,
        function: {
          name: String(fn.name ?? ''),
          arguments: String(fn.arguments ?? '{}'),
        },
      };
    });
    return { message: assistantMessage, finishReason: 'tool_calls' };
  }

  return {
    message: assistantMessage,
    finishReason: finish === 'tool_calls' ? 'tool_calls' : 'stop',
  };
}

export function createOpenAiCompatProvider(
  config: OpenAiCompatConfig,
): LlmChatProvider {
  return {
    async complete(params: {
      messages: Array<LlmChatMessage>;
      tools?: Array<LlmChatTool>;
    }): Promise<LlmChatCompletionResult> {
      const body: Record<string, unknown> = {
        model: config.model,
        messages: params.messages,
      };
      if (params.tools && params.tools.length > 0) {
        body.tools = params.tools;
      }

      const data = await postChatCompletions(config, body);
      return parseOpenAiResponse(data);
    },
  };
}
