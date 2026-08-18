const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());



app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hazel Ecommerce API is running",
  });
});


// Routes

app.use("/api/auth",require("./src/routes/authRoutes"));
app.use("/api/categories",require("./src/routes/categoryRoutes"));
app.use("/api/brands",require("./src/routes/brandRoutes"));
app.use("/api/lengths",require("./src/routes/lengthRoutes"));
app.use("/api/neck-patterns",require("./src/routes/neckPatternRoutes"));
app.use("/api/size",require("./src/routes/sizeRoutes"));
app.use("/api/colors",require("./src/routes/colorRoutes"));
module.exports = app;