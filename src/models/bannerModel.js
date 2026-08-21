const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    // =========================================================
    // BASIC INFORMATION
    // =========================================================
    title: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    image: {
      type: String,
      required: true,
      trim: true,
    },

    mobileImage: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================================================
    // BANNER TYPE
    // =========================================================
    bannerType: {
      type: String,
      enum: [
        "HOME",
        "CATEGORY",
        "PRODUCT",
        "OFFER",
        "SALE",
        "OTHER",
      ],
      default: "HOME",
      index: true,
    },

    // =========================================================
    // REDIRECT
    // =========================================================
    redirectType: {
      type: String,
      enum: [
        "NONE",
        "PRODUCT",
        "CATEGORY",
        "BRAND",
        "URL",
      ],
      default: "NONE",
    },

    redirectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    redirectUrl: {
      type: String,
      trim: true,
      default: "",
    },

    buttonText: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================================================
    // DISPLAY
    // =========================================================
    displayOrder: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // =========================================================
    // SOFT DELETE
    // =========================================================
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Banner ||
  mongoose.model("Banner", bannerSchema);