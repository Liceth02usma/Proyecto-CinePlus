const request = require("supertest");
const app = require("../../src/app");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: __dirname + "/../../.env" });
const JWT_SECRET = process.env.JWT_SECRET;
const Role = require("../../src/models/role.model");
const Permission = require("../../src/models/permission.model");
const User = require("../../src/models/user.model");

describe("Graphql getUsers (con control de permisos)", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;
  let roleWithPerm;
  let roleWithoutPerm;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_user", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await mongoose.connection.collection("users").deleteMany({});
    await mongoose.connection.collection("roles").deleteMany({});
    await mongoose.connection.collection("permissions").deleteMany({});

    // Crear permiso "getUsers"
    const permGetUsers = await mongoose.connection
      .collection("permissions")
      .insertOne({
        name: "getUsers",
        description: "Puede ver usuarios",
        route: "/users",
      });

    // Crear rol con permiso
    const roleWithPermResult = await mongoose.connection
      .collection("roles")
      .insertOne({
        name: "AdminGetUsers",
        description: "Rol con permiso getUsers",
        permissions: [permGetUsers.insertedId],
      });
    roleWithPerm = roleWithPermResult.insertedId;

    // Crear rol sin permiso
    const roleWithoutPermResult = await mongoose.connection
      .collection("roles")
      .insertOne({
        name: "InvitadoGetUsers",
        description: "Rol sin permisos",
        permissions: [],
      });
    roleWithoutPerm = roleWithoutPermResult.insertedId;

    // Crear usuarios
    const userWithPerm = await mongoose.connection
      .collection("users")
      .insertOne({
        name: "ConPermiso",
        lastname: "Test",
        email: "conpermiso@example.com",
        password: await bcrypt.hash("Password123!", 10),
        phone: "1234567890",
        role: roleWithPerm,
        active: true,
      });

    const userWithoutPerm = await mongoose.connection
      .collection("users")
      .insertOne({
        name: "SinPermiso",
        lastname: "Test",
        email: "sinpermiso@example.com",
        password: await bcrypt.hash("Password123!", 10),
        phone: "1234567890",
        role: roleWithoutPerm,
        active: true,
      });

    // Crear usuarios normales para la consulta
    await mongoose.connection.collection("users").insertMany([
      {
        name: "Alice",
        lastname: "Smith",
        email: "alice@example.com",
        password: await require("bcrypt").hash("Password123!", 10),
        phone: "1111111111",
        role: roleWithPerm,
        active: true,
      },
      {
        name: "Bob",
        lastname: "Brown",
        email: "bob@example.com",
        password: await require("bcrypt").hash("Password123!", 10),
        phone: "2222222222",
        role: roleWithPerm,
        active: true,
      },
    ]);

    // Generar tokens
    tokenWithPerm = jwt.sign(
      {
        id: userWithPerm.insertedId,
        email: "conpermiso@example.com",
        role: roleWithPerm,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    tokenWithoutPerm = jwt.sign(
      {
        id: userWithoutPerm.insertedId,
        email: "sinpermiso@example.com",
        role: roleWithoutPerm,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe retornar todos los usuarios si el usuario tiene permiso", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          query {
            getUsers {
              _id
              name
              email
              role {
                _id
                name
              }
            }
          }
        `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.getUsers).toBeDefined();
    expect(Array.isArray(response.body.data.getUsers)).toBe(true);
    // Deben estar los usuarios creados
    const names = response.body.data.getUsers.map((u) => u.name);
    expect(names).toEqual(
      expect.arrayContaining(["Alice", "Bob", "ConPermiso", "SinPermiso"])
    );
    expect(response.body.errors).toBeUndefined();
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({
        query: `
          query {
            getUsers {
              _id
              name
              email
            }
          }
        `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.getUsers).toBeNull();
  });
});

describe("Graphql getUser (con control de permisos)", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;
  let userIdWithPerm;
  let userIdWithoutPerm;
  let roleWithPerm;
  let roleWithoutPerm;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_user", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await mongoose.connection.collection("users").deleteMany({});
    await mongoose.connection.collection("roles").deleteMany({});
    await mongoose.connection.collection("permissions").deleteMany({});

    // Crear permiso "getUser"
    const permGetUser = await mongoose.connection
      .collection("permissions")
      .insertOne({
        name: "getUser",
        description: "Puede ver un usuario",
        route: "/user",
      });

    // Crear rol con permiso
    const roleWithPermResult = await mongoose.connection
      .collection("roles")
      .insertOne({
        name: "AdminGetUser",
        description: "Rol con permiso getUser",
        permissions: [permGetUser.insertedId],
      });
    roleWithPerm = roleWithPermResult.insertedId;

    // Crear rol sin permiso
    const roleWithoutPermResult = await mongoose.connection
      .collection("roles")
      .insertOne({
        name: "InvitadoGetUser",
        description: "Rol sin permisos",
        permissions: [],
      });
    roleWithoutPerm = roleWithoutPermResult.insertedId;

    // Crear usuario con permiso
    const userWithPerm = await mongoose.connection
      .collection("users")
      .insertOne({
        name: "ConPermiso",
        lastname: "Test",
        email: "conpermiso@example.com",
        password: await require("bcrypt").hash("Password123!", 10),
        phone: "1234567890",
        role: roleWithPerm,
        active: true,
      });
    userIdWithPerm = userWithPerm.insertedId;

    // Crear usuario sin permiso
    const userWithoutPerm = await mongoose.connection
      .collection("users")
      .insertOne({
        name: "SinPermiso",
        lastname: "Test",
        email: "sinpermiso@example.com",
        password: await require("bcrypt").hash("Password123!", 10),
        phone: "1234567890",
        role: roleWithoutPerm,
        active: true,
      });
    userIdWithoutPerm = userWithoutPerm.insertedId;

    // Generar tokens
    tokenWithPerm = jwt.sign(
      {
        id: userIdWithPerm,
        email: "conpermiso@example.com",
        role: roleWithPerm,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    tokenWithoutPerm = jwt.sign(
      {
        id: userIdWithoutPerm,
        email: "sinpermiso@example.com",
        role: roleWithoutPerm,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe retornar el usuario si el usuario tiene permiso", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          query {
            getUser(id: "${userIdWithPerm}") {
              _id
              name
              email
            }
          }
        `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.getUser).toBeDefined();
    expect(response.body.data.getUser._id).toBe(String(userIdWithPerm));
    expect(response.body.data.getUser.name).toBe("ConPermiso");
    expect(response.body.data.getUser.email).toBe("conpermiso@example.com");
    expect(response.body.errors).toBeUndefined();
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({
        query: `
          query {
            getUser(id: "${userIdWithPerm}") {
              _id
              name
              email
            }
          }
        `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.getUser).toBeNull();
  });

  it("Debe retornar null si el usuario no existe", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          query {
            getUser(id: "${fakeId}") {
              _id
              name
              email
            }
          }
        `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.getUser).toBeNull();
    expect(response.body.errors).toBeDefined();
  });
});

describe("Graphql createUser (con control de roles, permisos y token)", () => {
  let tokenWithPerm;
  let roleForNewUser;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_user", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // 1. Crear permiso "createUser"
    const permCreateUser = await Permission.create({
      name: "createUser",
      description: "Puede crear usuarios",
      route: "/user/create",
    });

    // 2. Crear rol con permiso "createUser"
    const roleWithPerm = await Role.create({
      name: "AdminCreateUser",
      description: "Rol con permiso createUser",
      permissions: [permCreateUser._id],
    });

    // 3. Crear usuario con ese rol
    const userWithPerm = await User.create({
      name: "Admin",
      lastname: "Test",
      email: "admin.createuser@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithPerm._id,
      active: true,
    });

    // 4. Generar token con permiso
    tokenWithPerm = jwt.sign(
      {
        id: userWithPerm._id,
        email: userWithPerm.email,
        role: roleWithPerm._id,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 5. Crear un rol para los nuevos usuarios a crear
    roleForNewUser = await Role.create({
      name: "User",
      description: "Rol regular",
      permissions: [],
    });
  });

  it("Debe crear un usuario y retornar un token válido", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          mutation {
            createUser(
              name: "John",
              lastname: "Doe",
              email: "john.doe@example.com",
              password: "Password123!",
              passwordConfirmation: "Password123!",
              phone: "1234567890",
              role: "${roleForNewUser._id}"
            )
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.createUser).toBeDefined();
    expect(typeof response.body.data.createUser).toBe("string");
    expect(response.body.data.createUser.length).toBeGreaterThan(10);

    // Decodifica el token y verifica el email
    const decoded = jwt.verify(response.body.data.createUser, JWT_SECRET);
    expect(decoded.email).toBe("john.doe@example.com");

    // Verifica que el usuario existe en la base de datos
    const userInDb = await User.findOne({ email: "john.doe@example.com" });
    expect(userInDb).not.toBeNull();
    expect(userInDb.name).toBe("John");
    expect(userInDb.role.toString()).toBe(roleForNewUser._id.toString());
  });

  it("No debe crear un usuario con email duplicado", async () => {
    // Crear primer usuario
    await User.create({
      name: "John",
      lastname: "Doe",
      email: "john.doe@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleForNewUser._id,
      active: true,
    });

    // Intentar crear otro usuario con el mismo email
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          mutation {
            createUser(
              name: "Jane",
              lastname: "Doe",
              email: "john.doe@example.com",
              password: "Password123!",
              passwordConfirmation: "Password123!",
              phone: "1234567890",
              role: "${roleForNewUser._id}"
            )
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain("email");
  });

  it("No debe crear un usuario si la contraseña y confirmación no coinciden", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          mutation {
            createUser(
              name: "John",
              lastname: "Doe",
              email: "john2.doe@example.com",
              password: "Password123!",
              passwordConfirmation: "Password1234!",
              phone: "1234567890",
              role: "${roleForNewUser._id}"
            )
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "not match"
    );
  });

  it("No debe crear un usuario con email inválido", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          mutation {
            createUser(
              name: "John",
              lastname: "Doe",
              email: "no-es-un-email",
              password: "Password123!",
              passwordConfirmation: "Password123!",
              phone: "1234567890",
              role: "${roleForNewUser._id}"
            )
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain("email");
  });
});


describe("Graphql updateUser (con control de roles, permisos y token)", () => {
  let tokenWithPerm;
  let userIdToUpdate;
  let roleForUser;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_user", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // 1. Crear permiso "updateUser"
    const permUpdateUser = await Permission.create({
      name: "updateUser",
      description: "Puede actualizar usuarios",
      route: "/user/update",
    });

    // 2. Crear rol con permiso "updateUser"
    const roleWithPerm = await Role.create({
      name: "AdminUpdateUser",
      description: "Rol con permiso updateUser",
      permissions: [permUpdateUser._id],
    });

    // 3. Crear usuario con ese rol y generar token
    const userWithPerm = await User.create({
      name: "Admin",
      lastname: "Test",
      email: "admin.updateuser@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithPerm._id,
      active: true,
    });

    tokenWithPerm = jwt.sign(
      {
        id: userWithPerm._id,
        email: userWithPerm.email,
        role: roleWithPerm._id,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 4. Crear un usuario a actualizar
    roleForUser = await Role.create({
      name: "User",
      description: "Rol regular",
      permissions: [],
    });

    const userToUpdate = await User.create({
      name: "John",
      lastname: "Doe",
      email: "john.doe@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleForUser._id,
      active: true,
    });

    userIdToUpdate = userToUpdate._id;
  });

  it("Debe actualizar un usuario si el token tiene permiso", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          mutation {
            updateUser(
              id: "${userIdToUpdate}",
              name: "Jane",
              lastname: "Doe",
              email: "jane.doe@example.com",
              phone: "0987654321"
            ) {
              _id
              name
              email
              phone
            }
          }
        `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.updateUser).toBeDefined();
    expect(response.body.data.updateUser.name).toBe("Jane");
    expect(response.body.data.updateUser.email).toBe("jane.doe@example.com");
    expect(response.body.data.updateUser.phone).toBe("0987654321");
    expect(response.body.errors).toBeUndefined();
  });

  it("No debe actualizar un usuario si el token NO tiene permiso", async () => {
    // Crear rol sin permisos y usuario sin permiso
    const roleWithoutPerm = await Role.create({
      name: "Invitado",
      description: "Rol sin permisos",
      permissions: [],
    });
    const userWithoutPerm = await User.create({
      name: "Invitado",
      lastname: "Test",
      email: "invitado@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithoutPerm._id,
      active: true,
    });
    const tokenWithoutPerm = jwt.sign(
      {
        id: userWithoutPerm._id,
        email: userWithoutPerm.email,
        role: roleWithoutPerm._id,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({
        query: `
          mutation {
            updateUser(
              id: "${userIdToUpdate}",
              name: "Jane",
              lastname: "Doe",
              email: "jane.doe@example.com",
              phone: "0987654321"
            ) {
              _id
              name
              email
              phone
            }
          }
        `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain("acceso denegado");
    expect(response.body.data.updateUser).toBeNull();
  });

  it("No debe actualizar un usuario con un email duplicado", async () => {
    // Crear otro usuario con el email a duplicar
    await User.create({
      name: "Alice",
      lastname: "Smith",
      email: "alice.smith@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleForUser._id,
      active: true,
    });

    // Intentar actualizar el usuario con el email duplicado
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          mutation {
            updateUser(
              id: "${userIdToUpdate}",
              email: "alice.smith@example.com"
            ) {
              _id
              email
            }
          }
        `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain("email");
    expect(response.body.data.updateUser).toBeNull();
  });
});





describe("Graphql deleteUser (con control de roles, permisos y token)", () => {
  let tokenWithPerm;
  let userIdToDelete;
  let roleForUser;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_user", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // 1. Crear permiso "deleteUser"
    const permDeleteUser = await Permission.create({
      name: "deleteUser",
      description: "Puede eliminar usuarios",
      route: "/user/delete",
    });

    // 2. Crear rol con permiso "deleteUser"
    const roleWithPerm = await Role.create({
      name: "AdminDeleteUser",
      description: "Rol con permiso deleteUser",
      permissions: [permDeleteUser._id],
    });

    // 3. Crear usuario con ese rol y generar token
    const userWithPerm = await User.create({
      name: "Admin",
      lastname: "Test",
      email: "admin.deleteuser@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithPerm._id,
      active: true,
    });

    tokenWithPerm = jwt.sign(
      {
        id: userWithPerm._id,
        email: userWithPerm.email,
        role: roleWithPerm._id,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 4. Crear un usuario a eliminar
    roleForUser = await Role.create({
      name: "User",
      description: "Rol regular",
      permissions: [],
    });

    const userToDelete = await User.create({
      name: "Delete",
      lastname: "Me",
      email: "delete.me@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleForUser._id,
      active: true,
    });

    userIdToDelete = userToDelete._id;
  });

  it("Debe eliminar un usuario si el token tiene permiso", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          mutation {
            deleteUser(id: "${userIdToDelete}") {
              _id
              name
              email
            }
          }
        `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.deleteUser).toBeDefined();
    expect(response.body.data.deleteUser._id).toBe(String(userIdToDelete));

    // Verifica que ya no existe en la base de datos
    const userInDb = await User.findById(userIdToDelete);
    expect(userInDb).toBeNull();
  });

  it("No debe eliminar un usuario si el token NO tiene permiso", async () => {
    // Crear rol sin permisos y usuario sin permiso
    const roleWithoutPerm = await Role.create({
      name: "Invitado",
      description: "Rol sin permisos",
      permissions: [],
    });
    const userWithoutPerm = await User.create({
      name: "Invitado",
      lastname: "Test",
      email: "invitado@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithoutPerm._id,
      active: true,
    });
    const tokenWithoutPerm = jwt.sign(
      {
        id: userWithoutPerm._id,
        email: userWithoutPerm.email,
        role: roleWithoutPerm._id,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({
        query: `
          mutation {
            deleteUser(id: "${userIdToDelete}") {
              _id
              name
              email
            }
          }
        `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain("acceso denegado");
    expect(response.body.data.deleteUser).toBeNull();
  });
});









describe("Graphql login", () => {
  let roleId;
  let userEmail = "login.user@example.com";
  let userPassword = "Password123!";
  let userId;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_user", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const permission = await Permission.create({
      name: "getUser",
      description: "Permite obtener información del usuario",
      route: "/user/get",
    });

    // Crear rol directamente con el modelo
    const role = await Role.create({
      name: "User",
      description: "Regular user",
      permissions: [permission._id],
    });
    roleId = role._id;

    // Crear usuario directamente con el modelo
    const user = await User.create({
      name: "Login",
      lastname: "User",
      email: userEmail,
      password: await require("bcrypt").hash(userPassword, 10),
      phone: "1234567890",
      role: roleId,
      active: true,
    });
    userId = user._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Si tienes una colección de sesiones, límpiala aquí
    if (mongoose.connection.collection("sessions")) {
      await mongoose.connection.collection("sessions").deleteMany({});
    }
  });

  it("CP1.1 - Contraseña inválida", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          loginUser(email: "${userEmail}", password: "WrongPassword!")
        }
      `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(
      response.body.errors[0].message.toLowerCase()
    ).toContain("contraseña");
  });

  it("CP1.2 - Usuario no registrado", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          loginUser(email: "not.registered@example.com", password: "Password123!")
        }
      `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(
      response.body.errors[0].message.toLowerCase()
    ).toContain("usuario no registrado");
  });

  it("CP1.3 - Campo de correo vacío", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          loginUser(email: "", password: "${userPassword}")
        }
      `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(
      response.body.errors[0].message.toLowerCase()
    ).toContain("email");
  });

  it("CP1.4 - Campo de contraseña vacío", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          loginUser(email: "${userEmail}", password: "")
        }
      `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(
      response.body.errors[0].message.toLowerCase()
    ).toContain("contraseña");
  });

  it("CP1.5 - Inicio de sesión exitoso", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          loginUser(email: "${userEmail}", password: "${userPassword}")
        }
      `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.data.loginUser).toBeDefined();
    expect(typeof response.body.data.loginUser).toBe("string");
    // Decodifica el token y verifica el email
    const decoded = jwt.verify(response.body.data.loginUser, JWT_SECRET);
    expect(decoded.email).toBe(userEmail);
  });

  it("CP1.6 - Mantener sesión activa", async () => {
    // Primero, inicia sesión para obtener el token
    const loginResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          loginUser(email: "${userEmail}", password: "${userPassword}")
        }
      `,
      });
    const token = loginResponse.body.data.loginUser;
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ahora, usa el token para acceder a una consulta protegida
    const userResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token}`)
      .send({
        query: `
          query {
            getUser(id: "${decoded.id}") {
              _id
              email
            }
          }
        `,
      });
    expect(userResponse.statusCode).toBe(200);
    expect(userResponse.body.data.getUser).toBeDefined();
    expect(userResponse.body.data.getUser.email).toBe(userEmail);
  });
});