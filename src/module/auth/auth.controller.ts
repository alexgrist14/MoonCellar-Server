import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
  })
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const { accessToken, refreshToken } =
        await this.authService.signUp(signUpDto);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(HttpStatus.OK).json({ accessToken });
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  @Post('/login')
  @ApiOperation({ summary: 'User auth' })
  @ApiResponse({
    status: 200,
    description: 'Auth successful',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res() res: Response,
  ): Promise<Response> {
    console.log(loginDto);
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(HttpStatus.OK).json({ accessToken });
  }

  @Post('/refresh-token')
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200, description: 'Refresh successful' })
  refreshToken(
    @Body('userId') userId: string,
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refreshToken(userId, refreshToken);
  }

  @Post('/logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Body('userId') userId: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.authService.logout(userId);

    res.clearCookie('refreshToken', {
      httpOnly: true,
    });

    return res
      .status(HttpStatus.OK)
      .json({ message: 'Successfully logged out' });
  }
}
