'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';

import { useChat } from '../../hooks/useChat';
import { useMediaEditor } from '../../hooks/useMediaEditor';
import { useTyping } from '../../hooks/useTyping';

import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import { ChatDetails } from './components/ChatDetails';
import { EditProfileModal } from './components/EditProfileModal';
import { Lightbox } from './components/Lightbox';

import styles from './chat.module.css';

export default function ChatPage() {
  const { user, token, logout, loading, updateProfile } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { startCall } = useCall();
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // ── UI-only state (stays in orchestrator) ──
  const [viewMode, setViewMode] = useState<'sidebar' | 'chat'>('sidebar');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading] = useState(false);

  // Chat details sub-state
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [showDefaultEmojiPickerPopover, setShowDefaultEmojiPickerPopover] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [customUploadedBgs, setCustomUploadedBgs] = useState<string[]>([]);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Edit profile
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Refs
  const messageAreaRef = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);
  const customReactionPickerRef = useRef<HTMLDivElement | null>(null);
  const deleteTooltipRef = useRef<HTMLDivElement | null>(null);
  const defaultEmojiPickerRef = useRef<HTMLDivElement | null>(null);

  const [isRecipientTyping, setIsRecipientTyping] = useState(false);

  const chat = useChat(user, token, setIsRecipientTyping);
  const {
    conversations, messages, activeConvo, setActiveConvo,
    users, conversationsLoading,
    hasMore, loadingMore, prependedMsgIds, isSwitchingThread,
    autoScrollBottomRef,
    replyingTo, setReplyingTo,
    activeReactionPickerId, setActiveReactionPickerId,
    activeCustomEmojiMsgId, setActiveCustomEmojiMsgId,
    deleteConfirmMsgId, setDeleteConfirmMsgId,
    reactionUpdatingMsgId,
    fetchConversations, fetchUsers, selectConvo, loadMoreMessages,
    handleSend, handleSendDefaultEmoji,
    handleToggleReaction, confirmDeleteMessage,
    updateChatSettings, scrollToMessage,
    getGroupedReactions, getRecipientInfo, getRecipientDisplayName,
  } = chat;

  const { handleInputChange, stopTyping } = useTyping(activeConvo);

  const mediaEditor = useMediaEditor(
    activeConvo, token, socket, replyingTo, setReplyingTo, autoScrollBottomRef
  );

  // Scroll to bottom
  useEffect(() => {
    if (autoScrollBottomRef.current && messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages, isRecipientTyping]);

  // Redirect if no token
  useEffect(() => {
    if (!loading && !token) router.push('/');
  }, [token, loading, router]);

  // Load conversations on token
  useEffect(() => {
    if (token) fetchConversations();
  }, [token]);

  // Debounce user search
  useEffect(() => {
    if (!token) return;
    const t = setTimeout(() => fetchUsers(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, token]);

  // Theme
  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(saved);
    document.body.classList.toggle('light-theme', saved === 'light');
  }, []);

  const toggleTheme = (t: 'dark' | 'light') => {
    setTheme(t);
    localStorage.setItem('theme', t);
    document.body.classList.toggle('light-theme', t === 'light');
  };

  // Click-outside handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
      if (defaultEmojiPickerRef.current && !defaultEmojiPickerRef.current.contains(e.target as Node)) setShowDefaultEmojiPickerPopover(false);
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target as Node)) setActiveReactionPickerId(null);
      if (customReactionPickerRef.current && !customReactionPickerRef.current.contains(e.target as Node)) setActiveCustomEmojiMsgId(null);
      if (deleteTooltipRef.current && !deleteTooltipRef.current.contains(e.target as Node)) setDeleteConfirmMsgId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Derived values ──
  const activeThemeColor = activeConvo?.themeColor || '#0084FF';
  const activeThemeGradient = activeConvo?.themeGradient;
  const activeBgImage = activeConvo?.bgImage;
  const activeDefaultEmoji = activeConvo?.defaultEmoji || '👍';
  const recipientInfo = getRecipientInfo(activeConvo);
  const recipientName = getRecipientDisplayName(activeConvo);
  const recipientIsOnline = recipientInfo ? onlineUsers.has(recipientInfo.id) : false;

  // ── Handlers ──
  const handleCall = (type: 'AUDIO' | 'VIDEO') => {
    if (!activeConvo || !user) return;
    const recipient = activeConvo.participants.find((p: any) => p.userId !== user.id)?.user;
    if (!recipient) return;
    startCall(recipient.id, recipient.name, recipient.avatarUrl, type, activeConvo.id);
  };

  const handleBackToSidebar = () => {
    setViewMode('sidebar');
    setActiveConvo(null);
    setShowDetails(false);
  };

  const handleSelectConvo = async (convo: any) => {
    setViewMode('chat');
    setShowDetails(false);
    await selectConvo(convo);
  };

  const handleStartChatWithUser = async (targetUser: any) => {
    try {
      const res = await fetch(`${API_URL}/chat/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientId: targetUser.id }),
      });
      if (!res.ok) throw new Error();
      const convo = await res.json();
      await fetchConversations();
      setShowUserList(false);
      setSearchQuery('');
      setViewMode('chat');
      await selectConvo(convo);
    } catch (e) {
      console.error('Error starting chat', e);
    }
  };

  const handleSaveNickname = (targetUserId: string) => {
    updateChatSettings({ nicknameTargetUserId: targetUserId, nickname: nicknameInput.trim() });
    setEditingParticipantId(null);
    setNicknameInput('');
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvo || !token) return;
    setIsUploadingBg(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      updateChatSettings({ bgImage: data.fileUrl });
      setCustomUploadedBgs((prev) => Array.from(new Set([data.fileUrl, ...prev])));
    } catch {
      alert('Failed to upload background image.');
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleDeleteCustomBg = (bgUrl: string) => {
    setCustomUploadedBgs((prev) => prev.filter((u) => u !== bgUrl));
    if (activeConvo?.bgImage === bgUrl) updateChatSettings({ bgImage: '' });
  };

  const handleInitiateReply = (msg: any) => {
    setReplyingTo(msg);
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  const handleSendMessage = () => {
    handleSend(inputText, setInputText, stopTyping);
  };

  const handleScrollMessages = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget;
    if (t.scrollTop < 40 && hasMore && !loadingMore) {
      loadMoreMessages(messageAreaRef);
    }
  };

  // ── Edit profile handlers ──
  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditUsername(user?.username || '');
    setEditAvatarUrl(user?.avatarUrl || '');
    setProfileError('');
    setProfileSuccess(false);
    setShowEditProfile(true);
    setShowSettings(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setProfileError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({ message: 'Upload failed' }))).message);
      setEditAvatarUrl((await res.json()).fileUrl);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to upload image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setProfileUpdating(true);
    try {
      await updateProfile(editName.trim(), editUsername.trim().toLowerCase(), editAvatarUrl);
      setProfileSuccess(true);
      setTimeout(() => setShowEditProfile(false), 1500);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileUpdating(false);
    }
  };

  // ── Loading skeleton ──
  if (loading || !user) {
    return (
      <div className={styles.skeletonContainer}>
        <div className={styles.skeletonSidebar}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className={styles.skeletonPulse} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            <div className={styles.skeletonPulse} style={{ width: '80px', height: '24px' }} />
          </div>
          <div className={styles.skeletonPulse} style={{ width: '100%', height: '36px', borderRadius: '18px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.skeletonListItem}>
                <div className={styles.skeletonPulse} style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className={styles.skeletonPulse} style={{ width: '40%', height: '12px' }} />
                  <div className={styles.skeletonPulse} style={{ width: '70%', height: '10px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.skeletonChat}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className={styles.skeletonPulse} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              <div className={styles.skeletonPulse} style={{ width: '100px', height: '14px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className={styles.skeletonPulse} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              <div className={styles.skeletonPulse} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'flex-end' }}>
            <div className={styles.skeletonPulse} style={{ width: '200px', height: '40px', borderRadius: '12px', alignSelf: 'flex-start' }} />
            <div className={styles.skeletonPulse} style={{ width: '140px', height: '40px', borderRadius: '12px', alignSelf: 'flex-end' }} />
            <div className={styles.skeletonPulse} style={{ width: '260px', height: '40px', borderRadius: '12px', alignSelf: 'flex-start' }} />
          </div>
          <div className={styles.skeletonPulse} style={{ width: '100%', height: '44px', borderRadius: '22px' }} />
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className={`${styles.container} ${viewMode === 'sidebar' ? styles.viewSidebar : styles.viewChat} ${sidebarCollapsed ? styles.collapsedSidebar : ''}`}>

      {/* ── Sidebar ── */}
      <Sidebar
        user={user}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        showUserList={showUserList}
        setShowUserList={setShowUserList}
        setSearchQuery={setSearchQuery}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        theme={theme}
        toggleTheme={toggleTheme}
        openEditProfile={openEditProfile}
        logout={logout}
        searchQuery={searchQuery}
        users={users}
        conversations={conversations}
        conversationsLoading={conversationsLoading}
        activeConvo={activeConvo}
        onlineUsers={onlineUsers}
        startChatWithUser={handleStartChatWithUser}
        selectConvo={handleSelectConvo}
        getRecipientInfo={getRecipientInfo}
        getRecipientDisplayName={getRecipientDisplayName}
        currentUserId={user.id}
      />

      {/* ── Main Chat Window ── */}
      <div className={styles.chatWindow}>
        {activeConvo ? (
          <>
            {/* Header */}
            <ChatHeader
              activeConvo={activeConvo}
              recipientName={recipientName}
              recipientAvatarUrl={recipientInfo?.avatarUrl || ''}
              isOnline={recipientIsOnline}
              showDetails={showDetails}
              activeThemeColor={activeThemeColor}
              onBack={handleBackToSidebar}
              onAudioCall={() => handleCall('AUDIO')}
              onVideoCall={() => handleCall('VIDEO')}
              onToggleDetails={() => setShowDetails(!showDetails)}
            />

            {/* Body Row */}
            <div className={styles.chatBodyRow}>
              {/* Left Column: Messages + Input */}
              <div className={styles.chatMainColumn}>
                <MessageList
                  messages={messages}
                  hasMore={hasMore}
                  loadingMore={loadingMore}
                  isSwitchingThread={isSwitchingThread}
                  isRecipientTyping={isRecipientTyping}
                  recipientTypingName={recipientName}
                  activeThemeColor={activeThemeColor}
                  prependedMsgIds={prependedMsgIds}
                  messageAreaRef={messageAreaRef}
                  activeBgImage={activeBgImage}
                  currentUserId={user.id}
                  reactionUpdatingMsgId={reactionUpdatingMsgId}
                  activeReactionPickerId={activeReactionPickerId}
                  activeCustomEmojiMsgId={activeCustomEmojiMsgId}
                  deleteConfirmMsgId={deleteConfirmMsgId}
                  activeThemeGradient={activeThemeGradient}
                  theme={theme}
                  reactionPickerRef={reactionPickerRef}
                  customReactionPickerRef={customReactionPickerRef}
                  getGroupedReactions={getGroupedReactions}
                  onScroll={handleScrollMessages}
                  onLoadMore={() => loadMoreMessages(messageAreaRef)}
                  onReply={handleInitiateReply}
                  onReactionPickerToggle={setActiveReactionPickerId}
                  onCustomEmojiMsgToggle={setActiveCustomEmojiMsgId}
                  onToggleReaction={handleToggleReaction}
                  onDeleteToggle={setDeleteConfirmMsgId}
                  onConfirmDelete={confirmDeleteMessage}
                  onScrollToMessage={(id) => scrollToMessage(id, styles.highlightMessage)}
                  onOpenLightbox={(urls, i) => { setLightboxImages(urls); setLightboxIndex(i); }}
                />

                <MessageInput
                  inputText={inputText}
                  uploading={uploading}
                  sendingMedia={mediaEditor.sendingMedia}
                  replyingTo={replyingTo}
                  activeDefaultEmoji={activeDefaultEmoji}
                  activeThemeColor={activeThemeColor}
                  activeThemeGradient={activeThemeGradient}
                  theme={theme}
                  showEmojiPicker={showEmojiPicker}
                  emojiPickerRef={emojiPickerRef}
                  textInputRef={textInputRef}
                  onInputChange={(val) => handleInputChange(val, setInputText)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  onSend={handleSendMessage}
                  onSendDefaultEmoji={handleSendDefaultEmoji}
                  onFileSelect={mediaEditor.handleFileSelect}
                  onEmojiClick={(d) => { setInputText((p) => p + d.emoji); textInputRef.current?.focus(); }}
                  onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
                  onCancelReply={() => setReplyingTo(null)}
                />
              </div>

              {/* Media Preview Modal */}
              {mediaEditor.showMediaPreviewModal && mediaEditor.pendingMediaItems.length > 0 && (
                <MediaPreviewModal
                  pendingMediaItems={mediaEditor.pendingMediaItems}
                  activeMediaIndex={mediaEditor.activeMediaIndex}
                  setActiveMediaIndex={mediaEditor.setActiveMediaIndex}
                  mediaCaptions={mediaEditor.mediaCaptions}
                  setMediaCaptions={mediaEditor.setMediaCaptions}
                  mediaFilters={mediaEditor.mediaFilters}
                  setMediaFilters={mediaEditor.setMediaFilters}
                  mediaRotations={mediaEditor.mediaRotations}
                  setMediaRotations={mediaEditor.setMediaRotations}
                  isDrawMode={mediaEditor.isDrawMode}
                  setIsDrawMode={mediaEditor.setIsDrawMode}
                  drawColor={mediaEditor.drawColor}
                  setDrawColor={mediaEditor.setDrawColor}
                  brushSize={mediaEditor.brushSize}
                  setBrushSize={mediaEditor.setBrushSize}
                  showFilterPicker={mediaEditor.showFilterPicker}
                  setShowFilterPicker={mediaEditor.setShowFilterPicker}
                  sendingMedia={mediaEditor.sendingMedia}
                  qualityMode={mediaEditor.qualityMode}
                  setQualityMode={mediaEditor.setQualityMode}
                  drawCanvasRef={mediaEditor.drawCanvasRef}
                  activeThemeColor={activeThemeColor}
                  onClose={mediaEditor.handleCancelMediaPreview}
                  onSend={mediaEditor.handleSendMediaWithCaption}
                  onRemoveThumbnail={mediaEditor.handleRemoveThumbnail}
                  onFileSelect={mediaEditor.handleFileSelect}
                  startDrawing={mediaEditor.startDrawing}
                  draw={mediaEditor.draw}
                  stopDrawing={mediaEditor.stopDrawing}
                  clearDrawing={mediaEditor.clearDrawing}
                />
              )}

              {/* Right Details Sidebar */}
              {showDetails && (
                <ChatDetails
                  activeConvo={activeConvo}
                  activeThemeColor={activeThemeColor}
                  activeBgImage={activeBgImage}
                  activeDefaultEmoji={activeDefaultEmoji}
                  theme={theme}
                  onlineUsers={onlineUsers}
                  editingParticipantId={editingParticipantId}
                  setEditingParticipantId={setEditingParticipantId}
                  nicknameInput={nicknameInput}
                  setNicknameInput={setNicknameInput}
                  showDefaultEmojiPickerPopover={showDefaultEmojiPickerPopover}
                  setShowDefaultEmojiPickerPopover={setShowDefaultEmojiPickerPopover}
                  copiedHandle={copiedHandle}
                  setCopiedHandle={setCopiedHandle}
                  isUploadingBg={isUploadingBg}
                  customUploadedBgs={customUploadedBgs}
                  defaultEmojiPickerRef={defaultEmojiPickerRef}
                  getRecipientInfo={getRecipientInfo}
                  getRecipientDisplayName={getRecipientDisplayName}
                  onClose={() => setShowDetails(false)}
                  onSaveNickname={handleSaveNickname}
                  updateChatSettings={updateChatSettings}
                  onBgUpload={handleBgUpload}
                  onDeleteCustomBg={handleDeleteCustomBg}
                />
              )}
            </div>
          </>
        ) : (
          <div className={styles.placeholder}>
            <MessageSquare size={48} strokeWidth={1} />
            <p>Select or start a conversation to begin messaging</p>
          </div>
        )}
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEditProfile && (
        <EditProfileModal
          editName={editName}
          setEditName={setEditName}
          editUsername={editUsername}
          setEditUsername={setEditUsername}
          editAvatarUrl={editAvatarUrl}
          uploadingAvatar={uploadingAvatar}
          profileUpdating={profileUpdating}
          profileError={profileError || null}
          profileSuccess={profileSuccess}
          onClose={() => setShowEditProfile(false)}
          onSubmit={handleProfileSubmit}
          onAvatarUpload={handleAvatarUpload}
        />
      )}

      {/* ── Lightbox ── */}
      <Lightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxImages([])}
        onPrev={() => setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length)}
        onNext={() => setLightboxIndex((i) => (i + 1) % lightboxImages.length)}
      />
    </div>
  );
}
