const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const NewArrival = require("../models/newArrivalModel");
const Product = require("../models/productModel");

// ============================================================
// IMAGE URL HELPER
// ============================================================

const getImageUrl = (req, filePath) => {
  if (!filePath) {
    return null;
  }

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const normalizedPath = filePath.replace(/\\/g, "/");

  return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
};

// ============================================================
// DELETE LOCAL FILE
// ============================================================

const deleteLocalFile = (filePath) => {
  try {
    if (!filePath) {
      return;
    }

    // Remove URL if accidentally stored
    let cleanPath = filePath;

    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      cleanPath = new URL(cleanPath).pathname;
    }

    cleanPath = cleanPath.replace(/^[/\\]+/, "");

    const absolutePath = path.join(process.cwd(), cleanPath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log("Deleted file:", absolutePath);
    }
  } catch (error) {
    console.error("File delete error:", error.message);
  }
};

// ============================================================
// DELETE UPLOADED FILES WHEN VALIDATION FAILS
// ============================================================

const deleteUploadedFiles = (req) => {
  try {
    if (!req.files) {
      return;
    }

    // --------------------------------------------------------
    // HERO IMAGE
    // --------------------------------------------------------

    if (req.files.heroImage) {
      req.files.heroImage.forEach((file) => {
        deleteLocalFile(file.path);
      });
    }

    // --------------------------------------------------------
    // PRODUCT IMAGES
    // --------------------------------------------------------

    if (req.files.productImages) {
      req.files.productImages.forEach((file) => {
        deleteLocalFile(file.path);
      });
    }
  } catch (error) {
    console.error(
      "Uploaded file cleanup error:",
      error.message
    );
  }
};

// ============================================================
// PARSE PRODUCTS
// ============================================================

const parseProducts = (products) => {
  if (!products) {
    return [];
  }

  if (Array.isArray(products)) {
    return products;
  }

  if (typeof products === "string") {
    return JSON.parse(products);
  }

  return products;
};

// ============================================================
// VALIDATE PRODUCTS
// ============================================================

const validateProducts = async (products) => {
  // ----------------------------------------------------------
  // MUST BE ARRAY
  // ----------------------------------------------------------

  if (!Array.isArray(products)) {
    return {
      valid: false,
      message: "Products must be an array",
    };
  }

  // ----------------------------------------------------------
  // MAXIMUM 3 PRODUCTS
  // ----------------------------------------------------------

  if (products.length > 3) {
    return {
      valid: false,
      message: "Maximum 3 products are allowed",
    };
  }

  // ----------------------------------------------------------
  // PRODUCT OBJECT VALIDATION
  // ----------------------------------------------------------

  for (let i = 0; i < products.length; i++) {
    const item = products[i];

    if (!item || typeof item !== "object") {
      return {
        valid: false,
        message: `Invalid product data at index ${i}`,
      };
    }

    if (!item.product) {
      return {
        valid: false,
        message: `Product ID is required at index ${i}`,
      };
    }

    // --------------------------------------------------------
    // OBJECT ID VALIDATION
    // --------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(item.product)) {
      return {
        valid: false,
        message: `Invalid product ID at index ${i}: ${item.product}`,
      };
    }

    // --------------------------------------------------------
    // DISPLAY ORDER
    // --------------------------------------------------------

    if (
      item.displayOrder !== undefined &&
      item.displayOrder !== null &&
      (
        Number.isNaN(Number(item.displayOrder)) ||
        Number(item.displayOrder) < 1
      )
    ) {
      return {
        valid: false,
        message: `Invalid displayOrder at index ${i}`,
      };
    }

    // --------------------------------------------------------
    // IS FEATURED
    // --------------------------------------------------------

    if (
      item.isFeatured !== undefined &&
      typeof item.isFeatured !== "boolean"
    ) {
      return {
        valid: false,
        message: `isFeatured must be true or false at index ${i}`,
      };
    }
  }

  // ----------------------------------------------------------
  // CHECK DUPLICATE PRODUCTS
  // ----------------------------------------------------------

  const productIds = products.map((item) =>
    item.product.toString()
  );

  const uniqueProductIds = new Set(productIds);

  if (uniqueProductIds.size !== productIds.length) {
    return {
      valid: false,
      message: "Duplicate products are not allowed",
    };
  }

  // ----------------------------------------------------------
  // CHECK PRODUCTS EXIST
  // ----------------------------------------------------------

  const existingProducts = await Product.find({
    _id: {
      $in: productIds,
    },
  }).select("_id");

  const existingProductIds = new Set(
    existingProducts.map((item) => item._id.toString())
  );

  for (const productId of productIds) {
    if (!existingProductIds.has(productId)) {
      return {
        valid: false,
        message: `Product not found: ${productId}`,
      };
    }
  }

  return {
    valid: true,
  };
};

