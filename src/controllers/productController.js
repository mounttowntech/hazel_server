const mongoose = require("mongoose");

const Product = require("../models/productModel");

const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const Length = require("../models/lengthModel");
const NeckPattern = require("../models/neckPatternModel");



// ============================================================
// OBJECT ID VALIDATION
// ============================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


// ============================================================
// CREATE PRODUCT
// ============================================================

exports.createProduct = async (req, res) => {
  try {

    const {
      name,
      slug,
      category,
      brand,
      length,
      neckPattern,
      description,
      status,
      isFeatured,
      isNewArrival,
      isBestSeller,
    } = req.body;


    // ========================================================
    // GET UPLOADED IMAGES
    // ========================================================

    const imagePaths = req.files
      ? req.files.map((file) => {
          return `/uploads/products/${file.filename}`;
        })
      : [];


    // ========================================================
    // REQUIRED VALIDATION
    // ========================================================

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!brand) {
      return res.status(400).json({
        success: false,
        message: "Brand is required",
      });
    }

    if (!length) {
      return res.status(400).json({
        success: false,
        message: "Length is required",
      });
    }

    if (!neckPattern) {
      return res.status(400).json({
        success: false,
        message: "Neck pattern is required",
      });
    }


    // ========================================================
    // OBJECT ID VALIDATION
    // ========================================================

    if (!isValidObjectId(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (!isValidObjectId(brand)) {
      return res.status(400).json({
        success: false,
        message: "Invalid brand ID",
      });
    }

    if (!isValidObjectId(length)) {
      return res.status(400).json({
        success: false,
        message: "Invalid length ID",
      });
    }

    if (!isValidObjectId(neckPattern)) {
      return res.status(400).json({
        success: false,
        message: "Invalid neck pattern ID",
      });
    }


    // ========================================================
    // CHECK CATEGORY
    // ========================================================

    const categoryData =
      await Category.findById(category);

    if (!categoryData) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }


    // ========================================================
    // CHECK BRAND
    // ========================================================

    const brandData =
      await Brand.findById(brand);

    if (!brandData) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }


    // ========================================================
    // CHECK LENGTH
    // ========================================================

    const lengthData =
      await Length.findById(length);

    if (!lengthData) {
      return res.status(404).json({
        success: false,
        message: "Length not found",
      });
    }


    // ========================================================
    // CHECK NECK PATTERN
    // ========================================================

    const neckPatternData =
      await NeckPattern.findById(neckPattern);

    if (!neckPatternData) {
      return res.status(404).json({
        success: false,
        message: "Neck pattern not found",
      });
    }


    // ========================================================
    // GENERATE SLUG
    // ========================================================

    let productSlug;

    if (slug && slug.trim()) {

      productSlug = slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    } else {

      productSlug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }


    // ========================================================
    // CHECK SLUG
    // ========================================================

    if (!productSlug) {
      return res.status(400).json({
        success: false,
        message: "Unable to generate product slug",
      });
    }


    // ========================================================
    // CHECK DUPLICATE SLUG
    // ========================================================

    const existingProduct =
      await Product.findOne({
        slug: productSlug,
      });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message:
          "Product with this slug already exists",
      });
    }


    // ========================================================
    // CREATE PRODUCT
    // ========================================================

    const product =
      await Product.create({

        name: name.trim(),

        slug: productSlug,

        category,

        brand,

        length,

        neckPattern,

        description:
          description?.trim() || "",

        images: imagePaths,

        status:
          status || "draft",

        isFeatured:
          isFeatured === true ||
          isFeatured === "true",

        isNewArrival:
          isNewArrival === true ||
          isNewArrival === "true",

        isBestSeller:
          isBestSeller === true ||
          isBestSeller === "true",

        createdBy:
          req.user?.id ||
          req.user?._id ||
          null,

        updatedBy:
          req.user?.id ||
          req.user?._id ||
          null,
      });


    // ========================================================
    // POPULATE
    // ========================================================

    await product.populate([
      {
        path: "category",
        select: "name slug",
      },
      {
        path: "brand",
        select: "name slug",
      },
      {
        path: "length",
        select: "name code",
      },
      {
        path: "neckPattern",
        select: "name slug",
      },
    ]);


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });


  } catch (error) {

    console.error(
      "Create Product Error:",
      error
    );


    // ========================================================
    // DUPLICATE KEY
    // ========================================================

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Product slug already exists",
      });
    }


    // ========================================================
    // ERROR
    // ========================================================

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};


// ============================================================
// GET ALL PRODUCTS
// ============================================================

