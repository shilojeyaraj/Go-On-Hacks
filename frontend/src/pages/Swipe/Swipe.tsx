import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { api } from '../../shared/api';
import './Swipe.css';

// Note: MediaPipe will be loaded via CDN script tag
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

interface GestureResult {
  gesture: 'YES' | 'NO' | 'NEUTRAL';
  confidence: number;
  probabilities: {
    YES: number;
    NO: number;
    NEUTRAL: number;
  };
}

export const Swipe: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [gestureResult, setGestureResult] = useState<GestureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bufferStatus, setBufferStatus] = useState(0);
  
  const frameBufferRef = useRef<number[][]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const faceMeshRef = useRef<any>(null);

  const SEQUENCE_LENGTH = 15;
  const PREDICTION_INTERVAL = 500; // Predict every 500ms
  const lastPredictionTime = useRef<number>(0);

  // Initialize MediaPipe Face Mesh
  useEffect(() => {
    const loadMediaPipe = () => {
      // Load MediaPipe from CDN
      if (window.FaceMesh) {
        const faceMesh = new window.FaceMesh({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          },
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMeshRef.current = faceMesh;
      } else {
        // Load script if not already loaded
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh';
        script.onload = () => {
          if (window.FaceMesh) {
            const faceMesh = new window.FaceMesh({
              locateFile: (file: string) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
              },
            });

            faceMesh.setOptions({
              maxNumFaces: 1,
              refineLandmarks: true,
              minDetectionConfidence: 0.5,
              minTrackingConfidence: 0.5,
            });

            faceMeshRef.current = faceMesh;
          }
        };
        script.onerror = () => {
          setError('Failed to load MediaPipe. Please check your internet connection.');
        };
        document.head.appendChild(script);
      }
    };

    loadMediaPipe();
  }, []);

  // Extract landmarks from frame (matching training extraction)
  const extractLandmarks = useCallback((results: any): number[] | null => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return null;
    }

    const faceLandmarks = results.multiFaceLandmarks[0];
    
    // Vertical landmarks (YES - nodding): 1 (nose), 10 (forehead), 152 (chin)
    const verticalLandmarks = [1, 10, 152];
    
    // Horizontal landmarks (NO - shaking): 1 (nose), 33 (left eye), 263 (right eye)
    const horizontalLandmarks = [1, 33, 263];

    const verticalPositions: number[][] = [];
    const horizontalPositions: number[][] = [];

    verticalLandmarks.forEach((idx) => {
      const landmark = faceLandmarks[idx];
      verticalPositions.push([landmark.x, landmark.y, landmark.z]);
    });

    horizontalLandmarks.forEach((idx) => {
      const landmark = faceLandmarks[idx];
      horizontalPositions.push([landmark.x, landmark.y, landmark.z]);
    });

    // Compute movement-focused features (matching training)
    const features: number[] = [];
    
    // Vertical movement features (YES - up/down motion)
    verticalPositions.forEach((pos) => features.push(pos[1])); // y-coordinates
    
    // Horizontal movement features (NO - left/right motion)
    horizontalPositions.forEach((pos) => features.push(pos[0])); // x-coordinates
    
    // Add z-coordinates for depth
    verticalPositions.forEach((pos) => features.push(pos[2])); // z-coordinates

    return features; // 9 features total
  }, []);

  // Predict gesture from buffer
  const predictGesture = useCallback(async (sequence: number[][]) => {
    if (sequence.length !== SEQUENCE_LENGTH) {
      return;
    }

    try {
      const response = await api.post<{ success: boolean; error?: string } & Partial<GestureResult>>('/gestures/predict', {
        sequence,
      });

      if (response.data.success && response.data.gesture) {
        setGestureResult({
          gesture: response.data.gesture,
          confidence: response.data.confidence!,
          probabilities: response.data.probabilities!,
        });
        setError(null);
      } else {
        setError(response.data.error || 'Prediction failed');
      }
    } catch (err: any) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.error || 'Failed to predict gesture');
    }
  }, []);

  // Process video frame
  const processFrame = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      if (!faceMeshRef.current) return;

      const now = Date.now();

      faceMeshRef.current.onResults((results: any) => {
        // Draw face mesh on canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            // Draw face landmarks
            const faceLandmarks = results.multiFaceLandmarks[0];
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 1;
            for (const landmark of faceLandmarks) {
              ctx.beginPath();
              ctx.arc(
                landmark.x * canvas.width,
                landmark.y * canvas.height,
                2,
                0,
                2 * Math.PI,
              );
              ctx.stroke();
            }
          }
          ctx.restore();
        }

        // Extract landmarks
        const features = extractLandmarks(results);
        if (features) {
          frameBufferRef.current.push(features);

          // Keep buffer at sequence length
          if (frameBufferRef.current.length > SEQUENCE_LENGTH) {
            frameBufferRef.current.shift();
          }

          // Update buffer status
          const bufferPercent = Math.min(
            100,
            (frameBufferRef.current.length / SEQUENCE_LENGTH) * 100,
          );
          setBufferStatus(bufferPercent);

          // Predict when buffer is full and enough time has passed
          if (
            frameBufferRef.current.length === SEQUENCE_LENGTH &&
            now - lastPredictionTime.current >= PREDICTION_INTERVAL
          ) {
            lastPredictionTime.current = now;
            predictGesture([...frameBufferRef.current]);
          }
        }
      });

      faceMeshRef.current.send({ image: video });
    },
    [extractLandmarks, predictGesture],
  );

  // Start/stop webcam
  const toggleWebcam = useCallback(async () => {
    if (isActive) {
      // Stop
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      frameBufferRef.current = [];
      setBufferStatus(0);
      setIsActive(false);
    } else {
      // Start
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          mediaStreamRef.current = stream;
          setIsActive(true);
          setError(null);

          // Start processing frames
          const process = () => {
            if (videoRef.current && canvasRef.current && isActive) {
              processFrame(videoRef.current, canvasRef.current);
              animationFrameRef.current = requestAnimationFrame(process);
            }
          };
          process();
        }
      } catch (err: any) {
        console.error('Error accessing webcam:', err);
        setError('Failed to access webcam. Please allow camera permissions.');
      }
    }
  }, [isActive, processFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const getGestureColor = (gesture: string) => {
    switch (gesture) {
      case 'YES':
        return '#00FF00'; // Green
      case 'NO':
        return '#FF0000'; // Red
      case 'NEUTRAL':
        return '#00FFFF'; // Cyan
      default:
        return '#FFFFFF';
    }
  };

  return (
    <>
      <Navigation />
      <div className="container">
        <div className="swipe-container">
          <div className="swipe-header">
            <h1 className="swipe-title">Gesture-Controlled Swipe</h1>
            <p className="swipe-subtitle">
              Use head gestures to swipe: Nod YES (up/down) or Shake NO (left/right)
            </p>
          </div>

          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video-preview"
              style={{ display: isActive ? 'block' : 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="video-canvas"
              style={{ display: isActive ? 'block' : 'none' }}
            />
            {!isActive && (
              <div className="video-placeholder">
                <p>Click "Start Camera" to begin</p>
              </div>
            )}
          </div>

          <div className="controls">
            <button
              onClick={toggleWebcam}
              className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
            >
              {isActive ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="buffer-status">
            <div className="buffer-label">Buffer: {Math.round(bufferStatus)}%</div>
            <div className="buffer-bar">
              <div
                className="buffer-fill"
                style={{ width: `${bufferStatus}%` }}
              />
            </div>
          </div>

          {gestureResult && (
            <div
              className="gesture-result"
              style={{ borderColor: getGestureColor(gestureResult.gesture) }}
            >
              <h2 className="gesture-label">{gestureResult.gesture}</h2>
              <p className="gesture-confidence">
                Confidence: {(gestureResult.confidence * 100).toFixed(1)}%
              </p>
              <div className="gesture-probabilities">
                <div className="prob-item">
                  <span>YES:</span>
                  <span>{(gestureResult.probabilities.YES * 100).toFixed(1)}%</span>
                </div>
                <div className="prob-item">
                  <span>NO:</span>
                  <span>{(gestureResult.probabilities.NO * 100).toFixed(1)}%</span>
                </div>
                <div className="prob-item">
                  <span>NEUTRAL:</span>
                  <span>{(gestureResult.probabilities.NEUTRAL * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
