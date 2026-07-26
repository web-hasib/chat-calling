'use client';
import React from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Users, Settings, Sun, Moon, LogOut } from 'lucide-react';
import styles from '../chat.module.css';

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
    <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.userProfile}>
          <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />
          <div>
            <h2 className={styles.sidebarTitle}>Chats</h2>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>@{user.username || 'user'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => { setShowUserList(!showUserList); setSearchQuery(''); }}
            title={showUserList ? 'Show Conversations' : 'Start New Conversation'}
          >
            {showUserList ? <MessageSquare size={18} /> : <Users size={18} />}
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings & Theme"
          >
            <Settings size={18} />
          </button>

          {showSettings && (
            <>
              <div className={styles.settingsOverlay} onClick={() => setShowSettings(false)} />
              <div className={styles.settingsDropdown}>
                <div className={styles.settingsSection}>
                  <span className={styles.settingsLabel}>App Theme</span>
                  <div className={styles.themeSwitch}>
                    <button className={theme === 'light' ? styles.themeBtnActive : styles.themeBtn} onClick={() => toggleTheme('light')}>
                      <Sun size={14} /><span>Light</span>
                    </button>
                    <button className={theme === 'dark' ? styles.themeBtnActive : styles.themeBtn} onClick={() => toggleTheme('dark')}>
                      <Moon size={14} /><span>Dark</span>
                    </button>
                  </div>
                </div>
                <div className={styles.settingsSection}>
                  <span className={styles.settingsLabel}>Account</span>
                  <button
                    className={styles.logoutOption}
                    onClick={openEditProfile}
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', marginBottom: '8px' }}
                  >
                    <span>Edit Profile</span><Users size={14} />
                  </button>
                  <button className={styles.logoutOption} onClick={logout}>
                    <span>Log Out</span><LogOut size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by username, name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.userList}>
        {showUserList || searchQuery ? (
          users.length > 0 ? (
            users.map((u) => {
              const isOnline = onlineUsers.has(u.id);
              return (
                <div key={u.id} className={styles.listItem} onClick={() => startChatWithUser(u)}>
                  <div className={styles.userInfo}>
                    <img src={u.avatarUrl} alt={u.name} className={styles.avatarSmall} />
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.userName}>{u.name}</div>
                      <div className={styles.userNameSub}>@{u.username} • {u.email}</div>
                    </div>
                  </div>
                  <div className={isOnline ? styles.statusOnline : styles.statusIndicator} />
                </div>
              );
            })
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found</div>
          )
        ) : conversationsLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonListItem} style={{ padding: '12px' }}>
              <div className={styles.skeletonPulse} style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '12px' }}>
                <div className={styles.skeletonPulse} style={{ width: '40%', height: '10px' }} />
                <div className={styles.skeletonPulse} style={{ width: '60%', height: '8px' }} />
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
                className={isActive ? styles.listItemActive : styles.listItem}
                onClick={() => selectConvo(convo)}
                style={isActive && convo.themeColor ? { borderLeftColor: convo.themeColor } : undefined}
              >
                <div className={styles.userInfo}>
                  <img src={recipient.avatarUrl} alt={displayName} className={styles.avatarSmall} />
                  <div>
                    <div className={styles.userName}>{displayName}</div>
                    <div className={styles.lastMessage}>
                      {convo.messages[0]
                        ? `${convo.messages[0].senderId === currentUserId ? 'You: ' : ''}${convo.messages[0].content || 'Sent a file'}`
                        : 'No messages yet'}
                    </div>
                  </div>
                </div>
                <div className={isOnline ? styles.statusOnline : styles.statusIndicator} />
              </div>
            );
          })
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No conversations active. Click the user icon above to start chatting!
          </div>
        )}
      </div>
    </div>
  );
}
