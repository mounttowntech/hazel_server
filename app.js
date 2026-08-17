
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
module.exports = app;