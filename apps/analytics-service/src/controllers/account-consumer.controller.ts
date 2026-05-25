import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountView, AccountViewDocument } from '../schemas/account-view.schema';

@Controller()
export class AccountConsumerController {
  private readonly logger = new Logger('AccountConsumer_MongoDB');

  constructor(
    @InjectModel(AccountView.name) private readonly accountViewModel: Model<AccountViewDocument>,
  ) {}

  // Chơi lớn: Cho hứng cả EventPattern lẫn MessagePattern để chặn đứng lỗi map route của NestJS
  @EventPattern('AccountOpenedEvent')
  @MessagePattern('AccountOpenedEvent')
  async handleAccountOpened(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`📥 KÍCH HOẠT: Nhận được tín hiệu AccountOpenedEvent!`);
    
    // Bóc tách gói tin thực tế từ RabbitMQ để xem NestJS có bọc cái gì lạ không
    const rawMessage = context.getMessage();
    this.logger.log(`[Raw RabbitMQ Content]: ${rawMessage.content.toString()}`);

    // Đề phòng trường hợp data bị bọc ngược hoặc gửi dạng string JSON
    const payload = typeof data === 'string' ? JSON.parse(data) : data;
    this.logger.log(`[Parsed Payload]: ${JSON.stringify(payload)}`);

    const { accountId, accountName, currency, initialBalance } = payload;

    if (!accountId) {
      this.logger.error(`❌ Gói tin không hợp lệ, thiếu accountId!`);
      return;
    }

    await this.accountViewModel.updateOne(
      { accountId },
      {
        $set: {
          accountId,
          accountName,
          currency,
          balance: initialBalance || 0,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    this.logger.log(`🟢 Đã đồng bộ tài khoản [${accountId}] xuống MongoDB thành công!`);
  }

  @EventPattern('MoneyDepositedEvent')
  @MessagePattern('MoneyDepositedEvent')
  async handleMoneyDeposited(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`📥 KÍCH HOẠT: Nhận được tín hiệu MoneyDepositedEvent!`);
    
    const payload = typeof data === 'string' ? JSON.parse(data) : data;
    this.logger.log(`[Parsed Payload]: ${JSON.stringify(payload)}`);

    const { accountId, amount } = payload;

    if (!accountId) {
      this.logger.error(`❌ Gói tin không hợp lệ, thiếu accountId!`);
      return;
    }

    await this.accountViewModel.updateOne(
      { accountId },
      {
        $inc: { balance: amount },
        $set: { updatedAt: new Date() },
      },
    );

    this.logger.log(`🟢 Đã cộng +${amount} vào tài khoản [${accountId}] trên MongoDB!`);
  }
}