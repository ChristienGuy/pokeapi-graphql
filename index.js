import express from "express";
import graphQLHTTP from "express-graphql";
import cors from "cors";
import path from "path";

import schema from "./schema/schema";
import { connectMongo } from "./mongo-connector";
import { buildDataLoaders } from "./schema/loaders";

(async () => {
  try {
    const mongo = await connectMongo();
    const app = express();

    app.use(cors());
    app.use('/', express.static('docs'));
    app.use(
      
      graphQLHTTP((req, res, graphQLParams) => {
        const loaders = buildDataLoaders(mongo);
        return {
          context: { loaders, mongo },
          schema,
          graphiql: true
        };
      })
    );

    const PORT = process.env.port || 5000;
    app.listen(PORT, e => {
      console.log(`Listening on port ${PORT}`);
    });
  } catch (error) {
    console.log(error.stack);
  }
})();
