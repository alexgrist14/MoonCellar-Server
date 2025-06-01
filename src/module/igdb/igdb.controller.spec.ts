import { Test, TestingModule } from "@nestjs/testing";
import { IgdbController } from "./controllers/igdb.controller";
import { IGDBService } from "./igdb.service";
import { IgdbParserController } from "./controllers/igdb-parser.controller";

describe("IgdbController", () => {
  let igdb: IgdbController;
  let igdbParser: IgdbParserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IgdbController, IgdbParserController],
      providers: [IGDBService],
    }).compile();

    igdb = module.get<IgdbController>(IgdbController);
  });

  it("should be defined", () => {
    expect(igdb).toBeDefined();
    expect(igdbParser).toBeDefined();
  });
});
