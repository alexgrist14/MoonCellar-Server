import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  buildAuthorization,
  getAchievementsEarnedBetween,
  getUserAwards,
  getUserProfile,
} from '@retroachievements/api';
import { Model } from 'mongoose';
import { User } from 'src/module/user/schemas/user.schema';
import { RA_MAIN_USER_NAME } from 'src/shared/constants';

@Injectable()
export class UserRAService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  private readonly username = RA_MAIN_USER_NAME;
  private readonly webApiKey = process.env.RETROACHIEVEMENTS_API_KEY;
  private readonly authorization = buildAuthorization({
    username: this.username,
    webApiKey: this.webApiKey,
  });

  async getUserAchievements(raUsername: string) {
    //const authorization = buildAuthorization({userName: this.username, webApiKey: this.webApiKey});

    const achievements = await getAchievementsEarnedBetween(
      this.authorization,
      {
        username: raUsername,
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2026-01-01'),
      },
    );

    return achievements;
  }

  // async getUserAwards(raUsername: string){
  //   const userAwards = await getUserAwards(this.authorization,{
  //     userName: raUsername
  //   })

  //   return userAwards.visibleUserAwards;

  // }

  async setUserRAInfo(userId: string, raUsername: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const userRAProfile = await getUserProfile(this.authorization, {
      username: raUsername,
    });

    if (!userRAProfile) throw new NotFoundException('RA user not found');

    const userAwards = await getUserAwards(this.authorization, {
      username: raUsername,
    });

    user.raUsername = raUsername;
    user.raAwards = userAwards.visibleUserAwards;

    await user.save();

    return user;
  }
}
