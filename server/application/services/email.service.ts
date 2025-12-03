import { Service } from 'fastify-decorators';
import nodemailer from 'nodemailer';

import { Env } from '@start/env';

interface EmailOptions {
  to: string[];
  subject: string;
  body: string;
  from?: string;
}

@Service()
export default class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.setupTransporter();
  }

  private async setupTransporter(): Promise<void> {
    try {
      // Para desenvolvimento, usar ethereal (teste)
      // if (process.env.NODE_ENV !== 'production') {
      //   const testAccount = await nodemailer.createTestAccount();

      //   this.transporter = nodemailer.createTransport({
      //     host: 'smtp.ethereal.email',
      //     port: 587,
      //     secure: false,
      //     auth: {
      //       user: testAccount.user,
      //       pass: testAccount.pass,
      //     },
      //   });
      // } else {
      //   // Para produção, usar configurações do .env

      // }

      console.log('MONTANDO CONFIG SERVICE EMAIL: ', {
        host: Env.EMAIL_PROVIDER_HOST,
        port: Env.EMAIL_PROVIDER_PORT,
        secure: false,
        requireTLS: true,
        auth: {
          user: Env.EMAIL_PROVIDER_USER,
          pass: Env.EMAIL_PROVIDER_PASSWORD,
        },
      });
      this.transporter = nodemailer.createTransport({
        host: Env.EMAIL_PROVIDER_HOST,
        port: Env.EMAIL_PROVIDER_PORT,
        secure: false,
        requireTLS: true,
        auth: {
          user: Env.EMAIL_PROVIDER_USER,
          pass: Env.EMAIL_PROVIDER_PASSWORD,
        },
      });
    } catch (error) {
      console.error('Erro ao configurar transportador de email:', error);
      //
    }
  }

  async sendEmail(
    options: EmailOptions,
  ): Promise<{ success: boolean; message: string; testUrl?: string }> {
    console.log('INICIO DO SEND EMAIL: ', options);

    if (!this.transporter) {
      return {
        success: false,
        message: 'Transportador de email não configurado',
      };
    }

    try {
      // Validar emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmails = options.to.filter((email) => emailRegex.test(email));

      if (validEmails.length === 0) {
        return { success: false, message: 'Nenhum email válido fornecido' };
      }

      console.log('PREPARANDO PARA ENVIAR EMAIL: ', {
        from: options.from,
        to: validEmails.join(', '),
        subject: options.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${options.subject}</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
              ${options.body.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Este email foi enviado automaticamente pelo sistema Low-Code.
            </p>
          </div>
        `,
        text: options.body,
      });
      const result = await this.transporter.sendMail({
        from: options.from,
        to: validEmails.join(', '),
        subject: options.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${options.subject}</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
              ${options.body.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Este email foi enviado automaticamente pelo sistema Low-Code.
            </p>
          </div>
        `,
        text: options.body,
      });

      console.log('EMAIL ENVIADO: ', result);

      // Para desenvolvimento, retornar URL de teste
      // let testUrl: string | undefined;
      // if (process.env.NODE_ENV !== 'production') {
      //   const url = nodemailer.getTestMessageUrl(result);
      //   testUrl = url || undefined;
      // }

      return {
        success: true,
        message: 'Email enviado com sucesso',
        // testUrl,
      };
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      return {
        success: false,
        message: `Erro ao enviar email: ${error.message}`,
      };
    }
  }

  // Rate limiting simples (em produção usar Redis)
  private static emailCounts = new Map<
    string,
    { count: number; lastReset: number }
  >();

  static checkRateLimit(
    userId: string,
    maxEmails = 10,
    windowMinutes = 60,
  ): boolean {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    const userStats = this.emailCounts.get(userId) || {
      count: 0,
      lastReset: now,
    };

    // Reset contador se janela expirou
    if (now - userStats.lastReset > windowMs) {
      userStats.count = 0;
      userStats.lastReset = now;
    }

    // Verificar limite
    if (userStats.count >= maxEmails) {
      return false;
    }

    userStats.count++;
    this.emailCounts.set(userId, userStats);
    return true;
  }
}
