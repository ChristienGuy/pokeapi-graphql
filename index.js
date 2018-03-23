import express from "express";
import graphQLHTTP from "express-graphql";
import cors from "cors";
import pg from "pg";

import schema from "./schema/schema";
import { connectSql } from "./db";
import { buildDataLoaders } from "./schema/loaders";

(async () => {
  try {
    const db = await connectSql();
    const app = express();

    app.use(cors());
    app.use("/", express.static("docs"));
    app.use(
      "/graphql",
      graphQLHTTP((req, res, graphQLParams) => {
        // TODO: replace with sql data loaders
        const loaders = buildDataLoaders(db);
        return {
          context: { loaders, db },
          schema,
          graphiql: true
        };
      })
    );

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, e => {
      console.log(`Listening on port ${PORT}`);
    });
  } catch (error) {
    console.log(error.stack);
  }
})();
