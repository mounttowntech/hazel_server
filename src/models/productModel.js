
const mongoose = require("mongoose");

// ============================================================
// SIZE SCHEMA
// ============================================================

const SizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      enum: ["S", "M", "L", "XL", "2XL", "3XL"],
    },

    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    sku: {
      type: String,
      trim: true,
      default: null,
    },

    barcode: {
      type: String,
      trim: true,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

// ============================================================
// MEDIA SCHEMA
// ============================================================

const MediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["image", "video"],
    },

    imageURL: {
      type: String,
      required: false,
      trim: true,
    },

    thumbnail: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    _id: true,
  }
);

// ============================================================
// VARIANT SCHEMA
// ============================================================

const VariantSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    media: {
      type: [MediaSchema],
      default: [],

      validate: {
        validator: function (media) {
          return media.length <= 10;
        },

        message:
          "Maximum 10 media files are allowed for each color",
      },
    },

    fabric: {
      type: String,
      trim: true,
      default: "",
    },

    feel: {
      type: String,
      trim: true,
      default: "",
    },

    lining: {
      type: String,
      trim: true,
      default: "",
    },

    sleeves: {
      type: String,
      trim: true,
      default: "",
    },

    finishing: {
      type: String,
      trim: true,
      default: "",
    },

    pocket: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    offer: {
      type: {
        type: String,
        enum: ["percentage", "fixed", "none"],
        default: "none",
      },

      value: {
        type: Number,
        default: 0,
        min: 0,
      },

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },
    },

    sizes: {
      type: [SizeSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

// ============================================================
// PRODUCT SCHEMA
// ============================================================

const ProductSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
      default: null,
    },

    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: false,
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      about: {
        type: String,
        trim: true,
        default: "",
      },

      itemDetails: {
        type: String,
        trim: true,
        default: "",
      },
    },

    variants: {
      type: [VariantSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

ProductSchema.index({
  name: "text",
});

ProductSchema.index({
  categoryId: 1,
});

ProductSchema.index({
  subCategoryId: 1,
});

ProductSchema.index({
  brandId: 1,
});

ProductSchema.index({
  isActive: 1,
  isDeleted: 1,
});

// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model("Product", ProductSchema);

