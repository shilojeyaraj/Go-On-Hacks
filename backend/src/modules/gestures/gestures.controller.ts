import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { GesturesService } from './gestures.service';

interface GesturePredictionDto {
  sequence: number[][]; // Array of frames, each frame has 9 features
}

@Controller('gestures')
@UseGuards(FirebaseAuthGuard)
export class GesturesController {
  constructor(private gesturesService: GesturesService) {}

  @Post('predict')
  async predictGesture(
    @Body() dto: GesturePredictionDto,
    @Request() req,
  ) {
    if (!this.gesturesService.isModelLoaded()) {
      return {
        success: false,
        error: 'Gesture recognition model is not loaded',
      };
    }

    try {
      const result = await this.gesturesService.predictGesture(dto.sequence);
      return {
        success: true,
        ...result,
        userId: req.user.uid,
      };
    } catch (error: any) {
      // Only log actual errors, not expected behavior
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('status')
  getStatus() {
    const isLoaded = this.gesturesService.isModelLoaded();
    console.log('[BACKEND] 📊 Status check - Model loaded:', isLoaded);
    return {
      modelLoaded: isLoaded,
    };
  }
}

