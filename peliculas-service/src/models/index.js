const { default: mongoose } = require("mongoose");
const { roleModel } = require("./role.model");
const { userModel } = require("./user.model");
const { permissionModel } = require("./permission.model");

module.exports = {
  roleModel,
  userModel,
  permissionModel,
};
