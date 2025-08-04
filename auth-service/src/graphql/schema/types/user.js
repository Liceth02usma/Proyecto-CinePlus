const schema = `
  type User{
  name: String!
  lastname: String!
  email: String!
  passwordHash: String!
  phone: String!
  active: Boolean
  role: Role!
  }
`;

module.exports = schema;