import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../redux/slices/authSlice';
import { api } from '../api';
import Avatar from '../components/common/Avatar';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    headline: user?.headline || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileStatus, setProfileStatus] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileChange = e => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  const handlePasswordChange = e => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const handleProfileSubmit = async e => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileStatus('');
    const result = await dispatch(updateProfile(profileForm));
    if (result.error) {
      setProfileStatus('error:' + (result.payload || 'Update failed'));
    } else {
      setProfileStatus('success:Profile updated successfully!');
    }
    setProfileLoading(false);
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    setPasswordStatus('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus('error:Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordStatus('success:Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordStatus('error:' + err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const renderStatus = (status) => {
    if (!status) return null;
    const [type, msg] = status.split(':');
    return (
      <div className={`alert alert-${type === 'error' ? 'error' : 'success'}`}>
        {msg}
      </div>
    );
  };

  return (
    <div className="page-container wide" style={{ maxWidth: 700 }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {['profile', 'password'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 24px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-mid)',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'profile' ? 'Edit Profile' : 'Change Password'}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              {renderStatus(profileStatus)}

              {/* Current Avatar Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Avatar name={user?.name} size="xl" />
                <div>
                  <div style={{ fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ color: 'var(--text-mid)', fontSize: 13, marginTop: 4 }}>
                    Profile picture uses your initials
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  className="form-control"
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  required
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label>Headline</label>
                <input
                  className="form-control"
                  type="text"
                  name="headline"
                  value={profileForm.headline}
                  onChange={handleProfileChange}
                  placeholder="e.g. Software Engineer at Acme Corp"
                  maxLength={200}
                />
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                  {profileForm.headline.length}/200
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  className="form-control"
                  type="text"
                  name="location"
                  value={profileForm.location}
                  onChange={handleProfileChange}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>

              <div className="form-group">
                <label>Bio / About</label>
                <textarea
                  className="form-control"
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell your professional story..."
                  rows={5}
                  maxLength={500}
                />
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                  {profileForm.bio.length}/500
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={profileLoading}
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              {renderStatus(passwordStatus)}

              <div className="form-group">
                <label>Current Password</label>
                <input
                  className="form-control"
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  className="form-control"
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="At least 6 characters"
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  className="form-control"
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Repeat new password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
