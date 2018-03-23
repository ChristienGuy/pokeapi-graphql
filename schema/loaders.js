import DataLoader from "dataloader";
import Sequelize from "sequelize";
const Op = Sequelize.Op;

export const buildDataLoaders = ({ Pokemon, Type, Move }) => ({
  moves: new DataLoader(ids => new Promise(async resolve => {})),
  pokemon: new DataLoader(ids => {
    return new Promise(async resolve => {
      const results = await Pokemon.findAll(
        {
          where: {
            id: { [Op.in]: ids }
          },
          include: [
            {
              model: Type,
              attributes: ["id"]
            },
            {
              model: Move,
              attributes: ["id"]
            }
          ]
        },
        { raw: true }
      );

      resolve(ids.map(id => results.find(result => result.id === id || null)));
    });
  }),
  type: new DataLoader(ids => {
    return new Promise(async resolve => {
      const results = await Type.findAll(
        {
          where: {
            id: {
              [Op.in]: ids
            }
          },
          include: [
            {
              model: Type,
              as: "damage_from",
              through: {
                attributes: ["damage_factor"]
              }
            },
            {
              model: Type,
              as: "damage_to",
              through: {
                attributes: ["damage_factor"]
              }
            },
            {
              model: Pokemon
            }
          ]
        },
        { raw: true }
      );
      resolve(ids.map(id =>
        results.find(result => result.id === id || null)
      ));
    });
  })
});
