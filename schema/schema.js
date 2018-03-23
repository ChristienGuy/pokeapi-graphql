import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQlID,
  GraphQLList,
  GraphQLBoolean
} from "graphql";
import Sequelize from "sequelize";
const Op = Sequelize.Op;

// Helper functions
// Prolly move these into their own place
function getTypes({ Type, Pokemon }, ids) {
  return Type.findAll(
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
}

function getType({ Type, Pokemon }, id, name) {
  return Type.find({
    where: {
      [Op.or]: [{ identifier: name }, { id: id }]
    },
    include: [
      {
        model: Type,
        attributes: ["id"],
        through: {
          attributes: ["damage_factor"]
        },
        as: "damage_from"
      },
      {
        model: Type,
        attributes: ["id"],
        through: {
          attributes: ["damage_factor"]
        },
        as: "damage_to"
      },
      {
        model: Pokemon,
        attributes: ["id"]
      }
    ]
  });
}

function getPokemon({ Pokemon, Type, Move }, id) {
  return Pokemon.find(
    {
      where: {
        id: id
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
}

function getManyPokemon({ Pokemon, Type, Move }, ids) {
  return Pokemon.findAll(
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
}

// GQL Objects
const AbilityType = new GraphQLObjectType({
  name: "Ability",
  description: "...",
  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: ability => ability.identifier
    },
    id: { type: GraphQLInt }
    // FIXME: this no longer works as expected after moving data into Mongo
    // generation: {
    //   type: GraphQLString,
    //   resolve: ability => ability.generation.name
    // },
    // pokemon: {
    //   type: new GraphQLList(PokemonType),
    //   resolve: (ability, args, { loaders }) => {
    //     const pokemonNames = ability.pokemon.map(pokemon => {
    //       return pokemon.pokemon.name;
    //     });

    //     return loaders.pokemon.loadMany(pokemonNames);
    //   }
    // }
  })
});

const FormType = new GraphQLObjectType({
  name: "PokemonForm",
  description: "...",
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    is_mega: { type: GraphQLBoolean },
    pokemon: {
      type: PokemonType,
      resolve: (pokemon, args, { loaders }) =>
        loaders.pokemon.load(pokemon.name)
    }
  })
});

const SpritesType = new GraphQLObjectType({
  name: "Sprites",
  description: "...",
  fields: () => ({
    front_female: { type: GraphQLString },
    back_female: { type: GraphQLString },
    back_shiny_female: { type: GraphQLString },
    front_shiny_female: { type: GraphQLString },
    back_default: { type: GraphQLString },
    front_default: { type: GraphQLString },
    front_shiny: { type: GraphQLString },
    back_shiny: { type: GraphQLString }
  })
});

// Move Types
const MoveType = new GraphQLObjectType({
  name: "Move",
  description: "...",
  fields: () => ({
    generation: {
      type: GraphQLString,
      resolve: move => move.generation.name
    },
    name: {
      type: GraphQLString,
      resolve: move => move.identifier
    },
    id: { type: GraphQLInt },
    pp: { type: GraphQLInt },
    accuracy: { type: GraphQLInt, resolve: move => move.accuracy || null },
    power: { type: GraphQLInt, resolve: move => move.power || null },
    pokemon: {
      type: new GraphQLList(PokemonType),
      resolve: (move, args, { db, loaders }) => loaders.pokemon.loadMany(move.pokemons.map(pokemon => pokemon.id))
    },
    // FIXME: these no longer return data after data was moved to mongo
    effect_entries: { type: new GraphQLList(MoveEffectType) },
    flavor_text_entries: {
      type: new GraphQLList(MoveFlavorTextType),
      args: {
        language: { type: GraphQLString },
        version: { type: GraphQLString }
      },
      resolve: (move, args) => {
        let filteredList;
        if (args.language && args.version) {
          filteredList = move.flavor_text_entries.filter(
            flavorTextEntry =>
              flavorTextEntry.language.name === args.language &&
              flavorTextEntry.version_group.name === args.version
          );
        } else if (args.language) {
          filteredList = move.flavor_text_entries.filter(
            flavorTextEntry => flavorTextEntry.language.name === args.language
          );
        } else if (args.version) {
          filteredList = move.flavor_text_entries.filter(
            flavorTextEntry =>
              flavorTextEntry.version_group.name === args.version
          );
        } else {
          return move.flavor_text_entries;
        }
        return filteredList;
      }
    }
  })
});

const MoveEffectType = new GraphQLObjectType({
  name: "MoveEffect",
  description: "...",
  fields: () => ({
    short_effect: { type: GraphQLString },
    effect: { type: GraphQLString }
  })
});

// TODO: work out if this can be genericised for use in all flavor text entries
const MoveFlavorTextType = new GraphQLObjectType({
  name: "MoveFlavorText",
  description: "...",
  fields: () => ({
    flavor_text: { type: GraphQLString },
    language: {
      type: GraphQLString,
      resolve: flavorText => flavorText.language.name
    },
    version_group: {
      type: GraphQLString,
      resolve: flavorText => flavorText.version_group.name
    }
  })
});

