const request = require("supertest");
const app = require("../../src/app");
const mongoose = require("mongoose");

describe("Graphql getUsers", () => {
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    return mongoose.connect("mongodb://localhost:27017/test_db_user", {
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
    await mongoose.connection.collection("user").deleteMany({});
  });

  it("Puede retornar todos los usuarios", async () => {
    const response = await request(app)
      .post("/graphql")
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
    console.log(response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.data.getUsers).toBeDefined();
    expect(Array.isArray(response.body.data.getUsers)).toBe(true);
    //expect(response.body.data.getUsers.length).toBe(0);
  });
});

describe("Graphql createUser", () => {
  let roleId;
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    return mongoose.connect("mongodb://localhost:27017/test_db_user", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  afterAll(async () => {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
  });
  beforeEach(async () => {
    // Limpiar la colección de usuarios antes de cada prueba
    await mongoose.connection.collection("users").deleteMany({});
    await mongoose.connection.collection("roles").deleteMany({});
    // Crear un rol de prueba
    const Role = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          createRole(name: "User", description: "Regular user") {
            _id
          }
        }
      `,
      });
    roleId = Role.body.data.createRole._id;
  });

  it("Puede crear un usuario", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createUser(
              name: "John",
              lastname: "Doe",
              email: "john.doe@example.com",
              password: "Password123!",
              passwordConfirmation: "Password123!",
              role: "${roleId}",
              phone: "1234567890"
            ) {
              _id
              name
              lastname
              email
              phone
            }
          }
        `,
      });
    console.log("crear usuario: ", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.data.createUser).toBeDefined();
    expect(response.body.data.createUser.name).toBe("John");
    expect(response.body.data.createUser.lastname).toBe("Doe");
    expect(response.body.data.createUser.email).toBe("john.doe@example.com");
    expect(response.body.data.createUser.phone).toBe("1234567890");
  });

  it("No puede crear un usuario sin email", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createUser(
              name: "John",
              lastname: "Doe",
              password: "Password123!",
              passwordConfirmation: "Password123!",
              phone: "1234567890",
              role: "${roleId}"
            ) {
              _id
              name
              lastname
              email
            }
          }
        `,
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toBeDefined();
    // El mensaje depende de tu lógica, puede ser "El correo es obligatorio"
  });

  it("No puede crear un usuario con email duplicado", async () => {
    // Primero creamos un usuario
    await request(app)
      .post("/graphql")
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
              role: "${roleId}"
            ) {
              _id
              name
              lastname
              email
            }
          }
        `,
      });
    // Ahora intentamos crear otro usuario con el mismo email
    const responseDuplicate = await request(app)
      .post("/graphql")
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
              role: "${roleId}"
            ) {
              _id
              name
              lastname
              email
            }
          }
        `,
      });
    expect(responseDuplicate.statusCode).toBe(200);
    expect(responseDuplicate.body.errors).toBeDefined();
    // El mensaje depende de tu lógica, puede ser "Email already exists"
  });

  it("No puede crear un usuario con una contraseña inválida", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createUser(
              name: "John",
              lastname: "Doe",
              email: "john.doe@example.com",
              password: "123456",
              passwordConfirmation: "123456",
              phone: "1234567890",
              role: "${roleId}"
            ) {
              _id
              name
              lastname
              email
            }
          }
        `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    // El mensaje depende de tu lógica, puede ser "La contraseña debe tener al menos una mayúscula, una minúscula, un número y un carácter especial"
  });

  it("No puede crear un usuario con un email inválido", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createUser(
              name: "John",
              lastname: "Doe",
              email: "invalid-email",
              password: "Password123!",
              passwordConfirmation: "Password123!",
              phone: "1234567890",
              role: "${roleId}"
            ) {
              _id
              name
              lastname
              email
            }
          }
        `,
      });
    console.log("email invalido", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    // El mensaje depende de tu lógica, puede ser "Correo inválido"
  });

  it("No puede crear un usuario con un teléfono inválido", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createUser(
              name: "John",
              lastname: "Doe",
              email: "john.doe@example.com",
              password: "Password123!",
              passwordConfirmation: "Password123!",
              phone: "12345",
              role: "${roleId}"
            ) {
              _id
              name
              lastname
              email
              phone
            }
          }
        `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    // El mensaje depende de tu lógica, puede ser "El teléfono debe tener 10 dígitos numéricos"
  });

  it("Contraseña y confirmación no coinciden", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createUser(
              name: "John",
              lastname: "Doe",
              email: "john.doe@example.com",
              password: "Password123!",
              passwordConfirmation: "Password1234!",
              phone: "1234567890",
              role: "${roleId}"
            ) {
              _id
              name
              lastname
              email
            }
          }
        `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
    // El mensaje depende de tu lógica, puede ser "Las contraseñas no coinciden"
  });

  it("Contraseña débil", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createUser(
              name: "John",
              lastname: "Doe",
              email: "john.doe@example.com",
              password: "abcdefg1",
              passwordConfirmation: "abcdefg1",
              phone: "1234567890",
              role: "${roleId}"
            ) {
              _id
              name
              lastname
              email
            }
          }
        `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("La contraseña está encriptada", async () => {
    const plainPassword = "Password123!";
    // Crear usuario
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          createUser(
            name: "John",
            lastname: "Doe",
            email: "john.encrypted@example.com",
            password: "${plainPassword}",
            passwordConfirmation: "${plainPassword}",
            phone: "1234567890",
            role: "${roleId}"
          ) {
            _id
            name
            email
          }
        }
      `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.createUser).toBeDefined();

    // Buscar el usuario en la base de datos
    const User = require("../../src/models/user.model");
    const user = await User.findOne({ email: "john.encrypted@example.com" });

    expect(user).toBeDefined();
    expect(user.password).toBeDefined();
    expect(user.password).not.toBe(plainPassword); // Debe estar encriptada
  });
});

describe("Graphql updateUser", () => {
  let userId;
  let roleId;

  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    return mongoose.connect("mongodb://localhost:27017/test_db_user", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpiar la colección de usuarios y roles antes de cada prueba
    await mongoose.connection.collection("users").deleteMany({});
    await mongoose.connection.collection("roles").deleteMany({});

    // Crear un rol de prueba
    const Role = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          createRole(name: "User", description: "Regular user") {
            _id
          }
        }
      `,
      });
    roleId = Role.body.data.createRole._id;

    // Crear un usuario de prueba
    const User = await request(app)
      .post("/graphql")
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
            role: "${roleId}"
          ) {
            _id
            name
            email
          }
        }
      `,
      });

    userId = User.body.data.createUser._id;
  });

  afterEach(async () => {
    // Limpiar la colección de usuarios y roles después de cada prueba
    await mongoose.connection.collection("users").deleteMany({});
    await mongoose.connection.collection("roles").deleteMany({});
  });

  it("Actualizar usuario", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          updateUser(
            id: "${userId}",
            name: "Jane",
            lastname: "Doe",
            email: "jane.doe@example.com",
            phone: "0987654321"
          ) {
            _id
            name
            email
          }
        }
      `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.updateUser).toBeDefined();
    expect(response.body.data.updateUser.name).toBe("Jane");
    expect(response.body.data.updateUser.email).toBe("jane.doe@example.com");
  });

  it("No puede actualizar un usuario con un email duplicado", async () => {
    // Primero creamos otro usuario
    console.log("Actualizacion", roleId);
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          createUser(
            name: "Alice",
            lastname: "Smith",
            email: "alice.smith@example.com",
            password: "Password123!",
            passwordConfirmation: "Password123!",
            phone: "1234567890",
            role: "${roleId}"
          ) {
            _id
            name
            email
          }
        }
      `,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.createUser).toBeDefined();

    // Intentar actualizar el primer usuario con el email del segundo
    const updateResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          updateUser(
            id: "${userId}",
            email: "alice.smith@example.com"
          ) {
            _id
            email
          }
        }
      `,
      });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.errors[0].message).toContain(
      "Email already in use"
    );
  });
});

