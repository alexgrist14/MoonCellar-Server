import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Platform, PlatformDocument } from "../schemas/platform.schema";

@Injectable()
export class PlatformsService {
  constructor(
    @InjectModel(Platform.name)
    private Platforms: Model<PlatformDocument>
  ) {}

  async getPlatforms() {
    return await this.Platforms.find();
  }
}
