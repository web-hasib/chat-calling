import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateOAuthUser(profile: {
        email: string;
        name: string;
        avatarUrl: string;
        username?: string;
    }): Promise<{
        id: string;
        email: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateJwt(user: any): string;
}
