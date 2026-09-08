
const express = require("express");

const router = express.Router();

// ==========================================================
// IMPORT BANNER CONTROLLER
// ==========================================================

const {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");

// ==========================================================
// IMPORT BANNER UPLOAD MIDDLEWARE
// ==========================================================

const {
  uploadBannerImage,
} = require("../middleware/uploadMiddleware");

// ==========================================================
// CREATE BANNER
// POST /api/banners
// ==========================================================

router.post( "/create", uploadBannerImage.single("image"), createBanner );

// ==========================================================
// GET ALL BANNERS
// GET /api/banners
// ==========================================================

router.get(
  "/all",
  getAllBanners
);

// ==========================================================
// GET SINGLE BANNER
// GET /api/banners/:id
// ==========================================================

router.get(
  "/:id",
  getBannerById
);

// ==========================================================
// UPDATE BANNER
// PUT /api/banners/:id
// ==========================================================
router.put( "/update/:id", uploadBannerImage.single("image"), updateBanner );
// ==========================================================
// DELETE BANNER
// DELETE /api/banners/:id
// ==========================================================

router.delete(
  "/delete/:id",
  deleteBanner
);



module.exports = router;
