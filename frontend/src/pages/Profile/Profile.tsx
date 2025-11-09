import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { UserService, UserProfile, UpdateProfileData, UpdatePreferencesData } from '../../services/user.service';
import { useAuthUser } from '../../hooks/useAuthUser';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import './Profile.css';

type TabType = 'profile' | 'preferences';

const ARCH_TYPES = ['High', 'Medium', 'Low', 'Flat'];
const FAMILY_STATUSES = [
  'Underage Mom',
  'Divorced Mom',
  'Mom',
  'Divorced Dad',
  'Dad',
  'Other'
];

export const Profile: React.FC = () => {
  const { user: firebaseUser } = useAuthUser();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [feetPhotos, setFeetPhotos] = useState<string[]>([]);
  const [bio, setBio] = useState('');

  // Preferences fields
  const [archType, setArchType] = useState('');
  const [archSize, setArchSize] = useState('');
  const [age, setAge] = useState('');
  const [familyStatus, setFamilyStatus] = useState('');
  const [preferredArchTypes, setPreferredArchTypes] = useState<string[]>([]);
  const [preferredArchSizes, setPreferredArchSizes] = useState<string[]>([]);

  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const feetFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firebaseUser) {
      loadUserProfile();
    }
  }, [firebaseUser]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const userData = await UserService.getCurrentUser();
      setUser(userData);
      
      // Set profile fields - use Firebase photoURL as default if no profilePicture
      const defaultPhoto = firebaseUser?.photoURL || null;
      setFullName(userData.fullName || '');
      setProfilePicture(userData.profilePicture || defaultPhoto);
      setFeetPhotos(userData.feetPhotos || []);
      setBio(userData.bio || '');

      // Set preferences fields
      setArchType(userData.archType || '');
      setArchSize(userData.archSize || '');
      setAge(userData.age ? String(userData.age) : '');
      setFamilyStatus(userData.familyStatus || '');
      setPreferredArchTypes(userData.preferredArchTypes || []);
      setPreferredArchSizes(userData.preferredArchSizes || []);
    } catch (err: any) {
      // Only show error if it's not empty (404 errors are silenced)
      const errorMessage = err.message || '';
      if (errorMessage && !errorMessage.includes('404')) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await UserService.convertFileToBase64(file);
        setProfilePicture(base64);
      } catch (err: any) {
        setError('Failed to process image');
      }
    }
  };

  const handleFeetPhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        const base64Promises = files.map(file => UserService.convertFileToBase64(file));
        const base64Images = await Promise.all(base64Promises);
        setFeetPhotos([...feetPhotos, ...base64Images]);
      } catch (err: any) {
        setError('Failed to process images');
      }
    }
  };

  const removeFeetPhoto = (index: number) => {
    setFeetPhotos(feetPhotos.filter((_, i) => i !== index));
  };

  const reorderFeetPhoto = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...feetPhotos];
    if (direction === 'up' && index > 0) {
      [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
    } else if (direction === 'down' && index < newPhotos.length - 1) {
      [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
    }
    setFeetPhotos(newPhotos);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Build update data - only include fields that have values
      const updateData: UpdateProfileData = {};
      
      if (fullName.trim()) {
        updateData.fullName = fullName.trim();
      }
      
      // Always save profilePicture if it exists (even if same as Firebase, we want to persist it)
      if (profilePicture) {
        updateData.profilePicture = profilePicture;
      }
      
      if (feetPhotos.length > 0) {
        updateData.feetPhotos = feetPhotos;
      }
      
      if (bio.trim()) {
        updateData.bio = bio.trim();
      }

      const updatedUser = await UserService.updateProfile(updateData);
      setUser(updatedUser);
      
      // Update local state with saved data
      // Preserve profilePicture: use response if available, otherwise keep current state
      // This ensures base64 image data persists even if response doesn't include it
      setFullName(updatedUser.fullName || '');
      if (updateData.profilePicture) {
        // If we sent a profilePicture, use it (might not be in response due to size)
        setProfilePicture(updateData.profilePicture);
      } else if (updatedUser.profilePicture !== undefined && updatedUser.profilePicture !== null) {
        // If response has profilePicture, use it
        setProfilePicture(updatedUser.profilePicture);
      }
      // Otherwise keep current state (don't reset to Firebase photoURL)
      setFeetPhotos(updatedUser.feetPhotos || feetPhotos);
      setBio(updatedUser.bio || '');
      
      setSuccess('Profile saved successfully!');
    } catch (err: any) {
      const errorMessage = err.message || '';
      if (errorMessage && !errorMessage.includes('404')) {
        setError(errorMessage || 'Failed to save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updateData: UpdatePreferencesData = {
        archType: archType || undefined,
        archSize: archSize || undefined,
        age: age ? (age.trim() ? Number(age) : undefined) : undefined,
        familyStatus: familyStatus || undefined,
        preferredArchTypes,
        preferredArchSizes,
      };

      const updatedUser = await UserService.updatePreferences(updateData);
      setUser(updatedUser);
      setSuccess('Preferences saved successfully!');
    } catch (err: any) {
      const errorMessage = err.message || '';
      if (errorMessage && !errorMessage.includes('404')) {
        setError(errorMessage || 'Failed to save preferences');
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePreferredArchType = (type: string) => {
    if (preferredArchTypes.includes(type)) {
      setPreferredArchTypes(preferredArchTypes.filter(t => t !== type));
    } else {
      setPreferredArchTypes([...preferredArchTypes, type]);
    }
  };

  const addPreferredArchSize = () => {
    if (archSize && !preferredArchSizes.includes(archSize)) {
      setPreferredArchSizes([...preferredArchSizes, archSize]);
      setArchSize('');
    }
  };

  const removePreferredArchSize = (size: string) => {
    setPreferredArchSizes(preferredArchSizes.filter(s => s !== size));
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container">
          <div className="card card--medium card--centered">
            <p className="text-body">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  const isProfileComplete = user?.profileCompleted || false;
  const profileCompletionStatus = (
    (profilePicture ? 1 : 0) +
    (feetPhotos.length > 0 ? 1 : 0) +
    (fullName ? 1 : 0)
  ) / 3 * 100;

  return (
    <>
      <Navigation />
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="text-title">Your Profile</h1>
          {!isProfileComplete && (
            <div className="profile-completion-banner">
              <p className="profile-completion-text">
                Complete your profile to start matching! ({Math.round(profileCompletionStatus)}%)
              </p>
            </div>
          )}
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`profile-tab ${activeTab === 'preferences' ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        <div className="profile-content">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {activeTab === 'profile' && (
            <div className="profile-form">
              <div className="profile-section profile-section--picture">
                <h2 className="text-heading">Profile Picture</h2>
                <div className="profile-picture-wrapper">
                  <div className="profile-picture-container">
                    {profilePicture ? (
                      <div className="profile-picture-preview">
                        <img src={profilePicture} alt="Profile" />
                        <div className="profile-picture-overlay">
                          <button
                            className="profile-picture-upload-btn"
                            onClick={() => profileFileInputRef.current?.click()}
                            title="Change picture"
                          >
                            Change
                          </button>
                          <button
                            className="profile-picture-remove-btn"
                            onClick={() => {
                              const defaultPhoto = firebaseUser?.photoURL || null;
                              setProfilePicture(defaultPhoto);
                            }}
                            title="Remove custom picture"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="profile-picture-placeholder">
                        {firebaseUser?.photoURL ? (
                          <img src={firebaseUser.photoURL} alt="Profile" />
                        ) : (
                          <div className="profile-picture-initial">
                            {firebaseUser?.displayName?.[0]?.toUpperCase() || 
                             firebaseUser?.email?.[0]?.toUpperCase() || 
                             'U'}
                          </div>
                        )}
                        <div className="profile-picture-overlay">
                          <button
                            className="profile-picture-upload-btn"
                            onClick={() => profileFileInputRef.current?.click()}
                            title="Upload picture"
                          >
                            Upload
                          </button>
                        </div>
                      </div>
                    )}
                    <input
                      ref={profileFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="text-heading">Feet Photos</h2>
                <p className="text-small">Upload at least 1 photo of your feet</p>
                <div className="feet-photos-grid">
                  {feetPhotos.map((photo, index) => (
                    <div key={index} className="feet-photo-item">
                      <img src={photo} alt={`Feet photo ${index + 1}`} />
                      <div className="feet-photo-controls">
                        {index > 0 && (
                          <button
                            className="feet-photo-btn"
                            onClick={() => reorderFeetPhoto(index, 'up')}
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {index < feetPhotos.length - 1 && (
                          <button
                            className="feet-photo-btn"
                            onClick={() => reorderFeetPhoto(index, 'down')}
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          className="feet-photo-btn feet-photo-btn--remove"
                          onClick={() => removeFeetPhoto(index)}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <input
                  ref={feetFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFeetPhotosChange}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="secondary"
                  onClick={() => feetFileInputRef.current?.click()}
                >
                  Add Feet Photos
                </Button>
              </div>

              <div className="profile-section">
                <Input
                  type="text"
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="profile-section">
                <label className="input-label">Bio</label>
                <textarea
                  className="input input--textarea"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                variant="primary"
                onClick={handleSaveProfile}
                disabled={saving}
                className="profile-save-btn"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="profile-form">
              <div className="profile-section">
                <h2 className="text-heading">Your Arch Information</h2>
                <div className="profile-section-row">
                  <div className="profile-section-col">
                    <label className="input-label">Arch Type</label>
                    <select
                      className="input"
                      value={archType}
                      onChange={(e) => setArchType(e.target.value)}
                    >
                      <option value="">Select arch type</option>
                      {ARCH_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="profile-section-col">
                    <Input
                      type="text"
                      label="Arch Size"
                      placeholder="Enter arch size"
                      value={archSize}
                      onChange={(e) => setArchSize(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="text-heading">Personal Information</h2>
                <div className="profile-section-row">
                  <div className="profile-section-col">
                    <Input
                      type="number"
                      label="Age"
                      placeholder="Enter your age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  <div className="profile-section-col">
                    <label className="input-label">Family Status</label>
                    <select
                      className="input"
                      value={familyStatus}
                      onChange={(e) => setFamilyStatus(e.target.value)}
                    >
                      <option value="">Select family status</option>
                      {FAMILY_STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="text-heading">Preferred Arch Types</h2>
                <div className="preferences-chips">
                  {ARCH_TYPES.map(type => (
                    <button
                      key={type}
                      className={`preference-chip ${preferredArchTypes.includes(type) ? 'preference-chip--active' : ''}`}
                      onClick={() => togglePreferredArchType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="profile-section">
                <h2 className="text-heading">Preferred Arch Sizes</h2>
                <div className="preferred-sizes-container">
                  <div className="preferred-sizes-input">
                    <Input
                      type="text"
                      label="Add Size"
                      placeholder="Enter arch size"
                      value={archSize}
                      onChange={(e) => setArchSize(e.target.value)}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPreferredArchSize();
                        }
                      }}
                    />
                    <Button
                      variant="secondary"
                      onClick={addPreferredArchSize}
                      className="add-size-btn"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="preferred-sizes-list">
                    {preferredArchSizes.map((size, index) => (
                      <div key={index} className="preferred-size-chip">
                        {size}
                        <button
                          className="preferred-size-remove"
                          onClick={() => removePreferredArchSize(size)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleSavePreferences}
                disabled={saving}
                className="profile-save-btn"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
