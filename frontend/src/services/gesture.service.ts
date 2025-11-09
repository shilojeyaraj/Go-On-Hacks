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
    const response = await api.post('/gestures/predict', { sequence });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Gesture prediction failed');
    }
    
    return {
      gesture: response.data.gesture,
      confidence: response.data.confidence,
      probabilities: response.data.probabilities,
    };
  }

  /**
   * Check if gesture recognition model is loaded
   */
  static async checkStatus(): Promise<boolean> {
    try {
      const response = await api.post('/gestures/status');
      return response.data.modelLoaded === true;
    } catch {
      return false;
    }
  }
}

