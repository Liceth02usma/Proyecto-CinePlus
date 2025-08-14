const schema = `
type Permission {
  _id: String!
  name: String!
  description: String!
  route: String!
}

extend type Query {
  getPermissions: [Permission]
  getPermission(id: String!): Permission
}

extend type Mutation {
  createPermission(name: String!, description: String!, route: String!): Permission
  updatePermission(id: String!, name: String, description: String): Permission
  deletePermission(id: String!): Permission
}

`;

module.exports = schema