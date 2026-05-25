import { Module } from '@nestjs/common';
import { BudgetServiceController } from './budget-service.controller';
import { BudgetServiceService } from './budget-service.service';

@Module({
  imports: [],
  controllers: [BudgetServiceController],
  providers: [BudgetServiceService],
})
export class BudgetServiceModule {}
