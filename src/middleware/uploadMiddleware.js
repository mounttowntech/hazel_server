const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================================
// CREATE UPLOAD DIRECTORIES
// ==========================================================

const categoryUploadDir = path.join(
  process.cwd(),
  "uploads/categories"
);

const subCategoryUploadDir = path.join(
  process.cwd(),
  "uploads/subcategories"
);

const productUploadDir = path.join(
  process.cwd(),
  "uploads/products"
);

const newArrivalUploadDir = path.join(
  process.cwd(),
  "uploads/new-arrivals"
);

const trendingProductUploadDir = path.join(
  process.cwd(),
  "uploads/trending-products"
);

// ==========================================================
// CREATE DIRECTORIES IF NOT EXISTS
// ==========================================================

[
  categoryUploadDir,
  subCategoryUploadDir,
  productUploadDir,
  newArrivalUploadDir,
  trendingProductUploadDir,
].forEach((directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }
});

// ==========================================================
// GENERATE UNIQUE FILE NAME
// ==========================================================

const generateFileName = (file) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const uniqueName =
    `${Date.now()}-` +
    `${Math.round(Math.random() * 1e9)}` +
    extension;

  return uniqueName;
};

// ==========================================================
// IMAGE FILE FILTER
// ==========================================================

const imageFileFilter = (req, file, cb) => {
  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  console.log(
    "=========================================="
  );

  console.log("IMAGE UPLOAD");
  console.log("Field name :", file.fieldname);
  console.log("File name  :", file.originalname);
  console.log("Extension  :", extension);
  console.log("MIME type  :", file.mimetype);

  console.log(
    "=========================================="
  );

  if (!allowedExtensions.includes(extension)) {
    return cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      ),
      false
    );
  }

  cb(null, true);
};

// ==========================================================
// PRODUCT MEDIA FILE FILTER
// ==========================================================

const productMediaFileFilter = (
  req,
  file,
  cb
) => {
  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".mp4",
    ".webm",
    ".mov",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return cb(
      new Error(
        "Only JPG, JPEG, PNG, WEBP images and MP4, WEBM, MOV videos are allowed"
      ),
      false
    );
  }

  cb(null, true);
};

// ==========================================================
// STORAGE - CATEGORY
// ==========================================================

const categoryStorage =
  multer.diskStorage({
    destination: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        categoryUploadDir
      );
    },

    filename: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        generateFileName(file)
      );
    },
  });

// ==========================================================
// STORAGE - SUB CATEGORY
// ==========================================================

const subCategoryStorage =
  multer.diskStorage({
    destination: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        subCategoryUploadDir
      );
    },

    filename: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        generateFileName(file)
      );
    },
  });

// ==========================================================
// STORAGE - PRODUCT
// ==========================================================

const productStorage =
  multer.diskStorage({
    destination: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        productUploadDir
      );
    },

    filename: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        generateFileName(file)
      );
    },
  });

// ==========================================================
// STORAGE - NEW ARRIVAL
// ==========================================================

const newArrivalStorage =
  multer.diskStorage({
    destination: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        newArrivalUploadDir
      );
    },

    filename: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        generateFileName(file)
      );
    },
  });

// ==========================================================
// STORAGE - TRENDING PRODUCT
// ==========================================================

const trendingProductStorage =
  multer.diskStorage({
    destination: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        trendingProductUploadDir
      );
    },

    filename: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        generateFileName(file)
      );
    },
  });

// ==========================================================
// UPLOAD LIMITS
// ==========================================================

const imageUploadLimits = {
  fileSize: 5 * 1024 * 1024,
};

const productMediaUploadLimits = {
  fileSize: 100 * 1024 * 1024,
};

// ==========================================================
// CATEGORY UPLOAD
// ==========================================================

const uploadCategoryImage =
  multer({
    storage: categoryStorage,

    fileFilter:
      imageFileFilter,

    limits: {
      ...imageUploadLimits,

      files: 1,
    },
  });

// ==========================================================
// SUB CATEGORY UPLOAD
// ==========================================================

const uploadSubCategoryImage =
  multer({
    storage:
      subCategoryStorage,

    fileFilter:
      imageFileFilter,

    limits: {
      ...imageUploadLimits,

      files: 1,
    },
  });

// ==========================================================
// PRODUCT MEDIA UPLOAD
// ==========================================================

const uploadProductMedia =
  multer({
    storage:
      productStorage,

    fileFilter:
      productMediaFileFilter,

    limits: {
      ...productMediaUploadLimits,

      files: 10,
    },
  });

// ==========================================================
// NEW ARRIVAL IMAGE UPLOAD
// ==========================================================
//
// Dynamic number of products is handled by the controller.
//
// This allows maximum 4 images for New Arrival.
//
// Field name:
//
// productImages
//
// ==========================================================

const uploadNewArrivalImage =
  multer({
    storage:
      newArrivalStorage,

    fileFilter:
      imageFileFilter,

    limits: {
      ...imageUploadLimits,

      files: 4,
    },
  });

// ==========================================================
// TRENDING PRODUCT IMAGE UPLOAD
// ==========================================================
//
// Trending Products are dynamic.
//
// There is NO 5-product restriction.
//
// Multer allows maximum 50 images in ONE request
// as a technical upload safety limit.
//
// Field name:
//
// productImages
//
// Example:
//
// productImages -> image1.png
// productImages -> image2.png
// productImages -> image3.png
// ...
//
// ==========================================================

const uploadTrendingProductImage =
  multer({
    storage:
      trendingProductStorage,

    fileFilter:
      imageFileFilter,

    limits: {
      ...imageUploadLimits,

      // Technical upload limit
      files: 50,
    },
  });

// ==========================================================
// MULTER ERROR HANDLER
// ==========================================================

const handleUploadError = (
  err,
  req,
  res,
  next
) => {
  if (
    err instanceof
    multer.MulterError
  ) {
    // ------------------------------------------------------
    // TOO MANY FILES
    // ------------------------------------------------------

    if (
      err.code ===
      "LIMIT_FILE_COUNT"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Maximum 50 images are allowed in one upload request",
      });
    }

    // ------------------------------------------------------
    // FILE TOO LARGE
    // ------------------------------------------------------

    if (
      err.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Image size cannot exceed 5 MB",
      });
    }

    // ------------------------------------------------------
    // UNEXPECTED FILE
    // ------------------------------------------------------

    if (
      err.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.status(400).json({
        success: false,

        message:
          `Unexpected file field: ${err.field}`,
      });
    }

    // ------------------------------------------------------
    // OTHER MULTER ERROR
    // ------------------------------------------------------

    return res.status(400).json({
      success: false,

      message:
        err.message,
    });
  }

  // ========================================================
  // NORMAL ERROR
  // ========================================================

  if (err) {
    return res.status(400).json({
      success: false,

      message:
        err.message,
    });
  }

  next();
};

// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {
  uploadCategoryImage,
  uploadSubCategoryImage,
  uploadProductMedia,
  uploadNewArrivalImage,
  uploadTrendingProductImage,
  handleUploadError,
};