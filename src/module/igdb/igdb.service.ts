import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { igdbAuth, igdbParser } from "./utils/igdb";
import { IGDBCoverDocument, IGDBCovers } from "./schemas/igdb-covers.schema";
import { IGDBGenres, IGDBGenresDocument } from "./schemas/igdb-genres.schema";
import {
  IGDBFamilies,
  IGDBFamiliesDocument,
} from "./schemas/igdb-families.schema";
import {
  IGDBPlatforms,
  IGDBPlatformsDocument,
} from "./schemas/igdb-platforms.schema";
import { IGDBModes, IGDBModesDocument } from "./schemas/igdb-modes.schema";
import { ParserType } from "./interface/common.interface";
import {
  IGDBKeywords,
  IGDBKeywordsDocument,
} from "./schemas/igdb-keywords.schema";
import {
  IGDBScreenshots,
  IGDBScreenshotsDocument,
} from "./schemas/igdb-screenshots.schema";
import {
  IGDBArtworks,
  IGDBArtworksDocument,
} from "./schemas/igdb-artworks.schema";
import { IGDBThemes, IGDBThemesDocument } from "./schemas/igdb-themes.schema";
import {
  IGDBPlatformLogos,
  IGDBPlatformLogosDocument,
} from "./schemas/igdb-platform-logos.schema";
import {
  IGDBGames,
  IGDBGamesDocument,
} from "src/shared/schemas/igdb-games.schema";
import { updateOrInsertValues } from "src/shared/db";
import {
  IGDBWebsites,
  IGDBWebsitesDocument,
} from "./schemas/igdb-websites.schema";
import {
  IGDBInvolvedCompanies,
  IGDBInvolvedCompaniesDocument,
} from "./schemas/igdb-involved-companies.schema";
import {
  IGDBCompanies,
  IGDBCompaniesDocument,
} from "./schemas/igdb-companies.schema";
import {
  IGDBReleaseDates,
  IGDBReleaseDatesDocument,
} from "./schemas/igdb-release-dates.schema";
import { getImageLink } from "src/shared/utils";
import {
  IGDBGameTypes,
  IGDBGameTypesDocument,
} from "./schemas/igdb-game-types.schema";
import { Game, GameDocument } from "../games/schemas/game.schema";
import { Platform, PlatformDocument } from "../games/schemas/platform.schema";
import { RAConsole } from "../retroach/schemas/console.schema";
import { FileService } from "../user/services/file-upload.service";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class IGDBService {
  constructor(
    @InjectModel(IGDBGames.name)
    private IGDBGamesModel: Model<IGDBGamesDocument>,
    @InjectModel(IGDBCovers.name)
    private IGDBCoversModel: Model<IGDBCoverDocument>,
    @InjectModel(IGDBGenres.name)
    private IGDBGenresModel: Model<IGDBGenresDocument>,
    @InjectModel(IGDBFamilies.name)
    private IGDBFamiliesModel: Model<IGDBFamiliesDocument>,
    @InjectModel(IGDBPlatforms.name)
    private IGDBPlatformsModel: Model<IGDBPlatformsDocument>,
    @InjectModel(IGDBModes.name)
    private IGDBModesModel: Model<IGDBModesDocument>,
    @InjectModel(IGDBKeywords.name)
    private IGDBKeywordsModel: Model<IGDBKeywordsDocument>,
    @InjectModel(IGDBThemes.name)
    private IGDBThemesModel: Model<IGDBThemesDocument>,
    @InjectModel(IGDBScreenshots.name)
    private IGDBScreenshotsModel: Model<IGDBScreenshotsDocument>,
    @InjectModel(IGDBArtworks.name)
    private IGDBArtworksModel: Model<IGDBArtworksDocument>,
    @InjectModel(IGDBPlatformLogos.name)
    private IGDBPlatformLogosModel: Model<IGDBPlatformLogosDocument>,
    @InjectModel(IGDBWebsites.name)
    private IGDBWebsitesModel: Model<IGDBWebsitesDocument>,
    @InjectModel(IGDBInvolvedCompanies.name)
    private IGDBInvolvedCompaniesModel: Model<IGDBInvolvedCompaniesDocument>,
    @InjectModel(IGDBCompanies.name)
    private IGDBCompaniesModel: Model<IGDBCompaniesDocument>,
    @InjectModel(IGDBReleaseDates.name)
    private IGDBReleaseDatesModel: Model<IGDBReleaseDatesDocument>,
    @InjectModel(IGDBGameTypes.name)
    private IGDBGameTypesModel: Model<IGDBGameTypesDocument>,
    @InjectModel(Game.name)
    private Games: Model<GameDocument>,
    @InjectModel(Platform.name)
    private Platforms: Model<PlatformDocument>,
    @InjectModel(RAConsole.name)
    private RAPlatforms: Model<RAConsole>,
    private fileService: FileService,
    private httpService: HttpService
  ) {}

  private async parser<T>(type: ParserType, model: Model<T>) {
    const { data: authData } = await igdbAuth();
    const { access_token: token } = authData;

    if (!token) return;

    return igdbParser<T>({
      token,
      action: type,
      parsingCallback: async (items: T[]) => {
        return updateOrInsertValues<T>(model, items);
      },
    });
  }

  async parseAll() {
    await this.parser<IGDBCompaniesDocument>(
      "companies",
      this.IGDBCompaniesModel
    );
    await this.parser<IGDBWebsitesDocument>("websites", this.IGDBWebsitesModel);
    await this.parser<IGDBInvolvedCompaniesDocument>(
      "involved_companies",
      this.IGDBInvolvedCompaniesModel
    );
    await this.parser<IGDBThemesDocument>("themes", this.IGDBThemesModel);
    await this.parser<IGDBKeywordsDocument>("keywords", this.IGDBKeywordsModel);
    await this.parser<IGDBModesDocument>("modes", this.IGDBModesModel);
    await this.parser<IGDBPlatformLogosDocument>(
      "platform_logos",
      this.IGDBPlatformLogosModel
    );
    await this.parser<IGDBFamiliesDocument>("families", this.IGDBFamiliesModel);
    await this.parser<IGDBPlatformsDocument>(
      "platforms",
      this.IGDBPlatformsModel
    );
    await this.parser<IGDBGenresDocument>("genres", this.IGDBGenresModel);
    await this.parser<IGDBScreenshotsDocument>(
      "screenshots",
      this.IGDBScreenshotsModel
    );
    await this.parser<IGDBArtworksDocument>("artworks", this.IGDBArtworksModel);
    await this.parser<IGDBCoverDocument>("covers", this.IGDBCoversModel);
    await this.parser<IGDBReleaseDatesDocument>(
      "release_dates",
      this.IGDBReleaseDatesModel
    );
    await this.parser<IGDBGameTypesDocument>(
      "game_types",
      this.IGDBGameTypesModel
    );

    return this.parser<IGDBGamesDocument>("games", this.IGDBGamesModel);
  }

  async parseSelected(type: ParserType) {
    switch (type) {
      case "games":
        return this.parser<IGDBGamesDocument>("games", this.IGDBGamesModel);
      case "covers":
        return this.parser<IGDBCoverDocument>("covers", this.IGDBCoversModel);
      case "genres":
        return this.parser<IGDBGenresDocument>("genres", this.IGDBGenresModel);
      case "modes":
        return this.parser<IGDBModesDocument>("modes", this.IGDBModesModel);
      case "families":
        return this.parser<IGDBFamiliesDocument>(type, this.IGDBFamiliesModel);
      case "platforms":
        return this.parser<IGDBPlatformsDocument>(
          "platforms",
          this.IGDBPlatformsModel
        );
      case "keywords":
        return this.parser<IGDBKeywordsDocument>(
          "keywords",
          this.IGDBKeywordsModel
        );
      case "themes":
        return this.parser<IGDBThemesDocument>("themes", this.IGDBThemesModel);
      case "screenshots":
        return this.parser<IGDBScreenshotsDocument>(
          "screenshots",
          this.IGDBScreenshotsModel
        );
      case "artworks":
        return this.parser<IGDBArtworksDocument>(
          "artworks",
          this.IGDBArtworksModel
        );
      case "platform_logos":
        return this.parser<IGDBPlatformLogosDocument>(
          "platform_logos",
          this.IGDBPlatformLogosModel
        );
      case "websites":
        return this.parser<IGDBWebsitesDocument>(
          "websites",
          this.IGDBWebsitesModel
        );
      case "involved_companies":
        return this.parser<IGDBInvolvedCompaniesDocument>(
          "involved_companies",
          this.IGDBInvolvedCompaniesModel
        );
      case "companies":
        return this.parser<IGDBCompaniesDocument>(
          "companies",
          this.IGDBCompaniesModel
        );
      case "release_dates":
        return this.parser<IGDBReleaseDatesDocument>(
          "release_dates",
          this.IGDBReleaseDatesModel
        );
      case "game_types":
        return this.parser<IGDBGameTypesDocument>(
          "game_types",
          this.IGDBGameTypesModel
        );
    }
  }

  async getToken() {
    const { data: authData } = await igdbAuth();
    return authData;
  }

  async getGamesCount() {
    return this.IGDBGamesModel.countDocuments();
  }

  async igdbToGames(page: number, limit: number) {
    const games = await this.IGDBGamesModel.find()
      .skip((page - 1) * limit)
      .limit(limit);
    const gamesLength = games.length;

    console.log("IGDB games loaded", gamesLength);

    const queries = games.map(async (game) => {
      if (!game) return;

      const _id = new mongoose.Types.ObjectId();

      const existed = await this.Games.findOne({ "igdb.gameId": game._id });

      const populatedGame: Omit<
        IGDBGamesDocument,
        | "game_type"
        | "cover"
        | "game_modes"
        | "genres"
        | "keywords"
        | "themes"
        | "screenshots"
        | "artworks"
        | "involved_companies"
        | "websites"
        | "release_dates"
        | "platforms"
      > & {
        game_type: IGDBGameTypesDocument;
        cover: IGDBCoverDocument;
        game_modes: IGDBModesDocument[];
        genres: IGDBGenresDocument[];
        keywords: IGDBKeywordsDocument[];
        themes: IGDBThemesDocument[];
        screenshots: IGDBScreenshotsDocument[];
        artworks: IGDBArtworksDocument[];
        involved_companies: (Omit<IGDBInvolvedCompaniesDocument, "company"> & {
          company: IGDBCompaniesDocument;
        })[];
        websites: IGDBWebsitesDocument[];
        release_dates: IGDBReleaseDatesDocument[];
        platforms: IGDBPlatformsDocument[];
      } = await game.populate(
        "game_type cover game_modes genres keywords themes screenshots artworks websites release_dates platforms"
      );

      const populatedCompanies: any =
        await this.IGDBInvolvedCompaniesModel.find({
          _id: { $in: populatedGame.involved_companies },
        }).populate("company");

      populatedGame.involved_companies = populatedCompanies;

      const platformIds = await this.Platforms.find({
        igdbId: { $in: game.platforms },
      }).select("_id igdbId");

      const parsedScreenshots = !!existed?.screenshots.length
        ? existed.screenshots
        : await this.parseImagesToS3(
            populatedGame.screenshots,
            _id.toString(),
            "mooncellar-screenshots"
          );

      const parsedArtworks = !!existed?.artworks.length
        ? existed.artworks
        : await this.parseImagesToS3(
            populatedGame.artworks,
            _id.toString(),
            "mooncellar-artworks"
          );

      const parsedCovers = !!existed?.cover
        ? [existed.cover]
        : await this.parseImagesToS3(
            [populatedGame.cover],
            _id.toString(),
            "mooncellar-covers",
            true
          );

      return {
        _id: existed?._id || _id,
        slug: populatedGame.slug,
        name: populatedGame.name,
        type:
          populatedGame?.game_type?.type ||
          populatedGame?.category ||
          existed?.type ||
          null,
        cover: parsedCovers?.[0],
        storyline: game.storyline,
        summary: game.summary,
        modes: populatedGame.game_modes.map((mode) => mode.name),
        genres: populatedGame.genres.map((genre) => genre.name),
        keywords: populatedGame.keywords.map((keyword) => keyword.name),
        themes: populatedGame.themes.map((theme) => theme.name),
        screenshots: parsedScreenshots,
        artworks: parsedArtworks,
        companies: populatedGame.involved_companies.map((comp) => ({
          name: comp.company.name,
          developer: comp.developer,
          publisher: comp.publisher,
          porting: comp.porting,
          supporting: comp.supporting,
        })),
        websites: populatedGame.websites.map((site) => site.url),
        first_release: populatedGame.first_release_date,
        release_dates: populatedGame.release_dates?.map((date) => ({
          date: date.date,
          human: date.human,
          month: date.m,
          year: date.y,
          platformId: platformIds.find((plat) => plat.igdbId === date.platform)
            ?._id,
          region: date.region,
        })),
        platformIds: platformIds.map((plat) => plat._id),
        igdb: {
          gameId: game._id,
          total_rating: game.total_rating,
          total_rating_count: game.total_rating_count,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const parsedGames = await Promise.all(queries);

    console.log("Games parsed");

    return await this.Games.bulkWrite(
      parsedGames.map((game) => ({
        updateOne: {
          filter: { _id: game._id },
          update: { $set: game },
          upsert: true,
        },
      }))
    );
  }

  async parseImagesToS3(
    images: IGDBScreenshotsDocument[],
    gameId: string,
    bucketName: string,
    isCover?: boolean
  ) {
    const result: string[] = [];

    for (const i in images) {
      if (!images?.[i]?.url) continue;

      const url = getImageLink(
        images[i]?.url,
        isCover ? "cover_big" : "1080p",
        isCover ? 2 : undefined
      );
      try {
        const response = await this.httpService.axiosRef({
          url,
          method: "GET",
          responseType: "arraybuffer",
        });

        const key = `${gameId}_${i}`;

        result.push(`https://${bucketName}.s3.regru.cloud/${key}`);

        await this.fileService.uploadFile(response.data, key, bucketName);
      } catch (e) {
        console.error(e);
      }
    }

    return result;
  }

  async igdbToPlatforms() {
    const platforms: any[] = await this.IGDBPlatformsModel.find()
      .populate("platform_logo")
      .populate("platform_family");

    for (const platform of platforms) {
      const ra = await this.RAPlatforms.findOne({ igdbIds: platform._id });

      if (!platform) return;

      await this.Platforms.create({
        name: platform.name,
        slug: platform.slug,
        generation: platform?.generation || null,
        ...(!!platform.platform_family && {
          family: {
            name: platform.platform_family.name,
            slug: platform.platform_family.slug,
          },
        }),
        ...(!!platform.platform_logo && {
          logo: getImageLink(platform.platform_logo.url, "thumb"),
        }),
        igdbId: platform._id,
        raId: ra?._id || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return "Completed";
  }
}
