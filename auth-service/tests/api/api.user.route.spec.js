const request = require("supertest");
const app = require("../../src/app");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config({path: __dirname + "/../../.env"})
const JWT_SECRET = process.env.JWT_SECRET 

console.log(__dirname + "/../../.env")
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
    return mongoose.connect("mongodb://localhost:27017/test_db_user", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });
  beforeEach(async () => {
    await mongoose.connection.collection("users").deleteMany({});
    await mongoose.connection.collection("roles").deleteMany({});
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

  it("Puede crear un usuario y retorna un token", async () => {
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
            )
          }
        `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.data.createUser).toBeDefined();
    expect(typeof response.body.data.createUser).toBe("string");
    expect(response.body.data.createUser.length).toBeGreaterThan(10);
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
            )
          }
        `,
      });
    expect([200, 400]).toContain(response.statusCode);
    expect(response.body.errors).toBeDefined();
  });

  it("No puede crear un usuario con email duplicado", async () => {
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
            )
          }
        `,
      });
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
            )
          }
        `,
      });
    expect(responseDuplicate.statusCode).toBe(200);
    expect(responseDuplicate.body.errors).toBeDefined();
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
            )
          }
        `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
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
            )
          }
        `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
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
            )
          }
        `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
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
            )
          }
        `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
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
            )
          }
        `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("El token se creo correctamente", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          createUser(
            name: "Token",
            lastname: "Test",
            email: "token.test@example.com",
            password: "Password123!",
            passwordConfirmation: "Password123!",
            phone: "1234567890",
            role: "${roleId}"
          )
        }
      `,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.data.createUser).toBeDefined();
    expect(typeof response.body.data.createUser).toBe("string");
    expect(response.body.data.createUser.length).toBeGreaterThan(10);
  });
});

describe("Graphql updateUser", () => {
  let userId;
  let roleId;

  beforeAll(async () => {
    return mongoose.connect("mongodb://localhost:27017/test_db_user", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
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

    // Crear un usuario de prueba y obtener el id desde el token
    const UserResponse = await request(app)
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
          )
        }
      `,
      });

    const token = UserResponse.body.data.createUser;
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  });

  afterEach(async () => {
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
    // Crear otro usuario y obtener su token
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
          )
        }
      `,
      });

    const token2 = response.body.data.createUser;
    const decoded2 = jwt.verify(token2, JWT_SECRET);

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
    // Crear rol
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

    // Crear usuario y obtener el id desde el token
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
        )
      }
    `,
      });

    const token = userResponse.body.data.createUser;
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

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
    // Crear rol y usuario de prueba
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
    roleId = roleResponse.body.data.createRole._id;

    // Crear usuario y obtener el id decodificando el token
    const userResponse = await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          createUser(
            name: "Login",
            lastname: "User",
            email: "${userEmail}",
            password: "${userPassword}",
            passwordConfirmation: "${userPassword}",
            phone: "1234567890",
            role: "${roleId}"
          )
        }
      `,
      });
    const token = userResponse.body.data.createUser;
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await mongoose.connection.collection("sessions").deleteMany({});
  });

  // CP1.1 - Contraseña inválida
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

  // CP1.2 - Usuario no registrado
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

  // CP1.3 - Campo de correo vacío
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

  // CP1.4 - Campo de contraseña vacío
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

  // CP1.5 - Inicio de sesión exitoso
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
    console.log("inicio de sesion exitoso, ", response.body)
    expect(response.statusCode).toBe(200);
    expect(response.body.data.loginUser).toBeDefined();
    expect(typeof response.body.data.loginUser).toBe("string");
    // Decodifica el token y verifica el email
    const decoded = jwt.verify(response.body.data.loginUser, JWT_SECRET);
    expect(decoded.email).toBe(userEmail);
  });

  // CP1.6 - Mantener sesión activa (token válido)
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
    console.log(token)
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(decoded)

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
    console.log("respuesta de usuario:", userResponse.body);
    expect(userResponse.body.data.getUser).toBeDefined();
    expect(userResponse.body.data.getUser.email).toBe(userEmail);
  });
});