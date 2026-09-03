const Product = require("../models/productModel");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ============================================================
// HELPER - DELETE FILE
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
    min +
      Math.random() *
        (max - min + 1)
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

const createProductCode = (
  productName
) => {
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
// GENERATE UNIQUE SLUG
//
// The Product model has a unique index on "slug". Nothing was
// setting it on create, so every product tried to save
// slug: null — Mongo's unique index allows exactly ONE null,
// so the first product succeeded and every one after it threw
// E11000 duplicate key error on slug_1.
// ============================================================

const generateProductSlug = async (productName) => {
  const base = String(productName || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "") || "product";

  let slug;
  let exists = true;

  while (exists) {
    const suffix = generateRandomNumber(4);
    slug = `${base}-${suffix}`;

    exists = await Product.exists({ slug });
  }

  return slug;
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

          stockQuantity:
            Number(
              sizeData.stockQuantity
            ) || 0,

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

    preparedVariants.push({
      color,

      media: Array.isArray(
        variant.media
      )
        ? variant.media
        : [],

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

      price:
        Number(variant.price) || 0,

      discountPrice:
        variant.discountPrice !==
          undefined &&
        variant.discountPrice !==
          null &&
        variant.discountPrice !== ""
          ? Number(
              variant.discountPrice
            )
          : null,

      offer: {
        type:
          variant.offer?.type ||
          "none",

        value:
          Number(
            variant.offer?.value
          ) || 0,

        startDate:
          variant.offer?.startDate ||
          null,

        endDate:
          variant.offer?.endDate ||
          null,
      },

      sizes: preparedSizes,

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

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

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

    if (!name) {
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

    // ----------------------------------------------------------
    // PARSE DESCRIPTION
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // PARSE VARIANTS
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // PREPARE VARIANTS
    // ----------------------------------------------------------

    const preparedVariants =
      await prepareVariants(
        parsedVariants || [],
        name
      );

    // ----------------------------------------------------------
    // CHECK VARIANTS
    // ----------------------------------------------------------

    if (
      preparedVariants.length === 0
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

    // ----------------------------------------------------------
    // CHECK DUPLICATE COLORS
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // UPLOADED MEDIA
    // ----------------------------------------------------------

    const uploadedMedia =
      prepareUploadedMedia(
        req.files
      );

    // ----------------------------------------------------------
    // ASSIGN MEDIA
    //
    // During CREATE:
    // Uploaded "media" files are assigned
    // to the first color variant.
    //
    // Additional color media can be added
    // later using:
    //
    // POST
    // /:productId/variants/:variantId/media
    // ----------------------------------------------------------

    if (uploadedMedia.length > 0) {
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

    // ----------------------------------------------------------
    // GENERATE UNIQUE SLUG
    // ----------------------------------------------------------

    const slug = await generateProductSlug(name);

    // ----------------------------------------------------------
    // CREATE PRODUCT
    // ----------------------------------------------------------

    const product =
      await Product.create({
        categoryId:
          categoryId || null,

        subCategoryId,

        brandId,

        name: name.trim(),

        slug,

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

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

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
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.max(
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
      filter.categoryId =
        categoryId;
    }

    if (subCategoryId) {
      filter.subCategoryId =
        subCategoryId;
    }

    if (brandId) {
      filter.brandId =
        brandId;
    }

    if (
      isActive !== undefined
    ) {
      filter.isActive =
        isActive === "true";
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

    // ----------------------------------------------------------
    // BASIC FIELDS
    // ----------------------------------------------------------

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
      product.subCategoryId =
        subCategoryId;
    }

    if (
      brandId !== undefined
    ) {
      product.brandId =
        brandId || null;
    }

    if (name !== undefined) {
      product.name =
        String(name).trim();
    }

    if (
      isActive !== undefined
    ) {
      product.isActive =
        isActive === true ||
        isActive === "true";
    }

    // ----------------------------------------------------------
    // DESCRIPTION
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // VARIANTS
    // ----------------------------------------------------------

    if (
      variants !== undefined
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

      // --------------------------------------------------------
      // NEW MEDIA
      // --------------------------------------------------------

      const uploadedMedia =
        prepareUploadedMedia(
          req.files
        );

      if (
        uploadedMedia.length >
        0
      ) {
        if (
          preparedVariants
            .length === 0
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
          uploadedMedia;
      }

      product.variants =
        preparedVariants;
    } else if (
      req.files &&
      req.files.length > 0
    ) {
      // --------------------------------------------------------
      // MEDIA ONLY UPDATE
      // Add new media to first variant
      // --------------------------------------------------------

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
        firstVariant.media
          .length +
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

    // ----------------------------------------------------------
    // SAVE
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // SOFT DELETE
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // VALIDATE PRODUCT ID
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // VALIDATE VARIANT ID
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // CHECK FILES
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // FIND PRODUCT
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // FIND VARIANT
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // MAXIMUM 10 MEDIA
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // PREPARE MEDIA
    // ----------------------------------------------------------

    const newMedia =
      prepareUploadedMedia(
        req.files
      );

    // ----------------------------------------------------------
    // ADD MEDIA
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // VALIDATE IDS
    // ----------------------------------------------------------

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
        message:
          "Invalid variant ID",
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

    // ----------------------------------------------------------
    // FIND PRODUCT
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // FIND VARIANT
    // ----------------------------------------------------------

    const variant =
      product.variants.id(
        variantId
      );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message:
          "Variant not found",
      });
    }

    // ----------------------------------------------------------
    // FIND MEDIA
    // ----------------------------------------------------------

    const media =
      variant.media.id(
        mediaId
      );

    if (!media) {
      return res.status(404).json({
        success: false,
        message:
          "Media not found",
      });
    }

    // ----------------------------------------------------------
    // DELETE PHYSICAL FILE
    // ----------------------------------------------------------

    if (media.imageURL) {
      const relativePath =
        media.imageURL.replace(
          /^\/+/,
          ""
        );

      const absolutePath =
        path.join(
          process.cwd(),
          relativePath
        );

      if (
        fs.existsSync(
          absolutePath
        )
      ) {
        fs.unlinkSync(
          absolutePath
        );
      }
    }

    // ----------------------------------------------------------
    // DELETE MEDIA FROM MONGODB
    // ----------------------------------------------------------

    media.deleteOne();

    await product.save();

    return res.status(200).json({
      success: true,

      message:
        "Product media deleted successfully",

      data: product,
    });
  } catch (error) {
    console.error(
      "Delete Variant Media Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to delete product media",

      error: error.message,
    });
  }
};

