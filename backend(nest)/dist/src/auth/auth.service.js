"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
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