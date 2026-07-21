import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private client;
    get user(): import(".prisma/client").Prisma.UserDelegate<import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    get conversation(): import(".prisma/client").Prisma.ConversationDelegate<import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    get conversationParticipant(): import(".prisma/client").Prisma.ConversationParticipantDelegate<import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    get message(): import(".prisma/client").Prisma.MessageDelegate<import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    get messageReaction(): import(".prisma/client").Prisma.MessageReactionDelegate<import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    get callLog(): import(".prisma/client").Prisma.CallLogDelegate<import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
