import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventStoreEntity } from './event-store.entity';

@Injectable()
export class EventStoreRepository {
  constructor(
    @InjectRepository(EventStoreEntity)
    private readonly repository: Repository<EventStoreEntity>,
    private readonly dataSource: DataSource, // Dùng để mở Transaction thủ công
  ) {}

  // 1. Hàm đọc lịch sử Event để Rehydrate
  async getEvents(aggregateId: string): Promise<EventStoreEntity[]> {
    return this.repository.find({
      where: { aggregateId, aggregateType: 'Account' },
      order: { sequenceNumber: 'ASC' }, // Bắt buộc phải sắp xếp tăng dần
    });
  }

  // 2. Hàm ghi Event mới (Bọc trong Transaction phòng trường hợp 1 hành động sinh ra nhiều Event)
  async saveEvents(
    aggregateId: string,
    expectedVersion: number,
    events: Array<{ type: string; payload: any }>,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let currentVersion = expectedVersion;

      for (const event of events) {
        currentVersion++;

        const eventEntity = new EventStoreEntity();
        eventEntity.aggregateId = aggregateId;
        eventEntity.aggregateType = 'Account';
        eventEntity.sequenceNumber = currentVersion;
        eventEntity.eventType = event.type;
        eventEntity.payload = event.payload;
        eventEntity.metadata = { traceId: 'fake-trace-id' }; // Sau này nhúng OpenTelemetry vào đây

        await queryRunner.manager.save(eventEntity);
      }

      await queryRunner.commitTransaction();
    } catch (error: unknown) {
      // Khai báo rõ ràng kiểu unknown
      await queryRunner.rollbackTransaction();

      // Tư duy Senior: Ép kiểu hoặc kiểm tra xem error có phải là Object và có thuộc tính 'code' không
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        throw new ConflictException('Tranh chấp dữ liệu (Concurrency Conflict). Vui lòng thử lại hành động!');
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
