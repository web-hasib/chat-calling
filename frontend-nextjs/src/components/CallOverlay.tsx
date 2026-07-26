'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCall } from '../context/CallContext';
import styles from './CallOverlay.module.css';
import { Phone, PhoneOff, Mic, MicOff, Video as VideoOn, VideoOff, Monitor } from 'lucide-react';

const CallOverlay: React.FC = () => {
  const {
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
  } = useCall();

  // Video element references (non-inline refs to avoid blinking)
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);

  // PIP Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Bind local stream
  useEffect(() => {
    if (localVideoElRef.current && localStream) {
      localVideoElRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.status, isVideoMuted]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoElRef.current && remoteStream) {
      remoteVideoElRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall?.status]);

  if (!activeCall) return null;

  const isRinging = activeCall.status === 'ringing';
  const isConnected = activeCall.status === 'connected';

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pointer dragging event handlers with boundary limits to prevent going off-screen
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

    // Viewport bounding constraints
    const padding = 16;
    const pipWidth = 150;
    const pipHeight = 220;

    // The element defaults to right: 24px, bottom: 24px.
    // Constrain relative coordinates so at least 40px of the PIP is always visible inside the viewport edges.
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
