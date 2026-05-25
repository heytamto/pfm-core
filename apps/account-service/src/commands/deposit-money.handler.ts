import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStoreRepository } from '../domain/event-store.repository';
import { AccountAggregate } from '../domain/account.aggregate';

// 1. Định nghĩa Command nạp tiền
export class DepositMoneyCommand {
  constructor(
    public readonly accountId: string,
    public readonly amount: number,
    public readonly referenceId: string,
  ) {}
}

// 2. Handler xử lý lệnh nạp tiền
@CommandHandler(DepositMoneyCommand)
@Injectable()
export class DepositMoneyHandler implements ICommandHandler<DepositMoneyCommand> {
  constructor(
    private readonly eventStoreRepository: EventStoreRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: DepositMoneyCommand): Promise<void> {
    const { accountId, amount, referenceId } = command;

    // Bước A: Lấy toàn bộ lịch sử sự kiện của tài khoản này từ Postgres Event Store
    const eventEntities = await this.eventStoreRepository.getEvents(accountId);
    if (eventEntities.length === 0) {
      throw new NotFoundException(`Không tìm thấy tài khoản tài chính với ID: ${accountId}`);
    }

    // Bước B: Trích xuất mảng payload (các Event nguyên bản) từ các Entity DB
    const historicalEvents = eventEntities.map((entity) => entity.payload);

    // Bước C: Hồi sinh (Rehydrate) Aggregate bằng cách nạp lại lịch sử sự kiện
    let account = new AccountAggregate();
    account.loadFromHistory(historicalEvents);

    // Bước D: Bơm context CQRS của NestJS vào thực thể đã hồi sinh
    account = this.publisher.mergeObjectContext(account);

    // Lấy ra version hiện tại của Event cuối cùng để làm Optimistic Concurrency Control
    const expectedVersion = eventEntities[eventEntities.length - 1].sequenceNumber;

    // Bước E: Gọi Domain Logic nạp tiền (Hàm này tự sinh ra MoneyDepositedEvent bên trong)
    account.deposit(amount, referenceId);

    // Bước F: Trích xuất event mới sinh ra để chuẩn bị ghi xuống đĩa
    const uncommittedEvents = account.getUncommittedEvents().map((event) => ({
      type: event.constructor.name,
      payload: event,
    }));

    // Bước G: Lưu event nạp tiền mới vào Postgres Event Store
    await this.eventStoreRepository.saveEvents(accountId, expectedVersion, uncommittedEvents);

    // Bước H: Bắn event qua RabbitMQ để bên Analytics (MongoDB) cập nhật số dư phẳng
    account.commit();
  }
}