import {
  Controller,
  Get,
  Post,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован.',
  })
  signUp(
    @Body() signUpDto: SignUpDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.signUp(signUpDto);
  }

  @Get('/login')
  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно авторизован.',
  })
  login(
    @Body() loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(loginDto);
  }

  @Post('/refresh-token')
  @ApiOperation({ summary: 'Обновление токенов' })
  @ApiResponse({ status: 200, description: 'Токены успешно обновлены.' })
  refreshToken(
    @Body('userId') userId: string,
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refreshToken(userId, refreshToken);
  }

  @Post('/logout')
  @ApiOperation({ summary: 'Выход пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно вышел.' })
  logout(@Body('userId') userId: string): Promise<void> {
    return this.authService.logout(userId);
  }
}
