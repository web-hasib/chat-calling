import { AuthService } from './auth.service';
import type { Response } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    googleAuth(): Promise<void>;
    googleAuthRedirect(req: any, res: Response): Promise<void>;
    githubAuth(): Promise<void>;
    githubAuthRedirect(req: any, res: Response): Promise<void>;
    signup(body: {
        email: string;
        username: string;
        name: string;
        password?: string;
        avatarUrl?: string;
    }): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            username: string;
            password: string | null;
            name: string | null;
            avatarUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    login(body: {
        emailOrUsername: string;
        password?: string;
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
    updateProfile(req: any, body: {
        name?: string;
        username?: string;
        avatarUrl?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            password: string | null;
            name: string | null;
            avatarUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
