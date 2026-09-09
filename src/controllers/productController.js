const Product = require("../models/productModel");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ============================================================
// HELPER - DELETE UPLOADED FILE
// ============================================================

const deleteUploadedFile = (file) => {
  if (!file || !file.path) {
    return;
  }

  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (error) {
    console.error(
      "Failed to delete uploaded file:",
      error.message
    );
  }
};

// ============================================================
// HELPER - GENERATE RANDOM NUMBER
// ============================================================

const generateRandomNumber = (length = 4) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return Math.floor(
    min + Math.random() * (max - min + 1)
  );
};

// ============================================================
// HELPER - CREATE COLOR CODE
// ============================================================

const createColorCode = (color) => {
  return String(color || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 4)
    .toUpperCase();
};

// ============================================================
// HELPER - CREATE PRODUCT CODE
// ============================================================

const createProductCode = (productName) => {
  return String(productName || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase();
};

// ============================================================
// GENERATE UNIQUE SKU
// ============================================================

const generateSKU = async (
  productName,
  color,
  size
) => {
  let sku;
  let exists = true;

  const productCode =
    createProductCode(productName);

  const colorCode =
    createColorCode(color);

  while (exists) {
    const randomNumber =
      generateRandomNumber(4);

    sku = `${productCode}-${colorCode}-${size}-${randomNumber}`;

    exists = await Product.exists({
      "variants.sizes.sku": sku,
    });
  }

  return sku;
};

// ============================================================
// GENERATE UNIQUE BARCODE
// ============================================================

const generateBarcode = async () => {
  let barcode;
  let exists = true;

  while (exists) {
    barcode = String(
      890000000000 +
        generateRandomNumber(9)
    ).substring(0, 12);

    exists = await Product.exists({
      "variants.sizes.barcode": barcode,
    });
  }

  return barcode;
};

// ============================================================
// CALCULATE VARIANT QUANTITY
// ============================================================

const calculateVariantQuantity = (sizes) => {
  if (!Array.isArray(sizes)) {
    return 0;
  }

  return sizes.reduce((total, size) => {
    return (
      total +
      (Number(size.stockQuantity) || 0)
    );
  }, 0);
};

// ============================================================
// PREPARE VARIANTS
// ============================================================

const prepareVariants = async (
  variants,
  productName
) => {
  if (!Array.isArray(variants)) {
    return [];
  }

  const preparedVariants = [];

  for (const variant of variants) {
    const color = String(
      variant.color || ""
    )
      .trim()
      .toUpperCase();

    if (!color) {
      throw new Error(
        "Variant color is required"
      );
    }

    const media = Array.isArray(
      variant.media
    )
      ? variant.media
      : [];

    if (media.length > 10) {
      throw new Error(
        `Maximum 10 media files are allowed for ${color}`
      );
    }

    const preparedSizes = [];

    if (Array.isArray(variant.sizes)) {
      for (const sizeData of variant.sizes) {
        const size = String(
          sizeData.size || ""
        )
          .trim()
          .toUpperCase();

        if (!size) {
          continue;
        }

        const allowedSizes = [
          "S",
          "M",
          "L",
          "XL",
          "2XL",
          "3XL",
        ];

        if (!allowedSizes.includes(size)) {
          throw new Error(
            `Invalid size "${size}". Allowed sizes: ${allowedSizes.join(
              ", "
            )}`
          );
        }

        const stockQuantity =
          Number(
            sizeData.stockQuantity
          ) || 0;

        if (stockQuantity < 0) {
          throw new Error(
            `Stock quantity cannot be negative for size ${size}`
          );
        }

        const sku =
          sizeData.sku ||
          (await generateSKU(
            productName,
            color,
            size
          ));

        const barcode =
          sizeData.barcode ||
          (await generateBarcode());

        preparedSizes.push({
          size,
          stockQuantity,
          sku,
          barcode,
          isActive:
            sizeData.isActive !==
            undefined
              ? Boolean(
                  sizeData.isActive
                )
              : true,
        });
      }
    }

    const quantity =
      calculateVariantQuantity(
        preparedSizes
      );

    let discountPrice = null;

    if (
      variant.discountPrice !==
        undefined &&
      variant.discountPrice !== null &&
      variant.discountPrice !== ""
    ) {
      discountPrice = Number(
        variant.discountPrice
      );

      if (
        Number.isNaN(discountPrice) ||
        discountPrice < 0
      ) {
        throw new Error(
          `Invalid discount price for ${color}`
        );
      }
    }

    const price =
      Number(variant.price);

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      throw new Error(
        `Invalid price for ${color}`
      );
    }

    const offerType =
      variant.offer?.type || "none";

    const offerValue =
      Number(
        variant.offer?.value
      ) || 0;

    const offerStartDate =
      variant.offer?.startDate ||
      null;

    const offerEndDate =
      variant.offer?.endDate ||
      null;

    if (
      ![
        "percentage",
        "fixed",
        "none",
      ].includes(offerType)
    ) {
      throw new Error(
        `Invalid offer type for ${color}`
      );
    }

    preparedVariants.push({
      color,
      media,
      fabric:
        variant.fabric || "",
      feel:
        variant.feel || "",
      lining:
        variant.lining || "",
      sleeves:
        variant.sleeves || "",
      finishing:
        variant.finishing || "",
      pocket:
        variant.pocket || "",
      quantity,
      price,
      discountPrice,
      offer: {
        type: offerType,
        value: offerValue,
        startDate:
          offerStartDate,
        endDate:
          offerEndDate,
      },
      sizes:
        preparedSizes,
      isActive:
        variant.isActive !==
        undefined
          ? Boolean(
              variant.isActive
            )
          : true,
    });
  }

  return preparedVariants;
};

