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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const chat_service_1 = require("./chat.service");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatController = class ChatController {
    constructor(chatService, prisma, storageProvider) {
        this.chatService = chatService;
        this.prisma = prisma;
        this.storageProvider = storageProvider;
    }
    async getUsers(req, search) {
        const userId = req.user.id;
        const whereClause = {
            id: { not: userId },
        };
        if (search) {
            const queryLower = search.trim();
            whereClause.OR = [
                { username: { contains: queryLower, mode: 'insensitive' } },
                { name: { contains: queryLower, mode: 'insensitive' } },
                { email: { contains: queryLower, mode: 'insensitive' } },
            ];
        }
        return this.prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                avatarUrl: true,
            },
        });
    }
    async getConversations(req) {
        return this.chatService.getConversations(req.user.id);
    }
    async createConversation(req, body) {
        return this.chatService.getOrCreateConversation(req.user.id, body.recipientId);
    }
    async getMessages(id, cursor, limit) {
        return this.chatService.getMessages(id, cursor, limit ? parseInt(limit, 10) : 20);
    }
    async markAsRead(req, id) {
        return this.chatService.markAsRead(id, req.user.id);
    }
    async toggleReaction(req, id, body) {
        return this.chatService.toggleReaction(id, req.user.id, body.emoji);
    }
    async deleteMessage(req, id) {
        return this.chatService.deleteMessage(id, req.user.id);
    }
    async updateSettings(req, id, body) {
        return this.chatService.updateConversationSettings(id, req.user.id, body);
    }
    async uploadFile(file) {
        const fileUrl = await this.storageProvider.uploadFile(file);
        return {
            fileUrl,
            fileType: file.mimetype.split('/')[0].toUpperCase(),
            fileName: file.originalname,
        };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Post)('conversation'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)('conversation/:id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('cursor')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('conversation/:id/read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Post)('message/:id/reaction'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "toggleReaction", null);
__decorate([
    (0, common_1.Delete)('message/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Patch)('conversation/:id/settings'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "uploadFile", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(2, (0, common_1.Inject)('StorageProvider')),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        prisma_service_1.PrismaService, Object])
], ChatController);
//# sourceMappingURL=chat.controller.js.map