// Base Pokemon Type
const PokemonType = new GraphQLObjectType({
  name: "Pokemon",
  description: "A single pokemon",
  fields: () => ({
    id: { type: GraphQLInt },
    _id: { type: GraphQLString },
    name: {
      type: GraphQLString,
      resolve: pokemon => pokemon.identifier
    },
    height: { type: GraphQLInt },
    weight: { type: GraphQLInt },
    base_experience: { type: GraphQLInt },
    forms: {
      type: new GraphQLList(FormType),
      resolve: pokemon => pokemon.forms.map(form => getForm(form.name))
    },
    abilities: {
      type: new GraphQLList(AbilityType),
      resolve: pokemon =>
        pokemon.abilities.map(ability => getAbility(ability.ability.name))
    },
    sprites: {
      type: SpritesType
    },
    moves: {
      type: new GraphQLList(MoveType),
      resolve: (pokemon, args, { loaders, db: { Move, Pokemon } }) => {
        return Move.findAll({
          where: {
            id: {
              [Op.in]: pokemon.moves.map(move => move.id)
            }
          },
          include: [{ model: Pokemon }]
        });
        // return loaders.move.loadMany(pokemon.moves.map(move => move.move_id));
      }
    },
    stats: {
      type: new GraphQLList(StatType)
    },
    types: {
      type: new GraphQLList(TypeType),
      resolve: (pokemon, args, { db, loaders }) =>
        loaders.type.loadMany(pokemon.types.map(type => type.id))
    }
  })
});

const StatType = new GraphQLObjectType({
  name: "Stat",
  description: "...",
  fields: () => ({
    name: { type: GraphQLString, resolve: stat => stat.identifier },
    id: { type: GraphQLInt },
    _id: { type: GraphQLString },
    effort: { type: GraphQLInt },
    base_stat: { type: GraphQLInt }
  })
});

const TypeType = new GraphQLObjectType({
  name: "Type",
  description: "...",
  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: type => type.identifier
    },
    id: { type: GraphQLInt },
    _id: { type: GraphQLString },
    pokemon: {
      type: new GraphQLList(PokemonType),
      resolve: (type, args, { db, loaders }) =>
      loaders.pokemon.loadMany(type.pokemons.map(pokemon => pokemon.id))
        // getManyPokemon(db, type.pokemons.map(pokemon => pokemon.id))
    },
    half_damage_from: {
      type: new GraphQLList(TypeType),
      resolve: (type, args, { db }) =>
        getTypes(
          db,
          type.damage_from
            .filter(damageType => damageType.type_efficacy.damage_factor === 50)
            .map(damageType => damageType.id)
        )
    },
    double_damage_from: {
      type: new GraphQLList(TypeType),
      resolve: (type, args, { db }) => {
        return getTypes(
          db,
          type.damage_from
            .filter(damageType => {
              return damageType.type_efficacy.damage_factor === 200;
            })
            .map(damageType => damageType.id)
        );
      }
    },
    half_damage_to: {
      type: new GraphQLList(TypeType),
      resolve: (type, args, { db }) =>
        getTypes(
          db,
          type.damage_to
            .filter(damageType => {
              return damageType.type_efficacy.damage_factor === 50;
            })
            .map(damageType => damageType.id)
        )
    },
    double_damage_to: {
      type: new GraphQLList(TypeType),
      resolve: (type, args, { db }) =>
        getTypes(
          db,
          type.damage_to
            .filter(damageType => {
              return damageType.type_efficacy.damage_factor === 200;
            })
            .map(damageType => damageType.id)
        )
    }
  })
});

const PokedexType = new GraphQLObjectType({
  name: "Pokedex",
  description:
    "Returns a list of Pokemon types. By default it will return the first 20.",
  fields: () => ({
    count: {
      type: GraphQLInt,
      resolve: (pokedex, args, { db }) => {
        // TODO: return a count
      }
    },
    pokemon: {
      type: new GraphQLList(PokemonType),
      resolve: (pokedex, args, { db, loaders }) => {
        return loaders.pokemon.loadMany(pokedex.map(pokemon => pokemon.id));
      }
    }
  })
});

// Root query type, exposes all root fields
const QueryType = new GraphQLObjectType({
  name: "Query",
  description: "...",
  fields: () => ({
    pokedex: {
      type: PokedexType,
      description:
        "Gets a list of Pokemon. By default it will return the first 20.",
      args: {
        limit: { type: GraphQLInt },
        skip: { type: GraphQLInt }
      },
      resolve: (root, args, { db: { Pokemon } }) => {
        return Pokemon.findAll({
          limit: args.limit,
          offset: args.skip
        });
      }
    },
    pokemon: {
      type: PokemonType,
      description: "Gets single pokemon from the name",
      args: {
        name: { type: GraphQLString }
      },
      resolve: (root, args, { db: { Pokemon, Move, Type } }) =>
        Pokemon.find({
          where: {
            identifier: args.name
          },
          include: [
            {
              model: Move
            },
            {
              model: Type
            }
          ]
        })
    },
    // ability: {
    //   type: AbilityType,
    //   description: "Gets a single ability",
    //   args: {
    //     name: { type: GraphQLString },
    //     id: { type: GraphQLInt }
    //   },
    //   resolve: async (root, args, { mongo: { Abilities } }) =>
    //     await Abilities.find({ id: args.id }).toArray()
    // },
    move: {
      type: MoveType,
      description:
        "Gets a single move by id or name, if ID is specified it takes precedence",
      args: {
        name: { type: GraphQLString },
        id: { type: GraphQLInt }
      },
      resolve: (root, args, { loaders, db: { Move, Pokemon } }) => {
        // TODO: find out if there's a better method for doing OR arguments
        return Move.find({
          where: {
            [Op.or]: [{ identifier: args.name }, { id: args.id }]
          },
          include: [
            {
              model: Pokemon
            }
          ]
        });
      }
    },
    type: {
      type: TypeType,
      description: "Gets a single type",
      args: {
        name: { type: GraphQLString },
        id: { type: GraphQLInt }
      },
      resolve: (root, args, { db }) => {
        return getType(db, args.id, args.name);
      }
    }
  })
});

export default new GraphQLSchema({
  query: QueryType
});
