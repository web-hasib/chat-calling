import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Inject,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import type { StorageProvider } from '../storage/storage-provider.interface';


@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private prisma: PrismaService,
    @Inject('StorageProvider') private storageProvider: StorageProvider
  ) {}

  @Get('users')
  async getUsers(@Req() req, @Query('search') search?: string) {
    const userId = req.user.id;
    
    const whereClause: any = {
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

  @Get('conversations')
  async getConversations(@Req() req) {
    return this.chatService.getConversations(req.user.id);
  }

  @Post('conversation')
  async createConversation(@Req() req, @Body() body: { recipientId: string }) {
    return this.chatService.getOrCreateConversation(req.user.id, body.recipientId);
  }

  @Get('conversation/:id/messages')
  async getMessages(@Param('id') id: string) {
    return this.chatService.getMessages(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileUrl = await this.storageProvider.uploadFile(file);
    return {
      fileUrl,
      fileType: file.mimetype.split('/')[0].toUpperCase(), // IMAGE, VIDEO, APPLICATION etc.
      fileName: file.originalname,
    };
  }
}
