require("dotenv").config({ path: __dirname + "/../../.env" });

const mongoose = require("mongoose");
const URI = process.env.MONGO_URI;

console.log("RUTA", __dirname + "/../../.env");

const connectToDatabase = async () => {
  /* try {
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Conectado a la base de datos");
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
  } */
};

module.exports = connectToDatabase;
