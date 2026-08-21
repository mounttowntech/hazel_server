const express = require("express");

const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  uploadProductImage,
} = require("../middleware/uploadMiddleware");


// ==========================================================
// CREATE PRODUCT
// ==========================================================

router.post(
  "/create",
  uploadProductImage.array("images", 10),
  createProduct
);


// Other routes...

router.get(
  "/all",
  getProducts
);

router.get(
  "/:id",
  getProductById
);

router.put(
  "/update/:id",
  uploadProductImage.array("images", 10),
  updateProduct
);

router.delete(
  "/delete/:id",
  deleteProduct
);


module.exports = router;