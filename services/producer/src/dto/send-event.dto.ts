import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
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
