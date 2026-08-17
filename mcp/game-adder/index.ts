import { config } from "dotenv";
config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";
import { AddGameRequestSchema } from "../../src/shared/zod/schemas/games.schema";
import { getS3Config } from "../../src/shared/constants";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3228";
const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8891";
const FRONT_URL = process.env.FRONT_URL || "https://mooncellar.space";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ACCESS_TOKEN_COOKIE = "accessMoonToken";

const S3_BUCKETS = {
  cover: "mooncellar-covers",
  screenshots: "mooncellar-screenshots",
  artworks: "mooncellar-artworks",
} as const;

const s3 = new S3Client(getS3Config());

const clearExistingImages = async (bucketName: string, slug: string) => {
  const existing = await s3.send(
    new ListObjectsV2Command({ Bucket: bucketName, Prefix: `${slug}/` })
  );
  const keys = (existing.Contents || [])
    .map((o) => o.Key)
    .filter((k): k is string => !!k);

  if (keys.length) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      })
    );
  }
};

const uploadImagesToS3 = async (
  bucketName: string,
  slug: string,
  urls: string[]
): Promise<string[]> => {
  await clearExistingImages(bucketName, slug);

  const links: string[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Image fetch failed (${res.status}): ${url}`);
        continue;
      }

      const bytes = Buffer.from(await res.arrayBuffer());
      if (!bytes.length) continue;

      const key = `${slug}/${randomBytes(12).toString("hex")}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `${key}.jpg`,
          Body: bytes,
          ContentType: "image/jpeg",
          ACL: "public-read",
        })
      );

      links.push(
        `${process.env.S3_HOST_CDN.replace("%backet", bucketName)}${key}.jpg`
      );
    } catch (e) {
      console.error(`Image upload error for ${url}:`, e);
    }
  }

  return links;
};

let cachedToken: string | null = null;

const login = async (): Promise<string> => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_EMAIL / ADMIN_PASSWORD are not set in the environment"
    );
  }

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }

  const cookies = res.headers.getSetCookie();
  const accessCookie = cookies.find((c) =>
    c.startsWith(`${ACCESS_TOKEN_COOKIE}=`)
  );

  if (!accessCookie) {
    throw new Error("Login succeeded but no access token cookie was set");
  }

  const token = accessCookie.split(";")[0].split("=")[1];
  cachedToken = token;
  return token;
};

const callApi = async (
  path: string,
  init: RequestInit = {},
  requireAuth = false
): Promise<Response> => {
  const doFetch = async () => {
    const headers = new Headers(init.headers);
    if (requireAuth) {
      const token = cachedToken ?? (await login());
      headers.set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);
    }
    return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  };

  let res = await doFetch();

  if (requireAuth && res.status === 401) {
    cachedToken = null;
    res = await doFetch();
  }

  return res;
};

const server = new McpServer({ name: "game-adder", version: "0.1.0" });

