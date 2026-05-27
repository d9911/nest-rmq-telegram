import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConsumerController } from './consumer.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFY_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'notify_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [ConsumerController],
})
export class AppModule {}
