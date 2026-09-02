const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
app.use("/api/products",require("./src/routes/productRoutes"));
app.use("/api/product-variants",require("./src/routes/productVariantRoutes"));
app.use("/api/cart",require("./src/routes/cartRoutes"));
app.use("/api/wishlist",require("./src/routes/wishlistRoutes"));
app.use("/api/locations",require("./src/routes/locationRoutes"));
app.use("/api/addresses",require("./src/routes/addressRoutes"));
app.use("/api/orders",require("./src/routes/orderRoutes"));
app.use("/api/payments",require("./src/routes/paymentRoutes"));
app.use("/api/coupons",require("./src/routes/couponRoutes"));
app.use("/api/reviews",require("./src/routes/reviewRoutes"));
app.use("/api/banners",require("./src/routes/bannerRoutes"));
app.use("/api/notifications",require("./src/routes/notificationRoutes"));
app.use("/api/dashboard",require("./src/routes/dashboardRoutes"));
app.use("/api/subcategories", require("./src/routes/subCategoryRoutes"))
module.exports = app;