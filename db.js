import Sequelize from "sequelize";

const connectionString = process.env.DATABASE_URL || "postgresql:///pokeapi";
export const connectSql = async () => {
  const connection = new Sequelize(connectionString, {
    timestamps: false,
    pool: {
      max: 20,
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
    .catch(err => {
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
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["id"]
        }
      ]
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
    {
      timestamps: false,
      indexes: [
        {
          unique: false,
          fields: ["pokemon_id", "move_id", "version_group_id"]
        }
      ]
    }
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
    {
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["id"]
        }
      ]
    }
  );

  const PokemonTypes = connection.define(
    "pokemon_types",
    {
      pokemon_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      type_id: { type: Sequelize.INTEGER, primaryKey: true },
      slot: Sequelize.INTEGER
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["pokemon_id", "type_id", "slot"]
        }
      ]
    }
  );

  const Type = connection.define(
    "type",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      identifier: { type: Sequelize.STRING },
      generation_id: { type: Sequelize.INTEGER },
      damage_class_id: { type: Sequelize.INTEGER }
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["id"]
        }
      ]
    }
  );

  const TypeEfficacy = connection.define(
    "type_efficacy",
    {
      damage_type_id: Sequelize.INTEGER,
      target_type_id: Sequelize.INTEGER,
      damage_factor: Sequelize.INTEGER
    },
    {
      freezeTableName: true,
      indexes: [
        {
          unique: true,
          fields: ["damage_type_id", "target_type_id"]
        }
      ]
    }
  );

  // Type - Type associations
  Type.belongsToMany(Type, {
    through: TypeEfficacy,
    foreignKey: "damage_type_id",
    otherKey: "target_type_id",
    as: "damage_to"
  });
  Type.belongsToMany(Type, {
    through: TypeEfficacy,
    foreignKey: "target_type_id",
    otherKey: "damage_type_id",
    as: "damage_from"
  });

  // Pokemon - Type associations
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

  // Move - Pokemon associations
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
