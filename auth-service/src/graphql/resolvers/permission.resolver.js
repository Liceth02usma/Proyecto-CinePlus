const Permission = require("../../models/permission.model");
const { requirePermission } = require("../../helper");


module.exports = {

    getPermissions: async (args, context) => {
        try {
            requirePermission(context.user, "getPermissions");
            const permissions = await Permission.find();
            if (!permissions) {
                return [];
            }
            return permissions;
        } catch (error) {
            throw new Error("Error fetching permissions: " + error.message);
        }
    },
    getPermission: async ({id}, context) =>{
        try {
            requirePermission(context.user, "getPermission");
            const permission = await Permission.findById(id);
            if(!permission){
                
                throw new Error("Error al obtener el permiso: "+ error.message);
            }
            return permission
        } catch (error) {
            throw new Error("Error al obtener el permiso: "+ error.message);
        }
    },
    
    createPermission: async (args, context)=>{
        try {
            requirePermission(context.user, "createPermission");
            const permission = await Permission.create(args);
            if (!permission) {
                throw new Error("Error creating permission");
            }
            return permission;
        } catch (error) {
            throw new Error("Error creating permission: " + error.message);
        }
    },
    
    updatePermission: async (args,context) => {
        try {
            requirePermission(context.user, "updatePermission");
            const permission = await Permission.findByIdAndUpdate(
                args.id,
                { name: args.name, description: args.description, route: args.route },
                { new: true }
            );
            if (!permission) {
                throw new Error("Permission not found");
            }
            return permission;
        } catch (error) {
            throw new Error("Error updating permission: " + error.message);
        }
    },

    deletePermission: async (args,context) =>{
        try {
            requirePermission(context.user, "deletePermission");
            const permission = await Permission.findByIdAndDelete(args.id);
            if (!permission) {
                throw new Error("Permission not found");
            }
            return permission;
        } catch (error) {
            throw new Error("Error deleting permission: " + error.message);
        }
    }


};