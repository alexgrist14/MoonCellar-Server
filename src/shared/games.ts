import mongoose from "mongoose";
import { IGetGamesRequest } from "./zod/schemas/games.schema";

const startOfYear = (year: number) => new Date(year, 0, 1).getTime() / 1000;

const buildYearsFilter = (years: IGetGamesRequest["years"]) => {
  if (!years) return [];

  const [start, end] = years.length === 1 ? [years[0], years[0]] : years;

  const range: Record<string, number> = {};
  if (start !== null) range.$gte = startOfYear(+start);
  if (end !== null) range.$lt = startOfYear(+end + 1);

  return Object.keys(range).length ? [{ first_release: range }] : [];
};

export const gamesFilters = (
  filters: IGetGamesRequest,
  searchedIds?: mongoose.Types.ObjectId[]
) => {
  const {
    isOnlyWithAchievements,
    mode,
    years,
    company,
    excluded,
    selected,
    excludeGames,
    rating,
    votes,
  } = filters;

  const conditions = [
        ...(isOnlyWithAchievements === true
          ? [
              {
                retroachievements: {
                  $exists: true,
                  $type: "array",
                  $ne: [],
                },
              },
            ]
          : []),
        ...(!!searchedIds
          ? [
              {
                _id: { $in: searchedIds },
              },
            ]
          : []),
        ...(!!selected?.types?.length
          ? [
              {
                type:
                  mode === "any"
                    ? {
                        $in: Array.isArray(selected.types)
                          ? selected.types
                          : [selected.types],
                      }
                    : {
                        $all: Array.isArray(selected.types)
                          ? selected.types
                          : [selected.types],
                      },
              },
            ]
          : []),
        ...(!!excluded?.types?.length
          ? [
              {
                game_type: {
                  $nin: Array.isArray(excluded.types)
                    ? excluded.types
                    : [excluded.types],
                },
              },
            ]
          : []),
        ...buildYearsFilter(years),
        ...(!!company
          ? [
              {
                "companies.name": {
                  $regex: company.replaceAll(" ", "\\s*"),

                  $options: "i",
                },
              },
            ]
          : []),
        ...(rating !== undefined
          ? [
              { "igdb.total_rating": { $exists: true } },
              { "igdb.total_rating": { $gte: +rating } },
            ]
          : []),
        ...(votes !== undefined
          ? [
              { "igdb.total_rating": { $exists: true } },
              { "igdb.total_rating_count": { $gte: +votes } },
            ]
          : []),
        ...(!!selected?.keywords?.length
          ? [
              {
                keywords:
                  mode === "any"
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
                  mode === "any"
                    ? {
                        $in: Array.isArray(selected.themes)
                          ? selected.themes
                          : [selected.themes],
                      }
                    : {
                        $all: Array.isArray(selected.themes)
                          ? selected.themes
                          : [selected.themes],
                      },
              },
            ]
          : []),
        ...(!!excluded?.themes?.length
          ? [
              {
                themes: {
                  $nin: Array.isArray(excluded.themes)
                    ? excluded.themes
                    : [excluded.themes],
                },
              },
            ]
          : []),
        ...(!!selected?.franchises?.length
          ? [
              {
                franchises:
                  mode === "any"
                    ? {
                        $in: Array.isArray(selected.franchises)
                          ? selected.franchises
                          : [selected.franchises],
                      }
                    : {
                        $all: Array.isArray(selected.franchises)
                          ? selected.franchises
                          : [selected.franchises],
                      },
              },
            ]
          : []),
        ...(!!excluded?.franchises?.length
          ? [
              {
                franchises: {
                  $nin: Array.isArray(excluded.franchises)
                    ? excluded.franchises
                    : [excluded.franchises],
                },
              },
            ]
          : []),
        ...(!!selected?.genres?.length
          ? [
              {
                genres:
                  mode === "any"
                    ? {
                        $in: Array.isArray(selected.genres)
                          ? selected.genres
                          : [selected.genres],
                      }
                    : {
                        $all: Array.isArray(selected.genres)
                          ? selected.genres.map((genre) => genre)
                          : [selected.genres],
                      },
              },
            ]
          : []),
        ...(!!excluded?.genres?.length
          ? [
              {
                genres: {
                  $nin: Array.isArray(excluded.genres)
                    ? excluded.genres
                    : [excluded.genres],
                },
              },
            ]
          : []),
        ...(!!selected?.platforms?.length
          ? [
              {
                platformIds:
                  mode === "any"
                    ? {
                        $in: Array.isArray(selected.platforms)
                          ? selected.platforms.map(
                              (platform) =>
                                new mongoose.Types.ObjectId(platform)
                            )
                          : [new mongoose.Types.ObjectId(selected.platforms)],
                      }
                    : {
                        $all: Array.isArray(selected.platforms)
                          ? selected.platforms.map(
                              (platform) =>
                                new mongoose.Types.ObjectId(platform)
                            )
                          : [new mongoose.Types.ObjectId(selected.platforms)],
                      },
              },
            ]
          : []),
        ...(!!excluded?.platforms?.length
          ? [
              {
                platforms: {
                  $nin: Array.isArray(excluded.platforms)
                    ? excluded.platforms.map(
                        (platform) => new mongoose.Types.ObjectId(platform)
                      )
                    : [new mongoose.Types.ObjectId(excluded.platforms)],
                },
              },
            ]
          : []),
        ...(!!selected?.modes?.length
          ? [
              {
                modes:
                  mode === "any"
                    ? {
                        $in: Array.isArray(selected.modes)
                          ? selected.modes
                          : [selected.modes],
                      }
                    : {
                        $all: Array.isArray(selected.modes)
                          ? selected.modes
                          : [selected.modes],
                      },
              },
            ]
          : []),
        ...(!!excluded?.modes?.length
          ? [
              {
                game_modes: {
                  $nin: Array.isArray(excluded.modes)
                    ? excluded.modes
                    : [excluded.modes],
                },
              },
            ]
          : []),
        ...(!!excludeGames?.length
          ? [
              {
                _id: {
                  $nin: excludeGames.map(
                    (id) => new mongoose.Types.ObjectId(id)
                  ),
                },
              },
            ]
          : []),
  ];

  return {
    $match: conditions.length ? { $and: conditions } : {},
  };
};
