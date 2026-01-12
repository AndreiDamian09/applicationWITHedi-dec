/**
 * Main Server File
 * Initializes Express app, connects to database, and sets up routes
 */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize } = require("./models");
const { PORT } = require("./config/config");

// Import routes
const authRoutes = require("./routes/auth");
const professorRoutes = require("./routes/professor");
const studentRoutes = require("./routes/student");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/professor", professorRoutes);
app.use("/api/student", studentRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Dissertation Registration API is running" });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Sync database
    await sequelize.sync({ alter: true });
    console.log("Database synchronized");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
