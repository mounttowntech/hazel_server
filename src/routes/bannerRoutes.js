const express = require("express");

const router = express.Router();

const {
  createBanner,
  getActiveBanners,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner
} = require("../controllers/bannerController");

const { verifyToken } = require("../middleware/authMiddleware");

// =============================================================
// CUSTOMER
// =============================================================

router.get(
  "/active",
  getActiveBanners
);

// =============================================================
// ADMIN
// =============================================================

router.post(
  "/create",
  verifyToken,
  createBanner
);

router.get(
  "/all",
  verifyToken,
  getAllBanners
);

router.get(
  "/:id",
  verifyToken,
  getBannerById
);

router.patch(
  "/update/:id",
  verifyToken,
  updateBanner
);

router.delete(
  "/delete/:id",
  verifyToken,
  deleteBanner
);

module.exports = router;