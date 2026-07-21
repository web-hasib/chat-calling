import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(profile: {
        email: string;
        name: string;
        username: string;
        password?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        email: string;
        username: string;
        password: string | null;
        name: string | null;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateUserCredentials(emailOrUsername: string, password: string): Promise<{
        id: string;
        email: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(userId: string, data: {
        name?: string;
        username?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        email: string;
        username: string;
        password: string | null;
        name: string | null;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateOAuthUser(profile: {
        email: string;
        name: string;
        avatarUrl: string;
        username?: string;
    }): Promise<{
        id: string;
        email: string;
        username: string;
        password: string | null;
        name: string | null;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateJwt(user: any): string;
}
