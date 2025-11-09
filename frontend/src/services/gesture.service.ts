import { api } from '../shared/api';

export interface GestureResult {
  gesture: 'YES' | 'NO' | 'NEUTRAL';
  confidence: number;
  probabilities: {
    YES: number;
    NO: number;
    NEUTRAL: number;
  };
}

export class GestureService {
  /**
   * Predict gesture from a sequence of facial landmark features
   * @param sequence Array of frames, each frame has 9 features [3 vertical_y, 3 horizontal_x, 3 vertical_z]
   */
  static async predictGesture(sequence: number[][]): Promise<GestureResult> {
    try {
      const response = await api.post('/gestures/predict', { sequence });
      
      if (!response.data.success) {
        console.error('[GestureService] Prediction failed:', response.data.error);
        throw new Error(response.data.error || 'Gesture prediction failed');
      }
      
      const result = {
        gesture: response.data.gesture,
        confidence: response.data.confidence,
        probabilities: response.data.probabilities,
      };
      
      return result;
    } catch (error: any) {
      console.error('[GestureService] ❌ Request failed:', error.message);
      console.error('[GestureService] Error details:', error);
      throw error;
    }
  }

  /**
   * Check if gesture recognition model is loaded
   */
  static async checkStatus(): Promise<boolean> {
    try {
      console.log('[GestureService] Checking backend model status...');
      const response = await api.post('/gestures/status');
      const isLoaded = response.data.modelLoaded === true;
      console.log('[GestureService] Backend model status:', isLoaded ? '✅ Loaded' : '❌ Not loaded');
      return isLoaded;
    } catch (error: any) {
      console.error('[GestureService] ❌ Status check failed:', error.message);
      return false;
    }
  }
}

