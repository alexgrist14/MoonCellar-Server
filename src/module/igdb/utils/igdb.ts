import axios from "axios";
import { IGDBAuth } from "../interface/auth.interface";
import { ParserType } from "../interface/common.interface";

type IGDBQueryOptions = {
  limit?: number;
  offset?: number;
  where?: string;
  sort?: string;
};

export type IGDBParserOptions = IGDBQueryOptions & {
  delayMs?: number;
  isCollectItems?: boolean;
  fields?: string;
};

type IGDBPage<T> = {
  items: T[];
  page: number;
  total: number;
  offset: number;
};

export const igdbAuth = () =>
  axios.post<IGDBAuth>(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
  );

export const igdbAgent = <T>(url: string, token: string, query?: string) => {
  return axios.request<T>({
    url,
    method: "post",
    withCredentials: false,
    data: query,
    headers: {
      Accept: "application/json",
      "Content-Type": "text/plain",
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      // "Target-URL": url,
    },
  });
};

export const getLink = (type: ParserType) => {
  switch (type) {
    case "games":
      return "https://api.igdb.com/v4/games";
    case "platforms":
      return "https://api.igdb.com/v4/platforms";
  }
};

export const buildIgdbQueryParams = (
  fields?: string,
  options: IGDBQueryOptions = {}
) => {
  const clauses = [
    !!fields && `fields ${fields}`,
    !!options.where && `where ${options.where}`,
    !!options.sort && `sort ${options.sort}`,
    typeof options.limit === "number" && `limit ${options.limit}`,
    typeof options.offset === "number" && `offset ${options.offset}`,
  ].filter(Boolean);

  return clauses.length ? `${clauses.join("; ")};` : undefined;
};

export const getMaxUpdatedAt = <T extends { updated_at?: number }>(
  items: T[],
  fallback = 0
) => {
  return items.reduce((max, item) => {
    return typeof item.updated_at === "number" && item.updated_at > max
      ? item.updated_at
      : max;
  }, fallback);
};

export const runWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
) => {
  const limit = Math.max(1, concurrency);
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runNext = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => runNext())
  );

  return results;
};

export const wait = (delayMs: number) =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

const parser = async <T>({
  token,
  type,
  options,
  parsingCallback,
}: {
  token: string;
  type: ParserType;
  options?: IGDBParserOptions;
  parsingCallback?: (items: T[], page: IGDBPage<T>) => Promise<unknown>;
}): Promise<T[]> => {
  const url = getLink(type);
  const limit = options?.limit || 500;
  const fields = options?.fields;

  const { data } = await igdbAgent<{ count: number }>(
    url + "/count",
    token,
    buildIgdbQueryParams(undefined, { where: options?.where })
  );
  const total = data.count;
  let offset = options?.offset || 0;
  let page = 0;
  const items = [];

  console.log(`Start parsing ${total} items with type: ${type}`);

  const fetch = async () => {
    return igdbAgent<T[]>(
      url,
      token,
      buildIgdbQueryParams(fields, {
        limit,
        offset,
        where: options?.where,
        sort: options?.sort,
      })
    );
  };

  const hui = async (): Promise<T[]> => {
    try {
      if (offset >= total) {
        return items;
      }

      const response = await fetch();

      if (response.status !== 200) {
        return hui();
      } else {
        page++;

        if (!!parsingCallback) {
          if (options?.isCollectItems !== false) {
            items.push(...response.data);
          }
          await parsingCallback(response.data, {
            items: response.data,
            page,
            total,
            offset,
          });
        } else {
          if (options?.isCollectItems !== false) {
            items.push(...response.data);
          }
        }

        console.log(page, items.length);

        offset += limit;
        if (!!options?.delayMs) {
          await wait(options.delayMs);
        }
        return hui();
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
  options,
  parsingCallback,
}: {
  token: string;
  action: ParserType;
  options?: IGDBParserOptions;
  parsingCallback?: (items: T[], page: IGDBPage<T>) => Promise<unknown>;
}): Promise<T[]> => {
  return parser<T>({
    token,
    type: action,
    options,
    parsingCallback,
  });
};
