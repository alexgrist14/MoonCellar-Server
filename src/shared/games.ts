import { IGetGamesRequest } from "./zod/schemas/games.schema";

export const gamesFilters = (filters: IGetGamesRequest) => {
  const {
    isOnlyWithAchievements,
    mode,
    years,
    search,
    company,
    excluded,
    selected,
    excludeGames,
  } = filters;

  return {
    $match: {
      $and: [
        { _id: { $exists: true } },
        ...(isOnlyWithAchievements === true
          ? [
              {
                raIds: {
                  $exists: true,
                  $type: "array",
                  $ne: [],
                },
              },
            ]
          : []),
        ...(!!search
          ? [
              // {
              //   $text: {
              //     $search: search,
              //   },
              // },
              {
                name: {
                  $regex: search.replaceAll(" ", "\\s*"),

                  $options: "i",
                },
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
        ...(!!years
          ? [
              {
                first_release: {
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
                companies: company,
              },
            ]
          : []),
        // ...(rating !== undefined
        //   ? [{ total_rating: { $gte: +rating } }]
        //   : []),
        // ...(votes !== undefined
        //   ? [{ total_rating_count: { $gte: +votes } }]
        //   : []),
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
                platforms:
                  mode === "any"
                    ? {
                        $in: Array.isArray(selected.platforms)
                          ? selected.platforms
                          : [selected.platforms],
                      }
                    : {
                        $all: Array.isArray(selected.platforms)
                          ? selected.platforms
                          : [selected.platforms],
                      },
              },
            ]
          : []),
        ...(!!excluded?.platforms?.length
          ? [
              {
                platforms: {
                  $nin: Array.isArray(excluded.platforms)
                    ? excluded.platforms
                    : [excluded.platforms],
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
          ? [{ _id: { $nin: excludeGames.map((id) => Number(id)) } }]
          : []),
      ],
    },
  };
};
