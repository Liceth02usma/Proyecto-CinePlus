const schema = `  
type Role {
_id: String!
  name: String!
  description: String!
  permissions: [Permission]
}



type Query {
  getRoles: [Role]
  getRole(id: String!): Role
}

type Mutation {
  createRole(name: String!, description: String!): Role
  updateRole(id: String!, name: String, description: String): Role
  deleteRole(id: String!): Role
  addPermissionToRole(role: String!, permission: String!): Role
}

  `;

module.exports = schema;
