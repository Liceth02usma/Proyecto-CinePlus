const express = require("express");
const {graphqlHTTP} = require("express-graphql");
const { schema, rootValue, graphiql } = require("../graphql");
const app = require("../app");

module.exports = {
  applyBodyParser: (app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(
      "/graphql",
      graphqlHTTP({
        schema: schema,
        rootValue: rootValue,
        graphiql: graphiql,
      })
    );
  },
};
