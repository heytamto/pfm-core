import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStoreRepository } from '../domain/event-store.repository';
import { AccountAggregate } from '../domain/account.aggregate';

// 1. Định nghĩa Command (Dữ liệu đầu vào)
export class DepositMoneyCommand {
  constructor(
    public readonly accountId: string,
    public readonly amount: number,
    public readonly referenceId: string,
  ) {}
}

// 2. Viết Handler xử lý Command
@CommandHandler(DepositMoneyCommand)
@Injectable()
export class DepositMoneyHandler implements ICommandHandler<DepositMoneyCommand> {
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly publisher: EventPublisher, // Công cụ của NestJS để bind EventBus vào Aggregate
  ) {}

  async execute(command: DepositMoneyCommand): Promise<void> {
    const { accountId, amount, referenceId } = command;

    // Bước A: Lấy toàn bộ lịch sử sự kiện từ Postgres Event Store
    const eventEntities = await this.eventStoreRepository.getEvents(accountId);
    if (eventEntities.length === 0) {
      throw new NotFoundException(`Không tìm thấy tài khoản tài chính với ID: ${accountId}`);
    }

    // Bước B: Chuyển đổi Entity DB thành các Class Event nguyên bản
    const historicalEvents = eventEntities.map((entity) => entity.payload);

    // Bước C: Khởi tạo Aggregate và nạp lịch sử để "Hồi sinh" (Rehydrate) trạng thái số dư
    // Senior sử dụng mergeObjectContext của NestJS để Aggregate có thể tự động bắn Event sang RabbitMQ/EventBus sau này
    const account = this.publisher.mergeObjectContext(new AccountAggregate());
    account.loadFromHistory(historicalEvents);

    // Lưu lại phiên bản hiện tại trước khi thay đổi (Dùng cho Optimistic Concurrency Control)
    const expectedVersion = eventEntities[eventEntities.length - 1].sequenceNumber;

    // Bước D: Gọi Domain Logic để thực hiện nạp tiền (Aggregate tự sinh ra MoneyDepositedEvent bên trong)
    account.deposit(amount, referenceId);

    // Bước E: Lấy các Event mới sinh ra để lưu vật lý xuống Event Store
    const uncommittedEvents = account.getUncommittedEvents().map((event) => ({
      type: event.constructor.name,
      payload: event,
    }));

    await this.eventStoreRepository.saveEvents(accountId, expectedVersion, uncommittedEvents);

    // Bước F: Chính thức phát hành (Publish) Event lên EventBus/RabbitMQ để bên Read Model (MongoDB) cập nhật số dư
    account.commit();
  }
}