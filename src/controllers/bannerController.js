const Banner = require("../models/bannerModel");

// =============================================================
// CREATE BANNER
// POST /api/banners/create
// =============================================================

exports.createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    console.error("createBanner:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create banner",
      error: error.message,
    });
  }
};

// =============================================================
// GET ACTIVE BANNERS
// GET /api/banners/active
// =============================================================

exports.getActiveBanners = async (req, res) => {
  try {
    const now = new Date();

    const banners = await Banner.find({
      isActive: true,
      isDeleted: false,

      $or: [
        {
          startDate: null,
          endDate: null,
        },
        {
          startDate: { $lte: now },
          endDate: { $gte: now },
        },
        {
          startDate: null,
          endDate: { $gte: now },
        },
        {
          startDate: { $lte: now },
          endDate: null,
        },
      ],
    }).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch banners",
      error: error.message,
    });
  }
};

// =============================================================
// GET ALL BANNERS - ADMIN
// GET /api/banners
// =============================================================

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find({
      isDeleted: false,
    }).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch banners",
      error: error.message,
    });
  }
};

// =============================================================
// GET BANNER BY ID
// GET /api/banners/:id
// =============================================================

exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    return res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch banner",
      error: error.message,
    });
  }
};

// =============================================================
// UPDATE BANNER
// PATCH /api/banners/:id
// =============================================================

exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    return res.json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update banner",
      error: error.message,
    });
  }
};

// =============================================================
// DELETE BANNER
// DELETE /api/banners/:id
// =============================================================

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
        deletedBy:
          req.user?.id ||
          req.user?._id ||
          null,
      },
      {
        new: true,
      }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    return res.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete banner",
      error: error.message,
    });
  }
};