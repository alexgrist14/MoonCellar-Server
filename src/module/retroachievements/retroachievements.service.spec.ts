import { Test, TestingModule } from '@nestjs/testing';
import { RetroachievementsService } from './retroachievements.service';

describe('RetroachievementsService', () => {
  let service: RetroachievementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetroachievementsService],
    }).compile();

    service = module.get<RetroachievementsService>(RetroachievementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
