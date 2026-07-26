'use client';
import React from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from '../../../components/ui/tooltip';
import {
  Smile, Reply, Trash2, X, ExternalLink, Check, CheckCheck, Loader2, Plus,
} from 'lucide-react';
import styles from '../chat.module.css';

interface MessageItemProps {
  msg: any;
  isSentByMe: boolean;
  isPrepended: boolean;
  groupedReactions: { emoji: string; count: number; userReacted: boolean }[];
  reactionUpdatingMsgId: string | null;
  activeReactionPickerId: string | null;
  activeCustomEmojiMsgId: string | null;
  deleteConfirmMsgId: string | null;
  activeThemeColor: string;
  activeThemeGradient?: string;
  theme: 'dark' | 'light';
  reactionPickerRef: React.RefObject<HTMLDivElement | null>;
  customReactionPickerRef: React.RefObject<HTMLDivElement | null>;
  onReply: (msg: any) => void;
  onReactionPickerToggle: (id: string | null) => void;
  onCustomEmojiMsgToggle: (id: string | null) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onDeleteToggle: (id: string | null) => void;
  onConfirmDelete: (id: string) => void;
  onScrollToMessage: (id: string) => void;
  onOpenLightbox: (urls: string[], index: number) => void;
}

export function MessageItem({
  msg, isSentByMe, isPrepended,
  groupedReactions, reactionUpdatingMsgId,
  activeReactionPickerId, activeCustomEmojiMsgId, deleteConfirmMsgId,
  activeThemeColor, activeThemeGradient,
  theme, reactionPickerRef, customReactionPickerRef,
  onReply, onReactionPickerToggle, onCustomEmojiMsgToggle,
  onToggleReaction, onDeleteToggle, onConfirmDelete,
  onScrollToMessage, onOpenLightbox,
}: MessageItemProps) {
  return (
    <div
      id={`msg-${msg.id}`}
      className={`${isSentByMe ? styles.msgSentWrapper : styles.msgReceivedWrapper} ${isPrepended ? styles.msgPrependFadeIn : ''}`}
    >
      {/* Hover Action Bar */}
      <div
        className={
          deleteConfirmMsgId === msg.id
            ? `${styles.msgActionsHover} ${styles.msgActionsHoverActive}`
            : styles.msgActionsHover
        }
      >
        <button
          className={styles.actionIconBtn}
          onClick={() => onReactionPickerToggle(activeReactionPickerId === msg.id ? null : msg.id)}
          title="React with Emoji"
        >
          <Smile size={14} />
        </button>
        <button
          className={styles.actionIconBtn}
          onClick={() => onReply(msg)}
          title="Reply to Message"
        >
          <Reply size={14} />
        </button>
        {isSentByMe && (
          <TooltipProvider delayDuration={0}>
            <Tooltip
              open={deleteConfirmMsgId === msg.id}
              onOpenChange={(open: boolean) => !open && onDeleteToggle(null)}
            >
              <TooltipTrigger asChild>
                <button
                  className={styles.actionIconBtnDanger}
                  onClick={() => onDeleteToggle(deleteConfirmMsgId === msg.id ? null : msg.id)}
                  title="Delete Message"
                >
                  <Trash2 size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <span className={styles.deleteTooltipText}>Delete for everyone?</span>
                <button
                  type="button"
                  className={styles.deleteTooltipConfirmBtn}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onConfirmDelete(msg.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirmDelete(msg.id);
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className={styles.deleteTooltipCancelBtn}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onDeleteToggle(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteToggle(null);
                  }}
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Emoji Reaction Picker Bar */}
      {activeReactionPickerId === msg.id && (
        <div className={styles.reactionPicker} ref={reactionPickerRef}>
          {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
            <button
              key={emoji}
              className={styles.reactionOption}
              onClick={() => onToggleReaction(msg.id, emoji)}
            >
              {emoji}
            </button>
          ))}
          <button
            className={styles.reactionOptionPlus}
            onClick={() => {
              onReactionPickerToggle(null);
              onCustomEmojiMsgToggle(msg.id);
            }}
            title="React with any emoji"
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      {/* Custom Any Emoji Picker Popover */}
      {activeCustomEmojiMsgId === msg.id && (
        <div className={styles.customEmojiPickerPopover} ref={customReactionPickerRef}>
          <EmojiPicker
            onEmojiClick={(emojiData) => onToggleReaction(msg.id, emojiData.emoji)}
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
            searchDisabled={false}
            width={320}
            height={380}
          />
        </div>
      )}

      {/* Message Bubble Box */}
      <div className={isSentByMe ? styles.msgSent : styles.msgReceived}>
        {/* Quoted Reply Box inside Message */}
        {msg.replyTo && (
          <div 
            className={styles.quotedReplyBox}
            onClick={() => onScrollToMessage(msg.replyTo.id)}
            style={{ cursor: 'pointer' }}
            title="Click to view original message"
          >
            <div className={styles.quotedSender}>
              Replying to {msg.replyTo.sender?.name || 'Message'}
            </div>
            <div className={styles.quotedContent}>
              {msg.replyTo.content || (msg.replyTo.fileUrl ? 'Attachment File' : '')}
            </div>
          </div>
        )}

        {msg.fileUrl ? (
          (msg.fileType?.split(',')[0] === 'IMAGE') ? (
            <div
              className={styles.msgContentHasMedia}
              style={
                isSentByMe
                  ? activeThemeGradient
                    ? { background: activeThemeGradient }
                    : activeThemeColor
                    ? { background: activeThemeColor }
                    : undefined
                  : undefined
              }
            >
              {(() => {
                const urls = msg.fileUrl.split(',');
                if (urls.length > 1) {
                  const displayUrls = urls.slice(0, 4);
                  const extraCount = urls.length - 3;
                  return (
                    <div className={`${styles.imageGrid} ${styles[`grid-${Math.min(urls.length, 4)}`]}`}>
                      {displayUrls.map((url: string, i: number) => {
                        const isLast = i === 3 && urls.length > 4;
                        return (
                          <div
                            key={i}
                            className={styles.gridImageWrapper}
                            onClick={() => onOpenLightbox(urls, i)}
                          >
                            <img
                              src={url.trim()}
                              alt="Attachment"
                              className={styles.gridImage}
                            />
                            {isLast && (
                              <div className={styles.gridImageOverlay}>
                                <span>+{extraCount}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return (
                  <img
                    src={msg.fileUrl}
                    alt="Attachment"
                    className={styles.attachmentImage}
                    onClick={() => onOpenLightbox(urls, 0)}
                  />
                );
              })()}
              {msg.content && <div className={styles.imageCaptionText}>{msg.content}</div>}
            </div>
          ) : (
            <div
              className={styles.msgContent}
              style={
                isSentByMe
                  ? activeThemeGradient
                    ? { background: activeThemeGradient }
                    : activeThemeColor
                    ? { background: activeThemeColor }
                    : undefined
                  : undefined
              }
            >
              {(() => {
                const urls = msg.fileUrl.split(',');
                if (urls.length > 1) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {urls.map((url: string, i: number) => (
                        <a
                          key={i}
                          href={url.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                          View Attachment File {i + 1}
                        </a>
                      ))}
                    </div>
                  );
                }
                return (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    View Attachment File
                  </a>
                );
              })()}
              {msg.content && <div style={{ marginTop: '6px' }}>{msg.content}</div>}
            </div>
          )
        ) : (
          <div
            className={styles.msgContent}
            style={
              isSentByMe
                ? activeThemeGradient
                  ? { background: activeThemeGradient }
                  : activeThemeColor
                  ? { background: activeThemeColor }
                  : undefined
                : undefined
            }
          >
            {msg.content}
          </div>
        )}

        {/* Rich Link Preview Card */}
        {msg.linkPreview && (
          <a
            href={msg.linkPreview.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkCard}
          >
            {msg.linkPreview.image && (
              <img
                src={msg.linkPreview.image}
                alt={msg.linkPreview.title || 'Link preview'}
                className={styles.linkImage}
              />
            )}
            <div className={styles.linkMeta}>
              {msg.linkPreview.siteName && (
                <div className={styles.linkSiteName}>
                  {msg.linkPreview.siteName} <ExternalLink size={10} style={{ display: 'inline', marginLeft: 2 }} />
                </div>
              )}
              {msg.linkPreview.title && (
                <div className={styles.linkTitle}>{msg.linkPreview.title}</div>
              )}
              {msg.linkPreview.description && (
                <div className={styles.linkDescription}>{msg.linkPreview.description}</div>
              )}
            </div>
          </a>
        )}
      </div>

      {/* Reaction Badges Pill Row */}
      {(groupedReactions.length > 0 || reactionUpdatingMsgId === msg.id) && (
        <div className={styles.reactionPills}>
          {groupedReactions.map((r) => (
            <button
              key={r.emoji}
              className={r.userReacted ? styles.reactionBadgeActive : styles.reactionBadge}
              onClick={() => onToggleReaction(msg.id, r.emoji)}
              disabled={reactionUpdatingMsgId === msg.id}
              style={r.userReacted ? { borderColor: activeThemeColor } : undefined}
            >
              <span>{r.emoji}</span>
              <span>{r.count}</span>
            </button>
          ))}
          {reactionUpdatingMsgId === msg.id && (
            <div className={styles.reactionLoadingSpinner}>
              <Loader2 size={13} className={styles.spinLoader} />
            </div>
          )}
        </div>
      )}

      {/* Timestamp & Read Status Receipts */}
      <div className={styles.msgInfo}>
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {isSentByMe && (
          <span className={styles.readReceipt}>
            {msg.id.startsWith('pending') ? (
              <Check size={12} />
            ) : msg.isRead ? (
              <CheckCheck size={13} className={styles.tickBlue} style={{ color: activeThemeColor }} />
            ) : (
              <CheckCheck size={13} />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
