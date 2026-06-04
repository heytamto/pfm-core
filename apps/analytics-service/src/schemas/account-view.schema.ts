import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountViewDocument = AccountView & Document;

@Schema({ collection: 'account_views', timestamps: true }) // 🟢 Mongoose tự động kích hoạt tạo/cập nhật createdAt và updatedAt
export class AccountView {
  @Prop({ required: true, unique: true })
  accountId!: string;

  @Prop({ required: true })
  accountName!: string;

  @Prop({ required: true, default: 0 })
  balance!: number;

  @Prop({ required: true })
  currency!: string;

  @Prop({ default: 0 })
  version!: number; // Dùng để bảo vệ thứ tự của Event khi ghi vào Mongo

  // 🟢 KHAI BÁO TƯỜNG MINH ĐỂ TYPESCRIPT NHẬN BIẾT
  createdAt!: Date;
  updatedAt!: Date;
}

export const AccountViewSchema = SchemaFactory.createForClass(AccountView);