import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: false,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track active socket connections by User ID
  private activeUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization || client.handshake.auth?.token;
      if (!authHeader) {
        client.disconnect();
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;
      this.activeUsers.set(userId, client.id);

      // Send list of currently online user IDs to the newly connected client
      client.emit('online-users-list', Array.from(this.activeUsers.keys()));

      // Broadcast user online status to all connected clients
      this.server.emit('user-status', { userId, status: 'online' });
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.activeUsers.delete(userId);
      this.server.emit('user-status', { userId, status: 'offline' });
    }
  }

  // --- Real-Time Chat Messaging ---

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content?: string; fileUrl?: string; fileType?: string; replyToId?: string }
  ) {
    const senderId = client.data.userId;
    if (!senderId) return;

    const message = await this.chatService.createMessage(
      senderId,
      data.conversationId,
      data.content,
      data.fileUrl,
      data.fileType,
      data.replyToId
    );

    // Broadcast message to all subscribers of this conversation
    this.server.emit(`message-${data.conversationId}`, message);
    this.server.emit('new-message-notification', message);
  }

  @SubscribeMessage('mark-as-read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.conversationId) return;

    const readInfo = await this.chatService.markAsRead(data.conversationId, userId);
    if (readInfo.count > 0) {
      this.server.emit(`messages-read-${data.conversationId}`, {
        conversationId: data.conversationId,
        readerId: userId,
        readAt: readInfo.readAt,
      });
      this.server.emit('conversation-read-update', {
        conversationId: data.conversationId,
        readerId: userId,
      });
    }
  }

  @SubscribeMessage('toggle-reaction')
  async handleToggleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId: string; emoji: string }
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.messageId || !data?.emoji) return;

    const updatedReactions = await this.chatService.toggleReaction(data.messageId, userId, data.emoji);

    this.server.emit(`reaction-updated-${data.conversationId}`, {
      messageId: data.messageId,
      conversationId: data.conversationId,
      reactions: updatedReactions,
    });
  }

  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string }
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.messageId) return;

    const res = await this.chatService.deleteMessage(data.messageId, userId);
    if (res) {
      this.server.emit(`message-deleted-${res.conversationId}`, {
        messageId: res.messageId,
        conversationId: res.conversationId,
      });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean }
  ) {
    const userId = client.data.userId;
    if (!userId) return;
    this.server.emit(`typing-${data.conversationId}`, { userId, isTyping: data.isTyping });
  }

  @SubscribeMessage('update-conversation-settings')
  async handleUpdateSettings(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      conversationId: string;
      themeColor?: string;
      themeGradient?: string;
      bgImage?: string;
      defaultEmoji?: string;
      nicknameTargetUserId?: string;
      nickname?: string;
    }
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.conversationId) return;

    const result = await this.chatService.updateConversationSettings(data.conversationId, userId, data);
    if (!result) return;

    this.server.emit(`conversation-updated-${data.conversationId}`, result);
    this.server.emit('conversation-list-updated', { conversationId: data.conversationId, conversation: result.conversation });

    if (result.systemMessage) {
      this.server.emit(`message-${data.conversationId}`, result.systemMessage);
      this.server.emit('new-message-notification', result.systemMessage);
    }
  }

  // --- WebRTC signaling events ---

  @SubscribeMessage('call-user')
  handleCallUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; offer: any; type: 'AUDIO' | 'VIDEO'; conversationId: string; callerName?: string; callerAvatar?: string }
  ) {
    const fromUserId = client.data.userId;
    const receiverSocketId = this.activeUsers.get(data.to);

    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('incoming-call', {
        from: fromUserId,
        offer: data.offer,
        type: data.type,
        conversationId: data.conversationId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
      });
    } else {
      client.emit('call-failed', { reason: 'User offline' });
      // Log missed call
      this.chatService.logCall(fromUserId, data.to, data.conversationId, data.type, 'MISSED', 0).then((res) => {
        if (res?.systemMessage) {
          this.server.emit(`message-${data.conversationId}`, res.systemMessage);
          this.server.emit('new-message-notification', res.systemMessage);
        }
      });
    }
  }

  @SubscribeMessage('accept-call')
  handleAcceptCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; answer: any }
  ) {
    const senderSocketId = this.activeUsers.get(data.to);
    if (senderSocketId) {
      this.server.to(senderSocketId).emit('call-accepted', {
        answer: data.answer,
      });
    }
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; candidate: any }
  ) {
    const receiverSocketId = this.activeUsers.get(data.to);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('ice-candidate', {
        candidate: data.candidate,
      });
    }
  }

  @SubscribeMessage('reject-call')
  handleRejectCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; conversationId: string; type: 'AUDIO' | 'VIDEO'; reason?: string }
  ) {
    const callerSocketId = this.activeUsers.get(data.to);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call-rejected', { reason: data.reason });
    }
    const userId = client.data.userId;
    const status = data.reason === 'busy' ? 'BUSY' : 'REJECTED';
    this.chatService.logCall(data.to, userId, data.conversationId, data.type, status, 0).then((res) => {
      if (res?.systemMessage) {
        this.server.emit(`message-${data.conversationId}`, res.systemMessage);
        this.server.emit('new-message-notification', res.systemMessage);
      }
    });
  }

  @SubscribeMessage('end-call')
  handleEndCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; conversationId: string; type: 'AUDIO' | 'VIDEO'; duration: number }
  ) {
    const targetSocketId = this.activeUsers.get(data.to);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('call-ended');
    }
    const userId = client.data.userId;
    this.chatService.logCall(userId, data.to, data.conversationId, data.type, 'COMPLETED', data.duration).then((res) => {
      if (res?.systemMessage) {
        this.server.emit(`message-${data.conversationId}`, res.systemMessage);
        this.server.emit('new-message-notification', res.systemMessage);
      }
    });
  }
}
