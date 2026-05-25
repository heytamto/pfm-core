import { Injectable } from '@nestjs/common';

@Injectable()
export class BudgetServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
