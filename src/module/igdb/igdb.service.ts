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
import { IGDBGames, IGDBGamesDocument } from './schemas/igdb-games.schema';
import {
  IGDBCoverINT,
  IGDBFamilyINT,
  IGDBGenreINT,
  IGDBModeINT,
  IGDBPlatformINT,
} from './interface/scheme.interface';
import { IGDBGame, IGDBPlatform } from './interface/igdb.interface';
import { IGDBModes, IGDBModesDocument } from './schemas/igdb-modes.schema';
import { IGDBFilters, ParserType } from './interface/common.interface';
import { shuffle } from 'src/shared/shuffle';
import mongoose from 'mongoose';

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
  ) {}

  private async getCount(model: Model<unknown>) {
    console.log(`${model.modelName}: ${await model.countDocuments({})}`);
    console.log('');
  }

  private async platformParser(families?: IGDBFamilyINT[]) {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    await this.IGDBPlatformsModel.deleteMany({});

    const tempFamilies = families || (await this.IGDBFamiliesModel.find());

    return igdbParser(
      access_token,
      'platforms',
      (platforms: IGDBPlatform[]) => {
        return this.IGDBPlatformsModel.insertMany(
          platforms.map((platform) => ({
            ...platform,
            platform_family:
              tempFamilies.find(
                (family) => family.id === platform.platform_family,
              )?._id || null,
          })),
        );
      },
    );
  }
  private async familiesParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser(access_token, 'families', async (families) => {
      await this.IGDBFamiliesModel.deleteMany({});
      return this.IGDBFamiliesModel.insertMany(families);
    });
  }

  private async modesParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser(access_token, 'modes', async (modes) => {
      await this.IGDBModesModel.deleteMany({});
      return this.IGDBModesModel.insertMany(modes);
    });
  }

  private async genresParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;
    if (!access_token) return;
    return igdbParser(access_token, 'genres', async (genres) => {
      await this.IGDBGenresModel.deleteMany({});
      return this.IGDBGenresModel.insertMany(genres);
    });
  }

  private async coversParser() {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser(access_token, 'covers', async (covers) => {
      await this.IGDBCoversModel.deleteMany({});
      return this.IGDBCoversModel.insertMany(covers);
    });
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
    const games = await this.IGDBGamesModel.aggregate([
      {
        $match: {
          ...(!!search && { name: { $regex: search, $options: 'i' } }),
          ...(rating !== undefined && { total_rating: { $gte: +rating } }),
          ...(!!selected?.genres?.length && {
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
          }),
          ...(!!excluded?.genres?.length && {
            genres: {
              $nin: Array.isArray(selected?.genres)
                ? selected?.genres.map(
                    (genre) => new mongoose.Types.ObjectId(genre),
                  )
                : [new mongoose.Types.ObjectId(selected?.genres)],
            },
          }),
          ...(!!selected?.platforms?.length && {
            platforms:
              mode === 'any'
                ? {
                    $in: Array.isArray(selected?.platforms)
                      ? selected?.platforms.map(
                          (item) => new mongoose.Types.ObjectId(item),
                        )
                      : [new mongoose.Types.ObjectId(selected?.platforms)],
                  }
                : {
                    $all: Array.isArray(selected?.platforms)
                      ? selected?.platforms.map(
                          (item) => new mongoose.Types.ObjectId(item),
                        )
                      : [new mongoose.Types.ObjectId(selected?.platforms)],
                  },
          }),
          ...(!!excluded?.platforms?.length && {
            platforms: {
              $nin: Array.isArray(selected?.platforms)
                ? selected?.platforms.map(
                    (platform) => new mongoose.Types.ObjectId(platform),
                  )
                : [new mongoose.Types.ObjectId(selected?.platforms)],
            },
          }),
          ...(!!selected?.modes?.length && {
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
          }),
          ...(!!excluded?.modes?.length && {
            modes: {
              $nin: Array.isArray(selected?.modes)
                ? selected?.modes.map(
                    (mode) => new mongoose.Types.ObjectId(mode),
                  )
                : [new mongoose.Types.ObjectId(selected?.modes)],
            },
          }),
        },
      },
      ...(isRandom === 'false' ? [{ $skip: (+page - 1) * +take }] : []),
      ...(isRandom === 'true'
        ? [{ $sample: { size: +take } }]
        : [{ $limit: +take }]),
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
    ]);

    return isRandom === 'true' ? shuffle(games) : games;
  }

  async getGenres() {
    return this.IGDBGenresModel.find();
  }

  async getPlatforms() {
    return this.IGDBPlatformsModel.find();
  }

  async getGameModes() {
    return this.IGDBModesModel.find();
  }

  private async gamesParser({
    covers,
    genres,
    modes,
    platforms,
  }: {
    genres?: IGDBGenreINT[];
    modes?: IGDBModeINT[];
    covers?: IGDBCoverINT[];
    platforms?: IGDBPlatformINT[];
  }) {
    const { data: authData } = await igdbAuth();
    const { access_token } = authData;

    if (!access_token) return;

    return igdbParser(
      access_token,
      'games',
      async (games: IGDBGame[]) => {
        await this.IGDBGamesModel.deleteMany({});
        return this.IGDBGamesModel.insertMany(games);
      },
      async (games: IGDBGame[]) => {
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

        return games.map((game) => ({
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
      },
    );
  }

  async parseAll() {
    this.modesParser().then((modes: IGDBModeINT[]) => {
      this.getCount(this.IGDBModesModel);
      this.familiesParser().then((families: IGDBFamilyINT[]) => {
        this.getCount(this.IGDBFamiliesModel);
        this.platformParser(families).then((platforms: IGDBPlatformINT[]) => {
          this.getCount(this.IGDBPlatformsModel);
          this.genresParser().then((genres: IGDBGenreINT[]) => {
            this.getCount(this.IGDBGenresModel);
            this.coversParser().then((covers: IGDBCoverINT[]) => {
              this.getCount(this.IGDBCoversModel);
              this.gamesParser({ covers, genres, modes, platforms }).then(
                () => {
                  this.getCount(this.IGDBGamesModel);
                },
              );
            });
          });
        });
      });
    });
  }

  async parseSelected(type: ParserType) {
    switch (type) {
      case 'games':
        this.gamesParser({}).then(() => this.getCount(this.IGDBGamesModel));
        break;
      case 'covers':
        this.coversParser().then(() => this.getCount(this.IGDBCoversModel));
        break;
      case 'genres':
        this.genresParser().then(() => this.getCount(this.IGDBGenresModel));
        break;
      case 'modes':
        this.modesParser().then(() => this.getCount(this.IGDBModesModel));
        break;
      case 'families':
        this.familiesParser().then(() => this.getCount(this.IGDBFamiliesModel));
        break;
      case 'platforms':
        this.platformParser().then(() =>
          this.getCount(this.IGDBPlatformsModel),
        );
    }
  }
}
