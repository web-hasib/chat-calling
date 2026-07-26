import { useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export function useTyping(activeConvo: any) {
  const { socket } = useSocket();
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const isTypingLocalRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (val: string, setInputText: (v: string) => void) => {
    setInputText(val);
    if (!socket || !activeConvo) return;

    if (!isTypingLocalRef.current) {
      isTypingLocalRef.current = true;
      socket.emit('typing', { conversationId: activeConvo.id, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      isTypingLocalRef.current = false;
      socket.emit('typing', { conversationId: activeConvo.id, isTyping: false });
    }, 1500);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingLocalRef.current && socket && activeConvo) {
      isTypingLocalRef.current = false;
      socket.emit('typing', { conversationId: activeConvo.id, isTyping: false });
    }
  };

  return {
    isRecipientTyping,
    setIsRecipientTyping,
    isTypingLocalRef,
    typingTimeoutRef,
    handleInputChange,
    stopTyping,
  };
}
