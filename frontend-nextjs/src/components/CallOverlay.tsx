'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCall } from '../context/CallContext';
import { useAuth } from '../context/AuthContext';
import styles from './CallOverlay.module.css';
import { Phone, PhoneOff, Mic, MicOff, Video as VideoOn, VideoOff, Monitor, Users, LogOut, MessageSquare, Smile, Send, X as CloseIcon } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface FloatingEmoji {
  id: number;
  emoji: string;
  left: number;
}

const getDiscordAdaptiveBg = (userId: string) => {
  const colors = [
    '#3c2f2f', // Dark reddish brown
    '#2f3c37', // Dark sage green
    '#372f3c', // Dark dusty purple
    '#2f363c', // Dark slate blue
    '#3c372f', // Dark olive/bronze
    '#403030', // Dark warm brown
    '#304038', // Dark teal-green
    '#3a3d52', // Dark indigo-grey
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const CallOverlay: React.FC = () => {
  const { user } = useAuth();
  const {
    // 1:1 call
    activeCall,
    localStream,
    remoteStream,
    callDuration,
    isMuted,
    isVideoMuted,
    isScreenSharing,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    // Group call
    activeGroupCall,
    groupLocalStream,
    groupRemoteStreams,
    groupCallDuration,
    isGroupMuted,
    isGroupVideoMuted,
    isGroupScreenSharing,
    joinGroupCall,
    rejectGroupCall,
    leaveGroupCall,
    toggleGroupMute,
    toggleGroupVideo,
    toggleGroupScreenShare,
    groupCallMessages,
    sendGroupCallMessage,
    triggerGroupCallEmoji,
    latestEmojiReaction,
    groupCallVideoStates,
    groupMutedUserIds,
    myGroupRole,
    isHandRaised,
    isFootRaised,
    groupCallHandRaisedStates,
    groupCallFootRaisedStates,
    adminMuteAll,
    toggleHandRaise,
    toggleFootRaise,
    adminMuteUser,
    adminUnmuteUser,
  } = useCall();

  // ─── 1:1 Call Refs ───
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);

  // ─── Group Call Refs ───
  const groupLocalVideoRef = useRef<HTMLVideoElement | null>(null);
  const groupRemoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // ─── Ephemeral Call Features States ───
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [showCustomEmojiPicker, setShowCustomEmojiPicker] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [showAllParticipantsPanel, setShowAllParticipantsPanel] = useState(false);
  const [muteConfirmConfig, setMuteConfirmConfig] = useState<{
    isOpen: boolean;
    type: 'all' | 'user';
    targetUserId?: string;
    targetUserName?: string;
  }>({ isOpen: false, type: 'all' });
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Message popups (toast) logic
  interface MessageToast {
    id: string;
    senderName: string;
    message: string;
  }
  const [toasts, setToasts] = useState<MessageToast[]>([]);
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    if (groupCallMessages.length > lastMessageCountRef.current) {
      const latestMsg = groupCallMessages[groupCallMessages.length - 1];
      const isMyMessage = latestMsg.senderId === user?.id;

      if (!isMyMessage && !showChatPanel) {
        const newToast = {
          id: Math.random().toString(),
          senderName: latestMsg.senderName,
          message: latestMsg.message,
        };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 5000);
      }
    }
    lastMessageCountRef.current = groupCallMessages.length;
  }, [groupCallMessages, showChatPanel, user]);

  // PIP Dragging state (1:1 video call)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // PIP Dragging state (Group Video call)
  const [groupPipPosition, setGroupPipPosition] = useState({ x: 0, y: 0 });
  const isGroupDraggingRef = useRef(false);
  const groupDragStartRef = useRef({ x: 0, y: 0 });

  const handleGroupPointerDown = (e: React.PointerEvent) => {
    if (window.innerWidth > 768) return;
    isGroupDraggingRef.current = true;
    groupDragStartRef.current = {
      x: e.clientX - groupPipPosition.x,
      y: e.clientY - groupPipPosition.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleGroupPointerMove = (e: React.PointerEvent) => {
    if (!isGroupDraggingRef.current) return;
    let newX = e.clientX - groupDragStartRef.current.x;
    let newY = e.clientY - groupDragStartRef.current.y;

    const padding = 16;
    const pipWidth = 100;
    const pipHeight = 140;

    const minX = -window.innerWidth + pipWidth + padding;
    const maxX = padding;
    const minY = -window.innerHeight + pipHeight + padding;
    const maxY = padding;

    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    setGroupPipPosition({ x: newX, y: newY });
  };

  const handleGroupPointerUp = (e: React.PointerEvent) => {
    isGroupDraggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // ─── 1:1 stream binding ───

  useEffect(() => {
    if (localVideoElRef.current && localStream) {
      localVideoElRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.status, isVideoMuted]);

  useEffect(() => {
    if (remoteVideoElRef.current && remoteStream) {
      remoteVideoElRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall?.status]);

  // ─── Group stream binding ───

  useEffect(() => {
    if (groupLocalVideoRef.current && groupLocalStream) {
      groupLocalVideoRef.current.srcObject = groupLocalStream;
    }
  }, [groupLocalStream, activeGroupCall?.status, isGroupVideoMuted]);

  // Bind remote streams when they change
  useEffect(() => {
    for (const [userId, stream] of groupRemoteStreams) {
      const el = groupRemoteVideoRefs.current.get(userId);
      if (el && el.srcObject !== stream) {
        el.srcObject = stream;
      }
    }
  }, [groupRemoteStreams]);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [groupCallMessages, showChatPanel]);

  // Trigger floating emoji animation when a reaction is received
  useEffect(() => {
    if (latestEmojiReaction) {
      const newEmoji: FloatingEmoji = {
        id: latestEmojiReaction.id,
        emoji: latestEmojiReaction.emoji,
        left: Math.random() * 80 + 10, // random percentage position
      };
      setFloatingEmojis(prev => [...prev, newEmoji]);

      // Remove after animation ends (2.5 seconds)
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(fe => fe.id !== newEmoji.id));
      }, 2500);
    }
  }, [latestEmojiReaction]);

  // ─── Shared helpers ───

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // PIP drag handlers (1:1 video)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    let newX = e.clientX - dragStartRef.current.x;
    let newY = e.clientY - dragStartRef.current.y;

    const padding = 16;
    const pipWidth = 150;
    const pipHeight = 220;

    const minX = -window.innerWidth + pipWidth + padding;
    const maxX = padding;
    const minY = -window.innerHeight + pipHeight + padding;
    const maxY = padding;

    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Send meeting chat message
  const handleSendChat = () => {
    if (!chatInputText.trim()) return;
    sendGroupCallMessage(chatInputText);
    setChatInputText('');
  };

  const EMOJI_PRESETS = ['❤️', '👍', '🔥', '😂', '👏','🖕', '🎉', '😮', '😢', '💯', '🚀'];

  // ═══════════════════════════════════════════════════════════
  // GROUP CALL UI
  // ═══════════════════════════════════════════════════════════

  if (activeGroupCall) {
    const isRinging = activeGroupCall.status === 'ringing';
    const isConnected = activeGroupCall.status === 'connected';
    const isConnecting = activeGroupCall.status === 'connecting';
    const isEnded = activeGroupCall.status === 'ended';
    const isVideoCall = activeGroupCall.type === 'VIDEO';

    // Ringing / Ended state
    if (isRinging || isEnded) {
      return (
        <div className={styles.overlay}>
          <div className={styles.panel}>
            <div className={styles.groupBadge}>
              <Users size={16} />
              <span>Group Call</span>
            </div>

            <div className={styles.groupAvatarRow}>
              {activeGroupCall.participants.slice(0, 3).map((p) => (
                <img
                  key={p.userId}
                  src={p.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.name}`}
                  alt={p.name}
                  className={isRinging ? styles.ringingAvatar : styles.avatar}
                  style={{ width: 80, height: 80 }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <h2 className={styles.name}>{activeGroupCall.groupName}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                {isVideoCall ? (
                  <VideoOn size={16} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
                ) : (
                  <Phone size={14} style={{ color: 'var(--accent-success, #22c55e)' }} />
                )}
                <span
                  className={styles.status}
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: isEnded ? '#ef4444' : undefined,
                  }}
                >
                  {isEnded
                    ? 'Group call ended'
                    : `Incoming ${isVideoCall ? 'Video' : 'Audio'} Group Call...`}
                </span>
              </div>
              {isRinging && activeGroupCall.participants.length > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  from {activeGroupCall.participants[0].name}
                </span>
              )}
            </div>

            <div className={styles.controls}>
              {isEnded ? null : (
                <>
                  <button
                    className={`${styles.btn} ${styles.btnAnswer}`}
                    onClick={() => joinGroupCall()}
                    title="Join Group Call"
                  >
                    <Phone size={24} />
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnDecline}`}
                    onClick={rejectGroupCall}
                    title="Decline"
                  >
                    <PhoneOff size={24} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Connecting state
    if (isConnecting) {
      return (
        <div className={styles.overlay}>
          <div className={styles.panel}>
            <div className={styles.groupBadge}>
              <Users size={16} />
              <span>Group Call</span>
            </div>
            <h2 className={styles.name}>{activeGroupCall.groupName}</h2>
            <span className={styles.status}>Connecting...</span>
          </div>
        </div>
      );
    }

    // Connected state — VIDEO/AUDIO layout
    if (isConnected) {
      const remoteEntries = Array.from(groupRemoteStreams.entries());
      const totalParticipants = remoteEntries.length + 1;
      
      // On mobile, the local preview floats, so grid only displays remote participants.
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const gridParticipantsCount = totalParticipants > 4 ? 4 : totalParticipants;
      const activeGridParticipants = isMobile ? (gridParticipantsCount - 1) : gridParticipantsCount;
      
      const gridClass = activeGridParticipants <= 1
        ? styles.groupGrid2 // 1 participant or 2 layout
        : activeGridParticipants <= 2
        ? styles.groupGrid2
        : styles.groupGrid4;

      return (
        <div className={styles.groupCallContainer}>
          {/* Main Layout containing Grid + sliding chat panel */}
          <div className={styles.groupMainBody}>
            {/* Grid display / Avatar display */}
            <div className={styles.groupMediaArea}>
              {/* Floating Emojis */}
              <div className={styles.emojiContainer}>
                {floatingEmojis.map(fe => (
                  <span
                    key={fe.id}
                    className={styles.flyingEmoji}
                    style={{ left: `${fe.left}%` }}
                  >
                    {fe.emoji}
                  </span>
                ))}
              </div>

              {isVideoCall ? (
                (() => {
                  const effectiveFocusedUserId = focusedUserId || (totalParticipants === 2 && remoteEntries.length > 0 ? remoteEntries[0][0] : null);

                  if (effectiveFocusedUserId) {
                    const otherRemoteParticipants = remoteEntries.filter(([uid]) => uid !== effectiveFocusedUserId);

                    return (
                      <div className={styles.focusedSpeakerLayout}>
                        {/* Thumbnail Row for other remote participants (rendered at top) */}
                        {otherRemoteParticipants.length > 0 && (
                          <div className={styles.thumbnailStrip}>
                            {(() => {
                              const maxThumbnails = 4;
                              const hasOverflow = otherRemoteParticipants.length > maxThumbnails;
                              const toRender = hasOverflow 
                                ? otherRemoteParticipants.slice(0, maxThumbnails - 1) 
                                : otherRemoteParticipants;
                              const overflowCount = otherRemoteParticipants.length - toRender.length;

                              return (
                                <>
                                  {toRender.map(([userId, stream]) => {
                                    const participant = activeGroupCall.participants.find(p => p.userId === userId);
                                    const hasVideo = groupCallVideoStates[userId] !== false;

                                    return (
                                      <div 
                                        key={userId} 
                                        className={styles.thumbnailTile}
                                        onClick={() => setFocusedUserId(userId)}
                                        title={`Focus ${participant?.name || 'Participant'}`}
                                      >
                                        {hasVideo ? (
                                          <video
                                            ref={(el) => {
                                              if (el) {
                                                groupRemoteVideoRefs.current.set(userId, el);
                                                if (el.srcObject !== stream) el.srcObject = stream;
                                              }
                                            }}
                                            autoPlay
                                            playsInline
                                            className={styles.thumbnailVideoEl}
                                          />
                                        ) : (
                                          <div className={styles.thumbnailPlaceholder} style={{ backgroundColor: getDiscordAdaptiveBg(userId) }}>
                                            <img
                                              src={participant?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${participant?.name || userId}`}
                                              alt={participant?.name || 'Participant'}
                                              className={styles.thumbnailPlaceholderAvatar}
                                            />
                                          </div>
                                        )}
                                        <div className={styles.thumbnailLabel}>
                                          {participant?.name || 'Participant'}
                                        </div>
                                        <audio
                                          ref={(el) => {
                                            if (el && el.srcObject !== stream) el.srcObject = stream;
                                          }}
                                          autoPlay
                                          playsInline
                                          style={{ display: 'none' }}
                                        />
                                      </div>
                                    );
                                  })}

                                  {/* Background audio tracks to keep overflow participants audible */}
                                  {hasOverflow && otherRemoteParticipants.slice(maxThumbnails - 1).map(([userId, stream]) => (
                                    <audio
                                      key={`audio-bg-thumb-${userId}`}
                                      ref={(el) => {
                                        if (el && el.srcObject !== stream) el.srcObject = stream;
                                      }}
                                      autoPlay
                                      playsInline
                                      style={{ display: 'none' }}
                                    />
                                  ))}

                                  {/* + others Overflow tile */}
                                  {hasOverflow && (
                                    <div 
                                      className={styles.thumbnailTileOverflow}
                                      onClick={() => setShowAllParticipantsPanel(true)}
                                      title="View all participants"
                                    >
                                      <span className={styles.thumbnailOverflowCount}>+{overflowCount}</span>
                                      <span className={styles.thumbnailOverflowLabel}>others</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {/* Pinned Focused Video (takes up remaining space) */}
                        <div className={styles.focusedVideoWrapper}>
                          {(() => {
                            const focusedEntry = remoteEntries.find(([uid]) => uid === effectiveFocusedUserId);
                            if (!focusedEntry) return null;
                            const [uid, stream] = focusedEntry;
                            const participant = activeGroupCall.participants.find(p => p.userId === uid);
                            const hasVideo = groupCallVideoStates[uid] !== false;

                            return (
                              <div key={uid} className={styles.focusedVideoTile} onClick={() => setFocusedUserId(null)} title="Click to unpin">
                                {hasVideo ? (
                                  <video
                                    ref={(el) => {
                                      if (el) {
                                        groupRemoteVideoRefs.current.set(uid, el);
                                        if (el.srcObject !== stream) el.srcObject = stream;
                                      }
                                    }}
                                    autoPlay
                                    playsInline
                                    className={styles.focusedVideoEl}
                                  />
                                ) : (
                                  <div className={styles.groupVideoPlaceholder} style={{ backgroundColor: getDiscordAdaptiveBg(uid) }}>
                                    <img
                                      src={participant?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${participant?.name || uid}`}
                                      alt={participant?.name || 'Participant'}
                                      className={styles.groupPlaceholderAvatar}
                                      style={{ width: 120, height: 120 }}
                                    />
                                  </div>
                                )}
                                <div className={styles.groupTileLabel}>
                                  📌 {participant?.name || 'Participant'}
                                </div>
                                <audio
                                  ref={(el) => {
                                    if (el && el.srcObject !== stream) el.srcObject = stream;
                                  }}
                                  autoPlay
                                  playsInline
                                  style={{ display: 'none' }}
                                />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Floating Local Preview PIP (Always on top, draggable) */}
                        <div 
                          className={`${styles.groupVideoTile} ${styles.groupLocalVideoTile}`}
                          style={{
                            transform: `translate(${groupPipPosition.x}px, ${groupPipPosition.y}px)`,
                          }}
                          onPointerDown={handleGroupPointerDown}
                          onPointerMove={handleGroupPointerMove}
                          onPointerUp={handleGroupPointerUp}
                        >
                          {!isGroupVideoMuted ? (
                            <video
                              ref={groupLocalVideoRef}
                              autoPlay
                              playsInline
                              muted
                              className={styles.groupVideoEl}
                            />
                          ) : (
                            <div className={styles.groupVideoPlaceholder} style={{ backgroundColor: getDiscordAdaptiveBg(user?.id || 'me') }}>
                              <img
                                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=me`}
                                alt="You"
                                className={styles.groupPlaceholderAvatar}
                              />
                            </div>
                          )}
                          <div className={styles.groupTileLabel}>You {isGroupMuted && '🔇'}</div>
                        </div>
                      </div>
                    );
                  }

                  // Default Grid Layout
                  return (
                    <div className={`${styles.groupVideoGrid} ${gridClass}`}>
                      {/* Self Tile */}
                      <div
                        className={`${styles.groupVideoTile} ${styles.groupLocalVideoTile}`}
                        style={isMobile ? {
                          transform: `translate(${groupPipPosition.x}px, ${groupPipPosition.y}px)`,
                        } : undefined}
                        onPointerDown={handleGroupPointerDown}
                        onPointerMove={handleGroupPointerMove}
                        onPointerUp={handleGroupPointerUp}
                      >
                        {!isGroupVideoMuted ? (
                          <video
                            ref={groupLocalVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={styles.groupVideoEl}
                          />
                        ) : (
                          <div className={styles.groupVideoPlaceholder}>
                            <img
                              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=me`}
                              alt="You"
                              className={styles.groupPlaceholderAvatar}
                            />
                          </div>
                        )}
                        <div className={styles.groupTileLabel}>You {isGroupMuted && '🔇'}</div>
                      </div>

                      {/* Remote Tiles (Capped at 2 if total participants > 4) */}
                      {(() => {
                        const maxRemoteVisible = totalParticipants > 4 ? 3 : remoteEntries.length;
                        const visibleRemote = remoteEntries.slice(0, maxRemoteVisible);
                        const overflowRemote = remoteEntries.slice(maxRemoteVisible);
                        const overflowCount = remoteEntries.length - maxRemoteVisible;

                        return (
                          <>
                            {visibleRemote.map(([userId, stream]) => {
                              const participant = activeGroupCall.participants.find(p => p.userId === userId);
                              const hasVideo = groupCallVideoStates[userId] !== false;
                              const isUserMuted = groupMutedUserIds.has(userId);

                              return (
                                <div 
                                  key={userId} 
                                  className={styles.groupVideoTile}
                                  onClick={() => setFocusedUserId(userId)}
                                  title={`Click to focus ${participant?.name || 'Participant'}`}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {hasVideo ? (
                                    <video
                                      ref={(el) => {
                                        if (el) {
                                          groupRemoteVideoRefs.current.set(userId, el);
                                          if (el.srcObject !== stream) el.srcObject = stream;
                                        }
                                      }}
                                      autoPlay
                                      playsInline
                                      className={styles.groupVideoEl}
                                    />
                                  ) : (
                                    <div className={styles.groupVideoPlaceholder} style={{ backgroundColor: getDiscordAdaptiveBg(userId) }}>
                                      <img
                                        src={participant?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${participant?.name || userId}`}
                                        alt={participant?.name || 'Participant'}
                                        className={styles.groupPlaceholderAvatar}
                                      />
                                    </div>
                                  )}
                                  <div className={styles.groupTileLabel}>
                                    {participant?.name || 'Participant'} {isUserMuted && '🔇'}
                                  </div>
                                  <audio
                                    ref={(el) => {
                                      if (el && el.srcObject !== stream) el.srcObject = stream;
                                    }}
                                    autoPlay
                                    playsInline
                                    style={{ display: 'none' }}
                                  />
                                </div>
                              );
                            })}

                            {/* Background audio tracks to keep overflow video participants audible */}
                            {overflowRemote.map(([userId, stream]) => (
                              <audio
                                key={`audio-bg-vid-${userId}`}
                                ref={(el) => {
                                  if (el && el.srcObject !== stream) el.srcObject = stream;
                                }}
                                autoPlay
                                playsInline
                                style={{ display: 'none' }}
                              />
                            ))}

                            {/* +N Overflow tile */}
                            {overflowCount > 0 && (
                              <div 
                                className={styles.videoOverflowTile}
                                onClick={() => setShowAllParticipantsPanel(true)}
                                title="View all participants"
                              >
                                <span className={styles.videoOverflowCount}>+{overflowCount}</span>
                                <span className={styles.videoOverflowLabel}>others</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  );
                })()
              ) : (
                /* Audio calling centered layout */
                <div className={styles.groupAudioCenter}>
                  {/* Background audio tracks to ensure overflow participants are audible */}
                  {activeGroupCall.participants.map((p) => {
                    const hasStream = groupRemoteStreams.has(p.userId);
                    if (!hasStream) return null;
                    return (
                      <audio
                        key={`audio-bg-${p.userId}`}
                        ref={(el) => {
                          const stream = groupRemoteStreams.get(p.userId);
                          if (el && stream && el.srcObject !== stream) el.srcObject = stream;
                        }}
                        autoPlay
                        playsInline
                        style={{ display: 'none' }}
                      />
                    );
                  })}

                  <div className={styles.groupAvatarRow}>
                    {/* Self avatar */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ position: 'relative' }}>
                        <img
                          src={`https://api.dicebear.com/7.x/adventurer/svg?seed=me`}
                          alt="You"
                          className={styles.avatar}
                          style={{ width: 68, height: 68 }}
                        />
                        {isGroupMuted && (
                          <span style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(239,68,68,0.95)', borderRadius: '50%', padding: '3px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MicOff size={10} />
                          </span>
                        )}
                        {isHandRaised && (
                          <span style={{ position: 'absolute', top: -6, right: -6, fontSize: '16px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>🖐️</span>
                        )}
                        {isFootRaised && (
                          <span style={{ position: 'absolute', top: -6, left: -6, fontSize: '16px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>🦶</span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>You</span>
                    </div>

                    {/* Remote avatars */}
                    {(() => {
                      const sortedParticipants = [...(activeGroupCall.participants || [])].sort((a, b) => {
                        const aHand = groupCallHandRaisedStates[a.userId] || false;
                        const bHand = groupCallHandRaisedStates[b.userId] || false;
                        const aFoot = groupCallFootRaisedStates[a.userId] || false;
                        const bFoot = groupCallFootRaisedStates[b.userId] || false;
                        const aRaised = aHand || aFoot;
                        const bRaised = bHand || bFoot;

                        if (aRaised && !bRaised) return -1;
                        if (!aRaised && bRaised) return 1;
                        return 0;
                      });
                      const maxVisible = 4;
                      const visibleParticipants = sortedParticipants.slice(0, maxVisible);
                      const overflowCount = sortedParticipants.length - maxVisible;

                      return (
                        <>
                          {visibleParticipants.map((p) => {
                            const hasStream = groupRemoteStreams.has(p.userId);
                            const isUserMuted = groupMutedUserIds.has(p.userId);
                            const pHandRaised = groupCallHandRaisedStates[p.userId] || false;
                            const pFootRaised = groupCallFootRaisedStates[p.userId] || false;
                            return (
                              <div 
                                key={p.userId} 
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                onClick={() => setFocusedUserId(p.userId)}
                              >
                                <div style={{ position: 'relative' }}>
                                  <img
                                    src={p.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.name}`}
                                    alt={p.name}
                                    className={styles.avatar}
                                    style={{ width: 68, height: 68, opacity: hasStream ? 1 : 0.4 }}
                                  />
                                  {isUserMuted && (
                                    <span style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(239,68,68,0.95)', borderRadius: '50%', padding: '3px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <MicOff size={10} />
                                    </span>
                                  )}
                                  {pHandRaised && (
                                    <span style={{ position: 'absolute', top: -6, right: -6, fontSize: '16px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>🖐️</span>
                                  )}
                                  {pFootRaised && (
                                    <span style={{ position: 'absolute', top: -6, left: -6, fontSize: '16px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>🦶</span>
                                  )}
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '72px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                  {p.name}
                                </span>
                              </div>
                            );
                          })}
                          
                          {overflowCount > 0 && (
                            <div 
                              className={styles.overflowAvatar}
                              onClick={() => setShowAllParticipantsPanel(true)}
                              title="View all participants"
                            >
                              <span className={styles.overflowAvatarText}>+{overflowCount}</span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>others</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <h2 className={styles.name} style={{ color: 'white', marginTop: '16px' }}>{activeGroupCall.groupName}</h2>
                  <span className={styles.status}>Connected (Group Voice Call)</span>
                </div>
              )}
            </div>

            {/* In-Meeting Chat Panel */}
            {showChatPanel && (
              <div className={styles.chatPanel}>
                <div className={styles.chatPanelHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} />
                    <span>Meeting Chat</span>
                  </div>
                  <button className={styles.closeChatBtn} onClick={() => setShowChatPanel(false)}>
                    <CloseIcon size={16} />
                  </button>
                </div>
                
                <div className={styles.chatPanelMessages}>
                  {groupCallMessages.length === 0 ? (
                    <div className={styles.chatEmptyState}>
                      Messages sent here are visible to everyone in the call.
                    </div>
                  ) : (
                    groupCallMessages.map((msg, index) => (
                      <div key={index} className={styles.chatBubble}>
                        <div className={styles.chatBubbleHeader}>
                          <span className={styles.chatBubbleSender}>{msg.senderName}</span>
                          <span className={styles.chatBubbleTime}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={styles.chatBubbleText}>{msg.message}</div>
                      </div>
                    ))
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                <div className={styles.chatPanelInputRow}>
                  <input
                    type="text"
                    placeholder="Send a message..."
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    className={styles.chatPanelInput}
                  />
                  <button className={styles.chatSendBtn} onClick={handleSendChat}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Connected Timer overlay */}
          <div className={styles.timerOverlay}>
            <div className={styles.timerDot} />
            <span>{formatTime(groupCallDuration)}</span>
            <span className={styles.participantCount}>
              <Users size={12} />
              {totalParticipants}
            </span>
          </div>

          {/* Call controls overlay */}
          <div className={styles.videoControls}>
            <button
              className={isGroupMuted ? styles.videoBtnMuted : styles.videoBtn}
              onClick={toggleGroupMute}
              title={isGroupMuted ? 'Unmute' : 'Mute'}
            >
              {isGroupMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {(myGroupRole === 'CREATOR' || myGroupRole === 'ADMIN' || myGroupRole === 'MODERATOR') && (
              <button
                className={styles.videoBtn}
                onClick={() => setMuteConfirmConfig({ isOpen: true, type: 'all' })}
                title="Mute Everyone"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
              >
                <MicOff size={20} />
              </button>
            )}

            {/* Hand Raise */}
            <button
              className={isHandRaised ? styles.videoBtnActive : styles.videoBtn}
              onClick={toggleHandRaise}
              title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
              style={isHandRaised ? { backgroundColor: 'rgba(250, 204, 21, 0.2)', color: '#facc15' } : {}}
            >
              <span style={{ fontSize: '18px' }}>🖐️</span>
            </button>

            {/* Foot Raise */}
            <button
              className={isFootRaised ? styles.videoBtnActive : styles.videoBtn}
              onClick={toggleFootRaise}
              title={isFootRaised ? 'Lower Foot' : 'Raise Foot'}
              style={isFootRaised ? { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' } : {}}
            >
              <span style={{ fontSize: '18px' }}>🦶</span>
            </button>

            {isVideoCall && (
              <button
                className={isGroupVideoMuted ? styles.videoBtnMuted : styles.videoBtn}
                onClick={toggleGroupVideo}
                title={isGroupVideoMuted ? 'Camera On' : 'Camera Off'}
              >
                {isGroupVideoMuted ? <VideoOff size={20} /> : <VideoOn size={20} />}
              </button>
            )}

            {isVideoCall && (
              <button
                className={isGroupScreenSharing ? styles.videoBtnActive : styles.videoBtn}
                onClick={toggleGroupScreenShare}
                title={isGroupScreenSharing ? 'Stop Sharing' : 'Share Screen'}
              >
                <Monitor size={20} />
              </button>
            )}

            {/* Reactions Control */}
            <div style={{ position: 'relative' }}>
              <button
                className={showEmojiTray ? styles.videoBtnActive : styles.videoBtn}
                onClick={() => {
                  setShowEmojiTray(!showEmojiTray);
                  if (showEmojiTray) setShowCustomEmojiPicker(false);
                }}
                title="Send Reaction"
              >
                <Smile size={20} />
              </button>
              {showEmojiTray && (
                <div className={styles.emojiPickerTray}>
                  {EMOJI_PRESETS.map(emoji => (
                    <button
                      key={emoji}
                      className={styles.trayEmojiBtn}
                      onClick={() => {
                        triggerGroupCallEmoji(emoji);
                        setShowEmojiTray(false);
                        setShowCustomEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                  {/* Plus button for Custom Emoji Picker */}
                  <button
                    className={styles.trayEmojiBtn}
                    onClick={() => {
                      setShowCustomEmojiPicker(!showCustomEmojiPicker);
                    }}
                    title="Choose Custom Emoji"
                    style={{ fontSize: '18px', fontWeight: 'bold', color: '#a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}
                  >
                    +
                  </button>

                  {showCustomEmojiPicker && (
                    <div className={styles.customEmojiPickerWrapper}>
                      <EmojiPicker
                        theme={Theme.DARK}
                        onEmojiClick={(emojiData) => {
                          triggerGroupCallEmoji(emojiData.emoji);
                          setShowCustomEmojiPicker(false);
                          setShowEmojiTray(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Control */}
            <button
              className={showChatPanel ? styles.videoBtnActive : styles.videoBtn}
              onClick={() => setShowChatPanel(!showChatPanel)}
              title="Meeting Chat"
            >
              <MessageSquare size={20} />
            </button>

            <button className={styles.videoBtnEnd} onClick={leaveGroupCall} title="Leave Call">
              <PhoneOff size={20} />
            </button>
          </div>
          {/* Toast notifications */}
          {/* Toast notifications */}
          {toasts.length > 0 && (
            <div className={styles.toastContainer}>
              {toasts.map(toast => (
                <div 
                  key={toast.id} 
                  className={styles.toastCard}
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  title="Click to dismiss"
                >
                  <div className={styles.toastHeader}>
                    <span className={styles.toastSender}>{toast.senderName}</span>
                    <button className={styles.toastDismissBtn}>
                      <CloseIcon size={12} />
                    </button>
                  </div>
                  <div className={styles.toastBody}>{toast.message}</div>
                </div>
              ))}
            </div>
          )}

          {/* Participants Modal / Scrollable list */}
          {showAllParticipantsPanel && (
            <div 
              className={styles.participantsModalOverlay}
              onClick={() => setShowAllParticipantsPanel(false)}
            >
              <div 
                className={styles.participantsModal}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.participantsHeader}>
                  <h3 className={styles.participantsTitle}>
                    <Users size={20} style={{ color: 'var(--accent-primary)' }} />
                    <span>Participants ({totalParticipants})</span>
                  </h3>
                  <button 
                    className={styles.closeModalBtn}
                    onClick={() => setShowAllParticipantsPanel(false)}
                  >
                    <CloseIcon size={18} />
                  </button>
                </div>
                
                <div className={styles.participantsList}>
                  {/* Self Row */}
                  <div 
                    className={`${styles.participantRow} ${styles.participantRowClickable}`}
                    onClick={() => {
                      setFocusedUserId(null);
                      setShowAllParticipantsPanel(false);
                    }}
                  >
                    <div className={styles.participantInfo}>
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={`https://api.dicebear.com/7.x/adventurer/svg?seed=me`}
                          alt="You"
                          className={styles.participantAvatar}
                        />
                        <span className={styles.liveIndicator} title="Live">●</span>
                      </div>
                      <div className={styles.participantMeta}>
                        <span className={styles.participantName}>
                          You
                          {isHandRaised && <span className={styles.raiseIndicator} title="Hand Raised">🖐️</span>}
                          {isFootRaised && <span className={styles.raiseIndicator} title="Foot Raised">🦶</span>}
                        </span>
                        <span className={`${styles.participantRoleBadge} ${
                          myGroupRole === 'CREATOR' ? styles.roleCreator : myGroupRole === 'ADMIN' ? styles.roleAdmin : myGroupRole === 'MODERATOR' ? styles.roleModerator : styles.roleMember
                        }`}>
                          {myGroupRole || 'MEMBER'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.participantControls}>
                      {isGroupMuted ? (
                        <span className={styles.muteIndicator} title="Muted">
                          <MicOff size={15} />
                        </span>
                      ) : (
                        <span className={styles.activeIndicator} title="Speaking">
                          <Mic size={15} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remote Rows — sorted: hand-raised first, then live connected, then others */}
                  {[...(activeGroupCall.participants || [])].sort((a, b) => {
                    const aHandRaised = groupCallHandRaisedStates[a.userId] || false;
                    const bHandRaised = groupCallHandRaisedStates[b.userId] || false;
                    const aFootRaised = groupCallFootRaisedStates[a.userId] || false;
                    const bFootRaised = groupCallFootRaisedStates[b.userId] || false;
                    const aRaised = aHandRaised || aFootRaised;
                    const bRaised = bHandRaised || bFootRaised;
                    const aLive = groupRemoteStreams.has(a.userId);
                    const bLive = groupRemoteStreams.has(b.userId);

                    if (aRaised && !bRaised) return -1;
                    if (!aRaised && bRaised) return 1;
                    if (aLive && !bLive) return -1;
                    if (!aLive && bLive) return 1;
                    return 0;
                  }).map((p) => {
                    const isMuted = groupMutedUserIds.has(p.userId);
                    const hasStream = groupRemoteStreams.has(p.userId);
                    const pHandRaised = groupCallHandRaisedStates[p.userId] || false;
                    const pFootRaised = groupCallFootRaisedStates[p.userId] || false;
                    const isAdmin = myGroupRole === 'CREATOR' || myGroupRole === 'ADMIN' || myGroupRole === 'MODERATOR';
                    
                    return (
                      <div 
                        key={p.userId} 
                        className={`${styles.participantRow} ${styles.participantRowClickable} ${pHandRaised ? styles.participantRowRaised : ''}`}
                        onClick={() => {
                          setFocusedUserId(p.userId);
                          setShowAllParticipantsPanel(false);
                        }}
                      >
                        <div className={styles.participantInfo}>
                          <div style={{ position: 'relative' }}>
                            <img 
                              src={p.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.name}`}
                              alt={p.name}
                              className={styles.participantAvatar}
                            />
                            {hasStream && <span className={styles.liveIndicator} title="Live">●</span>}
                          </div>
                          <div className={styles.participantMeta}>
                            <span className={styles.participantName}>
                              {p.name}
                              {pHandRaised && <span className={styles.raiseIndicator} title="Hand Raised">🖐️</span>}
                              {pFootRaised && <span className={styles.raiseIndicator} title="Foot Raised">🦶</span>}
                            </span>
                            <span className={`${styles.participantRoleBadge} ${
                              p.role === 'CREATOR' ? styles.roleCreator : p.role === 'ADMIN' ? styles.roleAdmin : p.role === 'MODERATOR' ? styles.roleModerator : styles.roleMember
                            }`}>
                              {p.role || 'MEMBER'}
                            </span>
                          </div>
                        </div>
                        <div className={styles.participantControls}>
                          {!hasStream ? (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Connecting...</span>
                          ) : (
                            <>
                              {isMuted ? (
                                <span className={styles.muteIndicator} title="Muted">
                                  <MicOff size={15} />
                                </span>
                              ) : (
                                <span className={styles.activeIndicator} title="Active">
                                  <Mic size={15} />
                                </span>
                              )}
                              {isAdmin && (
                                <button
                                  className={styles.adminMuteUserBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isMuted) {
                                      adminUnmuteUser(p.userId);
                                    } else {
                                      setMuteConfirmConfig({
                                        isOpen: true,
                                        type: 'user',
                                        targetUserId: p.userId,
                                        targetUserName: p.name,
                                      });
                                    }
                                  }}
                                  title={isMuted ? 'Unmute User' : 'Mute User'}
                                >
                                  {isMuted ? <Mic size={13} /> : <MicOff size={13} />}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(myGroupRole === 'CREATOR' || myGroupRole === 'ADMIN' || myGroupRole === 'MODERATOR') && (
                  <div className={styles.adminMuteAllSection}>
                    <button 
                      className={styles.adminMuteAllBtn}
                      onClick={() => {
                        setMuteConfirmConfig({ isOpen: true, type: 'all' });
                      }}
                    >
                      <MicOff size={16} />
                      <span>Mute Everyone</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {muteConfirmConfig.isOpen && (
            <div className={styles.confirmModalOverlay} onClick={() => setMuteConfirmConfig(prev => ({ ...prev, isOpen: false }))}>
              <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                <h4 className={styles.confirmTitle}>Confirm Mute Action</h4>
                <p className={styles.confirmMessage}>
                  {muteConfirmConfig.type === 'all'
                    ? 'Are you sure you want to mute all participants in this meeting?'
                    : `Are you sure you want to mute ${muteConfirmConfig.targetUserName}?`}
                </p>
                <div className={styles.confirmActions}>
                  <button
                    className={styles.confirmCancelBtn}
                    onClick={() => setMuteConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.confirmSubmitBtn}
                    onClick={() => {
                      if (muteConfirmConfig.type === 'all') {
                        adminMuteAll();
                      } else if (muteConfirmConfig.type === 'user' && muteConfirmConfig.targetUserId) {
                        adminMuteUser(muteConfirmConfig.targetUserId);
                      }
                      setMuteConfirmConfig(prev => ({ ...prev, isOpen: false }));
                    }}
                  >
                    Confirm Mute
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 1:1 CALL UI (unchanged from original)
  // ═══════════════════════════════════════════════════════════

  if (!activeCall) return null;

  const isRinging = activeCall.status === 'ringing';
  const isConnected = activeCall.status === 'connected';

  if (activeCall.type === 'VIDEO' && isConnected) {
    return (
      <div className={styles.videoContainer}>
        {/* Live Call Timer */}
        <div className={styles.timerOverlay}>
          <div className={styles.timerDot} />
          <span>{formatTime(callDuration)}</span>
        </div>

        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoElRef}
          autoPlay
          playsInline
          className={styles.remoteVideo}
        />
        
        {/* Local Video (Floating Drag-and-Drop PIP) */}
        {!isVideoMuted && (
          <video
            ref={localVideoElRef}
            autoPlay
            playsInline
            muted
            className={styles.localVideo}
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        )}

        {/* Call controls overlay */}
        <div className={styles.videoControls}>
          <button 
            className={isMuted ? styles.videoBtnMuted : styles.videoBtn} 
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button 
            className={isVideoMuted ? styles.videoBtnMuted : styles.videoBtn} 
            onClick={toggleVideo}
            title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoMuted ? <VideoOff size={20} /> : <VideoOn size={20} />}
          </button>
          
          <button 
            className={isScreenSharing ? styles.videoBtnActive : styles.videoBtn} 
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <Monitor size={20} />
          </button>
          
          <button className={styles.videoBtnEnd} onClick={endCall} title="End Call">
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Audio calling panel or Ringing state for both audio and video
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        {/* Live Call Timer (audio connected) */}
        {isConnected && activeCall.type === 'AUDIO' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '12px', color: 'var(--text-secondary)', marginBottom: '-10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-success)' }} />
            <span>{formatTime(callDuration)}</span>
          </div>
        )}

        <img
          src={activeCall.peerAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeCall.peerName || 'peer'}`}
          alt="Peer avatar"
          className={isRinging ? styles.ringingAvatar : styles.avatar}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <h2 className={styles.name}>{activeCall.peerName || 'Peer User'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            {activeCall.type === 'VIDEO' ? (
              <VideoOn size={16} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
            ) : (
              <Phone size={14} style={{ color: 'var(--accent-success, #22c55e)' }} />
            )}
            <span 
              className={styles.status} 
              style={{ 
                margin: 0, 
                fontSize: '13px', 
                color: activeCall.status === 'busy' || activeCall.status === 'declined' || activeCall.status === 'ended' 
                  ? '#ef4444' 
                  : undefined 
              }}
            >
              {activeCall.status === 'ringing'
                ? activeCall.role === 'caller'
                  ? `${activeCall.type === 'VIDEO' ? 'Video' : 'Audio'} Call Ringing...`
                  : `Incoming ${activeCall.type === 'VIDEO' ? 'Video' : 'Audio'} Call...`
                : activeCall.status === 'connecting'
                ? 'Connecting...'
                : activeCall.status === 'busy'
                ? 'User is busy on another call'
                : activeCall.status === 'declined'
                ? 'Call declined'
                : activeCall.status === 'ended'
                ? 'Call ended'
                : `Connected (${activeCall.type === 'VIDEO' ? 'Video' : 'Audio'} Call)`}
            </span>
          </div>
        </div>

        <div className={styles.controls}>
          {activeCall.status === 'busy' || activeCall.status === 'declined' || activeCall.status === 'ended' ? null : (
            isRinging && activeCall.role === 'receiver' ? (
            <>
              <button
                className={`${styles.btn} ${styles.btnAnswer}`}
                onClick={acceptCall}
                title="Answer Call"
              >
                <Phone size={24} />
              </button>
              <button
                className={`${styles.btn} ${styles.btnDecline}`}
                onClick={rejectCall}
                title="Decline Call"
              >
                <PhoneOff size={24} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {isConnected && activeCall.type === 'AUDIO' && (
                <button
                  className={`${styles.btn} ${isMuted ? styles.btnDecline : styles.btn}`}
                  style={{ background: isMuted ? undefined : 'rgba(255,255,255,0.1)', color: isMuted ? 'white' : 'var(--text-primary)' }}
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
              )}
              
              <button
                className={`${styles.btn} ${styles.btnDecline}`}
                onClick={activeCall.role === 'caller' && isRinging ? rejectCall : endCall}
                title="End Call"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          ))}
        </div>
        {/* Hidden audio element to play remote stream in audio call */}
        {isConnected && activeCall.type === 'AUDIO' && (
          <audio
            ref={(el) => {
              if (el && remoteStream && el.srcObject !== remoteStream) {
                el.srcObject = remoteStream;
              }
            }}
            autoPlay
            playsInline
            style={{ display: 'none' }}
          />
        )}
      </div>
    </div>
  );
};

export default CallOverlay;
