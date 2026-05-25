import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStoreRepository } from '../domain/event-store.repository';
import { AccountAggregate } from '../domain/account.aggregate';

// 1. Định nghĩa Lệnh rút tiền
export class WithdrawMoneyCommand {
    constructor(
        public readonly accountId: string,
        public readonly amount: number,
        public readonly referenceId: string,
    ) { }
}

// 2. Viết Handler xử lý lệnh rút tiền
@CommandHandler(WithdrawMoneyCommand)
@Injectable()
export class WithdrawMoneyHandler implements ICommandHandler<WithdrawMoneyCommand> {
    constructor(
        private readonly eventStoreRepository: EventStoreRepository,
        private readonly publisher: EventPublisher,
    ) { }

    async execute(command: WithdrawMoneyCommand): Promise<void> {
        const { accountId, amount, referenceId } = command;

        // A. Lấy toàn bộ lịch sử sự kiện từ Postgres Event Store
        const eventEntities = await this.eventStoreRepository.getEvents(accountId);
        if (eventEntities.length === 0) {
            throw new NotFoundException(`Không tìm thấy tài khoản tài chính với ID: ${accountId}`);
        }

        const historicalEvents = eventEntities.map((entity) => entity.payload);

        // B. Tái sinh thực thể cũ từ đống tro tàn lịch sử
        let account = new AccountAggregate();
        account.loadFromHistory(historicalEvents);

        // C. Bơm phép thuật CQRS NestJS vào
        account = this.publisher.mergeObjectContext(account);

        const expectedVersion = eventEntities[eventEntities.length - 1].sequenceNumber;

        // D. GỌI DOMAIN LOGIC: Chỗ này sẽ tự check xem tài khoản đủ số dư không.
        // Nếu không đủ, hàm này tự ném BadRequestException ngay tại đây!
        account.withdraw(accountId, amount, referenceId);

        // E. Trích xuất event mới sinh ra (MoneyWithdrawnEvent)
        const uncommittedEvents = account.getUncommittedEvents().map((event) => ({
            type: event.constructor.name,
            payload: event,
        }));

        // F. Lưu sự kiện rút tiền vào Postgres Event Store
        await this.eventStoreRepository.saveEvents(accountId, expectedVersion, uncommittedEvents);

        // G. Phát hành event sang RabbitMQ -> MongoDB đón nhận
        account.commit();
    }
}