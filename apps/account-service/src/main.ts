import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AccountService_Main');
  
  // 1. Khởi tạo ứng dụng NestJS dạng HTTP truyền thống (Dành cho API Endpoint)
  const app = await NestFactory.create(AppModule);

  // Cấu hình ValidationPipe toàn cục để tự động bắt lỗi dữ liệu API đầu vào (Dùng class-validator)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Cấu hình Prefix cho toàn bộ API (Ví dụ: http://localhost:3000/api/v1/...)
  app.setGlobalPrefix('api/v1');

  // Đọc cấu hình từ file .env (được fallback giá trị mặc định nếu lỡ quên khai báo)
  const rmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const port = parseInt(process.env.ACCOUNT_SERVICE_PORT || '3000', 10);

  // 2. Biến ứng dụng thành Hybrid: Kết nối thêm cổng lắng nghe RabbitMQ lấy từ biến môi trường
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'account_queue',
      queueOptions: {
        durable: true, // Hàng đợi không bị mất khi restart broker
      },
    },
  });

  // 3. Kích hoạt lắng nghe song song cả Microservice và cổng HTTP
  await app.startAllMicroservices();
  
  await app.listen(port);
  
  logger.log(`🚀 [Write Side] Account Microservice đang chạy tại cổng HTTP: ${port}`);
  logger.log(`🐇 [Queue Side] Đang kết nối và lắng nghe RabbitMQ hàng đợi 'account_queue'...`);
}

// Chạy kích hoạt hệ thống
void bootstrap();