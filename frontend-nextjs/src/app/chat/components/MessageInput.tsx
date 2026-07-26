'use client';
import React from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Smile, Paperclip, Send, X } from 'lucide-react';

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
        <div className="px-4 py-2 bg-[var(--bg-tertiary)] border-t border-[var(--border-color)] border-l-3 flex items-center justify-between text-xs" style={{ borderLeftColor: activeThemeColor }}>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold" style={{ color: activeThemeColor }}>
              Replying to {replyingTo.sender?.name || 'Message'}
            </span>
            <span className="text-[var(--text-secondary)] truncate">
              {replyingTo.content || (replyingTo.fileUrl ? 'Attachment File' : '')}
            </span>
          </div>
          <button className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-0.5" onClick={onCancelReply}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Chat Input Panel */}
      <div className="relative p-4 md:px-5 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center gap-3">
        {showEmojiPicker && (
          <div className="absolute bottom-[76px] right-[70px] z-[1000] shadow-lg rounded-lg overflow-hidden animate-in slide-in-from-bottom-2 duration-200" ref={emojiPickerRef}>
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
              searchDisabled={false}
              width={340}
              height={400}
            />
          </div>
        )}

        <label className="flex items-center justify-center cursor-pointer text-[var(--text-secondary)] w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors" title="Send File Attachment">
          <Paperclip size={18} />
          <input type="file" onChange={onFileSelect} className="hidden" disabled={sendingMedia} multiple />
        </label>

        <div className="flex-grow relative flex items-center">
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
            className="w-full pl-[18px] pr-11 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
            disabled={uploading}
          />
          <button
            type="button"
            className="absolute right-3 bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-1 flex items-center justify-center rounded-full hover:text-[var(--accent-primary)] hover:scale-110 transition-all"
            onClick={onToggleEmojiPicker}
            title="Choose an Emoji"
          >
            <Smile size={20} />
          </button>
        </div>

        {inputText.trim() ? (
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer hover:opacity-95 transition-opacity bg-[var(--accent-primary)] shrink-0 shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
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
            className="bg-transparent border-none text-xl cursor-pointer flex items-center justify-center w-[38px] h-[38px] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors select-none"
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
