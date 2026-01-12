require("dotenv").config();

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key";

module.exports = {
  PORT,
  NODE_ENV,
  JWT_SECRET,
};
