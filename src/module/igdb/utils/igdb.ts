import axios from "axios";
import { IGDBAuth } from "../interface/auth.interface";
import { ParserType } from "../interface/common.interface";

export const igdbAuth = () =>
  axios.post<IGDBAuth>(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
  );

export const igdbAgent = <T>(url: string, token: string, params?: any) => {
  return axios.request<T>({
    url: "https://mooncellar.space:4000",
    method: "post",
    withCredentials: false,
    params,
    headers: {
      Accept: "application/json",
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Target-URL": url,
    },
  });
};

const getLink = (type: ParserType) => {
  switch (type) {
    case "games":
      return "https://api.igdb.com/v4/games";
    case "covers":
      return "https://api.igdb.com/v4/covers";
    case "genres":
      return "https://api.igdb.com/v4/genres";
    case "modes":
      return "https://api.igdb.com/v4/game_modes";
    case "platforms":
      return "https://api.igdb.com/v4/platforms";
    case "families":
      return "https://api.igdb.com/v4/platform_families";
    case "keywords":
      return "https://api.igdb.com/v4/keywords";
    case "themes":
      return "https://api.igdb.com/v4/themes";
    case "screenshots":
      return "https://api.igdb.com/v4/screenshots";
    case "artworks":
      return "https://api.igdb.com/v4/artworks";
    case "platform_logos":
      return "https://api.igdb.com/v4/platform_logos";
    case "websites":
      return "https://api.igdb.com/v4/websites";
    case "involved_companies":
      return "https://api.igdb.com/v4/involved_companies";
    case "companies":
      return "https://api.igdb.com/v4/companies";
    case "release_dates":
      return "https://api.igdb.com/v4/release_dates";
    case "game_types":
      return "https://api.igdb.com/v4/game_types";
  }
};

const getFields = (type: ParserType) => {
  switch (type) {
    case "games":
      return "name, cover, screenshots, slug, total_rating, artworks, game_modes, genres, platforms, keywords, themes, aggregated_rating, game_type, storyline, summary, first_release_date, involved_companies, websites, release_dates, url, total_rating_count";
    case "covers":
      return "url, game, width, height";
    case "genres":
      return "name, slug";
    case "modes":
      return "name, slug";
    case "platforms":
      return "name, slug, platform_family, platform_logo, created_at, generation";
    case "families":
      return "name, slug";
    case "keywords":
      return "name, slug";
    case "themes":
      return "name, slug";
    case "screenshots":
      return "url, width, height";
    case "artworks":
      return "url, width, height";
    case "platform_logos":
      return "url, width, height";
    case "websites":
      return "category, url";
    case "involved_companies":
      return "company, developer, publisher, supporting, porting";
    case "companies":
      return "name, slug, description, start_date, published, developed, logo, url, country";
    case "release_dates":
      return "category, date, human, m, y, platform, region";
    case "game_types":
      return "type";
  }
};

const parser = async <T>({
  token,
  type,
  parsingCallback,
}: {
  token: string;
  type: ParserType;
  parsingCallback?: (items: unknown) => Promise<unknown>;
}): Promise<T[]> => {
  const url = getLink(type);
  const limit = 500;
  const fields = getFields(type);

  const { data } = await igdbAgent<{ count: number }>(url + "/count", token);
  const total = data.count;

  let run = 0;
  const items = [];

  console.log(`Start parsing ${total} items with type: ${type}`);

  const fetch = async () => {
    return igdbAgent<T[]>(url, token, {
      fields,
      limit,
      offset: run * limit,
    });
  };

  const hui = async (): Promise<T[]> => {
    try {
      const response = await fetch();

      if (response.status !== 200) {
        return hui();
      } else {
        run++;

        if (run <= Math.ceil(total / limit)) {
          if (!!parsingCallback) {
            items.push(...response.data);
            await parsingCallback(response.data);
          } else {
            items.push(...response.data);
          }

          console.log(run, items.length);

          return hui();
        } else {
          return;
        }
      }
    } catch (e) {
      console.log(e);
      return hui();
    }
  };

  return hui();
};

export const igdbParser = <T>({
  action,
  token,
  parsingCallback,
}: {
  token: string;
  action: ParserType;
  parsingCallback?: (items: unknown) => Promise<unknown>;
}): Promise<T[]> => {
  return parser<T>({
    token,
    type: action,
    parsingCallback,
  });
};
