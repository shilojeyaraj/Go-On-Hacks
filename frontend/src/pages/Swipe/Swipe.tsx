import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { UserService, UserProfile } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { GestureService } from '../../services/gesture.service';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import './Swipe.css';

// MediaPipe Face Mesh types
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
    onResults: any;
  }
}

export const Swipe: React.FC = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [swipeLimit, setSwipeLimit] = useState<{ canSwipe: boolean; remainingSwipes: number; isPremium: boolean } | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  // Drag/swipe state
  const [swipeEnabled, setSwipeEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Gesture recognition state - ALWAYS ENABLED
  const [gestureEnabled] = useState(true); // Always enabled, independent of swipeEnabled
  const [gestureStatus, setGestureStatus] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);
  const frameBufferRef = useRef<number[][]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastPredictionTime = useRef<number>(0);
  const gestureCooldownRef = useRef<boolean>(false);
  const cameraStartedRef = useRef<boolean>(false);
  const isPredictingRef = useRef<boolean>(false);
  const profilesLoadedRef = useRef<boolean>(false);
  const lastUserIdRef = useRef<string | null>(null);
  const [currentGesture, setCurrentGesture] = useState<'YES' | 'NO' | 'NEUTRAL' | null>(null);
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);

  const SEQUENCE_LENGTH = 15;
  const PREDICTION_INTERVAL = 500; // Predict every 500ms
  const GESTURE_COOLDOWN = 2000; // 2 second cooldown after gesture detection

  useEffect(() => {
    // Only load profiles if user changed or hasn't been loaded yet
    const currentUserId = user?.uid || null;
    const userIdChanged = currentUserId !== lastUserIdRef.current;
    
    if (userIdChanged || (!profilesLoadedRef.current && currentUserId)) {
      console.log('[Swipe] Loading profiles - User changed or not loaded yet');
      lastUserIdRef.current = currentUserId;
      profilesLoadedRef.current = false;
      
      checkProfileAndLoadProfiles().then(() => {
        profilesLoadedRef.current = true;
      });
      checkSwipeLimit();
    }
    
    // Using backend Python prediction with gesture_classifier.h5 model
    if (userIdChanged) {
      console.log('[Swipe] Using backend prediction with gesture_classifier.h5 model');
    }
    
    // Skip TensorFlow.js loading - we're using backend H5 model exclusively
    // This prevents unnecessary error messages in console
  }, [user?.uid]); // Only depend on user.uid, not the entire user object

  // Extract features from face landmarks (matching training: 9 features per frame)
  const extractFeatures = useCallback((landmarks: any[]): number[] | null => {
    if (!landmarks || landmarks.length === 0) return null;

    // Key landmarks matching training (from 2_extract_features.py)
    const verticalLandmarks = [1, 10, 152]; // nose, forehead, chin
    const horizontalLandmarks = [1, 33, 263]; // nose, left eye, right eye

    const verticalPositions: number[][] = [];
    const horizontalPositions: number[][] = [];

    verticalLandmarks.forEach(idx => {
      if (landmarks[idx]) {
        verticalPositions.push([landmarks[idx].x, landmarks[idx].y, landmarks[idx].z]);
      }
    });

    horizontalLandmarks.forEach(idx => {
      if (landmarks[idx]) {
        horizontalPositions.push([landmarks[idx].x, landmarks[idx].y, landmarks[idx].z]);
      }
    });

    if (verticalPositions.length !== 3 || horizontalPositions.length !== 3) {
      return null;
    }

    // Extract features matching training format: [3 vertical_y, 3 horizontal_x, 3 vertical_z]
    const features: number[] = [];
    
    // Vertical y-coordinates (for YES - nodding)
    verticalPositions.forEach(pos => features.push(pos[1]));
    
    // Horizontal x-coordinates (for NO - shaking)
    horizontalPositions.forEach(pos => features.push(pos[0]));
    
    // Vertical z-coordinates (depth)
    verticalPositions.forEach(pos => features.push(pos[2]));

    return features; // Should be 9 features total
  }, []);

  // Process face landmarks and build sequence
  const processFaceLandmarks = useCallback((landmarks: any[]) => {
    if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
      return;
    }
    
    const features = extractFeatures(landmarks);
    if (!features || !Array.isArray(features) || features.length !== 9) {
      return;
    }

    // Add frame to buffer
    frameBufferRef.current.push(features);

    // Keep buffer at sequence length
    if (frameBufferRef.current.length > SEQUENCE_LENGTH) {
      frameBufferRef.current.shift();
    }

    // Log buffer status at key milestones
    const bufferLength = frameBufferRef.current.length;
    if (bufferLength === 1) {
      console.log('[Swipe] 👤 Face detected! Starting to collect frames...');
    } else if (bufferLength === 5 || bufferLength === 10 || bufferLength === SEQUENCE_LENGTH) {
      console.log(`[Swipe] Frame buffer: ${bufferLength}/${SEQUENCE_LENGTH} frames`);
    }
  }, [extractFeatures]);

  // Load MediaPipe Face Mesh
  useEffect(() => {
    let isMounted = true;
    
    const loadMediaPipeFromCDN = () => {
      // Check if already loaded
      if ((window as any).FaceMesh) {
        initializeFaceMesh();
        return;
      }

      // Load MediaPipe Face Mesh first
      const faceScript = document.createElement('script');
      faceScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      faceScript.onerror = () => {
        console.error('[Swipe] Failed to load MediaPipe Face Mesh');
        if (isMounted) {
          setGestureStatus('Face detection unavailable - Using backend only');
        }
      };
      faceScript.onload = () => {
        // Wait a bit longer for MediaPipe to fully initialize
        setTimeout(() => {
          if (isMounted) {
            initializeFaceMesh();
          }
        }, 300);
      };
      document.head.appendChild(faceScript);
    };

    const initializeFaceMesh = () => {
      if ((window as any).FaceMesh) {
        try {
          // Use a more compatible initialization approach
          const FaceMeshClass = (window as any).FaceMesh;
          const faceMesh = new FaceMeshClass({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            },
          });

          faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.1, // Extremely low threshold - almost always detect
            minTrackingConfidence: 0.1, // Extremely low threshold - almost always track
          });
          console.log('[Swipe] MediaPipe Face Mesh configured - detection threshold: 0.1 (very low)');

        let resultCount = 0;
        faceMesh.onResults((results: any) => {
          resultCount++;
          
          // Detailed logging for first 10 results to understand structure
          if (resultCount <= 10) {
            console.log(`[Swipe] ========== MediaPipe Result #${resultCount} ==========`);
            console.log('[Swipe] Results object keys:', results ? Object.keys(results) : 'null');
            console.log('[Swipe] Has multiFaceLandmarks:', !!(results && results.multiFaceLandmarks));
            
            if (results && results.multiFaceLandmarks) {
              console.log('[Swipe] multiFaceLandmarks type:', typeof results.multiFaceLandmarks);
              console.log('[Swipe] multiFaceLandmarks is array:', Array.isArray(results.multiFaceLandmarks));
              console.log('[Swipe] multiFaceLandmarks length:', results.multiFaceLandmarks.length);
              
              if (results.multiFaceLandmarks.length > 0) {
                const firstFace = results.multiFaceLandmarks[0];
                console.log('[Swipe] First face type:', typeof firstFace);
                console.log('[Swipe] First face is array:', Array.isArray(firstFace));
                console.log('[Swipe] First face keys:', firstFace ? Object.keys(firstFace) : 'null');
                
                // Check if it has a .landmark property (Python-style)
                if (firstFace && firstFace.landmark) {
                  console.log('[Swipe] ✅ Found .landmark property (Python-style structure)');
                  console.log('[Swipe] .landmark type:', typeof firstFace.landmark);
                  console.log('[Swipe] .landmark is array:', Array.isArray(firstFace.landmark));
                  console.log('[Swipe] .landmark length:', firstFace.landmark?.length);
                  if (firstFace.landmark && firstFace.landmark.length > 0) {
                    console.log('[Swipe] Sample landmark[0]:', {
                      x: firstFace.landmark[0]?.x,
                      y: firstFace.landmark[0]?.y,
                      z: firstFace.landmark[0]?.z
                    });
                  }
                } else if (Array.isArray(firstFace) && firstFace.length > 0) {
                  console.log('[Swipe] ✅ First face is array (JavaScript-style structure)');
                  console.log('[Swipe] Array length:', firstFace.length);
                  console.log('[Swipe] Sample landmark[0]:', {
                    x: firstFace[0]?.x,
                    y: firstFace[0]?.y,
                    z: firstFace[0]?.z
                  });
                } else {
                  console.log('[Swipe] ⚠️ Unknown structure:', firstFace);
                }
              }
            }
            console.log('[Swipe] ============================================');
          }

          if (!results) {
            if (resultCount <= 5) {
              console.log('[Swipe] ⚠️ MediaPipe returned null/undefined results');
            }
            return;
          }

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const firstFace = results.multiFaceLandmarks[0];
            let landmarks: any[] | null = null;
            
            // Try Python-style structure first (.landmark property)
            if (firstFace && firstFace.landmark && Array.isArray(firstFace.landmark)) {
              landmarks = firstFace.landmark;
              if (resultCount === 1) {
                console.log('[Swipe] ✅ Using Python-style structure (.landmark property)');
              }
            }
            // Try JavaScript-style structure (direct array)
            else if (Array.isArray(firstFace) && firstFace.length > 0) {
              landmarks = firstFace;
              if (resultCount === 1) {
                console.log('[Swipe] ✅ Using JavaScript-style structure (direct array)');
              }
            }
            
            if (landmarks && landmarks.length > 0) {
              if (resultCount === 1) {
                console.log('[Swipe] ✅ FACE DETECTED! Total landmarks:', landmarks.length);
                console.log('[Swipe] Sample landmark[1]:', {
                  x: landmarks[1]?.x,
                  y: landmarks[1]?.y,
                  z: landmarks[1]?.z
                });
                console.log('[Swipe] Sample landmark[10]:', {
                  x: landmarks[10]?.x,
                  y: landmarks[10]?.y,
                  z: landmarks[10]?.z
                });
              }
              setFaceDetected(true);
              processFaceLandmarks(landmarks);
            } else {
              if (resultCount <= 10) {
                console.log('[Swipe] ⚠️ Could not extract landmarks. First face structure:', firstFace);
              }
            }
          } else {
            // Log first few "no face" messages, then reduce frequency
            if (resultCount <= 10 || (resultCount % 200 === 0)) {
              console.log(`[Swipe] ⚠️ No face detected (result #${resultCount}). Make sure your face is visible and well-lit`);
            }
            setFaceDetected(false);
          }
        });

          faceMeshRef.current = faceMesh;
          console.log('[Swipe] MediaPipe Face Mesh loaded from CDN');
          if (isMounted) {
            setGestureStatus('Camera active - Show your face');
          }
        } catch (error: any) {
          console.error('[Swipe] Failed to initialize MediaPipe:', error);
          if (isMounted) {
            setGestureStatus('Face detection unavailable - Using backend only');
          }
        }
      }
    };

    loadMediaPipeFromCDN();

    return () => {
      isMounted = false;
    };
  }, [processFaceLandmarks]);

  const handleSwipe = useCallback(async (action: 'like' | 'pass') => {
    if (swiping || currentIndex >= profiles.length || swipeDirection) return;

    const currentProfile = profiles[currentIndex];
    if (!currentProfile || !user?.uid) return;

    // Check swipe limit before swiping
    const limit = await UserService.getSwipeLimit();
    if (!limit.canSwipe) {
      setShowLimitModal(true);
      return;
    }

    // Set swipe direction for animation
    setSwipeDirection(action === 'like' ? 'right' : 'left');

    try {
      setSwiping(true);
      const result = await UserService.swipe(currentProfile.uid, action);

      // Update swipe limit after successful swipe
      await checkSwipeLimit();

      if (result.isMatch && action === 'like') {
        // It's a match! Show match modal after animation
        setTimeout(() => {
          setMatchedUser(currentProfile);
          setShowMatchModal(true);
        }, 300);
      }

      // Move to next profile after animation completes
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwipeDirection(null);
        setDragOffset({ x: 0, y: 0 });
      }, 600);
    } catch (err: any) {
      console.error('Failed to swipe:', err);
      setSwipeDirection(null);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to swipe. Please try again.';
      
      // Check if it's a swipe limit error
      if (errorMessage.includes('swipe limit') || errorMessage.includes('Daily swipe limit')) {
        setShowLimitModal(true);
        await checkSwipeLimit();
      } else {
        alert(errorMessage);
      }
    } finally {
      setSwiping(false);
    }
  }, [swiping, currentIndex, profiles, swipeDirection, user]);

  // Predict gesture from frame buffer
  const predictGesture = useCallback(async () => {
    const bufferLength = frameBufferRef.current.length;
    
    console.log('[Swipe] 🔍 predictGesture called. Buffer length:', bufferLength, 'Expected:', SEQUENCE_LENGTH);
    console.log('[Swipe] Cooldown:', gestureCooldownRef.current, 'IsPredicting:', isPredictingRef.current);
    
    if (bufferLength !== SEQUENCE_LENGTH) {
      console.log('[Swipe] ⚠️ Buffer not full, skipping prediction');
      return;
    }
    
    if (gestureCooldownRef.current || isPredictingRef.current) {
      console.log('[Swipe] ⚠️ In cooldown or already predicting, skipping');
      return;
    }

    // Prevent multiple simultaneous predictions
    isPredictingRef.current = true;
    console.log('[Swipe] 📊 Starting prediction...');

    try {
      const sequence = [...frameBufferRef.current];
      
      // Use backend Python prediction with gesture_classifier.h5 model
      const backendResult = await GestureService.predictGesture(sequence);
      const result = {
        gesture: backendResult.gesture as 'YES' | 'NO' | 'NEUTRAL',
        confidence: backendResult.confidence,
        probabilities: backendResult.probabilities,
      };

      // Update overlay with current gesture detection
      setCurrentGesture(result.gesture);
      setGestureConfidence(result.confidence);

      // Log gesture detection with full details
      console.log('========================================');
      console.log(`[Swipe] 🎯 GESTURE DETECTED: ${result.gesture}`);
      console.log(`[Swipe] Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`[Swipe] Probabilities:`);
      console.log(`  - YES: ${(result.probabilities.YES * 100).toFixed(1)}%`);
      console.log(`  - NO: ${(result.probabilities.NO * 100).toFixed(1)}%`);
      console.log(`  - NEUTRAL: ${(result.probabilities.NEUTRAL * 100).toFixed(1)}%`);
      console.log('========================================');

      // Only act on high confidence predictions
      // Gestures work independently of swipeEnabled state
      if (result.confidence > 0.7) {
        console.log('[Swipe] ✅ High confidence gesture detected:', result.gesture);
        if (result.gesture === 'YES' && !swiping && !swipeDirection) {
          // Nod = YES → swipe right (like)
          console.log('[Swipe] ✅ EXECUTING: YES gesture → LIKE (swipe right)');
          setGestureStatus('✓ Liked!');
          gestureCooldownRef.current = true;
          setTimeout(() => {
            gestureCooldownRef.current = false;
            setGestureStatus('Camera active - Show your face');
            setCurrentGesture(null);
            setGestureConfidence(0);
          }, GESTURE_COOLDOWN);
          handleSwipe('like');
        } else if (result.gesture === 'NO' && !swiping && !swipeDirection) {
          // Shake head = NO → swipe left (pass)
          console.log('[Swipe] ✅ EXECUTING: NO gesture → PASS (swipe left)');
          setGestureStatus('✕ Passed!');
          gestureCooldownRef.current = true;
          setTimeout(() => {
            gestureCooldownRef.current = false;
            setGestureStatus('Camera active - Show your face');
            setCurrentGesture(null);
            setGestureConfidence(0);
          }, GESTURE_COOLDOWN);
          handleSwipe('pass');
        } else if (result.gesture === 'NEUTRAL') {
          // NEUTRAL gesture - just show in overlay, no action
          console.log('[Swipe] ⚪ NEUTRAL gesture - No action taken');
        }
      } else {
        // Low confidence - log occasionally
        if (Math.random() < 0.1) {
          console.log(`[Swipe] ⚠️ Low confidence (${(result.confidence * 100).toFixed(1)}%) - Ignoring ${result.gesture} gesture`);
        }
      }
    } catch (err: any) {
      console.error('[Swipe] ❌ Gesture prediction error:', err);
      console.error('[Swipe] Error stack:', err.stack);
      setCurrentGesture(null);
      setGestureConfidence(0);
    } finally {
      // Always reset prediction flag
      isPredictingRef.current = false;
    }
  }, [swiping, swipeDirection, handleSwipe]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    frameBufferRef.current = [];
    setGestureStatus('');
  }, []);

  // Start gesture detection loop
  const startGestureDetection = useCallback(() => {
    console.log('[Swipe] 🎥 Starting gesture detection loop');
    if (!videoRef.current || !canvasRef.current || !faceMeshRef.current) {
      console.error('[Swipe] ❌ Cannot start detection - missing refs:', {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
        faceMesh: !!faceMeshRef.current,
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let frameCount = 0;
    const processFrame = async () => {
      if (!video) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Wait for video to have valid dimensions and data
      // readyState 4 = HAVE_ENOUGH_DATA (video is ready to play)
      // readyState 2 = HAVE_METADATA (dimensions available)
      if (video.readyState < video.HAVE_METADATA) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Validate video dimensions - critical for MediaPipe
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      if (videoWidth === 0 || videoHeight === 0 || !isFinite(videoWidth) || !isFinite(videoHeight)) {
        // Log occasionally if video dimensions are invalid
        if (frameCount % 100 === 0) {
          console.warn('[Swipe] ⚠️ Video has invalid dimensions:', {
            width: videoWidth,
            height: videoHeight,
            readyState: video.readyState,
            paused: video.paused,
            ended: video.ended
          });
        }
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Draw video frame to canvas (for potential fallback, though we use video directly)
      // Ensure canvas has valid dimensions matching video
      if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
      }
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Process with MediaPipe - only if video has valid dimensions and is ready
      // readyState >= 2 ensures we have metadata (dimensions)
      if (faceMeshRef.current && videoWidth > 0 && videoHeight > 0 && video.readyState >= 2) {
        try {
          // Use video element directly - MediaPipe works best with HTMLVideoElement
          // Double-check dimensions right before sending
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            await faceMeshRef.current.send({ image: video });
          }
        } catch (error: any) {
          // Log ROI errors with context (they indicate video dimension issues)
          if (error.message?.includes('ROI') || error.message?.includes('width') || error.message?.includes('height')) {
            if (frameCount % 100 === 0) {
              console.error('[Swipe] ❌ MediaPipe ROI error - Video dimensions issue:', {
                error: error.message,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height
              });
            }
          } else if (frameCount % 200 === 0) {
            // Log other MediaPipe errors occasionally
            console.warn('[Swipe] MediaPipe processing warning:', error.message);
          }
        }
      }
      
      frameCount++;

      // Check if we have enough frames and enough time has passed
      const now = Date.now();
      const bufferLength = frameBufferRef.current.length;
      
      // Only trigger prediction if:
      // 1. Buffer is full (15 frames)
      // 2. Enough time has passed since last prediction (500ms)
      // 3. Not in cooldown period
      // 4. Not already predicting
      if (bufferLength === SEQUENCE_LENGTH) {
        const timeSinceLastPrediction = now - lastPredictionTime.current;
        const canPredict = timeSinceLastPrediction >= PREDICTION_INTERVAL && 
                          !gestureCooldownRef.current &&
                          !isPredictingRef.current;
        
        // Log why prediction isn't happening (only occasionally to avoid spam)
        if (!canPredict && frameCount % 60 === 0) {
          console.log('[Swipe] ⏸️ Buffer full but not predicting:', {
            timeSinceLast: timeSinceLastPrediction,
            needsInterval: PREDICTION_INTERVAL,
            inCooldown: gestureCooldownRef.current,
            isPredicting: isPredictingRef.current
          });
        }
        
        if (canPredict) {
          console.log('[Swipe] ✅ Conditions met, calling predictGesture');
          lastPredictionTime.current = now;
          predictGesture();
        }
      } else if (bufferLength < SEQUENCE_LENGTH && bufferLength === 10) {
        // Only log once when buffer reaches 10 frames
        console.log(`[Swipe] Building frame buffer: ${bufferLength}/${SEQUENCE_LENGTH} frames`);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    console.log('[Swipe] ✅ Starting frame processing loop');
    processFrame();
  }, [predictGesture]);

  // Initialize camera - ALWAYS ENABLED (independent of swipeEnabled)
  useEffect(() => {
    let cameraTimer: NodeJS.Timeout | null = null;
    let isInitializing = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });

        console.log('[Swipe] ✅ Camera access granted');
        if (videoRef.current) {
          // Clear any existing srcObject first
          if (videoRef.current.srcObject) {
            const oldStream = videoRef.current.srcObject as MediaStream;
            oldStream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Set new stream
          videoRef.current.srcObject = stream;
          mediaStreamRef.current = stream;
          
          // Wait for video to be ready before starting detection
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                console.log('[Swipe] ✅ Video playing, starting gesture detection');
                setGestureStatus('Camera active - Show your face');
                startGestureDetection();
              }).catch((err) => {
                console.warn('[Swipe] Video play warning (non-critical):', err);
                // Still start detection - video frames can be processed even if play() fails
                setGestureStatus('Camera ready - Show your face');
                startGestureDetection();
              });
            }
          };
        }
      } catch (err) {
        console.error('Failed to access camera:', err);
        setGestureStatus('Camera access denied');
      }
    };

    // Start camera after MediaPipe is loaded
    cameraTimer = setTimeout(startCamera, 500);

    return () => {
      if (cameraTimer) clearTimeout(cameraTimer);
      stopCamera();
      isInitializing = false;
      cameraStartedRef.current = false;
    };
  }, [startGestureDetection, stopCamera]);

  // Handle mouse move globally for better drag experience
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setDragOffset({ x: deltaX, y: deltaY });
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, dragStart]);

  // Gesture recognition is always enabled - no toggle needed
  // Removed toggleGestureRecognition function since gestures are always on

  const checkSwipeLimit = async () => {
    if (!user?.uid) return;
    try {
      const limit = await UserService.getSwipeLimit();
      setSwipeLimit(limit);
    } catch (err: any) {
      console.error('Failed to check swipe limit:', err);
    }
  };

  const checkProfileAndLoadProfiles = async () => {
    try {
      setLoading(true);
      
      // Check if current user has completed profile
      const userData = await UserService.getCurrentUser();
      setCurrentUser(userData);

      if (!userData.profileCompleted) {
        return;
      }

      // Load discoverable profiles (users not yet swiped on)
      const discoverProfiles = await UserService.getDiscoverProfiles();
      setProfiles(discoverProfiles);
    } catch (err: any) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!swipeEnabled || swiping || swipeDirection) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || swiping || swipeDirection) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    const finalOffset = dragOffset;
    setIsDragging(false);

    // If dragged far enough, trigger swipe
    if (Math.abs(finalOffset.x) > 150) {
      handleSwipe(finalOffset.x > 0 ? 'like' : 'pass');
    } else {
      // Reset if not dragged far enough
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeEnabled || swiping || swipeDirection) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeEnabled || !isDragging || swiping || swipeDirection) return;
    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // If swipe is disabled, just reset
    if (!swipeEnabled) {
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    // If dragged far enough, trigger swipe
    if (Math.abs(dragOffset.x) > 150) {
      handleSwipe(dragOffset.x > 0 ? 'like' : 'pass');
    } else {
      // Reset if not dragged far enough
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Handle mouse move and up globally for better drag experience
  useEffect(() => {
    if (!isDragging || !swipeEnabled) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!swipeEnabled) {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
        return;
      }
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setDragOffset({ x: deltaX, y: deltaY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      // Use a callback to get the latest dragOffset
      setDragOffset((currentOffset) => {
        if (!swipeEnabled) {
          return { x: 0, y: 0 };
        }
        // If dragged far enough, trigger swipe
        if (Math.abs(currentOffset.x) > 150) {
          handleSwipe(currentOffset.x > 0 ? 'like' : 'pass');
        } else {
          // Reset if not dragged far enough
          return { x: 0, y: 0 };
        }
        return currentOffset;
      });
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, handleSwipe, swipeEnabled]);

  // Stop dragging if swipeEnabled becomes false
  useEffect(() => {
    if (!swipeEnabled && isDragging) {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [swipeEnabled, isDragging]);

  const handleMatchModalClose = () => {
    setShowMatchModal(false);
    setMatchedUser(null);
  };

  const handleSendMessage = async () => {
    if (!matchedUser || !user?.uid) return;

    try {
      // Get or create conversation (should already exist from backend)
      await ChatService.getOrCreateConversation(matchedUser.uid);
      navigate('/chat', { state: { userId: matchedUser.uid } });
    } catch (err: any) {
      console.error('Failed to start conversation:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 4rem)' }}>
          <p className="text-body">Loading...</p>
        </div>
      </>
    );
  }

  if (!currentUser?.profileCompleted) {
    return (
      <>
        <Navigation />
        <div className="container">
          <div className="card card--medium card--centered">
            <h1 className="text-title text-center">Complete Your Profile</h1>
            <p className="text-body text-center">
              Please complete your profile to start swiping on others.
            </p>
            <p className="text-body text-center">
              You need to upload a profile picture, at least one feet photo, and add your full name.
            </p>
            <button
              className="btn btn--primary"
              onClick={() => navigate('/profile')}
              style={{ marginTop: '1.5rem' }}
            >
              Go to Profile
            </button>
          </div>
        </div>
      </>
    );
  }

  const currentProfile = profiles[currentIndex];

  if (!currentProfile) {
    return (
      <>
        <Navigation />
        <div className="swipe-container">
          <div className="swipe-empty-state">
            <h2 className="text-title text-center">No more profiles!</h2>
            <p className="text-body text-center">
              You've seen all available profiles. Check back later for new matches!
            </p>
            <p className="swipe-empty-state-link">
              <Link to="/chat" className="swipe-empty-state-link-text">View Your Matches</Link>
            </p>
          </div>
        </div>
      </>
    );
  }

  // Calculate rotation and opacity for drag effect
  const rotation = isDragging ? dragOffset.x / 30 : 0;
  const opacity = isDragging ? 1 - Math.abs(dragOffset.x) / 300 : 1;
  
  // Calculate color overlay based on drag direction
  const getCardOverlayColor = () => {
    if (!isDragging || swipeDirection) return '';
    
    const dragAmount = Math.abs(dragOffset.x);
    
    if (dragOffset.x > 0) {
      // Dragging right (like) - GREEN
      const intensity = Math.min(dragAmount / 150, 0.7); // Max 70% intensity for green
      return `rgba(76, 175, 80, ${intensity})`;
    } else if (dragOffset.x < 0) {
      // Dragging left (dislike/pass) - RED
      const intensity = Math.min(dragAmount / 150, 0.7); // Max 70% intensity for red
      return `rgba(244, 67, 54, ${intensity})`;
    }
    return '';
  };

  return (
    <>
      <Navigation />
      <div className="swipe-container">
        {/* Swipe Enable Toggle Button */}
        <div className="swipe-enable-control">
          <button
            type="button"
            onClick={() => setSwipeEnabled(!swipeEnabled)}
            className={`swipe-enable-toggle ${swipeEnabled ? 'swipe-enable-toggle--enabled' : ''}`}
          >
            {swipeEnabled ? 'Swiping Enabled' : 'Swiping Disabled'}
          </button>
        </div>
        <div className="swipe-card-wrapper">
          <div 
            ref={cardRef}
            className={`swipe-card ${swipeDirection ? `swipe-card--swipe-${swipeDirection}` : ''}`}
            style={{
              transform: (isDragging && !swipeDirection && swipeEnabled)
                ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`
                : '',
              opacity: swipeDirection ? 1 : opacity,
              cursor: swipeEnabled ? (isDragging ? 'grabbing' : 'grab') : 'default',
              userSelect: 'none',
            } as React.CSSProperties}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Color overlay for swipe feedback - covers entire card including images */}
            {isDragging && !swipeDirection && (
              <div 
                className="swipe-card-overlay"
                style={{
                  backgroundColor: getCardOverlayColor() || 'transparent',
                }}
              />
            )}
            {/* Profile Picture */}
            <div className="swipe-card-image-container">
              {currentProfile.profilePicture ? (
                <img 
                  src={currentProfile.profilePicture} 
                  alt={currentProfile.fullName || 'User'} 
                  className="swipe-card-image"
                />
              ) : (
                <div className="swipe-card-image-placeholder">
                  {(currentProfile.fullName || currentProfile.displayName || 'U')[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="swipe-card-info">
              <h2 className="swipe-card-name">
                {currentProfile.fullName || currentProfile.displayName || 'Anonymous'}
                {currentProfile.age && <span className="swipe-card-age">, {currentProfile.age}</span>}
              </h2>
              
              {currentProfile.bio && (
                <p className="swipe-card-bio">{currentProfile.bio}</p>
              )}

              {/* Feet Photos Preview */}
              {currentProfile.feetPhotos && currentProfile.feetPhotos.length > 0 && (
                <div className="swipe-card-feet-preview">
                  <h3 className="swipe-card-section-title">Feet Photos</h3>
                  <div className="swipe-card-feet-grid">
                    {currentProfile.feetPhotos.slice(0, 3).map((photo, idx) => (
                      <img 
                        key={idx} 
                        src={photo} 
                        alt={`Feet photo ${idx + 1}`}
                        className="swipe-card-feet-image"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="swipe-card-details">
                {currentProfile.archType && (
                  <div className="swipe-card-detail-item">
                    <span className="swipe-card-detail-label">Arch Type:</span>
                    <span className="swipe-card-detail-value">{currentProfile.archType}</span>
                  </div>
                )}
                {currentProfile.archSize && (
                  <div className="swipe-card-detail-item">
                    <span className="swipe-card-detail-label">Arch Size:</span>
                    <span className="swipe-card-detail-value">{currentProfile.archSize}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Gesture Recognition Status - Always Enabled */}
        <div className="swipe-gesture-controls">
          <div className="swipe-gesture-status-indicator">
            <span className="swipe-gesture-status-text">Gestures Active</span>
          </div>
          {gestureStatus && (
            <div className="swipe-gesture-status">{gestureStatus}</div>
          )}
        </div>

        {/* Swipe Limit Display */}
        {swipeLimit && !swipeLimit.isPremium && (
          <div className="swipe-limit-text-display">
            {swipeLimit.remainingSwipes > 0 ? (
              <span>{swipeLimit.remainingSwipes} swipes remaining today</span>
            ) : (
              <span>Daily limit reached. <Link to="/pricing" className="swipe-limit-link">Upgrade to Premium</Link> for unlimited swipes!</span>
            )}
          </div>
        )}

        {/* Video preview with gesture overlay */}
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          width: '320px', 
          height: '240px',
          border: '3px solid #333',
          borderRadius: '8px',
          zIndex: 9999,
          backgroundColor: 'black',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          
          {/* Gesture Overlay - Always visible */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            backgroundColor: currentGesture === 'YES' 
              ? 'rgba(76, 175, 80, 0.9)' 
              : currentGesture === 'NO' 
              ? 'rgba(244, 67, 54, 0.9)' 
              : currentGesture === 'NEUTRAL'
              ? 'rgba(158, 158, 158, 0.9)'
              : 'rgba(33, 150, 243, 0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            border: `2px solid ${currentGesture === 'YES' 
              ? '#4CAF50' 
              : currentGesture === 'NO' 
              ? '#F44336' 
              : currentGesture === 'NEUTRAL'
              ? '#9E9E9E'
              : '#2196F3'}`
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>
              {currentGesture === 'YES' 
                ? '✓ YES' 
                : currentGesture === 'NO' 
                ? '✕ NO' 
                : currentGesture === 'NEUTRAL'
                ? '○ NEUTRAL'
                : faceDetected
                ? '🔍 Detecting...'
                : '⏳ Waiting...'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {currentGesture 
                ? `Confidence: ${(gestureConfidence * 100).toFixed(0)}%`
                : faceDetected
                ? 'Analyzing gestures...'
                : 'Show your face'}
            </div>
          </div>
          
          {/* Status indicator at bottom */}
          <div style={{ 
            position: 'absolute', 
            bottom: '5px', 
            left: '5px', 
            right: '5px',
            color: 'white', 
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            textAlign: 'center'
          }}>
            {gestureStatus || 'Camera Active'}
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Swipe Limit Modal */}
        {showLimitModal && (
          <div className="swipe-match-modal-overlay" onClick={() => setShowLimitModal(false)}>
            <div className="swipe-match-modal" onClick={(e) => e.stopPropagation()}>
              <div className="swipe-match-modal-content">
                <h2 className="swipe-match-title">Daily Swipe Limit Reached</h2>
                <p className="swipe-match-text">
                  You've used all {swipeLimit?.remainingSwipes === 0 ? '50' : 'your'} free swipes for today.
                </p>
                <p className="swipe-match-text">
                  Upgrade to <strong>Premium</strong> for unlimited swipes!
                </p>
                <div className="swipe-match-actions">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowLimitModal(false);
                      navigate('/pricing');
                    }}
                    className="swipe-match-btn"
                  >
                    Upgrade to Premium
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowLimitModal(false)}
                    className="swipe-match-btn"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Modal */}
        {showMatchModal && matchedUser && (
          <div className="swipe-match-modal-overlay" onClick={handleMatchModalClose}>
            <div className="swipe-match-modal" onClick={(e) => e.stopPropagation()}>
              <div className="swipe-match-modal-content">
                <h2 className="swipe-match-title">It's a Match!</h2>
                <p className="swipe-match-text">
                  You and {matchedUser.fullName || matchedUser.displayName || 'this user'} liked each other.
                </p>
                <div className="swipe-match-actions">
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                    className="swipe-match-btn"
                  >
                    Send Message
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleMatchModalClose}
                    className="swipe-match-btn"
                  >
                    Keep Swiping
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

