import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

async function fetchLinkPreview(content?: string) {
  if (!content) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = content.match(urlRegex);
  if (!match) return null;
  const targetUrl = match[0];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();

    const getMetaContent = (prop: string) => {
      const match =
        html.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${prop}["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*name=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${prop}["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMetaContent('og:title') || getMetaContent('twitter:title') || (titleMatch ? titleMatch[1] : null);
    const description = getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description');
    const image = getMetaContent('og:image') || getMetaContent('twitter:image');
    let siteName = getMetaContent('og:site_name');
    if (!siteName) {
      try {
        siteName = new URL(targetUrl).hostname;
      } catch (e) {
        siteName = null;
      }
    }

    if (!title && !description) return null;

    return {
      url: targetUrl,
      title: title?.trim() || null,
      description: description?.trim() || null,
      image: image || null,
      siteName: siteName?.trim() || null,
    };
  } catch (e) {
    return null;
  }
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createMessage(
    senderId: string,
    conversationId: string,
    content?: string,
    fileUrl?: string,
    fileType?: string,
    replyToId?: string
  ) {
    const linkPreview = await fetchLinkPreview(content);

    return this.prisma.message.create({
      data: {
        senderId,
        conversationId,
        content,
        fileUrl,
        fileType,
        replyToId,
        linkPreview: linkPreview ? (linkPreview as any) : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            fileUrl: true,
            fileType: true,
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async getOrCreateConversation(userId1: string, userId2: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: userId1 },
            { userId: userId2 },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async getMessages(conversationId: string, cursor?: string, take = 20) {
    const limit = Number(take) || 20;

    let whereClause: any = { conversationId };

    if (cursor) {
      const cursorMessage = await this.prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });

      if (cursorMessage) {
        whereClause.createdAt = {
          lt: cursorMessage.createdAt,
        };
      }
    }

    const messages = await this.prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            fileUrl: true,
            fileType: true,
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    // Return chronological order
    const sortedMessages = items.reverse();

    return {
      messages: sortedMessages,
      nextCursor,
      hasMore,
    };
  }

  async markAsRead(conversationId: string, userId: string) {
    const now = new Date();
    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: now,
      },
    });

    return {
      count: result.count,
      conversationId,
      readAt: now,
    };
  }

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        // Remove reaction if clicking the same emoji
        await this.prisma.messageReaction.delete({
          where: { id: existing.id },
        });
      } else {
        // Update reaction to the new emoji
        await this.prisma.messageReaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
      }
    } else {
      await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }

    // Return updated reactions for the message
    return this.prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: { participants: true },
        },
      },
    });

    if (!message) {
      return null;
    }

    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isParticipant) {
      return null;
    }

    await this.prisma.messageReaction.deleteMany({
      where: { messageId },
    });

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { conversationId: message.conversationId, messageId };
  }

  async logCall(
    callerId: string,
    receiverId: string,
    conversationId: string,
    type: 'AUDIO' | 'VIDEO',
    status: 'MISSED' | 'COMPLETED' | 'REJECTED' | 'BUSY',
    duration?: number
  ) {
    return this.prisma.callLog.create({
      data: {
        callerId,
        receiverId,
        conversationId,
        type,
        status,
        duration,
      },
    });
  }

  async getConversation(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async updateConversationSettings(
    conversationId: string,
    userId: string,
    data: {
      themeColor?: string;
      themeGradient?: string;
      bgImage?: string;
      defaultEmoji?: string;
      nicknameTargetUserId?: string;
      nickname?: string;
    }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    let systemText = '';
    const updateData: any = {};

    if (data.themeColor !== undefined) updateData.themeColor = data.themeColor;
    if (data.themeGradient !== undefined) updateData.themeGradient = data.themeGradient;
    if (data.bgImage !== undefined) updateData.bgImage = data.bgImage;
    if (data.defaultEmoji !== undefined) updateData.defaultEmoji = data.defaultEmoji;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: updateData,
      });

      if (data.themeColor !== undefined || data.themeGradient !== undefined) {
        systemText = `${user.name || user.username} changed the chat theme.`;
      } else if (data.bgImage !== undefined) {
        systemText = `${user.name || user.username} updated the chat background.`;
      } else if (data.defaultEmoji !== undefined) {
        systemText = `${user.name || user.username} set the quick emoji to ${data.defaultEmoji}.`;
      }
    }

    if (data.nicknameTargetUserId !== undefined) {
      const targetUser = await this.prisma.user.findUnique({ where: { id: data.nicknameTargetUserId } });
      const targetName = targetUser?.name || targetUser?.username || 'user';
      const cleanNickname = data.nickname?.trim() || null;

      await this.prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId: data.nicknameTargetUserId,
        },
        data: {
          nickname: cleanNickname,
        },
      });

      if (cleanNickname) {
        systemText = `${user.name || user.username} set the nickname for ${targetName} to "${cleanNickname}".`;
      } else {
        systemText = `${user.name || user.username} cleared the nickname for ${targetName}.`;
      }
    }

    let systemMessage: any = null;
    if (systemText) {
      systemMessage = await this.prisma.message.create({
        data: {
          senderId: userId,
          conversationId,
          content: systemText,
          isSystem: true,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });
    }

    const updatedConvo = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      conversation: updatedConvo,
      systemMessage,
    };
  }
}
