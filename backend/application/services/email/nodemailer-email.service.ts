import { renderFile } from 'ejs';
import { Service } from 'fastify-decorators';
import { join } from 'node:path';
import nodemailer from 'nodemailer';

import { NodemailerEmailProviderConfig } from '@config/email.config';

import {
  EmailContractService,
  type EmailOptions,
  type EmailResult,
} from './email-contract.service';

@Service()
export default class NodemailerEmailService extends EmailContractService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    super();
    this.setupTransporter();
  }

  private setupTransporter(): void {
    try {
      console.log('EmailProviderConfig', NodemailerEmailProviderConfig);
      this.transporter = nodemailer.createTransport(
        NodemailerEmailProviderConfig,
      );
    } catch (error) {
      console.error('Erro ao configurar transportador de email:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.transporter) {
      return {
        success: false,
        message: 'Transportador de email não configurado',
      };
    }

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmails = options.to.filter((email) => emailRegex.test(email));

      if (validEmails.length === 0) {
        return { success: false, message: 'Nenhum email válido fornecido' };
      }

      const result = await this.transporter.sendMail({
        from: options.from,
        to: validEmails.join(', '),
        subject: options.subject,
        html: options.body,
        text: options.body.replace(/<[^>]*>/g, ''),
      });

      let testUrl: string | boolean | undefined;
      if (process.env.NODE_ENV !== 'production') {
        const url = nodemailer.getTestMessageUrl(result);
        testUrl = url || undefined;
      }

      return {
        success: true,
        message: 'Email enviado com sucesso',
        testUrl,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Erro ao enviar email:', error);
      return {
        success: false,
        message: `Erro ao enviar email: ${errorMessage}`,
      };
    }
  }

  async buildTemplate(payload: {
    template: string;
    data: Record<string, unknown>;
  }): Promise<string> {
    const file = join(
      process.cwd(),
      'templates',
      'email',
      payload.template.concat('.ejs'),
    );
    return await renderFile(file, payload.data);
  }
}
