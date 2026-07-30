'use client';
import React from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Users, Settings, Sun, Moon, LogOut } from 'lucide-react';

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

      <div className={`p-3 border-b border-[var(--border-color)] ${sidebarCollapsed ? 'hidden' : ''}`}>
        <input
          type="text"
          placeholder="Search by username, name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] text-xs outline-none focus:border-[var(--accent-primary)] transition-colors"
        />
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
        ) : conversations.length > 0 ? (
          conversations.map((convo) => {
            const recipient = getRecipientInfo(convo);
            if (!recipient) return null;
            const displayName = getRecipientDisplayName(convo);
            const isOnline = onlineUsers.has(recipient.id);
            const isActive = activeConvo?.id === convo.id;
            return (
              <div
                key={convo.id}
                className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors mb-1 ${isActive ? 'bg-[var(--bg-tertiary)] border-l-3 border-[var(--accent-primary)]' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}
                onClick={() => selectConvo(convo)}
                style={isActive && convo.themeColor ? { borderLeftColor: convo.themeColor } : undefined}
              >
                <div className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                  <img src={recipient.avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
                  <div className={sidebarCollapsed ? 'hidden' : 'min-w-0'}>
                    <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</div>
                    <div className="text-xs text-[var(--text-secondary)] truncate max-w-[180px]">
                      {convo.messages[0]
                        ? `${convo.messages[0].senderId === currentUserId ? 'You: ' : ''}${convo.messages[0].content || 'Sent a file'}`
                        : 'No messages yet'}
                    </div>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[var(--accent-success)]' : 'bg-[var(--text-muted)]'} ${sidebarCollapsed ? 'absolute ml-5 mt-5 border-2 border-[var(--bg-secondary)]' : ''}`} />
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-sm text-[var(--text-secondary)]">
            No conversations active. Click the user icon above to start chatting!
          </div>
        )}
      </div>
    </div>
  );
}
