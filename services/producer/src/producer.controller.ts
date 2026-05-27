import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
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
    this.logger.log(`Ingesting Web Request: ${dto.title}`);
    const result = await this.producerService.publishToBroker(dto);
    return result;
  }
}