// ============================================================
// CREATE NEW ARRIVAL
// ============================================================
// POST /api/newArrivals/create
// ============================================================

const createNewArrival = async (req, res) => {
  try {
    console.log("==========================================");
    console.log("CREATE NEW ARRIVAL");
    console.log("==========================================");

    const {
      title,
      subtitle,
      description,
      featuredProduct,
      products,
    } = req.body;

    // ========================================================
    // REQUIRED TITLE
    // ========================================================

    if (!title || !title.trim()) {
      deleteUploadedFiles(req);

      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // ========================================================
    // PARSE PRODUCTS
    // ========================================================

    let parsedProducts = [];

    if (products !== undefined && products !== null && products !== "") {
      try {
        parsedProducts = parseProducts(products);
      } catch (error) {
        deleteUploadedFiles(req);

        console.error(
          "Products JSON Parse Error:",
          error.message
        );

        console.error(
          "Received products:",
          products
        );

        return res.status(400).json({
          success: false,
          message: "Invalid products JSON format",
          error: error.message,
          example:
            '[{"product":"PRODUCT_ID","displayOrder":1,"isFeatured":true}]',
        });
      }
    }

    // ========================================================
    // VALIDATE PRODUCTS
    // ========================================================

    const productValidation =
      await validateProducts(parsedProducts);

    if (!productValidation.valid) {
      deleteUploadedFiles(req);

      return res.status(400).json({
        success: false,
        message: productValidation.message,
      });
    }

    // ========================================================
    // FEATURED PRODUCT VALIDATION
    // ========================================================

    if (featuredProduct) {
      if (
        !mongoose.Types.ObjectId.isValid(
          featuredProduct
        )
      ) {
        deleteUploadedFiles(req);

        return res.status(400).json({
          success: false,
          message: "Invalid featured product ID",
        });
      }

      const featuredProductExists =
        await Product.findById(featuredProduct);

      if (!featuredProductExists) {
        deleteUploadedFiles(req);

        return res.status(404).json({
          success: false,
          message: "Featured product not found",
        });
      }
    }

    // ========================================================
    // HERO IMAGE
    // ========================================================

    const heroImage =
      req.files?.heroImage?.[0];

    let heroImagePath = null;

    if (heroImage) {
      heroImagePath = path
        .relative(process.cwd(), heroImage.path)
        .replace(/\\/g, "/");
    }

    // ========================================================
    // PRODUCT IMAGES
    // ========================================================

    const productImages =
      req.files?.productImages || [];

    // ========================================================
    // MAP PRODUCT IMAGES BY ARRAY ORDER
    // ========================================================
    //
    // Product 1 -> productImages[0]
    // Product 2 -> productImages[1]
    // Product 3 -> productImages[2]
    //
    // ========================================================

    const finalProducts = parsedProducts.map(
      (item, index) => {
        const productImage =
          productImages[index];

        let imagePath = null;

        if (productImage) {
          imagePath = path
            .relative(
              process.cwd(),
              productImage.path
            )
            .replace(/\\/g, "/");
        }

        return {
          product: item.product,

          displayOrder:
            item.displayOrder !== undefined
              ? Number(item.displayOrder)
              : index + 1,

          isFeatured:
            item.isFeatured === true,

          image: imagePath,
        };
      }
    );

    // ========================================================
    // CREATE NEW ARRIVAL
    // ========================================================

    const newArrival = await NewArrival.create({
      title: title.trim(),

      subtitle: subtitle
        ? subtitle.trim()
        : "",

      description: description
        ? description.trim()
        : "",

      featuredProduct:
        featuredProduct || null,

      products: finalProducts,

      heroImage: heroImagePath,
    });

    // ========================================================
    // POPULATE RESPONSE
    // ========================================================

    const populatedNewArrival =
      await NewArrival.findById(
        newArrival._id
      )
        .populate(
          "featuredProduct",
          "name title slug images"
        )
        .populate(
          "products.product",
          "name title slug images"
        );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,
      message: "New Arrival created successfully",

      data: {
        ...populatedNewArrival.toObject(),

        heroImage: getImageUrl(
          req,
          populatedNewArrival.heroImage
        ),

        products:
          populatedNewArrival.products.map(
            (item) => ({
              ...item.toObject(),

              image: getImageUrl(
                req,
                item.image
              ),
            })
          ),
      },
    });
  } catch (error) {
    console.error("==========================================");
    console.error("CREATE NEW ARRIVAL ERROR");
    console.error(error);
    console.error("==========================================");

    deleteUploadedFiles(req);

    // ========================================================
    // MONGOOSE VALIDATION ERROR
    // ========================================================

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "New Arrival validation failed",
        errors: Object.values(error.errors).map(
          (err) => err.message
        ),
      });
    }

    // ========================================================
    // DUPLICATE KEY ERROR
    // ========================================================

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate New Arrival data",
        error: error.keyValue,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL NEW ARRIVALS
