import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './controllers/user-profile.controller';
import { userProfileService } from './services/user-profile.service';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [userProfileService],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
