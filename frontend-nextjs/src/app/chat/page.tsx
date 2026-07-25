'use client';

import React, { useEffect, useState, useRef } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '../../components/ui/tooltip';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import styles from './chat.module.css';
import {
  Phone,
  Video,
  Send,
  Paperclip,
  MessageSquare,
  Users,
  Settings,
  Sun,
  Moon,
  LogOut,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Check,
  CheckCheck,
  Smile,
  Reply,
  ExternalLink,
  X,
  Loader2,
  Plus,
  Trash2,
  Info,
  Palette,
  Image as ImageIcon,
  Edit3,
  Sparkles,
  Upload,
  Copy,
  RotateCw,
  Pencil,
  Undo2,
  Eye,
  Download,
  Crop,
  Type,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const THEME_PRESETS = [
  { id: 'blue', color: '#2563eb', label: 'Slate Blue' },
  { id: 'indigo', color: '#4f46e5', label: 'Deep Indigo' },
  { id: 'emerald', color: '#059669', label: 'Emerald' },
  { id: 'teal', color: '#0d9488', label: 'Teal' },
  { id: 'charcoal', color: '#4b5563', label: 'Charcoal' },
  { id: 'rose', color: '#e11d48', label: 'Rose' },
  { id: 'amber', color: '#d97706', label: 'Amber' },
  { id: 'sky', color: '#0284c7', label: 'Sky' },
];

const BG_PRESETS = [
  { id: 'none', url: '', label: 'Default' },
  { id: 'galaxy', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80', label: 'Galaxy' },
  { id: 'abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', label: 'Abstract' },
  { id: 'cyberpunk', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', label: 'Neon City' },
  { id: 'minimal', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80', label: 'Dark Mesh' },
  { id: 'waves', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80', label: 'Silk Wave' },
];

const DEFAULT_EMOJI_PRESETS = ['👍', '❤️', '🔥', '😂', '⚡', '🎉', '💩', '💯', '👏', '🥳', '😍', '🚀'];

const compressImage = async (file: File, quality: number = 0.75, maxDimension: number = 1600): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
};

export default function ChatPage() {
  const { user, token, logout, loading, updateProfile } = useAuth();
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

  // Chat Details Sidebar / Mobile Overlay State
  const [showDetails, setShowDetails] = useState(false);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [showDefaultEmojiPickerPopover, setShowDefaultEmojiPickerPopover] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [customUploadedBgs, setCustomUploadedBgs] = useState<string[]>([]);

  // Settings dropdown state
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Typing status state
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const isTypingLocalRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Feature 2: Message Reply, Reaction & Selection State ---
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);
  const [activeCustomEmojiMsgId, setActiveCustomEmojiMsgId] = useState<string | null>(null);
  const [deleteConfirmMsgId, setDeleteConfirmMsgId] = useState<string | null>(null);
  const [reactionUpdatingMsgId, setReactionUpdatingMsgId] = useState<string | null>(null);

  const [isSwitchingThread, setIsSwitchingThread] = useState(false);
  const prevScrollHeightRef = useRef<number | null>(null);
  const [prependedMsgIds, setPrependedMsgIds] = useState<Set<string>>(new Set());
  const messageCacheRef = useRef<Record<string, { messages: any[]; hasMore: boolean; nextCursor: string | null }>>({});

  // WhatsApp Web Image Editor & Media Upload Preview Modal state
  const [pendingMediaItems, setPendingMediaItems] = useState<{ file: File; previewUrl: string }[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [mediaCaptions, setMediaCaptions] = useState<Record<number, string>>({});
  const [mediaFilters, setMediaFilters] = useState<Record<number, string>>({});
  const [mediaRotations, setMediaRotations] = useState<Record<number, number>>({});
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [drawColor, setDrawColor] = useState<string>('#ef4444');
  const [isViewOnce, setIsViewOnce] = useState<boolean>(false);
  const [showFilterPicker, setShowFilterPicker] = useState<boolean>(false);
  const [showMediaPreviewModal, setShowMediaPreviewModal] = useState<boolean>(false);
  const [sendingMedia, setSendingMedia] = useState<boolean>(false);
  const [qualityMode, setQualityMode] = useState<'standard' | 'hd'>('standard');

  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawMode || !drawCanvasRef.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    isDrawingRef.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !isDrawMode || !drawCanvasRef.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearDrawing = () => {
    if (!drawCanvasRef.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const messageAreaRef = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);
  const customReactionPickerRef = useRef<HTMLDivElement | null>(null);
  const deleteTooltipRef = useRef<HTMLDivElement | null>(null);
  const defaultEmojiPickerRef = useRef<HTMLDivElement | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        defaultEmojiPickerRef.current &&
        !defaultEmojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowDefaultEmojiPickerPopover(false);
      }
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target as Node)
      ) {
        setActiveReactionPickerId(null);
      }
      if (
        customReactionPickerRef.current &&
        !customReactionPickerRef.current.contains(event.target as Node)
      ) {
        setActiveCustomEmojiMsgId(null);
      }
      if (
        deleteTooltipRef.current &&
        !deleteTooltipRef.current.contains(event.target as Node)
      ) {
        setDeleteConfirmMsgId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setInputText((prev) => prev + emojiData.emoji);
    textInputRef.current?.focus();
  };

  // Conversations loading indicator
  const [conversationsLoading, setConversationsLoading] = useState(true);

  // --- Feature 3: Pagination / Infinite Scroll State ---
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Edit profile states & handlers
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
    setProfileSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(body.message || 'Upload failed');
      }

      const data = await res.json();
      setEditAvatarUrl(data.fileUrl);
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
      setTimeout(() => {
        setShowEditProfile(false);
      }, 1500);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileUpdating(false);
    }
  };

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
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
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

  // Scroll to bottom on initial message load or sending new messages
  const autoScrollBottomRef = useRef(true);
  useEffect(() => {
    if (autoScrollBottomRef.current && messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages, isRecipientTyping]);

  // Global socket listener for instant messaging updates
  useEffect(() => {
    if (!socket) return;

    socket.on('new-message-notification', (msg: any) => {
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

      if (activeConvo && activeConvo.id === msg.conversationId) {
        autoScrollBottomRef.current = true;
        setMessages((prevMessages) => {
          if (prevMessages.some((m) => m.id === msg.id)) return prevMessages;

          const optimisticIndex = prevMessages.findIndex((m) => m.id === 'pending' || m.id.startsWith('pending-'));
          if (optimisticIndex !== -1) {
            const updated = [...prevMessages];
            updated[optimisticIndex] = msg;
            return updated;
          }

          return [...prevMessages, msg];
        });

        socket.emit('mark-as-read', { conversationId: activeConvo.id });
      }
    });

    return () => {
      socket.off('new-message-notification');
    };
  }, [socket, activeConvo]);

  // --- Real-time Read Receipts & Reactions Socket Listeners ---
  useEffect(() => {
    if (!socket || !activeConvo) return;

    const readEvent = `messages-read-${activeConvo.id}`;
    const reactionEvent = `reaction-updated-${activeConvo.id}`;
    const deleteEvent = `message-deleted-${activeConvo.id}`;
    const convoUpdatedEvent = `conversation-updated-${activeConvo.id}`;

    socket.on(readEvent, (data: { conversationId: string; readerId: string }) => {
      if (data.readerId !== user?.id) {
        setMessages((prev) =>
          prev.map((msg) => (msg.senderId === user?.id ? { ...msg, isRead: true } : msg))
        );
      }
    });

    socket.on(reactionEvent, (data: { messageId: string; reactions: any[] }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg))
      );
      setReactionUpdatingMsgId((prevId) => (prevId === data.messageId ? null : prevId));
    });

    socket.on(deleteEvent, (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    });

    socket.on(convoUpdatedEvent, (data: { conversation: any }) => {
      if (data.conversation) {
        setActiveConvo(data.conversation);
        setConversations((prev) =>
          prev.map((c) => (c.id === data.conversation.id ? { ...c, ...data.conversation } : c))
        );
      }
    });

    return () => {
      socket.off(readEvent);
      socket.off(reactionEvent);
      socket.off(deleteEvent);
      socket.off(convoUpdatedEvent);
    };
  }, [socket, activeConvo, user]);

  useEffect(() => {
    if (!socket) return;
    const listUpdatedEvent = 'conversation-list-updated';
    socket.on(listUpdatedEvent, (data: { conversationId: string; conversation: any }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === data.conversationId ? { ...c, ...data.conversation } : c))
      );
    });
    return () => {
      socket.off(listUpdatedEvent);
    };
  }, [socket]);

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

  const handleInitiateReply = (msg: any) => {
    setReplyingTo(msg);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
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

  // Auto-sync active conversation messages into memory cache
  useEffect(() => {
    if (activeConvo?.id && messages) {
      messageCacheRef.current[activeConvo.id] = {
        messages,
        hasMore,
        nextCursor,
      };
    }
  }, [messages, activeConvo, hasMore, nextCursor]);

  const selectConvo = async (convo: any) => {
    setActiveConvo(convo);
    setViewMode('chat');
    setIsRecipientTyping(false);
    setReplyingTo(null);
    setActiveReactionPickerId(null);
    setActiveCustomEmojiMsgId(null);
    setDeleteConfirmMsgId(null);
    setShowDetails(false);
    autoScrollBottomRef.current = true;

    // Instant Cache Hydration
    const cached = messageCacheRef.current[convo.id];
    if (cached) {
      setMessages(cached.messages);
      setHasMore(cached.hasMore);
      setNextCursor(cached.nextCursor);
      setIsSwitchingThread(false);
    } else {
      setIsSwitchingThread(true);
      setMessages([]);
    }

    try {
      const res = await fetch(`${API_URL}/chat/conversation/${convo.id}/messages?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      let fetchedMsgs: any[] = [];
      let fetchedHasMore = false;
      let fetchedNextCursor: string | null = null;

      if (Array.isArray(data)) {
        fetchedMsgs = data;
      } else {
        fetchedMsgs = data.messages || [];
        fetchedHasMore = data.hasMore || false;
        fetchedNextCursor = data.nextCursor || null;
      }

      // Sync into memory cache
      messageCacheRef.current[convo.id] = {
        messages: fetchedMsgs,
        hasMore: fetchedHasMore,
        nextCursor: fetchedNextCursor,
      };

      setMessages(fetchedMsgs);
      setHasMore(fetchedHasMore);
      setNextCursor(fetchedNextCursor);

      if (socket) {
        socket.emit('mark-as-read', { conversationId: convo.id });
      }
      fetch(`${API_URL}/chat/conversation/${convo.id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch (e) {
      console.error('Error fetching messages', e);
    } finally {
      setIsSwitchingThread(false);
    }
  };

  // --- Feature 3: Pagination / Infinite Scroll Handler ---
  const loadMoreMessages = async () => {
    if (!activeConvo || !hasMore || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    autoScrollBottomRef.current = false;

    const container = messageAreaRef.current;
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight;
    }

    try {
      const res = await fetch(`${API_URL}/chat/conversation/${activeConvo.id}/messages?limit=20&cursor=${nextCursor}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      const newMsgs = Array.isArray(data) ? data : data.messages || [];
      const newNextCursor = Array.isArray(data) ? null : data.nextCursor;
      const newHasMore = Array.isArray(data) ? false : data.hasMore;

      // Track newly prepended message IDs for subtle fade-in
      const prependedIds = new Set<string>(newMsgs.map((m: any) => String(m.id)));
      setPrependedMsgIds(prependedIds);

      setMessages((prev) => [...newMsgs, ...prev]);
      setNextCursor(newNextCursor);
      setHasMore(newHasMore);

      requestAnimationFrame(() => {
        if (container && prevScrollHeightRef.current !== null) {
          container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
          prevScrollHeightRef.current = null;
        }
      });
    } catch (e) {
      console.error('Error loading older messages', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScrollMessages = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop < 40 && hasMore && !loadingMore && nextCursor) {
      loadMoreMessages();
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

  // --- Toggle Emoji Reaction ---
  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!socket || !activeConvo) return;
    setReactionUpdatingMsgId(messageId);
    socket.emit('toggle-reaction', {
      conversationId: activeConvo.id,
      messageId,
      emoji,
    });
    setActiveReactionPickerId(null);
    setActiveCustomEmojiMsgId(null);
    setTimeout(() => {
      setReactionUpdatingMsgId((prevId) => (prevId === messageId ? null : prevId));
    }, 3000);
  };

  const confirmDeleteMessage = (targetMsgId: string) => {
    if (!targetMsgId || !socket || !activeConvo) return;
    socket.emit('delete-message', {
      messageId: targetMsgId,
      conversationId: activeConvo.id,
    });
    setMessages((prev) => prev.filter((m) => m.id !== targetMsgId));
    setDeleteConfirmMsgId(null);
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeConvo || !socket || !user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isTypingLocalRef.current = false;
    socket.emit('typing', { conversationId: activeConvo.id, isTyping: false });
    autoScrollBottomRef.current = true;

    const optimisticMsg = {
      id: 'pending-' + Date.now(),
      content: inputText,
      senderId: user.id,
      conversationId: activeConvo.id,
      createdAt: new Date().toISOString(),
      isRead: false,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            fileUrl: replyingTo.fileUrl,
            fileType: replyingTo.fileType,
            sender: {
              id: replyingTo.senderId,
              name: replyingTo.sender?.name || 'User',
            },
          }
        : null,
      sender: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
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
      replyToId: replyingTo ? replyingTo.id : undefined,
    });

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  // Messenger-style quick default emoji send button handler
  const handleSendDefaultEmoji = () => {
    const emojiToSend = activeConvo?.defaultEmoji || '👍';
    if (!activeConvo || !socket || !user) return;

    autoScrollBottomRef.current = true;

    const optimisticMsg = {
      id: 'pending-' + Date.now(),
      content: emojiToSend,
      senderId: user.id,
      conversationId: activeConvo.id,
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
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
      content: emojiToSend,
    });
  };

  const isCanvasBlank = (canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    return !pixelBuffer.some((color) => color !== 0);
  };

  const synthesizeEditedMedia = async (
    item: { file: File; previewUrl: string },
    filter: string,
    rotation: number,
    drawingCanvas: HTMLCanvasElement | null
  ): Promise<File> => {
    if (!item.file.type.startsWith('image/')) return item.file;
    const hasDrawing = drawingCanvas && !isCanvasBlank(drawingCanvas);
    if (filter === 'none' && rotation === 0 && !hasDrawing) {
      return item.file;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        const isRotatedQuarter = rotation === 90 || rotation === 270;
        const canvas = document.createElement('canvas');
        canvas.width = isRotatedQuarter ? height : width;
        canvas.height = isRotatedQuarter ? width : height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(item.file);

        if (filter === 'grayscale') ctx.filter = 'grayscale(100%)';
        else if (filter === 'sepia') ctx.filter = 'sepia(100%)';
        else if (filter === 'warm') ctx.filter = 'sepia(50%) contrast(110%) brightness(105%)';
        else if (filter === 'cool') ctx.filter = 'hue-rotate(180deg) saturate(120%)';
        else if (filter === 'invert') ctx.filter = 'invert(100%)';

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
        ctx.filter = 'none';

        if (hasDrawing && drawingCanvas) {
          ctx.drawImage(drawingCanvas, 0, 0, canvas.width, canvas.height);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(item.file);
            const editedFile = new File([blob], item.file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(editedFile);
          },
          'image/jpeg',
          0.92
        );
      };
      img.onerror = () => resolve(item.file);
      img.src = item.previewUrl;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeConvo) return;

    const newItems = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingMediaItems((prev) => [...prev, ...newItems]);
    setShowMediaPreviewModal(true);
    e.target.value = '';
  };

  const handleRemoveThumbnail = (indexToRemove: number) => {
    setPendingMediaItems((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length === 0) {
        setShowMediaPreviewModal(false);
      }
      return updated;
    });
    if (activeMediaIndex >= indexToRemove && activeMediaIndex > 0) {
      setActiveMediaIndex((prev) => prev - 1);
    }
  };

  const handleCancelMediaPreview = () => {
    pendingMediaItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setPendingMediaItems([]);
    setActiveMediaIndex(0);
    setMediaCaptions({});
    setMediaFilters({});
    setMediaRotations({});
    setIsDrawMode(false);
    setShowFilterPicker(false);
    setShowMediaPreviewModal(false);
  };

  const handleSendMediaWithCaption = async () => {
    if (!pendingMediaItems.length || !activeConvo || !socket || sendingMedia) return;
    setSendingMedia(true);
    autoScrollBottomRef.current = true;

    try {
      for (let i = 0; i < pendingMediaItems.length; i++) {
        const item = pendingMediaItems[i];
        const filter = mediaFilters[i] || 'none';
        const rotation = mediaRotations[i] || 0;
        const caption = mediaCaptions[i] || '';

        let editedFile = await synthesizeEditedMedia(
          item,
          filter,
          rotation,
          i === activeMediaIndex ? drawCanvasRef.current : null
        );

        if (qualityMode === 'standard' && editedFile.type.startsWith('image/')) {
          editedFile = await compressImage(editedFile, 0.75, 1600);
        }

        const formData = new FormData();
        formData.append('file', editedFile);

        const res = await fetch(`${API_URL}/chat/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();

        socket.emit('send-message', {
          conversationId: activeConvo.id,
          content: caption.trim() || undefined,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          isViewOnce: isViewOnce || undefined,
          replyToId: replyingTo ? replyingTo.id : undefined,
        });
      }

      setReplyingTo(null);
      handleCancelMediaPreview();
    } catch (err) {
      console.error(err);
      alert('File upload failed. Ensure storage keys are valid.');
    } finally {
      setSendingMedia(false);
    }
  };

  // --- Real-time Settings Updates ---
  const updateChatSettings = (data: {
    themeColor?: string;
    themeGradient?: string;
    bgImage?: string;
    defaultEmoji?: string;
    nicknameTargetUserId?: string;
    nickname?: string;
  }) => {
    if (!activeConvo || !socket) return;

    setActiveConvo((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      if (data.nicknameTargetUserId !== undefined) {
        updated.participants = prev.participants?.map((p: any) =>
          p.userId === data.nicknameTargetUserId ? { ...p, nickname: data.nickname || null } : p
        );
      }
      return updated;
    });

    socket.emit('update-conversation-settings', {
      conversationId: activeConvo.id,
      ...data,
    });
  };

  // Background image upload in chat details
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
      const uploadedUrl = data.fileUrl;
      updateChatSettings({ bgImage: uploadedUrl });
      setCustomUploadedBgs((prev) => Array.from(new Set([uploadedUrl, ...prev])));
    } catch (err) {
      alert('Failed to upload background image.');
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleDeleteCustomBg = (bgUrl: string) => {
    setCustomUploadedBgs((prev) => prev.filter((url) => url !== bgUrl));
    if (activeConvo?.bgImage === bgUrl) {
      updateChatSettings({ bgImage: '' });
    }
  };

  // Save nickname helper
  const handleSaveNickname = (targetUserId: string) => {
    updateChatSettings({
      nicknameTargetUserId: targetUserId,
      nickname: nicknameInput.trim(),
    });
    setEditingParticipantId(null);
    setNicknameInput('');
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
    setShowDetails(false);
  };

  const getGroupedReactions = (reactions?: any[]) => {
    if (!reactions || reactions.length === 0) return [];
    const map = new Map<string, { emoji: string; count: number; userReacted: boolean }>();
    reactions.forEach((r) => {
      const existing = map.get(r.emoji);
      const isMine = r.userId === user?.id;
      if (existing) {
        existing.count += 1;
        if (isMine) existing.userReacted = true;
      } else {
        map.set(r.emoji, { emoji: r.emoji, count: 1, userReacted: isMine });
      }
    });
    return Array.from(map.values());
  };

  const getRecipientParticipant = (convo: any) => {
    return convo?.participants?.find((p: any) => p.userId !== user?.id);
  };

  const getRecipientInfo = (convo: any) => {
    const p = getRecipientParticipant(convo);
    return p?.user;
  };

  const getRecipientDisplayName = (convo: any) => {
    const p = getRecipientParticipant(convo);
    if (!p) return 'User';
    return p.nickname || p.user?.name || p.user?.username || 'User';
  };

  // Skeleton Loading Page Override
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

  // Active chat custom theme styling
  const activeThemeColor = activeConvo?.themeColor || '#0084FF';
  const activeThemeGradient = activeConvo?.themeGradient;
  const activeBgImage = activeConvo?.bgImage;
  const activeDefaultEmoji = activeConvo?.defaultEmoji || '👍';

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
              title="Settings & Theme"
            >
              <Settings size={18} />
            </button>

            {/* Settings Dropdown */}
            {showSettings && (
              <>
                <div className={styles.settingsOverlay} onClick={() => setShowSettings(false)} />
                <div className={styles.settingsDropdown}>
                  <div className={styles.settingsSection}>
                    <span className={styles.settingsLabel}>App Theme</span>
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
                    <button className={styles.logoutOption} onClick={openEditProfile} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', marginBottom: '8px' }}>
                      <span>Edit Profile</span>
                      <Users size={14} />
                    </button>
                    <button className={styles.logoutOption} onClick={logout}>
                      <span>Log Out</span>
                      <LogOut size={14} />
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
          )}
        </div>
      </div>

      {/* Main Active Conversation Panel */}
      <div className={styles.chatWindow}>
        {activeConvo ? (
          <>
            {/* Header info & tools */}
            <div className={styles.windowHeader}>
              <div className={styles.headerLeft}>
                <button className={styles.backBtn} onClick={handleBackToSidebar} title="Back to Chats">
                  <ArrowLeft size={20} />
                </button>
                <img
                  src={getRecipientInfo(activeConvo)?.avatarUrl}
                  alt={getRecipientDisplayName(activeConvo)}
                  className={styles.avatarSmall}
                />
                <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={() => setShowDetails(!showDetails)}>
                  <div className={styles.userName}>{getRecipientDisplayName(activeConvo)}</div>
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
                <button 
                  className={styles.actionBtn} 
                  onClick={() => setShowDetails(!showDetails)} 
                  title="Chat Details & Customization"
                  style={showDetails ? { color: activeThemeColor, backgroundColor: 'var(--bg-tertiary)' } : undefined}
                >
                  <Info size={18} />
                </button>
              </div>
            </div>

            {/* Main Chat Body Container Area (Row: Main Column + Side Panel) */}
            <div className={styles.chatBodyRow}>
              {/* Left Column: Messages, Reply Drawer & Input Panel */}
              <div className={styles.chatMainColumn}>
                {/* Chat Area Scrollbox */}
                <div
                  className={`${styles.messageArea} ${activeBgImage ? styles.messageAreaCustomBg : ''}`}
                  style={activeBgImage ? { backgroundImage: `url(${activeBgImage})` } : undefined}
                  ref={messageAreaRef}
                  onScroll={handleScrollMessages}
                >
                  {/* Feature 3: Pagination Load More Header */}
                  {hasMore && (
                    <div className={styles.loadMoreContainer}>
                      <button className={styles.loadMoreBtn} onClick={loadMoreMessages} disabled={loadingMore}>
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
                            <div className={styles.systemMessagePill}>
                              {msg.content}
                            </div>
                          </div>
                        );
                      }

                      const isSentByMe = msg.senderId === user.id;
                      const groupedReactions = getGroupedReactions(msg.reactions);
                      const isPrepended = prependedMsgIds.has(msg.id);

                      return (
                        <div
                          key={msg.id || index}
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
                            onClick={() =>
                              setActiveReactionPickerId(activeReactionPickerId === msg.id ? null : msg.id)
                            }
                            title="React with Emoji"
                          >
                            <Smile size={14} />
                          </button>
                          <button
                            className={styles.actionIconBtn}
                            onClick={() => handleInitiateReply(msg)}
                            title="Reply to Message"
                          >
                            <Reply size={14} />
                          </button>
                          {isSentByMe && (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip
                                open={deleteConfirmMsgId === msg.id}
                                onOpenChange={(open) => !open && setDeleteConfirmMsgId(null)}
                              >
                                <TooltipTrigger asChild>
                                  <button
                                    className={styles.actionIconBtnDanger}
                                    onClick={() =>
                                      setDeleteConfirmMsgId(
                                        deleteConfirmMsgId === msg.id ? null : msg.id
                                      )
                                    }
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
                                      confirmDeleteMessage(msg.id);
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDeleteMessage(msg.id);
                                    }}
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.deleteTooltipCancelBtn}
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmMsgId(null);
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmMsgId(null);
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
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              className={styles.reactionOptionPlus}
                              onClick={() => {
                                setActiveReactionPickerId(null);
                                setActiveCustomEmojiMsgId(msg.id);
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
                              onEmojiClick={(emojiData) => handleToggleReaction(msg.id, emojiData.emoji)}
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
                            <div className={styles.quotedReplyBox}>
                              <div className={styles.quotedSender}>
                                Replying to {msg.replyTo.sender?.name || 'Message'}
                              </div>
                              <div className={styles.quotedContent}>
                                {msg.replyTo.content || (msg.replyTo.fileUrl ? 'Attachment File' : '')}
                              </div>
                            </div>
                          )}

                            {msg.fileUrl ? (
                              msg.fileType === 'IMAGE' ? (
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
                                  <img
                                    src={msg.fileUrl}
                                    alt="Attachment"
                                    className={styles.attachmentImage}
                                    onClick={() => window.open(msg.fileUrl, '_blank')}
                                  />
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
                                  <a
                                    href={msg.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'inherit', textDecoration: 'underline' }}
                                  >
                                    View Attachment File
                                  </a>
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
                                onClick={() => handleToggleReaction(msg.id, r.emoji)}
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
                  })
                )}

                  {/* Typing Indicator */}
                  {isRecipientTyping && (
                    <div className={styles.msgReceived}>
                      <div className={styles.msgContent} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{getRecipientDisplayName(activeConvo)} is typing</span>
                        <MoreHorizontal className="animate-pulse" size={16} style={{ color: activeThemeColor }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Feature 2: Reply Drawer Banner above Input Drawer */}
                {replyingTo && (
                  <div className={styles.replyDrawer} style={{ borderLeftColor: activeThemeColor }}>
                    <div className={styles.replyDrawerText}>
                      <span className={styles.replyDrawerSender} style={{ color: activeThemeColor }}>
                        Replying to {replyingTo.sender?.name || 'Message'}
                      </span>
                      <span className={styles.replyDrawerContent}>
                        {replyingTo.content || (replyingTo.fileUrl ? 'Attachment File' : '')}
                      </span>
                    </div>
                    <button className={styles.replyDrawerClose} onClick={() => setReplyingTo(null)}>
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Chat Input Panel */}
                <div className={styles.inputPanel}>
                  {/* Full Emoji Picker Popover */}
                  {showEmojiPicker && (
                    <div className={styles.emojiPickerPopover} ref={emojiPickerRef}>
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                        searchDisabled={false}
                        width={340}
                        height={400}
                      />
                    </div>
                  )}

                  <label className={styles.fileInputLabel} title="Send File Attachment">
                    <Paperclip size={18} />
                    <input type="file" onChange={handleFileSelect} className={styles.fileInput} disabled={sendingMedia} />
                  </label>

                  <div className={styles.inputWrapper}>
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
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className={styles.textInput}
                      disabled={uploading}
                    />
                    <button
                      type="button"
                      className={styles.emojiBtn}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Choose an Emoji"
                    >
                      <Smile size={20} />
                    </button>
                  </div>

                  {inputText.trim() ? (
                    <button
                      className={styles.btnSend}
                      onClick={handleSend}
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
                      className={styles.btnQuickEmoji}
                      onClick={handleSendDefaultEmoji}
                      title={`Send Quick Emoji (${activeDefaultEmoji})`}
                    >
                      {activeDefaultEmoji}
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp Web Image Editor & Media Upload Preview Modal */}
              {showMediaPreviewModal && pendingMediaItems.length > 0 && (
                <div className={styles.mediaPreviewOverlay}>
                  {/* Top Bar (Close, Title, Editor Toolbar Tools) */}
                  <div className={styles.mediaPreviewHeader}>
                    <div className={styles.mediaPreviewHeaderLeft}>
                      <button className={styles.mediaPreviewCloseBtn} onClick={handleCancelMediaPreview} title="Cancel">
                        <X size={22} />
                      </button>
                      <span className={styles.mediaPreviewTitle}>
                        {pendingMediaItems[activeMediaIndex]?.file.type.startsWith('image/')
                          ? `Image ${activeMediaIndex + 1} of ${pendingMediaItems.length}`
                          : 'Document Preview'}
                      </span>
                    </div>

                    {/* WhatsApp Web Toolbar Tools */}
                    {pendingMediaItems[activeMediaIndex]?.file.type.startsWith('image/') && (
                      <div className={styles.editorToolbarCenter}>
                        {/* Crop / Rotate Tool */}
                        <button
                          type="button"
                          className={styles.editorToolBtn}
                          onClick={() => {
                            setMediaRotations((prev) => ({
                              ...prev,
                              [activeMediaIndex]: ((prev[activeMediaIndex] || 0) + 90) % 360,
                            }));
                          }}
                          title="Rotate Image 90°"
                        >
                          <RotateCw size={18} />
                        </button>

                        {/* Magic Wand Filters Tool */}
                        <button
                          type="button"
                          className={showFilterPicker ? styles.editorToolBtnActive : styles.editorToolBtn}
                          onClick={() => {
                            setShowFilterPicker((prev) => !prev);
                            setIsDrawMode(false);
                          }}
                          title="Image Filters"
                        >
                          <Sparkles size={18} />
                        </button>

                        {/* Freehand Pencil Draw Tool */}
                        <button
                          type="button"
                          className={isDrawMode ? styles.editorToolBtnActive : styles.editorToolBtn}
                          onClick={() => {
                            setIsDrawMode((prev) => !prev);
                            setShowFilterPicker(false);
                          }}
                          title="Freehand Pencil Draw"
                        >
                          <Pencil size={18} />
                        </button>

                        {/* Clear Canvas */}
                        {isDrawMode && (
                          <button type="button" className={styles.editorToolBtn} onClick={clearDrawing} title="Clear Drawings">
                            <Undo2 size={18} />
                          </button>
                        )}

                        {/* HD Quality Toggle */}
                        <button
                          type="button"
                          className={qualityMode === 'hd' ? styles.hdToggleActive : styles.hdToggle}
                          onClick={() => setQualityMode((prev) => (prev === 'standard' ? 'hd' : 'standard'))}
                          title={
                            qualityMode === 'hd'
                              ? 'HD Quality (Original size, no compression)'
                              : 'Standard Quality (Frontend compression applied)'
                          }
                        >
                          <span className={styles.hdBadgeText}>HD</span>
                          <span className={styles.hdStatusLabel}>{qualityMode === 'hd' ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Color Swatches Popover for Pencil Mode */}
                  {isDrawMode && (
                    <div className={styles.colorBarPopover}>
                      {['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff', '#000000'].map((col) => (
                        <div
                          key={col}
                          className={drawColor === col ? styles.colorSwatchActive : styles.colorSwatch}
                          style={{ backgroundColor: col }}
                          onClick={() => setDrawColor(col)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Filter Selector Cards Popover */}
                  {showFilterPicker && (
                    <div className={styles.filterBarPopover}>
                      {[
                        { id: 'none', label: 'Normal' },
                        { id: 'grayscale', label: 'B&W' },
                        { id: 'sepia', label: 'Vintage' },
                        { id: 'warm', label: 'Warm' },
                        { id: 'cool', label: 'Cool' },
                        { id: 'invert', label: 'Invert' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={
                            (mediaFilters[activeMediaIndex] || 'none') === f.id
                              ? styles.filterCardActive
                              : styles.filterCard
                          }
                          onClick={() => {
                            setMediaFilters((prev) => ({ ...prev, [activeMediaIndex]: f.id }));
                          }}
                        >
                          <span>{f.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main Media Preview Canvas Area */}
                  <div className={styles.mediaPreviewBody}>
                    {pendingMediaItems[activeMediaIndex]?.file.type.startsWith('image/') ? (
                      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '90%', maxHeight: '65vh' }}>
                        <img
                          src={pendingMediaItems[activeMediaIndex]?.previewUrl}
                          alt="Media Preview"
                          className={styles.mediaPreviewImage}
                          style={{
                            transform: `rotate(${mediaRotations[activeMediaIndex] || 0}deg)`,
                            filter:
                              (mediaFilters[activeMediaIndex] || 'none') === 'grayscale'
                                ? 'grayscale(100%)'
                                : (mediaFilters[activeMediaIndex] || 'none') === 'sepia'
                                ? 'sepia(100%)'
                                : (mediaFilters[activeMediaIndex] || 'none') === 'warm'
                                ? 'sepia(50%) contrast(110%) brightness(105%)'
                                : (mediaFilters[activeMediaIndex] || 'none') === 'cool'
                                ? 'hue-rotate(180deg) saturate(120%)'
                                : (mediaFilters[activeMediaIndex] || 'none') === 'invert'
                                ? 'invert(100%)'
                                : 'none',
                            transition: 'transform 0.25s ease, filter 0.25s ease',
                          }}
                        />
                        {/* Interactive Freehand Draw Canvas */}
                        <canvas
                          ref={drawCanvasRef}
                          width={640}
                          height={480}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            cursor: isDrawMode ? 'crosshair' : 'default',
                            pointerEvents: isDrawMode ? 'auto' : 'none',
                          }}
                        />
                      </div>
                    ) : (
                      <div className={styles.mediaPreviewDocBox}>
                        <Paperclip size={48} className={styles.mediaPreviewDocIcon} />
                        <span className={styles.mediaPreviewDocName}>{pendingMediaItems[activeMediaIndex]?.file.name}</span>
                        <span className={styles.mediaPreviewDocSize}>
                          {(pendingMediaItems[activeMediaIndex]?.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer with Caption Input, View-Once & Multi-Image Thumbnail Tray */}
                  <div className={styles.mediaPreviewFooterColumn}>
                    {/* Caption Input & View-Once Row */}
                    <div className={styles.mediaPreviewInputWrapper}>
                      <input
                        type="text"
                        placeholder="Add a caption..."
                        value={mediaCaptions[activeMediaIndex] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMediaCaptions((prev) => ({ ...prev, [activeMediaIndex]: val }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMediaWithCaption();
                          }
                        }}
                        className={styles.mediaPreviewInput}
                        autoFocus
                      />

                      {/* View-Once Toggle Button ① */}
                      <button
                        type="button"
                        className={isViewOnce ? styles.viewOnceBtnActive : styles.viewOnceBtn}
                        onClick={() => setIsViewOnce((prev) => !prev)}
                        title={isViewOnce ? 'View Once Enabled' : 'Enable View Once'}
                      >
                        ①
                      </button>

                      {/* Floating Send Button */}
                      <button
                        className={styles.mediaPreviewSendBtn}
                        onClick={handleSendMediaWithCaption}
                        disabled={sendingMedia}
                        style={activeThemeColor ? { background: activeThemeColor } : undefined}
                        title="Send message"
                      >
                        {sendingMedia ? <Loader2 className={styles.spinLoader} size={18} /> : <Send size={18} />}
                      </button>
                    </div>

                    {/* Multi-Image Thumbnail Carousel Tray */}
                    <div className={styles.thumbnailTray}>
                      {pendingMediaItems.map((item, idx) => (
                        <div
                          key={idx}
                          className={idx === activeMediaIndex ? styles.thumbnailItemActive : styles.thumbnailItem}
                          onClick={() => {
                            setActiveMediaIndex(idx);
                            setIsDrawMode(false);
                            setShowFilterPicker(false);
                          }}
                        >
                          {item.file.type.startsWith('image/') ? (
                            <img src={item.previewUrl} alt={`Thumb ${idx}`} className={styles.thumbnailImage} />
                          ) : (
                            <Paperclip size={24} style={{ margin: 'auto' }} />
                          )}
                          <button
                            type="button"
                            className={styles.thumbnailRemoveBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveThumbnail(idx);
                            }}
                            title="Remove media"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* Add More Media (+) Button */}
                      <label className={styles.thumbnailAddBtn} title="Add more photos or files">
                        <Plus size={22} />
                        <input
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Right Column: Desktop Sidebar / Mobile Overlay Chat Details */}
              {showDetails && (
                <div className={`${styles.detailsSidebar} ${styles.detailsSidebarMobile}`}>
                  <div className={styles.detailsHeader}>
                    <h3 className={styles.detailsTitle}>Chat Details</h3>
                    <button className={styles.actionBtn} onClick={() => setShowDetails(false)}>
                      <X size={18} />
                    </button>
                  </div>

                  <div className={styles.detailsContent}>
                    {/* Participant Profile Card */}
                    {(() => {
                      const recipient = getRecipientInfo(activeConvo);
                      const isOnline = recipient ? onlineUsers.has(recipient.id) : false;
                      const handleName = recipient?.username || recipient?.email?.split('@')[0] || recipient?.name?.toLowerCase().replace(/\s+/g, '') || 'user';
                      return (
                        <div className={styles.detailsProfileCard}>
                          <img
                            src={recipient?.avatarUrl}
                            alt={getRecipientDisplayName(activeConvo)}
                            className={styles.detailsAvatar}
                            style={{ borderColor: activeThemeColor }}
                          />
                          <div>
                            <div className={styles.detailsName}>{getRecipientDisplayName(activeConvo)}</div>
                            <div className={styles.handleContainer}>
                              <span className={styles.handleText}>@{handleName}</span>
                              <button
                                className={styles.copyHandleBtn}
                                onClick={() => {
                                  navigator.clipboard.writeText(`@${handleName}`);
                                  setCopiedHandle(true);
                                  setTimeout(() => setCopiedHandle(false), 1500);
                                }}
                                title="Copy handle"
                              >
                                {copiedHandle ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                              </button>
                              <span className={styles.statusDot}>•</span>
                              <span className={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Nicknames Section */}
                    <div className={styles.detailsSection}>
                      <div className={styles.detailsSectionTitle}>Nicknames</div>
                      {activeConvo.participants?.map((p: any) => {
                        const isEditing = editingParticipantId === p.userId;
                        return (
                          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {p.nickname || p.user?.name || p.user?.username}
                                </span>
                                {p.nickname && (
                                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                    ({p.user?.name})
                                  </span>
                                )}
                              </div>
                              <button
                                className={styles.actionIconBtn}
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingParticipantId(null);
                                  } else {
                                    setEditingParticipantId(p.userId);
                                    setNicknameInput(p.nickname || '');
                                  }
                                }}
                                title="Edit Nickname"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>

                            {isEditing && (
                              <div className={styles.nicknameRow}>
                                <input
                                  type="text"
                                  placeholder="Enter nickname..."
                                  value={nicknameInput}
                                  onChange={(e) => setNicknameInput(e.target.value)}
                                  className={styles.nicknameInput}
                                />
                                <button
                                  className={styles.nicknameSaveBtn}
                                  onClick={() => handleSaveNickname(p.userId)}
                                  style={{ background: activeThemeColor }}
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Theme Colors Section */}
                    <div className={styles.detailsSection}>
                      <div className={styles.detailsSectionTitle}>Chat Theme</div>
                      <div className={styles.colorGrid}>
                        {THEME_PRESETS.map((preset) => {
                          const isActive = activeConvo.themeColor === preset.color;
                          return (
                            <button
                              key={preset.id}
                              className={`${styles.colorOptionBtn} ${isActive ? styles.colorOptionActive : ''}`}
                              style={{ backgroundColor: preset.color }}
                              onClick={() => updateChatSettings({ themeColor: preset.color, themeGradient: '' })}
                              title={preset.label}
                            >
                              {isActive && <Check size={16} color="white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Default Emoji Section */}
                    <div className={styles.detailsSection}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className={styles.detailsSectionTitle}>Quick Emoji</div>
                        <span style={{ fontSize: '18px' }}>{activeDefaultEmoji}</span>
                      </div>
                      <div className={styles.emojiGrid}>
                        {DEFAULT_EMOJI_PRESETS.map((emoji) => {
                          const isActive = activeDefaultEmoji === emoji;
                          return (
                            <button
                              key={emoji}
                              className={`${styles.emojiPresetBtn} ${isActive ? styles.emojiPresetActive : ''}`}
                              onClick={() => updateChatSettings({ defaultEmoji: emoji })}
                              style={isActive ? { background: activeThemeColor } : undefined}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <button
                          className={styles.bgUploadBtn}
                          onClick={() => setShowDefaultEmojiPickerPopover(!showDefaultEmojiPickerPopover)}
                        >
                          <Sparkles size={14} />
                          <span>Choose Custom Emoji</span>
                        </button>
                        {showDefaultEmojiPickerPopover && (
                          <div className={styles.detailsEmojiPickerPopover} ref={defaultEmojiPickerRef}>
                            <EmojiPicker
                              onEmojiClick={(emojiData) => {
                                updateChatSettings({ defaultEmoji: emojiData.emoji });
                                setShowDefaultEmojiPickerPopover(false);
                              }}
                              theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                              searchDisabled={false}
                              width="100%"
                              height={320}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Background Image Section */}
                    <div className={styles.detailsSection}>
                      <div className={styles.detailsSectionTitle}>Background Wallpaper</div>
                      <div className={styles.bgPresetGrid}>
                        {BG_PRESETS.map((bg) => {
                          const isActive = (activeBgImage || '') === bg.url;
                          const hasImage = Boolean(bg.url);
                          return (
                            <div
                              key={bg.id}
                              className={`${styles.bgPresetItem} ${hasImage ? styles.bgPresetItemHasImage : ''} ${isActive ? styles.bgPresetActive : ''}`}
                              style={{
                                backgroundImage: hasImage ? `url(${bg.url})` : 'none',
                                backgroundColor: hasImage ? undefined : 'var(--bg-tertiary)',
                                borderColor: isActive ? activeThemeColor : undefined,
                              }}
                              onClick={() => updateChatSettings({ bgImage: bg.url })}
                            >
                              <span className={styles.bgPresetItemText}>{bg.label}</span>
                            </div>
                          );
                        })}
                      </div>

                      <label className={styles.bgUploadBtn}>
                        <Upload size={14} />
                        <span>{isUploadingBg ? 'Uploading Image...' : 'Upload Background Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBgUpload}
                          style={{ display: 'none' }}
                          disabled={isUploadingBg}
                        />
                      </label>

                      {/* Uploaded / Custom Background Images Preview List */}
                      {customUploadedBgs.length > 0 && (
                        <div className={styles.customBgList}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Uploaded Wallpapers
                          </div>
                          {customUploadedBgs.map((url, idx) => {
                            const isActive = activeBgImage === url;
                            return (
                              <div
                                key={idx}
                                className={styles.customBgItem}
                                style={isActive ? { borderColor: activeThemeColor } : undefined}
                              >
                                <div
                                  className={styles.customBgItemInfo}
                                  onClick={() => updateChatSettings({ bgImage: url })}
                                  style={{ cursor: 'pointer', flex: 1 }}
                                >
                                  <img src={url} alt="Custom Background" className={styles.customBgThumb} />
                                  <span className={styles.customBgLabel}>
                                    {isActive ? 'Active Custom Image' : `Uploaded Wallpaper ${idx + 1}`}
                                  </span>
                                </div>
                                <button
                                  className={styles.actionIconBtnDanger}
                                  onClick={() => handleDeleteCustomBg(url)}
                                  title="Delete uploaded image"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Clear Background Image / Reset to Default Button */}
                      {Boolean(activeBgImage) && (
                        <button
                          className={styles.clearBgBtn}
                          onClick={() => updateChatSettings({ bgImage: '' })}
                        >
                          <X size={14} />
                          <span>Clear Wallpaper (Use Default)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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

      {showEditProfile && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Profile</h3>
              <button className={styles.modalClose} onClick={() => setShowEditProfile(false)}>✕</button>
            </div>

            <div className={styles.profileAvatarSection}>
              <label className={styles.avatarEditContainer}>
                <img 
                  src={editAvatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${editUsername || 'default'}`} 
                  alt="Avatar Preview" 
                  className={styles.avatarEditImage} 
                />
                <div className={styles.avatarUploadOverlay}>
                  <span>{uploadingAvatar ? 'Uploading...' : 'Change Photo'}</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  className={styles.avatarUploadInput} 
                  disabled={uploadingAvatar}
                />
              </label>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Accepts JPG, PNG, GIF. Uploads to secure hosting.
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className={styles.modalForm}>
              {profileError && (
                <div className={`${styles.profileFeedback} ${styles.profileError}`}>
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className={`${styles.profileFeedback} ${styles.profileSuccess}`}>
                  Profile updated successfully!
                </div>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.label}>Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={styles.input}
                  required
                  disabled={profileUpdating}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className={styles.input}
                  pattern="^[a-zA-Z0-9_]{3,15}$"
                  title="Username must be 3-15 alphanumeric characters or underscores"
                  required
                  disabled={profileUpdating}
                />
              </div>

              <div className={styles.modalBtnGroup}>
                <button 
                  type="button" 
                  className={styles.btnCancel} 
                  onClick={() => setShowEditProfile(false)}
                  disabled={profileUpdating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.btnSave} 
                  disabled={profileUpdating || uploadingAvatar}
                >
                  {profileUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
