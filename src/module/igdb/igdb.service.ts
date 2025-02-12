import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { igdbAuth, igdbParser } from './utils/igdb';
import { IGDBCoverDocument, IGDBCovers } from './schemas/igdb-covers.schema';
import { IGDBGenres, IGDBGenresDocument } from './schemas/igdb-genres.schema';
import {
  IGDBFamilies,
  IGDBFamiliesDocument,
} from './schemas/igdb-families.schema';
import {
  IGDBPlatforms,
  IGDBPlatformsDocument,
} from './schemas/igdb-platforms.schema';
import { IGDBModes, IGDBModesDocument } from './schemas/igdb-modes.schema';
import { IGDBFilters, ParserType } from './interface/common.interface';
import {
  IGDBKeywords,
  IGDBKeywordsDocument,
} from './schemas/igdb-keywords.schema';
import {
  IGDBScreenshots,
  IGDBScreenshotsDocument,
} from './schemas/igdb-screenshots.schema';
import {
  IGDBArtworks,
  IGDBArtworksDocument,
} from './schemas/igdb-artworks.schema';
import { IGDBThemes, IGDBThemesDocument } from './schemas/igdb-themes.schema';
import {
  IGDBPlatformLogos,
  IGDBPlatformLogosDocument,
} from './schemas/igdb-platform-logos.schema';
import {
  IGDBGames,
  IGDBGamesDocument,
} from 'src/shared/schemas/igdb-games.schema';
import { categories as gameCategories } from './constants/common';
import { updateOrInsertValues } from 'src/shared/db';
import {
  IGDBWebsites,
  IGDBWebsitesDocument,
} from './schemas/igdb-websites.schema';
import {
  IGDBInvolvedCompanies,
  IGDBInvolvedCompaniesDocument,
} from './schemas/igdb-involved-companies.schema';
import {
  IGDBCompanies,
  IGDBCompaniesDocument,
} from './schemas/igdb-companies.schema';
import {
  IGDBReleaseDates,
  IGDBReleaseDatesDocument,
} from './schemas/igdb-release-dates.schema';
import { gamesLookup } from 'src/shared/utils';
import { RAGame } from '../retroach/schemas/retroach.schema';
import { RAConsole } from '../retroach/schemas/console.schema';
import { promises as fs } from 'fs';
import { join } from 'path';

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
    @InjectModel(RAGame.name)
    private RAGamesModel: Model<RAGame>,
    @InjectModel(RAConsole.name)
    private RAConsoleModel: Model<RAConsole>,
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

  async getGameById(id: string) {
    const game = this.IGDBGamesModel.aggregate([
      { $match: { _id: id } },
      ...gamesLookup(),
    ]);

    return (await game).pop();
  }

  async getGameBySlug(slug: string) {
    const game = this.IGDBGamesModel.aggregate([
      { $match: { slug: slug } },
      ...gamesLookup(),
    ]);

    return (await game).pop();
  }

  async getGames({
    take = 50,
    isRandom = false,
    page = 1,
    selected,
    excluded,
    rating,
    search,
    mode = 'any',
    company,
    categories,
    years,
    votes,
    excludeGames,
  }: {
    take?: number | string;
    isRandom?: boolean | string;
    page?: number | string;
    selected?: IGDBFilters;
    excluded?: IGDBFilters;
    rating?: number | string;
    votes?: string;
    search?: string;
    company?: string;
    years?: [number, number];
    categories?: (keyof typeof gameCategories)[];
    mode?: 'any' | 'all';
    excludeGames?: number[];
  }) {
    const companies = !!company
      ? (
          await this.IGDBCompaniesModel.find({
            name: {
              $regex: `${company.replaceAll(' ', '\\s*')}`,
              $options: 'i',
            },
          })
        )?.map((company) => company._id)
      : [];

    const filters = {
      $match: {
        $and: [
          { genres: { $exists: true } },
          { keywords: { $exists: true } },
          { themes: { $exists: true } },
          { platforms: { $exists: true } },
          { game_modes: { $exists: true } },
          ...(!!excludeGames?.length
            ? [{ _id: { $nin: excludeGames.map((id) => Number(id)) } }]
            : []),
          {
            category: !!categories
              ? { $in: categories.map((category) => gameCategories[category]) }
              : {
                  $in: [
                    gameCategories.main_game,
                    gameCategories.expansion,
                    gameCategories.standalone_expansion,
                    gameCategories.remake,
                    gameCategories.remaster,
                    gameCategories.expanded_game,
                    gameCategories.port,
                    gameCategories.bundle,
                    gameCategories.mod,
                    gameCategories.dlc_addon,
                  ],
                },
          },
          ...(!!search
            ? [
                {
                  name: {
                    $regex: search.replaceAll(' ', '\\s*'),
                    $options: 'i',
                  },
                },
              ]
            : []),
          ...(!!years
            ? [
                {
                  first_release_date: {
                    $gte: new Date(years[0]).getTime() / 1000,
                    $lte:
                      (new Date((+years[1] + 1).toString()).getTime() -
                        24 * 60 * 60 * 1000) /
                      1000,
                  },
                },
              ]
            : []),
          ...(!!company
            ? [
                {
                  involved_companies: {
                    $in: (
                      await this.IGDBInvolvedCompaniesModel.find({
                        company: {
                          $in: companies,
                        },
                      })
                    )?.map((company) => company._id),
                  },
                },
              ]
            : []),
          ...(rating !== undefined
            ? [{ total_rating: { $gte: +rating } }]
            : []),
          ...(votes !== undefined
            ? [{ total_rating_count: { $gte: +votes } }]
            : []),
          ...(!!selected?.keywords?.length
            ? [
                {
                  keywords:
                    mode === 'any'
                      ? {
                          $in: Array.isArray(selected?.keywords)
                            ? selected?.keywords
                            : [selected?.keywords],
                        }
                      : {
                          $all: Array.isArray(selected?.keywords)
                            ? selected?.keywords
                            : [selected?.keywords],
                        },
                },
              ]
            : []),
          ...(!!selected?.themes?.length
            ? [
                {
                  themes:
                    mode === 'any'
                      ? {
                          $in: Array.isArray(selected?.themes)
                            ? selected?.themes.map((theme) => theme)
                            : [selected?.themes],
                        }
                      : {
                          $all: Array.isArray(selected?.themes)
                            ? selected?.themes.map((theme) => theme)
                            : [selected?.themes],
                        },
                },
              ]
            : []),
          ...(!!excluded?.themes?.length
            ? [
                {
                  themes: {
                    $nin: Array.isArray(excluded?.themes)
                      ? excluded?.themes.map((theme) => theme)
                      : [excluded?.themes],
                  },
                },
              ]
            : []),
          ...(!!selected?.genres?.length
            ? [
                {
                  genres:
                    mode === 'any'
                      ? {
                          $in: Array.isArray(selected?.genres)
                            ? selected?.genres.map((genre) => genre)
                            : [selected?.genres],
                        }
                      : {
                          $all: Array.isArray(selected?.genres)
                            ? selected?.genres.map((genre) => genre)
                            : [selected?.genres],
                        },
                },
              ]
            : []),
          ...(!!excluded?.genres?.length
            ? [
                {
                  genres: {
                    $nin: Array.isArray(excluded?.genres)
                      ? excluded?.genres.map((genre) => genre)
                      : [excluded?.genres],
                  },
                },
              ]
            : []),
          ...(!!selected?.platforms?.length
            ? [
                {
                  platforms:
                    mode === 'any'
                      ? {
                          $in: Array.isArray(selected?.platforms)
                            ? selected?.platforms.map((item) => item)
                            : [selected?.platforms],
                        }
                      : {
                          $all: Array.isArray(selected?.platforms)
                            ? selected?.platforms.map((item) => item)
                            : [selected?.platforms],
                        },
                },
              ]
            : []),
          ...(!!excluded?.platforms?.length
            ? [
                {
                  platforms: {
                    $nin: Array.isArray(excluded?.platforms)
                      ? excluded?.platforms.map((platform) => platform)
                      : [excluded?.platforms],
                  },
                },
              ]
            : []),
          ...(!!selected?.modes?.length
            ? [
                {
                  game_modes:
                    mode === 'any'
                      ? {
                          $in: Array.isArray(selected?.modes)
                            ? selected?.modes.map((item) => item)
                            : [selected?.modes],
                        }
                      : {
                          $all: Array.isArray(selected?.modes)
                            ? selected?.modes.map((item) => item)
                            : [selected?.modes],
                        },
                },
              ]
            : []),
          ...(!!excluded?.modes?.length
            ? [
                {
                  game_modes: {
                    $nin: Array.isArray(excluded?.modes)
                      ? excluded?.modes.map((mode) => mode)
                      : [excluded?.modes],
                  },
                },
              ]
            : []),
        ],
      },
    };

    const pagination = [{ $skip: (+page - 1) * +take }, { $limit: +take }];

    const games = await this.IGDBGamesModel.aggregate([
      filters,
      { $sort: { total_rating_count: -1 } },
      {
        $facet: {
          results: [
            ...(isRandom ? [{ $sample: { size: +take } }] : pagination),
            ...gamesLookup(true),
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
      {
        $addFields: {
          total: {
            $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0],
          },
        },
      },
      {
        $project: {
          results: 1,
          total: 1,
        },
      },
    ]);

    return games.pop();
  }

  async getScreenshot(id: number) {
    const screenshot = await this.IGDBScreenshotsModel.findById(id);

    return screenshot || null;
  }

  async getArtwork(id: number) {
    const artwork = await this.IGDBArtworksModel.findById(id);

    return artwork || null;
  }

  async getGenres() {
    return this.IGDBGenresModel.find().sort({ name: 1 });
  }

  async getPlatforms() {
    return this.IGDBPlatformsModel.find()
      .populate('platform_logo')
      .sort({ name: 1 });
  }

  async getThemes() {
    return this.IGDBThemesModel.find().sort({ name: 1 });
  }

  async getKeywords() {
    return this.IGDBKeywordsModel.find().sort({ name: 1 });
  }

  async getGameModes() {
    return this.IGDBModesModel.find().sort({ name: 1 });
  }

  async parseAll() {
    await this.parser<IGDBCompaniesDocument>(
      'companies',
      this.IGDBCompaniesModel,
    );
    await this.parser<IGDBWebsitesDocument>('websites', this.IGDBWebsitesModel);
    await this.parser<IGDBInvolvedCompaniesDocument>(
      'involved_companies',
      this.IGDBInvolvedCompaniesModel,
    );
    await this.parser<IGDBThemesDocument>('themes', this.IGDBThemesModel);
    await this.parser<IGDBKeywordsDocument>('keywords', this.IGDBKeywordsModel);
    await this.parser<IGDBModesDocument>('modes', this.IGDBModesModel);
    await this.parser<IGDBPlatformLogosDocument>(
      'platform_logos',
      this.IGDBPlatformLogosModel,
    );
    await this.parser<IGDBFamiliesDocument>('families', this.IGDBFamiliesModel);
    await this.parser<IGDBPlatformsDocument>(
      'platforms',
      this.IGDBPlatformsModel,
    );
    await this.parser<IGDBGenresDocument>('genres', this.IGDBGenresModel);
    await this.parser<IGDBScreenshotsDocument>(
      'screenshots',
      this.IGDBScreenshotsModel,
    );
    await this.parser<IGDBArtworksDocument>('artworks', this.IGDBArtworksModel);
    await this.parser<IGDBCoverDocument>('covers', this.IGDBCoversModel);
    await this.parser<IGDBReleaseDatesDocument>(
      'release_dates',
      this.IGDBReleaseDatesModel,
    );

    return this.parser<IGDBGamesDocument>('games', this.IGDBGamesModel);
  }

  async parseSelected(type: ParserType) {
    switch (type) {
      case 'games':
        return this.parser<IGDBGamesDocument>('games', this.IGDBGamesModel);
      case 'covers':
        return this.parser<IGDBCoverDocument>('covers', this.IGDBCoversModel);
      case 'genres':
        return this.parser<IGDBGenresDocument>('genres', this.IGDBGenresModel);
      case 'modes':
        return this.parser<IGDBModesDocument>('modes', this.IGDBModesModel);
      case 'families':
        return this.parser<IGDBFamiliesDocument>(type, this.IGDBFamiliesModel);
      case 'platforms':
        return this.parser<IGDBPlatformsDocument>(
          'platforms',
          this.IGDBPlatformsModel,
        );
      case 'keywords':
        return this.parser<IGDBKeywordsDocument>(
          'keywords',
          this.IGDBKeywordsModel,
        );
      case 'themes':
        return this.parser<IGDBThemesDocument>('themes', this.IGDBThemesModel);
      case 'screenshots':
        return this.parser<IGDBScreenshotsDocument>(
          'screenshots',
          this.IGDBScreenshotsModel,
        );
      case 'artworks':
        return this.parser<IGDBArtworksDocument>(
          'artworks',
          this.IGDBArtworksModel,
        );
      case 'platform_logos':
        return this.parser<IGDBPlatformLogosDocument>(
          'platform_logos',
          this.IGDBPlatformLogosModel,
        );
      case 'websites':
        return this.parser<IGDBWebsitesDocument>(
          'websites',
          this.IGDBWebsitesModel,
        );
      case 'involved_companies':
        return this.parser<IGDBInvolvedCompaniesDocument>(
          'involved_companies',
          this.IGDBInvolvedCompaniesModel,
        );
      case 'companies':
        return this.parser<IGDBCompaniesDocument>(
          'companies',
          this.IGDBCompaniesModel,
        );
      case 'release_dates':
        return this.parser<IGDBReleaseDatesDocument>(
          'release_dates',
          this.IGDBReleaseDatesModel,
        );
    }
  }

  async getToken() {
    const { data: authData } = await igdbAuth();
    return authData;
  }

  async parseRAGames() {
    const raConsoles = await this.RAConsoleModel.find();
    const raGames = await this.RAGamesModel.find();
    const IGDBGames = await this.IGDBGamesModel.find().select('name platforms');

    const getFormattedTitle = (title: string) => {
      return title
        .replaceAll('The ', '')
        .replaceAll('The,', '')
        .replaceAll("Disney's", '')
        .replaceAll("Dreamworks'", '')
        .replaceAll('DreamWorks', '')
        .replaceAll('Dreamworks', '')
        .replaceAll(' and ', '')
        .replaceAll('James Bond', '')
        .replaceAll('~Hack~', '')
        .replaceAll('~Demo~', '')
        .replaceAll('~Homebrew~', '')
        .replaceAll('~Prototype~', '')
        .replaceAll('~Z~', '')
        .replaceAll('~Unlicensed~', '')
        .replace(/[^a-zA-Z0-9\|]/g, '')
        .toLowerCase();
    };

    const IGDBGamesSorted = IGDBGames.reduce(
      (
        result: {
          [key: string]: { _id: number; name: string; platforms: number[] }[];
        },
        game,
      ) => {
        const title = getFormattedTitle(game.name);

        Array.isArray(result[title]) && !!result[title]?.length
          ? result[title].push(game)
          : (result[title] = [game]);

        return result;
      },
      {},
    );

    const unrecognised = [];

    const gameIds = raGames.reduce((result, ragame) => {
      const title = getFormattedTitle(ragame.title);
      const igames: { _id: number; name: string; platforms: number[] }[] =
        title.includes('|')
          ? IGDBGamesSorted[title.split('|')[0]] ||
            IGDBGamesSorted[title.split('|')[1]]
          : IGDBGamesSorted[title];

      const raConsole = raConsoles.find(
        (console) => console.name === ragame.consoleName,
      );

      const tempRaGame = {
        ...ragame,
        consoleId: raConsole?.igdbIds || null,
      };

      const igame = igames?.find(
        (game) =>
          !!tempRaGame.consoleId &&
          game.platforms.some((id: number) =>
            tempRaGame.consoleId.includes(id),
          ),
      );

      if (!!igame) {
        !!result[igame._id]?.length
          ? result[igame._id].push(ragame.id)
          : (result[igame._id] = [ragame.id]);
      } else {
        unrecognised.push(ragame);
      }

      return result;
    }, {});

    // console.log(raConsoles);
    console.log(Object.values(gameIds).flat().length);
    // console.log(
    //   Object.values(gameIds)
    //     .flat()
    //     .find((id) => id == 14494),
    // );

    fs.writeFile(
      join(process.cwd(), 'db', 'unrecognised.json'),
      JSON.stringify(unrecognised),
    );

    await this.IGDBGamesModel.bulkWrite(
      Object.keys(gameIds).map((key) => ({
        updateOne: {
          filter: {
            _id: key,
          },
          update: { $set: { raIds: gameIds[key] } },
        },
      })),
    );
  }

  async testFunction() {
    console.time('Test');
    console.log();
    console.timeEnd('Test');

    console.time('Test 2');
    console.log();
    console.timeEnd('Test 2');
  }
}
