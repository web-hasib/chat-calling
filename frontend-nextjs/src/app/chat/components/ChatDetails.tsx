'use client';
import React from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Edit3, Check, Copy, Upload, Trash2, Sparkles, X } from 'lucide-react';
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
    <div className="w-[300px] border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col h-full overflow-y-auto z-40 fixed inset-y-0 right-0 md:relative md:inset-auto md:w-[300px] shrink-0">
      <div className="p-4 md:px-5 border-b border-[var(--border-color)] flex items-center justify-between h-[72px] shrink-0">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Chat Details</h3>
        <button className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="p-[18px] flex flex-col gap-5 flex-1">
        {/* Participant Profile Card */}
        <div className="flex flex-col items-center gap-2.5 text-center pb-4 border-b border-[var(--border-color)]">
          <img
            src={recipient?.avatarUrl}
            alt={getRecipientDisplayName(activeConvo)}
            className="w-[72px] h-[72px] rounded-full object-cover border-2"
            style={{ borderColor: activeThemeColor }}
          />
          <div>
            <div className="text-base font-semibold text-[var(--text-primary)]">{getRecipientDisplayName(activeConvo)}</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-secondary)]">@{handleName}</span>
              <button
                className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer p-0.5 rounded-sm inline-flex items-center justify-center hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(`@${handleName}`);
                  setCopiedHandle(true);
                  setTimeout(() => setCopiedHandle(false), 1500);
                }}
                title="Copy handle"
              >
                {copiedHandle ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              </button>
              <span className="text-[var(--text-muted)] mx-0.5">•</span>
              <span className="text-xs text-[var(--text-muted)]">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Nicknames Section */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-[var(--text-primary)]">Nicknames</div>
          {activeConvo.participants?.map((p: any) => {
            const isEditing = editingParticipantId === p.userId;
            return (
              <div key={p.id} className="flex flex-col gap-1.5 bg-[var(--bg-tertiary)] p-2.5 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {p.nickname || p.user?.name || p.user?.username}
                    </span>
                    {p.nickname && (
                      <span className="text-[11px] text-[var(--text-secondary)] ml-1.5">
                        ({p.user?.name})
                      </span>
                    )}
                  </div>
                  <button
                    className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-1 rounded-sm flex items-center justify-center hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    onClick={() => {
                      if (isEditing) {
                        setEditingParticipantId(null);
                      } else {
                        setEditingParticipantId(p.userId);
                        setNicknameInput(p.nickname || '');
                      }
                    }}
                    title="Edit Nickname"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>

                {isEditing && (
                  <div className="flex gap-2 items-center mt-1.5 w-full">
                    <input
                      type="text"
                      placeholder="Enter nickname..."
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      className="flex-1 min-w-0 h-8 px-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent-primary)]"
                    />
                    <button
                      className="shrink-0 h-8 px-3.5 bg-[var(--accent-primary)] border-none text-white rounded-md text-xs font-medium cursor-pointer flex items-center justify-center whitespace-nowrap"
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

        {/* Theme Colors Section */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-[var(--text-primary)]">Chat Theme</div>
          <div className="grid grid-cols-4 gap-2">
            {THEME_PRESETS.map((preset) => {
              const isActive = activeConvo.themeColor === preset.color;
              return (
                <button
                  key={preset.id}
                  className={`w-full h-9 rounded-md border border-[var(--border-color)] cursor-pointer flex items-center justify-center transition-all ${isActive ? 'scale-[1.05]' : ''}`}
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

        {/* Quick Default Emoji Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <div className="text-xs font-semibold text-[var(--text-primary)]">Quick Emoji</div>
            <span className="text-lg">{activeDefaultEmoji}</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {DEFAULT_EMOJI_PRESETS.map((emoji) => {
              const isActive = activeDefaultEmoji === emoji;
              return (
                <button
                  key={emoji}
                  className={`w-full h-8 rounded-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] cursor-pointer text-sm flex items-center justify-center transition-all ${isActive ? 'text-white border-transparent' : 'text-inherit'}`}
                  onClick={() => updateChatSettings({ defaultEmoji: emoji })}
                  style={isActive ? { background: activeThemeColor } : undefined}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <button
              className="flex items-center justify-center gap-1.5 w-full p-2 bg-transparent border border-[var(--border-color)] rounded-md text-[var(--text-primary)] text-xs font-medium cursor-pointer hover:bg-[var(--border-color)] transition-colors"
              onClick={() => setShowDefaultEmojiPickerPopover(!showDefaultEmojiPickerPopover)}
            >
              <Sparkles size={14} />
              <span>Choose Custom Emoji</span>
            </button>
            {showDefaultEmojiPickerPopover && (
              <div className="absolute bottom-11 right-0 left-0 w-full z-[100] shadow-lg rounded-md overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)]" ref={defaultEmojiPickerRef}>
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    updateChatSettings({ defaultEmoji: emojiData.emoji });
                    setShowDefaultEmojiPickerPopover(false);
                  }}
                  theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                  searchDisabled={false}
                  width="100%"
                  height={320}
                />
              </div>
            )}
          </div>
        </div>

        {/* Chat Background Image Section */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-[var(--text-primary)]">Background Wallpaper</div>
          <div className="grid grid-cols-2 gap-2">
            {BG_PRESETS.map((bg) => {
              const isActive = (activeBgImage || '') === bg.url;
              const hasImage = Boolean(bg.url);
              return (
                <div
                  key={bg.id}
                  className={`relative h-[68px] rounded-md border-2 border-transparent cursor-pointer flex flex-col justify-end p-2 bg-cover bg-center overflow-hidden transition-all ${hasImage ? '' : 'bg-[var(--bg-tertiary)]'} ${isActive ? '' : ''}`}
                  style={{
                    backgroundImage: hasImage ? `url(${bg.url})` : 'none',
                    borderColor: isActive ? activeThemeColor : undefined,
                  }}
                  onClick={() => updateChatSettings({ bgImage: bg.url })}
                >
                  <span className="text-[10px] font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded-sm line-clamp-1 w-fit">{bg.label}</span>
                </div>
              );
            })}
          </div>

          <label className="flex items-center justify-center gap-1.5 w-full p-2 bg-transparent border border-[var(--border-color)] rounded-md text-[var(--text-primary)] text-xs font-medium cursor-pointer hover:bg-[var(--border-color)] transition-colors">
            <Upload size={14} />
            <span>{isUploadingBg ? 'Uploading Image...' : 'Upload Background Image'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={onBgUpload}
              className="hidden"
              disabled={isUploadingBg}
            />
          </label>

          {/* Uploaded / Custom Background Images Preview List */}
          {customUploadedBgs.length > 0 && (
            <div className="flex flex-col gap-2 mt-1.5">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-1">
                Uploaded Wallpapers
              </div>
              {customUploadedBgs.map((url, idx) => {
                const isActive = activeBgImage === url;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md"
                    style={isActive ? { borderColor: activeThemeColor } : undefined}
                  >
                    <div
                      className="flex items-center gap-2.5 min-w-0"
                      onClick={() => updateChatSettings({ bgImage: url })}
                      style={{ cursor: 'pointer', flex: 1 }}
                    >
                      <img src={url} alt="Custom Background" className="w-11 h-8 rounded-sm object-cover border border-[var(--border-color)] shrink-0" />
                      <span className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                        {isActive ? 'Active Custom Image' : `Uploaded Wallpaper ${idx + 1}`}
                      </span>
                    </div>
                    <button
                      className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-1 rounded-sm flex items-center justify-center hover:bg-[var(--bg-tertiary)] hover:text-red-400 transition-colors"
                      onClick={() => onDeleteCustomBg(url)}
                      title="Delete uploaded image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Clear Background Image / Reset to Default Button */}
          {Boolean(activeBgImage) && (
            <button
              className="flex items-center justify-center gap-1.5 w-full p-2 bg-transparent border border-[var(--border-color)] rounded-md text-red-500 text-xs font-semibold cursor-pointer hover:bg-red-500/10 transition-colors"
              onClick={() => updateChatSettings({ bgImage: '' })}
            >
              <X size={14} />
              <span>Clear Wallpaper (Use Default)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
