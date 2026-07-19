"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(profile) {
        const existingEmail = await this.prisma.user.findUnique({
            where: { email: profile.email },
        });
        if (existingEmail) {
            throw new common_1.BadRequestException('Email already registered');
        }
        const existingUsername = await this.prisma.user.findUnique({
            where: { username: profile.username.toLowerCase() },
        });
        if (existingUsername) {
            throw new common_1.BadRequestException('Username is already taken');
        }
        let hashedPassword = undefined;
        if (profile.password) {
            hashedPassword = await bcrypt.hash(profile.password, 10);
        }
        const user = await this.prisma.user.create({
            data: {
                email: profile.email,
                username: profile.username.toLowerCase(),
                name: profile.name,
                password: hashedPassword,
                avatarUrl: profile.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.username}`,
            },
        });
        return user;
    }
    async validateUserCredentials(emailOrUsername, password) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailOrUsername.toLowerCase() },
                    { username: emailOrUsername.toLowerCase() },
                ],
            },
        });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Username or password incorrect');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Username or password incorrect');
        }
        const { password: _, ...result } = user;
        return result;
    }
    async updateProfile(userId, data) {
        if (data.username) {
            const usernameLower = data.username.trim().toLowerCase();
            const existing = await this.prisma.user.findUnique({
                where: { username: usernameLower },
            });
            if (existing && existing.id !== userId) {
                throw new common_1.BadRequestException('Username is already taken');
            }
            data.username = usernameLower;
        }
        return this.prisma.user.update({
            where: { id: userId },
            data,
        });
    }
    async validateOAuthUser(profile) {
        let user = await this.prisma.user.findUnique({
            where: { email: profile.email },
        });
        if (!user) {
            let desiredUsername = profile.username;
            if (!desiredUsername) {
                const base = profile.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
                desiredUsername = base;
                let count = 0;
                while (true) {
                    const check = await this.prisma.user.findUnique({
                        where: { username: desiredUsername },
                    });
                    if (!check)
                        break;
                    count++;
                    desiredUsername = `${base}${count}`;
                }
            }
            else {
                const existingUsername = await this.prisma.user.findUnique({
                    where: { username: desiredUsername },
                });
                if (existingUsername) {
                    throw new common_1.BadRequestException('Username is already taken');
                }
            }
            user = await this.prisma.user.create({
                data: {
                    email: profile.email,
                    username: desiredUsername,
                    name: profile.name,
                    avatarUrl: profile.avatarUrl,
                },
            });
        }
        return user;
    }
    generateJwt(user) {
        const payload = { email: user.email, sub: user.id };
        return this.jwtService.sign(payload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map