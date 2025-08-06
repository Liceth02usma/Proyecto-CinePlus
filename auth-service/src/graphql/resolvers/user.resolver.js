const User = require("../../models/user.model");
const Role = require("../../models/role.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: __dirname + "/../../../.env" });
const { JWT_SECRET } = process.env;
// https://www.freecodecamp.org/news/how-to-hash-passwords-with-bcrypt-in-nodejs/

const isStrongPassword = (p) =>
  p.search(
    /^((?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=\S+$)(?=.*[;:\.,!¡\?¿@#\$%\^&\-_+=\(\)\[\]\{\}])).{8,20}$/
  ) != -1;

module.exports = {
  getUsers: async () => {
    try {
      const users = await User.find();
      if (!users) {
        return [];
      }
      return users;
    } catch (error) {
      throw new Error("Error fetching users: " + error.message);
    }
  },

  getUser: async ({ id }) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error) {
      throw new Error("Error fetching user: " + error.message);
    }
  },

  createUser: async (args) => {
    try {
      // Comprobar si contraseña de confirmación == contraseña
      if (args.password !== args.passwordConfirmation) {
        throw new Error("Passwords do not match");
      }

      console.log("args.role", args.role);

      const roleExists = await Role.exists({ _id: args.role });
      if (!roleExists) {
        throw new Error("Role does not exist");
      }
      // Validar contraseña segura
      if (!isStrongPassword(args.password)) {
        throw new Error(
          "Password must be between 8 and 20 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        );
      }
      // Comprobar si existe usuario con ese email
      args.email = args.email.trim().toLowerCase();
      const existingUser = await User.findOne({ email: args.email });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }
      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(args.password, 10);
      args.password = hashedPassword;
      delete args.passwordConfirmation;

      // Crear usuario
      const user = await User.create(args);

      if (!user) {
        throw new Error("Error creating user");
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "8h" }
      );
      
      return token;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Error creating user");
    }
  },

  updateUser: async (args) => {
    try {
      const user = await User.findById(args.id);
      if (!user) {
        throw new Error("User not found");
      }

      // Comprobar si contraseña de confirmación == contraseña
      if (args.password && args.password !== args.passwordConfirmation) {
        throw new Error("Passwords do not match");
      }

      // Validar contraseña segura
      if (args.password && !isStrongPassword(args.password)) {
        throw new Error(
          "Password must be between 8 and 20 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        );
      }

      //no se puede actualizar correo si ya le pertenece a otro usuario
      if (args.email) {
        const existingUser = await User.findOne({
          email: args.email,
          _id: { $ne: args.id },
        });
        if (existingUser) {
          throw new Error("Email already in use by another user");
        }
      }

      // Hashear contraseña si se proporciona
      if (args.password) {
        args.password = await bcrypt.hash(args.password, 10);
        delete args.passwordConfirmation;
      } else {
        delete args.password;
        delete args.passwordConfirmation;
      }

      const userUpdate = await User.findByIdAndUpdate(args.id, args, {
        new: true,
      });

      if (!userUpdate) {
        throw new Error("Error updating user");
      }

      return userUpdate;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Error updating user: " + error.message);
    }
  },

  deleteUser: async ({ id }) => {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        throw new Error("User not found");
      }
      //se tendra previsto trabajar en esto mas adelante
      return user;
    } catch (error) {
      throw new Error("Error deleting user: " + error.message);
    }
  },

  loginUser: async (args) => {
    try {
      // Normalizar email
      args.email = args.email.trim().toLowerCase();
      // Buscar usuario por email
      const user = await User.findOne({ email: args.email });
      if (!user) {
        throw new Error("Error en el email, usuario no registrado");
      }
      // Verificar contraseña con bcrypt (¡olvidaste el await!)
      const valid = await bcrypt.compare(args.password, user.password);
      if (!valid) {
        throw new Error("Error en la contraseña");
      }
      // Retornar el token JWT
      return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "8h" }
      );
    } catch (error) {
      throw new Error("Error al iniciar sesión: "+error.message);
    }
  },
};
