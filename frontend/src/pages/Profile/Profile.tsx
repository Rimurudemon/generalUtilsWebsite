import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { profileAPI } from '../../api';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      github: '',
      linkedin: '',
      youtube: ''
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.profile.displayName || user.username,
        bio: user.profile.bio || '',
        location: user.profile.location || '',
        website: user.profile.website || '',
        avatar: user.profile.avatar || '',
        socialLinks: user.profile.socialLinks || {
          twitter: '',
          instagram: '',
          github: '',
          linkedin: '',
          youtube: ''
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await profileAPI.update(formData);
      if (user) {
        updateUser({
          ...user,
          profile: {
            ...user.profile,
            displayName: formData.displayName,
            bio: formData.bio,
            location: formData.location,
            website: formData.website,
            avatar: formData.avatar,
            socialLinks: formData.socialLinks
          }
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const shareProfile = (platform: string) => {
    const profileUrl = `${window.location.origin}/u/${user?.username}`;
    const text = `Check out my profile! ${profileUrl}`;
    
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=Check out my profile!`,
      email: `mailto:?subject=My Profile&body=${encodeURIComponent(text)}`,
    };

    window.open(links[platform], '_blank');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-description">Customize your social card and share it with the world</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 32 }}>
        {/* Profile Card Preview */}
        <div>
          <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            Preview
          </h3>
          <div className="profile-card">
            <div className="profile-cover" />
            <div className="profile-avatar">
              {formData.avatar ? (
                <img src={formData.avatar} alt={formData.displayName} />
              ) : (
                getInitials(formData.displayName || user.username)
              )}
            </div>
            <div className="profile-content">
              <h2 className="profile-name">{formData.displayName || user.username}</h2>
              <p className="profile-username">@{user.username}</p>
              {formData.bio && <p className="profile-bio">{formData.bio}</p>}
              <div className="profile-meta">
                {formData.location && (
                  <span>📍 {formData.location}</span>
                )}
                {formData.website && (
                  <a href={formData.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                    🔗 Website
                  </a>
                )}
              </div>
              <div className="profile-social">
                {formData.socialLinks.twitter && (
                  <a href={`https://twitter.com/${formData.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="profile-social-link" title="Twitter">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {formData.socialLinks.instagram && (
                  <a href={`https://instagram.com/${formData.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="profile-social-link" title="Instagram">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                )}
                {formData.socialLinks.github && (
                  <a href={`https://github.com/${formData.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="profile-social-link" title="GitHub">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                  </a>
                )}
                {formData.socialLinks.linkedin && (
                  <a href={`https://linkedin.com/in/${formData.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="profile-social-link" title="LinkedIn">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {formData.socialLinks.youtube && (
                  <a href={`https://youtube.com/@${formData.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="profile-social-link" title="YouTube">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Share Profile */}
          <div className="card" style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Share Profile</h4>
            <div className="share-buttons">
              <button className="share-btn whatsapp" onClick={() => shareProfile('whatsapp')} title="WhatsApp">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
              <button className="share-btn twitter" onClick={() => shareProfile('twitter')} title="Twitter/X">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              <button className="share-btn facebook" onClick={() => shareProfile('facebook')} title="Facebook">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button className="share-btn telegram" onClick={() => shareProfile('telegram')} title="Telegram">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </button>
              <button className="share-btn email" onClick={() => shareProfile('email')} title="Email">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </button>
            </div>
          </div>

          {/* User Stats */}
          <div className="card" style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Your Stats</h4>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-value">{user.stats.pdfCompressed}</div>
                <div className="stat-label">PDFs</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{user.stats.imagesConverted}</div>
                <div className="stat-label">Images</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{user.stats.notesCreated}</div>
                <div className="stat-label">Notes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{user.stats.cgpaCalculations}</div>
                <div className="stat-label">CGPA Calcs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Edit Profile</h3>
            {isEditing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
            {!isEditing && (
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div className="input-group">
              <label className="input-label">Display Name</label>
              <input
                type="text"
                className="input"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Bio</label>
              <textarea
                className="input"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us about yourself"
                rows={3}
                maxLength={300}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {formData.bio.length}/300
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Location</label>
                <input
                  type="text"
                  className="input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing}
                  placeholder="City, Country"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Website</label>
                <input
                  type="url"
                  className="input"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!isEditing}
                  placeholder="https://yoursite.com"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Avatar URL</label>
              <input
                type="url"
                className="input"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                disabled={!isEditing}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />

            <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Social Links</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Twitter / X</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Instagram</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
              <div className="input-group">
                <label className="input-label">GitHub</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.github}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, github: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
              <div className="input-group">
                <label className="input-label">LinkedIn</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
              <div className="input-group">
                <label className="input-label">YouTube</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="channel"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