describe("Graphql deleteUser", () => {
  
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    return mongoose.connect("mongodb://localhost:27017/test_db_user", {
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
    await mongoose.connection.collection("user").deleteMany({});
  });
  it("Elimina un usuario correctamente", async () => {
    // Primero crea un rol de prueba
    const roleResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
      mutation {
        createRole(name: "User", description: "Regular user") {
          _id
        }
      }
    `,
      });
    const roleId = roleResponse.body.data.createRole._id;

    // Luego crea un usuario de prueba
    const userResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
      mutation {
        createUser(
          name: "Delete",
          lastname: "Me",
          email: "delete.me@example.com",
          password: "Password123!",
          passwordConfirmation: "Password123!",
          phone: "1234567890",
          role: "${roleId}"
        ) {
          _id
          name
          email
        }
      }
    `,
      });

    const userId = userResponse.body.data.createUser._id;

    // Elimina el usuario
    const deleteResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
      mutation {
        deleteUser(id: "${userId}") {
          _id
          name
          email
        }
      }
    `,
      });

    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.body.data.deleteUser).toBeDefined();
    expect(deleteResponse.body.data.deleteUser._id).toBe(userId);

    // Verifica que ya no existe en la base de datos
    const User = require("../../src/models/user.model");
    const userInDb = await User.findById(userId);
    expect(userInDb).toBeNull();
  });
});



describe("Graphql login",()=>{
  beforeAll(async () => {
    // Conectar a una base de datos de prueba
    return mongoose.connect("mongodb://localhost:27017/test_db_user", {
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
    await mongoose.connection.collection("user").deleteMany({});
  });

})
