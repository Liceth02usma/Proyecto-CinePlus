const { default: mongoose } = require("mongoose");

const persmissionRoleSchema = new mongoose.Schema({
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  permission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Permission",
  },
});

module.exports = mongoose.model("PermissionRole", persmissionRoleSchema);
