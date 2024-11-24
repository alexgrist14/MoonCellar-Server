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
import { categories } from './constants/common';
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
  }: {
    take?: number | string;
    isRandom?: boolean | string;
    page?: number | string;
    selected?: IGDBFilters;
    excluded?: IGDBFilters;
    rating?: number | string;
    search?: string;
    mode?: 'any' | 'all';
  }) {
    const filters = {
      $match: {
        $and: [
          {
            category: {
              $in: [
                categories.main_game,
                categories.expansion,
                categories.standalone_expansion,
                categories.remake,
                categories.remaster,
                categories.expanded_game,
                categories.port,
                categories.bundle,
              ],
            },
          },
          ...(!!search ? [{ name: { $regex: search, $options: 'i' } }] : []),
          ...(rating !== undefined
            ? [{ total_rating: { $gte: +rating } }]
            : []),
          { genres: { $exists: true } },
          { keywords: { $exists: true } },
          { platforms: { $exists: true } },
          { game_modes: { $exists: true } },
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

    const pagination = [
      ...(isRandom === 'true' ? [] : [{ $skip: (+page - 1) * +take }]),
      ...(isRandom === 'true'
        ? [{ $sample: { size: +take } }]
        : [{ $limit: +take }]),
    ];

    const games = await this.IGDBGamesModel.aggregate([
      { $sort: { total_rating_count: -1 } },
      filters,
      {
        $facet: {
          results: [...pagination, ...gamesLookup(true)],
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

  async getGenres() {
    return this.IGDBGenresModel.find().sort({ name: 1 });
  }

  async getPlatforms() {
    return this.IGDBPlatformsModel.find()
      .populate('platform_logo')
      .sort({ name: 1 });
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
}
