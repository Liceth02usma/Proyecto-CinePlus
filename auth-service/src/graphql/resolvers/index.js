    const roleResolver = require("./role.resolver");
    const permissionResolver = require("./permission.resolver")

module.exports = {
  ...roleResolver,
  ...permissionResolver
};
