import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../../components/Navigation/Navigation';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { useAuthUser } from '../../hooks/useAuthUser';
import { updateProfile } from 'firebase/auth';
import './Profile.css';

interface ProfileData {
  displayName: string;
  age: string;
  bio: string;
  location: string;
  interests: string;
}

export const Profile: React.FC = () => {
  const { user, loading } = useAuthUser();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    age: '',
    bio: '',
    location: '',
    interests: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load existing profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        age: localStorage.getItem('user_age') || '',
        bio: localStorage.getItem('user_bio') || '',
        location: localStorage.getItem('user_location') || '',
        interests: localStorage.getItem('user_interests') || '',
      });
    }
  }, [user]);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      if (!user) {
        throw new Error('You must be logged in to save your profile');
      }

      // Update Firebase profile
      if (profileData.displayName) {
        await updateProfile(user, {
          displayName: profileData.displayName,
        });
      }

      // Save additional profile data to localStorage (since MongoDB is disabled)
      localStorage.setItem('user_age', profileData.age);
      localStorage.setItem('user_bio', profileData.bio);
      localStorage.setItem('user_location', profileData.location);
      localStorage.setItem('user_interests', profileData.interests);
      localStorage.setItem('profile_complete', 'true');

      setSuccess(true);
      // Redirect to match page after 1 second
      setTimeout(() => {
        navigate('/match');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container">
        <div className="profile-container">
          <div className="profile-header">
            <h1 className="profile-title">Complete Your Profile</h1>
            <p className="profile-subtitle">
              Tell us about yourself to find your perfect match
            </p>
          </div>

          <div className="card profile-card">
            {user?.photoURL && (
              <div className="profile-photo-section">
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="profile-photo"
                />
                <p className="profile-email">{user.email}</p>
              </div>
            )}

            {success && (
              <div className="success-message">
                Profile saved successfully!
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSave} className="form profile-form">
              <Input
                type="text"
                label="Display Name"
                placeholder="Enter your name"
                value={profileData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                required
              />

              <div className="input-group">
                <label className="input-label">Age</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Enter your age"
                  value={profileData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  min="18"
                  max="100"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Bio</label>
                <textarea
                  className="input textarea"
                  placeholder="Tell us about yourself..."
                  value={profileData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <span className="char-count">
                  {profileData.bio.length}/500
                </span>
              </div>

              <Input
                type="text"
                label="Location"
                placeholder="City, State"
                value={profileData.location}
                onChange={(e) => handleChange('location', e.target.value)}
              />

              <Input
                type="text"
                label="Interests"
                placeholder="e.g., hiking, reading, cooking"
                value={profileData.interests}
                onChange={(e) => handleChange('interests', e.target.value)}
              />

              <div className="profile-actions">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="btn--full-width"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
