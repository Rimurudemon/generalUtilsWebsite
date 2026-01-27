import React, { useState, useEffect, useRef } from 'react';
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
      youtube: '',
      discord: ''
    },
    customLinks: [] as { title: string; url: string; isActive: boolean }[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.profile.displayName || user.username,
        bio: user.profile.bio || '',
        location: user.profile.location || '',
        website: user.profile.website || '',
        avatar: user.profile.avatar || '',
        socialLinks: {
          twitter: user.profile.socialLinks?.twitter || '',
          instagram: user.profile.socialLinks?.instagram || '',
          github: user.profile.socialLinks?.github || '',
          linkedin: user.profile.socialLinks?.linkedin || '',
          youtube: user.profile.socialLinks?.youtube || '',
          discord: user.profile.socialLinks?.discord || ''
        },
        customLinks: user.profile.customLinks || []
      });
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({ ...prev, avatar: base64 }));
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setIsUploadingImage(false);
    }
  };

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
            socialLinks: formData.socialLinks,
            customLinks: formData.customLinks
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

  const addCustomLink = () => {
    setFormData(prev => ({
      ...prev,
      customLinks: [...prev.customLinks, { title: '', url: '', isActive: true }]
    }));
  };

  const removeCustomLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customLinks: prev.customLinks.filter((_, i) => i !== index)
    }));
  };

  const updateCustomLink = (index: number, field: 'title' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      customLinks: prev.customLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };
  
  // Social Platform Config for Cards
  const socialPlatforms = [
    { key: 'twitter', label: 'Twitter', icon: '🐦', color: '#1DA1F2', baseUrl: 'https://twitter.com/' },
    { key: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C', baseUrl: 'https://instagram.com/' },
    { key: 'github', label: 'GitHub', icon: '💻', color: '#333', baseUrl: 'https://github.com/' },
    { key: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0077B5', baseUrl: 'https://linkedin.com/in/' },
    { key: 'youtube', label: 'YouTube', icon: '📺', color: '#FF0000', baseUrl: 'https://youtube.com/@' },
    { key: 'discord', label: 'Discord', icon: '💬', color: '#5865F2', baseUrl: '' },
  ] as const;

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

      <div className="profile-page-grid">
        {/* Profile Card Preview */}
        <div>
          <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            Preview
          </h3>
          <div className="profile-card">
            <div className="profile-cover" />
            <div className="profile-content">
              <div className="profile-header-row">
                <div className="profile-avatar-container">
                  <div 
                    className="profile-avatar"
                    style={{ cursor: 'default' }}
                  >
                    {formData.avatar ? (
                      <img src={formData.avatar} alt={formData.displayName} />
                    ) : (
                      getInitials(formData.displayName || user.username)
                    )}
                    {isUploadingImage && (
                      <div className="avatar-upload-overlay" style={{ opacity: 1 }}>
                        <div className="spinner" style={{ width: 24, height: 24 }} />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      className="avatar-edit-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="Edit profile picture"
                      type="button"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="profile-info">
                  <h2 className="profile-name">{formData.displayName || user.username}</h2>
                  <p className="profile-username">@{user.username}</p>
                </div>
              </div>
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
              {/* Enhanced Social Trays/Cards */}
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {socialPlatforms.map(platform => {
                  const username = formData.socialLinks[platform.key as keyof typeof formData.socialLinks];
                  if (!username) return null;
                  
                  return (
                    <a
                      key={platform.key}
                      href={platform.key === 'discord' ? '#' : `${platform.baseUrl}${username}`}
                      target={platform.key === 'discord' ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="social-card-tray"
                      onClick={(e) => {
                        if (platform.key === 'discord') {
                          e.preventDefault();
                          navigator.clipboard.writeText(username);
                          alert('Discord username copied to clipboard!');
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-elevated)',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-subtle)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '12px', 
                          background: platform.color, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 20
                        }}>
                          {platform.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{platform.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{username}</div>
                        </div>
                      </div>
                      <div style={{ 
                        background: platform.color, 
                        color: 'white', 
                        padding: '6px 16px', 
                        borderRadius: '20px', 
                        fontSize: 12, 
                        fontWeight: 600 
                      }}>
                        {platform.key === 'discord' ? 'Copy' : 'Follow'}
                      </div>
                    </a>
                  );
                })}

                {/* Custom Links Cards */}
                {formData.customLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-elevated)',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '12px', 
                        background: 'var(--accent-secondary)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 20
                      }}>
                        🔗
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{link.title}</div>
                    </div>
                    <div style={{ 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)', 
                      padding: '6px 16px', 
                      borderRadius: '20px', 
                      fontSize: 12, 
                      fontWeight: 600 
                    }}>
                      Visit
                    </div>
                  </a>
                ))}
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

            {isEditing && (
              <div style={{ 
                padding: '12px 16px', 
                background: 'rgba(139, 92, 246, 0.1)', 
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Click the pencil icon on the avatar to upload a new profile picture
                </span>
              </div>
            )}

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
              <div className="input-group">
                <label className="input-label">Discord</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.discord}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, discord: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>Custom Links</h4>
              {isEditing && (
                <button className="btn btn-secondary btn-sm" onClick={addCustomLink}>
                  + Add Link
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {formData.customLinks.map((link, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input"
                    value={link.title}
                    onChange={(e) => updateCustomLink(index, 'title', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Title (e.g. Portfolio)"
                  />
                  <input
                    type="text"
                    className="input"
                    value={link.url}
                    onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                    disabled={!isEditing}
                    placeholder="URL (https://...)"
                  />
                  {isEditing && (
                    <button className="btn btn-ghost" style={{ color: 'var(--error)' }} onClick={() => removeCustomLink(index)}>
                      ×
                    </button>
                  )}
                </div>
              ))}
              {formData.customLinks.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No custom links added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
