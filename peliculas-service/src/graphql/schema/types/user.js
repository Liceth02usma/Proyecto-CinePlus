const schema = `
  type User{
  _id: String!
  name: String!
  lastname: String!
  email: String!
  password: String!
  phone: String!
  active: Boolean
  role: Role!
  }


extend type Query {
  getUsers: [User]
  getUser(id: String!): User
  getUserByEmail(email: String!): User
}

extend type Mutation {
  createUser(name: String!, lastname: String!, email: String!, password: String!,passwordConfirmation:String!, phone: String!, role:String!): String
  updateUser(id: String!, name: String, lastname: String, email: String, password: String, phone: String, role:String): User
  deleteUser(id: String!): User
 loginUser(email: String!, password: String!): String
  }
  
`;

module.exports = schema;
