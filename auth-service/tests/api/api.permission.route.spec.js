const request = require("supertest");
const app = require("../../src/app");
const mongoose = require("mongoose");

describe("Graphql getPermissions", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    return mongoose.connect("mongodb://localhost:27017/test_db_permissions", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  afterAll(async () => {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
  });
  beforeEach(async () => {
    // Limpiar la colección de permisos antes de cada prueba
    await mongoose.connection.collection("permissions").deleteMany({});
  });

  it("Obtiene todos los permisos", async () => {
    const query = `
        query {
            getPermissions {
                _id
                    name
                    description
                }
            }
        `;

    const response = await request(app).post("/graphql").send({
      query,
    });

    console.log("response: ", response.body);

    expect(response.status).toBe(200);
    expect(response.body.data.getPermissions).toBeDefined();
    expect(Array.isArray(response.body.data.getPermissions)).toBe(true);
  });

  it("Obtiene un status 200 y un array de permisos", async () => {
    const query = `
            query {
                getPermissions {
                    _id
                    name
                    description
                }
            }
        `;

    const response = await request(app).post("/graphql").send({
      query,
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("json");
    expect(response.body.data.getPermissions).toBeDefined();
    expect(Array.isArray(response.body.data.getPermissions)).toBe(true);
  });
});

describe("Graphql getPermission", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    return mongoose.connect("mongodb://localhost:27017/test_db_permissions", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  afterAll(async () => {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
  });
  beforeEach(async () => {
    // Limpiar la colección de permisos antes de cada prueba
    await mongoose.connection.collection("permissions").deleteMany({});
  });

  it("Obtiene un permiso por id", async () => {
    const permission = {
      name: "Create Salas",
      description: "Permite crear salas",
      route: "api/salas/create",
    };

    // Crear un permiso para probar la consulta
    const permissionCreated = await request(app)
      .post("/graphql")
      .send({
        query: `
                mutation {
                    createPermission(name: "${permission.name}", description: "${permission.description}", route: "${permission.route}") {
                        _id
                    }
                }
            `,
      });

    const permissionId = permissionCreated.body.data.createPermission._id;

    const query = `
            query {
                getPermission(id: "${permissionId}") {
                    _id
                    name
                    description
                    route
                }
            }
        `;

    const response = await request(app).post("/graphql").send({
      query,
    });
    console.log("response: ", response.body);
    expect(response.status).toBe(200);
    expect(response.body.data.getPermission).toBeDefined();
    expect(response.body.data.getPermission.name).toBe(permission.name);
    expect(response.body.data.getPermission.description).toBe(
      permission.description
    );
    expect(response.body.data.getPermission.route).toBe(permission.route);
  });
  it("Obtiene un error si el permiso no existe", async () => {
    const query = `
            query {
                getPermission(id: "nonexistent_id") {
                    _id
                    name
                    description
                    route
                }
            }
        `;

    const response = await request(app).post("/graphql").send({
      query,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain(
      "Error al obtener el permiso:"
    );
  });
});

describe("Graphql CreatePermission", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    return mongoose.connect("mongodb://localhost:27017/test_db_permissions", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  afterAll(async () => {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
  });
  beforeEach(async () => {
    // Limpiar la colección de permisos antes de cada prueba
    await mongoose.connection.collection("permissions").deleteMany({});
  });

  it("Crea un permiso", async () => {
    const query = `
      mutation{
        createPermission(name: "Create Salas", description: "Permite crear salas", route:"api/salas/create"){
            _id
            name
            description
            route
        }
        }
        `;
    const response = await request(app).post("/graphql").send({
      query,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.createPermission).toBeDefined();
    expect(response.body.data.createPermission.name).toBe("Create Salas");
    expect(response.body.data.createPermission.description).toBe(
      "Permite crear salas"
    );
    expect(response.body.data.createPermission.route).toBe("api/salas/create");
  });

  it("No crea un permiso por falta de campos", async () => {
    const query = `
        mutation{
            createPermission(name: "Create Salas", description: "Permite crear salas"){
                _id
                name
                description
                route
                }
                }
                `;

    const response = await request(app).post("/graphql").send({
      query,
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});

describe("Graphql UpdatePermission", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    return mongoose.connect("mongodb://localhost:27017/test_db_permissions", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  afterAll(async () => {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
  });
  beforeEach(async () => {
    // Limpiar la colección de permisos antes de cada prueba
    await mongoose.connection.collection("permissions").deleteMany({});
  });
  it("Actualiza un permiso", async () => {
    const permissionData = {
      name: "Create Salas",
      description: "Permite crear salas",
      route: "api/salas/create",
    };
    // Crear un permiso para probar la actualización
    const permissionCreated = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
        createPermission(name: "${permissionData.name}", description: "${permissionData.description}", route: "${permissionData.route}") {
            _id
        }
      }
        `,
      });

    const permissionId = permissionCreated.body.data.createPermission._id;
    const query = `
        mutation {
            updatePermission(id: "${permissionId}", name: "Update Salas", description: "Permite actualizar salas") {
                _id
                name
                description}
    }
        `;
    const response = await request(app).post("/graphql").send({
      query,
    });

    console.log("response: ", response.body);

    expect(response.status).toBe(200);
    expect(response.body.data.updatePermission).toBeDefined();
    expect(response.body.data.updatePermission._id).toBe(permissionId);
    expect(response.body.data.updatePermission.name).toBe("Update Salas");
    expect(response.body.data.updatePermission.description).toBe(
      "Permite actualizar salas"
    );
  });

  it("No actualiza un permiso por falta de campos", async () => {
    const query = `
        mutation {
            updatePermission(id: "nonexistent_id", name: "Update Salas") {
                _id
            }
        }
        `;

    const response = await request(app).post("/graphql").send({
      query,
    });

    //expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it("No actualiza un permiso si no existe", async () => {
    const query = `
        mutation {
            updatePermission(id: "nonexistent_id", name: "Update Salas", description: "Permite actualizar salas") {
                _id
            }
        }
        `;

    const response = await request(app).post("/graphql").send({
      query,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain(
      "Error updating permission:"
    );
  });
});

describe("Graphql DeletePermission", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    return mongoose.connect("mongodb://localhost:27017/test_db_permissions", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  afterAll(async () => {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
  });
  beforeEach(async () => {
    // Limpiar la colección de permisos antes de cada prueba
    await mongoose.connection.collection("permissions").deleteMany({});
  });

it("Elimina un permiso correctamente", async () => {
  const permissionData = {
    name: "Crear sillas",
    description: "Permite crear una silla",
    route: "/create-sillas",
  };

  // Crear el permiso
  const permissionCreated = await request(app)
    .post("/graphql")
    .send({
      query: `
        mutation {
          createPermission(
            name: "${permissionData.name}",
            description: "${permissionData.description}",
            route: "${permissionData.route}"
          ) {
            _id
            name
            description
          }
        }
      `,
    });

  const permissionId = permissionCreated.body.data.createPermission._id;

  // Eliminar el permiso
  const responseDelete = await request(app)
    .post("/graphql")
    .send({
      query: `
        mutation {
          deletePermission(id: "${permissionId}") {
            _id
            name
            description
          }
        }
      `,
    });

  expect(responseDelete.status).toBe(200);
  expect(responseDelete.body.data.deletePermission).toBeDefined();
  expect(responseDelete.body.data.deletePermission._id).toBe(permissionId);

  // Intentar obtener el permiso eliminado
  const getResponse = await request(app).post("/graphql").send({
    query: `
      query {
        getPermission(id: "${permissionId}") {
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
});
