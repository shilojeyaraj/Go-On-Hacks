import React, { useState, useEffect } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { UserService, UserProfile } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import './Match.css';

export const Match: React.FC = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkProfileAndLoadMatches();
  }, [user]);

  const checkProfileAndLoadMatches = async () => {
    try {
      setLoading(true);
      
      // Check if current user has completed profile
      const userData = await UserService.getCurrentUser();
      setCurrentUser(userData);

      if (!userData.profileCompleted) {
        // Redirect to profile if not completed
        return;
      }

      // Load matches (users with completed profiles)
      const matchesData = await UserService.getMatches();
      setMatches(matchesData);
    } catch (err: any) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container">
          <div className="card card--medium card--centered">
            <p className="text-body">Loading matches...</p>
          </div>
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
              Please complete your profile to start matching with others.
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

  return (
    <>
      <Navigation />
      <div className="match-container">
        <div className="match-header">
          <h1 className="text-title">Find Your Match</h1>
          <p className="text-subtitle">Browse profiles of users with completed profiles</p>
        </div>

        {matches.length === 0 ? (
          <div className="card card--medium card--centered">
            <p className="text-body text-center">No matches found yet. Check back later!</p>
          </div>
        ) : (
          <div className="matches-grid">
            {matches.map((match) => (
              <div key={match.uid} className="match-card card">
                <div className="match-card-avatar">
                  {match.profilePicture ? (
                    <img src={match.profilePicture} alt={match.fullName || 'User'} />
                  ) : (
                    <div className="match-card-avatar-placeholder">
                      {(match.fullName || match.displayName || 'U')[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="match-card-name">{match.fullName || match.displayName || 'Anonymous'}</h3>
                {match.bio && <p className="match-card-bio">{match.bio}</p>}
                {match.age && <p className="match-card-info">Age: {match.age}</p>}
                {match.archType && <p className="match-card-info">Arch Type: {match.archType}</p>}
                {match.feetPhotos && match.feetPhotos.length > 0 && (
                  <div className="match-card-feet-preview">
                    <img src={match.feetPhotos[0]} alt="Feet preview" />
                  </div>
                )}
                <Button
                  variant="primary"
                  className="match-card-message-btn"
                  onClick={async () => {
                    if (user?.uid) {
                      try {
                        // Get or create conversation
                        await ChatService.getOrCreateConversation(match.uid);
                        // Navigate to chat page with user ID in state
                        navigate('/chat', { state: { userId: match.uid } });
                      } catch (err: any) {
                        console.error('Failed to start conversation:', err);
                      }
                    }
                  }}
                >
                  Message
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
