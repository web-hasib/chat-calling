'use client';
import React from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { X, Edit3, Check, Copy, Upload, Trash2, Sparkles } from 'lucide-react';
import styles from '../chat.module.css';
import { THEME_PRESETS, BG_PRESETS, DEFAULT_EMOJI_PRESETS } from '../constants';

interface ChatDetailsProps {
  activeConvo: any;
  activeThemeColor: string;
  activeBgImage?: string;
  activeDefaultEmoji: string;
  theme: 'dark' | 'light';
  onlineUsers: Set<string>;
  editingParticipantId: string | null;
  setEditingParticipantId: (id: string | null) => void;
  nicknameInput: string;
  setNicknameInput: (v: string) => void;
  showDefaultEmojiPickerPopover: boolean;
  setShowDefaultEmojiPickerPopover: (v: boolean) => void;
  copiedHandle: boolean;
  setCopiedHandle: (v: boolean) => void;
  isUploadingBg: boolean;
  customUploadedBgs: string[];
  defaultEmojiPickerRef: React.RefObject<HTMLDivElement | null>;
  getRecipientInfo: (c: any) => any;
  getRecipientDisplayName: (c: any) => string;
  onClose: () => void;
  onSaveNickname: (userId: string) => void;
  updateChatSettings: (data: any) => void;
  onBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteCustomBg: (url: string) => void;
}

