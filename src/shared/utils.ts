export const gamesLookup = (isBasic?: boolean) => [
  {
    $lookup: {
      from: 'igdbcovers',
      localField: 'cover',
      foreignField: '_id',
      as: 'cover',
    },
  },
  {
    $addFields: {
      cover: {
        $ifNull: [{ $arrayElemAt: ['$cover', 0] }, null],
      },
    },
  },
  {
    $lookup: {
      from: 'igdbreleasedates',
      localField: 'release_dates',
      foreignField: '_id',
      ...(!isBasic && {
        pipeline: [
          {
            $lookup: {
              from: 'igdbplatforms',
              localField: 'platform',
              foreignField: '_id',
              as: 'platform',
            },
          },
          {
            $addFields: {
              platform: {
                $ifNull: [{ $arrayElemAt: ['$platform', 0] }, null],
              },
            },
          },
        ],
      }),
      as: 'release_dates',
    },
  },
  {
    $lookup: {
      from: 'igdbplatforms',
      localField: 'platforms',
      foreignField: '_id',
      ...(!isBasic && {
        pipeline: [
          {
            $lookup: {
              from: 'igdbfamilies',
              localField: 'platform_family',
              foreignField: '_id',
              as: 'platform_family',
            },
          },
          {
            $lookup: {
              from: 'igdbplatformlogos',
              localField: 'platform_logo',
              foreignField: '_id',
              as: 'platform_logo',
            },
          },
          {
            $addFields: {
              platform_family: {
                $ifNull: [{ $arrayElemAt: ['$platform_family', 0] }, null],
              },
            },
          },
          {
            $addFields: {
              platform_logo: {
                $ifNull: [{ $arrayElemAt: ['$platform_logo', 0] }, null],
              },
            },
          },
        ],
      }),
      as: 'platforms',
    },
  },
  ...(!isBasic
    ? [
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
            from: 'igdbmodes',
            localField: 'game_modes',
            foreignField: '_id',
            as: 'game_modes',
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
          $lookup: {
            from: 'igdbwebsites',
            localField: 'websites',
            foreignField: '_id',
            as: 'websites',
          },
        },
        {
          $lookup: {
            from: 'igdbinvolvedcompanies',
            localField: 'involved_companies',
            foreignField: '_id',
            pipeline: [
              {
                $lookup: {
                  from: 'igdbcompanies',
                  localField: 'company',
                  foreignField: '_id',
                  as: 'company',
                },
              },
              {
                $addFields: {
                  company: {
                    $ifNull: [{ $arrayElemAt: ['$company', 0] }, null],
                  },
                },
              },
            ],
            as: 'involved_companies',
          },
        },
      ]
    : []),
];
