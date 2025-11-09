import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { UserService, UserProfile, UpdateProfileData, UpdatePreferencesData } from '../../services/user.service';
import { useAuthUser } from '../../hooks/useAuthUser';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import './Profile.css';

type TabType = 'profile' | 'preferences';

const ARCH_TYPES = ['High', 'Medium', 'Low', 'Flat'];
const ARCH_SIZES = ['Small', 'Medium', 'Large', 'Extra Large'];
const AGE_CATEGORIES = ['Googgoogaga', 'Underage', 'Middle Aged', 'Have Grandchildren'];
const FAMILY_STATUSES = [
  'Minor',
  'Underage Mom',
  'Divorced Mom',
  'Divorced Dad',
  'Engaged'
];

const FOOT_FEEL_PREFERENCES = [
  'Ticklish',
  'Loves Pressure',
  'Light Touch',
  'No Contact'
];

const AESTHETIC_PREFERENCES = [
  'Glitter Toes',
  'Painted Nails',
  'Minimalist Look',
  'Foot Jewelry'
];

const TOE_ACTIVITY_PREFERENCES = [
  'Licking',
  'Massaging',
  'Staring',
  'Swallowing'
];

const FOOT_PERSONALITY_PREFERENCES = [
  'Introverted',
  'Extroverted Arch',
  'Chaotic Heel',
  'Naughty'
];

