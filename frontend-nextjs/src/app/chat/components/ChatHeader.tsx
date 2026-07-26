'use client';
import React from 'react';
import { ArrowLeft, Phone, Video, Info } from 'lucide-react';
import styles from '../chat.module.css';

interface ChatHeaderProps {
  activeConvo: any;
  recipientName: string;
  recipientAvatarUrl: string;
  isOnline: boolean;
  showDetails: boolean;
  activeThemeColor: string;
  onBack: () => void;
  onAudioCall: () => void;
  onVideoCall: () => void;
  onToggleDetails: () => void;
}

export function ChatHeader({
  recipientName, recipientAvatarUrl, isOnline,
  showDetails, activeThemeColor,
  onBack, onAudioCall, onVideoCall, onToggleDetails,
}: ChatHeaderProps) {
  return (
    <div className={styles.windowHeader}>
      <div className={styles.headerLeft}>
        <button className={styles.backBtn} onClick={onBack} title="Back to Chats">
          <ArrowLeft size={20} />
        </button>
        <img src={recipientAvatarUrl} alt={recipientName} className={styles.avatarSmall} />
        <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={onToggleDetails}>
          <div className={styles.userName}>{recipientName}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>
      <div className={styles.headerActions}>
        <button className={styles.actionBtn} onClick={onAudioCall} title="Audio Call">
          <Phone size={18} />
        </button>
        <button className={styles.actionBtn} onClick={onVideoCall} title="Video Call">
          <Video size={18} />
        </button>
        <button
          className={styles.actionBtn}
          onClick={onToggleDetails}
          title="Chat Details & Customization"
          style={showDetails ? { color: activeThemeColor, backgroundColor: 'var(--bg-tertiary)' } : undefined}
        >
          <Info size={18} />
        </button>
      </div>
    </div>
  );
}
