module.exports = {
  hasPermission: (user, permiso) => {
    if (!user || !user.permisos) return false;
    return user.permisos.includes(permiso);
  },
  requirePermission: (user, permiso) => {
    if (!user || !user.permisos || !user.permisos.includes(permiso)) {
      throw new Error("Acceso denegado");
    }
  }
};