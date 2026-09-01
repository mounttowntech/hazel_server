const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/categoryController");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const {
  uploadCategoryImage,
} = require("../middleware/uploadMiddleware");

// ==========================================================
// CREATE CATEGORY (Admin Only - Kept Protected)
// ==========================================================
router.post(
  "/create",
  verifyToken,
  uploadCategoryImage.single("image"),
  categoryController.createCategory
);

// ==========================================================
// GET ALL CATEGORIES (Public - Removed verifyToken)
// ==========================================================
router.get(
  "/all",
  categoryController.getCategories
);

// ==========================================================
// GET CATEGORY BY SLUG (Public - Removed verifyToken)
// IMPORTANT: BEFORE /:id
// ==========================================================
router.get(
  "/slug/:slug",
  categoryController.getCategoryBySlug
);

// ==========================================================
// GET SINGLE CATEGORY (Public - Removed verifyToken)
// ==========================================================
router.get(
  "/:id",
  categoryController.getCategory
);

// ==========================================================
// UPDATE CATEGORY (Admin Only - Kept Protected)
// ==========================================================
router.put(
  "/update/:id",
  verifyToken,
  uploadCategoryImage.single("image"),
  categoryController.updateCategory
);

// ==========================================================
// SOFT DELETE (Admin Only - Kept Protected)
// ==========================================================
router.delete(
  "/delete/:id",
  verifyToken,
  categoryController.deleteCategory
);

module.exports = router;