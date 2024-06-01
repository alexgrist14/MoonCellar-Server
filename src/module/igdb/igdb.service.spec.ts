import { Test, TestingModule } from '@nestjs/testing';
import { IgdbService } from './igdb.service';

describe('IgdbService', () => {
  let service: IgdbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IgdbService],
    }).compile();

    service = module.get<IgdbService>(IgdbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
