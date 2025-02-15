import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Model } from 'mongoose';
import { User } from 'src/module/user/schemas/user.schema';

@Injectable()
export class UserPresetsService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async addPreset(userId: string, name: string, preset: string) {
    const user = await this.userModel
      .findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(userId),
          'presets.name': { $ne: name },
        },
        [
          {
            $set: {
              presets: {
                $concatArrays: [
                  '$presets',
                  [
                    {
                      $cond: {
                        if: {
                          $not: {
                            $in: [{ name, preset }, '$presets'],
                          },
                        },
                        then: { name, preset },
                        else: '$$REMOVE',
                      },
                    },
                  ],
                ],
              },
            },
          },
        ],
        { new: true },
      )
      .select('presets');

    if (!user) {
      throw new BadRequestException('Preset already Exists!');
    }

    return user;
  }

  async removePreset(userId: string, name: string) {
    return this.userModel
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userId) },
        [
          {
            $set: {
              presets: {
                $filter: {
                  input: '$presets',
                  cond: { $ne: ['$$this.name', name] },
                },
              },
            },
          },
        ],
        { new: true },
      )
      .select('presets');
  }

  async getPresets(userId: string) {
    return this.userModel
      .findOne({ _id: new mongoose.Types.ObjectId(userId) })
      .select('presets');
  }
}
