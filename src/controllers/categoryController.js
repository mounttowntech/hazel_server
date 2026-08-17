const Category = require("../models/categoryModel");
const generateSlug = require("../utils/generateSlug");
const fs = require("fs");
const path = require("path");


// HELPER - GET USER ID


const getUserId = (req) => {
  return req.user?.id || req.user?._id || null;
};


// HELPER - DELETE LOCAL IMAGE
const deleteImage = (imageUrl) => {
  try {
    if (!imageUrl) return;

    let imagePath = imageUrl;

    // Remove domain if full URL
    if (imageUrl.startsWith("http")) {
      const url = new URL(imageUrl);
      imagePath = url.pathname;
    }

    imagePath = imagePath.replace(/^\/+/, "");

    const fullPath = path.join(process.cwd(), imagePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error("Image delete error:", error.message);
  }
};


// HELPER - CREATE UNIQUE SLUG


const createUniqueSlug = async (name, excludeId = null) => {
  const baseSlug = generateSlug(name);

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = {
      slug,
    };

    if (excludeId) {
      query._id = {
        $ne: excludeId,
      };
    }

    const existingCategory = await Category.findOne(query);

    if (!existingCategory) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};


// CREATE CATEGORY


exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      description = "",
      displayOrder = 0,
      status = "active",
    } = req.body;

    // ------------------------------------------------------
    // VALIDATION
    // ------------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // ------------------------------------------------------
    // CHECK DUPLICATE NAME
    // ------------------------------------------------------

    const existingCategory = await Category.findOne({
      name: {
        $regex: `^${name.trim()}$`,
        $options: "i",
      },
      isDeleted: false,
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // ------------------------------------------------------
    // GENERATE SLUG
    // ------------------------------------------------------

    const slug = await createUniqueSlug(name);

    // ------------------------------------------------------
    // IMAGE
    // ------------------------------------------------------

    let image = "";

    if (req.file) {
      image = `/uploads/categories/${req.file.filename}`;
    }

    // ------------------------------------------------------
    // CREATE
    // ------------------------------------------------------

    const category = await Category.create({
      name: name.trim(),
      slug,
      description,
      displayOrder: Number(displayOrder) || 0,
      status,
      image,
      createdBy: getUserId(req),
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    // Duplicate key
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};


// GET ALL CATEGORIES


exports.getCategories = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      status,
      includeDeleted = "false",
      sortBy = "displayOrder",
      sortOrder = "asc",
    } = req.query;

    page = Math.max(Number(page), 1);
    limit = Math.min(Math.max(Number(limit), 1), 100);

    const skip = (page - 1) * limit;

    // ------------------------------------------------------
    // FILTER
    // ------------------------------------------------------

    const filter = {};

    if (includeDeleted !== "true") {
      filter.isDeleted = false;
    }

    // ------------------------------------------------------
    // STATUS
    // ------------------------------------------------------

    if (status) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      filter.status = status;
    }

    // ------------------------------------------------------
    // SEARCH
    // ------------------------------------------------------

    if (search.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          slug: {
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

    // ------------------------------------------------------
    // SORT
    // ------------------------------------------------------

    const allowedSortFields = [
      "name",
      "slug",
      "displayOrder",
      "status",
      "createdAt",
      "updatedAt",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "displayOrder";
    }

    const sort = {
      [sortBy]: sortOrder === "desc" ? -1 : 1,
    };

    // ------------------------------------------------------
    // QUERY
    // ------------------------------------------------------

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .populate("deletedBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Category.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",

      data: categories,

      pagination: {
        currentPage: page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};


// GET SINGLE CATEGORY


exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};


// GET CATEGORY BY SLUG


exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({
      slug: slug.toLowerCase(),
      isDeleted: false,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category by slug error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};


// UPDATE CATEGORY


exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      displayOrder,
      status,
    } = req.body;

    // ------------------------------------------------------
    // FIND CATEGORY
    // ------------------------------------------------------

    const category = await Category.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // ------------------------------------------------------
    // NAME
    // ------------------------------------------------------

    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty",
        });
      }

      const duplicate = await Category.findOne({
        name: {
          $regex: `^${trimmedName}$`,
          $options: "i",
        },
        isDeleted: false,
        _id: {
          $ne: id,
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Another category with this name already exists",
        });
      }

      category.name = trimmedName;

      // Automatically regenerate slug
      category.slug = await createUniqueSlug(
        trimmedName,
        id
      );
    }

    // ------------------------------------------------------
    // DESCRIPTION
    // ------------------------------------------------------

    if (description !== undefined) {
      category.description = description;
    }

    // ------------------------------------------------------
    // DISPLAY ORDER
    // ------------------------------------------------------

    if (displayOrder !== undefined) {
      category.displayOrder =
        Number(displayOrder) || 0;
    }

    // ------------------------------------------------------
    // STATUS
    // ------------------------------------------------------

    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      category.status = status;
    }

    // ------------------------------------------------------
    // IMAGE
    // ------------------------------------------------------

    if (req.file) {
      const oldImage = category.image;

      category.image =
        `/uploads/categories/${req.file.filename}`;

      // Delete old image
      if (oldImage) {
        deleteImage(oldImage);
      }
    }

    // ------------------------------------------------------
    // AUDIT
    // ------------------------------------------------------

    category.updatedBy = getUserId(req);

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update category error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};


// SOFT DELETE CATEGORY


// exports.deleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const category = await Category.findOne({
//       _id: id,
//       isDeleted: false,
//     });

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     category.isDeleted = true;
//     category.deletedAt = new Date();
//     category.deletedBy = getUserId(req);

//     await category.save();

//     return res.status(200).json({
//       success: true,
//       message: "Category deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete category error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete category",
//       error: error.message,
//     });
//   }
// };

// ==========================================================
// RESTORE CATEGORY
// ==========================================================

// exports.restoreCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const category = await Category.findOne({
//       _id: id,
//       isDeleted: true,
//     });

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Deleted category not found",
//       });
//     }

//     category.isDeleted = false;
//     category.deletedAt = null;
//     category.deletedBy = null;
//     category.updatedBy = getUserId(req);

//     await category.save();

//     return res.status(200).json({
//       success: true,
//       message: "Category restored successfully",
//       data: category,
//     });
//   } catch (error) {
//     console.error("Restore category error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to restore category",
//       error: error.message,
//     });
//   }
// };

// ==========================================================
// PERMANENT DELETE
// ==========================================================

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      _id: id,
      isDeleted: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Deleted category not found. Only soft-deleted categories can be permanently deleted.",
      });
    }

    // Delete image
    if (category.image) {
      deleteImage(category.image);
    }

    await Category.deleteOne({
      _id: id,
    });

    return res.status(200).json({
      success: true,
      message: "Category permanently deleted",
    });
  } catch (error) {
    console.error(
      "Permanent delete category error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to permanently delete category",
      error: error.message,
    });
  }
};