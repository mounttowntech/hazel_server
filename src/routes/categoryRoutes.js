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
// CREATE CATEGORY
// ==========================================================

router.post(
  "/create",
  verifyToken,
  uploadCategoryImage.single("image"),
  categoryController.createCategory
);

// ==========================================================
// GET ALL CATEGORIES
// ==========================================================

router.get(
  "/all",
  verifyToken,
  categoryController.getCategories
);

// ==========================================================
// GET CATEGORY BY SLUG
// IMPORTANT: BEFORE /:id
// ==========================================================

router.get(
  "/slug/:slug",
  verifyToken,
  categoryController.getCategoryBySlug
);

// ==========================================================
// GET SINGLE CATEGORY
// ==========================================================

router.get(
  "/:id",
  verifyToken,
  categoryController.getCategory
);

// ==========================================================
// UPDATE CATEGORY
// ==========================================================

router.put(
  "/update/:id",
  verifyToken,
  uploadCategoryImage.single("image"),
  categoryController.updateCategory
);

// ==========================================================
// SOFT DELETE
// ==========================================================

router.delete(
  "/delete/:id",
  verifyToken,
  categoryController.deleteCategory
);

// ==========================================================
// RESTORE
// ==========================================================

// router.patch(
//   "/restore/:id",
//   verifyToken,
//   categoryController.restoreCategory
// );

// ==========================================================
// PERMANENT DELETE
// ==========================================================

// router.delete(
//   "/permanent/:id",
//   verifyToken,
//   categoryController.permanentDeleteCategory
// );

module.exports = router;