const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");

/**
 * Middleware to verify JWT token
 * Extracts user information from token and attaches to request
 */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

/**
 * Middleware to check if user is a professor
 */
const isProfessor = (req, res, next) => {
  if (req.userRole !== "professor") {
    return res
      .status(403)
      .json({ error: "Access denied. Professor role required." });
  }
  next();
};

/**
 * Middleware to check if user is a student
 */
const isStudent = (req, res, next) => {
  if (req.userRole !== "student") {
    return res
      .status(403)
      .json({ error: "Access denied. Student role required." });
  }
  next();
};

module.exports = {
  verifyToken,
  isProfessor,
  isStudent,
};
