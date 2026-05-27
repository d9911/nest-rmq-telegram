import { Controller, Logger, Inject } from '@nestjs/common';
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

    this.logger.log(`Received task broadcast. UUID: ${data.id}`);

    try {
      // Parse payload content
      const { title, message, timestamp } = data;

      this.logger.log(`Processing Payload: [${title}] - ${message}`);

      // Business logic goes here (e.g., db writes, calculations)...
      // Let's forward refined alert message downstream to the Telegram notifier
      const notificationPayload = {
        id: data.id,
        message: `🔔 <b>${title}</b>\n\n${message}\n\n<i>Time: ${timestamp}</i>`
      };

      await lastValueFrom(this.notifyClient.emit('send_tg_notification', notificationPayload));
      this.logger.log(`Dispatched TG notification order to notify_queue. Payload: ${data.id}`);

      // Manual Acknowledgment (ACK)
      channel.ack(originalMessage);
      this.logger.log(`Successfully ACKed message transaction ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to resolve task ${data.id}: ${error}`);

      // Error recovery policy: NACK with requeue=true to retry, or push to dead letter pipeline
      const hasRetried = originalMessage.fields.redelivered;
      if (!hasRetried) {
        this.logger.warn(`NACK and requeueing event ${data.id} for secondary retry attempt.`);
        channel.nack(originalMessage, false, true); // requeue = true
      } else {
        this.logger.error(`Fatal retry threshold passed. NACK without requeueing to avoid infinite loop.`);
        channel.nack(originalMessage, false, false); // discard or let go to Dead Letter Queue
      }
    }
  }
}
