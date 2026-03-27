import { PasswordContractService } from './password-contract.service';

export default class InMemoryPasswordService extends PasswordContractService {
  async hash(password: string): Promise<string> {
    return `hashed_${password}`;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed_${plain}`;
  }
}
