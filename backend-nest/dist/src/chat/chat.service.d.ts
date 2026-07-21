import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    createMessage(senderId: string, conversationId: string, content?: string, fileUrl?: string, fileType?: string): Promise<{
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
        })[];
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        isGroup: boolean;
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
        })[];
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        isGroup: boolean;
    }>;
    getMessages(conversationId: string): Promise<({
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
        senderId: string;
    })[]>;
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
}