exports.getProducts = async (req, res) => {
  try {

    const {
      category,
      brand,
      length,
      neckPattern,
      status,
      isFeatured,
      isNewArrival,
      isBestSeller,
      search,
      page = 1,
      limit = 20,
    } = req.query;


    // ========================================================
    // PAGINATION
    // ========================================================

    const pageNumber =
      Math.max(
        parseInt(page) || 1,
        1
      );

    const limitNumber =
      Math.max(
        parseInt(limit) || 20,
        1
      );

    const skip =
      (pageNumber - 1) *
      limitNumber;


    // ========================================================
    // FILTER
    // ========================================================

    const filter = {};


    // ========================================================
    // CATEGORY
    // ========================================================

    if (category) {

      if (!isValidObjectId(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      filter.category = category;
    }


    // ========================================================
    // BRAND
    // ========================================================

    if (brand) {

      if (!isValidObjectId(brand)) {
        return res.status(400).json({
          success: false,
          message: "Invalid brand ID",
        });
      }

      filter.brand = brand;
    }


    // ========================================================
    // LENGTH
    // ========================================================

    if (length) {

      if (!isValidObjectId(length)) {
        return res.status(400).json({
          success: false,
          message: "Invalid length ID",
        });
      }

      filter.length = length;
    }


    // ========================================================
    // NECK PATTERN
    // ========================================================

    if (neckPattern) {

      if (!isValidObjectId(neckPattern)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid neck pattern ID",
        });
      }

      filter.neckPattern =
        neckPattern;
    }


    // ========================================================
    // STATUS
    // ========================================================

    if (status) {
      filter.status = status;
    }


    // ========================================================
    // BOOLEAN FILTERS
    // ========================================================

    if (isFeatured !== undefined) {

      filter.isFeatured =
        isFeatured === "true";
    }

    if (isNewArrival !== undefined) {

      filter.isNewArrival =
        isNewArrival === "true";
    }

    if (isBestSeller !== undefined) {

      filter.isBestSeller =
        isBestSeller === "true";
    }


    // ========================================================
    // SEARCH
    // ========================================================

    if (search && search.trim()) {

      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }


    // ========================================================
    // GET PRODUCTS
    // ========================================================

    const [
      products,
      totalProducts,
    ] = await Promise.all([

      Product.find(filter)

        .populate(
          "category",
          "name slug"
        )

        .populate(
          "brand",
          "name slug"
        )

        .populate(
          "length",
          "name code"
        )

        .populate(
          "neckPattern",
          "name slug"
        )

        .populate(
          "createdBy",
          "name email"
        )

        .populate(
          "updatedBy",
          "name email"
        )

        .sort({
          createdAt: -1,
        })

        .skip(skip)

        .limit(limitNumber)

        .lean(),

      Product.countDocuments(filter),
    ]);


    // ========================================================
    // PAGINATION
    // ========================================================

    const totalPages =
      Math.ceil(
        totalProducts /
          limitNumber
      );


    return res.status(200).json({
      success: true,
      message:
        "Products fetched successfully",

      data: products,

      pagination: {
        currentPage:
          pageNumber,

        totalPages,

        totalProducts,

        limit:
          limitNumber,

        hasNextPage:
          pageNumber <
          totalPages,

        hasPreviousPage:
          pageNumber > 1,
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
// ============================================================

exports.getProductById = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


    // ========================================================
    // ID VALIDATION
    // ========================================================

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }


    // ========================================================
    // FIND PRODUCT
    // ========================================================

    const product =
      await Product.findById(id)

        .populate(
          "category",
          "name slug"
        )

        .populate(
          "brand",
          "name slug"
        )

        .populate(
          "length",
          "name code"
        )

        .populate(
          "neckPattern",
          "name slug"
        )

        .populate(
          "createdBy",
          "name email"
        )

        .populate(
          "updatedBy",
          "name email"
        );


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
      "Get Product By ID Error:",
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
// ============================================================

exports.updateProduct = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


    // ========================================================
    // ID VALIDATION
    // ========================================================

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }


    // ========================================================
    // FIND PRODUCT
    // ========================================================

    const product =
      await Product.findById(id);


    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }


    const {
      name,
      slug,
      category,
      brand,
      length,
      neckPattern,
      description,
      status,
      isFeatured,
      isNewArrival,
      isBestSeller,
    } = req.body;


    // ========================================================
    // NAME
    // ========================================================

    if (name !== undefined) {

      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Product name cannot be empty",
        });
      }

      product.name =
        name.trim();
    }


    // ========================================================
    // CATEGORY
    // ========================================================

    if (category !== undefined) {

      if (!isValidObjectId(category)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid category ID",
        });
      }


      const categoryData =
        await Category.findById(
          category
        );

      if (!categoryData) {
        return res.status(404).json({
          success: false,
          message:
            "Category not found",
        });
      }


      product.category =
        category;
    }


    // ========================================================
    // BRAND
    // ========================================================

    if (brand !== undefined) {

      if (!isValidObjectId(brand)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid brand ID",
        });
      }


      const brandData =
        await Brand.findById(
          brand
        );

      if (!brandData) {
        return res.status(404).json({
          success: false,
          message:
            "Brand not found",
        });
      }


      product.brand =
        brand;
    }


    // ========================================================
    // LENGTH
    // ========================================================

    if (length !== undefined) {

      if (!isValidObjectId(length)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid length ID",
        });
      }


      const lengthData =
        await Length.findById(
          length
        );

      if (!lengthData) {
        return res.status(404).json({
          success: false,
          message:
            "Length not found",
        });
      }


      product.length =
        length;
    }


    // ========================================================
    // NECK PATTERN
    // ========================================================

    if (neckPattern !== undefined) {

      if (!isValidObjectId(neckPattern)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid neck pattern ID",
        });
      }


      const neckPatternData =
        await NeckPattern.findById(
          neckPattern
        );

      if (!neckPatternData) {
        return res.status(404).json({
          success: false,
          message:
            "Neck pattern not found",
        });
      }


      product.neckPattern =
        neckPattern;
    }


    // ========================================================
    // SLUG
    // ========================================================

    if (slug !== undefined) {

      if (!slug.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Slug cannot be empty",
        });
      }


      const productSlug =
        slug
          .trim()
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          );


      const existingProduct =
        await Product.findOne({
          slug: productSlug,

          _id: {
            $ne: id,
          },
        });


      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message:
            "Product with this slug already exists",
        });
      }


      product.slug =
        productSlug;
    }


    // ========================================================
    // DESCRIPTION
    // ========================================================

    if (description !== undefined) {

      product.description =
        description.trim();
    }


    // ========================================================
    // STATUS
    // ========================================================

    if (status !== undefined) {

      const allowedStatuses = [
        "draft",
        "active",
        "inactive",
      ];


      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product status",
        });
      }


      product.status =
        status;
    }


    // ========================================================
    // BOOLEAN VALUES
    // ========================================================

    if (isFeatured !== undefined) {

      product.isFeatured =
        isFeatured === true ||
        isFeatured === "true";
    }


    if (isNewArrival !== undefined) {

      product.isNewArrival =
        isNewArrival === true ||
        isNewArrival === "true";
    }


    if (isBestSeller !== undefined) {

      product.isBestSeller =
        isBestSeller === true ||
        isBestSeller === "true";
    }


    // ========================================================
    // UPDATE IMAGES
    // ========================================================

    if (
      req.files &&
      req.files.length > 0
    ) {

      const newImages =
        req.files.map(
          (file) => {
            return `/uploads/products/${file.filename}`;
          }
        );


      // Replace existing images
      product.images =
        newImages;
    }


    // ========================================================
    // AUDIT
    // ========================================================

    product.updatedBy =
      req.user?.id ||
      req.user?._id ||
      null;


    // ========================================================
    // SAVE
    // ========================================================

    await product.save();


    // ========================================================
    // POPULATE
    // ========================================================

    await product.populate([
      {
        path: "category",
        select: "name slug",
      },
      {
        path: "brand",
        select: "name slug",
      },
      {
        path: "length",
        select: "name code",
      },
      {
        path: "neckPattern",
        select: "name slug",
      },
    ]);


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


    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Product slug already exists",
      });
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
// SOFT DELETE
// ============================================================

exports.deleteProduct = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


    // ========================================================
    // ID VALIDATION
    // ========================================================

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }


    // ========================================================
    // FIND PRODUCT
    // ========================================================

    const product =
      await Product.findById(id);


    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }


    // ========================================================
    // SOFT DELETE
    // ========================================================

    product.status =
      "inactive";

    product.updatedBy =
      req.user?.id ||
      req.user?._id ||
      null;


    await product.save();


    return res.status(200).json({
      success: true,
      message:
        "Product deactivated successfully",
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
// RESTORE PRODUCT
// ============================================================

exports.restoreProduct = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }


    const product =
      await Product.findById(id);


    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }


    product.status =
      "active";

    product.updatedBy =
      req.user?.id ||
      req.user?._id ||
      null;


    await product.save();


    return res.status(200).json({
      success: true,
      message:
        "Product restored successfully",
      data: product,
    });


  } catch (error) {

    console.error(
      "Restore Product Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to restore product",
      error: error.message,
    });
  }
};