// TEMPORARILY HERE
import mongo from "mongodb";
export const MongoClient = mongo.MongoClient;

const url = "mongodb://mongodb:27017/";
const dbName = "pokeapi";

export const connectMongo = async () => {
  const client = await MongoClient.connect(url);
  const db = client.db(dbName);
  console.log("Connected succesfully");
  return {
    Pokemon: db.collection("pokemon"),
    Moves: db.collection("moves"),
    Types: db.collection("types"),
    Abilities: db.collection("abilites")
  };
};