import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    createMessage(senderId: string, conversationId: string, content?: string, fileUrl?: string, fileType?: string, replyToId?: string): Promise<{
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
    }>;
    getConversations(userId: string): Promise<({
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
    getOrCreateConversation(userId1: string, userId2: string): Promise<{
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
    getMessages(conversationId: string, cursor?: string, take?: number): Promise<{
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
    markAsRead(conversationId: string, userId: string): Promise<{
        count: number;
        conversationId: string;
        readAt: Date;
    }>;
    toggleReaction(messageId: string, userId: string, emoji: string): Promise<({
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
    deleteMessage(messageId: string, userId: string): Promise<{
        conversationId: string;
        messageId: string;
    }>;
    logCall(callerId: string, receiverId: string, conversationId: string, type: 'AUDIO' | 'VIDEO', status: 'MISSED' | 'COMPLETED' | 'REJECTED' | 'BUSY', duration?: number): Promise<{
        id: string;
        createdAt: Date;
        conversationId: string;
        type: import(".prisma/client").$Enums.CallType;
        status: import(".prisma/client").$Enums.CallStatus;
        duration: number | null;
        callerId: string;
        receiverId: string;
    }>;
    getConversation(conversationId: string): Promise<{
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
    updateConversationSettings(conversationId: string, userId: string, data: {
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
}
