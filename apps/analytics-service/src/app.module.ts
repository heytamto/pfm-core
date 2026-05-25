import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreModule } from '@app/core'; // Kế thừa cấu hình RabbitMQ từ Shared Library
import { AccountView, AccountViewSchema } from './schemas/account-view.schema';
import { AccountConsumerController } from './controllers/account-consumer.controller';

@Module({
  imports: [
    // 1. Kết nối tới container MongoDB
    MongooseModule.forRoot('mongodb://tam_admin:tam_secure_password@localhost:27017/pfm_analytics?authSource=admin'),

    // 2. Đăng ký Schema cho Module này sử dụng
    MongooseModule.forFeature([{ name: AccountView.name, schema: AccountViewSchema }]),

    // 3. Đăng ký lắng nghe hàng đợi RabbitMQ từ Shared module
    CoreModule.registerRabbitMQ('analytics_queue'),
  ],
  controllers: [AccountConsumerController], // Đăng ký Consumer để kích hoạt lắng nghe event
  providers: [],
})
export class AppModule {}
