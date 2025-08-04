const { buildSchema } = require("graphql");
const resolvers = require("./resolvers");
const schemaDefs = require("./schema");

const schema = buildSchema(schemaDefs);

module.exports = {
  schema,
  rootValue: resolvers,
  graphiql: true,
};
