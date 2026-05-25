import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AnalyticsService_Main');

  // Khởi tạo một ứng dụng Microservice thuần túy lắng nghe RabbitMQ (Hàng đợi 'analytics_queue')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@localhost:5672'],
      queue: 'analytics_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Kích hoạt Microservice bắt đầu lắng nghe hàng đợi
  await app.listen();
  
  logger.log(`📊 [Read Side] Analytics Microservice đang chạy ngầm...`);
  logger.log(`🐇 [Queue Side] Đang kết nối và lắng nghe RabbitMQ hàng đợi 'analytics_queue'...`);
}

// Chạy kích hoạt hệ thống
void bootstrap();