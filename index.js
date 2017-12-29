import express from "express";
import graphQLHTTP from "express-graphql";
import DataLoader from "dataloader";

import schema from "./schema";
import fetch from "node-fetch";

import { BASE_URL } from './config';

const app = express();


function getJSONFromRelativeURL(relativeURL) {
  return fetch(`${BASE_URL}${relativeURL}`).then(res => res.json());
}

function getPokemon(name) {
  return getJSONFromRelativeURL(`/pokemon/${name}`).then(json => json);
}
function getMove(name) {
  return getJSONFromRelativeURL(`/move/${name}`).then(json => json);
}

app.use(
  graphQLHTTP(req => {
    const pokemonLoader = new DataLoader(keys =>
      Promise.all(keys.map(getPokemon))
    );
    const moveLoader = new DataLoader(keys => 
      Promise.all(keys.map(getMove))
    );
    const loaders = {
      pokemon: pokemonLoader,
      move: moveLoader
    };
    return {
      context: { loaders },
      schema,
      graphiql: true
    };
  })
);

app.listen(5000);
