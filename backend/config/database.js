const { Sequelize } = require("sequelize");
const path = require("path");

/**
 * Database Configuration
 * Uses SQLite for development, can be changed to PostgreSQL/MySQL for production
 */
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../database.sqlite"),
  logging: process.env.NODE_ENV === "development" ? console.log : false,
});

module.exports = sequelize;
