import { AuthService } from './auth.service';
import type { Response } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    googleAuth(): Promise<void>;
    googleAuthRedirect(req: any, res: Response): Promise<void>;
    githubAuth(): Promise<void>;
    githubAuthRedirect(req: any, res: Response): Promise<void>;
    devLogin(body: {
        email: string;
        name: string;
        username: string;
        avatarUrl?: string;
    }): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            username: string;
            name: string | null;
            avatarUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
