'use client';
import React from 'react';
import { ArrowLeft, Phone, Video, Info } from 'lucide-react';

interface ChatHeaderProps {
  activeConvo: any;
  recipientName: string;
  recipientAvatarUrl: string;
  isOnline: boolean;
  showDetails: boolean;
  activeThemeColor: string;
  onBack: () => void;
  onAudioCall: () => void;
  onVideoCall: () => void;
  onToggleDetails: () => void;
}

export function ChatHeader({
  recipientName, recipientAvatarUrl, isOnline,
  showDetails, activeThemeColor,
  onBack, onAudioCall, onVideoCall, onToggleDetails,
}: ChatHeaderProps) {
  return (
    <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-between items-center h-[72px] shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer flex md:hidden items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors" onClick={onBack} title="Back to Chats">
          <ArrowLeft size={20} />
        </button>
        <img src={recipientAvatarUrl} alt={recipientName} className="w-8 h-8 rounded-full object-cover" />
        <div className="min-w-0 cursor-pointer" onClick={onToggleDetails}>
          <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{recipientName}</div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors" onClick={onAudioCall} title="Audio Call">
          <Phone size={18} />
        </button>
        <button className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors" onClick={onVideoCall} title="Video Call">
          <Video size={18} />
        </button>
        <button
          className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          onClick={onToggleDetails}
          title="Chat Details & Customization"
          style={showDetails ? { color: activeThemeColor, backgroundColor: 'var(--bg-tertiary)' } : undefined}
        >
          <Info size={18} />
        </button>
      </div>
    </div>
  );
}