server.registerTool(
  "search_web",
  {
    description:
      "Search the web via a local SearXNG instance. Use this to research game details (release date, developer, platforms, genres, cover image, etc.) before calling create_game.",
    inputSchema: {
      query: z.string().describe("Search query"),
      count: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Max number of results to return (default 10)"),
    },
  },
  async ({ query, count }) => {
    const url = new URL("/search", SEARXNG_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");

    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `SearXNG request failed: ${res.status} ${await res.text()}`,
          },
        ],
        isError: true,
      };
    }

    const data = (await res.json()) as {
      results?: { title: string; url: string; content?: string }[];
    };

    const results = (data.results || [])
      .slice(0, count ?? 10)
      .map((r) => ({ title: r.title, url: r.url, content: r.content }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.registerTool(
  "search_images",
  {
    description:
      "Search for images via a local SearXNG instance (image category). Use this to find screenshot/artwork/cover URLs for a game before calling create_game — pass the resulting img_src URLs directly as cover/screenshots/artworks.",
    inputSchema: {
      query: z.string().describe("Image search query"),
      count: z
        .number()
        .int()
        .min(1)
        .max(30)
        .optional()
        .describe("Max number of results to return (default 15)"),
    },
  },
  async ({ query, count }) => {
    const url = new URL("/search", SEARXNG_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("categories", "images");

    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `SearXNG request failed: ${res.status} ${await res.text()}`,
          },
        ],
        isError: true,
      };
    }

    const data = (await res.json()) as {
      results?: {
        title: string;
        url: string;
        img_src?: string;
        source?: string;
      }[];
    };

    const results = (data.results || [])
      .filter((r) => r.img_src)
      .slice(0, count ?? 15)
      .map((r) => ({
        title: r.title,
        img_src: r.img_src,
        pageUrl: r.url,
        source: r.source,
      }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.registerTool(
  "search_youtube",
  {
    description:
      "Search YouTube for trailers/gameplay/reviews via a local SearXNG instance (video category, filtered to youtube.com/youtu.be links only). Use this to find links for the videos field of create_game.",
    inputSchema: {
      query: z.string().describe("Video search query, e.g. \"<game name> trailer\""),
      count: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Max number of results to return (default 10)"),
    },
  },
  async ({ query, count }) => {
    const url = new URL("/search", SEARXNG_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("categories", "videos");

    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `SearXNG request failed: ${res.status} ${await res.text()}`,
          },
        ],
        isError: true,
      };
    }

    const data = (await res.json()) as {
      results?: { title: string; url: string }[];
    };

    const isYoutube = (u: string) =>
      /(^|\.)youtube\.com\/watch|youtu\.be\//.test(u);

    const results = (data.results || [])
      .filter((r) => isYoutube(r.url))
      .slice(0, count ?? 10)
      .map((r) => ({ title: r.title, url: r.url }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.registerTool(
  "list_platforms",
  {
    description:
      "List all known platforms (id, name, slug) from MoonCellar. Use this to resolve platform names to the platformIds required by create_game.",
    inputSchema: {},
  },
  async () => {
    const res = await callApi("/platforms");
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch platforms: ${res.status} ${await res.text()}`,
          },
        ],
        isError: true,
      };
    }

    const platforms = (await res.json()) as {
      _id: string;
      name: string;
      slug: string;
    }[];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            platforms.map((p) => ({ _id: p._id, name: p.name, slug: p.slug })),
            null,
            2
          ),
        },
      ],
    };
  }
);

server.registerTool(
  "create_game",
  {
    description:
      "Create a custom game in MoonCellar (POST /games/add), bypassing IGDB. Use this for games that cannot be parsed from IGDB (e.g. blocked/delisted). Requires ADMIN credentials configured on the MCP server. platformIds must be real Platform _id values obtained from list_platforms. " +
      "This tool requires confirmation: the first call (confirm omitted or false) does NOT write anything — it only returns a preview of what would be created, so the human user can be shown it and asked whether this is really the right game. Only call again with confirm: true, after the user has explicitly confirmed the preview, to actually insert it into the database. " +
      "All text fields (name, storyline, summary, genres, keywords, themes, modes, franchises, alternative_names, companies, release_dates.human, etc.) must be in English, regardless of the language of the sources used to research the game — translate before calling this tool. " +
      "screenshots is capped at 10 entries, artworks at 5 — pick the best if more are available. " +
      "cover/screenshots/artworks should be direct external image URLs found via search_web/search_images — on the real (confirm: true) call, this tool downloads them and re-uploads them to MoonCellar's own S3 buckets, exactly like the IGDB parser does, and stores the resulting S3 CDN links instead of the original external URLs. " +
      "artworks vs screenshots is ambiguous from search results alone (artwork = promotional/key art, box art, drawn art; screenshot = actual in-game capture). Before including a candidate image in either list, show its URL to the human user in chat and ask them to confirm which of the two it is — do not guess.  " +
      "videos should be YouTube links (trailers/gameplay) found via search_youtube.",
    inputSchema: {
      ...AddGameRequestSchema.shape,
      screenshots: AddGameRequestSchema.shape.screenshots
        .unwrap()
        .max(10)
        .optional()
        .describe("At most 10 screenshot URLs"),
      artworks: AddGameRequestSchema.shape.artworks
        .unwrap()
        .max(5)
        .optional()
        .describe(
          "At most 5 artwork URLs (promotional/key art, not screenshots). Each candidate must be confirmed with the human user in chat before being included here."
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Must be explicitly set to true to actually create the game, after the user confirmed the preview. Omit or false to only get a preview."
        ),
    },
  },
  async ({ confirm, ...input }) => {
    if (!confirm) {
      return {
        content: [
          {
            type: "text",
            text:
              "PREVIEW ONLY — nothing was written to the database.\n" +
              "Show this to the user and ask them to confirm this is the correct game before proceeding.\n" +
              "If confirmed, call create_game again with the exact same input plus confirm: true.\n\n" +
              JSON.stringify(input, null, 2),
          },
        ],
      };
    }

    const uploaded = { ...input };

    if (uploaded.cover) {
      const [link] = await uploadImagesToS3(S3_BUCKETS.cover, uploaded.slug, [
        uploaded.cover,
      ]);
      if (link) uploaded.cover = link;
    }

    if (uploaded.screenshots?.length) {
      uploaded.screenshots = await uploadImagesToS3(
        S3_BUCKETS.screenshots,
        uploaded.slug,
        uploaded.screenshots
      );
    }

    if (uploaded.artworks?.length) {
      uploaded.artworks = await uploadImagesToS3(
        S3_BUCKETS.artworks,
        uploaded.slug,
        uploaded.artworks
      );
    }

    const res = await callApi(
      "/games/add",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploaded),
      },
      true
    );

    const text = await res.text();

    if (!res.ok) {
      return {
        content: [
          { type: "text", text: `Failed to create game: ${res.status} ${text}` },
        ],
        isError: true,
      };
    }

    const game = JSON.parse(text) as { _id: string; slug: string };

    return {
      content: [
        {
          type: "text",
          text:
            `Game created.\n` +
            `url: ${FRONT_URL}/games/${game.slug}\n` +
            `slug: ${game.slug}\n` +
            `id: ${game._id}\n\n` +
            text,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
