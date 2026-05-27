import { Injectable, Inject, Logger } from '@nestjs/common';
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

    this.logger.log(`Publishing package ID ${transactionId} to tasks_queue`);

    try {
      // client.emit sends an event pattern message queue transaction securely to the queue
      await lastValueFrom(this.client.emit('process_task', messageEnvelope));

      this.logger.log(`Confirmed execution packet delivery for UUID [${transactionId}]`);
      return {
        success: true,
        transactionId,
        destination: 'tasks_queue',
        payload: messageEnvelope,
      };
    } catch (error) {
      this.logger.error(`Failed to broker message packet: ${error}`);
      throw error;
    }
  }
}
