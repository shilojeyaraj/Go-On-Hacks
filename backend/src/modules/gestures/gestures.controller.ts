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
<<<<<<< HEAD
    console.log('[BACKEND] ========================================');
    console.log('[BACKEND] 📥 Received gesture prediction request');
    console.log('[BACKEND] User ID:', req.user?.uid);
    console.log('[BACKEND] Sequence length:', dto.sequence?.length, 'frames');
    console.log('[BACKEND] Features per frame:', dto.sequence?.[0]?.length);

    if (!this.gesturesService.isModelLoaded()) {
      console.log('[BACKEND] ❌ Model not loaded');
=======
    if (!this.gesturesService.isModelLoaded()) {
>>>>>>> 687a511 (Improve gesture detection: reduce logging, add pattern detection, and optimize performance)
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
<<<<<<< HEAD
      console.error('[BACKEND] ❌ Prediction error:', error.message);
      console.error('[BACKEND] Error stack:', error.stack);
      console.log('[BACKEND] ========================================');
=======
      // Only log actual errors, not expected behavior
>>>>>>> 687a511 (Improve gesture detection: reduce logging, add pattern detection, and optimize performance)
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

