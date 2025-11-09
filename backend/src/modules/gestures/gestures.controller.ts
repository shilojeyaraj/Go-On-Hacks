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
    console.log('[BACKEND] Received gesture prediction request');
    console.log('[BACKEND] User ID:', req.user?.uid);
    console.log('[BACKEND] Sequence length:', dto.sequence?.length, 'frames');
    console.log('[BACKEND] Features per frame:', dto.sequence?.[0]?.length);

    if (!this.gesturesService.isModelLoaded()) {
      console.log('[BACKEND] Model not loaded');
      return {
        success: false,
        error: 'Gesture recognition model is not loaded',
      };
    }

    try {
      console.log('[BACKEND] Calling Python prediction script with gesture_classifier.h5...');
      const result = await this.gesturesService.predictGesture(dto.sequence);
      console.log('[BACKEND] Prediction result:', {
        gesture: result.gesture,
        confidence: Number(result.confidence.toFixed(3)),
        probabilities: result.probabilities
      });
      return {
        success: true,
        ...result,
        userId: req.user.uid,
      };
    } catch (error: any) {
      console.error('[BACKEND] Prediction error:', error.message);
      console.error('[BACKEND] Error stack:', error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('status')
  getStatus() {
    return {
      modelLoaded: this.gesturesService.isModelLoaded(),
    };
  }
}