const CARE_ROUTINE_PREFERENCES = [
  'Daily Moisturizer',
  'Spa Treat',
  'Natural Raw',
  'Aloe Only'
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
  const [ageCategory, setAgeCategory] = useState('');
  const [familyStatus, setFamilyStatus] = useState('');
  const [preferredArchTypes, setPreferredArchTypes] = useState<string[]>([]);
  const [preferredArchSizes, setPreferredArchSizes] = useState<string[]>([]);
  const [footFeelPreferences, setFootFeelPreferences] = useState<string[]>([]);
  const [aestheticPreferences, setAestheticPreferences] = useState<string[]>([]);
  const [toeActivityPreferences, setToeActivityPreferences] = useState<string[]>([]);
  const [footPersonalityPreferences, setFootPersonalityPreferences] = useState<string[]>([]);
  const [careRoutinePreferences, setCareRoutinePreferences] = useState<string[]>([]);
  const [personalNote, setPersonalNote] = useState('');
  const [showAdditionalPreferences, setShowAdditionalPreferences] = useState(false);

  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const feetFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firebaseUser) {
      loadUserProfile();
    }
  }, [firebaseUser]);

  useEffect(() => {
    // Clear messages when switching tabs
    setError('');
    setSuccess('');
  }, [activeTab]);

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
      setAgeCategory(userData.ageCategory || '');
      setFamilyStatus(userData.familyStatus || '');
      setPreferredArchTypes(userData.preferredArchTypes || []);
      setPreferredArchSizes(userData.preferredArchSizes || []);
      setFootFeelPreferences(userData.footFeelPreferences || []);
      setAestheticPreferences(userData.aestheticPreferences || []);
      setToeActivityPreferences(userData.toeActivityPreferences || []);
      setFootPersonalityPreferences(userData.footPersonalityPreferences || []);
      setCareRoutinePreferences(userData.careRoutinePreferences || []);
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

      // Check if there's any data to save
      if (Object.keys(updateData).length === 0) {
        setError('Please fill in at least one field before saving');
        setSaving(false);
        return;
      }

      console.log('[Profile] Saving profile data:', Object.keys(updateData));
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
      console.error('Profile save error:', err);
      const errorMessage = err.message || '';
      // Show all errors, including network errors
      if (errorMessage) {
        setError(errorMessage || 'Failed to save profile');
      } else {
        setError('Failed to save profile. Please check your connection and try again.');
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
        ageCategory: ageCategory || undefined,
        familyStatus: familyStatus || undefined,
        preferredArchTypes,
        preferredArchSizes,
        footFeelPreferences,
        aestheticPreferences,
        toeActivityPreferences,
        footPersonalityPreferences,
        careRoutinePreferences,
        personalNote: personalNote.trim() || undefined,
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
            <p className="text-body">Loading...</p>
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
          {!isProfileComplete && (
            <div className="profile-completion-banner">
              <p className="profile-completion-text">
                Complete your profile to start matching! ({Math.round(profileCompletionStatus)}%)
              </p>
            </div>
          )}

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

          <div className={`profile-tab-content ${activeTab === 'profile' ? 'profile-tab-content--active' : ''}`}>
          {activeTab === 'profile' && (
            <div className="profile-form">
              <div className="profile-section profile-section--picture">
                <h3 className="text-subheading">
                  Profile Picture <span className="required-star">*</span>
                </h3>
                <div className="profile-picture-wrapper">
                  <div className="profile-picture-container">
                    {profilePicture ? (
                      <div className="profile-picture-preview">
                        <img src={profilePicture} alt="Profile" />
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
                <div className="profile-picture-actions">
                  <Button
                    variant="secondary"
                    onClick={() => profileFileInputRef.current?.click()}
                  >
                    {profilePicture ? 'Change' : 'Upload'}
                  </Button>
                  {profilePicture && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const defaultPhoto = firebaseUser?.photoURL || null;
                        setProfilePicture(defaultPhoto);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="profile-section profile-section--feet-photos">
                <h3 className="text-subheading">
                  Feet Photos <span className="required-star">*</span>
                </h3>
                <p className="text-small" style={{ marginBottom: '0.75rem' }}>Upload at least 1 photo of your feet</p>
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

              <div className="profile-section profile-section--full-name">
                <h3 className="text-subheading">
                  Full Name <span className="required-star">*</span>
                </h3>
                <Input
                  type="text"
                  label=""
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="profile-section">
                <h3 className="text-subheading">Bio</h3>
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
                Save Profile
              </Button>
              {saving && <p className="text-small text-center mt-small" style={{ color: 'var(--text-dark)' }}>Saving...</p>}
              {success && <div className="profile-success-text">{success}</div>}
            </div>
          )}
          </div>

          <div className={`profile-tab-content ${activeTab === 'preferences' ? 'profile-tab-content--active' : ''}`}>
          {activeTab === 'preferences' && (
            <div className="profile-form">
              <div className="profile-section">
                <h2 className="text-heading">Your Arch Information</h2>
                <div className="profile-section-column">
                  <div className="profile-section-field">
                    <label className="input-label">Arch Type</label>
                    <div className="radio-group">
                      {ARCH_TYPES.map(type => (
                        <label key={type} className="radio-option">
                          <input
                            type="radio"
                            name="archType"
                            value={type}
                            checked={archType === type}
                            onChange={(e) => setArchType(e.target.value)}
                          />
                          <span className="radio-label">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="profile-section-field">
                    <label className="input-label">Arch Size</label>
                    <div className="radio-group">
                      {ARCH_SIZES.map(size => (
                        <label key={size} className="radio-option">
                          <input
                            type="radio"
                            name="archSize"
                            value={size}
                            checked={archSize === size}
                      onChange={(e) => setArchSize(e.target.value)}
                    />
                          <span className="radio-label">{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="text-heading">Personal Information</h2>
                <div className="profile-section-column">
                  <div className="profile-section-field">
                    <label className="input-label">Age</label>
                    <div className="radio-group">
                      {AGE_CATEGORIES.map(category => (
                        <label key={category} className="radio-option">
                          <input
                            type="radio"
                            name="ageCategory"
                            value={category}
                            checked={ageCategory === category}
                            onChange={(e) => setAgeCategory(e.target.value)}
                    />
                          <span className="radio-label">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="profile-section-field">
                    <label className="input-label">Family Status</label>
                    <div className="radio-group">
                      {FAMILY_STATUSES.map(status => (
                        <label key={status} className="radio-option">
                          <input
                            type="radio"
                            name="familyStatus"
                            value={status}
                            checked={familyStatus === status}
                            onChange={(e) => setFamilyStatus(e.target.value)}
                          />
                          <span className="radio-label">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-heading" style={{ marginTop: '0', marginBottom: '1.5rem' }}>Preferences</h2>

              <div className="profile-section">
                <h3 className="text-subheading">Preferred Arch Types</h3>
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
                <h3 className="text-subheading">Preferred Arch Sizes</h3>
                <div className="preferences-chips">
                  {ARCH_SIZES.map(size => (
                    <button
                      key={size}
                      className={`preference-chip ${preferredArchSizes.includes(size) ? 'preference-chip--active' : ''}`}
                      onClick={() => {
                        if (preferredArchSizes.includes(size)) {
                          setPreferredArchSizes(preferredArchSizes.filter(s => s !== size));
                        } else {
                          setPreferredArchSizes([...preferredArchSizes, size]);
                        }
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                  </div>

              <div className="profile-section">
                        <button
                  type="button"
                  className="additional-preferences-toggle"
                  onClick={() => setShowAdditionalPreferences(!showAdditionalPreferences)}
                        >
                  <span>Additional Preferences</span>
                  <span className={`toggle-icon ${showAdditionalPreferences ? 'toggle-icon--open' : ''}`}>
                    ▼
                  </span>
                        </button>
                      </div>

              {showAdditionalPreferences && (
                <>
              <div className="profile-section">
                <h3 className="text-subheading">Foot Feel</h3>
                <div className="preferences-chips">
                  {FOOT_FEEL_PREFERENCES.map(pref => (
                    <button
                      key={pref}
                      className={`preference-chip ${footFeelPreferences.includes(pref) ? 'preference-chip--active' : ''}`}
                      onClick={() => {
                        if (footFeelPreferences.includes(pref)) {
                          setFootFeelPreferences(footFeelPreferences.filter(p => p !== pref));
                        } else {
                          setFootFeelPreferences([...footFeelPreferences, pref]);
                        }
                      }}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div className="profile-section">
                <h3 className="text-subheading">Aesthetic</h3>
                <div className="preferences-chips">
                  {AESTHETIC_PREFERENCES.map(pref => (
                    <button
                      key={pref}
                      className={`preference-chip ${aestheticPreferences.includes(pref) ? 'preference-chip--active' : ''}`}
                      onClick={() => {
                        if (aestheticPreferences.includes(pref)) {
                          setAestheticPreferences(aestheticPreferences.filter(p => p !== pref));
                        } else {
                          setAestheticPreferences([...aestheticPreferences, pref]);
                        }
                      }}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div className="profile-section">
                <h3 className="text-subheading">Toe Activity</h3>
                <div className="preferences-chips">
                  {TOE_ACTIVITY_PREFERENCES.map(pref => (
                    <button
                      key={pref}
                      className={`preference-chip ${toeActivityPreferences.includes(pref) ? 'preference-chip--active' : ''}`}
                      onClick={() => {
                        if (toeActivityPreferences.includes(pref)) {
                          setToeActivityPreferences(toeActivityPreferences.filter(p => p !== pref));
                        } else {
                          setToeActivityPreferences([...toeActivityPreferences, pref]);
                        }
                      }}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div className="profile-section">
                <h3 className="text-subheading">Foot Personality</h3>
                <div className="preferences-chips">
                  {FOOT_PERSONALITY_PREFERENCES.map(pref => (
                    <button
                      key={pref}
                      className={`preference-chip ${footPersonalityPreferences.includes(pref) ? 'preference-chip--active' : ''}`}
                      onClick={() => {
                        if (footPersonalityPreferences.includes(pref)) {
                          setFootPersonalityPreferences(footPersonalityPreferences.filter(p => p !== pref));
                        } else {
                          setFootPersonalityPreferences([...footPersonalityPreferences, pref]);
                        }
                      }}
                    >
                      {pref}
                    </button>
                    ))}
                  </div>
              </div>

              <div className="profile-section">
                <h3 className="text-subheading">Care Routine</h3>
                <div className="preferences-chips">
                  {CARE_ROUTINE_PREFERENCES.map(pref => (
                    <button
                      key={pref}
                      className={`preference-chip ${careRoutinePreferences.includes(pref) ? 'preference-chip--active' : ''}`}
                      onClick={() => {
                        if (careRoutinePreferences.includes(pref)) {
                          setCareRoutinePreferences(careRoutinePreferences.filter(p => p !== pref));
                        } else {
                          setCareRoutinePreferences([...careRoutinePreferences, pref]);
                        }
                      }}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div className="profile-section">
                <h3 className="text-subheading">Personal Note</h3>
                <textarea
                  className="input input--textarea"
                  placeholder="Write your own note..."
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  rows={4}
                />
              </div>
                </>
              )}

              <Button
                variant="primary"
                onClick={handleSavePreferences}
                disabled={saving}
                className="profile-save-btn"
              >
                Save Preferences
              </Button>
              {saving && <p className="text-small text-center mt-small" style={{ color: 'var(--text-dark)' }}>Saving...</p>}
              {success && <div className="profile-success-text">{success}</div>}
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
};
