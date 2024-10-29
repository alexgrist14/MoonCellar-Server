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
import mongoose from 'mongoose';
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
import { getCount, updateOrInsertValues } from 'src/shared/db';

const lookupAll = [
  {
    $lookup: {
      from: 'igdbgenres',
      localField: 'genres',
      foreignField: '_id',
      as: 'genres',
    },
  },
  {
    $lookup: {
      from: 'igdbplatforms',
      localField: 'platforms',
      foreignField: '_id',
      as: 'platforms',
    },
  },
  {
    $lookup: {
      from: 'igdbmodes',
      localField: 'game_modes',
      foreignField: '_id',
      as: 'game_modes',
    },
  },
  {
    $lookup: {
      from: 'igdbcovers',
      localField: 'cover',
      foreignField: '_id',
      as: 'cover',
    },
  },
  {
    $lookup: {
      from: 'igdbscreenshots',
      localField: 'screenshots',
      foreignField: '_id',
      as: 'screenshots',
    },
  },
  {
    $lookup: {
      from: 'igdbartworks',
      localField: 'artworks',
      foreignField: '_id',
      as: 'artworks',
    },
  },
  {
    $lookup: {
      from: 'igdbkeywords',
      localField: 'keywords',
      foreignField: '_id',
      as: 'keywords',
    },
  },
  {
    $lookup: {
      from: 'igdbthemes',
      localField: 'themes',
      foreignField: '_id',
      as: 'themes',
    },
  },
  {
    $addFields: {
      cover: {
        $ifNull: [{ $arrayElemAt: ['$cover', 0] }, null],
      },
    },
  },
];

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
  ) {}

  private async platformParser(
    families?: IGDBFamiliesDocument[],
    logos?: IGDBPlatformLogosDocument[],
  ) {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    await this.IGDBPlatformsModel.deleteMany({});

    const tempFamilies = families || (await this.IGDBFamiliesModel.find());
    const tempLogos = logos || (await this.IGDBPlatformLogosModel.find());

    return igdbParser({
      token: access_token,
      action: 'platforms',
      parsingCallback: async (items: IGDBPlatformsDocument[]) => {
        await updateOrInsertValues<IGDBPlatformsDocument>(
          this.IGDBPlatformsModel,
          items.map((platform) => ({
            ...platform,
            platform_logo:
              tempLogos.find((logo) => logo.id === platform.platform_logo)
                ?._id || null,
            platform_family:
              tempFamilies.find(
                (family) => family.id === platform.platform_family,
              )?._id || null,
          })),
        );
      },
    });
  }

  private async familiesParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser({
      token: access_token,
      action: 'families',
      parsingCallback: async (items) => {
        await updateOrInsertValues<IGDBFamiliesDocument>(
          this.IGDBFamiliesModel,
          items,
        );
        getCount(this.IGDBFamiliesModel);
      },
    });
  }

  private async modesParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser({
      token: access_token,
      action: 'modes',
      parsingCallback: async (items) => {
        await updateOrInsertValues<IGDBModesDocument>(
          this.IGDBModesModel,
          items,
        );
        getCount(this.IGDBModesModel);
      },
    });
  }

  private async genresParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser({
      token: access_token,
      action: 'genres',
      parsingCallback: async (items) => {
        await updateOrInsertValues<IGDBGenresDocument>(
          this.IGDBGenresModel,
          items,
        );
        getCount(this.IGDBGenresModel);
      },
    });
  }

  private async keywordsParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser({
      token: access_token,
      action: 'keywords',
      parsingCallback: async (items) => {
        await updateOrInsertValues<IGDBKeywordsDocument>(
          this.IGDBKeywordsModel,
          items,
        );
        getCount(this.IGDBKeywordsModel);
      },
    });
  }

  private async themesParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser({
      token: access_token,
      action: 'themes',
      parsingCallback: async (items) => {
        await updateOrInsertValues<IGDBThemesDocument>(
          this.IGDBThemesModel,
          items,
        );
        getCount(this.IGDBThemesModel);
      },
    });
  }

  private async screenshotsParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser({
      token: access_token,
      action: 'screenshots',
      parsingCallback: async (items) => {
        await updateOrInsertValues<IGDBScreenshotsDocument>(
          this.IGDBScreenshotsModel,
          items,
        );
        getCount(this.IGDBScreenshotsModel);
      },
    });
  }

  private async artworksParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser({
      token: access_token,
      action: 'artworks',
      parsingCallback: async (items) => {
        await updateOrInsertValues<IGDBArtworksDocument>(
          this.IGDBArtworksModel,
          items,
        );
        getCount(this.IGDBArtworksModel);
      },
    });
  }

  private async platformLogosParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser({
      token: access_token,
      action: 'platform_logos',
      parsingCallback: async (items) => {
        await updateOrInsertValues<IGDBPlatformLogosDocument>(
          this.IGDBPlatformLogosModel,
          items,
        );
        getCount(this.IGDBPlatformLogosModel);
      },
    });
  }

  private async coversParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser({
      token: access_token,
      action: 'covers',
      parsingCallback: async (items) => {
        await updateOrInsertValues<IGDBCoverDocument>(
          this.IGDBCoversModel,
          items,
        );
        getCount(this.IGDBCoversModel);
      },
    });
  }

  async getGameById(id: string) {
    const game = this.IGDBGamesModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      ...lookupAll,
    ]);

    return (await game).pop();
  }

  async getGameBySlug(slug: string) {
    const game = this.IGDBGamesModel.aggregate([
      { $match: { slug: slug } },
      ...lookupAll,
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
                            ? selected?.genres.map(
                                (genre) => new mongoose.Types.ObjectId(genre),
                              )
                            : [new mongoose.Types.ObjectId(selected?.genres)],
                        }
                      : {
                          $all: Array.isArray(selected?.genres)
                            ? selected?.genres.map(
                                (genre) => new mongoose.Types.ObjectId(genre),
                              )
                            : [new mongoose.Types.ObjectId(selected?.genres)],
                        },
                },
              ]
            : []),
          ...(!!excluded?.genres?.length
            ? [
                {
                  genres: {
                    $nin: Array.isArray(excluded?.genres)
                      ? excluded?.genres.map(
                          (genre) => new mongoose.Types.ObjectId(genre),
                        )
                      : [new mongoose.Types.ObjectId(excluded?.genres)],
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
                            ? selected?.platforms.map(
                                (item) => new mongoose.Types.ObjectId(item),
                              )
                            : [
                                new mongoose.Types.ObjectId(
                                  selected?.platforms,
                                ),
                              ],
                        }
                      : {
                          $all: Array.isArray(selected?.platforms)
                            ? selected?.platforms.map(
                                (item) => new mongoose.Types.ObjectId(item),
                              )
                            : [
                                new mongoose.Types.ObjectId(
                                  selected?.platforms,
                                ),
                              ],
                        },
                },
              ]
            : []),
          ...(!!excluded?.platforms?.length
            ? [
                {
                  platforms: {
                    $nin: Array.isArray(excluded?.platforms)
                      ? excluded?.platforms.map(
                          (platform) => new mongoose.Types.ObjectId(platform),
                        )
                      : [new mongoose.Types.ObjectId(excluded?.platforms)],
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
                            ? selected?.modes.map(
                                (item) => new mongoose.Types.ObjectId(item),
                              )
                            : [new mongoose.Types.ObjectId(selected?.modes)],
                        }
                      : {
                          $all: Array.isArray(selected?.modes)
                            ? selected?.modes.map(
                                (item) => new mongoose.Types.ObjectId(item),
                              )
                            : [new mongoose.Types.ObjectId(selected?.modes)],
                        },
                },
              ]
            : []),
          ...(!!excluded?.modes?.length
            ? [
                {
                  game_modes: {
                    $nin: Array.isArray(excluded?.modes)
                      ? excluded?.modes.map(
                          (mode) => new mongoose.Types.ObjectId(mode),
                        )
                      : [new mongoose.Types.ObjectId(excluded?.modes)],
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
      { $sort: { total_rating: -1 } },
      filters,
      {
        $facet: {
          results: [...pagination, ...lookupAll],
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
    return this.IGDBPlatformsModel.find().sort({ name: 1 });
  }

  async getGameModes() {
    return this.IGDBModesModel.find().sort({ name: 1 });
  }

  private async gamesParser({
    covers,
    genres,
    modes,
    platforms,
    keywords,
    themes,
    screenshots,
    artworks,
  }: {
    genres?: IGDBGenresDocument[];
    modes?: IGDBModesDocument[];
    covers?: IGDBCoverDocument[];
    platforms?: IGDBPlatformsDocument[];
    keywords?: IGDBKeywordsDocument[];
    themes?: IGDBThemesDocument[];
    screenshots?: IGDBScreenshotsDocument[];
    artworks?: IGDBArtworksDocument[];
  }) {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser({
      token: access_token,
      action: 'games',
      parsingCallback: async (games: IGDBGamesDocument[]) => {
        const tempCovers =
          covers ||
          (await this.IGDBCoversModel.find({
            game: { $in: games.map((game) => game.id.toString()) },
          }));

        const tempPlatforms =
          platforms ||
          (await this.IGDBPlatformsModel.find({
            id: { $in: games.map((game) => game.platforms).flat() },
          }));

        const tempGenres =
          genres ||
          (await this.IGDBGenresModel.find({
            id: { $in: games.map((game) => game.genres).flat() },
          }));

        const tempModes =
          modes ||
          (await this.IGDBModesModel.find({
            id: { $in: games.map((game) => game.game_modes).flat() },
          }));

        const tempKeywords =
          keywords ||
          (await this.IGDBKeywordsModel.find({
            id: { $in: games.map((game) => game.keywords).flat() },
          }));

        const tempThemes =
          themes ||
          (await this.IGDBThemesModel.find({
            id: { $in: games.map((game) => game.themes).flat() },
          }));

        const tempScreenshots =
          screenshots ||
          (await this.IGDBScreenshotsModel.find({
            id: { $in: games.map((game) => game.screenshots).flat() },
          }));

        const tempArtworks =
          artworks ||
          (await this.IGDBArtworksModel.find({
            id: { $in: games.map((game) => game.artworks).flat() },
          }));

        const finalGames = games.map((game) => ({
          ...game,
          platforms:
            game.platforms?.reduce((result, id) => {
              const selectedId =
                tempPlatforms.find((item) => item.id === id)?._id || null;
              selectedId !== null && result.push(selectedId);
              return result;
            }, []) || null,
          genres:
            game.genres?.reduce((result, id) => {
              const selectedId =
                tempGenres.find((item) => item.id === id)?._id || null;
              selectedId !== null && result.push(selectedId);
              return result;
            }, []) || null,
          keywords:
            game.keywords?.reduce((result, id) => {
              const selectedId =
                tempKeywords.find((item) => item.id === id)?._id || null;
              selectedId !== null && result.push(selectedId);
              return result;
            }, []) || null,
          themes:
            game.themes?.reduce((result, id) => {
              const selectedId =
                tempThemes.find((item) => item.id === id)?._id || null;
              selectedId !== null && result.push(selectedId);
              return result;
            }, []) || null,
          screenshots:
            game.screenshots?.reduce((result, id) => {
              const selectedId =
                tempScreenshots.find((item) => item.id === id)?._id || null;
              selectedId !== null && result.push(selectedId);
              return result;
            }, []) || null,
          artworks:
            game.artworks?.reduce((result, id) => {
              const selectedId =
                tempArtworks.find((item) => item.id === id)?._id || null;
              selectedId !== null && result.push(selectedId);
              return result;
            }, []) || null,
          game_modes:
            game.game_modes?.reduce((result, id) => {
              const mode =
                tempModes.find((mode) => mode.id === id)?._id || null;
              mode !== null && result.push(mode);
              return result;
            }, []) || null,
          cover:
            tempCovers?.find((cover) => cover.id === game.cover)?._id || null,
        }));

        await updateOrInsertValues<IGDBGamesDocument>(
          this.IGDBGamesModel,
          finalGames,
        );

        getCount(this.IGDBGamesModel);
      },
    });
  }

  async parseAll() {
    this.themesParser().then(() => {
      getCount(this.IGDBThemesModel);
      this.keywordsParser().then(() => {
        getCount(this.IGDBKeywordsModel);
        this.modesParser().then((modes: IGDBModesDocument[]) => {
          getCount(this.IGDBModesModel);
          this.platformLogosParser().then(
            (logos: IGDBPlatformLogosDocument[]) => {
              getCount(this.IGDBFamiliesModel);
              this.familiesParser().then((families: IGDBFamiliesDocument[]) => {
                getCount(this.IGDBFamiliesModel);
                this.platformParser(families, logos).then(
                  (platforms: IGDBPlatformsDocument[]) => {
                    getCount(this.IGDBPlatformsModel);
                    this.genresParser().then((genres: IGDBGenresDocument[]) => {
                      getCount(this.IGDBGenresModel);
                      this.screenshotsParser().then(
                        (screenshots: IGDBScreenshotsDocument[]) => {
                          getCount(this.IGDBScreenshotsModel);
                          this.artworksParser().then(
                            (artworks: IGDBArtworksDocument[]) => {
                              getCount(this.IGDBScreenshotsModel);
                              this.coversParser().then(
                                (covers: IGDBCoverDocument[]) => {
                                  this.gamesParser({
                                    covers,
                                    genres,
                                    modes,
                                    platforms,
                                    screenshots,
                                    artworks,
                                  }).then(() => {
                                    getCount(this.IGDBGamesModel);
                                  });
                                },
                              );
                            },
                          );
                        },
                      );
                    });
                  },
                );
              });
            },
          );
        });
      });
    });
  }

  async parseSelected(type: ParserType) {
    switch (type) {
      case 'games':
        this.gamesParser({});
        break;
      case 'covers':
        this.coversParser();
        break;
      case 'genres':
        this.genresParser();
        break;
      case 'modes':
        this.modesParser();
        break;
      case 'families':
        this.familiesParser();
        break;
      case 'platforms':
        this.platformParser();
        break;
      case 'keywords':
        this.keywordsParser();
        break;
      case 'themes':
        this.themesParser();
        break;
      case 'screenshots':
        this.screenshotsParser();
        break;
      case 'artworks':
        this.artworksParser();
        break;
      case 'platform_logos':
        this.platformLogosParser();
        break;
    }
  }

  async getToken() {
    const { data: authData } = await igdbAuth();
    return authData;
  }
}