// ============================================================
// PREPARE UPLOADED MEDIA
// ============================================================

const prepareUploadedMedia = (
  files
) => {
  if (!Array.isArray(files)) {
    return [];
  }

  return files.map((file) => {
    const isVideo =
      file.mimetype &&
      file.mimetype.startsWith(
        "video/"
      );

    return {
      type: isVideo
        ? "video"
        : "image",
      imageURL:
        `/uploads/products/${file.filename}`,
      thumbnail: null,
    };
  });
};

// ============================================================
// CREATE PRODUCT
// POST /api/products/create
// ============================================================

exports.createProduct = async (
  req,
  res
) => {
  try {
    const {
      categoryId,
      subCategoryId,
      brandId,
      name,
      description,
      variants,
    } = req.body;

    if (!subCategoryId) {
      if (req.files) {
        req.files.forEach(
          deleteUploadedFile
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "subCategoryId is required",
      });
    }

    if (!brandId) {
      if (req.files) {
        req.files.forEach(
          deleteUploadedFile
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "brandId is required",
      });
    }

    if (
      !name ||
      !String(name).trim()
    ) {
      if (req.files) {
        req.files.forEach(
          deleteUploadedFile
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "Product name is required",
      });
    }

    let parsedDescription =
      description || {};

    if (
      typeof description ===
      "string"
    ) {
      try {
        parsedDescription =
          JSON.parse(description);
      } catch (error) {
        parsedDescription = {
          about: description,
          itemDetails: "",
        };
      }
    }

    let parsedVariants = variants;

    if (
      typeof variants ===
      "string"
    ) {
      try {
        parsedVariants =
          JSON.parse(variants);
      } catch (error) {
        if (req.files) {
          req.files.forEach(
            deleteUploadedFile
          );
        }

        return res.status(400).json({
          success: false,
          message:
            "Invalid variants JSON",
        });
      }
    }

    if (
      parsedVariants !==
        undefined &&
      !Array.isArray(
        parsedVariants
      )
    ) {
      if (req.files) {
        req.files.forEach(
          deleteUploadedFile
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "variants must be an array",
      });
    }

    const preparedVariants =
      await prepareVariants(
        parsedVariants || [],
        String(name).trim()
      );

    if (
      preparedVariants.length ===
      0
    ) {
      if (req.files) {
        req.files.forEach(
          deleteUploadedFile
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "At least one product color variant is required",
      });
    }

    const colors =
      preparedVariants.map(
        (variant) =>
          variant.color
      );

    const uniqueColors =
      new Set(colors);

    if (
      colors.length !==
      uniqueColors.size
    ) {
      if (req.files) {
        req.files.forEach(
          deleteUploadedFile
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "Duplicate colors are not allowed in the same product",
      });
    }

    const uploadedMedia =
      prepareUploadedMedia(
        req.files
      );

    if (
      uploadedMedia.length > 0
    ) {
      if (
        preparedVariants[0]
          .media.length +
          uploadedMedia.length >
        10
      ) {
        if (req.files) {
          req.files.forEach(
            deleteUploadedFile
          );
        }

        return res.status(400).json({
          success: false,
          message:
            "Maximum 10 media files are allowed for the first color variant",
        });
      }

      preparedVariants[0].media =
        uploadedMedia;
    }

    const product =
      await Product.create({
        categoryId:
          categoryId || null,
        subCategoryId,
        brandId:
          brandId || null,
        name:
          String(name).trim(),
        description: {
          about:
            parsedDescription?.about ||
            "",
          itemDetails:
            parsedDescription?.itemDetails ||
            "",
        },
        variants:
          preparedVariants,
        isActive: true,
        isDeleted: false,
      });

    return res.status(201).json({
      success: true,
      message:
        "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error(
      "Create Product Error:",
      error
    );

    if (req.files) {
      req.files.forEach(
        deleteUploadedFile
      );
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create product",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL PRODUCTS
// GET /api/products/all
// ============================================================

exports.getAllProducts = async (
  req,
  res
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      categoryId,
      subCategoryId,
      brandId,
      isActive,
      size,
      variant,
      fabric,
      color,
      max_price,
      max_price_range,
      price_range_option,
      features,
      sleeve,
      availability,
      rating,
    } = req.query;

    const pageNumber =
      Math.max(
        Number(page) || 1,
        1
      );

    const limitNumber =
      Math.max(
        Number(limit) || 10,
        1
      );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    // ----------------------------------------------------------
    // FILTER
    // ----------------------------------------------------------

    const filter = {
      isDeleted: false,
    };

    if (
      search &&
      search.trim()
    ) {
      filter.name = {
        $regex:
          search.trim(),
        $options: "i",
      };
    }

    if (categoryId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          categoryId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid category ID",
        });
      }

      filter.categoryId =
        categoryId;
    }

    if (subCategoryId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          subCategoryId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid subCategory ID",
        });
      }

      filter.subCategoryId =
        subCategoryId;
    }

    if (brandId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          brandId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid brand ID",
        });
      }

      filter.brandId =
        brandId;
    }

    if (
      isActive !== undefined
    ) {
      filter.isActive =
        isActive === "true";
    }

    // --- SIZE / VARIANT FILTER LOGIC ---
    const targetSize = size || variant;
    if (targetSize) {
      const sizesArray = Array.isArray(targetSize) ? targetSize : [targetSize];
      filter["variants.sizes.size"] = { $in: sizesArray };
    }

    // --- FABRIC FILTER LOGIC ---
    if (fabric) {
      const fabricsArray = Array.isArray(fabric) ? fabric : [fabric];
      filter["variants.fabric"] = { $in: fabricsArray };
    }

    // --- COLOR / PRINT FILTER LOGIC ---
    if (color) {
      const colorsArray = Array.isArray(color) ? color : [color];
      filter["variants.color"] = { $in: colorsArray };
    }

    // --- FEATURES FILTER LOGIC ---
    if (features) {
      const featuresArray = Array.isArray(features) ? features : [features];
      filter["variants.pocket"] = { $in: featuresArray };
    }

    // --- SLEEVE STYLE FILTER LOGIC ---
    if (sleeve) {
      const sleeveArray = Array.isArray(sleeve) ? sleeve : [sleeve];
      filter["variants.sleeves"] = { $in: sleeveArray };
    }

    // --- AVAILABILITY FILTER LOGIC ---
    if (availability) {
      if (availability === "in-stock") {
        filter["variants.quantity"] = { $gt: 0 };
      }
    }

    // --- RATING FILTER LOGIC ---
    if (rating && rating !== "any") {
      const minRating = Number(rating);
      if (!isNaN(minRating)) {
        filter.rating = { $gte: minRating };
      }
    }

    // --- PRICE FILTER LOGIC (Checkboxes take absolute priority) ---
   // --- PRICE FILTER LOGIC ---
    const targetPriceOption = price_range_option || (["under_1000", "1000_1500", "1500_2000", "above_2000"].includes(max_price) ? max_price : null);

    if (targetPriceOption) {
      let priceCondition = {};
      if (targetPriceOption === "under_1000") {
        priceCondition = { $lt: 1000 };
      } else if (targetPriceOption === "1000_1500") {
        priceCondition = { $gte: 1000, $lte: 1500 };
      } else if (targetPriceOption === "1500_2000") {
        priceCondition = { $gte: 1500, $lte: 2000 };
      } else if (targetPriceOption === "above_2000") {
        priceCondition = { $gt: 2000 };
      }

      // Check both variants.price and variants.discountPrice so discounted items are matched properly
      filter.$or = [
        { "variants.price": priceCondition },
        { "variants.discountPrice": priceCondition }
      ];
    } else {
      const activeMaxPrice = max_price || max_price_range;
      if (activeMaxPrice) {
        const maxPriceVal = Number(activeMaxPrice);
        if (!isNaN(maxPriceVal)) {
          filter["variants.price"] = { $lte: maxPriceVal };
        }
      }
    }

    // ----------------------------------------------------------
    // QUERY
    // ----------------------------------------------------------

    const [
      products,
      total,
    ] = await Promise.all([
      Product.find(filter)
        .populate("categoryId")
        .populate("subCategoryId")
        .populate("brandId")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber),

      Product.countDocuments(
        filter
      ),
    ]);

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Products fetched successfully",

      data: products,

      pagination: {
        total,

        page: pageNumber,

        limit: limitNumber,

        totalPages:
          Math.ceil(
            total /
              limitNumber
          ),
      },
    });
  } catch (error) {
    console.error(
      "Get Products Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch products",

      error: error.message,
    });
  }
};

