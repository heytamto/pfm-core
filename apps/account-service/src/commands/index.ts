import { DepositMoneyHandler } from './deposit-money.handler';
import { OpenAccountHandler } from './open-account.handler';
import { WithdrawMoneyHandler } from './withdraw-money.handler';

// Gom tất cả các handlers vào một mảng để dễ quăng vào phần providers của AppModule
export const CommandHandlers = [DepositMoneyHandler, OpenAccountHandler, WithdrawMoneyHandler];