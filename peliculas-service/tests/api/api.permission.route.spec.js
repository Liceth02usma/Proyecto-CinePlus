const request = require("supertest");
const app = require("../../src/app");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Role = require("../../src/models/role.model");
const Permission = require("../../src/models/permission.model");
const User = require("../../src/models/user.model");

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";

describe("Graphql getPermissions", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_permissions", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "getPermissions"
    const permGetPermissions = await Permission.create({
      name: "getPermissions",
      description: "Puede ver permisos",
      route: "/permissions",
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "Admin",
      description: "Rol con permiso getPermissions",
      permissions: [permGetPermissions._id],
    });

    // Crear rol sin permiso
    const roleWithoutPerm = await Role.create({
      name: "Invitado",
      description: "Rol sin permisos",
      permissions: [],
    });

    // Crear usuario con permiso
    const userWithPerm = await User.create({
      name: "ConPermiso",
      lastname: "Test",
      email: "conpermiso@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithPerm._id,
      active: true,
    });

    // Crear usuario sin permiso
    const userWithoutPerm = await User.create({
      name: "SinPermiso",
      lastname: "Test",
      email: "sinpermiso@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithoutPerm._id,
      active: true,
    });

    // Generar tokens
    tokenWithPerm = jwt.sign(
      {
        id: userWithPerm._id,
        email: userWithPerm.email,
        role: userWithPerm.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    tokenWithoutPerm = jwt.sign(
      {
        id: userWithoutPerm._id,
        email: userWithoutPerm.email,
        role: userWithoutPerm.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Crear algunos permisos para poblar la colección
    await Permission.create([
      { name: "permiso1", description: "desc1", route: "/p1" },
      { name: "permiso2", description: "desc2", route: "/p2" },
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe devolver un array de permisos si el usuario tiene permiso", async () => {
    const query = `
      query {
        getPermissions {
          _id
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.getPermissions).toBeDefined();
    expect(Array.isArray(response.body.data.getPermissions)).toBe(true);
    expect(response.body.errors).toBeUndefined();
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const query = `
      query {
        getPermissions {
          _id
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.getPermissions).toBeNull();
  });
});

describe("Graphql getPermission (con control de permisos)", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;
  let createdPermissionId;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_permissions", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "getPermission"
    const permGetPermission = await Permission.create({
      name: "getPermission",
      description: "Puede ver un permiso",
      route: "/permission",
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "AdminGetPermission",
      description: "Rol con permiso getPermission",
      permissions: [permGetPermission._id],
    });

    // Crear rol sin permiso
    const roleWithoutPerm = await Role.create({
      name: "InvitadoGetPermission",
      description: "Rol sin permisos",
      permissions: [],
    });

    // Crear usuario con permiso
    const userWithPerm = await User.create({
      name: "ConPermisoGet",
      lastname: "Test",
      email: "conpermisoget@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithPerm._id,
      active: true,
    });

    // Crear usuario sin permiso
    const userWithoutPerm = await User.create({
      name: "SinPermisoGet",
      lastname: "Test",
      email: "sinpermisoget@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithoutPerm._id,
      active: true,
    });

    // Generar tokens
    tokenWithPerm = jwt.sign(
      {
        id: userWithPerm._id,
        email: userWithPerm.email,
        role: userWithPerm.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    tokenWithoutPerm = jwt.sign(
      {
        id: userWithoutPerm._id,
        email: userWithoutPerm.email,
        role: userWithoutPerm.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Crear un permiso para probar la consulta
    const permiso = await Permission.create({
      name: "Permiso Individual",
      description: "Permiso para prueba individual",
      route: "/permiso-individual",
    });
    createdPermissionId = permiso._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe devolver un permiso si el usuario tiene permiso", async () => {
    const query = `
      query {
        getPermission(id: "${createdPermissionId}") {
          _id
          name
          description
          route
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.getPermission).toBeDefined();
    expect(response.body.data.getPermission._id).toBe(
      String(createdPermissionId)
    );
    expect(response.body.errors).toBeUndefined();
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const query = `
      query {
        getPermission(id: "${createdPermissionId}") {
          _id
          name
          description
          route
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.getPermission).toBeNull();
  });
});

describe("Graphql createPermission (con control de permisos)", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_permissions", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "createPermission"
    const permCreatePermission = await Permission.create({
      name: "createPermission",
      description: "Puede crear permisos",
      route: "/permission/create",
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "AdminCreatePermission",
      description: "Rol con permiso createPermission",
      permissions: [permCreatePermission._id],
    });

    // Crear rol sin permiso
    const roleWithoutPerm = await Role.create({
      name: "InvitadoCreatePermission",
      description: "Rol sin permisos",
      permissions: [],
    });

    // Crear usuario con permiso
    const userWithPerm = await User.create({
      name: "ConPermisoCreate",
      lastname: "Test",
      email: "conpermisocreate@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithPerm._id,
      active: true,
    });

    // Crear usuario sin permiso
    const userWithoutPerm = await User.create({
      name: "SinPermisoCreate",
      lastname: "Test",
      email: "sinpermisocreate@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithoutPerm._id,
      active: true,
    });

    // Generar tokens
    tokenWithPerm = jwt.sign(
      {
        id: userWithPerm._id,
        email: userWithPerm.email,
        role: userWithPerm.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    tokenWithoutPerm = jwt.sign(
      {
        id: userWithoutPerm._id,
        email: userWithoutPerm.email,
        role: userWithoutPerm.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpiar permisos creados en cada test
    await Permission.deleteMany({ name: "Create Salas" });
  });

  it("Debe crear un permiso si el usuario tiene permiso", async () => {
    const query = `
      mutation {
        createPermission(
          name: "Create Salas",
          description: "Permite crear salas",
          route: "/api/salas/create"
        ) {
          _id
          name
          description
          route
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.createPermission).toBeDefined();
    expect(response.body.data.createPermission.name).toBe("Create Salas");
    expect(response.body.data.createPermission.description).toBe(
      "Permite crear salas"
    );
    expect(response.body.data.createPermission.route).toBe("/api/salas/create");
    expect(response.body.errors).toBeUndefined();
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const query = `
      mutation {
        createPermission(
          name: "Create Salas",
          description: "Permite crear salas",
          route: "/api/salas/create"
        ) {
          _id
          name
          description
          route
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.createPermission).toBeNull();
  });

  it("Debe retornar error si faltan campos requeridos", async () => {
    const query = `
      mutation {
        createPermission(
          name: "Create Salas"
        ) {
          _id
          name
          description
          route
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});

describe("Graphql updatePermission (con control de permisos)", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;
  let createdPermissionId;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_permissions", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "updatePermission"
    const permUpdatePermission = await Permission.create({
      name: "updatePermission",
      description: "Puede actualizar permisos",
      route: "/permission/update",
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "AdminUpdatePermission",
      description: "Rol con permiso updatePermission",
      permissions: [permUpdatePermission._id],
    });

    // Crear rol sin permiso
    const roleWithoutPerm = await Role.create({
      name: "InvitadoUpdatePermission",
      description: "Rol sin permisos",
      permissions: [],
    });

    // Crear usuario con permiso
    const userWithPerm = await User.create({
      name: "ConPermisoUpdate",
      lastname: "Test",
      email: "conpermisoUpdate@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithPerm._id,
      active: true,
    });

    // Crear usuario sin permiso
    const userWithoutPerm = await User.create({
      name: "SinPermisoUpdate",
      lastname: "Test",
      email: "sinpermisoUpdate@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithoutPerm._id,
      active: true,
    });

    // Generar tokens
    tokenWithPerm = jwt.sign(
      {
        id: userWithPerm._id,
        email: userWithPerm.email,
        role: userWithPerm.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    tokenWithoutPerm = jwt.sign(
      {
        id: userWithoutPerm._id,
        email: userWithoutPerm.email,
        role: userWithoutPerm.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Crear un permiso para probar la actualización
    const permiso = await Permission.create({
      name: "Permiso a actualizar",
      description: "Permiso para prueba de actualización",
      route: "/permiso-update",
    });
    createdPermissionId = permiso._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe actualizar un permiso si el usuario tiene permiso", async () => {
    const query = `
      mutation {
        updatePermission(
          id: "${createdPermissionId}",
          name: "Permiso Actualizado",
          description: "Descripción actualizada"
        ) {
          _id
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.updatePermission).toBeDefined();
    expect(response.body.data.updatePermission._id).toBe(
      String(createdPermissionId)
    );
    expect(response.body.data.updatePermission.name).toBe(
      "Permiso Actualizado"
    );
    expect(response.body.data.updatePermission.description).toBe(
      "Descripción actualizada"
    );
    expect(response.body.errors).toBeUndefined();
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const query = `
      mutation {
        updatePermission(
          id: "${createdPermissionId}",
          name: "Permiso Actualizado",
          description: "Descripción actualizada"
        ) {
          _id
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.updatePermission).toBeNull();
  });
});

describe("Graphql deletePermission (con control de permisos)", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;
  let createdPermissionId;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_permissions", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "deletePermission"
    const permDeletePermission = await Permission.create({
      name: "deletePermission",
      description: "Puede eliminar permisos",
      route: "/permission/delete",
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "AdminDeletePermission",
      description: "Rol con permiso deletePermission",
      permissions: [permDeletePermission._id],
    });

    // Crear rol sin permiso
    const roleWithoutPerm = await Role.create({
      name: "InvitadoDeletePermission",
      description: "Rol sin permisos",
      permissions: [],
    });

    // Crear usuario con permiso
    const userWithPerm = await User.create({
      name: "ConPermisoDelete",
      lastname: "Test",
      email: "conpermisodelete@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithPerm._id,
      active: true,
    });

    // Crear usuario sin permiso
    const userWithoutPerm = await User.create({
      name: "SinPermisoDelete",
      lastname: "Test",
      email: "sinpermisodelete@example.com",
      password: await require("bcrypt").hash("Password123!", 10),
      phone: "1234567890",
      role: roleWithoutPerm._id,
      active: true,
    });

    // Generar tokens
    tokenWithPerm = jwt.sign(
      {
        id: userWithPerm._id,
        email: userWithPerm.email,
        role: userWithPerm.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    tokenWithoutPerm = jwt.sign(
      {
        id: userWithoutPerm._id,
        email: userWithoutPerm.email,
        role: userWithoutPerm.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Crear un permiso para probar la eliminación
    const permiso = await Permission.create({
      name: "Permiso a eliminar",
      description: "Permiso para prueba de eliminación",
      route: "/permiso-delete",
    });
    createdPermissionId = permiso._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe eliminar un permiso si el usuario tiene permiso", async () => {
    const query = `
      mutation {
        deletePermission(id: "${createdPermissionId}") {
          _id
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.deletePermission).toBeDefined();
    expect(response.body.data.deletePermission._id).toBe(
      String(createdPermissionId)
    );
    expect(response.body.errors).toBeUndefined();

    // Intentar obtener el permiso eliminado
    const getResponse = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({
        query: `
          query {
            getPermission(id: "${createdPermissionId}") {
              _id
              name
              description
            }
          }
        `,
      });

    expect(getResponse.body.data.getPermission).toBeNull();
    expect(getResponse.body.errors).toBeDefined();
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    // Primero crea un permiso nuevo para este test
    const permiso = await Permission.create({
      name: "Permiso a eliminar sin permiso",
      description: "No debe poder eliminarse",
      route: "/permiso-delete-no",
    });

    const query = `
      mutation {
        deletePermission(id: "${permiso._id}") {
          _id
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.deletePermission).toBeNull();
  });
});
