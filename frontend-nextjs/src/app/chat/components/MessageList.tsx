'use client';
import React from 'react';
import { Loader2, MoreHorizontal } from 'lucide-react';
import styles from '../chat.module.css';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: any[];
  hasMore: boolean;
  loadingMore: boolean;
  isSwitchingThread: boolean;
  isRecipientTyping: boolean;
  recipientTypingName: string;
  activeThemeColor: string;
  prependedMsgIds: Set<string>;
  messageAreaRef: React.RefObject<HTMLDivElement | null>;
  activeBgImage?: string;
  currentUserId: string;
  // MessageItem passthrough props
  reactionUpdatingMsgId: string | null;
  activeReactionPickerId: string | null;
  activeCustomEmojiMsgId: string | null;
  deleteConfirmMsgId: string | null;
  activeThemeGradient?: string;
  theme: 'dark' | 'light';
  reactionPickerRef: React.RefObject<HTMLDivElement | null>;
  customReactionPickerRef: React.RefObject<HTMLDivElement | null>;
  getGroupedReactions: (reactions?: any[]) => { emoji: string; count: number; userReacted: boolean }[];
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onLoadMore: () => void;
  onReply: (msg: any) => void;
  onReactionPickerToggle: (id: string | null) => void;
  onCustomEmojiMsgToggle: (id: string | null) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onDeleteToggle: (id: string | null) => void;
  onConfirmDelete: (id: string) => void;
  onScrollToMessage: (id: string) => void;
  onOpenLightbox: (urls: string[], index: number) => void;
}

export function MessageList({
  messages, hasMore, loadingMore, isSwitchingThread,
  isRecipientTyping, recipientTypingName, activeThemeColor,
  prependedMsgIds, messageAreaRef, activeBgImage, currentUserId,
  reactionUpdatingMsgId, activeReactionPickerId, activeCustomEmojiMsgId, deleteConfirmMsgId,
  activeThemeGradient, theme, reactionPickerRef, customReactionPickerRef,
  getGroupedReactions,
  onScroll, onLoadMore, onReply,
  onReactionPickerToggle, onCustomEmojiMsgToggle, onToggleReaction,
  onDeleteToggle, onConfirmDelete, onScrollToMessage, onOpenLightbox,
}: MessageListProps) {
  return (
    <div
      className={`${styles.messageArea} ${activeBgImage ? styles.messageAreaCustomBg : ''}`}
      style={activeBgImage ? { backgroundImage: `url(${activeBgImage})` } : undefined}
      ref={messageAreaRef}
      onScroll={onScroll}
    >
      {/* Feature 3: Pagination Load More Header */}
      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <button className={styles.loadMoreBtn} onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className={styles.spinLoader} size={14} /> : 'Load older messages'}
          </button>
        </div>
      )}

      {isSwitchingThread ? (
        <div className={styles.skeletonContainer}>
          <div className={`${styles.skeletonBubble} ${styles.skeletonReceived}`} style={{ width: '60%', height: '42px' }} />
          <div className={`${styles.skeletonBubble} ${styles.skeletonSent}`} style={{ width: '45%', height: '36px' }} />
          <div className={`${styles.skeletonBubble} ${styles.skeletonReceived}`} style={{ width: '70%', height: '54px' }} />
          <div className={`${styles.skeletonBubble} ${styles.skeletonSent}`} style={{ width: '35%', height: '36px' }} />
          <div className={`${styles.skeletonBubble} ${styles.skeletonReceived}`} style={{ width: '50%', height: '42px' }} />
          <div className={`${styles.skeletonBubble} ${styles.skeletonSent}`} style={{ width: '55%', height: '48px' }} />
        </div>
      ) : (
        messages.map((msg, index) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id || index} className={styles.systemMessageWrapper}>
                <div className={styles.systemMessagePill}>{msg.content}</div>
              </div>
            );
          }

          const isSentByMe = msg.senderId === currentUserId;
          const groupedReactions = getGroupedReactions(msg.reactions);
          const isPrepended = prependedMsgIds.has(msg.id);

          return (
            <MessageItem
              key={msg.id || index}
              msg={msg}
              isSentByMe={isSentByMe}
              isPrepended={isPrepended}
              groupedReactions={groupedReactions}
              reactionUpdatingMsgId={reactionUpdatingMsgId}
              activeReactionPickerId={activeReactionPickerId}
              activeCustomEmojiMsgId={activeCustomEmojiMsgId}
              deleteConfirmMsgId={deleteConfirmMsgId}
              activeThemeColor={activeThemeColor}
              activeThemeGradient={activeThemeGradient}
              theme={theme}
              reactionPickerRef={reactionPickerRef}
              customReactionPickerRef={customReactionPickerRef}
              onReply={onReply}
              onReactionPickerToggle={onReactionPickerToggle}
              onCustomEmojiMsgToggle={onCustomEmojiMsgToggle}
              onToggleReaction={onToggleReaction}
              onDeleteToggle={onDeleteToggle}
              onConfirmDelete={onConfirmDelete}
              onScrollToMessage={onScrollToMessage}
              onOpenLightbox={onOpenLightbox}
            />
          );
        })
      )}

      {/* Typing Indicator */}
      {isRecipientTyping && (
        <div className={styles.msgReceived}>
          <div className={styles.msgContent} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{recipientTypingName} is typing</span>
            <MoreHorizontal className="animate-pulse" size={16} style={{ color: activeThemeColor }} />
          </div>
        </div>
      )}
    </div>
  );
}
