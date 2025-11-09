import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { UserService, UserProfile } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import './Swipe.css';

// MediaPipe Face Mesh types
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
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

  // Gesture recognition is always enabled - no state needed
  const [gestureStatus, setGestureStatus] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const gestureCooldownRef = useRef<boolean>(false);
  const cameraStartedRef = useRef<boolean>(false);

  const GESTURE_COOLDOWN = 2500; // 2.5 seconds debounce after successful gesture to prevent double-actions

  useEffect(() => {
    checkProfileAndLoadProfiles();
    checkSwipeLimit();
    // Backend prediction will be used automatically if browser model not available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Rule-based Gesture Detector - HEAD MOVEMENT DETECTION
  const gestureDetectorRef = useRef<{
    baselineNose: { x: number; y: number; z: number } | null;
    nosePositions: Array<{ x: number; y: number }>; // Track head movement direction
    gestureHistory: string[];
    frameCount: number;
    calibrationFrames: number;
    detect: (landmarks: any[]) => { gesture: string; confidence: number };
    recalibrate: () => void;
  }>({
    baselineNose: null,
    nosePositions: [],
    gestureHistory: [],
    frameCount: 0,
    calibrationFrames: 60, // Wait 2 seconds (60 frames at 30fps) before detecting
    detect: (landmarks: any[]) => {
      const detector = gestureDetectorRef.current;
      detector.frameCount++;

      // Get key landmarks - NOSE for head movement detection
      const noseTip = landmarks[1]; // Nose tip is most stable for head tracking

      // Calibration phase - wait before starting detection
      if (detector.frameCount <= detector.calibrationFrames) {
        if (!detector.baselineNose) {
          detector.baselineNose = { x: noseTip.x, y: noseTip.y, z: noseTip.z };
        }
        return { gesture: 'NEUTRAL', confidence: 0 };
      }

      if (!detector.baselineNose) {
        return { gesture: 'NEUTRAL', confidence: 0 };
      }

      // Track nose position for head movement
      detector.nosePositions.push({ x: noseTip.x, y: noseTip.y });
      if (detector.nosePositions.length > 15) {
        detector.nosePositions.shift();
      }

      // Calculate head movement from baseline
      const horizontalMovement = noseTip.x - detector.baselineNose.x; // Positive = right, Negative = left
      const verticalMovement = noseTip.y - detector.baselineNose.y; // Positive = down, Negative = up
      
      // Calculate movement ranges over recent frames
      const horizontalRange = detector.nosePositions.length >= 5 
        ? Math.max(...detector.nosePositions.map(p => p.x)) - Math.min(...detector.nosePositions.map(p => p.x))
        : 0;
      const verticalRange = detector.nosePositions.length >= 5
        ? Math.max(...detector.nosePositions.map(p => p.y)) - Math.min(...detector.nosePositions.map(p => p.y))
        : 0;

      // HEAD MOVEMENT DETECTION
      // Left-right head movement (shaking) = PASS/DISLIKE
      // Up-down head movement (nodding) = LIKE
      
      const absHorizontal = Math.abs(horizontalMovement);
      const absVertical = Math.abs(verticalMovement);
      
      // Detect horizontal head movement (left-right shaking)
      const isHorizontalMovement = horizontalRange > 0.02 && horizontalRange > verticalRange * 1.2;
      const hasSignificantHorizontal = absHorizontal > 0.02;
      
      // Detect vertical head movement (up-down nodding)
      const isVerticalMovement = verticalRange > 0.02 && verticalRange > horizontalRange * 1.2;
      const hasSignificantVertical = absVertical > 0.02;

      if (isHorizontalMovement && hasSignificantHorizontal) {
        // Left-right head movement = PASS/DISLIKE
        const confidence = Math.min(0.95, Math.max(0.75, horizontalRange * 20));
        
        detector.gestureHistory.push('NO');
        if (detector.gestureHistory.length > 8) {
          detector.gestureHistory.shift();
        }
        
        // Require at least 3 NO detections in last 5 frames
        const recent = detector.gestureHistory.slice(-5);
        const noCount = recent.filter(g => g === 'NO').length;
        if (noCount >= 3) {
          return { gesture: 'NO', confidence };
        }
      } else if (isVerticalMovement && hasSignificantVertical) {
        // Up-down head movement = LIKE
        const confidence = Math.min(0.95, Math.max(0.75, verticalRange * 20));
        
        detector.gestureHistory.push('YES');
        if (detector.gestureHistory.length > 8) {
          detector.gestureHistory.shift();
        }
        
        // Require at least 3 YES detections in last 5 frames
        const recent = detector.gestureHistory.slice(-5);
        const yesCount = recent.filter(g => g === 'YES').length;
        if (yesCount >= 3) {
          return { gesture: 'YES', confidence };
        }
      }

      // NEUTRAL - no significant head movement detected
      detector.gestureHistory.push('NEUTRAL');
      if (detector.gestureHistory.length > 8) {
        detector.gestureHistory.shift();
      }
      return { gesture: 'NEUTRAL', confidence: 0.5 };
    },
    recalibrate: () => {
      gestureDetectorRef.current.frameCount = 0;
      gestureDetectorRef.current.baselineNose = null;
      gestureDetectorRef.current.nosePositions = [];
      gestureDetectorRef.current.gestureHistory = [];
    },
  });

  // Extract features from face landmarks (not used - kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const extractFeatures = useCallback((landmarks: any[]): number[] | null => {
    if (!landmarks || landmarks.length === 0) {
      return null;
    }

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

    if (features.length !== 9) {
      return null;
    }

    return features; // Should be 9 features total
  }, []);

  // Handle swipe action (defined before processFaceLandmarks to avoid use-before-define error)
  const handleSwipe = useCallback(async (action: 'like' | 'pass') => {
    if (swiping || currentIndex >= profiles.length || swipeDirection) return;

    const currentProfile = profiles[currentIndex];
    if (!currentProfile || !user?.uid) return;

    // Check swipe limit before swiping (with error handling)
    try {
      const limit = await UserService.getSwipeLimit();
      if (!limit.canSwipe) {
        setShowLimitModal(true);
        return;
      }
    } catch (err: any) {
      // If backend is unavailable, allow swiping (graceful degradation)
      // The backend will handle the limit check when the swipe request is made
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swiping, currentIndex, profiles, swipeDirection, user]);

  // Process face landmarks - use rule-based gesture detector
  const processFaceLandmarks = useCallback((landmarks: any[]) => {
    if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
      return;
    }

    // Check debounce/cooldown first - prevent double-liking
    if (gestureCooldownRef.current) {
      return; // Still in cooldown, ignore all gestures
    }

    // Use rule-based gesture detector
    const ruleBasedResult = gestureDetectorRef.current.detect(landmarks);
    
    // Log gesture detection
    if (ruleBasedResult.gesture !== 'NEUTRAL' || ruleBasedResult.confidence > 0.5) {
      const confidencePct = (ruleBasedResult.confidence * 100).toFixed(0);
      console.log(`[Gesture] ${ruleBasedResult.gesture} (${confidencePct}% confidence)`);
    }

    // Handle gestures - DIRECTIONAL LICKING
    // Increased confidence threshold to 0.75 for more reliable detection
    if (ruleBasedResult.confidence >= 0.75 && !swiping && !swipeDirection && !gestureCooldownRef.current) {
      if (ruleBasedResult.gesture === 'YES') {
        // Up-down head movement (nodding) detected - Swipe Right (Like)
        console.log(`[Gesture] YES (Nodding Up-Down) → Swipe RIGHT`);
        
        // Set cooldown immediately to prevent double-liking
        gestureCooldownRef.current = true;
        setGestureStatus('Liked!');
        
        // Call handleSwipe
        handleSwipe('like');
        
        // Reset cooldown after 2 seconds
        setTimeout(() => {
          gestureCooldownRef.current = false;
          setGestureStatus('Camera active - Show your face');
        }, GESTURE_COOLDOWN);
      } else if (ruleBasedResult.gesture === 'NO') {
        // Left-right head movement (shaking) detected - Swipe Left (Pass/Dislike)
        console.log(`[Gesture] NO (Shaking Left-Right) → Swipe LEFT`);
        
        // Set cooldown immediately to prevent double-action
        gestureCooldownRef.current = true;
        setGestureStatus('Passed!');
        
        // Call handleSwipe
        handleSwipe('pass');
        
        // Reset cooldown after 2 seconds
        setTimeout(() => {
          gestureCooldownRef.current = false;
          setGestureStatus('Camera active - Show your face');
        }, GESTURE_COOLDOWN);
      }
    }
  }, [swiping, swipeDirection, handleSwipe]);

  // Load MediaPipe Face Mesh
  useEffect(() => {
    let isMounted = true;
    
    const loadMediaPipeFromCDN = () => {
      // Check if already loaded
      if ((window as any).FaceMesh) {
        initializeFaceMesh();
        return;
      }

      // Load from CDN with error handling
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      script.onerror = () => {
        // MediaPipe Camera Utils failed to load - silent error
        if (isMounted) {
          setGestureStatus('Face detection unavailable - Using backend only');
        }
      };
      script.onload = () => {
        const faceScript = document.createElement('script');
        faceScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
        faceScript.onerror = () => {
          // MediaPipe Face Mesh failed to load - silent error
          if (isMounted) {
            setGestureStatus('Face detection unavailable - Using backend only');
          }
        };
        faceScript.onload = () => {
          // Add a small delay to ensure MediaPipe is fully initialized
          setTimeout(() => {
            if (isMounted) {
              initializeFaceMesh();
            }
          }, 100);
        };
        document.head.appendChild(faceScript);
      };
      document.head.appendChild(script);
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
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          faceMesh.onResults((results: any) => {
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              // In MediaPipe Face Mesh, multiFaceLandmarks[0] IS the landmarks array
              const landmarks = results.multiFaceLandmarks[0];
              
              // Face detected - process landmarks
              if (landmarks && Array.isArray(landmarks) && landmarks.length > 0) {
                processFaceLandmarks(landmarks);
              }
            }
            // No logging for no face detected - too noisy
          });

          faceMeshRef.current = faceMesh;
          // MediaPipe loaded - no need to log
          if (isMounted) {
            setGestureStatus('Camera active - Show your face');
          }
        } catch (error: any) {
          // MediaPipe initialization failed - silent error
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


  // Rule-based gesture detection is handled in processFaceLandmarks

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

    setGestureStatus('');
  }, []);

  // Start gesture detection loop
  const startGestureDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !faceMeshRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const processFrame = async () => {
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Draw video frame to canvas - confirm video is being captured
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Process with MediaPipe - video is working, checking for gestures
        if (faceMeshRef.current) {
          try {
            await faceMeshRef.current.send({ image: canvas });
          } catch (error: any) {
            // Silently handle MediaPipe errors - don't spam console
          }
        }
      } else {
        // Video not ready yet
        console.log('[Video] Waiting for video stream...');
      }

      // Rule-based detection happens in processFaceLandmarks callback
      // No need for separate prediction interval - detection is real-time

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    processFrame();
  }, [processFaceLandmarks]);

  // Initialize camera - ALWAYS ENABLED (independent of swipeEnabled)
  useEffect(() => {
    let cameraTimer: NodeJS.Timeout | null = null;
    let isInitializing = false;

    const startCamera = async () => {
      // Prevent multiple simultaneous initializations or re-initializations
      if (isInitializing || cameraStartedRef.current) return;
      
      // Wait for MediaPipe to be ready
      if (!faceMeshRef.current) {
        cameraTimer = setTimeout(startCamera, 200);
        return;
      }

      // Stop any existing stream first to prevent conflicts
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      isInitializing = true;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });

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
          
          // Wait for video to be ready - use a more robust approach
          const playVideo = async () => {
            if (!videoRef.current || !mediaStreamRef.current) return;
            
            try {
              // Wait for video metadata with timeout
              if (videoRef.current.readyState < 2) {
                await Promise.race([
                  new Promise<void>((resolve) => {
                    if (!videoRef.current) {
                      resolve();
                      return;
                    }
                    const timeout = setTimeout(() => resolve(), 3000); // 3 second timeout
                    const checkReady = () => {
                      if (videoRef.current && videoRef.current.readyState >= 2) {
                        clearTimeout(timeout);
                        resolve();
                      } else {
                        setTimeout(checkReady, 50);
                      }
                    };
                    videoRef.current.addEventListener('loadedmetadata', () => {
                      clearTimeout(timeout);
                      resolve();
                    }, { once: true });
                    checkReady();
                  }),
                  new Promise(resolve => setTimeout(resolve, 3000)) // Fallback timeout
                ]);
              }

              // Now play the video (only if still valid)
              if (videoRef.current && mediaStreamRef.current && videoRef.current.srcObject === stream) {
                // Remove autoplay attribute to prevent conflicts
                videoRef.current.removeAttribute('autoplay');
                await videoRef.current.play();
                setGestureStatus('Camera active - Show your face');
                startGestureDetection();
                cameraStartedRef.current = true;
              }
            } catch (err: any) {
              // Play() errors are often non-critical - video can still be processed
              setGestureStatus('Camera ready - Show your face');
              // Still start detection - video frames can be processed even if play() fails
              startGestureDetection();
              cameraStartedRef.current = true;
            }
          };

          // Start playing after a longer delay to ensure everything is set up
          setTimeout(playVideo, 200);
        }
      } catch (err) {
        console.error('Failed to access camera:', err);
        setGestureStatus('Camera access denied - Gestures disabled');
      } finally {
        isInitializing = false;
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

  // Handle global mouse move for smooth dragging when mouse leaves card
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

    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, swipeEnabled, dragStart]);

  // Gesture recognition is always enabled - no toggle needed
  // Removed toggleGestureRecognition function since gestures are always on

  const checkSwipeLimit = async () => {
    if (!user?.uid) return;
    try {
      const limit = await UserService.getSwipeLimit();
      setSwipeLimit(limit);
    } catch (err: any) {
      // Silently handle network errors - allow swiping if backend is unavailable
      // Set default values so the app doesn't break
      setSwipeLimit({ canSwipe: true, remainingSwipes: 50, isPremium: false });
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
      // Failed to load profiles - silent error
    } finally {
      setLoading(false);
    }
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!swipeEnabled || swiping || swipeDirection) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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

  // Handle global mouse up for when mouse leaves card area
  useEffect(() => {
    if (!isDragging || !swipeEnabled) return;

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

    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, swipeEnabled]);

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
        {/* Gesture Controls */}
        <div className="swipe-enable-control" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Handle mouse leaving the card
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

        {/* Gesture Instructions - Below Status */}
        <div className="swipe-gesture-instructions">
          <p className="swipe-gesture-instructions-title">
            Gesture Controls
          </p>
          <p className="swipe-gesture-instructions-text">
            <strong>Like:</strong> Nod your head up/down (vertical) | <strong>Be freaky:</strong> Shake your head left/right (horizontal). The system will wait a moment before detecting your gesture.
          </p>
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

        {/* Hidden video and canvas for gesture recognition - Always Active */}
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '640px', height: '480px' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

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
