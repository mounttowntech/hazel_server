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

// ==========================================================
// CREATE DIRECTORIES IF NOT EXISTS
// ==========================================================

[
  categoryUploadDir,
  subCategoryUploadDir,
  productUploadDir,
  newArrivalUploadDir,
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
  const extension = path.extname(file.originalname);

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

  console.log("==========================================");
  console.log("IMAGE UPLOAD");
  console.log("Field name :", file.fieldname);
  console.log("File name  :", file.originalname);
  console.log("Extension  :", extension);
  console.log("MIME type  :", file.mimetype);
  console.log("==========================================");

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
    storage: subCategoryStorage,

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
    storage: productStorage,

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
// Maximum 4 images
//
// All files must use:
// productImages
//
// Example:
//
// productImages -> image1.png
// productImages -> image2.png
// productImages -> image3.png
// productImages -> image4.png
//
// ==========================================================

const uploadNewArrivalImage =
  multer({
    storage: newArrivalStorage,

    fileFilter:
      imageFileFilter,

    limits: {
      ...imageUploadLimits,

      // Maximum 4 images
      files: 4,
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
  if (err instanceof multer.MulterError) {
    if (
      err.code ===
      "LIMIT_FILE_COUNT"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum 4 images are allowed for New Arrival",
      });
    }

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

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
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
  handleUploadError,
};