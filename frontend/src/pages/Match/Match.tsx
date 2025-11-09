import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useNavigate } from 'react-router-dom';
import { api } from '../../shared/api';
import './Match.css';

// MediaPipe will be loaded via CDN
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

interface MatchProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  interests: string;
  photoURL?: string;
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

export const Match: React.FC = () => {
  const { user, loading } = useAuthUser();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Gesture recognition state
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [gestureStatus, setGestureStatus] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameBufferRef = useRef<number[][]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const faceMeshRef = useRef<any>(null);
  const lastGestureTime = useRef<number>(0);
  const lastGestureType = useRef<'YES' | 'NO' | null>(null);
  const lastPredictionTime = useRef<number>(0);

  const SEQUENCE_LENGTH = 15;
  const PREDICTION_INTERVAL = 500; // Predict every 500ms
  const GESTURE_COOLDOWN = 2000; // 2 seconds between gesture actions
  const MIN_CONFIDENCE = 0.7; // Minimum confidence to trigger swipe

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    // Check if profile is complete
    const profileComplete = localStorage.getItem('profile_complete');
    if (!profileComplete) {
      navigate('/profile');
      return;
    }

    // Load matches from localStorage (since MongoDB is disabled)
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, navigate]);

  // Initialize MediaPipe Face Mesh
  useEffect(() => {
    const loadMediaPipe = () => {
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

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (matches.length === 0 || currentIndex >= matches.length) return;
    
    setSwipeDirection(direction);
    
    setTimeout(() => {
      if (currentIndex < matches.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(matches.length);
      }
      setSwipeDirection(null);
    }, 600);
  }, [matches.length, currentIndex]);

  // Predict gesture from buffer
  const predictGesture = useCallback(async (sequence: number[][]) => {
    if (sequence.length !== SEQUENCE_LENGTH) {
      console.log('[GESTURE] Buffer not full yet:', sequence.length, '/', SEQUENCE_LENGTH);
      return;
    }

    console.log('[GESTURE] Sending prediction request to backend...');
    console.log('[GESTURE] Sequence shape:', sequence.length, 'x', sequence[0]?.length);

    try {
      const response = await api.post<{ success: boolean; error?: string } & Partial<GestureResult>>('/gestures/predict', {
        sequence,
      });

      console.log('[GESTURE] Backend response:', response.data);

      if (response.data.success && response.data.gesture) {
        const gesture = response.data.gesture;
        const confidence = response.data.confidence || 0;

        console.log(`[GESTURE] Detected: ${gesture} with ${(confidence * 100).toFixed(1)}% confidence`);

        // Only trigger swipe if confidence is high enough and cooldown has passed
        const now = Date.now();
        const timeSinceLastGesture = now - lastGestureTime.current;
        
        console.log(`[GESTURE] Confidence check: ${(confidence * 100).toFixed(1)}% >= ${(MIN_CONFIDENCE * 100)}% = ${confidence >= MIN_CONFIDENCE}`);
        console.log(`[GESTURE] Cooldown check: ${timeSinceLastGesture}ms >= ${GESTURE_COOLDOWN}ms = ${timeSinceLastGesture >= GESTURE_COOLDOWN}`);
        
        if (confidence >= MIN_CONFIDENCE && timeSinceLastGesture >= GESTURE_COOLDOWN) {
          if (gesture === 'YES' && lastGestureType.current !== 'YES') {
            // Swipe right (like)
            console.log('[GESTURE] ✅ YES detected - Triggering swipe RIGHT');
            setGestureStatus('YES detected - Liking!');
            lastGestureTime.current = now;
            lastGestureType.current = 'YES';
            handleSwipe('right');
          } else if (gesture === 'NO' && lastGestureType.current !== 'NO') {
            // Swipe left (pass)
            console.log('[GESTURE] ❌ NO detected - Triggering swipe LEFT');
            setGestureStatus('NO detected - Passing!');
            lastGestureTime.current = now;
            lastGestureType.current = 'NO';
            handleSwipe('left');
          } else {
            console.log(`[GESTURE] Gesture ${gesture} detected but already processed (last: ${lastGestureType.current})`);
          }
        } else {
          if (confidence < MIN_CONFIDENCE) {
            console.log(`[GESTURE] ⚠️ Confidence too low: ${(confidence * 100).toFixed(1)}% < ${(MIN_CONFIDENCE * 100)}%`);
          }
          if (timeSinceLastGesture < GESTURE_COOLDOWN) {
            console.log(`[GESTURE] ⚠️ Cooldown active: ${timeSinceLastGesture}ms < ${GESTURE_COOLDOWN}ms`);
          }
          
          if (gesture === 'NEUTRAL') {
            setGestureStatus('Ready - Nod YES or Shake NO');
            lastGestureType.current = null;
          } else {
            setGestureStatus(`Detected: ${gesture} (${(confidence * 100).toFixed(0)}% confidence)`);
          }
        }
      } else {
        console.log('[GESTURE] ❌ Backend returned error:', response.data.error);
        setGestureStatus(response.data.error || 'Prediction failed');
      }
    } catch (err: any) {
      console.error('[GESTURE] ❌ Prediction error:', err);
      console.error('[GESTURE] Error details:', err.response?.data || err.message);
      setGestureStatus(`Gesture detection error: ${err.response?.data?.error || err.message}`);
    }
  }, [handleSwipe]);

  // Process video frame
  const processFrame = useCallback(() => {
    if (!videoRef.current || !faceMeshRef.current || !isGestureActive) {
      if (!videoRef.current) console.log('[GESTURE] ⚠️ Video ref not available');
      if (!faceMeshRef.current) console.log('[GESTURE] ⚠️ MediaPipe not initialized');
      if (!isGestureActive) console.log('[GESTURE] ⚠️ Gesture recognition not active');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Send frame to MediaPipe
        faceMeshRef.current.send({ image: canvas });
      }
    } else {
      if (video.readyState < video.HAVE_ENOUGH_DATA) {
        console.log(`[GESTURE] ⚠️ Video not ready. State: ${video.readyState}`);
      }
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isGestureActive]);

  // Handle MediaPipe results
  useEffect(() => {
    if (!faceMeshRef.current) {
      console.log('[GESTURE] MediaPipe not initialized yet');
      return;
    }

    console.log('[GESTURE] Setting up MediaPipe onResults handler');

    faceMeshRef.current.onResults((results: any) => {
      const features = extractLandmarks(results);
      
      if (features) {
        frameBufferRef.current.push(features);
        
        // Keep buffer at sequence length
        if (frameBufferRef.current.length > SEQUENCE_LENGTH) {
          frameBufferRef.current.shift();
        }

        // Log buffer status periodically
        if (frameBufferRef.current.length % 5 === 0) {
          console.log(`[GESTURE] Buffer: ${frameBufferRef.current.length}/${SEQUENCE_LENGTH} frames`);
        }

        // Predict when buffer is full
        const now = Date.now();
        if (frameBufferRef.current.length === SEQUENCE_LENGTH && 
            now - lastPredictionTime.current >= PREDICTION_INTERVAL) {
          console.log('[GESTURE] Buffer full, triggering prediction...');
          lastPredictionTime.current = now;
          predictGesture([...frameBufferRef.current]);
        }
      } else {
        if (frameBufferRef.current.length === 0) {
          console.log('[GESTURE] No face detected in frame');
        }
      }
    });
  }, [extractLandmarks, predictGesture]);

  // Start/stop gesture recognition
  const toggleGestureRecognition = useCallback(async () => {
    if (isGestureActive) {
      // Stop
      console.log('[GESTURE] Stopping gesture recognition...');
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          console.log('[GESTURE] Stopping track:', track.kind, track.label);
          track.stop();
        });
        mediaStreamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsGestureActive(false);
      setGestureStatus('');
      frameBufferRef.current = [];
      lastPredictionTime.current = 0;
      console.log('[GESTURE] Gesture recognition stopped');
    } else {
      // Start - Request camera access
      console.log('[GESTURE] Starting gesture recognition...');
      try {
        setGestureStatus('Requesting camera access...');
        console.log('[GESTURE] Requesting camera permission...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
        });
        
        console.log('[GESTURE] ✅ Camera access granted');
        console.log('[GESTURE] Stream tracks:', stream.getTracks().map(t => `${t.kind}: ${t.label}`));
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          mediaStreamRef.current = stream;
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log('[GESTURE] Video metadata loaded');
            console.log('[GESTURE] Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
            console.log('[GESTURE] MediaPipe initialized:', !!faceMeshRef.current);
            setIsGestureActive(true);
            setGestureStatus('Camera active - Nod YES or Shake NO');
            console.log('[GESTURE] Starting frame processing...');
            processFrame();
          };
          
          // Start playing video
          videoRef.current.play().then(() => {
            console.log('[GESTURE] ✅ Video playback started');
          }).catch((err) => {
            console.error('[GESTURE] ❌ Error playing video:', err);
            setGestureStatus('Error starting video');
          });
        }
      } catch (err: any) {
        console.error('[GESTURE] ❌ Error accessing camera:', err);
        console.error('[GESTURE] Error name:', err.name);
        console.error('[GESTURE] Error message:', err.message);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setGestureStatus('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setGestureStatus('No camera found. Please connect a camera device.');
        } else {
          setGestureStatus(`Camera error: ${err.message || 'Unknown error'}`);
        }
      }
    }
  }, [isGestureActive, processFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const loadMatches = () => {
    setLoadingMatches(true);
    
    const savedMatches = localStorage.getItem('matches');
    
    if (savedMatches) {
      try {
        const parsed = JSON.parse(savedMatches);
        setMatches(parsed);
      } catch (error) {
        console.error('Failed to parse matches:', error);
        setMatches(getMockMatches());
      }
    } else {
      const mockMatches = getMockMatches();
      setMatches(mockMatches);
      localStorage.setItem('matches', JSON.stringify(mockMatches));
    }
    
    setLoadingMatches(false);
  };

  const getMockMatches = (): MatchProfile[] => {
    return [
      {
        id: '1',
        name: 'Alex',
        age: 28,
        bio: 'Love hiking, reading, and trying new restaurants. Looking for someone to share adventures with!',
        location: 'New York, NY',
        interests: 'hiking, reading, food',
      },
      {
        id: '2',
        name: 'Jordan',
        age: 25,
        bio: 'Photography enthusiast and coffee lover. Always up for a good conversation.',
        location: 'Los Angeles, CA',
        interests: 'photography, coffee, travel',
      },
      {
        id: '3',
        name: 'Sam',
        age: 30,
        bio: 'Fitness enthusiast and bookworm. Looking for someone who shares my passion for life.',
        location: 'Chicago, IL',
        interests: 'fitness, books, cooking',
      },
      {
        id: '4',
        name: 'Taylor',
        age: 27,
        bio: 'Music lover and outdoor adventurer. Let\'s explore the world together!',
        location: 'Seattle, WA',
        interests: 'music, hiking, travel',
      },
      {
        id: '5',
        name: 'Casey',
        age: 26,
        bio: 'Art lover and weekend chef. Looking for someone to share life\'s beautiful moments.',
        location: 'Portland, OR',
        interests: 'art, cooking, travel',
      },
    ];
  };


  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragOffset.x) > 150) {
      handleSwipe(dragOffset.x > 0 ? 'right' : 'left');
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragOffset.x) > 150) {
      handleSwipe(dragOffset.x > 0 ? 'right' : 'left');
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  if (loading || loadingMatches) {
    return (
      <>
        <Navigation />
        <div className="match-container">
          <div className="loading">Loading matches...</div>
        </div>
      </>
    );
  }

  const currentProfile = matches[currentIndex];
  const remainingCount = matches.length - currentIndex;

  if (!currentProfile || currentIndex >= matches.length) {
    return (
      <>
        <Navigation />
        <div className="match-container">
          <div className="match-header">
            <h1 className="match-title">Find Your Match</h1>
            <p className="match-subtitle">No profiles remaining</p>
          </div>
          <div className="match-content">
            <div className="match-empty">
              <p className="text-body text-center" style={{ padding: '2rem' }}>
                You've seen all available matches! Check back later for more.
              </p>
              <button
                className="btn btn--primary"
                onClick={() => navigate('/swipe')}
                style={{ marginTop: '1rem' }}
              >
                Try Gesture Swiping
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const rotation = isDragging ? dragOffset.x / 30 : 0;
  const opacity = isDragging ? 1 - Math.abs(dragOffset.x) / 300 : 1;
  
  const getCardBackground = () => {
    if (!isDragging) return 'white';
    
    const dragAmount = Math.abs(dragOffset.x);
    const intensity = Math.min(dragAmount / 150, 0.6);
    
    if (dragOffset.x > 0) {
      return `rgba(76, 175, 80, ${intensity})`;
    } else if (dragOffset.x < 0) {
      return `rgba(244, 67, 54, ${intensity})`;
    }
    return 'white';
  };

  return (
    <>
      <Navigation />
      <div className="match-container">
        <div className="match-header">
          <h1 className="match-title">Find Your Match</h1>
          <p className="match-subtitle">
            {remainingCount} profile{remainingCount !== 1 ? 's' : ''} remaining
          </p>
        </div>

        {/* Hidden video for gesture recognition */}
        <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '1px', height: '1px' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Gesture control button */}
        <div className="match-gesture-control">
          <button
            className={`btn ${isGestureActive ? 'btn-danger' : 'btn-primary'}`}
            onClick={toggleGestureRecognition}
            style={{ marginBottom: '0.5rem', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
          >
            {isGestureActive ? 'Stop Gesture Control' : 'Start Gesture Control'}
          </button>
          {gestureStatus && (
            <p className="match-gesture-status">{gestureStatus}</p>
          )}
        </div>

        <div className="match-content">
          <div 
            ref={cardRef}
            className={`match-card ${swipeDirection ? `match-card--swipe-${swipeDirection}` : ''}`}
            style={{
              transform: isDragging 
                ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`
                : '',
              opacity: opacity,
              backgroundColor: getCardBackground(),
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="match-card-content">
              <div className="match-card-image-container">
                {currentProfile.photoURL ? (
                  <img
                    src={currentProfile.photoURL}
                    alt={currentProfile.name}
                    className="match-card-image"
                  />
                ) : (
                  <div className="match-card-image match-card-image--placeholder">
                    {currentProfile.name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="match-card-info">
                <h2 className="match-card-name">
                  {currentProfile.name}, {currentProfile.age}
                </h2>
                <p className="match-card-location">{currentProfile.location}</p>
                <p className="match-card-bio">{currentProfile.bio}</p>
                <div className="match-card-interests">
                  <strong>Interests: </strong>
                  {currentProfile.interests}
                </div>
              </div>
            </div>
          </div>

          {/* Swipe buttons */}
          <div className="match-actions">
            <button 
              className="match-button match-button--nope"
              onClick={() => handleSwipe('left')}
              disabled={swipeDirection !== null}
            >
              <span className="match-button-icon">✕</span>
            </button>
            <button 
              className="match-button match-button--like"
              onClick={() => handleSwipe('right')}
              disabled={swipeDirection !== null}
            >
              <span className="match-button-icon">♥</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
