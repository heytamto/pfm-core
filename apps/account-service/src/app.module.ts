import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config'; // 1. Import ConfigModule
import { CoreModule } from '@app/core';

import { EventStoreEntity } from './domain/event-store.entity';
import { EventStoreRepository } from './domain/event-store.repository';
import { CommandHandlers } from './commands';
import { AccountController } from './controllers/account.controller';
import { AppController } from './controllers/app.controller';
import { AccountEventHandler } from './events/account-event.handler';

@Module({
    imports: [
        // 2. Kích hoạt ConfigModule toàn cục để đọc file .env ở thư mục gốc
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        CqrsModule.forRoot(),

        // 3. Thay cấu hình cứng bằng các biến process.env
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DB,
            entities: [EventStoreEntity],
            synchronize: true, // Chỉ bật ở môi trường Dev
            logging: false,
        }),

        TypeOrmModule.forFeature([EventStoreEntity]),
        CoreModule.registerRabbitMQ('account_queue'),
    ],
    controllers: [AccountController, AppController],
    providers: [
        EventStoreRepository,
        ...CommandHandlers,
        AccountEventHandler,
    ],
})
export class AppModule { }