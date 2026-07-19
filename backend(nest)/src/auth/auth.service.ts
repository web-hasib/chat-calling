import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateOAuthUser(profile: { email: string; name: string; avatarUrl: string; username?: string }) {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      let desiredUsername = profile.username;
      
      // Auto-generate unique username if not provided
      if (!desiredUsername) {
        const base = profile.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        desiredUsername = base;
        let count = 0;
        while (true) {
          const check = await this.prisma.user.findUnique({
            where: { username: desiredUsername },
          });
          if (!check) break;
          count++;
          desiredUsername = `${base}${count}`;
        }
      } else {
        // Validate if provided username is already taken
        const existingUsername = await this.prisma.user.findUnique({
          where: { username: desiredUsername },
        });
        if (existingUsername) {
          throw new BadRequestException('Username is already taken');
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

  generateJwt(user: any) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
