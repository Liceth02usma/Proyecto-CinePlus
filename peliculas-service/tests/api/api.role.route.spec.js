const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const jwt = require("jsonwebtoken");
const Role = require("../../src/models/role.model");
const Permission = require("../../src/models/permission.model");
const User = require("../../src/models/user.model");

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";

describe("Graphql getRoles", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "getRoles"
    const permGetRoles = await Permission.create({
      name: "getRoles",
      description: "Puede ver roles",
      route: "/roles",
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "Admin",
      description: "Rol con permiso getRoles",
      permissions: [permGetRoles._id],
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
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const query = `
    query {
      getRoles {
        name
        description
        permissions {
          name
        }
      }
    }
  `;

  it("Debe devolver un array de roles si el usuario tiene permiso", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query });


    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("json");
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data.getRoles)).toBe(true);
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.getRoles).toBeNull();
  });
});

describe("Graphql getRole", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;
  let roleId;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "getRole"
    const permGetRole = await Permission.create({
      name: "getRole",
      description: "Puede ver un rol",
      route: "/role",
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "Admin",
      description: "Rol con permiso getRole",
      permissions: [permGetRole._id],
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

    // Guardar el id del rol a consultar
    roleId = roleWithPerm._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe devolver un rol si el usuario tiene permiso", async () => {
    const query = `
      query {
        getRole(id: "${roleId}") {
          name
          description
          permissions {
            name
          }
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("json");
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.getRole).toBeDefined();
    expect(response.body.data.getRole.name).toBe("Admin");
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const query = `
      query {
        getRole(id: "${roleId}") {
          name
          description
          permissions {
            name
          }
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
    expect(response.body.data.getRole).toBeNull();
  });
});
describe("Graphql createRole", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "createRole"
    const permCreateRole = await Permission.create({
      name: "createRole",
      description: "Puede crear roles",
      route: "/roles",
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "Admin",
      description: "Rol con permiso createRole",
      permissions: [permCreateRole._id],
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
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe crear un rol si el usuario tiene permiso", async () => {
    const mutation = `
      mutation {
        createRole(name: "NuevoRol", description: "Rol de prueba") {
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query: mutation });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("json");
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.createRole).toBeDefined();
    expect(response.body.data.createRole.name).toBe("NuevoRol");
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const mutation = `
      mutation {
        createRole(name: "OtroRol", description: "Rol sin permiso") {
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({ query: mutation });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.createRole).toBeNull();
  });
});

describe("Graphql updateRole", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;
  let roleId;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "updateRole"
    const permUpdateRole = await Permission.create({
      name: "updateRole",
      description: "Puede actualizar roles",
      route: "/roles",
    });

    // Crear rol a actualizar
    const roleToUpdate = await Role.create({
      name: "RolOriginal",
      description: "Rol original",
      permissions: [],
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "Admin",
      description: "Rol con permiso updateRole",
      permissions: [permUpdateRole._id],
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

    // Guardar el id del rol a actualizar
    roleId = roleToUpdate._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe actualizar un rol si el usuario tiene permiso", async () => {
    const mutation = `
      mutation {
        updateRole(id: "${roleId}", name: "RolActualizado", description: "Rol actualizado") {
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query: mutation });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("json");
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.updateRole).toBeDefined();
    expect(response.body.data.updateRole.name).toBe("RolActualizado");
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const mutation = `
      mutation {
        updateRole(id: "${roleId}", name: "NoDebeActualizar", description: "No debe actualizar") {
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({ query: mutation });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.updateRole).toBeNull();
  });
});

describe("Graphql deleteRole", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;
  let roleId;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "deleteRole"
    const permDeleteRole = await Permission.create({
      name: "deleteRole",
      description: "Puede eliminar roles",
      route: "/roles",
    });

    // Crear rol a eliminar
    const roleToDelete = await Role.create({
      name: "RolAEliminar",
      description: "Rol a eliminar",
      permissions: [],
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "Admin",
      description: "Rol con permiso deleteRole",
      permissions: [permDeleteRole._id],
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

    // Guardar el id del rol a eliminar
    roleId = roleToDelete._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe eliminar un rol si el usuario tiene permiso", async () => {
    const mutation = `
      mutation {
        deleteRole(id: "${roleId}") {
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query: mutation });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("json");
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.deleteRole).toBeDefined();
    expect(response.body.data.deleteRole.name).toBe("RolAEliminar");
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    // Primero, crea un nuevo rol para intentar eliminarlo
    const newRole = await Role.create({
      name: "RolNoDebeEliminar",
      description: "No debe poder eliminar",
      permissions: [],
    });

    const mutation = `
      mutation {
        deleteRole(id: "${newRole._id}") {
          name
          description
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({ query: mutation });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.deleteRole).toBeNull();
  });
});

describe("Graphql addPermissionToRole", () => {
  let tokenWithPerm;
  let tokenWithoutPerm;
  let roleId;
  let permissionId;

  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Limpiar colecciones
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});

    // Crear permiso "addPermissionToRole"
    const permAddPermission = await Permission.create({
      name: "addPermissionToRole",
      description: "Puede agregar permisos a roles",
      route: "/roles",
    });

    // Crear otro permiso para agregar
    const permission = await Permission.create({
      name: "permisoExtra",
      description: "Permiso extra",
      route: "/algo",
    });

    // Crear rol al que se le agregará el permiso
    const role = await Role.create({
      name: "RolTest",
      description: "Rol de prueba",
      permissions: [],
    });

    // Crear rol con permiso
    const roleWithPerm = await Role.create({
      name: "Admin",
      description: "Rol con permiso addPermissionToRole",
      permissions: [permAddPermission._id],
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
      process.env.JWT_SECRET || "test_secret",
      { expiresIn: "8h" }
    );
    tokenWithoutPerm = jwt.sign(
      {
        id: userWithoutPerm._id,
        email: userWithoutPerm.email,
        role: userWithoutPerm.role,
      },
      process.env.JWT_SECRET || "test_secret",
      { expiresIn: "8h" }
    );

    // Guardar ids
    roleId = role._id;
    permissionId = permission._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("Debe agregar un permiso a un rol si el usuario tiene permiso", async () => {
    const mutation = `
      mutation {
        addPermissionToRole(role: "${roleId}", permission: "${permissionId}") {
          name
          permissions {
            name
          }
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithPerm}`)
      .send({ query: mutation });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("json");
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.addPermissionToRole).toBeDefined();
    expect(
      response.body.data.addPermissionToRole.permissions.some(
        (p) => p.name === "permisoExtra"
      )
    ).toBe(true);
  });

  it("Debe retornar error de acceso denegado si el usuario NO tiene permiso", async () => {
    const mutation = `
      mutation {
        addPermissionToRole(role: "${roleId}", permission: "${permissionId}") {
          name
          permissions {
            name
          }
        }
      }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${tokenWithoutPerm}`)
      .send({ query: mutation });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message.toLowerCase()).toContain(
      "acceso denegado"
    );
    expect(response.body.data.addPermissionToRole).toBeNull();
  });
});
