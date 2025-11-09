import { Module } from '@nestjs/common';
import { GesturesController } from './gestures.controller';
import { GesturesService } from './gestures.service';

@Module({
  controllers: [GesturesController],
  providers: [GesturesService],
  exports: [GesturesService],
})
export class GesturesModule {}

