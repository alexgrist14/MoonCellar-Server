import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Headers,
  UnprocessableEntityException,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { UserService } from '../user/services/user.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('/signup')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
  })
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res() res: Response,
    @Headers() headers: any,
  ): Promise<Response> {
    try {
      const { accessToken, refreshToken } =
        await this.authService.signUp(signUpDto);
      const userId = (
        await this.usersService.findByString(signUpDto.userName, 'name')
      ).id;

      this.authService.setCookies(
        res,
        accessToken,
        refreshToken,
        headers?.origin,
      );
      return res.status(HttpStatus.OK).json({ userId });
    } catch (err) {
      console.log(err);
      throw new UnprocessableEntityException(`${err.message}`);
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
    @Headers() headers: any,
  ): Promise<Response> {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);
    const userId = (
      await this.usersService.findByString(loginDto.email, 'email')
    ).id;

    this.authService.setCookies(
      res,
      accessToken,
      refreshToken,
      headers?.origin,
    );

    return res.status(HttpStatus.OK).json({ userId });
  }

  @Post('/refresh-token')
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200, description: 'Refresh successful' })
  async refreshToken(
    @Body('userId') userId: string,
    @Body('refreshToken') oldRefreshToken: string,
    @Res() res: Response,
    @Headers() headers: any,
  ): Promise<Response> {
    const { accessToken, refreshToken } = await this.authService.refreshToken(
      userId,
      oldRefreshToken,
    );
    this.authService.setCookies(
      res,
      accessToken,
      refreshToken,
      headers?.origin,
    );
    return res.status(HttpStatus.OK);
  }

  @Post(':id/logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Param('id') userId: string,
    @Res() res: Response,
    @Headers() headers: any,
  ): Promise<Response> {
    await this.authService.logout(userId);

    this.authService.clearCookies(res, headers?.origin);

    return res
      .status(HttpStatus.OK)
      .json({ message: 'Successfully logged out' });
  }
}
