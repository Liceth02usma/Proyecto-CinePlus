const request = require("supertest");
const app = require("../../src/app");
const mongoose = require("mongoose");

describe("Graphql getRoles", () => {
  let response;

  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    const query = `
    query{
    getRoles{
    name
    description
    permissions{
      name}
    }
    }
    `;

    response = await request(app).post("/graphql").send({
      query,
    });
  });
  it("Debe devolver un estado 200", async () => {
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("json");
  });

  it("Nos devulve un array de roles", async () => {
    expect(response.body.errors).toBeUndefined();

    // Validar que la data exista y sea un array
    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data.getRoles)).toBe(true);
  });
});

describe("Graphql createRole", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Limpiar la colección de roles después de cada prueba
    await mongoose.connection.collection("roles").deleteMany({});
  });

  afterAll(async () => {
    // Desconectar de la base de datos después de todas las pruebas
    await mongoose.disconnect();
  });

  it("Crea un nuevo rol correctamente", async () => {
    const mutation = `
    mutation {
      createRole(name: "Admin", description: "Rol de administrador") {
        _id
        name
        description
        permissions {
          name
          }
          }
          }
          `;

    response = await request(app).post("/graphql").send({
      query: mutation,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.createRole).toBeDefined();
    expect(response.body.data.createRole.name).toBe("Admin");
    expect(response.body.data.createRole.description).toBe(
      "Rol de administrador"
    );
    expect(response.body.data.createRole.permissions).toBeDefined();
    expect(response.body.data.createRole.permissions.length).toBe(0);
  });

  it("No crea un nuevo rol por falta de campos", async () => {
    const mutation = `
          mutation {
            createRole(
              name: "Admin"
              ) {
                _id
                name
                description
                }
                }
                `;

    response = await request(app).post("/graphql").send({
      query: mutation,
    });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});

describe("Graphql getRoleById", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Limpiar la colección de roles antes de cada prueba
    await mongoose.connection.collection("roles").deleteMany({});
  });

  afterAll(async () => {
    // Desconectar de la base de datos después de todas las pruebas
    await mongoose.disconnect();
  });

  it("Permite buscar un rol por ID", async () => {
    const roleData = {
      name: "Admin",
      description: "Rol de administrador",
    };

    // Crear un rol para la prueba
    const createdRole = await request(app)
      .post("/graphql")
      .send({
        query: `
      mutation {
        createRole(name: "${roleData.name}", description: "${roleData.description}") {
          _id
        }
      }
  `,
      });

    const roleId = createdRole.body.data.createRole._id;

    // Buscar el rol por ID
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        query {
          getRole(id: "${roleId}") {
            _id
            name
            description
            permissions {
              name
            }
          }
        }
      `,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.getRole).toEqual(
      expect.objectContaining({
        _id: roleId,
        name: "Admin",
        description: "Rol de administrador",
        permissions: [],
      })
    );
  });

  it("Devuelve un error 400 si el rol no existe", async () => {
    const nonExistentId = "60c72b2f9b1d8c001c8e4f5a"; // ID de ejemplo que no existe
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        query {
          getRoleById(id: "${nonExistentId}") {
            _id
            name
            description
          }
        }
      `,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});

describe("Graphql updateRole", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Limpiar la colección de roles después de cada prueba
    await mongoose.connection.collection("roles").deleteMany({});
  });

  afterAll(async () => {
    // Desconectar de la base de datos después de todas las pruebas
    await mongoose.disconnect();
  });

  it("Permite actualizar un rol", async () => {
    const rolData = {
      name: "Admin",
      descripcion: "Administrara todo",
    };

    //crear rol
    const createdRole = await request(app)
      .post("/graphql")
      .send({
        query: `
      mutation{
      createRole(name:"${rolData.name}", description:"${rolData.descripcion}"){
      _id
      }
      }
      `,
      });
    const roleId = createdRole.body.data.createRole._id;

    //actualizar rol
    const updatedRole = await request(app)
      .post("/graphql")
      .send({
        query: `
      mutation{
      updateRole(id:"${roleId}", name:"Usuario comun"){
      name
      description
      }
      }
      `,
      });

    expect(updatedRole.body.data.updateRole.name).toBe("Usuario comun");
    expect(updatedRole.status).toBe(200);
    expect(updatedRole.body.data.updateRole.description).toBe(
      "Administrara todo"
    );
  });
});

