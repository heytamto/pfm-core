import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config'; // 1. Import ConfigModule
import { CoreModule } from '@app/core';
import { AccountView, AccountViewSchema } from './schemas/account-view.schema';
import { AccountConsumerController } from './controllers/account-consumer.controller';

@Module({
    imports: [
        // 2. Kích hoạt ConfigModule toàn cục
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // 3. Sử dụng biến môi trường lấy URI kết nối Mongo
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/pfm_analytics'),

        MongooseModule.forFeature([{ name: AccountView.name, schema: AccountViewSchema }]),
        CoreModule.registerRabbitMQ('account_queue'),
    ],
    controllers: [AccountConsumerController],
    providers: [],
})
export class AppModule { }