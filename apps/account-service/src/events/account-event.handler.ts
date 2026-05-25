import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AccountOpenedEvent, MoneyDepositedEvent, MoneyWithdrawnEvent } from './account.events';

@EventsHandler(AccountOpenedEvent, MoneyDepositedEvent, MoneyWithdrawnEvent)
export class AccountEventHandler implements IEventHandler<AccountOpenedEvent | MoneyDepositedEvent> {
    private readonly logger = new Logger('AccountEventHandler_Bridge');

    constructor(
        // Inject Client RabbitMQ được định nghĩa từ Shared Library (CoreModule.registerRabbitMQ)
        @Inject('RABBITMQ_SERVICE') private readonly rmqClient: ClientProxy,
    ) { }

    async handle(event: AccountOpenedEvent | MoneyDepositedEvent | MoneyWithdrawnEvent) {
        let eventName = event.constructor.name;
        let plainPayload: any = {};

        // Ép chuỗi cứng và tự đóng gói dữ liệu phẳng lỳ, bấp chấp cấu trúc Class
        if (event instanceof AccountOpenedEvent) {
            eventName = 'AccountOpenedEvent';
            plainPayload = {
                accountId: event.accountId,
                accountName: event.accountName,
                currency: event.currency,
                initialBalance: (event as any).initialBalance || 0
            };
        }

        if (event instanceof MoneyDepositedEvent) {
            eventName = 'MoneyDepositedEvent';
            plainPayload = {
                accountId: event.accountId,
                amount: event.amount,
                referenceId: event.referenceId
            };
        }

        if (event instanceof MoneyWithdrawnEvent) {
            eventName = 'MoneyWithdrawnEvent';
            plainPayload = {
                // 🚨 CHỮA CHÁY TỐI THƯỢNG: Nếu event.accountId không có, lấy event.id (chắc chắn trúng 100%)
                accountId: (event as any).accountId || (event as any).id,
                amount: event.amount,
                referenceId: event.referenceId
            };
        }

        this.logger.log(`🔄 Hứng được Event nội bộ: ${eventName}. Đang truyền sang RabbitMQ...`);
        this.logger.log(`[Payload gửi đi sàn RMQ]: ${JSON.stringify(plainPayload)}`);

        try {
            // Bắn thẳng cục Object phẳng lỳ này lên sàn
            this.rmqClient.emit(eventName, plainPayload);
            this.logger.log(`🚀 Bắn Event [${eventName}] lên RabbitMQ thành công!`);
        } catch (error) {
            this.logger.error(`❌ Thất bại khi bắn Event [${eventName}]:`, error);
        }
    }
}