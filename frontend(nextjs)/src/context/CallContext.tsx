'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

interface ActiveCall {
  role: 'caller' | 'receiver';
  type: 'AUDIO' | 'VIDEO';
  peerId: string;
  peerName?: string;
  peerAvatar?: string;
  conversationId: string;
  status: 'idle' | 'ringing' | 'connecting' | 'connected';
}

interface CallContextType {
  activeCall: ActiveCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  isMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  startCall: (targetUserId: string, targetName: string, targetAvatar: string, type: 'AUDIO' | 'VIDEO', conversationId: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const iceConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const incomingOfferRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  // Set up socket signaling listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('incoming-call', (data: { from: string; offer: any; type: 'AUDIO' | 'VIDEO'; conversationId: string }) => {
      setActiveCall({
        role: 'receiver',
        type: data.type,
        peerId: data.from,
        peerName: 'Incoming Caller',
        conversationId: data.conversationId,
        status: 'ringing',
      });
      incomingOfferRef.current = data.offer;
    });

    socket.on('call-accepted', async (data: { answer: any }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
          startCallTimer();
        } catch (e) {
          console.error('Error setting remote description', e);
        }
      }
    });

    socket.on('ice-candidate', async (data: { candidate: any }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    });

    socket.on('call-rejected', () => {
      cleanupCall();
    });

    socket.on('call-ended', () => {
      cleanupCall();
    });

    socket.on('call-failed', (err: { reason: string }) => {
      alert(`Call failed: ${err.reason}`);
      cleanupCall();
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('ice-candidate');
      socket.off('call-rejected');
      socket.off('call-ended');
      socket.off('call-failed');
    };
  }, [socket]);

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);
  };

  const initMedia = async (type: 'AUDIO' | 'VIDEO') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'VIDEO',
        audio: true,
      });
      setLocalStream(stream);
      setIsMuted(false);
      setIsVideoMuted(false);
      return stream;
    } catch (e) {
      if (type === 'VIDEO') {
        console.warn('Video acquisition failed, falling back to audio only');
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setLocalStream(fallbackStream);
          setIsMuted(false);
          setIsVideoMuted(true);
          return fallbackStream;
        } catch (err) {
          console.error('Audio fallback failed as well', err);
        }
      }
      console.error('Error accessing media devices', e);
      alert('Could not access camera or microphone.');
      throw e;
    }
  };

  const setupPeerConnection = (stream: MediaStream, targetUserId: string) => {
    const pc = new RTCPeerConnection(iceConfig);

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          to: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCall = async (
    targetUserId: string,
    targetName: string,
    targetAvatar: string,
    type: 'AUDIO' | 'VIDEO',
    conversationId: string
  ) => {
    try {
      setActiveCall({
        role: 'caller',
        type,
        peerId: targetUserId,
        peerName: targetName,
        peerAvatar: targetAvatar,
        conversationId,
        status: 'ringing',
      });

      const stream = await initMedia(type);
      const pc = setupPeerConnection(stream, targetUserId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit('call-user', {
          to: targetUserId,
          offer,
          type,
          conversationId,
        });
      }
    } catch (e) {
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!activeCall || !incomingOfferRef.current || !socket) return;

    try {
      setActiveCall(prev => prev ? { ...prev, status: 'connecting' } : null);
      
      const stream = await initMedia(activeCall.type);
      const pc = setupPeerConnection(stream, activeCall.peerId);

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('accept-call', {
        to: activeCall.peerId,
        answer,
      });

      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
      startCallTimer();
    } catch (e) {
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (!activeCall || !socket) return;
    socket.emit('reject-call', {
      to: activeCall.peerId,
      conversationId: activeCall.conversationId,
      type: activeCall.type,
    });
    cleanupCall();
  };

  const endCall = () => {
    if (!activeCall || !socket) return;
    socket.emit('end-call', {
      to: activeCall.peerId,
      conversationId: activeCall.conversationId,
      type: activeCall.type,
      duration: callDuration,
    });
    cleanupCall();
  };

  const toggleMute = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoMuted(!videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current || !localStream) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const videoSender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          stopScreenShareHelper();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error starting screen share', err);
      }
    } else {
      stopScreenShareHelper();
    }
  };

  const stopScreenShareHelper = async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (peerConnectionRef.current && localStream) {
      const webcamTrack = localStream.getVideoTracks()[0];
      const videoSender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (videoSender && webcamTrack) {
        await videoSender.replaceTrack(webcamTrack);
      }
    }
    setIsScreenSharing(false);
  };

  const cleanupCall = () => {
    stopCallTimer();
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    incomingOfferRef.current = null;
    setActiveCall(null);
    setIsMuted(false);
    setIsVideoMuted(false);
    setIsScreenSharing(false);
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        localStream,
        remoteStream,
        callDuration,
        isMuted,
        isVideoMuted,
        isScreenSharing,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};