// ============================================================
// GET PRODUCT BY ID
// GET /api/products/:productId
// ============================================================

exports.getProductById = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    const product =
      await Product.findOne({
        _id: productId,
        isDeleted: false,
      })
        .populate("categoryId")
        .populate("subCategoryId")
        .populate("brandId");

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Product fetched successfully",

      data: product,
    });
  } catch (error) {
    console.error(
      "Get Product Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch product",

      error: error.message,
    });
  }
};

// ============================================================
// UPDATE PRODUCT
// PUT /api/products/:productId
// ============================================================

exports.updateProduct = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      if (req.files) {
        req.files.forEach(
          deleteUploadedFile
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    const product =
      await Product.findOne({
        _id: productId,
        isDeleted: false,
      });

    if (!product) {
      if (req.files) {
        req.files.forEach(
          deleteUploadedFile
        );
      }

      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    const {
      categoryId,
      subCategoryId,
      brandId,
      name,
      description,
      variants,
      isActive,
    } = req.body;

    if (
      categoryId !==
      undefined
    ) {
      product.categoryId =
        categoryId || null;
    }

    if (
      subCategoryId !==
      undefined
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(
          subCategoryId
        )
      ) {
        if (req.files) {
          req.files.forEach(
            deleteUploadedFile
          );
        }

        return res.status(400).json({
          success: false,
          message:
            "Invalid subCategory ID",
        });
      }

      product.subCategoryId =
        subCategoryId;
    }

    if (
      brandId !==
      undefined
    ) {
      product.brandId =
        brandId || null;
    }

    if (name !== undefined) {
      if (
        !String(name).trim()
      ) {
        if (req.files) {
          req.files.forEach(
            deleteUploadedFile
          );
        }

        return res.status(400).json({
          success: false,
          message:
            "Product name cannot be empty",
        });
      }

      product.name =
        String(name).trim();
    }

    if (
      isActive !==
      undefined
    ) {
      product.isActive =
        isActive === true ||
        isActive === "true";
    }

    if (
      description !==
      undefined
    ) {
      let parsedDescription =
        description;

      if (
        typeof description ===
        "string"
      ) {
        try {
          parsedDescription =
            JSON.parse(
              description
            );
        } catch (error) {
          parsedDescription = {
            about: description,
            itemDetails: "",
          };
        }
      }

      product.description = {
        about:
          parsedDescription?.about ||
          "",

        itemDetails:
          parsedDescription?.itemDetails ||
          "",
      };
    }

    if (
      variants !==
      undefined
    ) {
      let parsedVariants =
        variants;

      if (
        typeof variants ===
        "string"
      ) {
        try {
          parsedVariants =
            JSON.parse(
              variants
            );
        } catch (error) {
          if (req.files) {
            req.files.forEach(
              deleteUploadedFile
            );
          }

          return res.status(400).json({
            success: false,
            message:
              "Invalid variants JSON",
          });
        }
      }

      if (
        !Array.isArray(
          parsedVariants
        )
      ) {
        if (req.files) {
          req.files.forEach(
            deleteUploadedFile
          );
        }

        return res.status(400).json({
          success: false,
          message:
            "variants must be an array",
        });
      }

      const preparedVariants =
        await prepareVariants(
          parsedVariants,
          product.name
        );

      const colors =
        preparedVariants.map(
          (variant) =>
            variant.color
        );

      const uniqueColors =
        new Set(colors);

      if (
        colors.length !==
        uniqueColors.size
      ) {
        if (req.files) {
          req.files.forEach(
            deleteUploadedFile
          );
        }

        return res.status(400).json({
          success: false,
          message:
            "Duplicate colors are not allowed",
        });
      }

      const uploadedMedia =
        prepareUploadedMedia(
          req.files
        );

      if (
        uploadedMedia.length >
        0
      ) {
        if (
          preparedVariants.length ===
          0
        ) {
          req.files.forEach(
            deleteUploadedFile
          );

          return res.status(400).json({
            success: false,
            message:
              "At least one color variant is required when uploading media",
          });
        }

        if (
          preparedVariants[0]
            .media.length +
            uploadedMedia.length >
          10
        ) {
          req.files.forEach(
            deleteUploadedFile
          );

          return res.status(400).json({
            success: false,
            message:
              "Maximum 10 media files are allowed for the first color variant",
          });
        }

        preparedVariants[0].media =
          [
            ...preparedVariants[0]
              .media,
            ...uploadedMedia,
          ];
      }

      product.variants =
        preparedVariants;
    } else if (
      req.files &&
      req.files.length > 0
    ) {
      if (
        product.variants.length ===
        0
      ) {
        req.files.forEach(
          deleteUploadedFile
        );

        return res.status(400).json({
          success: false,
          message:
            "Product has no color variant",
        });
      }

      const uploadedMedia =
        prepareUploadedMedia(
          req.files
        );

      const firstVariant =
        product.variants[0];

      if (
        firstVariant.media.length +
          uploadedMedia.length >
        10
      ) {
        req.files.forEach(
          deleteUploadedFile
        );

        return res.status(400).json({
          success: false,
          message:
            "Maximum 10 media files are allowed for this color variant",
        });
      }

      firstVariant.media.push(
        ...uploadedMedia
      );
    }

    await product.save();

    return res.status(200).json({
      success: true,

      message:
        "Product updated successfully",

      data: product,
    });
  } catch (error) {
    console.error(
      "Update Product Error:",
      error
    );

    if (req.files) {
      req.files.forEach(
        deleteUploadedFile
      );
    }

    return res.status(500).json({
      success: false,

      message:
        "Failed to update product",

      error: error.message,
    });
  }
};

