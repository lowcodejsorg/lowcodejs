import { VM } from 'vm2';

import EmailService from '@application/services/email.service';

import { normalizeCode } from './normalize-code.core';

// Função para normalização avançada de código JavaScript

// Função para validação e execução com VM2
export function executeWithVM2(
  code: string,
  sandbox: Record<string, any>,
): { success: boolean; error?: string; result?: any } {
  try {
    const vm = new VM({
      timeout: 5000, // 5 segundos timeout
      sandbox,
      eval: false, // Desabilita eval por segurança
      wasm: false, // Desabilita WebAssembly
    });

    const result = vm.run(code);
    return { success: true, result };
  } catch (error: any) {
    console.error('=== ERRO VM2 EXECUTION ===');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    console.error('Código executado:');
    console.error('---');
    console.error(code);
    console.error('---');
    console.error('========================');

    return {
      success: false,
      error: error.message || 'Erro desconhecido na execução VM2',
    };
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function HandlerFunction(
  code: string,
  doc: Record<string, any>,
  slug: string,
  fields: string[],
  context: {
    userAction?:
      | 'novo_registro'
      | 'editar_registro'
      | 'excluir_registro'
      | 'carregamento_formulario';
    executionMoment?:
      | 'carregamento_formulario'
      | 'antes_salvar'
      | 'depois_salvar';
    userId?: string;
    tableId?: string;
  } = {},
) {
  try {
    // Normaliza o slug e fields (remove hífens)
    const normalizedSlug = slug.replace(/-/g, '_');
    const normalizedFields = fields.map((f) => f.replace(/-/g, '_'));

    // Instancia EmailService para usar no closure
    const emailService = new EmailService();

    // Validações iniciais
    if (!code || code.trim() === '') {
      console.warn('Código JavaScript vazio ou nulo');
      return { success: true };
    }

    // Normalização avançada de código JavaScript
    let normalizedCode = normalizeCode(code.trim());

    // Substituir placeholders $tabela_campo por tabela_campo (sem $)
    for (const field of normalizedFields) {
      const placeholderWithDollar = `\\$${normalizedSlug}_${field}`; // COM $ (regex)
      const placeholderWithoutDollar = `${normalizedSlug}_${field}`; // SEM $

      // Usar regex global para substituir todas as ocorrências
      const regex = new RegExp(placeholderWithDollar, 'g');
      normalizedCode = normalizedCode.replace(regex, placeholderWithoutDollar);
    }

    // Preparar sandbox para VM2
    const sandbox: Record<string, any> = {
      // Document context
      doc,

      // Variáveis globais
      userAction: context.userAction || 'editar_registro',
      executionMoment: context.executionMoment || 'antes_salvar',
      userId: context.userId || '',
      tableId: context.tableId || '',

      // Declarar variáveis dos campos
      ...normalizedFields.reduce(
        (acc, field, index) => {
          const placeholderWithoutDollar = `${normalizedSlug}_${field}`;
          const originalField = fields[index];
          acc[placeholderWithoutDollar] = doc[originalField];
          return acc;
        },
        {} as Record<string, object>,
      ),

      // Funções utilitárias
      getFieldValue: (fieldId: string): any => {
        const normalizedFieldId = fieldId.startsWith('$')
          ? fieldId.substring(1).replace(/_/g, '-')
          : fieldId.replace(/_/g, '-');
        return doc[normalizedFieldId] || doc[fieldId];
      },

      setFieldValue: (
        fieldId: string,
        value: any,
      ): { success: boolean; value?: any; error?: string } => {
        try {
          const normalizedFieldId = fieldId.startsWith('$')
            ? fieldId.substring(1).replace(/_/g, '-')
            : fieldId.replace(/_/g, '-');

          // Validação e conversão de tipos
          if (value !== null && value !== undefined) {
            if (
              typeof value === 'string' &&
              !isNaN(Number(value)) &&
              value.trim() !== ''
            ) {
              const numValue = Number(value);
              value = Number.isInteger(numValue) ? numValue : parseFloat(value);
            }

            if (typeof value === 'string') {
              if (value.toLowerCase() === 'true') value = true;
              else if (value.toLowerCase() === 'false') value = false;
            }

            if (
              typeof value === 'string' &&
              value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
            ) {
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) value = dateValue;
            }
          }

          doc[normalizedFieldId] = value;
          doc[fieldId] = value;

          // Atualizar também a variável no sandbox se existir
          const placeholderName = `${normalizedSlug}_${fieldId.replace(/-/g, '_')}`;
          if (placeholderName in sandbox) {
            sandbox[placeholderName] = value;
          }

          return { success: true, value };
        } catch (error: any) {
          console.error('Erro ao definir valor do campo:', error);
          return { success: false, error: error.message };
        }
      },

      sendEmail: async (
        emails: string[],
        subject: string,
        body: string,
      ): Promise<{
        success: boolean;
        message: string;
        recipients?: number;
      }> => {
        try {
          if (!Array.isArray(emails) || emails.length === 0) {
            return { success: false, message: 'Lista de emails inválida' };
          }

          if (!subject || !body) {
            return {
              success: false,
              message: 'Assunto e corpo do email são obrigatórios',
            };
          }

          await emailService.sendEmail({
            body,
            subject,
            to: emails,
            from: 'noreply@lowcode.com',
          });

          return {
            success: true,
            message: 'Email enviado com sucesso',
            recipients: emails.length,
          };
        } catch (error: any) {
          console.error('Erro na função sendEmail:', error);
          return { success: false, message: 'Erro interno ao enviar email' };
        }
      },

      // Objetos JavaScript padrão
      console,
      JSON,
      Date,
      Math,
      parseInt,
      parseFloat,
      isNaN,
      Number,
      String,
      Boolean,
      Array,
      Object,
    };

    // Executar com VM2
    const vmResult = executeWithVM2(normalizedCode, sandbox);

    if (!vmResult.success) {
      return {
        success: false,
        error: vmResult.error,
      };
    }

    for (const [index, field] of normalizedFields.entries()) {
      const placeholderWithoutDollar = `${normalizedSlug}_${field}`;
      const originalField = fields[index];
      if (placeholderWithoutDollar in sandbox) {
        doc[originalField] = sandbox[placeholderWithoutDollar];
      }
    }
    return { success: true };
  } catch (error: any) {
    console.error('=== ERRO NA EXECUÇÃO ===');
    console.error('Erro:', error.message);
    console.error('Código original do usuário:');
    console.error(code);
    console.error('========================');
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
}
