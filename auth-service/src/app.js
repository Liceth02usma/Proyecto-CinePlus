const express = require("express");
const {
  applyBodyParser,
} = require("./middlewares/parseRequestBody.middlewares");
const connectToDatabase = require("./config/db");


const app = express();



applyBodyParser(app);
connectToDatabase();


module.exports = app;
