'use client';
import React from 'react';
import styles from '../chat.module.css';

interface EditProfileModalProps {
  editName: string;
  setEditName: (v: string) => void;
  editUsername: string;
  setEditUsername: (v: string) => void;
  editAvatarUrl: string;
  uploadingAvatar: boolean;
  profileUpdating: boolean;
  profileError: string | null;
  profileSuccess: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EditProfileModal({
  editName, setEditName,
  editUsername, setEditUsername,
  editAvatarUrl, uploadingAvatar, profileUpdating,
  profileError, profileSuccess,
  onClose, onSubmit, onAvatarUpload,
}: EditProfileModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edit Profile</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.profileAvatarSection}>
          <label className={styles.avatarEditContainer}>
            <img
              src={editAvatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${editUsername || 'default'}`}
              alt="Avatar Preview"
              className={styles.avatarEditImage}
            />
            <div className={styles.avatarUploadOverlay}>
              <span>{uploadingAvatar ? 'Uploading...' : 'Change Photo'}</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarUpload}
              className={styles.avatarUploadInput}
              disabled={uploadingAvatar}
            />
          </label>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Accepts JPG, PNG, GIF. Uploads to secure hosting.
          </div>
        </div>

        <form onSubmit={onSubmit} className={styles.modalForm}>
          {profileError && (
            <div className={`${styles.profileFeedback} ${styles.profileError}`}>{profileError}</div>
          )}
          {profileSuccess && (
            <div className={`${styles.profileFeedback} ${styles.profileSuccess}`}>Profile updated successfully!</div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Display Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={styles.input}
              required
              disabled={profileUpdating}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              className={styles.input}
              pattern="^[a-zA-Z0-9_]{3,15}$"
              title="Username must be 3-15 alphanumeric characters or underscores"
              required
              disabled={profileUpdating}
            />
          </div>

          <div className={styles.modalBtnGroup}>
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={profileUpdating}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSave} disabled={profileUpdating || uploadingAvatar}>
              {profileUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