// ============================================================
// DELETE PRODUCT
// DELETE /api/products/:productId
// ============================================================

exports.deleteProduct = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    const product =
      await Product.findOne({
        _id: productId,
        isDeleted: false,
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    product.isDeleted = true;

    product.isActive = false;

    await product.save();

    return res.status(200).json({
      success: true,

      message:
        "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Product Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to delete product",

      error: error.message,
    });
  }
};

// ============================================================
// ADD MEDIA TO VARIANT
// POST /api/products/:productId/variants/:variantId/media
// ============================================================

exports.addVariantMedia = async (
  req,
  res
) => {
  try {
    const {
      productId,
      variantId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      if (req.files) {
        req.files.forEach(
          deleteUploadedFile
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        variantId
      )
    ) {
      if (req.files) {
        req.files.forEach(
          deleteUploadedFile
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "Invalid variant ID",
      });
    }

    if (
      !req.files ||
      req.files.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload at least one image or video",
      });
    }

    const product =
      await Product.findOne({
        _id: productId,
        isDeleted: false,
      });

    if (!product) {
      req.files.forEach(
        deleteUploadedFile
      );

      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    const variant =
      product.variants.id(
        variantId
      );

    if (!variant) {
      req.files.forEach(
        deleteUploadedFile
      );

      return res.status(404).json({
        success: false,
        message:
          "Product color variant not found",
      });
    }

    if (
      variant.media.length +
        req.files.length >
      10
    ) {
      req.files.forEach(
        deleteUploadedFile
      );

      return res.status(400).json({
        success: false,
        message:
          `Maximum 10 media files are allowed for ${variant.color}. ` +
          `Current: ${variant.media.length}, ` +
          `Trying to add: ${req.files.length}`,
      });
    }

    const newMedia =
      prepareUploadedMedia(
        req.files
      );

    variant.media.push(
      ...newMedia
    );

    await product.save();

    return res.status(200).json({
      success: true,

      message:
        "Product media uploaded successfully",

      data: {
        productId:
          product._id,

        variantId:
          variant._id,

        color:
          variant.color,

        media:
          variant.media,
      },
    });
  } catch (error) {
    console.error(
      "Add Variant Media Error:",
      error
    );

    if (req.files) {
      req.files.forEach(
        deleteUploadedFile
      );
    }

    return res.status(500).json({
      success: false,

      message:
        "Failed to upload product media",

      error: error.message,
    });
  }
};

// ============================================================
// DELETE VARIANT MEDIA
// DELETE /api/products/:productId/variants/:variantId/media/:mediaId
// ============================================================

exports.deleteVariantMedia = async (
  req,
  res
) => {
  try {
    const {
      productId,
      variantId,
      mediaId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        variantId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        mediaId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid media ID",
      });
    }

    const product =
      await Product.findOne({
        _id: productId,
        isDeleted: false,
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    const typeVariant = product.variants.id(variantId);
    if (!typeVariant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    const mediaItem = typeVariant.media.id(mediaId);
    if (!mediaItem) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    if (mediaItem.imageURL) {
      const relativePath = mediaItem.imageURL.replace(/^\/+/, "");
      const absolutePath = path.join(process.cwd(), relativePath);

      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch (fileErr) {
          console.error("Failed to delete physical media file:", fileErr.message);
        }
      }
    }

    mediaItem.deleteOne();
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product media deleted successfully",
      data: product,
    });
  } catch (error) {
    console.error("Delete Variant Media Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product media",
      error: error.message,
    });
  }
};