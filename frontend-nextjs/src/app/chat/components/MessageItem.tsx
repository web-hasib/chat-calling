'use client';
import React from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from '../../../components/ui/tooltip';
import {
  Smile, Reply, Trash2, X, ExternalLink, Check, CheckCheck, Loader2, Plus,
} from 'lucide-react';

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
      className={`group relative flex flex-col max-w-[75%] min-w-[60px] w-fit mb-1 ${isSentByMe ? 'self-end items-end' : 'self-start items-start'} ${isPrepended ? 'animate-in fade-in-0 duration-350 slide-in-from-top-1.5' : ''}`}
    >
      {/* Hover Action Bar */}
      <div
        className={`absolute -top-3.5 z-10 hidden group-hover:flex items-center gap-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${deleteConfirmMsgId === msg.id ? 'flex opacity-100' : ''} ${isSentByMe ? 'right-0' : 'left-0'}`}
      >
        <button
          className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-1 rounded-sm flex items-center justify-center hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          onClick={() => onReactionPickerToggle(activeReactionPickerId === msg.id ? null : msg.id)}
          title="React with Emoji"
        >
          <Smile size={14} />
        </button>
        <button
          className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-1 rounded-sm flex items-center justify-center hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
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
                  className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-1 rounded-sm flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  onClick={() => onDeleteToggle(deleteConfirmMsgId === msg.id ? null : msg.id)}
                  title="Delete Message"
                >
                  <Trash2 size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <span className="text-xs font-semibold mr-2">Delete for everyone?</span>
                <button
                  type="button"
                  className="bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-sm cursor-pointer mr-1"
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
                  className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-1 hover:text-[var(--text-primary)] transition-colors"
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
        <div className={`absolute -top-11 z-20 flex gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md p-1 shadow-md ${isSentByMe ? 'right-0' : 'left-0'}`} ref={reactionPickerRef}>
          {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
            <button
              key={emoji}
              className="bg-transparent border-none text-base cursor-pointer px-1 rounded-sm hover:bg-[var(--bg-tertiary)] transition-colors"
              onClick={() => onToggleReaction(msg.id, emoji)}
            >
              {emoji}
            </button>
          ))}
          <button
            className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-1 rounded-sm flex items-center justify-center hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
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
        <div className={`absolute -top-[390px] z-50 shadow-lg rounded-lg overflow-hidden ${isSentByMe ? 'right-0' : 'left-0'}`} ref={customReactionPickerRef}>
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
      <div className={`max-w-full w-fit flex flex-col relative`}>
        {/* Quoted Reply Box inside Message */}
        {msg.replyTo && (
          <div 
            className={`bg-black/15 border-l-3 border-[var(--accent-primary)] rounded-sm p-1.5 mb-1.5 text-xs ${!isSentByMe ? 'bg-[var(--bg-tertiary)]' : ''}`}
            onClick={() => onScrollToMessage(msg.replyTo.id)}
            style={{ cursor: 'pointer' }}
            title="Click to view original message"
          >
            <div className="font-semibold text-[var(--accent-primary)] mb-0.5">
              Replying to {msg.replyTo.sender?.name || 'Message'}
            </div>
            <div className="text-[var(--text-secondary)] truncate">
              {msg.replyTo.content || (msg.replyTo.fileUrl ? 'Attachment File' : '')}
            </div>
          </div>
        )}

        {msg.fileUrl ? (
          (msg.fileType?.split(',')[0] === 'IMAGE') ? (
            <div
              className={`p-1 rounded-[16px] max-w-[300px] overflow-hidden break-words whitespace-pre-wrap ${isSentByMe ? 'bg-[var(--accent-primary)] text-white rounded-br-[4px]' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-[4px]'}`}
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
                    <div className={`grid gap-1 max-w-[320px] w-full rounded-sm overflow-hidden mb-1 ${urls.length >= 4 ? 'grid-cols-2 grid-rows-2' : urls.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                      {displayUrls.map((url: string, i: number) => {
                        const isLast = i === 3 && urls.length > 4;
                        const isFirstOfThree = i === 0 && urls.length === 3;
                        return (
                          <div
                            key={i}
                            className={`relative cursor-pointer overflow-hidden ${isFirstOfThree ? 'col-span-2 aspect-[1.8]' : 'aspect-square'}`}
                            onClick={() => onOpenLightbox(urls, i)}
                          >
                            <img
                              src={url.trim()}
                              alt="Attachment"
                              className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-200"
                            />
                            {isLast && (
                              <div className="absolute inset-0 bg-black/55 flex items-center justify-center color-white text-xl font-bold backdrop-blur-[2px]">
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
                    className="w-full max-w-[292px] max-h-[320px] object-cover rounded-sm block cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onOpenLightbox(urls, 0)}
                  />
                );
              })()}
              {msg.content && <div className="px-2 py-1 text-sm leading-normal">{msg.content}</div>}
            </div>
          ) : (
            <div
              className={`px-4 py-3 rounded-[16px] text-sm leading-normal break-words overflow-wrap-anywhere whitespace-pre-wrap ${isSentByMe ? 'bg-[var(--accent-primary)] text-white rounded-br-[4px]' : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-[4px]'}`}
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
            className={`px-4 py-3 rounded-[16px] text-sm leading-normal break-words overflow-wrap-anywhere whitespace-pre-wrap relative ${isSentByMe ? 'bg-[var(--accent-primary)] text-white rounded-br-[4px]' : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-[4px]'}`}
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
            {/* Lej / Tail using Clip Path */}
            {isSentByMe ? (
              <div 
                className="absolute bottom-0 -right-2 w-3.5 h-[18px] bg-inherit" 
                style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%, 0 0)' }}
              />
            ) : (
              <div 
                className="absolute bottom-[-1px] -left-2 w-3.5 h-[18px] bg-inherit border-l border-b border-[var(--border-color)]" 
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 100% 0)' }}
              />
            )}
          </div>
        )}

        {/* Rich Link Preview Card */}
        {msg.linkPreview && (
          <a
            href={msg.linkPreview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 rounded-md overflow-hidden bg-black/20 border border-[var(--border-color)] flex flex-col text-inherit no-underline"
          >
            {msg.linkPreview.image && (
              <img
                src={msg.linkPreview.image}
                alt={msg.linkPreview.title || 'Link preview'}
                className="w-full max-h-40 object-cover"
              />
            )}
            <div className="p-3 flex flex-col gap-1">
              {msg.linkPreview.siteName && (
                <div className="text-[11px] font-semibold text-[var(--accent-primary)]">
                  {msg.linkPreview.siteName} <ExternalLink size={10} style={{ display: 'inline', marginLeft: 2 }} />
                </div>
              )}
              {msg.linkPreview.title && (
                <div className="text-sm font-semibold leading-normal text-[var(--text-primary)] line-clamp-2">{msg.linkPreview.title}</div>
              )}
              {msg.linkPreview.description && (
                <div className="text-[11px] text-[var(--text-secondary)] leading-normal line-clamp-2">{msg.linkPreview.description}</div>
              )}
            </div>
          </a>
        )}
      </div>

      {/* Reaction Badges Pill Row */}
      {(groupedReactions.length > 0 || reactionUpdatingMsgId === msg.id) && (
        <div className="flex flex-wrap gap-1 mt-1">
          {groupedReactions.map((r) => (
            <button
              key={r.emoji}
              className={`inline-flex items-center gap-1 text-xs border border-transparent rounded-full px-2 py-0.5 cursor-pointer text-[var(--text-primary)] transition-colors ${r.userReacted ? 'bg-blue-500/15 text-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]'}`}
              onClick={() => onToggleReaction(msg.id, r.emoji)}
              disabled={reactionUpdatingMsgId === msg.id}
              style={r.userReacted ? { borderColor: activeThemeColor } : undefined}
            >
              <span>{r.emoji}</span>
              <span>{r.count}</span>
            </button>
          ))}
          {reactionUpdatingMsgId === msg.id && (
            <div className="flex items-center shrink-0">
              <Loader2 size={13} className="animate-spin inline-block" />
            </div>
          )}
        </div>
      )}

      {/* Timestamp & Read Status Receipts */}
      <div className={`text-[10px] text-[var(--text-muted)] mt-1 ${isSentByMe ? 'self-end' : 'self-start'}`}>
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {isSentByMe && (
          <span className="inline-flex items-center ml-1 text-[var(--text-muted)]">
            {msg.id.startsWith('pending') ? (
              <Check size={12} />
            ) : msg.isRead ? (
              <CheckCheck size={13} style={{ color: activeThemeColor }} />
            ) : (
              <CheckCheck size={13} />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
