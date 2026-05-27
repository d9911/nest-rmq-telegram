import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // Bind as a high performance low-latency background microservice listener
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'tasks_queue',
        noAck: false, // Forces manual ACK to prevent accidental data loss
        queueOptions: {
          durable: true,
        },
      },
    }
  );

  await app.listen();
  console.log('Consumer Microservice started successfully listening to: tasks_queue');
}
bootstrap();
