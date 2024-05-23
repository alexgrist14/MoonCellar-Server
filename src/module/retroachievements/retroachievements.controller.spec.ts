import { Test, TestingModule } from '@nestjs/testing';
import { RetroachievementsController } from './retroachievements.controller';
import { RetroachievementsService } from './retroachievements.service';

describe('RetroachievementsController', () => {
  let controller: RetroachievementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetroachievementsController],
      providers: [RetroachievementsService],
    }).compile();

    controller = module.get<RetroachievementsController>(RetroachievementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
