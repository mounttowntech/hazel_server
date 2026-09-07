const express = require("express");

const router = express.Router();

const {
  createNewArrival,
  getAllNewArrivals,
  getNewArrivalById,
  updateNewArrival,
  deleteNewArrival,
} = require("../controllers/newArrivalController");

const {
  uploadNewArrivalImage,
  handleUploadError,
} = require("../middleware/uploadMiddleware");

// ============================================================
// CREATE
// POST /api/newArrivals/create
// ============================================================

router.post(
  "/create",

  uploadNewArrivalImage.fields([
    {
      name: "heroImage",
      maxCount: 1,
    },
    {
      name: "productImages",
      maxCount: 3,
    },
  ]),

  handleUploadError,

  createNewArrival
);

// ============================================================
// GET ALL
// GET /api/newArrivals
// ============================================================

router.get(
  "/all",
  getAllNewArrivals
);

// ============================================================
// GET BY ID
// GET /api/newArrivals/:id
// ============================================================

router.get(
  "/:id",
  getNewArrivalById
);

// ============================================================
// UPDATE
// PUT /api/newArrivals/:id
// ============================================================

router.put(
  "/update/:id",

  uploadNewArrivalImage.fields([
    {
      name: "heroImage",
      maxCount: 1,
    },
    {
      name: "productImages",
      maxCount: 3,
    },
  ]),

  handleUploadError,

  updateNewArrival
);

// ============================================================
// DELETE
// DELETE /api/newArrivals/:id
// ============================================================

router.delete(
  "/delete/:id",
  deleteNewArrival
);

module.exports = router;