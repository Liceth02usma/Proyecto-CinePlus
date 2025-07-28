const express = require('express');
const app = express();
const libraryRoutes = require('./routes/library.routes');

app.use(express.json());
app.use('/api/library', libraryRoutes);

module.exports = app;
