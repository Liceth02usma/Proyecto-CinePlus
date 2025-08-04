const Role = require("../../models/role.model");
const Permission = require("../../models/permission.model");

module.exports = {
  getRoles: async () => {
    try {
      const roles = await Role.find();

      if (!roles) {
        return [];
      }
      return roles;
    } catch (error) {
      throw new Error("Error fetching roles: " + error.message);
    }
  },

  getRole: async ({ id }) => {
    try {
      const role = await Role.findById(id);
      if (!role) {
        throw new Error("Role not found");
      }
      return role;
    } catch (error) {
      throw new Error("Error fetching role: " + error.message);
    }
  },
  createRole: async (args) => {
    try {
      const role = await Role.create(args);
      if (!role) {
        throw new Error("Error");
      }
      return role;
    } catch (error) {
      throw new Error("Error creating role: " + error.message);
    }
  },
  updateRole: async (args) => {
    try {
      const role = await Role.findByIdAndUpdate(
        args.id,
        { name: args.name, description: args.description },
        { new: true }
      );
      if (!role) {
        throw new Error("Role not found");
      }
      return role;
    } catch (error) {
      throw new Error("Error updating role: " + error.message);
    }
  },

  deleteRole: async ({ id }) => {
    try {
      const role = await Role.findByIdAndDelete(id);
      if (!role) {
        throw new Error("Role not found");
      }
      return role;
    } catch (error) {
      throw new Error("Error deleting role: " + error.message);
    }
  },
  
  addPermissionToRole: async ({ role, permission }) => {
  try {
    // Validar que el rol exista
    const findRole = await Role.findById(role);
    if (!findRole) {
      throw new Error("El rol no existe");
    }
    // Validar que el permiso exista
    const existingPermission = await Permission.exists({ _id: permission });
    if (!existingPermission) {
      throw new Error("El permiso no existe");
    }
    // Evitar duplicados
    if (!findRole.permissions.includes(permission)) {
      findRole.permissions.push(permission);
    }
    // Actualizar el rol y popular permisos
    const roleUpdated = await Role.findByIdAndUpdate(
      role,
      { permissions: findRole.permissions },
      { new: true }
    ).populate("permissions");
    return roleUpdated;
  } catch (error) {
    throw new Error("Error adding permission to role: " + error.message);
  }
}
};
