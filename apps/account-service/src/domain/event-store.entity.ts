import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('event_store')
@Index(['aggregateId', 'sequenceNumber'], { unique: true })
export class EventStoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // Thêm dấu !

  @Column({ name: 'aggregate_id', type: 'varchar', length: 255 })
  @Index()
  aggregateId!: string; // Thêm dấu !

  @Column({ name: 'aggregate_type', type: 'varchar', length: 255 })
  aggregateType!: string; // Thêm dấu !

  @Column({ name: 'sequence_number', type: 'int' })
  sequenceNumber!: number; // Thêm dấu !

  @Column({ name: 'event_type', type: 'varchar', length: 255 })
  eventType!: string; // Thêm dấu !

  @Column({ type: 'jsonb' })
  payload!: any; // Thêm dấu !

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any; // Dấu ? vì trường này có thể nullable

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date; // Thêm dấu !
}
