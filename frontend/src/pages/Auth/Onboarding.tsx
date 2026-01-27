import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { profileAPI } from '../../api';

interface SocialLinks {
  [key: string]: string;
  twitter: string;
  instagram: string;
  github: string;
  linkedin: string;
  youtube: string;
}

export const Onboarding: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.profile?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [gender, setGender] = useState<string>(user?.profile?.gender || 'prefer-not-to-say');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    twitter: user?.profile?.socialLinks?.twitter || '',
    instagram: user?.profile?.socialLinks?.instagram || '',
    github: user?.profile?.socialLinks?.github || '',
    linkedin: user?.profile?.socialLinks?.linkedin || '',
    youtube: user?.profile?.socialLinks?.youtube || '',
  });
  const [showSocials, setShowSocials] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialChange = (platform: keyof SocialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await profileAPI.completeOnboarding({
        displayName: displayName.trim(),
        username: username.trim(),
        gender,
        bio: bio.trim(),
        socialLinks,
      });
      
      updateUser(response.user);
      navigate('/pdf-tools');
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Progress indicator */}
        <div className="onboarding-progress">
          <div className="progress-step active">
            <div className="step-dot">1</div>
            <span>Profile Info</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${showSocials ? 'active' : ''}`}>
            <div className="step-dot">2</div>
            <span>Socials</span>
          </div>
        </div>

        {/* Header */}
        <div className="onboarding-header">
          <div className="onboarding-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="onboarding-title">Complete Your Profile</h1>
          <p className="onboarding-subtitle">
            Let's personalize your experience. This will only take a minute!
          </p>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message" style={{ textAlign: 'center', marginBottom: 16, padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
          )}

          {!showSocials ? (
            <>
              {/* Basic Info Section */}
              <div className="form-section">
                <div className="input-row">
                  <div className="input-group">
                    <label className="input-label">
                      Display Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      Username <span className="required">*</span>
                    </label>
                    <div className="input-with-prefix">
                      <span className="input-prefix">@</span>
                      <input
                        type="text"
                        className="input"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        required
                        minLength={3}
                        maxLength={30}
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Gender</label>
                  <div className="gender-options">
                    {[
                      { value: 'male', label: 'Male', icon: '♂️' },
                      { value: 'female', label: 'Female', icon: '♀️' },
                      { value: 'other', label: 'Other', icon: '⚧️' },
                      { value: 'prefer-not-to-say', label: 'Prefer not to say', icon: '🤐' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`gender-option ${gender === option.value ? 'selected' : ''}`}
                        onClick={() => setGender(option.value)}
                      >
                        <span className="gender-icon">{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Bio <span className="optional">(optional)</span>
                  </label>
                  <textarea
                    className="input"
                    placeholder="Tell us a bit about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={300}
                    rows={3}
                  />
                  <div className="char-count">{bio.length}/300</div>
                </div>
              </div>

              <div className="button-group">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSocials(true)}
                >
                  Add Social Links
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
                  {isLoading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Social Links Section */}
              <div className="form-section">
                <p className="section-description">
                  Add your social media links so others can connect with you.
                  All fields are optional.
                </p>

                <div className="social-inputs">
                  <div className="social-input-group">
                    <div className="social-icon twitter">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="input"
                      placeholder="twitter.com/username"
                      value={socialLinks.twitter}
                      onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    />
                  </div>

                  <div className="social-input-group">
                    <div className="social-icon instagram">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="input"
                      placeholder="instagram.com/username"
                      value={socialLinks.instagram}
                      onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    />
                  </div>

                  <div className="social-input-group">
                    <div className="social-icon github">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="input"
                      placeholder="github.com/username"
                      value={socialLinks.github}
                      onChange={(e) => handleSocialChange('github', e.target.value)}
                    />
                  </div>

                  <div className="social-input-group">
                    <div className="social-icon linkedin">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="input"
                      placeholder="linkedin.com/in/username"
                      value={socialLinks.linkedin}
                      onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                    />
                  </div>

                  <div className="social-input-group">
                    <div className="social-icon youtube">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="input"
                      placeholder="youtube.com/@channel"
                      value={socialLinks.youtube}
                      onChange={(e) => handleSocialChange('youtube', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="button-group">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowSocials(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Back
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
                  {isLoading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Skip option */}
        <div className="skip-section">
          <button
            type="button"
            className="skip-link"
            onClick={async () => {
              setIsLoading(true);
              try {
                const response = await profileAPI.completeOnboarding({
                  displayName: displayName.trim() || user?.username || 'User',
                  username: username.trim() || user?.username || '',
                  gender: 'prefer-not-to-say',
                  bio: '',
                });
                updateUser(response.user);
                navigate('/pdf-tools');
              } catch (err: any) {
                setError(err.message || 'Failed to skip');
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
