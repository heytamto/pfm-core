import { Controller, Get } from '@nestjs/common';
import { BudgetServiceService } from './budget-service.service';

@Controller()
export class BudgetServiceController {
  constructor(private readonly budgetServiceService: BudgetServiceService) {}

  @Get()
  getHello(): string {
    return this.budgetServiceService.getHello();
  }
}
