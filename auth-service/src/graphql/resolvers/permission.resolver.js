const Permission = require("../../models/permission.model");



module.exports = {

    getPermissions: async () => {
        try {
            const permissions = await Permission.find();
            if (!permissions) {
                return [];
            }
            return permissions;
        } catch (error) {
            throw new Error("Error fetching permissions: " + error.message);
        }
    },
    getPermission: async ({id}) =>{
        try {
            const permission = await Permission.findById(id);
            if(!permission){
                
                throw new Error("Error al obtener el permiso: "+ error.message);
            }
            return permission
        } catch (error) {
            throw new Error("Error al obtener el permiso: "+ error.message);
        }
    },

    createPermission: async (args)=>{
        try {
            const permission = await Permission.create(args);
            if (!permission) {
                throw new Error("Error creating permission");
            }
            return permission;
        } catch (error) {
            throw new Error("Error creating permission: " + error.message);
        }
    },

    updatePermission: async (args) => {
        try {
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

    deletePermission: async (args) =>{
        try {
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