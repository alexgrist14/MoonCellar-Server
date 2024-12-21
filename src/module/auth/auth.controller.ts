import {
  Body,
  Controller,
  Headers,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { jwtDecode } from 'jwt-decode';
import { UserService } from '../user/services/user.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { ExtendedJwtPayload } from './types/jwt';
import { AuthGuard } from '@nestjs/passport';

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
    const { accessToken, refreshToken } =
      await this.authService.signUp(signUpDto);
    const userId = (
      await this.usersService.findByString(signUpDto.userName, 'userName')
    ).id;

    this.authService.setCookies(
      res,
      accessToken,
      refreshToken,
      headers?.origin,
    );
    return res.status(HttpStatus.OK).json({ userId });
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
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200, description: 'Refresh successful' })
  async refreshToken(
    @Res() res: Response,
    @Req() req: Request,
    @Headers() headers?: any,
  ): Promise<Response> {
    const oldRefreshToken = req.cookies.refreshMoonToken;
    if (oldRefreshToken) {
      const decodedToken = jwtDecode<ExtendedJwtPayload>(oldRefreshToken);
      const userId = decodedToken.id;

      if (decodedToken.exp) {
        const { accessToken,refreshToken } = await this.authService.refreshToken(
          userId,
          oldRefreshToken,
        );
        this.authService.setCookies(res, accessToken, refreshToken, headers?.origin);
        return res.status(HttpStatus.OK).json({ userId });
      } else throw new UnauthorizedException();
    }
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
