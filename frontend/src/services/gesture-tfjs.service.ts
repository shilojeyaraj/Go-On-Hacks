/**
 * TensorFlow.js-based gesture recognition service
 * Runs entirely in the browser - no backend Python dependency needed
 * 
 * Note: This service is optional. If TensorFlow.js is not available,
 * the system will automatically fall back to backend Python prediction.
 */

// Dynamic import to avoid breaking compilation if TensorFlow.js is not available
let tf: any = null;
let tfjsLoaded = false;

// Try to load TensorFlow.js dynamically
try {
  // Use require to avoid TypeScript compilation errors
  const tfjsModule = require('@tensorflow/tfjs');
  require('@tensorflow/tfjs-backend-webgl');
  tf = tfjsModule;
  tfjsLoaded = true;
} catch (e) {
  console.log('[TFJS] TensorFlow.js not available, will use backend fallback');
  tfjsLoaded = false;
}

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
  private static model: any = null;
  private static loadingPromise: Promise<void> | null = null;
  private static readonly SEQUENCE_LENGTH = 15;
  private static readonly LABEL_NAMES = { 0: 'YES', 1: 'NO', 2: 'NEUTRAL' };

  /**
   * Check if TensorFlow.js is available
   */
  static isAvailable(): boolean {
    return tfjsLoaded && tf !== null;
  }

  /**
   * Load the TensorFlow.js model
   */
  static async loadModel(): Promise<void> {
    // If TensorFlow.js is not available, don't try to load
    if (!this.isAvailable()) {
      throw new Error('TensorFlow.js is not available');
    }

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
        // Loading browser model silently
        
        // Try to load from public/models/tfjs_model
        // If that fails, fall back to backend Python prediction
        const modelUrl = '/models/tfjs_model/model.json';
        
        this.model = await tf.loadLayersModel(modelUrl);
        // Browser model loaded successfully
      } catch (error: any) {
        // This is expected if model hasn't been converted/deployed
        // Backend prediction will be used instead (which works perfectly)
        // Silent fallback - no logging needed
        // Model will remain null, triggering fallback to backend
        // Don't throw - let it fail silently since fallback works
        this.model = null;
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Check if model is loaded
   */
  static isModelLoaded(): boolean {
    return this.isAvailable() && this.model !== null;
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
      // Model not available - this will trigger backend fallback
      throw new Error('Browser model not available - backend fallback will be used');
    }

    // Validate input
    if (!sequence || sequence.length !== this.SEQUENCE_LENGTH) {
      throw new Error(`Invalid sequence length. Expected ${this.SEQUENCE_LENGTH}, got ${sequence?.length}`);
    }

    const featureCount = sequence[0]?.length;
    if (featureCount !== 9) {
      throw new Error(`Invalid feature dimensions. Expected 9, got ${featureCount}`);
    }

    if (!this.isAvailable() || !tf) {
      throw new Error('TensorFlow.js is not available');
    }

    try {
      // Convert to tensor: shape (1, 15, 9)
      const inputTensor = tf.tensor3d([sequence], [1, this.SEQUENCE_LENGTH, 9]);

      // Make prediction
      const prediction = this.model.predict(inputTensor);
      const probabilitiesArray = await prediction.data();

      // Clean up tensor
      inputTensor.dispose();
      prediction.dispose();

      // Convert Float32Array to regular number array for easier manipulation
      const probabilities: number[] = Array.from(probabilitiesArray as Float32Array | Int32Array);
      
      // Get predicted class
      const maxProb = Math.max(...probabilities);
      const predictedClass = probabilities.indexOf(maxProb);
      const confidence: number = probabilities[predictedClass] as number;

      // Map to label
      const gesture = this.LABEL_NAMES[predictedClass as keyof typeof this.LABEL_NAMES] as 'YES' | 'NO' | 'NEUTRAL';

      // Create probabilities object
      const probabilitiesObj = {
        YES: probabilities[0] as number,
        NO: probabilities[1] as number,
        NEUTRAL: probabilities[2] as number,
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

