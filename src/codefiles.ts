export interface CodeFile {
  name: string
  path: string
  language: string
  content: string
}

export const CODE_FILES: CodeFile[] = [
  {
    name: "docker-compose.yml",
    path: "docker-compose.yml",
    language: "yaml",
    content: `version: '3.9'

services:
  rabbitmq:
    image: rabbitmq:3.13-management
    container_name: rmq_broker
    ports:
      - "5672:5672"   # AMQP protocol
      - "15672:15672" # Management Plugin Web UI
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - rmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  producer:
    build:
      context: ./services/producer
      dockerfile: Dockerfile
    container_name: nest_producer
    ports:
      - "3001:3000"
    environment:
      PORT: 3000
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
      NODE_ENV: development
    depends_on:
      rabbitmq:
        condition: service_healthy

  consumer:
    build:
      context: ./services/consumer
      dockerfile: Dockerfile
    container_name: nest_consumer
    ports:
      - "3002:3000"
    environment:
      PORT: 3000
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
      NODE_ENV: development
    depends_on:
      rabbitmq:
        condition: service_healthy

  notification:
    build:
      context: ./services/notification
      dockerfile: Dockerfile
    container_name: nest_notification
    ports:
      - "3003:3000"
    environment:
      PORT: 3000
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
      TELEGRAM_BOT_TOKEN: \${TELEGRAM_BOT_TOKEN}
      TELEGRAM_CHAT_ID: \${TELEGRAM_CHAT_ID}
      NODE_ENV: development
    depends_on:
      rabbitmq:
        condition: service_healthy

volumes:
  rmq_data:
`
  },
  {
    name: "makefile",
    path: "makefile",
    language: "makefile",
    content: `.PHONY: up down build logs restart clean shell-rmq test

# Launch all microservices, RabbitMQ, and frontends in background mode
up:
	docker-compose up -d

# Stop all docker containers and networks
down:
	docker-compose down

# Rebuild all microservice Docker images
build:
	docker-compose build

# Clean and completely rebuild the Docker setup
up-build:
	docker-compose up --build -d

# Stream real-time diagnostic logs from all services
logs:
	docker-compose logs -f

# Gracefully restart the entire ecosystem
restart: down up

# Verify test cases across all microservices
test:
	cd services/producer && npm run test
	cd services/consumer && npm run test

# Full purge of containers, networks, and RabbitMQ persistent volumes
clean:
	docker-compose down -v
`
  },
  {
    name: "README.md",
    path: "README.md",
    language: "markdown",
    content: `# NestJS & RabbitMQ Microservices Workspace

This repository houses a highly scalable, SOLID-compliant microservices ecosystem built on NestJS (with Fastify) with RabbitMQ message queuing and the Telegram Bot API.

## Architecture Highlights
1. **Separation of Concerns (SOLID)**: Each microservice represents a single domain:
   - **Producer**: Handles HTTP ingestion with Swagger OpenAPI specs, validates inputs, attaches UUID-based idempotency tokens, and pushes raw tasks definition.
   - **Consumer**: Receives tasks, applies business logic, handles failures with retries, and publishes resolved notification commands.
   - **Notification**: Consumes messages and integrates with external Telegram Webhook endpoints.
2. **Idempotency**: Message IDs are tracked using UUID v4.
3. **Resilience**: RabbitMQ channels utilize manual acknowledgements (\`noAck: false\`), recovering with requeueing/retry structures on error.

## Running the Ecosystem

### Prerequisites
- Docker & Docker Compose
- Node.js >= 20.0.0 (for local development)

### Quick Start
1. Edit your environment variables in \`.env\`:
   \`\`\`env
   TELEGRAM_BOT_TOKEN="your-bot-token-here"
   TELEGRAM_CHAT_ID="your-chat-id-here"
   \`\`\`
2. Boot up the entire architecture using the Makefile:
   \`\`\`bash
   make up
   \`\`\`
3. Access RabbitMQ Management Dashboard at [http://localhost:15672](http://localhost:15672) (guest:guest).
4. Access Producer Swagger Documentation at [http://localhost:3001/api/docs](http://localhost:3001/api/docs).
`
  },
  {
    name: "package.json (Producer)",
    path: "services/producer/package.json",
    language: "json",
    content: `{
  "name": "producer-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "test": "jest",
    "test:cov": "jest --coverage"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/microservices": "^11.0.0",
    "@nestjs/platform-fastify": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "amqp-connection-manager": "^4.1.14",
    "amqplib": "^0.10.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/uuid": "^9.0.8",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "typescript": "^5.3.3"
  }
}`
  },
  {
    name: "main.ts (Producer)",
    path: "services/producer/src/main.ts",
    language: "typescript",
    content: `import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // Set Global Validation Pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Configure Swagger Options
  const config = new DocumentBuilder()
    .setTitle('Producer Event Ingestion API')
    .setDescription('Ingests REST payloads, provisions idempotency tokens, and forwards to RabbitMQ')
    .setVersion('1.0.0')
    .addTag('events')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(\`Producer is executing cleanly on http://localhost:\${port}/api/docs\`);
}
bootstrap();
`
  },
  {
    name: "app.module.ts (Producer)",
    path: "services/producer/src/app.module.ts",
    language: "typescript",
    content: `import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProducerController } from './producer.controller';
import { ProducerService } from './producer.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'tasks_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [ProducerController],
  providers: [ProducerService],
})
export class AppModule {}
`
  },
  {
    name: "send-event.dto.ts (Producer)",
    path: "services/producer/src/dto/send-event.dto.ts",
    language: "typescript",
    content: `import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEventDto {
  @ApiProperty({
    description: 'The title or tag describing the core task event',
    example: 'Process Order Notification',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'The detailed message/body corresponding to the target alert',
    example: 'Order #90514 has been packed and is ready to dispatch!',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({
    description: 'Optional metadata dictionary for consumer business processes',
    required: false,
    example: { priority: 'high', queueType: 'immediate' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
`
  },
  {
    name: "producer.controller.ts (Producer)",
    path: "services/producer/src/producer.controller.ts",
    language: "typescript",
    content: `import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProducerService } from './producer.service';
import { SendEventDto } from './dto/send-event.dto';

@ApiTags('Events')
@Controller('api/events')
export class ProducerController {
  private readonly logger = new Logger(ProducerController.name);

  constructor(private readonly producerService: ProducerService) {}

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Submit a message pipeline event' })
  @ApiResponse({ status: 202, description: 'Event queued and registered for brokering' })
  @ApiResponse({ status: 400, description: 'Invalid validation constraints met' })
  async sendEvent(@Body() dto: SendEventDto) {
    this.logger.log(\`Ingesting Web Request: \${dto.title}\`);
    const result = await this.producerService.publishToBroker(dto);
    return result;
  }
}
`
  },
  {
    name: "producer.service.ts (Producer)",
    path: "services/producer/src/producer.service.ts",
    language: "typescript",
    content: `import { Injectable, Inject, Logger } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { lastValueFrom } from 'rxjs';
import { SendEventDto } from './dto/send-event.dto';

@Injectable()
export class ProducerService {
  private readonly logger = new Logger(ProducerService.name);

  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly client: ClientProxy
  ) {}

  async publishToBroker(payload: SendEventDto) {
    // Generate UUID token strictly for idempotency and transaction mapping
    const transactionId = uuidv4();
    const messageEnvelope = {
      id: transactionId,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata || {},
      timestamp: new Date().toISOString(),
    };

    this.logger.log(\`Publishing package ID \${transactionId} to tasks_queue\`);

    try {
      // client.emit sends an event pattern message queue transaction securely to the queue
      await lastValueFrom(this.client.emit('process_task', messageEnvelope));
      
      this.logger.log(\`Confirmed execution packet delivery for UUID [\${transactionId}]\`);
      return {
        success: true,
        transactionId,
        destination: 'tasks_queue',
        payload: messageEnvelope,
      };
    } catch (error) {
      this.logger.error(\`Failed to broker message packet: \${error}\`);
      throw error;
    }
  }
}
`
  },
  {
    name: "package.json (Consumer)",
    path: "services/consumer/package.json",
    language: "json",
    content: `{
  "name": "consumer-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/microservices": "^11.0.0",
    "amqp-connection-manager": "^4.1.14",
    "amqplib": "^0.10.3",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.2",
    "typescript": "^5.3.3"
  }
}`
  },
  {
    name: "main.ts (Consumer)",
    path: "services/consumer/src/main.ts",
    language: "typescript",
    content: `import { NestFactory } from '@nestjs/core';
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
`
  },
  {
    name: "app.module.ts (Consumer)",
    path: "services/consumer/src/app.module.ts",
    language: "typescript",
    content: `import { Module } from '@nestjs/common';
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
`
  },
  {
    name: "consumer.controller.ts (Consumer)",
    path: "services/consumer/src/consumer.controller.ts",
    language: "typescript",
    content: `import { Controller, Logger, Inject } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext, ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller()
export class ConsumerController {
  private readonly logger = new Logger(ConsumerController.name);

  constructor(
    @Inject('NOTIFY_SERVICE') private readonly notifyClient: ClientProxy
  ) {}

  @MessagePattern('process_task')
  async consumeTask(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    this.logger.log(\`Received task broadcast. UUID: \${data.id}\`);

    try {
      // Parse payload content
      const { title, message, timestamp } = data;
      
      this.logger.log(\`Processing Payload: [\${title}] - \${message}\`);

      // Business logic goes here (e.g., db writes, calculations)...
      // Let's forward refined alert message downstream to the Telegram notifier
      const notificationPayload = {
        id: data.id,
        message: \`🔔 <b>\${title}</b>\n\n\${message}\n\n<i>Time: \${timestamp}</i>\`
      };

      await lastValueFrom(this.notifyClient.emit('send_tg_notification', notificationPayload));
      this.logger.log(\`Dispatched TG notification order to notify_queue. Payload: \${data.id}\`);

      // Manual Acknowledgment (ACK)
      channel.ack(originalMessage);
      this.logger.log(\`Successfully ACKed message transaction \${data.id}\`);
    } catch (error) {
      this.logger.error(\`Failed to resolve task \${data.id}: \${error}\`);
      
      // Error recovery policy: NACK with requeue=true to retry, or push to dead letter pipeline
      const hasRetried = originalMessage.fields.redelivered;
      if (!hasRetried) {
        this.logger.warn(\`NACK and requeueing event \${data.id} for secondary retry attempt.\`);
        channel.nack(originalMessage, false, true); // requeue = true
      } else {
        this.logger.error(\`Fatal retry threshold passed. NACK without requeueing to avoid infinite loop.\`);
        channel.nack(originalMessage, false, false); // discard or let go to Dead Letter Queue
      }
    }
  }
}
`
  },
  {
    name: "package.json (Notification)",
    path: "services/notification/package.json",
    language: "json",
    content: `{
  "name": "notification-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/microservices": "^11.0.0",
    "amqp-connection-manager": "^4.1.14",
    "amqplib": "^0.10.3",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "typescript": "^5.3.3"
  }
}`
  },
  {
    name: "main.ts (Notification)",
    path: "services/notification/src/main.ts",
    language: "typescript",
    content: `import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'notify_queue',
        noAck: false, // Explicit ACK required
        queueOptions: {
          durable: true,
        },
      },
    }
  );

  await app.listen();
  console.log('Notification Microservice is running and listening on: notify_queue');
}
bootstrap();
`
  },
  {
    name: "notification.controller.ts (Notification)",
    path: "services/notification/src/notification.controller.ts",
    language: "typescript",
    content: `import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  @MessagePattern('send_tg_notification')
  async dispatchTelegramNotification(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    this.logger.log(\`Received Notification command for ID: \${data.id}\`);

    const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (!tgBotToken || !tgChatId) {
      this.logger.warn('Skipping Telegram API delivery: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.');
      // Acknowledge anyway as this is a local setup issue, not packet failure
      channel.ack(originalMessage);
      return;
    }

    try {
      this.logger.log(\`Delivering messages payload to Telegram Chat: \${tgChatId}\`);
      
      const payloadUrl = \`https://api.telegram.org/bot\${tgBotToken}/sendMessage\`;
      const response = await fetch(payloadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: data.message,
          parse_mode: 'HTML',
        })
      });

      if (!response.ok) {
        throw new Error(\`Telegram Request returned: \${response.statusText} (\${response.status})\`);
      }

      this.logger.log(\`Successfully dispatched alert payload for UUID \${data.id}\`);
      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(\`Retries failed for alert \${data.id}: \${error}\`);
      // Retry delivery scheme on request failure
      channel.nack(originalMessage, false, true);
    }
  }
}
`
  }
]
