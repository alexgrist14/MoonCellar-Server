import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signUp(
    @Body() signUpDto: SignUpDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.signUp(signUpDto);
  }

  @Get('/login')
  login(
    @Body() loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(loginDto);
  }

  @Post('/refresh-token')
  refreshToken(
    @Body('userId') userId: string,
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refreshToken(userId, refreshToken);
  }

  @Post('/logout')
  logout(@Body('userId') userId: string): Promise<void> {
    return this.authService.logout(userId);
  }
}
