import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';

@Module({
  imports: [],
  controllers: [NotificationController],
})
export class AppModule {}
