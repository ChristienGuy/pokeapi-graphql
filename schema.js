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

// TODO: move this into environment variables
import { BASE_URL } from "./config";
import { getJSONFromRelativeURL } from "./helpers";

// GET ENDPOINTS FROM NAME
function getForm(name) {
  return getJSONFromRelativeURL(`/pokemon-form/${name}`).then(json => json);
}
function getAbility(name) {
  return getJSONFromRelativeURL(`/ability/${name}`).then(json => json);
}
function getPokedex(limit = 20, offset = 0) {
  return getJSONFromRelativeURL(
    `/pokemon?limit=${limit}&offset=${offset}`
  ).then(json => json);
}

const AbilityType = new GraphQLObjectType({
  name: "Ability",
  description: "...",
  fields: () => ({
    name: { type: GraphQLString },
    generation: {
      type: GraphQLString,
      resolve: ability => ability.generation.name
    },
    pokemon: {
      type: new GraphQLList(PokemonType),
      resolve: (ability, args, { loaders }) => {
        const pokemonNames = ability.pokemon.map(pokemon => {
          return pokemon.pokemon.name;
        });

        return loaders.pokemon.loadMany(pokemonNames);
      }
    }
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
    name: { type: GraphQLString },
    id: { type: GraphQLInt },
    pp: { type: GraphQLInt },
    accuracy: { type: GraphQLInt },
    power: { type: GraphQLInt },
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
    name: { type: GraphQLString },
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
      resolve: (pokemon, args, { loaders }) =>
        loaders.move.loadMany(pokemon.moves.map(move => move.move.name))
    },
    stats: {
      type: new GraphQLList(StatType)
    },
    types: {
      type: new GraphQLList(TypeType),
      resolve: (pokemon, args, { loaders }) =>
        loaders.type.loadMany(pokemon.types.map(type => type.type.name))
    }
  })
});

const StatType = new GraphQLObjectType({
  name: "Stat",
  description: "...",
  fields: () => ({
    name: { type: GraphQLString, resolve: stat => stat.stat.name },
    effort: { type: GraphQLInt },
    base_stat: { type: GraphQLInt }
  })
});

const TypeType = new GraphQLObjectType({
  name: "Type",
  description: "...",
  fields: () => ({
    name: { type: GraphQLString },
    pokemon: {
      type: new GraphQLList(PokemonType),
      resolve: (type, args, { loaders }) =>
        loaders.pokemon.loadMany(
          type.pokemon.map(pokemon => pokemon.pokemon.name)
        )
    },
    half_damage_from: {
      type: new GraphQLList(TypeType),
      resolve: (type, args, { loaders }) =>
        loaders.type.loadMany(
          type.damage_relations.half_damage_from.map(type => type.name)
        )
    },
    half_damage_to: {
      type: new GraphQLList(TypeType),
      resolve: (type, args, { loaders }) =>
        loaders.type.loadMany(
          type.damage_relations.half_damage_to.map(type => type.name)
        )
    },
    double_damage_from: {
      type: new GraphQLList(TypeType),
      resolve: (type, args, { loaders }) =>
        loaders.type.loadMany(
          type.damage_relations.double_damage_from.map(type => type.name)
        )
    },
    double_damage_to: {
      type: new GraphQLList(TypeType),
      resolve: (type, args, { loaders }) =>
        loaders.type.loadMany(
          type.damage_relations.double_damage_to.map(type => type.name)
        )
    }
  })
});

const PokedexType = new GraphQLObjectType({
  name: "Pokedex",
  description:
    "Returns a list of Pokemon types. By default it will return the first 20.",
  fields: () => ({
    count: { type: GraphQLInt },
    pokemon: {
      type: new GraphQLList(PokemonType),
      resolve: (pokedex, args, { loaders }) => {
        const pokemonNames = pokedex.results.map(pokemon => pokemon.name);
        return loaders.pokemon.loadMany(pokemonNames);
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
        offset: { type: GraphQLInt }
      },
      resolve: (root, args, { loaders }) => getPokedex(args.limit, args.offset)
    },
    pokemon: {
      type: PokemonType,
      description: "Gets single pokemon from the name",
      args: {
        name: { type: GraphQLString }
      },
      resolve: (root, args, { loaders }) => loaders.pokemon.load(args.name)
    },
    pokemonForm: {
      type: FormType,
      args: {
        name: { type: GraphQLString }
      },
      resolve: (root, args) => getForm(args.name)
    },
    ability: {
      type: AbilityType,
      description: "Gets a single ability",
      args: {
        name: { type: GraphQLString }
      },
      resolve: (root, args) => getAbility(args.name)
    },
    move: {
      type: MoveType,
      description: "Gets a single move",
      args: {
        name: { type: GraphQLString }
      },
      resolve: (root, args, { loaders }) => loaders.move.load(args.name)
    },
    type: {
      type: TypeType,
      description: "Gets a single type",
      args: {
        name: { type: GraphQLString }
      },
      resolve: (root, args, { loaders }) => loaders.type.load(args.name)
    }
  })
});

export default new GraphQLSchema({
  query: QueryType
});
