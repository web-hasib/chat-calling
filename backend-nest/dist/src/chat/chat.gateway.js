"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const chat_service_1 = require("./chat.service");
let ChatGateway = class ChatGateway {
    constructor(jwtService, chatService) {
        this.jwtService = jwtService;
        this.chatService = chatService;
        this.activeUsers = new Map();
    }
    async handleConnection(client) {
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
            this.server.emit('user-status', { userId, status: 'online' });
        }
        catch (e) {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = client.data.userId;
        if (userId) {
            this.activeUsers.delete(userId);
            this.server.emit('user-status', { userId, status: 'offline' });
        }
    }
    async handleMessage(client, data) {
        const senderId = client.data.userId;
        if (!senderId)
            return;
        const message = await this.chatService.createMessage(senderId, data.conversationId, data.content, data.fileUrl, data.fileType, data.replyToId);
        this.server.emit(`message-${data.conversationId}`, message);
        this.server.emit('new-message-notification', message);
    }
    async handleMarkAsRead(client, data) {
        const userId = client.data.userId;
        if (!userId || !data?.conversationId)
            return;
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
    async handleToggleReaction(client, data) {
        const userId = client.data.userId;
        if (!userId || !data?.messageId || !data?.emoji)
            return;
        const updatedReactions = await this.chatService.toggleReaction(data.messageId, userId, data.emoji);
        this.server.emit(`reaction-updated-${data.conversationId}`, {
            messageId: data.messageId,
            conversationId: data.conversationId,
            reactions: updatedReactions,
        });
    }
    async handleDeleteMessage(client, data) {
        const userId = client.data.userId;
        if (!userId || !data?.messageId)
            return;
        const res = await this.chatService.deleteMessage(data.messageId, userId);
        if (res) {
            this.server.emit(`message-deleted-${res.conversationId}`, {
                messageId: res.messageId,
                conversationId: res.conversationId,
            });
        }
    }
    handleTyping(client, data) {
        const userId = client.data.userId;
        if (!userId)
            return;
        this.server.emit(`typing-${data.conversationId}`, { userId, isTyping: data.isTyping });
    }
    async handleUpdateSettings(client, data) {
        const userId = client.data.userId;
        if (!userId || !data?.conversationId)
            return;
        const result = await this.chatService.updateConversationSettings(data.conversationId, userId, data);
        if (!result)
            return;
        this.server.emit(`conversation-updated-${data.conversationId}`, result);
        this.server.emit('conversation-list-updated', { conversationId: data.conversationId, conversation: result.conversation });
        if (result.systemMessage) {
            this.server.emit(`message-${data.conversationId}`, result.systemMessage);
            this.server.emit('new-message-notification', result.systemMessage);
        }
    }
    handleCallUser(client, data) {
        const fromUserId = client.data.userId;
        const receiverSocketId = this.activeUsers.get(data.to);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('incoming-call', {
                from: fromUserId,
                offer: data.offer,
                type: data.type,
                conversationId: data.conversationId,
            });
        }
        else {
            client.emit('call-failed', { reason: 'User offline' });
            this.chatService.logCall(fromUserId, data.to, data.conversationId, data.type, 'MISSED', 0);
        }
    }
    handleAcceptCall(client, data) {
        const senderSocketId = this.activeUsers.get(data.to);
        if (senderSocketId) {
            this.server.to(senderSocketId).emit('call-accepted', {
                answer: data.answer,
            });
        }
    }
    handleIceCandidate(client, data) {
        const receiverSocketId = this.activeUsers.get(data.to);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('ice-candidate', {
                candidate: data.candidate,
            });
        }
    }
    handleRejectCall(client, data) {
        const callerSocketId = this.activeUsers.get(data.to);
        if (callerSocketId) {
            this.server.to(callerSocketId).emit('call-rejected');
        }
        const userId = client.data.userId;
        this.chatService.logCall(data.to, userId, data.conversationId, data.type, 'REJECTED', 0);
    }
    handleEndCall(client, data) {
        const targetSocketId = this.activeUsers.get(data.to);
        if (targetSocketId) {
            this.server.to(targetSocketId).emit('call-ended');
        }
        const userId = client.data.userId;
        this.chatService.logCall(userId, data.to, data.conversationId, data.type, 'COMPLETED', data.duration);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark-as-read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('toggle-reaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleToggleReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('delete-message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('update-conversation-settings'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleUpdateSettings", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call-user'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('accept-call'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleAcceptCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ice-candidate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleIceCandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('reject-call'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleRejectCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('end-call'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleEndCall", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
            credentials: false,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map