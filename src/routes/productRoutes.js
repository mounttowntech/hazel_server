
const express = require("express");

const router = express.Router();

// ============================================================
// CONTROLLER
// ============================================================

const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariantMedia,
  deleteVariantMedia,
} = require("../controllers/productController");

// ============================================================
// UPLOAD MIDDLEWARE
// ============================================================

const {
  uploadProductMedia,
} = require("../middleware/uploadMiddleware");

// ============================================================
// PRODUCT ROUTES
// ============================================================

// ------------------------------------------------------------
// CREATE PRODUCT
// POST /api/products/create
// ------------------------------------------------------------

router.post(
  "/create",
  uploadProductMedia.array("media", 10),
  createProduct
);

// ------------------------------------------------------------
// GET ALL PRODUCTS
// GET /api/products/all
// ------------------------------------------------------------

router.get(
  "/all",
  getAllProducts
);

// ------------------------------------------------------------
// GET PRODUCT BY ID
// GET /api/products/:productId
// ------------------------------------------------------------

router.get(
  "/:productId",
  getProductById
);

// ------------------------------------------------------------
// UPDATE PRODUCT
// PUT /api/products/:productId
// ------------------------------------------------------------

router.put(
  "/:productId",
  uploadProductMedia.array("media", 10),
  updateProduct
);

// ------------------------------------------------------------
// DELETE PRODUCT
// DELETE /api/products/:productId
// ------------------------------------------------------------

router.delete(
  "/:productId",
  deleteProduct
);

// ============================================================
// PRODUCT VARIANT MEDIA ROUTES
// ============================================================

// ------------------------------------------------------------
// ADD MEDIA TO COLOR VARIANT
// POST /api/products/:productId/variants/:variantId/media
// ------------------------------------------------------------

router.post(
  "/:productId/variants/:variantId/media",
  uploadProductMedia.array("media", 10),
  addVariantMedia
);

// ------------------------------------------------------------
// DELETE MEDIA FROM COLOR VARIANT
// DELETE /api/products/:productId/variants/:variantId/media/:mediaId
// ------------------------------------------------------------

router.delete(
  "/:productId/variants/:variantId/media/:mediaId",
  deleteVariantMedia
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;

