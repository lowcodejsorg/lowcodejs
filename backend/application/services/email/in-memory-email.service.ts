import {
  EmailContractService,
  type EmailOptions,
  type EmailResult,
} from './email-contract.service';

interface StoredEmail extends EmailOptions {
  sentAt: Date;
}

export default class InMemoryEmailService extends EmailContractService {
  private emails: StoredEmail[] = [];

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    this.emails.push({
      ...options,
      sentAt: new Date(),
    });

    return {
      success: true,
      message: 'Email stored in memory (test mode)',
    };
  }

  async buildTemplate(payload: {
    template: string;
    data: Record<string, unknown>;
  }): Promise<string> {
    return `[Template: ${payload.template}] Data: ${JSON.stringify(payload.data)}`;
  }

  getLastEmail(): StoredEmail | undefined {
    return this.emails[this.emails.length - 1];
  }

  getEmails(): StoredEmail[] {
    return [...this.emails];
  }

  clear(): void {
    this.emails = [];
  }
}
