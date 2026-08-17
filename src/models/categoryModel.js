const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    // ==========================================================
    // CATEGORY NAME
    // ==========================================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // ==========================================================
    // UNIQUE SLUG
    // ==========================================================

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // ==========================================================
    // DESCRIPTION
    // ==========================================================

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // ==========================================================
    // CATEGORY IMAGE
    // ==========================================================

    image: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================================
    // DISPLAY ORDER
    // ==========================================================

    displayOrder: {
      type: Number,
      default: 0,
    },

    // ==========================================================
    // STATUS
    // ==========================================================

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // ==========================================================
    // SOFT DELETE
    // ==========================================================

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

    // ==========================================================
    // AUDIT
    // ==========================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================================
// INDEXES
// ==========================================================

categorySchema.index({ name: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ isDeleted: 1 });
categorySchema.index({ displayOrder: 1 });

// ==========================================================
// PREVENT OVERWRITE MODEL ERROR
// ==========================================================

module.exports =
  mongoose.models.Category ||
  mongoose.model("Category", categorySchema);