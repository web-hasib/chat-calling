import { Controller, Get, Req, UseGuards, Res, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const jwt = this.authService.generateJwt(req.user);
    // Redirect to frontend with token query parameter
    return res.redirect(`http://localhost:3000/auth-callback?token=${jwt}`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req, @Res() res: Response) {
    const jwt = this.authService.generateJwt(req.user);
    // Redirect to frontend with token query parameter
    return res.redirect(`http://localhost:3000/auth-callback?token=${jwt}`);
  }

  // Developer Bypass Login endpoint
  @Post('dev-login')
  async devLogin(@Body() body: { email: string; name: string; username: string; avatarUrl?: string }) {
    const user = await this.authService.validateOAuthUser({
      email: body.email,
      username: body.username,
      name: body.name || 'Developer User',
      avatarUrl: body.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${body.username || 'dev'}`,
    });
    const token = this.authService.generateJwt(user);
    return { token, user };
  }
}
