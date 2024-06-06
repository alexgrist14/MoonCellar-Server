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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  private async generateTokensAndUpdateUser(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign({ id: user._id });
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
    const { name, email, password } = signUpDto;
    const isEmailExist = await this.userModel.findOne({ email });

    if (isEmailExist) throw new BadRequestException('Email already exsists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    return this.generateTokensAndUpdateUser(user);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    console.log(loginDto);
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user) throw new UnauthorizedException('Email does not exsists');

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

    const newAccessToken = this.jwtService.sign({ id: user._id });
    const newRefreshToken = this.jwtService.sign(
      { id: user._id },
      { expiresIn: '30d' },
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }
}
