import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private chatService;
    server: Server;
    private activeUsers;
    constructor(jwtService: JwtService, chatService: ChatService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleMessage(client: Socket, data: {
        conversationId: string;
        content?: string;
        fileUrl?: string;
        fileType?: string;
        replyToId?: string;
    }): Promise<void>;
    handleMarkAsRead(client: Socket, data: {
        conversationId: string;
    }): Promise<void>;
    handleToggleReaction(client: Socket, data: {
        conversationId: string;
        messageId: string;
        emoji: string;
    }): Promise<void>;
    handleDeleteMessage(client: Socket, data: {
        messageId: string;
        conversationId: string;
    }): Promise<void>;
    handleTyping(client: Socket, data: {
        conversationId: string;
        isTyping: boolean;
    }): void;
    handleUpdateSettings(client: Socket, data: {
        conversationId: string;
        themeColor?: string;
        themeGradient?: string;
        bgImage?: string;
        defaultEmoji?: string;
        nicknameTargetUserId?: string;
        nickname?: string;
    }): Promise<void>;
    handleCallUser(client: Socket, data: {
        to: string;
        offer: any;
        type: 'AUDIO' | 'VIDEO';
        conversationId: string;
    }): void;
    handleAcceptCall(client: Socket, data: {
        to: string;
        answer: any;
    }): void;
    handleIceCandidate(client: Socket, data: {
        to: string;
        candidate: any;
    }): void;
    handleRejectCall(client: Socket, data: {
        to: string;
        conversationId: string;
        type: 'AUDIO' | 'VIDEO';
    }): void;
    handleEndCall(client: Socket, data: {
        to: string;
        conversationId: string;
        type: 'AUDIO' | 'VIDEO';
        duration: number;
    }): void;
}