export function ChatDetails({
  activeConvo, activeThemeColor, activeBgImage, activeDefaultEmoji,
  theme, onlineUsers,
  editingParticipantId, setEditingParticipantId,
  nicknameInput, setNicknameInput,
  showDefaultEmojiPickerPopover, setShowDefaultEmojiPickerPopover,
  copiedHandle, setCopiedHandle,
  isUploadingBg, customUploadedBgs, defaultEmojiPickerRef,
  getRecipientInfo, getRecipientDisplayName,
  onClose, onSaveNickname, updateChatSettings, onBgUpload, onDeleteCustomBg,
}: ChatDetailsProps) {
  const recipient = getRecipientInfo(activeConvo);
  const isOnline = recipient ? onlineUsers.has(recipient.id) : false;
  const handleName = recipient?.username || recipient?.email?.split('@')[0] || recipient?.name?.toLowerCase().replace(/\s+/g, '') || 'user';

  return (
    <div className={`${styles.detailsSidebar} ${styles.detailsSidebarMobile}`}>
      <div className={styles.detailsHeader}>
        <h3 className={styles.detailsTitle}>Chat Details</h3>
        <button className={styles.actionBtn} onClick={onClose}><X size={18} /></button>
      </div>

      <div className={styles.detailsContent}>
        {/* Profile Card */}
        <div className={styles.detailsProfileCard}>
          <img
            src={recipient?.avatarUrl}
            alt={getRecipientDisplayName(activeConvo)}
            className={styles.detailsAvatar}
            style={{ borderColor: activeThemeColor }}
          />
          <div>
            <div className={styles.detailsName}>{getRecipientDisplayName(activeConvo)}</div>
            <div className={styles.handleContainer}>
              <span className={styles.handleText}>@{handleName}</span>
              <button
                className={styles.copyHandleBtn}
                onClick={() => {
                  navigator.clipboard.writeText(`@${handleName}`);
                  setCopiedHandle(true);
                  setTimeout(() => setCopiedHandle(false), 1500);
                }}
                title="Copy handle"
              >
                {copiedHandle ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              </button>
              <span className={styles.statusDot}>•</span>
              <span className={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Nicknames */}
        <div className={styles.detailsSection}>
          <div className={styles.detailsSectionTitle}>Nicknames</div>
          {activeConvo.participants?.map((p: any) => {
            const isEditing = editingParticipantId === p.userId;
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.nickname || p.user?.name || p.user?.username}
                    </span>
                    {p.nickname && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>({p.user?.name})</span>
                    )}
                  </div>
                  <button
                    className={styles.actionIconBtn}
                    onClick={() => {
                      if (isEditing) { setEditingParticipantId(null); }
                      else { setEditingParticipantId(p.userId); setNicknameInput(p.nickname || ''); }
                    }}
                    title="Edit Nickname"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
                {isEditing && (
                  <div className={styles.nicknameRow}>
                    <input
                      type="text"
                      placeholder="Enter nickname..."
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      className={styles.nicknameInput}
                    />
                    <button
                      className={styles.nicknameSaveBtn}
                      onClick={() => onSaveNickname(p.userId)}
                      style={{ background: activeThemeColor }}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Theme Colors */}
        <div className={styles.detailsSection}>
          <div className={styles.detailsSectionTitle}>Chat Theme</div>
          <div className={styles.colorGrid}>
            {THEME_PRESETS.map((preset) => {
              const isActive = activeConvo.themeColor === preset.color;
              return (
                <button
                  key={preset.id}
                  className={`${styles.colorOptionBtn} ${isActive ? styles.colorOptionActive : ''}`}
                  style={{ backgroundColor: preset.color }}
                  onClick={() => updateChatSettings({ themeColor: preset.color, themeGradient: '' })}
                  title={preset.label}
                >
                  {isActive && <Check size={16} color="white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Emoji */}
        <div className={styles.detailsSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.detailsSectionTitle}>Quick Emoji</div>
            <span style={{ fontSize: '18px' }}>{activeDefaultEmoji}</span>
          </div>
          <div className={styles.emojiGrid}>
            {DEFAULT_EMOJI_PRESETS.map((emoji) => {
              const isActive = activeDefaultEmoji === emoji;
              return (
                <button
                  key={emoji}
                  className={`${styles.emojiPresetBtn} ${isActive ? styles.emojiPresetActive : ''}`}
                  onClick={() => updateChatSettings({ defaultEmoji: emoji })}
                  style={isActive ? { background: activeThemeColor } : undefined}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          <div style={{ position: 'relative' }}>
            <button className={styles.bgUploadBtn} onClick={() => setShowDefaultEmojiPickerPopover(!showDefaultEmojiPickerPopover)}>
              <Sparkles size={14} /><span>Choose Custom Emoji</span>
            </button>
            {showDefaultEmojiPickerPopover && (
              <div className={styles.detailsEmojiPickerPopover} ref={defaultEmojiPickerRef}>
                <EmojiPicker
                  onEmojiClick={(d) => { updateChatSettings({ defaultEmoji: d.emoji }); setShowDefaultEmojiPickerPopover(false); }}
                  theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                  searchDisabled={false}
                  width="100%"
                  height={320}
                />
              </div>
            )}
          </div>
        </div>

        {/* Background Wallpaper */}
        <div className={styles.detailsSection}>
          <div className={styles.detailsSectionTitle}>Background Wallpaper</div>
          <div className={styles.bgPresetGrid}>
            {BG_PRESETS.map((bg) => {
              const isActive = (activeBgImage || '') === bg.url;
              const hasImage = Boolean(bg.url);
              return (
                <div
                  key={bg.id}
                  className={`${styles.bgPresetItem} ${hasImage ? styles.bgPresetItemHasImage : ''} ${isActive ? styles.bgPresetActive : ''}`}
                  style={{
                    backgroundImage: hasImage ? `url(${bg.url})` : 'none',
                    backgroundColor: hasImage ? undefined : 'var(--bg-tertiary)',
                    borderColor: isActive ? activeThemeColor : undefined,
                  }}
                  onClick={() => updateChatSettings({ bgImage: bg.url })}
                >
                  <span className={styles.bgPresetItemText}>{bg.label}</span>
                </div>
              );
            })}
          </div>

          <label className={styles.bgUploadBtn}>
            <Upload size={14} />
            <span>{isUploadingBg ? 'Uploading Image...' : 'Upload Background Image'}</span>
            <input type="file" accept="image/*" onChange={onBgUpload} style={{ display: 'none' }} disabled={isUploadingBg} />
          </label>

          {customUploadedBgs.length > 0 && (
            <div className={styles.customBgList}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
                Uploaded Wallpapers
              </div>
              {customUploadedBgs.map((url, idx) => {
                const isActive = activeBgImage === url;
                return (
                  <div key={idx} className={styles.customBgItem} style={isActive ? { borderColor: activeThemeColor } : undefined}>
                    <div className={styles.customBgItemInfo} onClick={() => updateChatSettings({ bgImage: url })} style={{ cursor: 'pointer', flex: 1 }}>
                      <img src={url} alt="Custom Background" className={styles.customBgThumb} />
                      <span className={styles.customBgLabel}>{isActive ? 'Active Custom Image' : `Uploaded Wallpaper ${idx + 1}`}</span>
                    </div>
                    <button className={styles.actionIconBtnDanger} onClick={() => onDeleteCustomBg(url)} title="Delete uploaded image">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {Boolean(activeBgImage) && (
            <button className={styles.clearBgBtn} onClick={() => updateChatSettings({ bgImage: '' })}>
              <X size={14} /><span>Clear Wallpaper (Use Default)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
