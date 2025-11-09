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
    console.log('[BACKEND] ========================================');
    console.log('[BACKEND] 📥 Received gesture prediction request');
    console.log('[BACKEND] User ID:', req.user?.uid);
    console.log('[BACKEND] Sequence length:', dto.sequence?.length);
    console.log('[BACKEND] First frame features:', dto.sequence?.[0]?.length);
    console.log('[BACKEND] Sample frame data:', dto.sequence?.[0]?.slice(0, 3));

    if (!this.gesturesService.isModelLoaded()) {
      console.log('[BACKEND] ❌ Model not loaded');
      return {
        success: false,
        error: 'Gesture recognition model is not loaded',
      };
    }

    try {
      console.log('[BACKEND] ✅ Model loaded, calling Python prediction script...');
      const result = await this.gesturesService.predictGesture(dto.sequence);
      console.log('[BACKEND] ✅ Prediction result:', {
        gesture: result.gesture,
        confidence: result.confidence,
        probabilities: result.probabilities,
      });
      console.log('[BACKEND] ========================================');
      return {
        success: true,
        ...result,
        userId: req.user.uid,
      };
    } catch (error: any) {
      console.error('[BACKEND] ❌ Prediction error:', error.message);
      console.error('[BACKEND] Error stack:', error.stack);
      console.log('[BACKEND] ========================================');
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

