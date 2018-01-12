// TEMPORARILY HERE
import mongo from "mongodb";
export const MongoClient = mongo.MongoClient;

console.log(process.env.NODE_ENV);
let url = "";
if (process.env.NODE_ENV === "dev") {
  url = "mongodb://localhost:27017/";
} else {
  url = "mongodb://mongodb:27017/";
}
console.log(url);
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
