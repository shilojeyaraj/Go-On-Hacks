import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class GesturesService implements OnModuleInit {
  private labelNames = { 0: 'YES', 1: 'NO', 2: 'NEUTRAL' };
  private sequenceLength = 15;

  async onModuleInit() {
    await this.loadModel();
  }

  private async loadModel() {
    try {
      // Path from backend/dist/modules/gestures/ to root/ml-models/models/
      const modelPath = path.join(
        __dirname,
        '../../../../ml-models/models/gesture_classifier.h5',
      );
      
      // Check if model exists
      if (!fs.existsSync(modelPath)) {
        console.warn(`Model not found at ${modelPath}. Gesture recognition will be disabled.`);
        return;
      }

      // Load the model using TensorFlow.js
      // Note: We need to convert H5 to TensorFlow.js format or use a different approach
      // For now, we'll use a Python subprocess approach or convert the model
      console.log('Loading gesture recognition model...');
      
      // Alternative: Use Python script to run predictions
      // This is a workaround since TensorFlow.js doesn't directly support H5 files
      console.log('Model loading initialized. Using Python backend for predictions.');
    } catch (error) {
      console.error('Error loading gesture model:', error);
    }
  }

  async predictGesture(sequence: number[][]): Promise<{
    gesture: string;
    confidence: number;
    probabilities: Record<string, number>;
  }> {
    console.log('[BACKEND] predictGesture called');
    console.log('[BACKEND] Sequence length:', sequence?.length);
    console.log('[BACKEND] Expected length:', this.sequenceLength);

    if (!sequence || sequence.length !== this.sequenceLength) {
      console.error(`[BACKEND] ❌ Invalid sequence length. Expected ${this.sequenceLength}, got ${sequence?.length}`);
      throw new Error(
        `Invalid sequence length. Expected ${this.sequenceLength}, got ${sequence?.length}`,
      );
    }

    // Validate feature dimensions (should be 9 features per frame)
    const featureCount = sequence[0]?.length;
    console.log('[BACKEND] Feature count per frame:', featureCount);
    if (featureCount !== 9) {
      console.error(`[BACKEND] ❌ Invalid feature dimensions. Expected 9, got ${featureCount}`);
      throw new Error(
        `Invalid feature dimensions. Expected 9 features per frame, got ${featureCount}`,
      );
    }

    console.log('[BACKEND] ✅ Validation passed, calling Python script...');
    // Use Python script to run prediction
    // This is necessary because TensorFlow.js doesn't support H5 files directly
    return this.predictWithPython(sequence);
  }

  private async predictWithPython(sequence: number[][]): Promise<{
    gesture: string;
    confidence: number;
    probabilities: Record<string, number>;
  }> {
    const { spawn } = require('child_process');
    // Path from backend/dist/modules/gestures/ to root/ml-models/predict_gesture.py
    const pythonScript = path.join(
      __dirname,
      '../../../../ml-models/predict_gesture.py',
    );

    console.log('[BACKEND] Python script path:', pythonScript);
    console.log('[BACKEND] Checking if script exists...');
    if (!fs.existsSync(pythonScript)) {
      console.error('[BACKEND] ❌ Python script not found at:', pythonScript);
      throw new Error(`Python script not found at ${pythonScript}`);
    }
    console.log('[BACKEND] ✅ Python script found');

    const sequenceJson = JSON.stringify(sequence);
    console.log('[BACKEND] Spawning Python process...');
    console.log('[BACKEND] Command: python', pythonScript, '[sequence data]');

    return new Promise((resolve, reject) => {
      const python = spawn('python', [pythonScript, sequenceJson]);

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        const dataStr = data.toString();
        console.log('[BACKEND] Python stdout:', dataStr);
        output += dataStr;
      });

      python.stderr.on('data', (data) => {
        const dataStr = data.toString();
        console.log('[BACKEND] Python stderr:', dataStr);
        errorOutput += dataStr;
      });

      python.on('close', (code) => {
        console.log('[BACKEND] Python process exited with code:', code);
        console.log('[BACKEND] Python output:', output);
        console.log('[BACKEND] Python errors:', errorOutput);

        if (code !== 0) {
          console.error('[BACKEND] ❌ Python script failed with code:', code);
          reject(new Error(`Python script failed: ${errorOutput || 'Unknown error'}`));
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          console.log('[BACKEND] ✅ Parsed result:', result);
          resolve(result);
        } catch (error: any) {
          console.error('[BACKEND] ❌ Failed to parse JSON:', error.message);
          console.error('[BACKEND] Raw output:', output);
          reject(new Error(`Failed to parse prediction result: ${error.message}. Output: ${output.substring(0, 200)}`));
        }
      });

      python.on('error', (error) => {
        console.error('[BACKEND] ❌ Failed to spawn Python process:', error);
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  isModelLoaded(): boolean {
    return true; // Python backend is always available if Python is installed
  }
}