// ============================================================
// GET /api/newArrivals
// ============================================================

const getAllNewArrivals = async (req, res) => {
  try {
    const newArrivals =
      await NewArrival.find()
        .populate(
          "featuredProduct",
          "name title slug images"
        )
        .populate(
          "products.product",
          "name title slug images"
        )
        .sort({
          createdAt: -1,
        });

    const data = newArrivals.map(
      (item) => ({
        ...item.toObject(),

        heroImage: getImageUrl(
          req,
          item.heroImage
        ),

        products:
          item.products.map(
            (productItem) => ({
              ...productItem.toObject(),

              image: getImageUrl(
                req,
                productItem.image
              ),
            })
          ),
      })
    );

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(
      "Get New Arrivals Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// GET NEW ARRIVAL BY ID
// ============================================================
// GET /api/newArrivals/:id
// ============================================================

const getNewArrivalById = async (req, res) => {
  try {
    const { id } = req.params;

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid New Arrival ID",
      });
    }

    // ========================================================
    // FIND
    // ========================================================

    const newArrival =
      await NewArrival.findById(id)
        .populate(
          "featuredProduct",
          "name title slug images"
        )
        .populate(
          "products.product",
          "name title slug images"
        );

    if (!newArrival) {
      return res.status(404).json({
        success: false,
        message: "New Arrival not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        ...newArrival.toObject(),

        heroImage: getImageUrl(
          req,
          newArrival.heroImage
        ),

        products:
          newArrival.products.map(
            (item) => ({
              ...item.toObject(),

              image: getImageUrl(
                req,
                item.image
              ),
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "Get New Arrival Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE NEW ARRIVAL
// ============================================================
// PUT /api/newArrivals/:id
// ============================================================

const updateNewArrival = async (req, res) => {
  try {
    const { id } = req.params;

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      deleteUploadedFiles(req);

      return res.status(400).json({
        success: false,
        message: "Invalid New Arrival ID",
      });
    }

    // ========================================================
    // FIND EXISTING
    // ========================================================

    const existing =
      await NewArrival.findById(id);

    if (!existing) {
      deleteUploadedFiles(req);

      return res.status(404).json({
        success: false,
        message: "New Arrival not found",
      });
    }

    const {
      title,
      subtitle,
      description,
      featuredProduct,
      products,
    } = req.body;

    // ========================================================
    // UPDATE BASIC FIELDS
    // ========================================================

    if (
      title !== undefined &&
      !title.trim()
    ) {
      deleteUploadedFiles(req);

      return res.status(400).json({
        success: false,
        message: "Title cannot be empty",
      });
    }

    if (title !== undefined) {
      existing.title = title.trim();
    }

    if (subtitle !== undefined) {
      existing.subtitle =
        subtitle.trim();
    }

    if (description !== undefined) {
      existing.description =
        description.trim();
    }

    // ========================================================
    // FEATURED PRODUCT
    // ========================================================

    if (featuredProduct !== undefined) {
      if (
        featuredProduct !== "" &&
        !mongoose.Types.ObjectId.isValid(
          featuredProduct
        )
      ) {
        deleteUploadedFiles(req);

        return res.status(400).json({
          success: false,
          message: "Invalid featured product ID",
        });
      }

      if (featuredProduct) {
        const productExists =
          await Product.findById(
            featuredProduct
          );

        if (!productExists) {
          deleteUploadedFiles(req);

          return res.status(404).json({
            success: false,
            message: "Featured product not found",
          });
        }

        existing.featuredProduct =
          featuredProduct;
      } else {
        existing.featuredProduct = null;
      }
    }

    // ========================================================
    // PRODUCTS
    // ========================================================

    if (products !== undefined) {
      let parsedProducts;

      try {
        parsedProducts =
          parseProducts(products);
      } catch (error) {
        deleteUploadedFiles(req);

        return res.status(400).json({
          success: false,
          message: "Invalid products JSON format",
          error: error.message,
        });
      }

      const productValidation =
        await validateProducts(
          parsedProducts
        );

      if (!productValidation.valid) {
        deleteUploadedFiles(req);

        return res.status(400).json({
          success: false,
          message:
            productValidation.message,
        });
      }

      const productImages =
        req.files?.productImages || [];

      const oldProducts =
        existing.products || [];

      const finalProducts =
        parsedProducts.map(
          (item, index) => {
            const newImage =
              productImages[index];

            let imagePath = null;

            // ------------------------------------------------
            // NEW IMAGE UPLOADED
            // ------------------------------------------------

            if (newImage) {
              imagePath = path
                .relative(
                  process.cwd(),
                  newImage.path
                )
                .replace(/\\/g, "/");

              // Delete old image for same position
              if (
                oldProducts[index]?.image
              ) {
                deleteLocalFile(
                  oldProducts[index].image
                );
              }
            } else {
              // ------------------------------------------------
              // KEEP OLD IMAGE
              // ------------------------------------------------

              imagePath =
                oldProducts[index]?.image ||
                null;
            }

            return {
              product: item.product,

              displayOrder:
                item.displayOrder !==
                undefined
                  ? Number(
                      item.displayOrder
                    )
                  : index + 1,

              isFeatured:
                item.isFeatured === true,

              image: imagePath,
            };
          }
        );

      existing.products =
        finalProducts;
    }

    // ========================================================
    // HERO IMAGE UPDATE
    // ========================================================

    const newHeroImage =
      req.files?.heroImage?.[0];

    if (newHeroImage) {
      // Delete old hero image
      if (existing.heroImage) {
        deleteLocalFile(
          existing.heroImage
        );
      }

      existing.heroImage = path
        .relative(
          process.cwd(),
          newHeroImage.path
        )
        .replace(/\\/g, "/");
    }

    // ========================================================
    // SAVE
    // ========================================================

    await existing.save();

    // ========================================================
    // POPULATE
    // ========================================================

    const updated =
      await NewArrival.findById(id)
        .populate(
          "featuredProduct",
          "name title slug images"
        )
        .populate(
          "products.product",
          "name title slug images"
        );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "New Arrival updated successfully",

      data: {
        ...updated.toObject(),

        heroImage: getImageUrl(
          req,
          updated.heroImage
        ),

        products:
          updated.products.map(
            (item) => ({
              ...item.toObject(),

              image: getImageUrl(
                req,
                item.image
              ),
            })
          ),
      },
    });
  } catch (error) {
    console.error("==========================================");
    console.error("UPDATE NEW ARRIVAL ERROR");
    console.error(error);
    console.error("==========================================");

    deleteUploadedFiles(req);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "New Arrival validation failed",
        errors: Object.values(
          error.errors
        ).map(
          (err) => err.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// DELETE NEW ARRIVAL
// ============================================================
// DELETE /api/newArrivals/:id
// ============================================================

const deleteNewArrival = async (req, res) => {
  try {
    const { id } = req.params;

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid New Arrival ID",
      });
    }

    // ========================================================
    // FIND
    // ========================================================

    const newArrival =
      await NewArrival.findById(id);

    if (!newArrival) {
      return res.status(404).json({
        success: false,
        message: "New Arrival not found",
      });
    }

    // ========================================================
    // DELETE HERO IMAGE
    // ========================================================

    if (newArrival.heroImage) {
      deleteLocalFile(
        newArrival.heroImage
      );
    }

    // ========================================================
    // DELETE PRODUCT IMAGES
    // ========================================================

    if (newArrival.products) {
      newArrival.products.forEach(
        (item) => {
          if (item.image) {
            deleteLocalFile(
              item.image
            );
          }
        }
      );
    }

    // ========================================================
    // DELETE DOCUMENT
    // ========================================================

    await NewArrival.findByIdAndDelete(id);

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "New Arrival deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete New Arrival Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createNewArrival,
  getAllNewArrivals,
  getNewArrivalById,
  updateNewArrival,
  deleteNewArrival,
};