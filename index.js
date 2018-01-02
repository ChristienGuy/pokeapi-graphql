import express from "express";
import graphQLHTTP from "express-graphql";
import DataLoader from "dataloader";
import cors from "cors";

import schema from "./schema";
import fetch from "node-fetch";

import { getJSONFromRelativeURL } from "./helpers";
const app = express();

app.use(cors());

function getPokemon(name) {
  return getJSONFromRelativeURL(`/pokemon/${name}`).then(json => json);
}
function getMove(name) {
  return getJSONFromRelativeURL(`/move/${name}`).then(json => json);
}
function getType(name) {
  return getJSONFromRelativeURL(`/type/${name}`).then(json => json);
}

app.use(
  graphQLHTTP(req => {
    const pokemonLoader = new DataLoader(keys =>
      Promise.all(keys.map(getPokemon))
    );
    const moveLoader = new DataLoader(keys => Promise.all(keys.map(getMove)));
    const typeLoader = new DataLoader(keys => Promise.all(keys.map(getType)));
    const loaders = {
      pokemon: pokemonLoader,
      move: moveLoader,
      type: typeLoader
    };
    return {
      context: { loaders },
      schema,
      graphiql: true
    };
  })
);

app.listen(5000);
