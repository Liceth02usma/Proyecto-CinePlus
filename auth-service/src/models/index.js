const { default: mongoose } = require("mongoose");
const { permissionRoleModel } = require("./permissionRole.model");
const { roleModel } = require("./role.model");
const { userModel } = require("./user.model");
const { permissionModel } = require("./permission.model");

module.exports = {
  permissionRoleModel,
  roleModel,
  userModel,
  permissionModel,
};
