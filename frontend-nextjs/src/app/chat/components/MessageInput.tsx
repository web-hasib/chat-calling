'use client';
import React from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Smile, Paperclip, Send, X } from 'lucide-react';
import styles from '../chat.module.css';

interface MessageInputProps {
  inputText: string;
  uploading: boolean;
  sendingMedia: boolean;
  replyingTo: any | null;
  activeDefaultEmoji: string;
  activeThemeColor: string;
  activeThemeGradient?: string;
  theme: 'dark' | 'light';
  showEmojiPicker: boolean;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  textInputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onSendDefaultEmoji: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmojiClick: (data: { emoji: string }) => void;
  onToggleEmojiPicker: () => void;
  onCancelReply: () => void;
}

export function MessageInput({
  inputText, uploading, sendingMedia, replyingTo,
  activeDefaultEmoji, activeThemeColor, activeThemeGradient,
  theme, showEmojiPicker, emojiPickerRef, textInputRef,
  onInputChange, onKeyDown, onSend, onSendDefaultEmoji,
  onFileSelect, onEmojiClick, onToggleEmojiPicker, onCancelReply,
}: MessageInputProps) {
  return (
    <>
      {/* Reply Drawer Banner */}
      {replyingTo && (
        <div className={styles.replyDrawer} style={{ borderLeftColor: activeThemeColor }}>
          <div className={styles.replyDrawerText}>
            <span className={styles.replyDrawerSender} style={{ color: activeThemeColor }}>
              Replying to {replyingTo.sender?.name || 'Message'}
            </span>
            <span className={styles.replyDrawerContent}>
              {replyingTo.content || (replyingTo.fileUrl ? 'Attachment File' : '')}
            </span>
          </div>
          <button className={styles.replyDrawerClose} onClick={onCancelReply}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Chat Input Panel */}
      <div className={styles.inputPanel}>
        {showEmojiPicker && (
          <div className={styles.emojiPickerPopover} ref={emojiPickerRef}>
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
              searchDisabled={false}
              width={340}
              height={400}
            />
          </div>
        )}

        <label className={styles.fileInputLabel} title="Send File Attachment">
          <Paperclip size={18} />
          <input type="file" onChange={onFileSelect} className={styles.fileInput} disabled={sendingMedia} multiple />
        </label>

        <div className={styles.inputWrapper}>
          <input
            ref={textInputRef}
            type="text"
            placeholder={
              uploading
                ? 'Uploading attachment...'
                : replyingTo
                ? `Replying to ${replyingTo.sender?.name || 'message'}...`
                : 'Type a message...'
            }
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            className={styles.textInput}
            disabled={uploading}
          />
          <button
            type="button"
            className={styles.emojiBtn}
            onClick={onToggleEmojiPicker}
            title="Choose an Emoji"
          >
            <Smile size={20} />
          </button>
        </div>

        {inputText.trim() ? (
          <button
            className={styles.btnSend}
            onClick={onSend}
            disabled={uploading}
            style={
              activeThemeGradient
                ? { background: activeThemeGradient }
                : activeThemeColor
                ? { background: activeThemeColor }
                : undefined
            }
          >
            <Send size={16} />
          </button>
        ) : (
          <button
            type="button"
            className={styles.btnQuickEmoji}
            onClick={onSendDefaultEmoji}
            title={`Send Quick Emoji (${activeDefaultEmoji})`}
          >
            {activeDefaultEmoji}
          </button>
        )}
      </div>
    </>
  );
}
