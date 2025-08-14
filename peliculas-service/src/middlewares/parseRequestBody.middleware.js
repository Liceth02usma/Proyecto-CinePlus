const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { graphqlHTTP } = require("express-graphql");
const { schema, rootValue, graphiql } = require("../graphql");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Role = require("../models/role.model");

module.exports = {
  applyBodyParser: (app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(
      "/graphql",
      graphqlHTTP(async (req) => {
        let user = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.split(" ")[1];
         
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
           
            const userDoc = await User.findById(decoded.id).populate({
              path: "role",
              populate: {
                path: "permissions",
                model: "Permission",
              },
            });
            if (userDoc && userDoc.role) {
             
              const permisos = (userDoc.role.permissions || []).map(
                (p) => p.name
              );
              user = {
                ...userDoc.toObject(),
                permisos,
              };
              
            }
          } catch (e) {
            user = null;
          }
        }
        return {
          schema,
          rootValue,
          graphiql,
          context: { user },
        };
      })
    );
  },
};

