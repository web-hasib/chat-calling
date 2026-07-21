import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import type { StorageProvider } from '../storage/storage-provider.interface';
export declare class ChatController {
    private chatService;
    private prisma;
    private storageProvider;
    constructor(chatService: ChatService, prisma: PrismaService, storageProvider: StorageProvider);
    getUsers(req: any, search?: string): Promise<{
        id: string;
        email: string;
        username: string;
        name: string;
        avatarUrl: string;
    }[]>;
    getConversations(req: any): Promise<({
        messages: ({
            sender: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            conversationId: string;
            content: string | null;
            fileUrl: string | null;
            fileType: string | null;
            isRead: boolean;
            isSystem: boolean;
            readAt: Date | null;
            replyToId: string | null;
            linkPreview: import("@prisma/client/runtime/client").JsonValue | null;
            senderId: string;
        })[];
        participants: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            userId: string;
            conversationId: string;
            nickname: string | null;
        })[];
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        isGroup: boolean;
        themeColor: string | null;
        themeGradient: string | null;
        bgImage: string | null;
        defaultEmoji: string | null;
    })[]>;
    createConversation(req: any, body: {
        recipientId: string;
    }): Promise<{
        participants: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            userId: string;
            conversationId: string;
            nickname: string | null;
        })[];
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        isGroup: boolean;
        themeColor: string | null;
        themeGradient: string | null;
        bgImage: string | null;
        defaultEmoji: string | null;
    }>;
    getMessages(id: string, cursor?: string, limit?: string): Promise<{
        messages: ({
            reactions: ({
                user: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                emoji: string;
                messageId: string;
            })[];
            replyTo: {
                id: string;
                content: string;
                fileUrl: string;
                fileType: string;
                sender: {
                    id: string;
                    name: string;
                };
            };
            sender: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            createdAt: Date;
            conversationId: string;
            content: string | null;
            fileUrl: string | null;
            fileType: string | null;
            isRead: boolean;
            isSystem: boolean;
            readAt: Date | null;
            replyToId: string | null;
            linkPreview: import("@prisma/client/runtime/client").JsonValue | null;
            senderId: string;
        })[];
        nextCursor: string;
        hasMore: boolean;
    }>;
    markAsRead(req: any, id: string): Promise<{
        count: number;
        conversationId: string;
        readAt: Date;
    }>;
    toggleReaction(req: any, id: string, body: {
        emoji: string;
    }): Promise<({
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        emoji: string;
        messageId: string;
    })[]>;
    deleteMessage(req: any, id: string): Promise<{
        conversationId: string;
        messageId: string;
    }>;
    updateSettings(req: any, id: string, body: {
        themeColor?: string;
        themeGradient?: string;
        bgImage?: string;
        defaultEmoji?: string;
        nicknameTargetUserId?: string;
        nickname?: string;
    }): Promise<{
        conversation: {
            participants: ({
                user: {
                    id: string;
                    email: string;
                    name: string;
                    avatarUrl: string;
                };
            } & {
                id: string;
                userId: string;
                conversationId: string;
                nickname: string | null;
            })[];
        } & {
            id: string;
            name: string | null;
            createdAt: Date;
            isGroup: boolean;
            themeColor: string | null;
            themeGradient: string | null;
            bgImage: string | null;
            defaultEmoji: string | null;
        };
        systemMessage: any;
    }>;
    uploadFile(file: Express.Multer.File): Promise<{
        fileUrl: string;
        fileType: string;
        fileName: string;
    }>;
}
