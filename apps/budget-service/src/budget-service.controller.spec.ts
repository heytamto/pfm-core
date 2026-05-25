import { Test, TestingModule } from '@nestjs/testing';
import { BudgetServiceController } from './budget-service.controller';
import { BudgetServiceService } from './budget-service.service';

describe('BudgetServiceController', () => {
  let budgetServiceController: BudgetServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BudgetServiceController],
      providers: [BudgetServiceService],
    }).compile();

    budgetServiceController = app.get<BudgetServiceController>(BudgetServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(budgetServiceController.getHello()).toBe('Hello World!');
    });
  });
});