describe("Graphql deleteRole", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Limpiar la colección de roles después de cada prueba
    await mongoose.connection.collection("roles").deleteMany({});
  });

  afterAll(async () => {
    // Desconectar de la base de datos después de todas las pruebas
    await mongoose.disconnect();
  });

  it("Permite eliminar un rol", async () => {
    const roleData = {
      name: "Admin",
      description: "Rol de administrador",
    };

    // Crear un rol para la prueba
    const createdRole = await request(app)
      .post("/graphql")
      .send({
        query: `
      mutation {
        createRole(name: "${roleData.name}", description: "${roleData.description}") {
          _id
        }
      }
  `,
      });

    const roleId = createdRole.body.data.createRole._id;

    // Eliminar el rol por ID
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          deleteRole(id: "${roleId}") {
            _id
          }
        }
      `,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.deleteRole._id).toBe(roleId);

    // Verificar que el rol ya no existe
    const getResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
        query {
          getRole(id: "${roleId}") {
            _id
            name
            description
          }
        }
      `,
      });

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.errors).toBeDefined();
    expect(getResponse.body.data.getRole).toBeNull();
  });
});

describe("Graphql addPermission", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    await mongoose.connect("mongodb://localhost:27017/test_db_roles", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Limpiar la colección de roles después de cada prueba
    await mongoose.connection.collection("roles").deleteMany({});
    await mongoose.connection.collection("permissions").deleteMany({});
  });

  afterAll(async () => {
    // Desconectar de la base de datos después de todas las pruebas
    await mongoose.disconnect();
  });

  it("Permite agregar un permiso a un rol", async () => {
    const roleData = {
      name: "Admin",
      description: "Rol de administrador",
    };

    // Crear un rol para la prueba
    const createdRole = await request(app)
      .post("/graphql")
      .send({
        query: `
      mutation {
        createRole(name: "${roleData.name}", description: "${roleData.description}") {
          _id
        }
      }
  `,
      });

    const roleId = createdRole.body.data.createRole._id;
    console.log(roleId);

    // Crear un permiso para la prueba
    const permissionData = {
      name: "EDITAR_ROL",
      description: "Permiso para editar roles",
      route: "/role-edit",
    };

    const createdPermission = await request(app)
      .post("/graphql")
      .send({
        query: `
      mutation {
        createPermission(name: "${permissionData.name}", description: "${permissionData.description}", route:"${permissionData.route}") {
          _id
        }
      }
  `,
      });

    const permissionId = createdPermission.body.data.createPermission._id;
    console.log(permissionId);

    // Agregar el permiso al rol
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
      mutation {
        addPermissionToRole(role: "${roleId}", permission: "${permissionId}") {
          _id
          name
          description
          permissions {
            _id
            name
            description
          }
        }
      }
  `,
      });
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body.data.addPermissionToRole).toBeDefined();
    expect(response.body.data.addPermissionToRole.permissions).toContainEqual({
      _id: permissionId,
      name: permissionData.name,
      description: permissionData.description,
    });
  });

  it("Devuelve un error al no existir el permiso o el rol", async () => {
    // IDs que no existen en la base de datos
    const fakeRoleId = "60c72b2f9b1d8c001c8e4f5a";
    const fakePermissionId = "60c72b2f9b1d8c001c8e4f5b";

    // Intentar agregar un permiso inexistente a un rol inexistente
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          addPermissionToRole(role: "${fakeRoleId}", permission: "${fakePermissionId}") {
            _id
            name
            description
            permissions {
              _id
              name
              description
            }
          }
        }
      `,
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.data.addPermissionToRole).toBeNull();
  });
});
