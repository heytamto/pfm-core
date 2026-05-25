import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountView, AccountViewDocument } from '../schemas/account-view.schema';

@Controller()
export class AccountConsumerController {
  constructor(
    @InjectModel(AccountView.name)
    private readonly accountViewModel: Model<AccountViewDocument>,
  ) {}

  // Lắng nghe sự kiện mở tài khoản để tạo dòng dữ liệu mới trong MongoDB
  @EventPattern('AccountOpenedEvent')
  async handleAccountOpened(@Payload() data: any) {
    await this.accountViewModel.findOneAndUpdate(
      { accountId: data.accountId },
      {
        accountId: data.accountId,
        accountName: data.accountName,
        currency: data.currency,
        balance: data.initialBalance,
        version: 0,
      },
      { upsert: true }, // Nếu chưa có thì tạo mới, có rồi thì ghi đè
    );
  }

  // Lắng nghe sự kiện nạp tiền để CỘNG thêm tiền vào MongoDB (Read Model)
  @EventPattern('MoneyDepositedEvent')
  async handleMoneyDeposited(@Payload() data: any) {
    await this.accountViewModel.updateOne(
      { accountId: data.accountId },
      { 
        $inc: { balance: data.amount }, // Toán tử $inc của Mongo tự động cộng dồn số dư siêu tốc
      }
    );
  }
}