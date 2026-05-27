import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  @MessagePattern('send_tg_notification')
  async dispatchTelegramNotification(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    this.logger.log(`Received Notification command for ID: ${data.id}`);

    const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (!tgBotToken || !tgChatId) {
      this.logger.warn('Skipping Telegram API delivery: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.');
      // Acknowledge anyway as this is a local setup issue, not packet failure
      channel.ack(originalMessage);
      return;
    }

    try {
      this.logger.log(`Delivering messages payload to Telegram Chat: ${tgChatId}`);

      const payloadUrl = `https://api.telegram.org/bot${tgBotToken}/sendMessage`;
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
        throw new Error(`Telegram Request returned: ${response.statusText} (${response.status})`);
      }

      this.logger.log(`Successfully dispatched alert payload for UUID ${data.id}`);
      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(`Retries failed for alert ${data.id}: ${error}`);
      // Retry delivery scheme on request failure
      channel.nack(originalMessage, false, true);
    }
  }
}
