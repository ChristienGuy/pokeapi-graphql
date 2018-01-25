import Sequelize from "sequelize";

export const connectSql = async () => {
  const connection = new Sequelize("pokeapi", "root", "root", {
    host: "localhost",
    dialect: "mysql",
    timestamps: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false
    }
  });

  await connection
    .authenticate()
    .then(() => {
      console.log("Database connection established");
    })
    .catch(() => {
      console.log("Unable to connect to the database: ", err);
    });

  const Pokemon = connection.define(
    "pokemon",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      identifier: { type: Sequelize.STRING },
      species_id: { type: Sequelize.INTEGER },
      height: { type: Sequelize.INTEGER },
      weight: { type: Sequelize.INTEGER },
      base_experience: { type: Sequelize.INTEGER },
      order: { type: Sequelize.INTEGER },
      is_default: { type: Sequelize.INTEGER }
    },
    {
      freezeTableName: true,
      timestamps: false
    }
  );

  const PokemonMoves = connection.define(
    "pokemon_moves",
    {
      pokemon_id: { type: Sequelize.INTEGER, unique: true },
      version_group_id: { type: Sequelize.INTEGER, unique: true },
      move_id: { type: Sequelize.INTEGER, unique: true },
      pokemon_move_method_id: { type: Sequelize.INTEGER },
      level: { type: Sequelize.INTEGER },
      order: { type: Sequelize.INTEGER }
    },
    { timestamps: false }
  );

  const Move = connection.define(
    "move",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      identifier: { type: Sequelize.STRING },
      power: { type: Sequelize.INTEGER },
      pp: { type: Sequelize.INTEGER },
      accuracy: { type: Sequelize.INTEGER },
      priority: { type: Sequelize.INTEGER }
    },
    { timestamps: false }
  );

  const PokemonTypes = connection.define("pokemon_types", {
    pokemon_id: {
      type: Sequelize.INTEGER
    },
    type_id: Sequelize.INTEGER,
    slot: Sequelize.INTEGER
  });

  const Type = connection.define("type", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    identifier: { type: Sequelize.STRING },
    generation_id: { type: Sequelize.INTEGER },
    damage_class_id: { type: Sequelize.INTEGER }
  });

  Type.belongsToMany(Pokemon, {
    through: PokemonTypes,
    foreignKey: "type_id",
    otherKey: "pokemon_id"
  });
  Pokemon.belongsToMany(Type, {
    through: PokemonTypes,
    foreignKey: "pokemon_id",
    otherKey: "type_id"
  });
  
  Move.belongsToMany(Pokemon, {
    through: PokemonMoves,
    foreignKey: "move_id",
    otherKey: "pokemon_id"
  });
  Pokemon.belongsToMany(Move, {
    through: PokemonMoves,
    foreignKey: "pokemon_id",
    otherKey: "move_id"
  });

  connection.sync();

  return {
    Pokemon,
    PokemonMoves,
    Move,
    Type
  };
};
