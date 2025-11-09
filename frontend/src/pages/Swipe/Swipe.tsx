import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { UserService, UserProfile } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { GestureService } from '../../services/gesture.service';
import { GestureTFJSService } from '../../services/gesture-tfjs.service';
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

  // Gesture recognition state
  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [gestureStatus, setGestureStatus] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);
  const frameBufferRef = useRef<number[][]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastPredictionTime = useRef<number>(0);
  const gestureCooldownRef = useRef<boolean>(false);

  const SEQUENCE_LENGTH = 15;
  const PREDICTION_INTERVAL = 500; // Predict every 500ms
  const GESTURE_COOLDOWN = 2000; // 2 second cooldown after gesture detection

  useEffect(() => {
    checkProfileAndLoadProfiles();
    checkSwipeLimit();
    
    // Try to load TensorFlow.js model for browser-based predictions (no Python dependency)
    GestureTFJSService.loadModel().catch((err) => {
      console.log('[Swipe] TFJS model not available, will use backend fallback:', err.message);
    });
  }, [user]);

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
    const features = extractFeatures(landmarks);
    if (!features) return;

    // Add frame to buffer
    frameBufferRef.current.push(features);

    // Keep buffer at sequence length
    if (frameBufferRef.current.length > SEQUENCE_LENGTH) {
      frameBufferRef.current.shift();
    }
  }, [extractFeatures]);

  // Load MediaPipe Face Mesh
  useEffect(() => {
    const loadMediaPipeFromCDN = () => {
      // Check if already loaded
      if ((window as any).FaceMesh) {
        initializeFaceMesh();
        return;
      }

      // Load from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      script.onload = () => {
        const faceScript = document.createElement('script');
        faceScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
        faceScript.onload = () => {
          initializeFaceMesh();
        };
        document.head.appendChild(faceScript);
      };
      document.head.appendChild(script);
    };

    const initializeFaceMesh = () => {
      if ((window as any).FaceMesh) {
        const faceMesh = new (window as any).FaceMesh({
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
            processFaceLandmarks(results.multiFaceLandmarks[0].landmark);
          }
        });

        faceMeshRef.current = faceMesh;
        console.log('[Swipe] MediaPipe Face Mesh loaded from CDN');
      }
    };

    loadMediaPipeFromCDN();
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
    if (frameBufferRef.current.length !== SEQUENCE_LENGTH || gestureCooldownRef.current) {
      return;
    }

    try {
      const sequence = [...frameBufferRef.current];
      
      // Try TensorFlow.js first (browser-based, faster, no backend dependency)
      let result;
      try {
        if (GestureTFJSService.isModelLoaded()) {
          result = await GestureTFJSService.predictGesture(sequence);
          console.log('[Swipe] Gesture detected (TFJS):', result.gesture, 'confidence:', result.confidence);
        } else {
          // Fallback to backend Python prediction
          const backendResult = await GestureService.predictGesture(sequence);
          result = {
            gesture: backendResult.gesture as 'YES' | 'NO' | 'NEUTRAL',
            confidence: backendResult.confidence,
            probabilities: backendResult.probabilities,
          };
          console.log('[Swipe] Gesture detected (Backend):', result.gesture, 'confidence:', result.confidence);
        }
      } catch (tfjsError: any) {
        // If TFJS fails, fallback to backend
        console.log('[Swipe] TFJS prediction failed, using backend:', tfjsError.message);
        const backendResult = await GestureService.predictGesture(sequence);
        result = {
          gesture: backendResult.gesture as 'YES' | 'NO' | 'NEUTRAL',
          confidence: backendResult.confidence,
          probabilities: backendResult.probabilities,
        };
        console.log('[Swipe] Gesture detected (Backend fallback):', result.gesture, 'confidence:', result.confidence);
      }

      // Only act on high confidence predictions
      if (result.confidence > 0.7) {
        if (result.gesture === 'YES' && !swiping && !swipeDirection) {
          // Nod + lick up = YES → swipe right (like)
          setGestureStatus('✓ Liked!');
          gestureCooldownRef.current = true;
          setTimeout(() => {
            gestureCooldownRef.current = false;
            setGestureStatus('Camera active - Show your face');
          }, GESTURE_COOLDOWN);
          handleSwipe('like');
        } else if (result.gesture === 'NO' && !swiping && !swipeDirection) {
          // Shake head = NO → swipe left (pass)
          setGestureStatus('✕ Passed!');
          gestureCooldownRef.current = true;
          setTimeout(() => {
            gestureCooldownRef.current = false;
            setGestureStatus('Camera active - Show your face');
          }, GESTURE_COOLDOWN);
          handleSwipe('pass');
        }
      }
    } catch (err: any) {
      console.error('[Swipe] Gesture prediction error:', err);
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
    if (!videoRef.current || !canvasRef.current || !faceMeshRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const processFrame = async () => {
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Draw video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Process with MediaPipe
      if (faceMeshRef.current) {
        await faceMeshRef.current.send({ image: canvas });
      }

      // Check if we have enough frames and enough time has passed
      const now = Date.now();
      if (
        frameBufferRef.current.length === SEQUENCE_LENGTH &&
        now - lastPredictionTime.current >= PREDICTION_INTERVAL &&
        !gestureCooldownRef.current
      ) {
        lastPredictionTime.current = now;
        predictGesture();
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    processFrame();
  }, [predictGesture]);

  // Initialize camera when gesture recognition is enabled
  useEffect(() => {
    if (!gestureEnabled || !faceMeshRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          mediaStreamRef.current = stream;
          setGestureStatus('Camera active - Show your face');
          startGestureDetection();
        }
      } catch (err) {
        console.error('Failed to access camera:', err);
        setGestureStatus('Camera access denied');
        setGestureEnabled(false);
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, [gestureEnabled, startGestureDetection, stopCamera]);

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

  // Toggle gesture recognition
  const toggleGestureRecognition = useCallback(() => {
    if (gestureEnabled) {
      stopCamera();
      setGestureEnabled(false);
    } else {
      setGestureEnabled(true);
    }
  }, [gestureEnabled, stopCamera]);

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

        {/* Swipe Limit Display */}
        {swipeLimit && !swipeLimit.isPremium && (
          <div className="swipe-limit-display">
            <p className="swipe-limit-text">
              {swipeLimit.remainingSwipes > 0 ? (
                <>
                  <strong>{swipeLimit.remainingSwipes}</strong> swipes remaining today
                </>
              ) : (
                <>
                  Daily limit reached. <Link to="/pricing" className="swipe-limit-link">Upgrade to Premium</Link> for unlimited swipes!
                </>
              )}
            </p>
          </div>
        )}

        {/* Gesture Recognition Controls */}
        <div className="swipe-gesture-controls">
          <button
            className={`swipe-gesture-toggle ${gestureEnabled ? 'swipe-gesture-toggle--active' : ''}`}
            onClick={toggleGestureRecognition}
            disabled={swiping}
          >
            {gestureEnabled ? '📹 Stop Gestures' : '📷 Use Gestures'}
          </button>
          {gestureStatus && (
            <div className="swipe-gesture-status">{gestureStatus}</div>
          )}
        </div>

        {/* Hidden video and canvas for gesture recognition */}
        {gestureEnabled && (
          <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '640px', height: '480px' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="swipe-actions">
          <button
            className="swipe-action-btn swipe-action-btn--pass"
            onClick={() => handleSwipe('pass')}
            disabled={swiping || swipeDirection !== null}
          >
            ✕ Pass
          </button>
          <button
            className="swipe-action-btn swipe-action-btn--like"
            onClick={() => handleSwipe('like')}
            disabled={swiping || swipeDirection !== null}
          >
            ♥ Like
          </button>
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
