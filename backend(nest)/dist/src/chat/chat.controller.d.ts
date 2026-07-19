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
        })[];
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        isGroup: boolean;
    }>;
    getMessages(id: string): Promise<({
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
    uploadFile(file: Express.Multer.File): Promise<{
        fileUrl: string;
        fileType: string;
        fileName: string;
    }>;
}
