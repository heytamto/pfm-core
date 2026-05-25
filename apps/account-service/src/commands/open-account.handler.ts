import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Injectable, ConflictException } from '@nestjs/common';
import { EventStoreRepository } from '../domain/event-store.repository';
import { AccountAggregate } from '../domain/account.aggregate';

export class OpenAccountCommand {
  constructor(
    public readonly accountId: string,
    public readonly accountName: string,
    public readonly currency: string,
  ) {}
}

@CommandHandler(OpenAccountCommand)
@Injectable()
export class OpenAccountHandler implements ICommandHandler<OpenAccountCommand> {
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: OpenAccountCommand): Promise<void> {
    const { accountId, accountName, currency } = command;

    // 1. Check xem tài khoản đã từng tồn tại trong Event Store chưa
    const existingEvents = await this.eventStoreRepository.getEvents(accountId);
    if (existingEvents.length > 0) {
      throw new ConflictException(`Tài khoản với ID ${accountId} đã tồn tại rồi!`);
    }

    // 2. CHUẨN STATIC: Gọi trực tiếp từ Class để sinh ra thực thể kèm Event bên trong
    const initialBalance = 0;
    const rawAccount = AccountAggregate.open(accountId, accountName, currency, initialBalance);

    // 3. Bơm context CQRS của NestJS vào thực thể vừa tạo
    const account = this.publisher.mergeObjectContext(rawAccount);

    // 4. Trích xuất Event để chuẩn bị lưu vật lý xuống DB
    const uncommittedEvents = account.getUncommittedEvents().map((event) => ({
      type: event.constructor.name,
      payload: event,
    }));

    // 5. Lưu Event đầu tiên (Sequence Number = 1) vào Postgres
    // Phiên bản kỳ vọng ban đầu là 0
    await this.eventStoreRepository.saveEvents(accountId, 0, uncommittedEvents);

    // 6. Phát tán Event đi sang RabbitMQ -> MongoDB
    account.commit();
  }
}