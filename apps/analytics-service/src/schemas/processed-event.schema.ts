// apps/analytics-service/src/schemas/processed-event.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ProcessedEvent extends Document {
    @Prop({ required: true, unique: true }) // Khóa unique để DB tự chặn nếu ghi trùng
    referenceId!: string;

    @Prop({ required: true })
    eventName!: string;
}

export const ProcessedEventSchema = SchemaFactory.createForClass(ProcessedEvent);
// Tạo index để tìm kiếm siêu tốc
ProcessedEventSchema.index({ referenceId: 1 }, { unique: true });