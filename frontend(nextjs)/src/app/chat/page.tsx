'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import styles from './chat.module.css';
import { Phone, Video, Send, Paperclip, MessageSquare, Users, Settings, Sun, Moon, LogOut, ArrowLeft, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const { user, token, logout, loading } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { startCall } = useCall();
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConvo, setActiveConvo] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  
  const [showUserList, setShowUserList] = useState(false);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Responsive mobile state: 'sidebar' | 'chat'
  const [viewMode, setViewMode] = useState<'sidebar' | 'chat'>('sidebar');

  // Collapsible sidebar state for MD devices
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Settings dropdown state
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Typing status state
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const isTypingLocalRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messageAreaRef = useRef<HTMLDivElement | null>(null);

  // Conversations loading indicator
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!loading && !token) {
      router.push('/');
    }
  }, [token, loading, router]);

  useEffect(() => {
    if (!token) return;
    fetchConversations();
  }, [token]);

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, []);

  const toggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  // Fetch users with search queries dynamically
  useEffect(() => {
    if (!token) return;
    const delayDebounce = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, token]);

  // Scroll to bottom on new messages or typing indicator
  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages, isRecipientTyping]);

  // Global socket listener for instant messaging updates
  useEffect(() => {
    if (!socket) return;

    socket.on('new-message-notification', (msg: any) => {
      // 1. Instant Sidebar Preview Update
      setConversations((prevConvos) => {
        const index = prevConvos.findIndex((c) => c.id === msg.conversationId);
        if (index === -1) {
          fetchConversations();
          return prevConvos;
        }

        const updatedConvos = [...prevConvos];
        const convo = { ...updatedConvos[index] };
        convo.messages = [msg];
        updatedConvos.splice(index, 1);
        return [convo, ...updatedConvos];
      });

      // 2. Instant Active Chat Panel Update
      if (activeConvo && activeConvo.id === msg.conversationId) {
        setMessages((prevMessages) => {
          if (prevMessages.some((m) => m.id === msg.id)) return prevMessages;

          // Check if there is an optimistic placeholder matching this content
          const optimisticIndex = prevMessages.findIndex(
            (m) => m.id === 'pending'
          );

          if (optimisticIndex !== -1) {
            const updated = [...prevMessages];
            updated[optimisticIndex] = msg;
            return updated;
          }

          return [...prevMessages, msg];
        });
      }
    });

    return () => {
      socket.off('new-message-notification');
    };
  }, [socket, activeConvo]);

  // Subscribe to typing indicator for active conversation
  useEffect(() => {
    if (!socket || !activeConvo) {
      setIsRecipientTyping(false);
      return;
    }

    const eventName = `typing-${activeConvo.id}`;

    socket.on(eventName, (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        setIsRecipientTyping(data.isTyping);
      }
    });

    return () => {
      socket.off(eventName);
    };
  }, [socket, activeConvo, user]);

  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!socket || !activeConvo) return;

    if (!isTypingLocalRef.current) {
      isTypingLocalRef.current = true;
      socket.emit('typing', { conversationId: activeConvo.id, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingLocalRef.current = false;
      socket.emit('typing', { conversationId: activeConvo.id, isTyping: false });
    }, 1500);
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConversations(data);
    } catch (e) {
      console.error('Error fetching conversations', e);
    } finally {
      setConversationsLoading(false);
    }
  };

  const fetchUsers = async (search?: string) => {
    try {
      const url = search ? `${API_URL}/chat/users?search=${encodeURIComponent(search)}` : `${API_URL}/chat/users`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error('Error fetching users', e);
    }
  };

  const selectConvo = async (convo: any) => {
    setActiveConvo(convo);
    setViewMode('chat');
    setIsRecipientTyping(false);
    try {
      const res = await fetch(`${API_URL}/chat/conversation/${convo.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error('Error fetching messages', e);
    }
  };

  const startChatWithUser = async (targetUser: any) => {
    try {
      const res = await fetch(`${API_URL}/chat/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: targetUser.id }),
      });
      if (!res.ok) throw new Error();
      const convo = await res.json();
      
      await fetchConversations();
      setActiveConvo(convo);
      setShowUserList(false);
      setSearchQuery('');
      setViewMode('chat');
      selectConvo(convo);
    } catch (e) {
      console.error('Error starting chat', e);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeConvo || !socket || !user) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isTypingLocalRef.current = false;
    socket.emit('typing', { conversationId: activeConvo.id, isTyping: false });

    // Optimistic UI state append
    const optimisticMsg = {
      id: 'pending',
      content: inputText,
      senderId: user.id,
      conversationId: activeConvo.id,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      }
    };
    
    setMessages((prev) => [...prev, optimisticMsg]);
    
    setConversations((prevConvos) => {
      const index = prevConvos.findIndex((c) => c.id === activeConvo.id);
      if (index !== -1) {
        const updatedConvos = [...prevConvos];
        const convo = { ...updatedConvos[index] };
        convo.messages = [optimisticMsg];
        updatedConvos.splice(index, 1);
        return [convo, ...updatedConvos];
      }
      return prevConvos;
    });

    socket.emit('send-message', {
      conversationId: activeConvo.id,
      content: inputText,
    });
    setInputText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvo || !socket) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const res = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      socket.emit('send-message', {
        conversationId: activeConvo.id,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
      });
    } catch (err) {
      console.error(err);
      alert('File upload failed. Ensure storage keys are valid.');
    } finally {
      setUploading(false);
    }
  };

  const handleCall = (type: 'AUDIO' | 'VIDEO') => {
    if (!activeConvo || !user) return;
    const recipient = activeConvo.participants.find((p: any) => p.userId !== user.id)?.user;
    if (!recipient) return;

    startCall(recipient.id, recipient.name, recipient.avatarUrl, type, activeConvo.id);
  };

  const handleBackToSidebar = () => {
    setViewMode('sidebar');
    setActiveConvo(null);
  };

  // Skeleton Loading Page Override
  if (loading || !user) {
    return (
      <div className={styles.skeletonContainer}>
        {/* Left sidebar skeleton */}
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

        {/* Right main panel skeleton */}
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

  const getRecipientInfo = (convo: any) => {
    return convo.participants.find((p: any) => p.userId !== user.id)?.user;
  };

  return (
    <div className={`${styles.container} ${viewMode === 'sidebar' ? styles.viewSidebar : styles.viewChat} ${sidebarCollapsed ? styles.collapsedSidebar : ''}`}>
      {/* Sidebar Panel */}
      <div className={styles.sidebar}>
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
              onClick={() => {
                setShowUserList(!showUserList);
                setSearchQuery('');
              }}
              title={showUserList ? 'Show Conversations' : 'Start New Conversation'}
            >
              {showUserList ? <MessageSquare size={18} /> : <Users size={18} />}
            </button>
            <button 
              className={styles.actionBtn} 
              onClick={() => setShowSettings(!showSettings)} 
              title="Settings &amp; Theme"
            >
              <Settings size={18} />
            </button>

            {/* Settings & Theme Gear Dropdown */}
            {showSettings && (
              <>
                <div className={styles.settingsOverlay} onClick={() => setShowSettings(false)} />
                <div className={styles.settingsDropdown}>
                  <div className={styles.settingsSection}>
                    <span className={styles.settingsLabel}>Select Theme</span>
                    <div className={styles.themeSwitch}>
                      <button 
                        className={theme === 'light' ? styles.themeBtnActive : styles.themeBtn}
                        onClick={() => toggleTheme('light')}
                      >
                        <Sun size={14} />
                        <span>Light</span>
                      </button>
                      <button 
                        className={theme === 'dark' ? styles.themeBtnActive : styles.themeBtn}
                        onClick={() => toggleTheme('dark')}
                      >
                        <Moon size={14} />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>
                  <div className={styles.settingsSection}>
                    <span className={styles.settingsLabel}>Account</span>
                    <button className={styles.logoutOption} onClick={logout}>
                      <span>Log Out</span>
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Search Box */}
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
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No users found
              </div>
            )
          ) : conversationsLoading ? (
            // Render sidebar-specific list item skeletons
            [1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonListItem} style={{ padding: '12px' }}>
                <div className={styles.skeletonPulse} style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '12px' }}>
                  <div className={styles.skeletonPulse} style={{ width: '40%', height: '10px' }} />
                  <div className={styles.skeletonPulse} style={{ width: '60%', height: '8px' }} />
                </div>
              </div>
            ))
          ) : (
            conversations.length > 0 ? (
              conversations.map((convo) => {
                const recipient = getRecipientInfo(convo);
                if (!recipient) return null;
                const isOnline = onlineUsers.has(recipient.id);
                const isActive = activeConvo?.id === convo.id;
                
                return (
                  <div
                    key={convo.id}
                    className={isActive ? styles.listItemActive : styles.listItem}
                    onClick={() => selectConvo(convo)}
                  >
                    <div className={styles.userInfo}>
                      <img src={recipient.avatarUrl} alt={recipient.name} className={styles.avatarSmall} />
                      <div>
                        <div className={styles.userName}>{recipient.name}</div>
                        <div className={styles.lastMessage}>
                          {convo.messages[0]
                            ? `${convo.messages[0].senderId === user.id ? 'You: ' : ''}${convo.messages[0].content || 'Sent a file'}`
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
            )
          )
          }
        </div>
      </div>

      {/* Main Active Conversation Panel */}
      <div className={styles.chatWindow}>
        {activeConvo ? (
          <>
            {/* Header info & calling tools */}
            <div className={styles.windowHeader}>
              <div className={styles.headerLeft}>
                {/* Back button on mobile */}
                <button className={styles.backBtn} onClick={handleBackToSidebar} title="Back to Chats">
                  <ArrowLeft size={20} />
                </button>
                <img
                  src={getRecipientInfo(activeConvo)?.avatarUrl}
                  alt={getRecipientInfo(activeConvo)?.name}
                  className={styles.avatarSmall}
                />
                <div style={{ minWidth: 0 }}>
                  <div className={styles.userName}>{getRecipientInfo(activeConvo)?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {onlineUsers.has(getRecipientInfo(activeConvo)?.id) ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.actionBtn} onClick={() => handleCall('AUDIO')} title="Audio Call">
                  <Phone size={18} />
                </button>
                <button className={styles.actionBtn} onClick={() => handleCall('VIDEO')} title="Video Call">
                  <Video size={18} />
                </button>
              </div>
            </div>

            {/* Chat Area Scrollbox */}
            <div className={styles.messageArea} ref={messageAreaRef}>
              {messages.map((msg, index) => {
                const isSentByMe = msg.senderId === user.id;
                return (
                  <div key={msg.id || index} className={isSentByMe ? styles.msgSent : styles.msgReceived}>
                    <div className={styles.msgContent}>
                      {msg.fileUrl ? (
                        msg.fileType === 'IMAGE' ? (
                          <img src={msg.fileUrl} alt="Attachment" className={styles.attachmentImage} />
                        ) : (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', textDecoration: 'underline' }}
                          >
                            View Attachment File
                          </a>
                        )
                      ) : (
                        msg.content
                      )}
                    </div>
                    <div className={styles.msgInfo}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isRecipientTyping && (
                <div className={styles.msgReceived}>
                  <div className={styles.msgContent} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{getRecipientInfo(activeConvo)?.name} is typing</span>
                    <MoreHorizontal className="animate-pulse" size={16} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input drawer */}
            <div className={styles.inputPanel}>
              <label className={styles.fileInputLabel} title="Send File Attachment">
                <Paperclip size={18} />
                <input type="file" onChange={handleFileUpload} className={styles.fileInput} disabled={uploading} />
              </label>
              
              <input
                type="text"
                placeholder={uploading ? 'Uploading attachment...' : 'Type a message...'}
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className={styles.textInput}
                disabled={uploading}
              />

              <button className={styles.btnSend} onClick={handleSend} disabled={uploading}>
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.placeholder}>
            <MessageSquare size={48} strokeWidth={1} />
            <p>Select or start a conversation to begin messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
