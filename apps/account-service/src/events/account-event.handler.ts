import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AccountOpenedEvent, MoneyDepositedEvent } from './account.events';

@EventsHandler(AccountOpenedEvent, MoneyDepositedEvent)
export class AccountEventHandler implements IEventHandler<AccountOpenedEvent | MoneyDepositedEvent> {
    private readonly logger = new Logger('AccountEventHandler_Bridge');

    constructor(
        // Inject Client RabbitMQ được định nghĩa từ Shared Library (CoreModule.registerRabbitMQ)
        @Inject('RABBITMQ_SERVICE') private readonly rmqClient: ClientProxy,
    ) { }

    async handle(event: AccountOpenedEvent | MoneyDepositedEvent) {
        // Xác định chính xác tên dựa vào kiểu thực tế
        let eventName = event.constructor.name;

        // Ép chuỗi cứng an toàn 100% không sợ build lỗi
        if (event instanceof AccountOpenedEvent) eventName = 'AccountOpenedEvent';
        if (event instanceof MoneyDepositedEvent) eventName = 'MoneyDepositedEvent';

        this.logger.log(`🔄 Hứng được Event nội bộ: ${eventName}. Đang truyền sang RabbitMQ...`);

        try {
            const plainPayload = { ...event };
            this.rmqClient.emit(eventName, plainPayload);
            this.logger.log(`🚀 Bắn Event [${eventName}] lên RabbitMQ thành công!`);
        } catch (error) {
            this.logger.error(`❌ Thất bại khi bắn Event [${eventName}]:`, error);
        }
    }
}