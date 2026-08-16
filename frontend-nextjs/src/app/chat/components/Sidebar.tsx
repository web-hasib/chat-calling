import React from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Users, Settings, Sun, Moon, LogOut, Plus, Link2, X, Upload } from 'lucide-react';
import { useChatContext } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';

interface SidebarProps {
  user: any;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  showUserList: boolean;
  setShowUserList: (v: boolean) => void;
  setSearchQuery: (v: string) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  theme: 'dark' | 'light';
  toggleTheme: (t: 'dark' | 'light') => void;
  openEditProfile: () => void;
  logout: () => void;
  searchQuery: string;
  users: any[];
  conversations: any[];
  conversationsLoading: boolean;
  activeConvo: any;
  onlineUsers: Set<string>;
  startChatWithUser: (u: any) => void;
  selectConvo: (c: any) => void;
  getRecipientInfo: (c: any) => any;
  getRecipientDisplayName: (c: any) => string;
  currentUserId: string;
}

export function Sidebar({
  user, sidebarCollapsed, setSidebarCollapsed,
  showUserList, setShowUserList, setSearchQuery,
  showSettings, setShowSettings,
  theme, toggleTheme, openEditProfile, logout,
  searchQuery, users, conversations, conversationsLoading,
  activeConvo, onlineUsers,
  startChatWithUser, selectConvo, getRecipientInfo, getRecipientDisplayName,
  currentUserId,
}: SidebarProps) {
  const { createGroup, joinGroup } = useChatContext();
  const { token } = useAuth();

  const [showCreateGroup, setShowCreateGroup] = React.useState(false);
  const [showJoinGroup, setShowJoinGroup] = React.useState(false);
  const [groupName, setGroupName] = React.useState('');
  const [groupAvatar, setGroupAvatar] = React.useState('');
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [creatingGroup, setCreatingGroup] = React.useState(false);
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [inviteCodeInput, setInviteCodeInput] = React.useState('');
  const [joining, setJoining] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'unread' | 'groups'>('all');

  // Compute counts for filter pills
  const unreadConvosCount = React.useMemo(() => {
    return conversations.filter((c) => (c.unreadCount || 0) > 0).length;
  }, [conversations]);

  const groupsCount = React.useMemo(() => {
    return conversations.filter((c) => c.isGroup).length;
  }, [conversations]);

  // Filter conversations list
  const filteredConversations = React.useMemo(() => {
    return conversations.filter((convo) => {
      if (activeFilter === 'unread') {
        return (convo.unreadCount || 0) > 0;
      }
      if (activeFilter === 'groups') {
        return convo.isGroup;
      }
      return true;
    });
  }, [conversations, activeFilter]);

  return (
    <div className={`flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)] transition-all duration-200 shrink-0 w-full md:w-auto ${sidebarCollapsed ? 'md:w-[76px]' : 'md:w-[320px]'}`}>
      <div className={`flex items-center justify-between border-b border-[var(--border-color)] ${sidebarCollapsed ? 'p-4 flex-col gap-4' : 'px-5 py-6'}`}>
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'flex-col text-center' : ''}`}>
          <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
          <div className={sidebarCollapsed ? 'hidden' : ''}>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Chats</h2>
            <div className="text-[11px] text-[var(--text-secondary)]">@{user.username || 'user'}</div>
          </div>
        </div>
        <div className="flex gap-2 items-center relative" style={{ flexDirection: sidebarCollapsed ? 'column' : 'row' }}>
          <button
            className="hidden md:flex w-8 h-8 rounded-full items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
            onClick={() => { setShowUserList(!showUserList); setSearchQuery(''); }}
            title={showUserList ? 'Show Conversations' : 'Start New Conversation'}
          >
            {showUserList ? <MessageSquare size={18} /> : <Users size={18} />}
          </button>
          {!sidebarCollapsed && (
            <>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                onClick={() => setShowCreateGroup(true)}
                title="Create Group Chat"
              >
                <Plus size={18} />
              </button>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                onClick={() => setShowJoinGroup(true)}
                title="Join Group by Code"
              >
                <Link2 size={18} />
              </button>
            </>
          )}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings & Theme"
          >
            <Settings size={18} />
          </button>

          {showSettings && (
            <>
              <div className="fixed inset-0 z-[140] bg-black/50 md:bg-transparent" onClick={() => setShowSettings(false)} />
              <div className={`absolute z-[150] w-[240px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-5 flex flex-col gap-5 shadow-lg ${sidebarCollapsed ? 'left-[50px] top-[40px]' : 'right-0 top-11'}`}>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">App Theme</span>
                  <div className="flex bg-[var(--bg-tertiary)] rounded-md p-[3px] border border-[var(--border-color)] w-full">
                    <button className={`flex-1 flex items-center justify-center gap-1.5 p-1.5 rounded-sm text-xs font-medium cursor-pointer transition-colors ${theme === 'light' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'}`} onClick={() => toggleTheme('light')}>
                      <Sun size={14} /><span>Light</span>
                    </button>
                    <button className={`flex-1 flex items-center justify-center gap-1.5 p-1.5 rounded-sm text-xs font-medium cursor-pointer transition-colors ${theme === 'dark' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'}`} onClick={() => toggleTheme('dark')}>
                      <Moon size={14} /><span>Dark</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Account</span>
                  <button
                    className="flex items-center justify-between p-2 rounded-md text-xs font-medium cursor-pointer w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors mb-2"
                    onClick={openEditProfile}
                  >
                    <span>Edit Profile</span><Users size={14} />
                  </button>
                  <button className="flex items-center justify-between p-2 rounded-md text-xs font-medium cursor-pointer w-full bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20 hover:border-red-500/30 transition-colors" onClick={logout}>
                    <span>Log Out</span><LogOut size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`p-3 border-b border-[var(--border-color)] flex flex-col gap-2.5 ${sidebarCollapsed ? 'hidden' : ''}`}>
        <input
          type="text"
          placeholder="Search by username, name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] text-xs outline-none focus:border-[var(--accent-primary)] transition-colors"
        />

        {/* Messenger-style Filter Tabs (All / Unread / Groups) */}
        {!showUserList && !searchQuery && (
          <div className="flex items-center gap-1.5 px-0.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                activeFilter === 'all'
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                  : 'bg-white/5 border-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]'
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                activeFilter === 'unread'
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                  : 'bg-white/5 border-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Unread</span>
              {unreadConvosCount > 0 && (
                <span className="px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px] font-bold">
                  {unreadConvosCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('groups')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                activeFilter === 'groups'
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                  : 'bg-white/5 border-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Groups</span>
              {groupsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-white/15 text-[var(--text-secondary)] rounded-full text-[10px] font-bold">
                  {groupsCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto p-3">
        {showUserList || searchQuery ? (
          users.length > 0 ? (
            users.map((u) => {
              const isOnline = onlineUsers.has(u.id);
              return (
                <div key={u.id} className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors mb-1 ${sidebarCollapsed ? 'justify-center' : ''}`} onClick={() => startChatWithUser(u)}>
                  <div className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                    <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className={sidebarCollapsed ? 'hidden' : 'min-w-0'}>
                      <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{u.name}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] truncate">@{u.username} • {u.email}</div>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[var(--accent-success)]' : 'bg-[var(--text-muted)]'} ${sidebarCollapsed ? 'absolute ml-5 mt-5 border-2 border-[var(--bg-secondary)]' : ''}`} />
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-sm text-[var(--text-secondary)]">No users found</div>
          )
        ) : conversationsLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-3 gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--bg-tertiary)] animate-pulse shrink-0" />
              <div className={`flex-grow flex flex-col gap-1.5 ${sidebarCollapsed ? 'hidden' : ''}`}>
                <div className="w-[40%] h-2.5 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="w-[60%] h-2 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((convo) => {
            const recipient = getRecipientInfo(convo);
            if (!recipient && !convo.isGroup) return null;
            const displayName = convo.isGroup ? convo.name : getRecipientDisplayName(convo);
            const isOnline = convo.isGroup ? false : onlineUsers.has(recipient.id);
            const isActive = activeConvo?.id === convo.id;
            const unreadCount = convo.unreadCount || 0;
            const hasUnread = unreadCount > 0;

            return (
              <div
                key={convo.id}
                className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors mb-1 ${
                  isActive ? 'bg-[var(--bg-tertiary)] border-l-3 border-[var(--accent-primary)]' : ''
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                onClick={() => selectConvo(convo)}
                style={isActive && convo.themeColor ? { borderLeftColor: convo.themeColor } : undefined}
              >
                <div className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                  <div className="relative shrink-0">
                    <img
                      src={
                        convo.isGroup
                          ? convo.avatarUrl ||
                            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=100&q=80'
                          : recipient.avatarUrl
                      }
                      alt={displayName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    {!convo.isGroup && isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--accent-success)] border-2 border-[var(--bg-secondary)] rounded-full" />
                    )}
                  </div>

                  <div className={sidebarCollapsed ? 'hidden' : 'min-w-0 flex-1'}>
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-sm truncate ${
                          hasUnread
                            ? 'font-bold text-[var(--text-primary)]'
                            : 'font-semibold text-[var(--text-primary)]'
                        }`}
                      >
                        {displayName}
                      </span>
                    </div>

                    <div
                      className={`text-xs truncate max-w-[170px] ${
                        hasUnread
                          ? 'font-semibold text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {convo.messages[0]
                        ? `${
                            convo.messages[0].senderId === currentUserId
                              ? 'You: '
                              : convo.isGroup
                              ? `${convo.messages[0].sender?.name || 'User'}: `
                              : ''
                          }${convo.messages[0].content || 'Sent a file'}`
                        : 'No messages yet'}
                    </div>
                  </div>
                </div>

                {/* Right badges: Unread Badge or Online Dot */}
                {!sidebarCollapsed && hasUnread ? (
                  <div className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-500 text-white rounded-full text-[11px] font-bold shadow">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                ) : !sidebarCollapsed && !convo.isGroup && (
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-[var(--accent-success)]' : 'bg-transparent'
                    }`}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-[var(--text-secondary)] flex flex-col items-center gap-2">
            {activeFilter === 'unread' ? (
              <>
                <span className="text-lg">🎉</span>
                <span>You have caught up with all messages!</span>
              </>
            ) : activeFilter === 'groups' ? (
              <>
                <span className="text-lg">👥</span>
                <span>No group chats found.</span>
              </>
            ) : (
              <span>No conversations active. Click the user icon above to start chatting!</span>
            )}
          </div>
        )}
      </div>
      {/* ── Create Group Modal ── */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="w-[400px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-4 shadow-2xl relative text-[var(--text-primary)] animate-in zoom-in-95 ease-out duration-200">
            <button className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer" onClick={() => { setShowCreateGroup(false); setSelectedUserIds([]); setGroupName(''); }}>
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold">Create Group Chat</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Group Icon (Avatar)</label>
              <div className="flex items-center gap-3">
                {groupAvatar ? (
                  <img src={groupAvatar} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border-color)] text-[10px] text-[var(--text-secondary)]">No Icon</div>
                )}
                <label className="flex-grow py-2 px-3 border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] rounded-lg text-xs font-semibold text-center cursor-pointer transition-colors text-[var(--text-primary)]">
                  {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingAvatar(true);
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/chat/upload`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` },
                          body: formData,
                        });
                        if (!res.ok) throw new Error('Upload failed');
                        const data = await res.json();
                        setGroupAvatar(data.fileUrl);
                      } catch {
                        alert('Failed to upload image.');
                      } finally {
                        setUploadingAvatar(false);
                      }
                    }}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Select Members</label>
              <div className="overflow-y-auto flex flex-col gap-1 pr-1 max-h-[180px]">
                {users.map((u) => (
                  <label key={u.id} className="flex items-center justify-between p-2 rounded hover:bg-[var(--bg-tertiary)] cursor-pointer text-sm">
                    <div className="flex items-center gap-2">
                      <img src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <span>{u.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds([...selectedUserIds, u.id]);
                        } else {
                          setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                        }
                      }}
                      className="accent-[var(--accent-primary)] cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
            <button
              disabled={!groupName.trim() || selectedUserIds.length === 0 || creatingGroup}
              onClick={async () => {
                setCreatingGroup(true);
                const convo = await createGroup(groupName, groupAvatar, selectedUserIds);
                setCreatingGroup(false);
                if (convo) {
                  setShowCreateGroup(false);
                  setGroupName('');
                  setGroupAvatar('');
                  setSelectedUserIds([]);
                  selectConvo(convo);
                }
              }}
              className="w-full py-2.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {creatingGroup ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      )}

      {/* ── Join Group Modal ── */}
      {showJoinGroup && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="w-[360px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-4 shadow-2xl relative text-[var(--text-primary)] animate-in zoom-in-95 ease-out duration-200">
            <button className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer" onClick={() => { setShowJoinGroup(false); setInviteCodeInput(''); }}>
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold">Join Group by Invite</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Invite Code</label>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder="e.g. A1B2C3D4"
                className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
              />
            </div>
            <button
              disabled={!inviteCodeInput.trim() || joining}
              onClick={async () => {
                setJoining(true);
                const convo = await joinGroup(inviteCodeInput.trim().toUpperCase());
                setJoining(false);
                if (convo) {
                  setShowJoinGroup(false);
                  setInviteCodeInput('');
                  selectConvo(convo);
                }
              }}
              className="w-full py-2.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {joining ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
