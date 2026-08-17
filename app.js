
const express = require("express");

const app = express();

// Middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
  });
});

// Routes

app.use("/api/auth",require("./src/routes/authRoutes"));
app.use("/api/categories",require("./src/routes/categoryRoutes"));
app.use("/api/brands",require("./src/routes/brandRoutes"));
module.exports = app;