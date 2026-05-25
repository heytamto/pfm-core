import { Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RABBITMQ_SERVICE } from './constants';

@Module({})
export class CoreModule {
  // Hàm này giúp các service con (Account, Transaction...) chỉ cần gọi CoreModule.registerRabbitMQ() là xong
  static registerRabbitMQ(queueName: string): DynamicModule {
    return {
      module: CoreModule,
      imports: [
        ClientsModule.register([
          {
            name: RABBITMQ_SERVICE,
            transport: Transport.RMQ,
            options: {
              urls: ['amqp://guest:guest@localhost:5672'], // URL kết nối tới container RabbitMQ
              queue: queueName,
              queueOptions: {
                durable: true, // Đảm bảo hàng đợi không bị mất khi RabbitMQ restart
              },
              socketOptions: {
                heartbeatIntervalInSeconds: 60,
                reconnectTimeInSeconds: 5, // Tự động kết nối lại sau 5 giây nếu rớt mạng
              },
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}