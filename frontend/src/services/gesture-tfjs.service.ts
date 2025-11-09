/**
 * TensorFlow.js-based gesture recognition service
 * Runs entirely in the browser - no backend Python dependency needed
 */

import * as tf from '@tensorflow/tfjs';

export interface GestureResult {
  gesture: 'YES' | 'NO' | 'NEUTRAL';
  confidence: number;
  probabilities: {
    YES: number;
    NO: number;
    NEUTRAL: number;
  };
}

export class GestureTFJSService {
  private static model: tf.LayersModel | null = null;
  private static loadingPromise: Promise<void> | null = null;
  private static readonly SEQUENCE_LENGTH = 15;
  private static readonly LABEL_NAMES = { 0: 'YES', 1: 'NO', 2: 'NEUTRAL' };

  /**
   * Load the TensorFlow.js model
   */
  static async loadModel(): Promise<void> {
    // If already loading, wait for that promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // If already loaded, return immediately
    if (this.model) {
      return Promise.resolve();
    }

    // Start loading
    this.loadingPromise = (async () => {
      try {
        console.log('[TFJS] Loading gesture recognition model...');
        
        // Try to load from public/models/tfjs_model
        // If that fails, fall back to a CDN or alternative location
        const modelUrl = '/models/tfjs_model/model.json';
        
        this.model = await tf.loadLayersModel(modelUrl);
        console.log('[TFJS] ✅ Model loaded successfully');
      } catch (error: any) {
        console.error('[TFJS] ❌ Failed to load model:', error);
        console.log('[TFJS] Falling back to backend prediction...');
        // Model will remain null, triggering fallback to backend
        throw error;
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Check if model is loaded
   */
  static isModelLoaded(): boolean {
    return this.model !== null;
  }

  /**
   * Predict gesture from sequence (runs in browser)
   */
  static async predictGesture(sequence: number[][]): Promise<GestureResult> {
    // Ensure model is loaded
    if (!this.model) {
      await this.loadModel();
    }

    if (!this.model) {
      throw new Error('Model not loaded. Please ensure the model files are available.');
    }

    // Validate input
    if (!sequence || sequence.length !== this.SEQUENCE_LENGTH) {
      throw new Error(`Invalid sequence length. Expected ${this.SEQUENCE_LENGTH}, got ${sequence?.length}`);
    }

    const featureCount = sequence[0]?.length;
    if (featureCount !== 9) {
      throw new Error(`Invalid feature dimensions. Expected 9, got ${featureCount}`);
    }

    try {
      // Convert to tensor: shape (1, 15, 9)
      const inputTensor = tf.tensor3d([sequence], [1, this.SEQUENCE_LENGTH, 9]);

      // Make prediction
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();

      // Clean up tensor
      inputTensor.dispose();
      prediction.dispose();

      // Get predicted class
      const predictedClass = Array.from(probabilities).indexOf(Math.max(...Array.from(probabilities)));
      const confidence = probabilities[predictedClass];

      // Map to label
      const gesture = this.LABEL_NAMES[predictedClass as keyof typeof this.LABEL_NAMES] as 'YES' | 'NO' | 'NEUTRAL';

      // Create probabilities object
      const probabilitiesObj = {
        YES: probabilities[0],
        NO: probabilities[1],
        NEUTRAL: probabilities[2],
      };

      return {
        gesture,
        confidence,
        probabilities: probabilitiesObj,
      };
    } catch (error: any) {
      console.error('[TFJS] Prediction error:', error);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }
}

