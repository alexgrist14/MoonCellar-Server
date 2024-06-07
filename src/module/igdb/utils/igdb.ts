import axios from 'axios';
import { IGDBAuth } from '../interface/auth.interface';
import { ParserType } from '../interface/common.interface';

export const igdbAuth = () =>
  axios.post<IGDBAuth>(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
  );

export const igdbAgent = <T>(url: string, token: string, params?: any) => {
  return axios.request<T>({
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
      return 'https://api.igdb.com/v4/platforms';
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

const parser = async ({
  token,
  callback,
  type,
  parsingCallback,
}: {
  token: string;
  callback: (items: unknown) => Promise<unknown>;
  type: ParserType;
  parsingCallback?: (items: unknown) => unknown;
}) => {
  const url = getLink(type);
  const limit = 500;
  const fields = getFields(type);

  const { data } = await igdbAgent<{ count: number }>(url + '/count', token);
  const total = data.count;

  let run = 0;
  const items = [];

  console.log(`Start parsing ${total} items with type: ${type}`);

  const fetch = async () => {
    return igdbAgent(url, token, {
      fields,
      limit,
      offset: run * limit,
    });
  };

  const hui = async (): Promise<unknown> => {
    try {
      const response = await fetch();

      if (response.status !== 200) {
        return hui();
      } else {
        run++;

        if (run <= Math.ceil(total / limit)) {
          !!parsingCallback
            ? items.push(...((await parsingCallback(response.data)) as []))
            : items.push(...(response.data as []));
          console.log(run, items.length);
          return hui();
        } else {
          return callback(items);
        }
      }
    } catch (e) {
      console.log(e);
      return hui();
    }
  };

  return hui();
};

export const igdbParser = (
  token: string,
  action: ParserType,
  callback: (games: unknown) => Promise<unknown>,
  parsingCallback?: (items: unknown) => unknown,
) => {
  return parser({
    token,
    callback,
    type: action,
    parsingCallback,
  });
};
