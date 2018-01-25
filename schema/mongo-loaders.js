import DataLoader from "dataloader";

export const buildDataLoaders = ({ Pokemon, Moves, Types, Stats }) => ({
  pokemon: new DataLoader(keys =>
    Promise.all(
      keys.map(key =>
        Pokemon.aggregate([
          {
            $match: {
              $or: [{ id: key }, { identifier: key }]
            }
          },
          {
            $lookup: {
              from: "pokemon_moves",
              localField: "id",
              foreignField: "pokemon_id",
              as: "moves"
            }
          },
          {
            $lookup: {
              from: "pokemon_types",
              localField: "id",
              foreignField: "pokemon_id",
              as: "types"
            }
          },
          {
            $lookup: {
              from: "pokemon_stats",
              let: { id: "$id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$pokemon_id", "$$id"]
                    }
                  }
                },
                {
                  $lookup: {
                    from: "stats",
                    localField: "stat_id",
                    foreignField: "id",
                    as: "stat_details"
                  }
                },
                {
                  $replaceRoot: {
                    newRoot: {
                      $mergeObjects: [
                        { $arrayElemAt: ["$stat_details", 0] },
                        "$$ROOT"
                      ]
                    }
                  }
                },
                {
                  $project: {
                    stat_details: 0
                  }
                }
              ],
              as: "stats"
            }
          }
        ])
          .toArray()
          .then(pokemon => pokemon[0])
      )
    )
  ),
  move: new DataLoader(keys =>
    Promise.all(
      keys.map(key =>
        Moves.aggregate([
          {
            $match: {
              $or: [{ id: key }, { identifier: key }]
            }
          },
          {
            $lookup: {
              from: "pokemon_moves",
              let: { id: "$id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$move_id", "$$id"]
                    }
                  }
                },
                {
                  $group: {
                    _id: ""
                  }
                }
              ],
              as: "pokemon"
            }
          }
        ])
          .toArray()
          .then(move => {
            return move[0];
          })
      )
    )
  ),
  type: new DataLoader(
    keys => {
      return Promise.all(
        keys.map(key =>
          Types.aggregate([
            {
              $match: {
                $or: [{ id: key }, { identifier: key }]
              }
            },
            {
              $lookup: {
                from: "type_efficacy",
                let: { id: "$id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$damage_factor", 200] },
                          { $eq: ["$damage_type_id", "$$id"] }
                        ]
                      }
                    }
                  }
                ],
                as: "double_damage_to"
              }
            },
            {
              $lookup: {
                from: "type_efficacy",
                let: { id: "$id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$damage_factor", 50] },
                          { $eq: ["$damage_type_id", "$$id"] }
                        ]
                      }
                    }
                  }
                ],
                as: "half_damage_to"
              }
            },
            {
              $lookup: {
                from: "type_efficacy",
                let: { id: "$id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$damage_factor", 50] },
                          { $eq: ["$target_type_id", "$$id"] }
                        ]
                      }
                    }
                  }
                ],
                as: "half_damage_from"
              }
            },
            {
              $lookup: {
                from: "type_efficacy",
                let: { id: "$id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$damage_factor", 200] },
                          { $eq: ["$target_type_id", "$$id"] }
                        ]
                      }
                    }
                  }
                ],
                as: "double_damage_from"
              }
            },
            {
              $lookup: {
                from: "pokemon_types",
                localField: "id",
                foreignField: "type_id",
                as: "pokemon"
              }
            }
          ])
            .toArray()
            .then(type => type[0])
        )
      );
    }
    // Types.find({ id: { $in: keys } }).toArray()
  ),
});
