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
    console.log('[TFJS] Starting gesture prediction');
    console.log('[TFJS] Model loaded:', this.model !== null);
    
    // Ensure model is loaded
    if (!this.model) {
      console.log('[TFJS] Model not loaded, attempting to load...');
      await this.loadModel();
    }

    if (!this.model) {
      console.error('[TFJS] ❌ Model still not loaded after load attempt');
      throw new Error('Model not loaded. Please ensure the model files are available.');
    }

    // Validate input
    if (!sequence || sequence.length !== this.SEQUENCE_LENGTH) {
      console.error('[TFJS] ❌ Invalid sequence length:', sequence?.length, 'expected:', this.SEQUENCE_LENGTH);
      throw new Error(`Invalid sequence length. Expected ${this.SEQUENCE_LENGTH}, got ${sequence?.length}`);
    }

    const featureCount = sequence[0]?.length;
    if (featureCount !== 9) {
      console.error('[TFJS] ❌ Invalid feature dimensions:', featureCount, 'expected: 9');
      throw new Error(`Invalid feature dimensions. Expected 9, got ${featureCount}`);
    }

    console.log('[TFJS] Input validated, creating tensor...');
    console.log('[TFJS] Sample frame data:', sequence[0]?.slice(0, 3));

    try {
      // Convert to tensor: shape (1, 15, 9)
      const inputTensor = tf.tensor3d([sequence], [1, this.SEQUENCE_LENGTH, 9]);
      console.log('[TFJS] Tensor created, shape:', inputTensor.shape);

      // Make prediction
      console.log('[TFJS] Running model prediction...');
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();
      console.log('[TFJS] Raw probabilities:', Array.from(probabilities));

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

      const result = {
        gesture,
        confidence,
        probabilities: probabilitiesObj,
      };

      console.log('[TFJS] ✅ Prediction complete:', result);
      return result;
    } catch (error: any) {
      console.error('[TFJS] ❌ Prediction error:', error);
      console.error('[TFJS] Error stack:', error.stack);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }
}

