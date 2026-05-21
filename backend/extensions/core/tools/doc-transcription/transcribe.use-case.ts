import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';

import { getOrCreateConfig } from './doc-transcription-config.model';
import type { ITranscribeResult } from './doc-transcription.types';

interface Input {
  documentTypeId: string;
  fileBuffer: Buffer;
  filename: string;
  mimetype: string;
}

type Response = Either<HTTPException, ITranscribeResult>;

@Service()
export default class TranscribeDocumentUseCase {
  async execute(input: Input): Promise<Response> {
    try {
      const config = await getOrCreateConfig();

      if (!config.apiUrl) {
        return left(
          HTTPException.BadRequest(
            'URL da API de transcrição não configurada. Acesse Ferramentas > Transcrição de Documentos para configurar.',
            'API_NOT_CONFIGURED',
          ),
        );
      }

      if (!config.apiKey) {
        return left(
          HTTPException.BadRequest(
            'API Key não configurada. Acesse Ferramentas > Transcrição de Documentos para configurar.',
            'API_KEY_NOT_CONFIGURED',
          ),
        );
      }

      const docType = config.documentTypes.find(
        (dt) => dt.id === input.documentTypeId,
      );
      if (!docType) {
        return left(
          HTTPException.BadRequest(
            'Tipo de documento não encontrado na configuração',
            'DOCUMENT_TYPE_NOT_FOUND',
          ),
        );
      }

      const formData = new FormData();
      const blob = new Blob([input.fileBuffer], { type: input.mimetype });
      formData.append('document', blob, input.filename);
      formData.append('documentType', docType.id);
      formData.append('responseFields', JSON.stringify(docType.responseFields));
      if (config.model) formData.append('model', config.model);

      let rawData: unknown;

      try {
        const res = await fetch(config.apiUrl, {
          method: 'POST',
          headers: { 'X-Api-Key': config.apiKey },
          body: formData,
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(
            `[core/doc-transcription][transcribe] API retornou ${res.status}: ${errorText}`,
          );
          let detail = `${res.status} ${res.statusText}`;
          try {
            const parsed = JSON.parse(errorText) as { error?: string };
            if (parsed.error) detail = parsed.error;
          } catch { /* não é JSON */ }
          return left(
            HTTPException.BadGateway(
              `Erro na API de transcrição: ${detail}`,
              'TRANSCRIPTION_API_ERROR',
            ),
          );
        }

        rawData = await res.json();
      } catch (fetchError) {
        console.error(
          '[core/doc-transcription][transcribe] Falha ao chamar API externa:',
          fetchError,
        );
        return left(
          HTTPException.BadGateway(
            'Não foi possível conectar à API de transcrição',
            'TRANSCRIPTION_API_UNREACHABLE',
          ),
        );
      }

      const rawResponse = rawData as Record<string, unknown>;
      // A API externa retorna { data: {...}, model, usage }
      // O payload de campos está em .data — com fallback para o objeto raiz
      const raw = (rawResponse.data as Record<string, unknown>) ?? rawResponse;

      const fields = docType.responseFields.map((rf) => ({
        key: rf.key,
        label: rf.label,
        type: rf.type,
        value: raw[rf.key] !== undefined ? (raw[rf.key] as string | number | boolean | null) : null,
      }));

      return right({
        documentTypeId: docType.id,
        documentTypeName: docType.name,
        fields,
        raw,
      });
    } catch (error) {
      console.error('[core/doc-transcription][transcribe] error:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno ao processar transcrição',
          'TRANSCRIPTION_INTERNAL_ERROR',
        ),
      );
    }
  }
}
