import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    // private userService: UserService,
  ) {}

  private async generateTokensAndUpdateUser(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      { id: user._id },
      { expiresIn: '24h' },
    );
    const refreshToken = this.jwtService.sign(
      { id: user._id },
      { expiresIn: '30d' },
    );

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  }

  async signUp(
    signUpDto: SignUpDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { userName, email, password } = signUpDto;
    const isEmailExists = await this.userModel.findOne({ email });
    const isUserExists = await this.userModel.findOne({ userName });

    if (isEmailExists) throw new BadRequestException('Email already exists');
    if (isUserExists) throw new BadRequestException('UserName already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      userName,
      email,
      password: hashedPassword,
    });

    return this.generateTokensAndUpdateUser(user);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user) throw new UnauthorizedException('Email does not exists');

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched)
      throw new UnauthorizedException('Password does not match');

    return this.generateTokensAndUpdateUser(user);
  }

  async refreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userModel.findById(userId);

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = this.jwtService.sign(
      { id: user._id },
      { expiresIn: '24h' },
    );
    const newRefreshToken = this.jwtService.sign(
      { id: user._id },
      { expiresIn: '30d' },
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    origin?: string,
  ): void {
    const domain = origin?.includes('localhost') ? '.localhost' : 'mooncellar.space';
    //const httpOnly = !origin?.includes('localhost');
    const secure = origin?.includes('https') ? true : false;
    const sameSite = origin?.includes('localhost') || !secure ? undefined : 'none';

    res.cookie('accessMoonToken', accessToken, {
      httpOnly: true,
      domain: domain,
      secure: secure,
      sameSite: sameSite,      
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('refreshMoonToken', refreshToken, {
      httpOnly: true,
      domain: domain,
      secure: secure,
      sameSite: sameSite,          
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  clearCookies(res: Response, origin?: string): void {
    res.clearCookie('accessMoonToken', {
      httpOnly: !origin?.includes('localhost'),
    });
    res.clearCookie('refreshMoonToken', {
      httpOnly: !origin?.includes('localhost'),
    });
  }

  async logout(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }
}
