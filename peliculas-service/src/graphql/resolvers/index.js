    const roleResolver = require("./role.resolver");
    const permissionResolver = require("./permission.resolver")
    const userResolver = require("./user.resolver");

module.exports = {
  ...roleResolver,
  ...permissionResolver,
  ...userResolver
};
