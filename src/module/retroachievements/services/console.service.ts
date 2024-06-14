import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { buildAuthorization, getConsoleIds } from '@retroachievements/api';
import { RAConsole } from '../schemas/console.schema';
import mongoose from 'mongoose';

@Injectable()
export class ConsoleService {
  constructor(
    @InjectModel(RAConsole.name)
    private consoleModel: mongoose.Model<RAConsole>,
  ) {}
  private readonly userName = 'alexgrist14';
  private readonly apiKey = process.env.RETROACHIEVEMENTS_API_KEY;

  async getConsoles() {
    const authorization = buildAuthorization({
      userName: this.userName,
      webApiKey: this.apiKey,
    });
    const consoleIds = await getConsoleIds(authorization);
    return consoleIds;
  }

  async parseConsoles(consoles: RAConsole[]): Promise<void> {
    await this.consoleModel.deleteMany({});
    await this.consoleModel.insertMany(consoles);
  }

  private async onModuleInit() {
    //await this.saveConsolesToDB(await this.getConsoles());
  }

  async findAll() {
    return await this.consoleModel.find();
  }
}
