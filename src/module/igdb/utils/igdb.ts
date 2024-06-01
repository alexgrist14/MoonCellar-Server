import axios from 'axios';
import { Model } from 'mongoose';
import { IGDBGameDocument } from '../schemas/igdb-games.schema';

export const igdbAuth = () =>
  axios.post(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
  );

export const igdbAgent = (url: string, token: string, params?: any) => {
  return axios.request({
    url: 'https://gigatualet.ru:4000',
    method: 'post',
    withCredentials: false,
    params,
    headers: {
      Accept: 'application/json',
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      'Target-URL': url,
    },
  });
};

const getLink = (type: string) => {
  switch (type) {
    case 'games':
      return 'https://api.igdb.com/v4/games';
    case 'covers':
      return 'https://api.igdb.com/v4/covers';
    case 'genres':
      return 'https://api.igdb.com/v4/genres';
    case 'modes':
      return 'https://api.igdb.com/v4/game_modes';
    case 'platforms':
      return 'https://api.igdb.com/v4/paltforms';
    case 'families':
      return 'https://api.igdb.com/v4/platform_families';
  }
};

const getFields = (type: string) => {
  switch (type) {
    case 'games':
      return 'name, cover, screenshots, slug, total_rating, artworks, franchise, franchises, game_modes, genres, platforms, tags, themes, url';
    case 'covers':
      return 'url, game';
    case 'genres':
      return 'name, slug, url';
    case 'modes':
      return 'name, slug';
    case 'platforms':
      return 'name, slug, platform_family, platform_logo, created_at, generation';
    case 'families':
      return 'name, slug';
  }
};

const getModel = (type: string) => {
  switch (type) {
    case 'games':
      return Model<IGDBGameDocument>;
  }
};

let run = 0;

const parser = async ({
  token,
  callback,
  type,
  model,
}: {
  token: string;
  callback: (games: any) => void;
  type: string;
  model: Model<IGDBGameDocument>;
}) => {
  const url = getLink(type);
  const limit = 500;
  const fields = getFields(type);

  const { data } = await igdbAgent(url + '/count', token);
  const total = data.count;

  const fetch = async () => {
    return igdbAgent(url, token, {
      fields,
      limit,
      offset: run * limit,
    });
  };

  const hui = async () => {
    try {
      const response = await fetch();

      if (response.status !== 200) {
        hui();
      } else {
        console.log(
          `offset: ${run * limit} | length: ${(await model.countDocuments({})) + response.data.length}`,
        );
        callback(response.data);

        run++;

        if (run <= total / limit) {
          hui();
        }
      }
    } catch (e) {
      console.log(e);
      hui();
    }
  };

  hui();
};

export const igdbParser = (
  token: string,
  action: 'games' | 'genres' | 'covers' | 'modes' | 'platforms' | 'families',
  callback: (games: any[]) => void,
  model: Model<IGDBGameDocument>,
) => {
  parser({
    token,
    callback,
    type: action,
    model,
  });
};
