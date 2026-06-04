import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountView, AccountViewDocument } from '../schemas/account-view.schema';
import { ProcessedEvent } from '../schemas/processed-event.schema';

@Controller()
export class AccountConsumerController {
    private readonly logger = new Logger('AccountConsumer_MongoDB');

    constructor(
        @InjectModel(AccountView.name) private readonly accountViewModel: Model<AccountViewDocument>,
        @InjectModel(ProcessedEvent.name) private readonly processedEventModel: Model<ProcessedEvent>,
    ) { }

    // =========================================================================
    // 1. XỬ LÝ SỰ KIỆN: MỞ TÀI KHOẢN (Chặn trùng bằng accountId)
    // =========================================================================
    @EventPattern('AccountOpenedEvent')
    @MessagePattern('AccountOpenedEvent')
    async handleAccountOpened(@Payload() data: any, @Ctx() context: RmqContext) {
        this.logger.log(`📥 KÍCH HOẠT: Nhận được tín hiệu AccountOpenedEvent!`);

        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        const { accountId, accountName, currency, initialBalance } = payload;

        if (!accountId) {
            this.logger.error(`❌ Gói tin không hợp lệ, thiếu accountId!`);
            return;
        }

        try {
            await this.processedEventModel.create({
                referenceId: accountId,
                eventName: 'AccountOpenedEvent'
            });

            await this.accountViewModel.updateOne(
                { accountId },
                {
                    $set: {
                        accountId,
                        accountName,
                        currency,
                        balance: initialBalance || 0,
                        // 🧹 Đã bỏ updatedAt gõ tay ở đây vì Mongoose tự lo khi tạo mới/upsert
                    },
                },
                { upsert: true },
            );
            this.logger.log(`🟢 Đã đồng bộ tài khoản [${accountId}] xuống MongoDB thành công!`);

        } catch (error) {
            if ((error as any).code === 11000) {
                this.logger.warn(`⚠️ [Chặn trùng] Tài khoản [${accountId}] đã được đồng bộ trước đó. Bỏ qua!`);
                return;
            }
            this.logger.error(`❌ Lỗi hệ thống khi mở tài khoản: ${(error as any).message}`);
        }
    }

    // =========================================================================
    // 2. XỬ LÝ SỰ KIỆN: NẠP TIỀN (Chặn trùng bằng referenceId)
    // =========================================================================
    @EventPattern('MoneyDepositedEvent')
    @MessagePattern('MoneyDepositedEvent')
    async handleMoneyDeposited(@Payload() data: any) {
        this.logger.log(`📥 KÍCH HOẠT: Nhận được tín hiệu MoneyDepositedEvent từ RabbitMQ!`);

        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        const { accountId, amount, referenceId } = payload;

        if (!accountId || !amount || !referenceId) {
            this.logger.error(`❌ Gói tin nạp tiền thiếu dữ liệu: accountId=${accountId}, amount=${amount}, ref=${referenceId}`);
            return;
        }

        try {
            await this.processedEventModel.create({
                referenceId,
                eventName: 'MoneyDepositedEvent'
            });

            // 🟢 Tối ưu: Chỉ cần dùng $inc, trường updatedAt tự nhảy giờ mới nhờ Schema Timestamps
            await this.accountViewModel.updateOne(
                { accountId },
                { $inc: { balance: Number(amount) } },
            );
            this.logger.log(`🟢 Đã nạp +${amount} vào tài khoản [${accountId}] trên MongoDB. (Ref: ${referenceId})`);

        } catch (error) {
            if ((error as any).code === 11000) {
                this.logger.warn(`⚠️ [Chặn trùng] Giao dịch nạp tiền ${referenceId} đã xử lý. Bỏ qua để tránh cộng tiền trùng!`);
                return;
            }
            this.logger.error(`❌ Lỗi hệ thống khi nạp tiền: ${(error as any).message}`);
        }
    }

    // =========================================================================
    // 3. XỬ LÝ SỰ KIỆN: RÚT TIỀN (Chặn trùng bằng referenceId)
    // =========================================================================
    @EventPattern('MoneyWithdrawnEvent')
    @MessagePattern('MoneyWithdrawnEvent')
    async handleMoneyWithdrawn(@Payload() data: any) {
        this.logger.log(`📥 NHẬN ĐƯỢC: Tín hiệu MoneyWithdrawnEvent từ RabbitMQ!`);

        const payload = typeof data === 'string' ? JSON.parse(data) : data;

        const accountId = payload.accountId || payload.id || payload.AccountId;
        const amount = payload.amount || payload.Amount || payload.value;
        const { referenceId } = payload;

        if (!accountId || !amount || !referenceId) {
            this.logger.error(`❌ Gói tin rút tiền thiếu dữ liệu cốt lõi: accountId=${accountId}, amount=${amount}, ref=${referenceId}`);
            return;
        }

        try {
            await this.processedEventModel.create({
                referenceId,
                eventName: 'MoneyWithdrawnEvent'
            });

            // 🟢 Tối ưu: Bỏ $set updatedAt thừa, code vừa gọn vừa đúng chuẩn
            const result = await this.accountViewModel.updateOne(
                { accountId },
                { $inc: { balance: -Number(amount) } },
            );
            this.logger.log(`🔴 Kết quả Mongo cập nhật: ${JSON.stringify(result)}`);
            this.logger.log(`🟢 Đã trừ -${amount} khỏi tài khoản [${accountId}] trên MongoDB thành công! (Ref: ${referenceId})`);

        } catch (error) {
            if ((error as any).code === 11000) {
                this.logger.warn(`⚠️ [Chặn trùng] Giao dịch rút tiền ${referenceId} đã xử lý. Bỏ qua để tránh trừ tiền trùng!`);
                return;
            }
            this.logger.error(`❌ Lỗi hệ thống khi rút tiền: ${(error as any).message}`);
        }
    }
}