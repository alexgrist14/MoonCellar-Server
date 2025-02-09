import { Test, TestingModule } from '@nestjs/testing';
import { userProfileService } from './user.service';

describe('userProfileService', () => {
  let service: userProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [userProfileService],
    }).compile();

    service = module.get<userProfileService>(userProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
